import { getAddress, isAddress, type Abi } from "viem";
import type { NetworkConfig } from "@/types";
import { parseAbiInput } from "./abi";
import { getPublicClient, isHttpUrl } from "./chain";

export type ExplorerAdapterKind =
  "etherscan-v2" | "etherscan-compatible" | "blockscout-v2" | "blockscout-universal";

export type DetectAbiResult =
  | { kind: "success"; abi: Abi; warnings: string[] }
  | { kind: "not-found"; message: string; detail?: string }
  | { kind: "error"; message: string; detail?: string };

const ABI_NOT_FOUND =
  "Không tìm thấy ABI. Contract có thể chưa được xác minh trên Explorer đã chọn.";

function safeHttpUrl(value: string | undefined): URL | null {
  if (!value || !isHttpUrl(value)) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.hash) return null;
    return url;
  } catch {
    return null;
  }
}

/** Convert a public Explorer page, API docs page, or API base URL into an ABI API endpoint. */
export function normalizeExplorerApiUrl(value: string | undefined): string | null {
  const url = safeHttpUrl(value);
  if (!url) return null;

  let path = url.pathname.replace(/\/+$/, "");
  path = path.replace(/\/(?:api-docs|swagger(?:\/index\.html)?|openapi\.json)$/i, "");

  if (/\/(?:api\/v2|v2\/api|api)$/.test(path)) return url.toString();

  if (url.hostname === "etherscan.io" || url.hostname.endsWith(".etherscan.io")) {
    url.hostname = "api.etherscan.io";
    url.pathname = "/v2/api";
    return url.toString();
  }

  const isBlockscout = url.hostname.includes("blockscout");
  url.pathname = `${path}${isBlockscout ? "/api/v2" : "/api"}`;
  return url.toString();
}

export function getExplorerAdapterKind(apiUrl: string | undefined): ExplorerAdapterKind | null {
  const normalizedUrl = normalizeExplorerApiUrl(apiUrl);
  const url = safeHttpUrl(normalizedUrl ?? undefined);
  if (!url) return null;
  const path = url.pathname.replace(/\/+$/, "");
  if (path.endsWith("/api/v2")) return "blockscout-v2";
  if (path.endsWith("/v2/api") && url.hostname === "api.blockscout.com")
    return "blockscout-universal";
  if (path.endsWith("/v2/api")) return "etherscan-v2";
  if (path.endsWith("/api")) return "etherscan-compatible";
  return null;
}

export function resolveExplorerApiUrl(network: NetworkConfig): string | null {
  return normalizeExplorerApiUrl(network.explorerApiUrl?.trim() || network.explorerUrl);
}

export function canAutoDetectAbi(network: NetworkConfig | undefined, address: string): boolean {
  if (!network || !isAddress(address.trim(), { strict: false })) return false;
  if (!Number.isSafeInteger(network.chainId) || network.chainId <= 0) return false;
  if (!safeHttpUrl(network.rpcUrl)) return false;
  return getExplorerAdapterKind(resolveExplorerApiUrl(network) ?? undefined) !== null;
}

function failure(message: string, detail?: string): DetectAbiResult {
  return detail ? { kind: "error", message, detail } : { kind: "error", message };
}

function notFound(detail?: string): DetectAbiResult {
  return detail
    ? { kind: "not-found", message: ABI_NOT_FOUND, detail }
    : { kind: "not-found", message: ABI_NOT_FOUND };
}

function classifyExplorerError(status: string, message: string, result: string): DetectAbiResult {
  const text = `${message} ${result}`.toLowerCase();
  if (/not verified|unverified|not found|no abi|source code not verified/.test(text))
    return notFound("Explorer reports no verified ABI for this address.");
  if (/rate limit|too many requests|rate-limit/.test(text))
    return failure(
      "Explorer API đã đạt giới hạn truy vấn. Hãy thử lại sau.",
      `Explorer API status: ${status}`,
    );
  if (
    /invalid api.?key|missing api.?key|api.?key.*(invalid|required|missing)|unauthorized/.test(text)
  )
    return failure(
      "Explorer API key không hợp lệ hoặc bị thiếu.",
      `Explorer API status: ${status}`,
    );
  return failure("Explorer trả về phản hồi không hợp lệ.", `Explorer API status: ${status}`);
}

async function readResponse(response: Response): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function abiFromValue(value: unknown): DetectAbiResult {
  if (typeof value !== "string" && !Array.isArray(value)) return notFound();
  const parsed = parseAbiInput(typeof value === "string" ? value : JSON.stringify(value));
  if (!parsed.ok) return failure("Explorer trả về ABI không hợp lệ.", parsed.error);
  return { kind: "success", abi: parsed.abi, warnings: parsed.warnings };
}

