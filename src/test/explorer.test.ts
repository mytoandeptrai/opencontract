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

import { canAutoDetectAbi, detectContractAbi, getExplorerAdapterKind } from "@/lib/explorer";

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
  it("only offers detection with valid address, RPC, Explorer API, and key", () => {
    expect(canAutoDetectAbi(network, address)).toBe(true);
    expect(canAutoDetectAbi({ ...network, explorerApiKey: "" }, address)).toBe(false);
    expect(canAutoDetectAbi({ ...network, rpcUrl: "not a URL" }, address)).toBe(false);
    expect(canAutoDetectAbi(network, "not an address")).toBe(false);
  });

  it("uses the selected chain and address, checks deployed code, and validates the returned ABI", async () => {
    getChainId.mockResolvedValue(11155111);
    getBytecode.mockResolvedValue("0x6000");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      status: "1",
      message: "OK",
      result: JSON.stringify([{ type: "function", name: "balanceOf", inputs: [], outputs: [], stateMutability: "view" }]),
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await detectContractAbi(network, address);

    expect(result.kind).toBe("success");
    if (result.kind !== "success") throw new Error("Expected a validated ABI");
    expect(result.abi.filter((item) => item.type === "function")).toHaveLength(1);
    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.searchParams.get("chainid")).toBe("11155111");
    expect(requestUrl.searchParams.get("address")).toBe(address);
    expect(requestUrl.searchParams.get("action")).toBe("getabi");
    expect(getBytecode).toHaveBeenCalledOnce();
  });

  it("reports an unverified contract without treating the response as ABI", async () => {
    getChainId.mockResolvedValue(11155111);
    getBytecode.mockResolvedValue("0x6000");
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      status: "0",
      message: "NOTOK",
      result: "Contract source code not verified",
    }), { status: 200, headers: { "Content-Type": "application/json" } })));

    const result = await detectContractAbi(network, address);

    expect(result.kind).toBe("not-found");
    if (result.kind !== "not-found") throw new Error("Expected an unverified ABI result");
    expect(result.message).toBe("Không tìm thấy ABI. Contract có thể chưa được xác minh trên Explorer đã chọn.");
  });

  it("identifies explicit Etherscan and Blockscout API endpoints", () => {
    expect(getExplorerAdapterKind("https://api.etherscan.io/v2/api")).toBe("etherscan-v2");
    expect(getExplorerAdapterKind("https://eth.blockscout.com/api/v2")).toBe("blockscout-v2");
    expect(getExplorerAdapterKind("https://example.com" )).toBeNull();
  });
});