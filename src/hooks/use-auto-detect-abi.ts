import { useCallback, useRef, useState } from "react";
import type { Abi } from "viem";
import type { NetworkConfig } from "@/types";
import { detectContractAbi } from "@/lib/explorer";

export type AutoDetectState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; functions: number; events: number; errors: number }
  | { kind: "not-found"; message: string; detail?: string }
  | { kind: "error"; message: string; detail?: string };

export interface AutoDetectOutcome {
  kind: "success";
  abi: Abi;
  warnings: string[];
}

export function useAutoDetectAbi() {
  const [state, setState] = useState<AutoDetectState>({ kind: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState({ kind: "idle" });
  }, []);

  const detect = useCallback(
    async (network: NetworkConfig, address: string): Promise<AutoDetectOutcome | null> => {
      if (controllerRef.current) return null;
      const controller = new AbortController();
      controllerRef.current = controller;
      const timeout = setTimeout(() => controller.abort(), 15_000);
      setState({ kind: "loading" });
      try {
        const result = await detectContractAbi(network, address, controller.signal);
        if (result.kind === "success") {
          setState({
            kind: "success",
            functions: result.abi.filter((item) => item.type === "function").length,
            events: result.abi.filter((item) => item.type === "event").length,
            errors: result.abi.filter((item) => item.type === "error").length,
          });
          return result;
        }
        setState(result);
        return null;
      } catch {
        setState({ kind: "error", message: "Không thể hoàn tất yêu cầu dò ABI." });
        return null;
      } finally {
        clearTimeout(timeout);
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
    [],
  );

  return { state, detect, reset };
}
