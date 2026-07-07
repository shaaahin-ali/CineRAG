"use client";

import { motion } from "framer-motion";
import { Sparkles, Film, Heart, TreePalm } from "lucide-react";

/**
 * MalayalamInterface — decorative Malayalam-language overlay panel
 * shown alongside the query input. Displays emotion tags, cultural context,
 * and language guidance for Malayalam screenplay queries.
 */

const EMOTION_TAGS = [
  { ml: "പ്രണയം", en: "Love" },
  { ml: "ത്യാഗം", en: "Sacrifice" },
  { ml: "വിയോഗം", en: "Separation" },
  { ml: "സംഘർഷം", en: "Conflict" },
  { ml: "കാതരം", en: "Longing" },
  { ml: "പ്രതീക്ഷ", en: "Hope" },
  { ml: "സന്തോഷം", en: "Joy" },
  { ml: "അഭിമാനം", en: "Pride" },
];

const CULTURAL_NOTES: {
  title: string;
  ml: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    title: "Mollywood Narrative",
    ml: "ത്യാഗം — sacrifice — is culturally prized",
    icon: Film,
  },
  {
    title: "Emotional Language",
    ml: "പ്രണയ വേദന — love pain — is a core theme",
    icon: Heart,
  },
  {
    title: "Kerala Setting",
    ml: "മഴ (rain) = grief, ഉദയം (dawn) = hope",
    icon: TreePalm,
  },
];

const SAMPLE_QUERIES_ML = [
  "കഥാപാത്രത്തിന്റെ വികാസം",
  "കുടുംബ സംഘർഷം",
  "പ്രണയ രംഗങ്ങൾ",
  "ക്ലൈമാക്സ് ഘടന",
];

interface MalayalamInterfaceProps {
  onQuerySelect?: (query: string) => void;
  isActive?: boolean;
}

export function MalayalamInterface({
  onQuerySelect,
  isActive = false,
}: MalayalamInterfaceProps) {
  return (
    <div
      id="malayalam-interface"
      className="space-y-5"
      style={{ opacity: isActive ? 1 : 0.85 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-white" />
        <h3 className="text-sm font-semibold text-white">
          Malayalam Mode{" "}
          <span className="font-malayalam text-zinc-400">
            — മലയാളം
          </span>
        </h3>
      </div>

      {/* Emotion tags */}
      <div>
        <p className="text-xs font-medium mb-2 text-zinc-500">
          Mollywood emotion vocabulary:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EMOTION_TAGS.map((tag) => (
            <motion.div
              key={tag.ml}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg cursor-default"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span
                className="font-malayalam text-xs font-medium text-zinc-300"
              >
                {tag.ml}
              </span>
              <span className="text-xs text-zinc-600">
                · {tag.en}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cultural notes */}
      <div>
        <p className="text-xs font-medium mb-2 text-zinc-500">
          Cultural context:
        </p>
        <div className="space-y-2">
          {CULTURAL_NOTES.map((note) => {
            const Icon = note.icon;
            return (
              <div
                key={note.title}
                className="flex gap-2 p-2.5 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.04] flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-zinc-400" />
                </span>
                <div>
                  <p className="text-xs font-medium text-white">{note.title}</p>
                  <p className="text-xs mt-0.5 font-malayalam text-zinc-500">
                    {note.ml}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sample Malayalam queries */}
      {onQuerySelect && (
        <div>
          <p className="text-xs font-medium mb-2 text-zinc-500">
            Try in Malayalam:
          </p>
          <div className="space-y-1.5">
            {SAMPLE_QUERIES_ML.map((q, i) => (
              <button
                key={i}
                id={`ml-sample-${i}`}
                onClick={() => onQuerySelect(q)}
                className="w-full text-left px-3 py-2 rounded-lg font-malayalam text-sm transition-all"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
