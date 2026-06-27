"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Language } from "@/types";

interface LanguageToggleProps {
  value: Language;
  onChange: (lang: Language) => void;
}

const LANGS: { id: Language; label: string; sublabel: string; activeColor: string; activeBg: string; activeBorder: string }[] = [
  {
    id: "en",
    label: "English",
    sublabel: "EN",
    activeColor: "#60A5FA",
    activeBg: "rgba(96,165,250,0.10)",
    activeBorder: "rgba(96,165,250,0.30)",
  },
  {
    id: "ml",
    label: "മലയാളം",
    sublabel: "ML",
    activeColor: "#FDB022",
    activeBg: "rgba(253,176,34,0.10)",
    activeBorder: "rgba(253,176,34,0.30)",
  },
];

export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  const active = LANGS.find((l) => l.id === value)!;

  return (
    <div
      role="group"
      aria-label="Response language selection"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "3px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        position: "relative",
      }}
    >
      {/* Active pulsing dot badge */}
      <div
        style={{
          position: "absolute",
          top: -4,
          right: -4,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: active.activeColor,
          boxShadow: `0 0 0 2px rgba(0,0,0,0.8), 0 0 6px ${active.activeColor}`,
          animation: "pulse 2s ease-in-out infinite",
          zIndex: 10,
        }}
      />

      {LANGS.map((lang) => {
        const isActive = value === lang.id;
        return (
          <button
            key={lang.id}
            id={`lang-toggle-${lang.id}`}
            onClick={() => onChange(lang.id)}
            aria-pressed={isActive}
            title={`Switch responses to ${lang.label}`}
            style={{
              position: "relative",
              padding: "5px 12px",
              borderRadius: 9,
              border: "none",
              background: "transparent",
              cursor: isActive ? "default" : "pointer",
              transition: "all 0.18s ease",
              outline: "none",
            }}
          >
            {/* Active highlight background */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="lang-active-bg"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 9,
                    background: lang.activeBg,
                    border: `1px solid ${lang.activeBorder}`,
                  }}
                />
              )}
            </AnimatePresence>

            {/* Label */}
            <span
              style={{
                position: "relative",
                fontSize: "11px",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? lang.activeColor : "rgba(255,255,255,0.35)",
                letterSpacing: isActive ? "0.02em" : "0",
                fontFamily: lang.id === "ml" ? "'Noto Sans Malayalam', sans-serif" : "inherit",
                transition: "color 0.18s ease, font-weight 0.18s ease",
              }}
            >
              {lang.label}
            </span>
          </button>
        );
      })}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
