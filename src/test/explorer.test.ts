import { afterEach, describe, expect, it, vi } from "vitest";
import type { NetworkConfig } from "@/types";

const { getChainId, getBytecode } = vi.hoisted(() => ({
  getChainId: vi.fn<() => Promise<number>>(),
  getBytecode: vi.fn<() => Promise<`0x${string}` | undefined>>(),
}));

vi.mock("@/lib/chain", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/chain")>()),
  getPublicClient: () => ({ getChainId, getBytecode }),
}));

import {
  canAutoDetectAbi,
  detectContractAbi,
  getExplorerAdapterKind,
  normalizeExplorerApiUrl,
} from "@/lib/explorer";

const network: NetworkConfig = {
  id: "sepolia",
  name: "Sepolia",
  chainId: 11155111,
  rpcUrl: "https://rpc.example/",
  currencyName: "Ether",
  currencySymbol: "ETH",
  currencyDecimals: 18,
  explorerUrl: "https://sepolia.etherscan.io",
  explorerApiUrl: "https://api.etherscan.io/v2/api",
  explorerApiKey: "test-key",
  color: "#000000",
};

const address = "0x0000000000000000000000000000000000000001";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("Explorer ABI detection", () => {
  it("offers detection with valid network and Explorer settings even without an API key", () => {
    expect(canAutoDetectAbi(network, address)).toBe(true);
    expect(canAutoDetectAbi({ ...network, explorerApiKey: "" }, address)).toBe(true);
    expect(canAutoDetectAbi({ ...network, rpcUrl: "not a URL" }, address)).toBe(false);
    expect(canAutoDetectAbi(network, "not an address")).toBe(false);
  });

  it("normalizes common Explorer and API docs URLs", () => {
    expect(normalizeExplorerApiUrl("https://explorer-test.qday.info")).toBe(
      "https://explorer-test.qday.info/api",
    );
    expect(normalizeExplorerApiUrl("https://explorer-test.qday.info/api-docs")).toBe(
      "https://explorer-test.qday.info/api",
    );
    expect(normalizeExplorerApiUrl("https://eth.blockscout.com")).toBe(
      "https://eth.blockscout.com/api/v2",
    );
    expect(normalizeExplorerApiUrl("https://etherscan.io")).toBe("https://api.etherscan.io/v2/api");
  });

  it("uses the selected chain and address, checks deployed code, and validates the returned ABI", async () => {
    getChainId.mockResolvedValue(11155111);
    getBytecode.mockResolvedValue("0x6000");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "1",
          message: "OK",
          result: JSON.stringify([
            {
              type: "function",
              name: "balanceOf",
              inputs: [],
              outputs: [],
              stateMutability: "view",
            },
          ]),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await detectContractAbi(network, address);

    expect(result.kind).toBe("success");
    if (result.kind !== "success") throw new Error("Expected a validated ABI");
    expect(result.abi.filter((item) => item.type === "function")).toHaveLength(1);
    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.searchParams.get("chainid")).toBe("11155111");
    expect(requestUrl.searchParams.get("address")).toBe(address);
    expect(requestUrl.searchParams.get("action")).toBe("getabi");
    expect(requestUrl.searchParams.get("apikey")).toBe("test-key");
    expect(getBytecode).toHaveBeenCalledOnce();
  });

  it("omits the API key parameter when no key is configured", async () => {
    getChainId.mockResolvedValue(11155111);
    getBytecode.mockResolvedValue("0x6000");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "1",
          message: "OK",
          result: JSON.stringify([
            { type: "function", name: "balanceOf", inputs: [], outputs: [] },
          ]),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { explorerApiKey: _apiKey, ...networkWithoutKey } = network;
    const result = await detectContractAbi(networkWithoutKey, address);

    expect(result.kind).toBe("success");
    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.searchParams.has("apikey")).toBe(false);
  });

  it("reports an unverified contract without treating the response as ABI", async () => {
    getChainId.mockResolvedValue(11155111);
    getBytecode.mockResolvedValue("0x6000");
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: "0",
            message: "NOTOK",
            result: "Contract source code not verified",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const result = await detectContractAbi(network, address);

    expect(result.kind).toBe("not-found");
    if (result.kind !== "not-found") throw new Error("Expected an unverified ABI result");
    expect(result.message).toBe(
      "Không tìm thấy ABI. Contract có thể chưa được xác minh trên Explorer đã chọn.",
    );
  });

  it("identifies normalized Etherscan and Blockscout endpoints", () => {
    expect(getExplorerAdapterKind("https://api.etherscan.io/v2/api")).toBe("etherscan-v2");
    expect(getExplorerAdapterKind("https://eth.blockscout.com/api/v2")).toBe("blockscout-v2");
    expect(getExplorerAdapterKind("https://eth.blockscout.com")).toBe("blockscout-v2");
    expect(getExplorerAdapterKind("https://example.com")).toBe("etherscan-compatible");
  });
});
