"use client";

import { motion } from "framer-motion";
import { CrewRole } from "@/types";

interface RoleSelectorProps {
  value: CrewRole | null;
  onChange: (role: CrewRole) => void;
  language?: "ml" | "en";
}

const ROLES: {
  value: CrewRole;
  emoji: string;
  en: string;
  ml: string;
  desc: string;
  color: string;
}[] = [
  {
    value: "director",
    emoji: "🎬",
    en: "Director",
    ml: "സംവിധായകൻ",
    desc: "Narrative structure, pacing",
    color: "#FDB022",
  },
  {
    value: "actor",
    emoji: "🎭",
    en: "Actor",
    ml: "നടൻ",
    desc: "Character arcs, emotions",
    color: "#F43F5E",
  },
  {
    value: "cinematographer",
    emoji: "📽️",
    en: "Cinematographer",
    ml: "ഛായാഗ്രാഹകൻ",
    desc: "INT/EXT, lighting, locations",
    color: "#60A5FA",
  },
  {
    value: "music",
    emoji: "🎵",
    en: "Music",
    ml: "സംഗീതം",
    desc: "Emotional peaks, scenes",
    color: "#8B5CF6",
  },
  {
    value: "editor",
    emoji: "✂️",
    en: "Editor",
    ml: "എഡിറ്റർ",
    desc: "Scene flow, transitions",
    color: "#10B981",
  },
  {
    value: "producer",
    emoji: "📋",
    en: "Producer",
    ml: "നിർമ്മാതാവ്",
    desc: "Locations, cast, budget",
    color: "#F59E0B",
  },
];

export function RoleSelector({
  value,
  onChange,
  language = "en",
}: RoleSelectorProps) {
  return (
    <div id="role-selector" className="grid grid-cols-2 gap-2">
      {ROLES.map((role) => {
        const isSelected = value === role.value;
        return (
          <motion.button
            key={role.value}
            id={`role-btn-${role.value}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(role.value)}
            className="relative flex items-center gap-2.5 rounded-xl p-3 text-left transition-all"
            style={{
              background: isSelected
                ? `${role.color}12`
                : "rgba(255,255,255,0.02)",
              border: `1px solid ${
                isSelected ? `${role.color}35` : "rgba(255,255,255,0.06)"
              }`,
            }}
          >
            {/* Selected indicator */}
            {isSelected && (
              <motion.div
                layoutId="role-active-bg"
                className="absolute inset-0 rounded-xl"
                style={{
                  background: `${role.color}08`,
                  border: `1px solid ${role.color}30`,
                }}
                transition={{ duration: 0.2 }}
              />
            )}

            <span className="relative text-xl">{role.emoji}</span>
            <div className="relative min-w-0">
              <p
                className={`text-sm font-semibold leading-tight ${
                  language === "ml" ? "font-malayalam" : ""
                }`}
                style={{
                  color: isSelected ? role.color : "#ffffff",
                }}
              >
                {language === "ml" ? role.ml : role.en}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {role.desc}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
