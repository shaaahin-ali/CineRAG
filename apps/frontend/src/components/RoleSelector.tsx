"use client";

import { motion } from "framer-motion";
import {
  Clapperboard,
  Drama,
  Camera,
  Music,
  Scissors,
  Briefcase,
} from "lucide-react";
import { CrewRole } from "@/types";

interface RoleSelectorProps {
  value: CrewRole | null;
  onChange: (role: CrewRole) => void;
  language?: "ml" | "en";
}

const ROLES: {
  value: CrewRole;
  icon: React.ComponentType<{ className?: string }>;
  en: string;
  ml: string;
  desc: string;
}[] = [
  {
    value: "director",
    icon: Clapperboard,
    en: "Director",
    ml: "സംവിധായകൻ",
    desc: "Narrative structure, pacing",
  },
  {
    value: "actor",
    icon: Drama,
    en: "Actor",
    ml: "നടൻ",
    desc: "Character arcs, emotions",
  },
  {
    value: "cinematographer",
    icon: Camera,
    en: "Cinematographer",
    ml: "ഛായാഗ്രാഹകൻ",
    desc: "INT/EXT, lighting, locations",
  },
  {
    value: "music",
    icon: Music,
    en: "Music",
    ml: "സംഗീതം",
    desc: "Emotional peaks, scenes",
  },
  {
    value: "editor",
    icon: Scissors,
    en: "Editor",
    ml: "എഡിറ്റർ",
    desc: "Scene flow, transitions",
  },
  {
    value: "producer",
    icon: Briefcase,
    en: "Producer",
    ml: "നിർമ്മാതാവ്",
    desc: "Locations, cast, budget",
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
        const Icon = role.icon;
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
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.02)",
              border: `1px solid ${
                isSelected ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)"
              }`,
            }}
          >
            {/* Selected indicator */}
            {isSelected && (
              <motion.div
                layoutId="role-active-bg"
                className="absolute inset-0 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
                transition={{ duration: 0.2 }}
              />
            )}

            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
              <Icon className={`h-4 w-4 ${isSelected ? "text-white" : "text-zinc-500"}`} />
            </span>
            <div className="relative min-w-0">
              <p
                className={`text-sm font-semibold leading-tight ${
                  language === "ml" ? "font-malayalam" : ""
                }`}
                style={{
                  color: isSelected ? "#ffffff" : "#a1a1aa",
                }}
              >
                {language === "ml" ? role.ml : role.en}
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-600">
                {role.desc}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
