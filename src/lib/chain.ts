import { createPublicClient, defineChain, http, type Chain, type PublicClient } from "viem";
import type { NetworkConfig } from "@/types";
import { describeError } from "./errors";

export interface NetworkDraft {
  name: string;
  chainId: string;
  rpcUrl: string;
  currencyName: string;
  currencySymbol: string;
  currencyDecimals: string;
  explorerUrl: string;
  explorerApiUrl: string;
  explorerApiKey: string;
  color: string;
}

export function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateNetworkDraft(d: NetworkDraft): Partial<Record<keyof NetworkDraft, string>> {
  const e: Partial<Record<keyof NetworkDraft, string>> = {};
  if (!d.name.trim()) e.name = "Bắt buộc";
  if (!/^\d+$/.test(d.chainId.trim())) e.chainId = "Chain ID phải là số nguyên dương";
  else {
    const n = Number(d.chainId);
    if (n <= 0 || !Number.isSafeInteger(n)) e.chainId = "Chain ID không hợp lệ";
  }
  if (!isHttpUrl(d.rpcUrl.trim())) e.rpcUrl = "RPC URL phải là http(s) URL hợp lệ";
  if (!d.currencyName.trim()) e.currencyName = "Bắt buộc";
  if (!d.currencySymbol.trim()) e.currencySymbol = "Bắt buộc";
  if (!/^\d+$/.test(d.currencyDecimals.trim()) || Number(d.currencyDecimals) > 36)
    e.currencyDecimals = "0–36";
  if (d.explorerUrl.trim() && !isHttpUrl(d.explorerUrl.trim())) e.explorerUrl = "URL không hợp lệ";
  if (d.explorerApiUrl.trim() && !isHttpUrl(d.explorerApiUrl.trim()))
    e.explorerApiUrl = "URL không hợp lệ";
  return e;
}

export function toViemChain(n: NetworkConfig): Chain {
  return defineChain({
    id: n.chainId,
    name: n.name,
    nativeCurrency: {
      name: n.currencyName,
      symbol: n.currencySymbol,
      decimals: n.currencyDecimals,
    },
    rpcUrls: { default: { http: [n.rpcUrl] } },
    ...(n.explorerUrl
      ? { blockExplorers: { default: { name: "Explorer", url: n.explorerUrl.replace(/\/$/, "") } } }
      : {}),
  });
}

const clientCache = new Map<string, PublicClient>();
export function getPublicClient(n: NetworkConfig): PublicClient {
  const key = `${n.id}|${n.chainId}|${n.rpcUrl}`;
  let c = clientCache.get(key);
  if (!c) {
    c = createPublicClient({
      chain: toViemChain(n),
      transport: http(n.rpcUrl, { timeout: 15_000, retryCount: 1 }),
    }) as PublicClient;
    clientCache.set(key, c);
  }
  return c;
}

export function dropClients(networkId: string) {
  for (const k of clientCache.keys()) if (k.startsWith(networkId + "|")) clientCache.delete(k);
}

export async function checkRpc(n: NetworkConfig) {
  const client = getPublicClient(n);
  try {
    const actual = await client.getChainId();
    if (actual !== n.chainId) return { kind: "mismatch" as const, expected: n.chainId, actual };
    const blockNumber = await client.getBlockNumber();
    return { kind: "ok" as const, chainId: actual, blockNumber, checkedAt: Date.now() };
  } catch (err) {
    const d = describeError(err);
    return { kind: "error" as const, message: d.message, detail: d.detail };
  }
}

export function explorerTx(n: NetworkConfig | undefined, hash: string) {
  return n?.explorerUrl ? `${n.explorerUrl.replace(/\/$/, "")}/tx/${hash}` : undefined;
}
export function explorerAddress(n: NetworkConfig | undefined, addr: string) {
  return n?.explorerUrl ? `${n.explorerUrl.replace(/\/$/, "")}/address/${addr}` : undefined;
}

/** Mask path/query of an RPC URL so API keys aren't shown in full. */
export function maskRpc(url: string): string {
  try {
    const u = new URL(url);
    const p = u.pathname.length > 12 ? u.pathname.slice(0, 6) + "…" : u.pathname;
    return `${u.protocol}//${u.host}${p}${u.search ? "?…" : ""}`;
  } catch {
    return "…";
  }
}

export const PRESETS: Omit<NetworkConfig, "id">[] = [
  {
    name: "Ethereum",
    chainId: 1,
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    currencyName: "Ether",
    currencySymbol: "ETH",
    currencyDecimals: 18,
    explorerUrl: "https://etherscan.io",
    explorerApiUrl: "https://api.etherscan.io/v2/api",
    color: "#7c8cf8",
  },
  {
    name: "Sepolia",
    chainId: 11155111,
    rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
    currencyName: "Sepolia Ether",
    currencySymbol: "ETH",
    currencyDecimals: 18,
    explorerUrl: "https://sepolia.etherscan.io",
    explorerApiUrl: "https://api.etherscan.io/v2/api",
    color: "#a3a3ff",
  },
  {
    name: "Base",
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    currencyName: "Ether",
    currencySymbol: "ETH",
    currencyDecimals: 18,
    explorerUrl: "https://basescan.org",
    explorerApiUrl: "https://api.etherscan.io/v2/api",
    color: "#3b82f6",
  },
  {
    name: "Arbitrum One",
    chainId: 42161,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    currencyName: "Ether",
    currencySymbol: "ETH",
    currencyDecimals: 18,
    explorerUrl: "https://arbiscan.io",
    explorerApiUrl: "https://api.etherscan.io/v2/api",
    color: "#38bdf8",
  },
  {
    name: "Optimism",
    chainId: 10,
    rpcUrl: "https://mainnet.optimism.io",
    currencyName: "Ether",
    currencySymbol: "ETH",
    currencyDecimals: 18,
    explorerUrl: "https://optimistic.etherscan.io",
    explorerApiUrl: "https://api.etherscan.io/v2/api",
    color: "#f87171",
  },
  {
    name: "Polygon",
    chainId: 137,
    rpcUrl: "https://polygon-rpc.com",
    currencyName: "POL",
    currencySymbol: "POL",
    currencyDecimals: 18,
    explorerUrl: "https://polygonscan.com",
    explorerApiUrl: "https://api.etherscan.io/v2/api",
    color: "#a78bfa",
  },
  {
    name: "BNB Smart Chain",
    chainId: 56,
    rpcUrl: "https://bsc-dataseed.binance.org",
    currencyName: "BNB",
    currencySymbol: "BNB",
    currencyDecimals: 18,
    explorerUrl: "https://bscscan.com",
    explorerApiUrl: "https://api.etherscan.io/v2/api",
    color: "#facc15",
  },
  {
    name: "Localhost 8545",
    chainId: 31337,
    rpcUrl: "http://127.0.0.1:8545",
    currencyName: "Ether",
    currencySymbol: "ETH",
    currencyDecimals: 18,
    color: "#4ade80",
  },
];
