import { useLanguage } from "@/hooks/use-language";
import { useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";
import type { RpcStatus } from "@/types";
import { cn } from "@/lib/utils";

export function RpcBadge({ status }: { status: RpcStatus | undefined }) {
  const { t } = useLanguage();
  const s = status ?? { kind: "idle" };
  const map = {
    idle: ["bg-muted-foreground", t("Chưa kiểm tra")],
    checking: ["bg-warning animate-pulse", t("Đang kiểm tra…")],
    ok: ["bg-success", "RPC OK"],
    mismatch: ["bg-destructive", "Sai chain ID"],
    error: ["bg-destructive", t("Lỗi RPC")],
  } as const;
  const [dot, label] = map[s.kind];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("size-2 rounded-full", dot)} />
      {t(label)}
      {s.kind === "ok" && <span className="font-mono">#{s.blockNumber.toString()}</span>}
    </span>
  );
}

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const { t } = useLanguage();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={cn("inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground", className)}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          toast.error(t("Không sao chép được"));
        }
      }}
      aria-label={t("Sao chép")}
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}

export function ErrorBox({ message, detail }: { message: string; detail?: string | undefined }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
      <p className="text-destructive">{t(message)}</p>
      {detail && detail !== message && (
        <>
          <button type="button" onClick={() => setOpen(!open)} className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} /> {t("Chi tiết kỹ thuật")} </button>
          {open && <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] text-muted-foreground">{detail}</pre>}
        </>
      )}
    </div>
  );
}

export function Notice({ tone = "warn", children }: { tone?: "warn" | "info"; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-md border p-3 text-sm", tone === "warn" ? "border-warning/40 bg-warning/10 text-warning" : "border-border bg-muted/40 text-muted-foreground")}>
      {children}
    </div>
  );
}
