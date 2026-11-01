import { formatAbiItem } from "viem/utils";
import type { Abi, AbiEvent, AbiFunction, AbiParameter } from "viem";
import type { AbiSource, EventItem, FunctionItem } from "@/types";

export type ParseResult =
  | { ok: true; abi: Abi; source: AbiSource; warnings: string[] }
  | { ok: false; error: string };

const ITEM_TYPES = new Set(["function", "event", "error", "constructor", "fallback", "receive"]);
const MUTABILITY = new Set(["view", "pure", "nonpayable", "payable"]);
const TYPE_RE = /^(address|bool|string|bytes([1-9]|[12][0-9]|3[0-2])?|u?int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?|tuple|function)(\[\d*\])*$/;

function validateParam(p: unknown, path: string): string | null {
  if (!p || typeof p !== "object") return `${path}: tham số không phải object`;
  const o = p as Record<string, unknown>;
  if (typeof o["type"] !== "string") return `${path}: thiếu "type"`;
  const t = o["type"];
  if (!TYPE_RE.test(t)) return `${path}: kiểu "${t}" không hợp lệ`;
  if (t.startsWith("tuple")) {
    const comps = o["components"];
    if (!Array.isArray(comps)) return `${path}: tuple thiếu "components"`;
    for (let i = 0; i < comps.length; i++) {
      const e = validateParam(comps[i], `${path}.components[${i}]`);
      if (e) return e;
    }
  }
  return null;
}

export function validateAbiArray(arr: unknown[]): { error?: string; warnings: string[] } {
  const warnings: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    const it = arr[i];
    if (!it || typeof it !== "object") return { error: `Phần tử [${i}] không phải object`, warnings };
    const o = it as Record<string, unknown>;
    const type = (o["type"] as string | undefined) ?? "function";
    if (!ITEM_TYPES.has(type)) return { error: `Phần tử [${i}]: type "${String(type)}" không hợp lệ`, warnings };
    if (type === "function" || type === "event" || type === "error") {
      if (typeof o["name"] !== "string" || !o["name"]) return { error: `Phần tử [${i}] (${type}) thiếu "name"`, warnings };
    }
    if (type === "function") {
      const sm = o["stateMutability"];
      if (sm === undefined) {
        // legacy ABI: constant/payable
        o["stateMutability"] = o["constant"] ? "view" : o["payable"] ? "payable" : "nonpayable";
        warnings.push(`${String(o["name"])}: ABI kiểu cũ, suy ra stateMutability = ${String(o["stateMutability"])}`);
      } else if (typeof sm !== "string" || !MUTABILITY.has(sm))
        return { error: `${String(o["name"])}: stateMutability "${String(sm)}" không hợp lệ`, warnings };
      if (!Array.isArray(o["outputs"])) o["outputs"] = [];
    }
    if (type !== "fallback" && type !== "receive") {
      const inputs = o["inputs"] ?? [];
      if (!Array.isArray(inputs)) return { error: `Phần tử [${i}]: "inputs" phải là array`, warnings };
      o["inputs"] = inputs;
      for (let j = 0; j < inputs.length; j++) {
        const e = validateParam(inputs[j], `${String(o["name"] ?? type)}.inputs[${j}]`);
        if (e) return { error: e, warnings };
      }
    }
    if (Array.isArray(o["outputs"])) {
      const outs = o["outputs"] as unknown[];
      for (let j = 0; j < outs.length; j++) {
        const e = validateParam(outs[j], `${String(o["name"])}.outputs[${j}]`);
        if (e) return { error: e, warnings };
      }
    }
  }
  return { warnings };
}

/** Parse pasted text or file contents: plain ABI array, Hardhat or Foundry artifact. */
export function parseAbiInput(text: string, fromFile = false): ParseResult {
  if (!text.trim()) return { ok: false, error: "Chưa có nội dung ABI." };
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `JSON không hợp lệ: ${(e as Error).message}` };
  }
  let arr: unknown;
  let source: AbiSource = fromFile ? "file" : "paste";
  if (Array.isArray(json)) arr = json;
  else if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    if (Array.isArray(o["abi"])) {
      arr = o["abi"];
      if (o["_format"] === "hh-sol-artifact-1" || "contractName" in o || "linkReferences" in o) source = "hardhat";
      else if ("bytecode" in o && typeof o["bytecode"] === "object") source = "foundry";
      else if ("methodIdentifiers" in o || "ast" in o) source = "foundry";
      else source = "hardhat";
    } else if (typeof o["abi"] === "string") {
      try {
        const inner = JSON.parse(o["abi"]);
        if (Array.isArray(inner)) arr = inner;
      } catch {
        /* fallthrough */
      }
    }
    if (!arr) return { ok: false, error: 'Không tìm thấy ABI. Cần một mảng ABI hoặc artifact có trường "abi".' };
  } else return { ok: false, error: "ABI phải là mảng JSON hoặc artifact object." };

  const items = structuredClone(arr) as unknown[];
  const { error, warnings } = validateAbiArray(items);
  if (error) return { ok: false, error };
  const abi = items as Abi;
  if (!abi.some((i) => i.type === "function")) warnings.push("ABI không có function nào.");
  return { ok: true, abi, source, warnings };
}

function hasFunctionType(p: AbiParameter): boolean {
  if (p.type.startsWith("function")) return true;
  if ("components" in p && p.components) return p.components.some(hasFunctionType);
  return false;
}

export function signatureOf(item: AbiFunction | AbiEvent): string {
  return formatAbiItem(item);
}

export function listFunctions(abi: Abi): { reads: FunctionItem[]; writes: FunctionItem[] } {
  const fns = abi.filter((i): i is AbiFunction => i.type === "function");
  const count = new Map<string, number>();
  fns.forEach((f) => count.set(f.name, (count.get(f.name) ?? 0) + 1));
  const items: FunctionItem[] = fns.map((fn) => {
    let sig: string;
    try {
      sig = signatureOf(fn);
    } catch {
      sig = `${fn.name}(?)`;
    }
    const unsupported = [...fn.inputs, ...fn.outputs].some(hasFunctionType)
      ? "Kiểu `function` chưa được hỗ trợ trong MVP."
      : undefined;
    return { key: sig, signature: sig, fn, overloaded: (count.get(fn.name) ?? 0) > 1, ...(unsupported ? { unsupported } : {}) };
  });
  items.sort((a, b) => a.signature.localeCompare(b.signature));
  return {
    reads: items.filter((i) => i.fn.stateMutability === "view" || i.fn.stateMutability === "pure"),
    writes: items.filter((i) => i.fn.stateMutability === "nonpayable" || i.fn.stateMutability === "payable"),
  };
}

export function listEvents(abi: Abi): EventItem[] {
  return abi
    .filter((i): i is AbiEvent => i.type === "event")
    .map((event) => {
      const sig = signatureOf(event);
      return { key: sig, signature: sig, event };
    })
    .sort((a, b) => a.signature.localeCompare(b.signature));
}
