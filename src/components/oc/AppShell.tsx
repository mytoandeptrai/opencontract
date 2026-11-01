import { useState } from "react";
import { FileCode2, Network, Pencil, Plus, RefreshCw, Search, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/hooks/use-workspace";
import { shortAddr, useWallet } from "@/hooks/use-wallet";
import { maskRpc } from "@/lib/chain";
import type { ContractEntry, NetworkConfig } from "@/types";
import { cn } from "@/lib/utils";
import { NetworkDialog } from "./NetworkDialog";
import { ContractDialog } from "./ContractDialog";
import { ContractView } from "./ContractView";
import { RpcBadge } from "./status";

function WalletButton() {
  const w = useWallet();
  const ws = useWorkspace();
  const known = ws.networks.find((n) => n.chainId === w.chainId);
  if (w.account)
    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-muted-foreground sm:inline">{known ? known.name : `chain ${w.chainId}`}</span>
        <Button size="sm" variant="outline" onClick={w.disconnect} title="Ngắt kết nối khỏi phiên ứng dụng">
          <Wallet className="size-3.5" /> <span className="font-mono">{shortAddr(w.account)}</span>
        </Button>
      </div>
    );
  return (
    <Button
      size="sm"
      disabled={w.connecting}
      onClick={() => void w.connect().catch((e: Error) => toast.error(e.message))}
    >
      <Wallet className="size-3.5" /> {w.connecting ? "Đang kết nối…" : "Kết nối wallet"}
    </Button>
  );
}

export function AppShell() {
  const ws = useWorkspace();
  const [netOpen, setNetOpen] = useState(false);
  const [editNet, setEditNet] = useState<NetworkConfig | undefined>();
  const [cOpen, setCOpen] = useState(false);
  const [editC, setEditC] = useState<ContractEntry | undefined>();
  const [q, setQ] = useState("");
  const active = ws.networks.find((n) => n.id === ws.activeNetworkId);
  const selected = ws.contracts.find((c) => c.id === ws.selectedContractId);
  const filtered = ws.contracts.filter((c) => (c.name + c.address).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/90 px-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded bg-primary font-mono text-sm font-bold text-primary-foreground">oc</div>
          <span className="font-semibold tracking-tight">OpenContract</span>
        </div>
        {active && (
          <div className="hidden items-center gap-3 text-xs md:flex">
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: active.color }} />{active.name}</span>
            <RpcBadge status={ws.rpcStatus[active.id]} />
          </div>
        )}
        <p className="ml-auto hidden text-[11px] text-muted-foreground lg:block">Workspace chỉ tồn tại trong phiên hiện tại. Dữ liệu sẽ bị xóa khi tải lại hoặc đóng trang.</p>
        <div className="ml-auto lg:ml-0"><WalletButton /></div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="w-full shrink-0 space-y-5 border-b border-border p-4 md:w-72 md:border-b-0 md:border-r">
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Networks</h2>
              <Button size="sm" variant="ghost" onClick={() => { setEditNet(undefined); setNetOpen(true); }}><Plus className="size-3.5" /> Thêm</Button>
            </div>
            {ws.networks.length === 0 && <p className="text-xs text-muted-foreground">Chưa có network.</p>}
            {ws.networks.map((n) => {
              const st = ws.rpcStatus[n.id];
              return (
                <div key={n.id} className={cn("group rounded-md border p-2", n.id === ws.activeNetworkId ? "border-primary/60 bg-accent/40" : "border-border")}>
                  <button className="flex w-full items-center gap-2 text-left text-sm" onClick={() => ws.setActiveNetwork(n.id)}>
                    <span className="size-2 shrink-0 rounded-full" style={{ background: n.color }} />
                    <span className="truncate">{n.name}</span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">{n.chainId}</span>
                  </button>
                  <div className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{maskRpc(n.rpcUrl)}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <RpcBadge status={st} />
                    <div className="flex">
                      <button className="p-1 text-muted-foreground hover:text-foreground" onClick={() => void ws.testRpc(n.id)} aria-label="Kiểm tra RPC"><RefreshCw className={cn("size-3.5", st?.kind === "checking" && "animate-spin")} /></button>
                      <button className="p-1 text-muted-foreground hover:text-foreground" onClick={() => { setEditNet(n); setNetOpen(true); }} aria-label="Sửa network"><Pencil className="size-3.5" /></button>
                      <button className="p-1 text-muted-foreground hover:text-destructive" onClick={() => ws.removeNetwork(n.id)} aria-label="Xóa network"><Trash2 className="size-3.5" /></button>
                    </div>
                  </div>
                  {st?.kind === "error" && <p className="mt-1 text-[11px] text-destructive">{st.message}</p>}
                  {st?.kind === "mismatch" && <p className="mt-1 text-[11px] text-destructive">RPC trả về chain {st.actual}, cấu hình {st.expected}</p>}
                </div>
              );
            })}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contracts</h2>
              <Button size="sm" variant="ghost" onClick={() => { setEditC(undefined); setCOpen(true); }} disabled={ws.networks.length === 0}><Plus className="size-3.5" /> Thêm</Button>
            </div>
            {ws.contracts.length > 0 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm contract…" className="h-8 pl-8 text-xs" />
              </div>
            )}
            {ws.contracts.length === 0 && <p className="text-xs text-muted-foreground">Chưa có contract.</p>}
            {filtered.map((c) => {
              const n = ws.networks.find((x) => x.id === c.networkId);
              return (
                <button key={c.id} onClick={() => ws.selectContract(c.id)} className={cn("w-full rounded-md px-2 py-1.5 text-left", c.id === ws.selectedContractId ? "bg-accent" : "hover:bg-accent/50")}>
                  <div className="flex items-center gap-2 text-sm"><span className="size-1.5 rounded-full" style={{ background: n?.color ?? "gray" }} /><span className="truncate">{c.name}</span></div>
                  <div className="truncate pl-3.5 font-mono text-[10px] text-muted-foreground">{shortAddr(c.address)} · {n?.name ?? "network đã xóa"}</div>
                </button>
              );
            })}
          </section>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          {selected ? (
            <div className="mx-auto max-w-4xl">
              <ContractView key={selected.id} contract={selected} onEdit={() => { setEditC(selected); setCOpen(true); }} />
            </div>
          ) : (
            <EmptyState hasNetwork={ws.networks.length > 0} onAddNetwork={() => { setEditNet(undefined); setNetOpen(true); }} onAddContract={() => { setEditC(undefined); setCOpen(true); }} />
          )}
        </main>
      </div>

      <NetworkDialog open={netOpen} onOpenChange={setNetOpen} editing={editNet} />
      <ContractDialog open={cOpen} onOpenChange={setCOpen} editing={editC} />
    </div>
  );
}

