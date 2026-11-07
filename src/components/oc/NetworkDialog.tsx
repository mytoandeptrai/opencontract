import { useLanguage } from "@/hooks/use-language";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRESETS, validateNetworkDraft, type NetworkDraft } from "@/lib/chain";
import { normalizeExplorerApiUrl } from "@/lib/explorer";
import { useWorkspace } from "@/hooks/use-workspace";
import type { NetworkConfig } from "@/types";

const EMPTY: NetworkDraft = {
  name: "",
  chainId: "",
  rpcUrl: "",
  currencyName: "Ether",
  currencySymbol: "ETH",
  currencyDecimals: "18",
  explorerUrl: "",
  explorerApiUrl: "",
  explorerApiKey: "",
  color: "#4ade80",
};

function toDraft(n: Omit<NetworkConfig, "id">): NetworkDraft {
  return {
    name: n.name,
    chainId: String(n.chainId),
    rpcUrl: n.rpcUrl,
    currencyName: n.currencyName,
    currencySymbol: n.currencySymbol,
    currencyDecimals: String(n.currencyDecimals),
    explorerUrl: n.explorerUrl ?? "",
    explorerApiUrl: n.explorerApiUrl ?? "",
    explorerApiKey: n.explorerApiKey ?? "",
    color: n.color,
  };
}

export function NetworkDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: NetworkConfig | undefined;
}) {
  const { t } = useLanguage();
  const ws = useWorkspace();
  const [d, setD] = useState<NetworkDraft>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof NetworkDraft, string>>>({});

  useEffect(() => {
    if (open) {
      setD(editing ? toDraft(editing) : EMPTY);
      setErrors({});
    }
  }, [open, editing]);

  const field = (
    k: keyof NetworkDraft,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <div className="space-y-1">
      <Label htmlFor={`net-${k}`} className="text-xs">
        {label}
      </Label>
      <Input
        id={`net-${k}`}
        value={d[k]}
        onChange={(e) => setD({ ...d, [k]: e.target.value })}
        {...props}
      />
      {errors[k] && <p className="text-xs text-destructive">{t(errors[k] ?? "")}</p>}
    </div>
  );

  const submit = () => {
    const e = validateNetworkDraft(d);
    setErrors(e);
    if (Object.keys(e).length) return;
    const explorerApiUrl = normalizeExplorerApiUrl(d.explorerApiUrl.trim() || d.explorerUrl.trim());
    const n = {
      name: d.name.trim(),
      chainId: Number(d.chainId),
      rpcUrl: d.rpcUrl.trim(),
      currencyName: d.currencyName.trim(),
      currencySymbol: d.currencySymbol.trim(),
      currencyDecimals: Number(d.currencyDecimals),
      color: d.color,
      ...(d.explorerUrl.trim() ? { explorerUrl: d.explorerUrl.trim() } : {}),
      ...(explorerApiUrl ? { explorerApiUrl } : {}),
      ...(d.explorerApiKey.trim() ? { explorerApiKey: d.explorerApiKey.trim() } : {}),
    };
    if (editing) ws.updateNetwork({ ...n, id: editing.id });
    else ws.addNetwork(n);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("Sửa network") : t("Thêm network EVM")}</DialogTitle>
        </DialogHeader>
        {!editing && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">
              {t("Điền nhanh từ mẫu (có thể thay RPC bằng endpoint riêng):")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.chainId}
                  type="button"
                  onClick={() => setD(toDraft(p))}
                  className="rounded border border-border px-2 py-0.5 text-xs hover:bg-accent"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">{field("name", t("Tên network"))}</div>
          {field("chainId", "Chain ID", { inputMode: "numeric", className: "font-mono" })}
          <div className="space-y-1">
            <Label htmlFor="net-color" className="text-xs">
              {t("Màu nhận diện")}
            </Label>
            <Input
              id="net-color"
              type="color"
              value={d.color}
              onChange={(e) => setD({ ...d, color: e.target.value })}
              className="h-9 p-1"
            />
          </div>
          <div className="col-span-2">
            {field("rpcUrl", "RPC URL", {
              className: "font-mono text-xs",
              placeholder: "https://…",
              autoComplete: "off",
              spellCheck: false,
            })}
          </div>
          {field("currencyName", t("Tên native currency"))}
          {field("currencySymbol", t("Ký hiệu"))}
          {field("currencyDecimals", "Decimals", { inputMode: "numeric" })}
          {field("explorerUrl", t("Block explorer (tùy chọn)"), { placeholder: "https://…" })}
          <div className="col-span-2">
            {field("explorerApiUrl", t("Explorer ABI API URL"), {
              placeholder: "https://explorer.example",
              className: "font-mono text-xs",
              autoComplete: "off",
              spellCheck: false,
            })}
            <p className="mt-1 text-[11px] text-muted-foreground">
              {t(
                "Có thể nhập URL trang Explorer hoặc /api-docs; endpoint API sẽ được tự chuẩn hóa.",
              )}
            </p>
          </div>
          <div className="col-span-2">
            {field("explorerApiKey", t("Explorer API key (không bắt buộc)"), {
              type: "password",
              autoComplete: "new-password",
              spellCheck: false,
            })}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {t(
            "RPC URL và Explorer API key chỉ nằm trong bộ nhớ của tab này. API key không bắt buộc và chỉ được gửi tới Explorer API URL đã cấu hình.",
          )}
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("Hủy")}
          </Button>
          <Button onClick={submit}>
            {editing ? t("Lưu & kiểm tra") : t("Thêm & kiểm tra RPC")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
