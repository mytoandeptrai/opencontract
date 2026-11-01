import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createWalletClient, custom, getAddress, numberToHex, type Address, type EIP1193Provider, type WalletClient } from "viem";
import type { NetworkConfig, WalletState } from "@/types";
import { toViemChain } from "@/lib/chain";
import { describeError } from "@/lib/errors";

declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

interface WalletCtx extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchTo: (n: NetworkConfig) => Promise<number | undefined>;
  getClient: (n: NetworkConfig) => WalletClient;
}

const Ctx = createContext<WalletCtx | null>(null);

function provider(): EIP1193Provider | undefined {
  return typeof window === "undefined" ? undefined : window.ethereum;
}

async function readChainId(p: EIP1193Provider): Promise<number> {
  const hex = (await p.request({ method: "eth_chainId" })) as string;
  return Number(BigInt(hex));
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({ available: false, connecting: false });

  useEffect(() => {
    const p = provider();
    if (!p) return;
    setState((s) => ({ ...s, available: true }));
    const onAccounts = (accs: string[]) =>
      setState((s) => {
        const { account: _a, ...rest } = s;
        return accs[0] ? { ...rest, account: getAddress(accs[0]) } : rest;
      });
    const onChain = (hex: string) => setState((s) => ({ ...s, chainId: Number(BigInt(hex)) }));
    p.on("accountsChanged", onAccounts);
    p.on("chainChanged", onChain);
    return () => {
      p.removeListener("accountsChanged", onAccounts);
      p.removeListener("chainChanged", onChain);
    };
  }, []);

  const connect = useCallback(async () => {
    const p = provider();
    if (!p) throw new Error("Không tìm thấy browser wallet (EIP-1193). Hãy cài MetaMask hoặc wallet tương thích.");
    setState((s) => ({ ...s, connecting: true }));
    try {
      const accs = (await p.request({ method: "eth_requestAccounts" })) as string[];
      const chainId = await readChainId(p);
      setState((s) => ({ ...s, connecting: false, chainId, ...(accs[0] ? { account: getAddress(accs[0]) } : {}) }));
    } catch (e) {
      setState((s) => ({ ...s, connecting: false }));
      throw new Error(describeError(e).message);
    }
  }, []);

  const disconnect = useCallback(() => {
    setState((s) => ({ available: s.available, connecting: false }));
  }, []);

  const switchTo = useCallback(async (n: NetworkConfig) => {
    const p = provider();
    if (!p) throw new Error("Không có wallet.");
    const chainHex = numberToHex(n.chainId);
    try {
      await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainHex }] });
    } catch (e) {
      const code = (e as { code?: number }).code ?? (e as { data?: { originalError?: { code?: number } } }).data?.originalError?.code;
      if (code === 4902) {
        await p.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainHex,
              chainName: n.name,
              nativeCurrency: { name: n.currencyName, symbol: n.currencySymbol, decimals: n.currencyDecimals },
              rpcUrls: [n.rpcUrl],
              ...(n.explorerUrl ? { blockExplorerUrls: [n.explorerUrl] } : {}),
            },
          ],
        });
      } else throw new Error(describeError(e).message);
    }
    // Verify the actual chain afterwards — never assume success.
    const actual = await readChainId(p);
    setState((s) => ({ ...s, chainId: actual }));
    return actual;
  }, []);

  const getClient = useCallback((n: NetworkConfig) => {
    const p = provider();
    if (!p) throw new Error("Không có wallet.");
    return createWalletClient({ chain: toViemChain(n), transport: custom(p) });
  }, []);

  const value = useMemo(() => ({ ...state, connect, disconnect, switchTo, getClient }), [state, connect, disconnect, switchTo, getClient]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWallet outside provider");
  return c;
}

export function shortAddr(a: Address | string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
