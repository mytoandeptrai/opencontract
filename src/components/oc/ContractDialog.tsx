import { useLanguage } from "@/hooks/use-language";
import { useEffect, useRef, useState } from "react";
import { getAddress, isAddress } from "viem";
import { Upload } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseAbiInput } from "@/lib/abi";
import { useWorkspace } from "@/hooks/use-workspace";
import type { ContractEntry } from "@/types";
import { ErrorBox, Notice } from "./status";

export function ContractDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (o: boolean) => void; editing?: ContractEntry | undefined }) {
  const { t } = useLanguage();
  const ws = useWorkspace();
  const [name, setName] = useState("");
  const [networkId, setNetworkId] = useState("");
  const [address, setAddress] = useState("");
  const [abiText, setAbiText] = useState("");
  const [fromFile, setFromFile] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setErr({});
    setFromFile(false);
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
  }, [open, editing, ws.activeNetworkId, ws.networks]);

  const parsed = abiText.trim() ? parseAbiInput(abiText, fromFile) : null;

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
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="size-3.5" /> {t("Tải file .json")} </Button>
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
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("Hủy")}</Button>
          <Button onClick={submit} disabled={ws.networks.length === 0}>{editing ? t("Lưu") : t("Thêm contract")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