function EmptyState({ hasNetwork, onAddNetwork, onAddContract }: { hasNetwork: boolean; onAddNetwork: () => void; onAddContract: () => void }) {
  const steps = [
    { icon: Network, title: "1. Cấu hình network", body: "Bất kỳ chain EVM nào: chain ID, RPC URL riêng của bạn. Chain ID thực tế sẽ được kiểm tra.", done: hasNetwork, action: onAddNetwork, label: "Thêm network" },
    { icon: FileCode2, title: "2. Thêm contract", body: "Địa chỉ contract (kể cả proxy) và ABI JSON hoặc artifact Hardhat/Foundry. Không cần verify trên explorer.", done: false, action: onAddContract, label: "Thêm contract", disabled: !hasNetwork },
    { icon: Wallet, title: "3. Đọc & ghi", body: "Hàm view/pure chạy qua RPC không cần wallet. Hàm ghi dùng browser wallet và chỉ gửi khi bạn xác nhận.", done: false },
  ];
  return (
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Tương tác với smart contract EVM — không cần verify.</h1>
      <p className="mt-2 text-sm text-muted-foreground">Mọi thứ chỉ nằm trong bộ nhớ của tab này. Tải lại trang sẽ xóa sạch workspace.</p>
      <div className="mt-8 space-y-3">
        {steps.map((s) => (
          <div key={s.title} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
            <s.icon className={cn("mt-0.5 size-5", s.done ? "text-success" : "text-primary")} />
            <div className="flex-1">
              <h3 className="text-sm font-medium">{s.title}</h3>
              <p className="text-xs text-muted-foreground">{s.body}</p>
            </div>
            {s.action && <Button size="sm" variant={s.done ? "outline" : "default"} onClick={s.action} disabled={s.disabled}>{s.label}</Button>}
          </div>
        ))}
      </div>
    </div>
  );
}
