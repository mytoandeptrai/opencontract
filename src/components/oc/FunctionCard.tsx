import { useState } from "react";
import { encodeFunctionData, formatUnits, type Abi, type AbiParameter } from "viem";
import { ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildArgs, isComplex, parseNative, placeholderFor, stringify } from "@/lib/args";
import { explorerTx, getPublicClient } from "@/lib/chain";
import { describeError } from "@/lib/errors";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWallet } from "@/hooks/use-wallet";
import type { ContractEntry, FunctionItem, NetworkConfig, TxPhase, TxRecord } from "@/types";
import { cn } from "@/lib/utils";
import { CopyButton, ErrorBox, Notice } from "./status";

function ParamField({ p, i, value, onChange }: { p: AbiParameter; i: number; value: string; onChange: (v: string) => void }) {
  const label = `${p.name || `arg${i}`}`;
  const common = { value, onChange: (e: { target: { value: string } }) => onChange(e.target.value), placeholder: placeholderFor(p), spellCheck: false };
  return (
    <label className="block space-y-1">
      <span className="text-xs text-muted-foreground">
        {label} <span className="font-mono text-primary/80">{p.type === "tuple" ? "tuple" : p.type}</span>
        {"components" in p && p.components && (
          <span className="font-mono text-[10px]"> ({p.components.map((c) => `${c.type} ${c.name ?? ""}`.trim()).join(", ")})</span>
        )}
      </span>
      {isComplex(p) ? <Textarea rows={3} className="font-mono text-xs" {...common} /> : <Input className="font-mono text-xs" {...common} />}
    </label>
  );
}

function OutputView({ outputs, result }: { outputs: readonly AbiParameter[]; result: unknown }) {
  if (outputs.length === 0) return <p className="text-xs text-muted-foreground">Function không trả về dữ liệu.</p>;
  const values = outputs.length === 1 ? [result] : (result as unknown[]);
  return (
    <div className="space-y-1.5">
      {outputs.map((o, i) => {
        const s = stringify(values[i]);
        return (
          <div key={i} className="flex items-start gap-2 rounded bg-muted/50 p-2">
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{o.name || `[${i}]`} {o.type}</span>
            <pre className="min-w-0 flex-1 whitespace-pre-wrap break-all font-mono text-xs">{s}</pre>
            <CopyButton value={s} />
          </div>
        );
      })}
    </div>
  );
}

const PHASE_LABEL: Record<TxPhase, string> = {
  idle: "Chưa thực hiện",
  validating: "Đang kiểm tra dữ liệu…",
  simulating: "Đang mô phỏng…",
  "awaiting-wallet": "Đang chờ xác nhận trên wallet…",
  submitted: "Đã gửi",
  confirming: "Đang chờ xác nhận trên blockchain…",
  success: "Thành công",
  reverted: "Reverted",
  rejected: "Người dùng từ chối",
  failed: "Thất bại",
};