function explorerRequest(network: NetworkConfig, address: string, adapter: ExplorerAdapterKind) {
  const baseUrl = safeHttpUrl(resolveExplorerApiUrl(network) ?? undefined);
  if (!baseUrl) return null;
  const apiKey = network.explorerApiKey?.trim() ?? "";
  const headers = new Headers({ Accept: "application/json" });

  if (adapter === "blockscout-v2") {
    baseUrl.pathname = `${baseUrl.pathname.replace(/\/+$/, "")}/smart-contracts/${encodeURIComponent(address)}`;
    if (apiKey) headers.set("apikey", apiKey);
  } else {
    const params = baseUrl.searchParams;
    if (adapter === "etherscan-v2") params.set("chainid", String(network.chainId));
    if (adapter === "blockscout-universal") {
      params.set("chain_id", String(network.chainId));
      if (apiKey) headers.set("Authorization", `Bearer ${apiKey}`);
    } else {
      if (apiKey) params.set("apikey", apiKey);
    }
    params.set("module", "contract");
    params.set("action", "getabi");
    params.set("address", address);
  }

  return { url: baseUrl.toString(), headers };
}

async function fetchExplorerAbi(
  network: NetworkConfig,
  address: string,
  adapter: ExplorerAdapterKind,
  signal?: AbortSignal,
): Promise<DetectAbiResult> {
  const request = explorerRequest(network, address, adapter);
  if (!request) return failure("Explorer API không được hỗ trợ.");

  let response: Response;
  try {
    response = await fetch(request.url, {
      method: "GET",
      headers: request.headers,
      ...(signal ? { signal } : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError")
      return failure("Đã hết thời gian chờ Explorer API.");
    return failure(
      "Không thể kết nối Explorer API trong trình duyệt. Hãy kiểm tra CORS và URL API.",
    );
  }

  if (response.status === 429)
    return failure("Explorer API đã đạt giới hạn truy vấn. Hãy thử lại sau.", "HTTP 429");
  if ([401, 402, 403].includes(response.status))
    return failure("Explorer API key không hợp lệ hoặc bị thiếu.", `HTTP ${response.status}`);
  if (response.status === 404) return notFound("HTTP 404");
  if (!response.ok) return failure("Explorer API hiện không khả dụng.", `HTTP ${response.status}`);

  const payload = await readResponse(response);
  const record = asRecord(payload);
  if (!record)
    return failure("Explorer trả về phản hồi không hợp lệ.", "Response was not a JSON object.");

  if (adapter === "blockscout-v2") {
    if (record["is_verified"] === false || record["abi"] === null || record["abi"] === undefined)
      return notFound();
    return abiFromValue(record["abi"]);
  }

  const status = String(record["status"] ?? "");
  if (status !== "1")
    return classifyExplorerError(
      status || "unknown",
      String(record["message"] ?? ""),
      String(record["result"] ?? ""),
    );
  return abiFromValue(record["result"]);
}

export async function detectContractAbi(
  network: NetworkConfig,
  address: string,
  signal?: AbortSignal,
): Promise<DetectAbiResult> {
  if (!isAddress(address.trim(), { strict: false }))
    return failure("Địa chỉ contract không hợp lệ.");
  if (
    !Number.isSafeInteger(network.chainId) ||
    network.chainId <= 0 ||
    !safeHttpUrl(network.rpcUrl)
  )
    return failure("Hãy kiểm tra RPC URL và Chain ID của network.");
  if (!safeHttpUrl(network.rpcUrl) || !resolveExplorerApiUrl(network))
    return failure("Hãy cấu hình RPC URL và Explorer URL hoặc Explorer API URL để dò ABI.");

  const adapter = getExplorerAdapterKind(resolveExplorerApiUrl(network) ?? undefined);
  if (!adapter) return failure("Explorer API không được hỗ trợ.");

  let bytecode: string | undefined;
  try {
    const client = getPublicClient(network);
    const actualChainId = await client.getChainId();
    if (actualChainId !== network.chainId) {
      return failure(
        "RPC trả về Chain ID khác với network đã chọn.",
        `Expected ${network.chainId}; received ${actualChainId}.`,
      );
    }
    bytecode = await client.getBytecode({ address: getAddress(address.trim()) });
  } catch {
    return failure("Không thể kết nối RPC của network đã chọn.");
  }
  if (!bytecode || bytecode === "0x")
    return failure("Không tìm thấy bytecode tại địa chỉ này trên network đã chọn.");

  return fetchExplorerAbi(network, getAddress(address.trim()), adapter, signal);
}
