import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider, useLanguage } from "@/hooks/use-language";

describe("RAM-only language preference", () => {
  it("keeps a change in React state and resets to English after remount", () => {
    const localWrite = vi.spyOn(Storage.prototype, "setItem");
    const first = renderHook(() => useLanguage(), { wrapper: LanguageProvider });
    expect(first.result.current.language).toBe("en");
    act(() => first.result.current.setLanguage("vi"));
    expect(first.result.current.language).toBe("vi");
    expect(localWrite).not.toHaveBeenCalled();
    first.unmount();
    const second = renderHook(() => useLanguage(), { wrapper: LanguageProvider });
    expect(second.result.current.language).toBe("en");
    second.unmount();
    localWrite.mockRestore();
  });
});