export function TxStatus({ tx, network }: { tx: TxRecord; network: NetworkConfig | undefined }) {
  const busy = ["validating", "simulating", "awaiting-wallet", "submitted", "confirming"].includes(tx.phase);
  const tone = tx.phase === "success" ? "text-success" : ["reverted", "failed", "rejected"].includes(tx.phase) ? "text-destructive" : "text-warning";
  const url = tx.hash ? explorerTx(network, tx.hash) : undefined;
  return (
    <div className="space-y-1.5 rounded-md border border-border p-2.5 text-xs">
      <div className={cn("flex items-center gap-1.5 font-medium", tone)}>
        {busy && <Loader2 className="size-3.5 animate-spin" />} {PHASE_LABEL[tx.phase]}
        {tx.blockNumber !== undefined && <span className="font-mono text-muted-foreground">block {tx.blockNumber.toString()}</span>}
        {tx.gasUsed !== undefined && <span className="font-mono text-muted-foreground">gas {tx.gasUsed.toString()}</span>}
      </div>
      {tx.hash && (
        <div className="flex items-center gap-1">
          <span className="truncate font-mono">{tx.hash}</span>
          <CopyButton value={tx.hash} />
          {url && (
            <a href={url} target="_blank" rel="noreferrer noopener" className="inline-flex size-6 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Mở explorer">
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      )}
      {tx.error && <ErrorBox message={tx.error} detail={tx.detail} />}
    </div>
  );
}

interface Pending {
  args: unknown[];
  value: bigint;
  gas?: bigint;
  warnings: string[];
}

export function FunctionCard({ item, contract, network, mode }: { item: FunctionItem; contract: ContractEntry; network: NetworkConfig; mode: "read" | "write" }) {
  const ws = useWorkspace();
  const wallet = useWallet();
  const { fn } = item;
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState<string[]>(() => fn.inputs.map(() => ""));
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: true; data: unknown } | { ok: false; message: string; detail?: string | undefined } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const tx = txId ? ws.txs.find((t) => t.id === txId) : undefined;
  const payable = fn.stateMutability === "payable";
  const abi = contract.abi as Abi;
  const rpc = ws.rpcStatus[network.id];

  const onRead = async () => {
    setResult(null);
    let args: unknown[];
    try {
      args = buildArgs(fn.inputs, raw);
    } catch (e) {
      setResult({ ok: false, message: (e as Error).message });
      return;
    }
    setLoading(true);
    try {
      const data = await getPublicClient(network).readContract({ address: contract.address, abi: [fn], functionName: fn.name, args });
      setResult({ ok: true, data });
    } catch (e) {
      const d = describeError(e);
      setResult({ ok: false, message: d.message, detail: d.detail });
    } finally {
      setLoading(false);
    }
  };

  const update = (t: TxRecord, patch: Partial<TxRecord>) => {
    const next = { ...t, ...patch };
    ws.upsertTx(next);
    return next;
  };

  // Step 1: validate + simulate + estimate; then show confirmation dialog.
  const onPrepare = async () => {
    setResult(null);
    if (!wallet.account) return setResult({ ok: false, message: "Chưa kết nối wallet." });
    if (wallet.chainId !== network.chainId)
      return setResult({ ok: false, message: `Wallet đang ở chain ${wallet.chainId}, contract ở ${network.name} (${network.chainId}). Hãy chuyển network.` });
    let args: unknown[];
    let val = 0n;
    try {
      args = buildArgs(fn.inputs, raw);
      if (payable) val = parseNative(value, network.currencyDecimals);
      encodeFunctionData({ abi: [fn], functionName: fn.name, args });
    } catch (e) {
      return setResult({ ok: false, message: (e as Error).message });
    }
    setLoading(true);
    const warnings: string[] = [];
    let gas: bigint | undefined;
    try {
      const client = getPublicClient(network);
      const actual = await client.getChainId();
      if (actual !== network.chainId) {
        setLoading(false);
        return setResult({ ok: false, message: `RPC trả về chain ID ${actual}, khác cấu hình ${network.chainId}. Đã chặn giao dịch.` });
      }
      try {
        await client.simulateContract({ address: contract.address, abi: [fn], functionName: fn.name, args, account: wallet.account, ...(payable ? { value: val } : {}) } as never);
      } catch (e) {
        warnings.push(`Mô phỏng thất bại: ${describeError(e).message}`);
      }
      try {
        gas = await client.estimateContractGas({ address: contract.address, abi: [fn], functionName: fn.name, args, account: wallet.account, ...(payable ? { value: val } : {}) } as never);
      } catch (e) {
        warnings.push(`Không ước tính được gas: ${describeError(e).message}`);
      }
    } catch (e) {
      const d = describeError(e);
      setLoading(false);
      return setResult({ ok: false, message: d.message, detail: d.detail });
    }
    setLoading(false);
    setPending({ args, value: val, warnings, ...(gas !== undefined ? { gas } : {}) });
  };

  // Step 2: explicit user confirmation -> wallet signs -> wait receipt. No retries.
  const onSend = async () => {
    if (!pending || !wallet.account) return;
    const p = pending;
    setPending(null);
    let t: TxRecord = { id: crypto.randomUUID(), contractId: contract.id, contractName: contract.name, networkId: network.id, signature: item.signature, phase: "awaiting-wallet", createdAt: Date.now() };
    ws.upsertTx(t);
    setTxId(t.id);
    try {
      if (wallet.chainId !== network.chainId) throw new Error("Wallet đã đổi network. Giao dịch bị chặn.");
      const wc = wallet.getClient(network);
      const hash = await wc.writeContract({ address: contract.address, abi: [fn], functionName: fn.name, args: p.args, account: wallet.account, chain: wc.chain, ...(payable ? { value: p.value } : {}) } as never);
      t = update(t, { phase: "confirming", hash });
      toast.message("Đã gửi giao dịch", { description: hash });
      try {
        const r = await getPublicClient(network).waitForTransactionReceipt({ hash, timeout: 180_000 });
        t = update(t, { phase: r.status === "success" ? "success" : "reverted", blockNumber: r.blockNumber, gasUsed: r.gasUsed });
        if (r.status === "success") toast.success(`${fn.name}: thành công`);
        else toast.error(`${fn.name}: reverted`);
      } catch (e) {
        const d = describeError(e);
        update(t, { phase: "submitted", error: `Chưa lấy được receipt (${d.message}). Giao dịch có thể vẫn đang được xử lý — kiểm tra hash, KHÔNG gửi lại.`, ...(d.detail ? { detail: d.detail } : {}) });
      }
    } catch (e) {
      const d = describeError(e);
      update(t, { phase: d.rejected ? "rejected" : "failed", error: d.message, ...(d.detail ? { detail: d.detail } : {}) });
    }
  };

  const busyTx = tx && ["awaiting-wallet", "submitted", "confirming"].includes(tx.phase) && !tx.error;
  const blocked = mode === "write" && (!wallet.account || wallet.chainId !== network.chainId);

  return (
    <div className="rounded-lg border border-border bg-card">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
        <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")} />
        <span className="font-mono text-sm font-medium">{fn.name}</span>
        <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">{item.signature.replace(/^function \w+/, "")}</span>
        <span className="ml-auto flex shrink-0 gap-1">
          {item.overloaded && <span className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">overload</span>}
          <span className={cn("rounded px-1.5 text-[10px]", payable ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground")}>{fn.stateMutability}</span>
        </span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border p-3">
          {item.unsupported ? (
            <Notice>{item.unsupported}</Notice>
          ) : (
            <>
              {fn.inputs.length === 0 && <p className="text-xs text-muted-foreground">Không có tham số.</p>}
              {fn.inputs.map((p, i) => (
                <ParamField key={i} p={p} i={i} value={raw[i] ?? ""} onChange={(v) => setRaw((r) => r.map((x, j) => (j === i ? v : x)))} />
              ))}
              {payable && (
                <label className="block space-y-1">
                  <span className="text-xs text-muted-foreground">Giá trị gửi kèm ({network.currencySymbol})</span>
                  <Input className="font-mono text-xs" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.0" inputMode="decimal" />
                </label>
              )}
              <div className="flex items-center gap-2">
                {mode === "read" ? (
                  <Button size="sm" onClick={onRead} disabled={loading}>
                    {loading && <Loader2 className="size-3.5 animate-spin" />} Read
                  </Button>
                ) : (
                  <Button size="sm" onClick={onPrepare} disabled={loading || blocked || !!busyTx}>
                    {loading && <Loader2 className="size-3.5 animate-spin" />} {loading ? "Đang mô phỏng…" : "Write…"}
                  </Button>
                )}
                {rpc?.kind === "error" && <span className="text-xs text-destructive">RPC đang lỗi</span>}
              </div>
              {result?.ok && <OutputView outputs={fn.outputs} result={result.data} />}
              {result && !result.ok && <ErrorBox message={result.message} detail={result.detail} />}
              {tx && <TxStatus tx={tx} network={network} />}
            </>
          )}
        </div>
      )}

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Xác nhận giao dịch</DialogTitle>
          </DialogHeader>
          {pending && (
            <div className="space-y-2 text-sm">
              <Row k="Contract" v={contract.name} />
              <Row k="Địa chỉ" v={contract.address} mono />
              <Row k="Network" v={`${network.name} (${network.chainId})`} />
              <Row k="Function" v={item.signature} mono />
              {fn.inputs.map((p, i) => (
                <Row key={i} k={p.name || `arg${i}`} v={stringify(pending.args[i])} mono />
              ))}
              {payable && <Row k="Value" v={`${formatUnits(pending.value, network.currencyDecimals)} ${network.currencySymbol}`} mono />}
              <Row k="Gas ước tính" v={pending.gas !== undefined ? pending.gas.toString() : "không có"} mono />
              {pending.warnings.map((w, i) => (
                <Notice key={i}>{w}</Notice>
              ))}
              <p className="text-xs text-muted-foreground">Wallet sẽ hiển thị xác nhận cuối cùng. Giao dịch chỉ được gửi sau khi bạn ký.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPending(null)}>Hủy</Button>
            <Button onClick={onSend}>Gửi tới wallet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
  void abi;
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className={cn("break-all text-xs", mono && "font-mono")}>{v}</span>
    </div>
  );
}
