import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { type Language, type TranslationKey, t } from "@/lib/i18n";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("isc-lang");
      if (saved === "zh" || saved === "en") return saved;
    }
    return "zh";
  });

  const handleSetLang = useCallback((newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("isc-lang", newLang);
  }, []);

  const toggleLang = useCallback(() => {
    handleSetLang(lang === "zh" ? "en" : "zh");
  }, [lang, handleSetLang]);

  const translate = useCallback(
    (key: TranslationKey) => t(key, lang),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, toggleLang, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
