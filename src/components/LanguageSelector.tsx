"use client";

import { useTranslation, Language } from "../context/LanguageContext";
import { useState } from "react";

export default function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "hi", name: "हिन्दी (Hindi)", flag: "🇮🇳" },
    { code: "gu", name: "ગુજરાતી (Gujarati)", flag: "🇮🇳" },
  ];

  const activeLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <div className="relative inline-block text-left z-50">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] backdrop-blur-md text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/[0.07] hover:border-white/20 transition-all duration-200 shadow-lg"
      >
        <span>{activeLang.flag}</span>
        <span>{activeLang.name}</span>
        <svg
          className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 cursor-default bg-transparent w-full h-full z-40 outline-none"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-40 origin-top-right rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-lg shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none p-1.5 z-50 animate-fade-in">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                  language === lang.code
                    ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/20"
                    : "text-gray-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
