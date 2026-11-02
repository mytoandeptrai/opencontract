import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LANGUAGE, translateText, type Language, type Translator } from "@/lib/i18n";

interface LanguageContext {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translator;
}

const Context = createContext<LanguageContext | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const t = useCallback<Translator>((text, ...values) => translateText(language, text, ...values), [language]);
  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLanguage() {
  const context = useContext(Context);
  if (!context) throw new Error("useLanguage outside LanguageProvider");
  return context;
}