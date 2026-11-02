import { useLanguage } from "@/hooks/use-language";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listEvents } from "@/lib/abi";
import { getPublicClient, explorerTx } from "@/lib/chain";
import { describeError } from "@/lib/errors";
import { parseBigIntStrict, stringify } from "@/lib/args";
import type { ContractEntry, NetworkConfig } from "@/types";
import { ErrorBox, Notice } from "./status";

interface Row {
  key: string;
  block?: bigint | null;
  tx?: string | null;
  name?: string;
  args: unknown;
}

export function EventsPanel({ contract, network }: { contract: ContractEntry; network: NetworkConfig }) {
  const { t } = useLanguage();
  const events = useMemo(() => listEvents(contract.abi), [contract.abi]);
  const [sel, setSel] = useState<string>("__all");
  const [range, setRange] = useState("1000");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<{ message: string; detail?: string | undefined } | null>(null);

  if (events.length === 0) return <Notice tone="info">{t("ABI không định nghĩa event nào.")}</Notice>;

  const run = async () => {
    setErr(null);
    setRows(null);
    let span: bigint;
    try {
      span = parseBigIntStrict(range, t("Số block"));
      if (span <= 0n || span > 1_000_000n) throw new Error(t("Số block phải từ 1 đến 1.000.000"));
    } catch (e) {
      return setErr({ message: (e as Error).message });
    }
    setLoading(true);
    try {
      const client = getPublicClient(network);
      const latest = await client.getBlockNumber();
      const fromBlock = latest > span ? latest - span : 0n;
      const selectedEvent = events.find((e) => e.key === sel);
      if (sel !== "__all" && !selectedEvent) return;
      const chosen = sel === "__all" ? events.map((e) => e.event) : selectedEvent ? [selectedEvent.event] : [];
      const logs = await client.getLogs({ address: contract.address, events: chosen, fromBlock, toBlock: latest });
      setRows(
        logs
          .slice(-200)
          .reverse()
          .map((l, i) => ({ key: `${l.transactionHash}-${l.logIndex ?? i}`, block: l.blockNumber, tx: l.transactionHash, name: (l as { eventName?: string }).eventName ?? "?", args: (l as { args?: unknown }).args })),
      );
    } catch (e) {
      const d = describeError(e);
      setErr({ message: t("Truy vấn event thất bại: {0}. Một số RPC giới hạn phạm vi block — thử giảm số block.", d.message), detail: d.detail });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-56 flex-1 space-y-1">
          <span className="text-xs text-muted-foreground">Event</span>
          <Select value={sel} onValueChange={setSel}>
            <SelectTrigger className="font-mono text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">{t("Tất cả event trong ABI")}</SelectItem>
              {events.map((e) => (
                <SelectItem key={e.key} value={e.key} className="font-mono text-xs">{e.signature.replace(/^event /, "")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36 space-y-1">
          <span className="text-xs text-muted-foreground">{t("N block gần nhất")}</span>
          <Input value={range} onChange={(e) => setRange(e.target.value)} className="font-mono text-xs" />
        </div>
        <Button size="sm" onClick={run} disabled={loading}>
          {loading && <Loader2 className="size-3.5 animate-spin" />} {t("Truy vấn")} </Button>
      </div>
      {err && <ErrorBox message={err.message} detail={err.detail} />}
      {rows && rows.length === 0 && <Notice tone="info">{t("Không có log trong phạm vi này.")}</Notice>}
      {rows && rows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{rows.length} {t("log (tối đa 200, mới nhất trước)")}</p>
          {rows.map((r) => {
            const url = r.tx ? explorerTx(network, r.tx) : undefined;
            return (
              <div key={r.key} className="rounded-md border border-border p-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-medium text-primary">{r.name}</span>
                  <span className="font-mono text-muted-foreground">block {r.block?.toString()}</span>
                  {r.tx && (url ? <a className="truncate font-mono text-muted-foreground underline" href={url} target="_blank" rel="noreferrer noopener">{r.tx}</a> : <span className="truncate font-mono text-muted-foreground">{r.tx}</span>)}
                </div>
                <pre className="mt-1.5 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px]">{stringify(r.args)}</pre>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
