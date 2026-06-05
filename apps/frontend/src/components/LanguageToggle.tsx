"use client";

import { motion } from "framer-motion";
import { Language } from "@/types";

interface LanguageToggleProps {
  value: Language;
  onChange: (lang: Language) => void;
}

export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-lg"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      role="group"
      aria-label="Language selection"
    >
      {(["ml", "en"] as Language[]).map((lang) => (
        <button
          key={lang}
          id={`lang-toggle-${lang}`}
          onClick={() => onChange(lang)}
          className="relative px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
          style={{
            color: value === lang ? (lang === "ml" ? "#FDB022" : "#60A5FA") : "var(--text-muted)",
          }}
          aria-pressed={value === lang}
        >
          {value === lang && (
            <motion.div
              layoutId="lang-active"
              className="absolute inset-0 rounded-md"
              style={{
                background: lang === "ml" ? "rgba(253,176,34,0.1)" : "rgba(96,165,250,0.1)",
                border: `1px solid ${lang === "ml" ? "rgba(253,176,34,0.25)" : "rgba(96,165,250,0.25)"}`,
              }}
              transition={{ duration: 0.2 }}
            />
          )}
          <span className={`relative ${lang === "ml" ? "font-malayalam" : ""}`}>
            {lang === "ml" ? "മലയാളം" : "English"}
          </span>
        </button>
      ))}
    </div>
  );
}
