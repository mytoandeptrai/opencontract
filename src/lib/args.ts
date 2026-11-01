import { getAddress, isAddress, isHex, parseUnits, type AbiParameter } from "viem";

export class ArgError extends Error {}

function intBounds(type: string): { min: bigint; max: bigint } {
  const signed = type.startsWith("int");
  const bits = BigInt(type.replace(/^u?int/, "") || "256");
  return signed
    ? { min: -(1n << (bits - 1n)), max: (1n << (bits - 1n)) - 1n }
    : { min: 0n, max: (1n << bits) - 1n };
}

export function parseBigIntStrict(raw: string, label: string): bigint {
  const s = raw.trim().replace(/_/g, "");
  if (!/^-?(\d+|0x[0-9a-fA-F]+)$/.test(s)) throw new ArgError(`${label}: số nguyên không hợp lệ`);
  return s.startsWith("-") ? -BigInt(s.slice(1)) : BigInt(s);
}

/** Convert a JSON-ish value (from nested input) to a viem-ready value for a param. */
export function coerceValue(param: AbiParameter, value: unknown, label: string): unknown {
  const t = param.type;
  const arr = t.match(/^(.*)\[(\d*)\]$/);
  if (arr) {
    const inner = { ...param, type: arr[1]! } as AbiParameter;
    let list = value;
    if (typeof list === "string") {
      try {
        list = JSON.parse(list);
      } catch {
        throw new ArgError(`${label}: cần mảng JSON, ví dụ [1,2]`);
      }
    }
    if (!Array.isArray(list)) throw new ArgError(`${label}: cần một mảng`);
    if (arr[2] && list.length !== Number(arr[2])) throw new ArgError(`${label}: cần đúng ${arr[2]} phần tử`);
    return list.map((v, i) => coerceValue(inner, v, `${label}[${i}]`));
  }
  if (t === "tuple") {
    const comps = "components" in param ? param.components : [];
    let v = value;
    if (typeof v === "string") {
      try {
        v = JSON.parse(v);
      } catch {
        throw new ArgError(`${label}: cần tuple JSON (mảng hoặc object)`);
      }
    }
    if (Array.isArray(v)) {
      if (v.length !== comps.length) throw new ArgError(`${label}: tuple cần ${comps.length} phần tử`);
      const named = comps.every((c) => c.name);
      const out = comps.map((c, i) => coerceValue(c, v[i], `${label}.${c.name || i}`));
      return named ? Object.fromEntries(comps.map((c, i) => [c.name!, out[i]])) : out;
    }
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      return Object.fromEntries(
        comps.map((c, i) => {
          const k = c.name || String(i);
          if (!(k in o)) throw new ArgError(`${label}: thiếu trường "${k}"`);
          return [k, coerceValue(c, o[k], `${label}.${k}`)];
        }),
      );
    }
    throw new ArgError(`${label}: tuple không hợp lệ`);
  }
  if (t === "address") {
    const s = String(value ?? "").trim();
    if (!isAddress(s, { strict: false })) throw new ArgError(`${label}: địa chỉ không hợp lệ`);
    return getAddress(s);
  }
  if (t === "bool") {
    if (typeof value === "boolean") return value;
    const s = String(value).trim().toLowerCase();
    if (s === "true" || s === "1") return true;
    if (s === "false" || s === "0") return false;
    throw new ArgError(`${label}: cần true/false`);
  }
  if (t === "string") {
    if (typeof value !== "string") throw new ArgError(`${label}: cần chuỗi`);
    return value;
  }
  if (t.startsWith("bytes")) {
    const s = String(value ?? "").trim();
    if (!isHex(s, { strict: true }) || s.length % 2 !== 0) throw new ArgError(`${label}: cần hex dạng 0x… (số chữ số chẵn)`);
    const n = t.slice(5);
    if (n && (s.length - 2) / 2 !== Number(n)) throw new ArgError(`${label}: ${t} cần đúng ${n} byte`);
    return s;
  }
  if (/^u?int/.test(t)) {
    if (typeof value === "number" && !Number.isSafeInteger(value))
      throw new ArgError(`${label}: số quá lớn — hãy viết dưới dạng chuỗi "123…"`);
    const v = parseBigIntStrict(String(value), label);
    const { min, max } = intBounds(t);
    if (v < min || v > max) throw new ArgError(`${label}: ngoài phạm vi ${t}`);
    return v;
  }
  throw new ArgError(`${label}: kiểu ${t} chưa được hỗ trợ`);
}

export function isComplex(p: AbiParameter) {
  return p.type.endsWith("]") || p.type === "tuple";
}

export function buildArgs(params: readonly AbiParameter[], raw: string[]): unknown[] {
  return params.map((p, i) => {
    const label = p.name || `arg${i}`;
    const r = raw[i] ?? "";
    if (p.type === "string") return r;
    if (!isComplex(p) && !r.trim()) throw new ArgError(`${label}: bắt buộc`);
    return coerceValue(p, r, label);
  });
}

export function parseNative(raw: string, decimals: number): bigint {
  const s = raw.trim();
  if (!s) return 0n;
  if (!/^\d+(\.\d+)?$/.test(s)) throw new ArgError("Giá trị native không hợp lệ");
  const frac = s.split(".")[1];
  if (frac && frac.length > decimals) throw new ArgError(`Tối đa ${decimals} chữ số thập phân`);
  return parseUnits(s, decimals);
}

export function placeholderFor(p: AbiParameter): string {
  const t = p.type;
  if (t.endsWith("]")) return `JSON array, ví dụ ["…"]`;
  if (t === "tuple") return `JSON tuple, ví dụ {"field": …} hoặc […]`;
  if (t === "address") return "0x…";
  if (t === "bool") return "true / false";
  if (t.startsWith("bytes")) return "0x…";
  if (/^u?int/.test(t)) return "Số nguyên (thập phân hoặc 0x)";
  return t;
}

/** JSON-safe, bigint-aware stringify for display. */
export function stringify(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "bigint") return v.toString();
  return JSON.stringify(v, (_k, x) => (typeof x === "bigint" ? x.toString() : x), 2) ?? String(v);
}
