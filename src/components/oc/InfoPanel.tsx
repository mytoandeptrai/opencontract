import { useState } from "react";
import { getAddress, slice, type Hex } from "viem";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicClient, maskRpc, explorerAddress } from "@/lib/chain";
import { describeError } from "@/lib/errors";
import { useWorkspace } from "@/hooks/use-workspace";
import type { BytecodeStatus, ContractEntry, NetworkConfig } from "@/types";
import { CopyButton, ErrorBox, Notice } from "./status";
import { TxStatus } from "./FunctionCard";

const IMPL_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc" as Hex;
const ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103" as Hex;
const BEACON_SLOT = "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50" as Hex;

function slotAddr(v: Hex | undefined) {
  if (!v || BigInt(v) === 0n) return null;
  return getAddress(slice(v, 12, 32));
}

export function InfoPanel({ contract, network, bytecode }: { contract: ContractEntry; network: NetworkConfig; bytecode: BytecodeStatus }) {
  const ws = useWorkspace();
  const [proxy, setProxy] = useState<{ impl: string | null; admin: string | null; beacon: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<{ message: string; detail?: string | undefined } | null>(null);
  const txs = ws.txs.filter((t) => t.contractId === contract.id);
  const fnCount = contract.abi.filter((i) => i.type === "function").length;
  const evCount = contract.abi.filter((i) => i.type === "event").length;
  const addrUrl = explorerAddress(network, contract.address);

  const detect = async () => {
    setErr(null);
    setLoading(true);
    try {
      const c = getPublicClient(network);
      const [i, a, b] = await Promise.all([IMPL_SLOT, ADMIN_SLOT, BEACON_SLOT].map((slot) => c.getStorageAt({ address: contract.address, slot })));
      setProxy({ impl: slotAddr(i), admin: slotAddr(a), beacon: slotAddr(b) });
    } catch (e) {
      setErr(describeError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[160px_1fr]">
        <dt className="text-muted-foreground">Địa chỉ</dt>
        <dd className="flex items-center gap-1 break-all font-mono text-xs">{contract.address}<CopyButton value={contract.address} />{addrUrl && <a href={addrUrl} target="_blank" rel="noreferrer noopener" className="text-xs underline">explorer</a>}</dd>
        <dt className="text-muted-foreground">Network</dt>
        <dd>{network.name} · chain {network.chainId}</dd>
        <dt className="text-muted-foreground">RPC</dt>
        <dd className="font-mono text-xs">{maskRpc(network.rpcUrl)}</dd>
        <dt className="text-muted-foreground">Bytecode</dt>
        <dd className="text-xs">
          {bytecode.kind === "found" && `Có bytecode (${bytecode.size} byte). Điều này không có nghĩa contract đã được verify.`}
          {bytecode.kind === "empty" && <span className="text-warning">Không có bytecode — địa chỉ có thể không phải contract trên network này.</span>}
          {bytecode.kind === "checking" && "Đang kiểm tra…"}
          {bytecode.kind === "error" && <span className="text-destructive">Không kiểm tra được: {bytecode.message}</span>}
          {bytecode.kind === "unknown" && "Chưa kiểm tra"}
        </dd>
        <dt className="text-muted-foreground">ABI</dt>
        <dd className="text-xs">{fnCount} function · {evCount} event · nguồn {contract.abiSource}</dd>
      </dl>
      {contract.abiWarnings.length > 0 && <Notice>{contract.abiWarnings.join(" · ")}</Notice>}
      <Notice tone="info">ABI hợp lệ về cấu trúc không đảm bảo khớp với contract đã triển khai. Nếu không khớp, lời gọi có thể thất bại hoặc không giải mã được.</Notice>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Chẩn đoán proxy (ERC-1967)</h3>
          <Button size="sm" variant="outline" onClick={detect} disabled={loading}>{loading && <Loader2 className="size-3.5 animate-spin" />} Đọc storage slot</Button>
        </div>
        <p className="text-xs text-muted-foreground">Chỉ để tham khảo. OpenContract luôn gọi trực tiếp vào địa chỉ bạn nhập.</p>
        {err && <ErrorBox message={err.message} detail={err.detail} />}
        {proxy && (
          <div className="space-y-1 font-mono text-xs">
            <div>implementation: {proxy.impl ?? "—"}</div>
            <div>admin: {proxy.admin ?? "—"}</div>
            <div>beacon: {proxy.beacon ?? "—"}</div>
            {!proxy.impl && !proxy.beacon && <p className="font-sans text-muted-foreground">Không phát hiện proxy ERC-1967 (có thể dùng chuẩn khác hoặc không phải proxy).</p>}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium">Giao dịch trong phiên</h3>
        {txs.length === 0 ? <p className="text-xs text-muted-foreground">Chưa có giao dịch.</p> : txs.map((t) => (
          <div key={t.id} className="space-y-1">
            <p className="font-mono text-xs">{t.signature}</p>
            <TxStatus tx={t} network={network} />
          </div>
        ))}
      </section>
    </div>
  );
}
