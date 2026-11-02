import { english } from "./translations";

export type Language = "vi" | "en";
export type Translator = (text: string, ...values: unknown[]) => string;
export const DEFAULT_LANGUAGE: Language = "vi";

const templates = Object.entries(english)
  .filter(([key]) => /\{\d+\}/.test(key))
  .map(([key, value]) => {
    const parts = key.split(/(\{\d+\})/);
    const indexes: number[] = [];
    const pattern = parts.map((part) => {
      if (/^\{\d+\}$/.test(part)) {
        indexes.push(Number(part.slice(1, -1)));
        return "([\\s\\S]*?)";
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }).join("");
    return { regex: new RegExp(`^${pattern}$`), indexes, value };
  });

// Only our complete message templates are matched. Never replace fragments of
// arbitrary provider errors, contract names, addresses, or technical details.
export function translateText(language: Language, text: string, ...values: unknown[]): string {
  let translated = text;
  if (language === "en") {
    translated = english[text] ?? text;
    if (translated === text && values.length === 0) {
      for (const template of templates) {
        const match = template.regex.exec(text);
        if (!match) continue;
        const captures: string[] = [];
        template.indexes.forEach((index, i) => { captures[index] = translateText(language, match[i + 1] ?? ""); });
        return template.value.replace(/\{(\d+)\}/g, (_, index: string) => captures[Number(index)] ?? "");
      }
    }
  }
  return translated.replace(/\{(\d+)\}/g, (placeholder, index: string) => {
    const value = values[Number(index)];
    return value === undefined ? placeholder : String(value);
  });
}