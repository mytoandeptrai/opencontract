import { useLanguage } from "@/hooks/use-language";
import { useEffect, useRef, useState } from "react";
import { getAddress, isAddress } from "viem";
import { Loader2, Search, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseAbiInput } from "@/lib/abi";
import { canAutoDetectAbi } from "@/lib/explorer";
import { useAutoDetectAbi } from "@/hooks/use-auto-detect-abi";
import { useWorkspace } from "@/hooks/use-workspace";
import type { ContractEntry } from "@/types";
import { ErrorBox, Notice } from "./status";
import { toast } from "sonner";

export function ContractDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (o: boolean) => void; editing?: ContractEntry | undefined }) {
  const { t } = useLanguage();
  const ws = useWorkspace();
  const [name, setName] = useState("");
  const [networkId, setNetworkId] = useState("");
  const [address, setAddress] = useState("");
  const [abiText, setAbiText] = useState("");
  const [fromFile, setFromFile] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [detectedAbi, setDetectedAbi] = useState<{ abi: import("viem").Abi; warnings: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abiTextRef = useRef(abiText);
  const targetRef = useRef("");
  const { state: detectState, detect, reset: resetDetection } = useAutoDetectAbi();
  const selectedNetwork = ws.networks.find((network) => network.id === networkId);
  const target = `${networkId}|${address.trim()}`;
  abiTextRef.current = abiText;
  targetRef.current = target;

  useEffect(() => {
    if (!open) return;
    setErr({});
    setFromFile(false);
    setDetectedAbi(null);
    setReplaceOpen(false);
    resetDetection();
    if (editing) {
      setName(editing.name);
      setNetworkId(editing.networkId);
      setAddress(editing.address);
      setAbiText(JSON.stringify(editing.abi, null, 2));
    } else {
      setName("");
      setNetworkId(ws.activeNetworkId ?? ws.networks[0]?.id ?? "");
      setAddress("");
      setAbiText("");
    }
  }, [open, editing, ws.activeNetworkId, ws.networks, resetDetection]);

  useEffect(() => {
    resetDetection();
  }, [networkId, address, resetDetection]);

  const parsed = abiText.trim() ? parseAbiInput(abiText, fromFile) : null;

  const startDetection = async () => {
    if (!selectedNetwork || !canAutoDetectAbi(selectedNetwork, address)) return;
    const requestTarget = targetRef.current;
    const result = await detect(selectedNetwork, address.trim());
    if (!result || targetRef.current !== requestTarget) return;
    if (abiTextRef.current.trim()) {
      setDetectedAbi({ abi: result.abi, warnings: result.warnings });
      setReplaceOpen(true);
      return;
    }
    setAbiText(JSON.stringify(result.abi, null, 2));
    setFromFile(false);
    setErr((current) => ({ ...current, abi: "" }));
    toast.success(t("Đã dò và kiểm tra ABI thành công."));
  };

  const acceptDetectedAbi = () => {
    if (!detectedAbi) return;
    setAbiText(JSON.stringify(detectedAbi.abi, null, 2));
    setFromFile(false);
    setErr((current) => ({ ...current, abi: "" }));
    setDetectedAbi(null);
    setReplaceOpen(false);
    toast.success(t("Đã dò và kiểm tra ABI thành công."));
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e["name"] = t("Bắt buộc");
    if (!networkId) e["network"] = t("Chọn network");
    if (!isAddress(address.trim(), { strict: false })) e["address"] = t("Địa chỉ không hợp lệ");
    if (!parsed) e["abi"] = t("Chưa nhập ABI");
    else if (!parsed.ok) e["abi"] = parsed.error;
    setErr(e);
    if (Object.keys(e).length || !parsed || !parsed.ok) return;
    const entry = { name: name.trim(), networkId, address: getAddress(address.trim()), abi: parsed.abi, abiSource: parsed.source, abiWarnings: parsed.warnings };
    if (editing) ws.updateContract({ ...entry, id: editing.id });
    else ws.addContract(entry);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? t("Sửa contract") : t("Thêm contract")}</DialogTitle>
        </DialogHeader>
        {ws.networks.length === 0 ? (
          <Notice>{t("Hãy thêm một network trước khi thêm contract.")}</Notice>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs" htmlFor="c-name">{t("Tên / biệt danh")}</Label>
                <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="MyToken" />
                {err["name"] && <p className="text-xs text-destructive">{err["name"]}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Network</Label>
                <Select value={networkId} onValueChange={setNetworkId}>
                  <SelectTrigger><SelectValue placeholder={t("Chọn network")} /></SelectTrigger>
                  <SelectContent>
                    {ws.networks.map((n) => (
                      <SelectItem key={n.id} value={n.id}>{n.name} ({n.chainId})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {err["network"] && <p className="text-xs text-destructive">{err["network"]}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="c-addr">{t("Địa chỉ contract (proxy hoặc thường)")}</Label>
              <Input id="c-addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x…" className="font-mono" spellCheck={false} />
              {err["address"] && <p className="text-xs text-destructive">{err["address"]}</p>}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs" htmlFor="c-abi">{t("ABI JSON hoặc artifact Hardhat / Foundry")}</Label>
                <div className="flex flex-wrap gap-2">
                  {canAutoDetectAbi(selectedNetwork, address) && (
                    <Button type="button" variant="outline" size="sm" onClick={() => void startDetection()} disabled={detectState.kind === "loading"}>
                      {detectState.kind === "loading" ? <Loader2 className="size-3.5 animate-spin" /> : <Search className="size-3.5" />}
                      {detectState.kind === "loading" ? t("Đang dò ABI…") : t("Tự dò ABI")}
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload className="size-3.5" /> {t("Tải file .json")}
                  </Button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setAbiText(await f.text());
                    setFromFile(true);
                    if (!name) setName(f.name.replace(/\.json$/i, ""));
                    e.target.value = "";
                  }}
                />
              </div>
              <Textarea id="c-abi" value={abiText} onChange={(e) => { setAbiText(e.target.value); setFromFile(false); }} rows={10} className="font-mono text-xs" placeholder='[{"type":"function","name":"balanceOf",…}]' spellCheck={false} />
              {parsed && !parsed.ok && <ErrorBox message={parsed.error} />}
              {parsed?.ok && (
                <p className="text-xs text-success">
                  {t("ABI hợp lệ về cấu trúc ·")} {parsed.abi.filter((i) => i.type === "function").length} function · {parsed.abi.filter((i) => i.type === "event").length} {t("event · nguồn:")} {parsed.source}
                  {parsed.warnings.length > 0 && <span className="block text-warning">{parsed.warnings.map((warning) => t(warning)).join(" · ")}</span>}
                </p>
              )}
              {err["abi"] && !parsed && <p className="text-xs text-destructive">{err["abi"]}</p>}
              {detectState.kind === "success" && (
                <p role="status" className="text-xs text-success">
                  {t("Đã dò và kiểm tra ABI thành công.")} {detectState.functions} {t("function")}, {detectState.events} {t("event")}, {detectState.errors} {t("error")}
                </p>
              )}
              {(detectState.kind === "error" || detectState.kind === "not-found") && (
                <div className="space-y-2" role="status">
                  <ErrorBox message={detectState.message} detail={detectState.detail} />
                  {canAutoDetectAbi(selectedNetwork, address) && (
                    <Button type="button" size="sm" variant="outline" onClick={() => void startDetection()} disabled={detectState.kind === "loading"}>
                      {t("Thử lại")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("Hủy")}</Button>
          <Button onClick={submit} disabled={ws.networks.length === 0}>{editing ? t("Lưu") : t("Thêm contract")}</Button>
        </DialogFooter>
      </DialogContent>
      <AlertDialog open={replaceOpen} onOpenChange={setReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Thay thế ABI hiện tại?")}</AlertDialogTitle>
            <AlertDialogDescription>{t("Trình soạn ABI đã có nội dung. Bạn có muốn thay nội dung đó bằng ABI lấy từ Explorer không?")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDetectedAbi(null)}>{t("Giữ ABI hiện tại")}</AlertDialogCancel>
            <AlertDialogAction onClick={acceptDetectedAbi}>{t("Thay thế ABI")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
