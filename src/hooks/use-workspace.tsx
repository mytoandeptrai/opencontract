import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { ContractEntry, NetworkConfig, RpcStatus, TxRecord } from "@/types";
import { checkRpc, dropClients } from "@/lib/chain";

// All workspace data lives ONLY in this React state (RAM). No persistence of any kind.

interface Workspace {
  networks: NetworkConfig[];
  contracts: ContractEntry[];
  rpcStatus: Record<string, RpcStatus>;
  txs: TxRecord[];
  selectedContractId: string | null;
  activeNetworkId: string | null;
  addNetwork: (n: Omit<NetworkConfig, "id">) => NetworkConfig;
  updateNetwork: (n: NetworkConfig) => void;
  removeNetwork: (id: string) => void;
  setActiveNetwork: (id: string | null) => void;
  testRpc: (id: string) => Promise<RpcStatus>;
  addContract: (c: Omit<ContractEntry, "id">) => ContractEntry;
  updateContract: (c: ContractEntry) => void;
  removeContract: (id: string) => void;
  selectContract: (id: string | null) => void;
  upsertTx: (t: TxRecord) => void;
}

const Ctx = createContext<Workspace | null>(null);
const uid = () => crypto.randomUUID();

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [networks, setNetworks] = useState<NetworkConfig[]>([]);
  const [contracts, setContracts] = useState<ContractEntry[]>([]);
  const [rpcStatus, setRpcStatus] = useState<Record<string, RpcStatus>>({});
  const [txs, setTxs] = useState<TxRecord[]>([]);
  const [selectedContractId, setSelected] = useState<string | null>(null);
  const [activeNetworkId, setActiveNetwork] = useState<string | null>(null);
  const netsRef = useRef<NetworkConfig[]>([]);
  netsRef.current = networks;

  const testRpc = useCallback(async (id: string) => {
    const net = netsRef.current.find((n) => n.id === id);
    if (!net) return { kind: "idle" } as RpcStatus;
    setRpcStatus((s) => ({ ...s, [id]: { kind: "checking" } }));
    const r = await checkRpc(net);
    setRpcStatus((s) => ({ ...s, [id]: r }));
    return r;
  }, []);

  const value = useMemo<Workspace>(
    () => ({
      networks,
      contracts,
      rpcStatus,
      txs,
      selectedContractId,
      activeNetworkId,
      addNetwork: (n) => {
        const net = { ...n, id: uid() };
        setNetworks((ns) => [...ns, net]);
        setActiveNetwork((a) => a ?? net.id);
        setTimeout(() => void testRpc(net.id), 0);
        return net;
      },
      updateNetwork: (n) => {
        dropClients(n.id);
        setNetworks((ns) => ns.map((x) => (x.id === n.id ? n : x)));
        setTimeout(() => void testRpc(n.id), 0);
      },
      removeNetwork: (id) => {
        dropClients(id);
        setNetworks((ns) => ns.filter((x) => x.id !== id));
        setActiveNetwork((a) => (a === id ? null : a));
      },
      setActiveNetwork,
      testRpc,
      addContract: (c) => {
        const e = { ...c, id: uid() };
        setContracts((cs) => [...cs, e]);
        setSelected(e.id);
        return e;
      },
      updateContract: (c) => setContracts((cs) => cs.map((x) => (x.id === c.id ? c : x))),
      removeContract: (id) => {
        setContracts((cs) => cs.filter((x) => x.id !== id));
        setSelected((s) => (s === id ? null : s));
      },
      selectContract: setSelected,
      upsertTx: (t) =>
        setTxs((ts) => (ts.some((x) => x.id === t.id) ? ts.map((x) => (x.id === t.id ? t : x)) : [t, ...ts])),
    }),
    [networks, contracts, rpcStatus, txs, selectedContractId, activeNetworkId, testRpc],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWorkspace outside provider");
  return c;
}
