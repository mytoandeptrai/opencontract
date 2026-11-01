import { BaseError, ContractFunctionRevertedError, UserRejectedRequestError } from "viem";

export interface Described {
  message: string;
  detail?: string | undefined;
  rejected?: boolean;
}

/** Strip anything that looks like a URL so RPC API keys are never shown in error text. */
function scrub(s: string): string {
  return s.replace(/https?:\/\/[^\s"')]+/g, (m) => {
    try {
      return new URL(m).host + "/…";
    } catch {
      return "<url>";
    }
  });
}

export function describeError(err: unknown): Described {
  if (err instanceof BaseError) {
    const rejected = err.walk((e) => e instanceof UserRejectedRequestError || (e as { code?: number }).code === 4001);
    if (rejected) return { message: "Người dùng đã từ chối yêu cầu trên wallet.", rejected: true, detail: scrub(err.message) };
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const reason =
        revert.data?.errorName
          ? `${revert.data.errorName}(${(revert.data.args ?? []).map((a) => String(a)).join(", ")})`
          : revert.reason ?? "không rõ lý do";
      return { message: `Contract revert: ${reason}`, detail: scrub(err.message) };
    }
    const name = err.name;
    const text = err.message;
    let message = err.shortMessage || text;
    if (name === "TimeoutError" || /timed? ?out/i.test(text)) message = "RPC timeout — endpoint không phản hồi kịp.";
    else if (/429|rate limit|too many requests/i.test(text)) message = "RPC bị giới hạn tần suất (rate limit). Thử lại sau hoặc dùng RPC khác.";
    else if (name === "HttpRequestError" && /fetch|Failed to fetch|NetworkError|Load failed/i.test(text))
      message = "Không thể kết nối RPC. Có thể do lỗi mạng hoặc RPC chặn CORS từ trình duyệt.";
    else if (/insufficient funds/i.test(text)) message = "Không đủ số dư để trả gas/giá trị giao dịch.";
    else if (name === "ContractFunctionZeroDataError" || /returned no data/i.test(text))
      message = "Contract trả về dữ liệu rỗng — ABI có thể không khớp, hoặc địa chỉ không có contract trên network này.";
    else if (/method not found|does not exist|not supported/i.test(text))
      message = "RPC không hỗ trợ phương thức được yêu cầu.";
    else if (name === "AbiDecodingDataSizeTooSmallError" || name === "AbiDecodingZeroDataError")
      message = "Không giải mã được kết quả — ABI có thể không khớp contract.";
    return { message: scrub(message), detail: scrub(text) };
  }
  if (err && typeof err === "object" && (err as { code?: number }).code === 4001)
    return { message: "Người dùng đã từ chối yêu cầu trên wallet.", rejected: true };
  if (err instanceof Error) return { message: scrub(err.message), detail: err.stack ? scrub(err.stack) : undefined };
  return { message: scrub(String(err)) };
}
