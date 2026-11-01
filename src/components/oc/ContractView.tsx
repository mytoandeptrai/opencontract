import { useEffect, useMemo, useState } from "react";
import { Pencil, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listFunctions } from "@/lib/abi";
import { getPublicClient } from "@/lib/chain";
import { describeError } from "@/lib/errors";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWallet } from "@/hooks/use-wallet";
import type { BytecodeStatus, ContractEntry, FunctionItem, NetworkConfig } from "@/types";
import { FunctionCard } from "./FunctionCard";
import { EventsPanel } from "./EventsPanel";
import { InfoPanel } from "./InfoPanel";
import { CopyButton, Notice, RpcBadge } from "./status";

function FnList({ items, contract, network, mode }: { items: FunctionItem[]; contract: ContractEntry; network: NetworkConfig; mode: "read" | "write" }) {
  const [q, setQ] = useState("");
  const shown = items.filter((i) => i.signature.toLowerCase().includes(q.toLowerCase()));
  if (items.length === 0) return <Notice tone="info">Không có function {mode === "read" ? "đọc (view/pure)" : "ghi (nonpayable/payable)"} trong ABI.</Notice>;
  return (
    <div className="space-y-2">
      {items.length > 6 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lọc function…" className="pl-8" />
        </div>
      )}
      {shown.map((it) => (
        <FunctionCard key={`${contract.id}-${contract.networkId}-${it.key}`} item={it} contract={contract} network={network} mode={mode} />
      ))}
    </div>
  );
}

function WalletGuard({ network }: { network: NetworkConfig }) {
  const w = useWallet();
  if (!w.available) return <Notice>Không phát hiện browser wallet (EIP-1193). Cài MetaMask hoặc wallet tương thích để gửi giao dịch.</Notice>;
  if (!w.account)
    return (
      <Notice>
        Chưa kết nối wallet. <button className="underline" onClick={() => void w.connect().catch((e: Error) => alertErr(e))}>Kết nối</button> để gửi giao dịch.
      </Notice>
    );
  if (w.chainId !== network.chainId)
    return (
      <Notice>
        Wallet ở chain {w.chainId}, contract ở {network.name} ({network.chainId}). Giao dịch ghi bị chặn.{" "}
        <button
          className="underline"
          onClick={async () => {
            try {
              const actual = await w.switchTo(network);
              if (actual !== network.chainId) alertErr(new Error(`Wallet vẫn ở chain ${actual}.`));
            } catch (e) {
              alertErr(e as Error);
            }
          }}
        >
          Chuyển / thêm network
        </button>
      </Notice>
    );
  return null;
}

import { toast } from "sonner";
function alertErr(e: Error) {
  toast.error(e.message);
}

export function ContractView({ contract, onEdit }: { contract: ContractEntry; onEdit: () => void }) {
  const ws = useWorkspace();
  const network = ws.networks.find((n) => n.id === contract.networkId);
  const fns = useMemo(() => listFunctions(contract.abi), [contract.abi]);
  const [bytecode, setBytecode] = useState<BytecodeStatus>({ kind: "unknown" });

  useEffect(() => {
    if (!network) return;
    let cancel = false;
    setBytecode({ kind: "checking" });
    getPublicClient(network)
      .getCode({ address: contract.address })
      .then((code) => {
        if (cancel) return;
        setBytecode(!code || code === "0x" ? { kind: "empty" } : { kind: "found", size: (code.length - 2) / 2 });
      })
      .catch((e) => !cancel && setBytecode({ kind: "error", message: describeError(e).message }));
    return () => {
      cancel = true;
    };
  }, [network, contract.address]);

  if (!network) return <Notice>Network của contract này đã bị xóa. Hãy sửa contract và chọn network khác.</Notice>;
  const rpc = ws.rpcStatus[network.id];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">{contract.name}</h1>
          <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <span className="truncate">{contract.address}</span>
            <CopyButton value={contract.address} />
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: network.color }} />{network.name}</span>
            <RpcBadge status={rpc} />
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="size-3.5" /> Sửa</Button>
          <Button size="sm" variant="ghost" onClick={() => ws.removeContract(contract.id)} aria-label="Xóa contract"><Trash2 className="size-3.5" /></Button>
        </div>
      </div>

      {rpc?.kind === "mismatch" && <Notice>RPC trả về chain ID {rpc.actual}, khác cấu hình {rpc.expected}. Kết quả có thể đến từ network khác.</Notice>}
      {rpc?.kind === "error" && <Notice>RPC lỗi: {rpc.message}</Notice>}
      {bytecode.kind === "empty" && <Notice>Không tìm thấy bytecode tại địa chỉ này trên {network.name}. Địa chỉ có thể không chứa contract.</Notice>}

      <Tabs defaultValue="read">
        <TabsList>
          <TabsTrigger value="read">Read ({fns.reads.length})</TabsTrigger>
          <TabsTrigger value="write">Write ({fns.writes.length})</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>
        <TabsContent value="read" className="mt-3">
          <FnList items={fns.reads} contract={contract} network={network} mode="read" />
        </TabsContent>
        <TabsContent value="write" className="mt-3 space-y-3">
          <WalletGuard network={network} />
          <FnList items={fns.writes} contract={contract} network={network} mode="write" />
        </TabsContent>
        <TabsContent value="events" className="mt-3">
          <EventsPanel contract={contract} network={network} />
        </TabsContent>
        <TabsContent value="info" className="mt-3">
          <InfoPanel contract={contract} network={network} bytecode={bytecode} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
