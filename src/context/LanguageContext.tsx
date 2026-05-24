"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "../locales/en.json";
import hi from "../locales/hi.json";
import gu from "../locales/gu.json";

export type Language = "en" | "hi" | "gu";

const translations: Record<Language, any> = {
  en,
  hi,
  gu,
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("app_lang") as Language;
      if (savedLang && (savedLang === "en" || savedLang === "hi" || savedLang === "gu")) {
        setLanguageState(savedLang);
        document.documentElement.setAttribute("lang", savedLang);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("app_lang", lang);
      document.documentElement.setAttribute("lang", lang);
    }
  };

  const t = (path: string): string => {
    const keys = path.split(".");
    let result: any = translations[language];

    for (const key of keys) {
      if (result && result[key] !== undefined) {
        result = result[key];
      } else {
        // Fallback to English if translation key is missing in active locale
        let enResult: any = translations["en"];
        for (const enKey of keys) {
          if (enResult && enResult[enKey] !== undefined) {
            enResult = enResult[enKey];
          } else {
            return path;
          }
        }
        return enResult;
      }
    }

    return typeof result === "string" ? result : path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
