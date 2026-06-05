"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * MalayalamInterface — decorative Malayalam-language overlay panel
 * shown alongside the query input. Displays emotion tags, cultural context,
 * and language guidance for Malayalam screenplay queries.
 */

const EMOTION_TAGS = [
  { ml: "പ്രണയം", en: "Love", color: "#F43F5E" },
  { ml: "ത്യാഗം", en: "Sacrifice", color: "#8B5CF6" },
  { ml: "വിയോഗം", en: "Separation", color: "#6366F1" },
  { ml: "സംഘർഷം", en: "Conflict", color: "#EF4444" },
  { ml: "കാതരം", en: "Longing", color: "#EC4899" },
  { ml: "പ്രതീക്ഷ", en: "Hope", color: "#10B981" },
  { ml: "സന്തോഷം", en: "Joy", color: "#F59E0B" },
  { ml: "അഭിമാനം", en: "Pride", color: "#FDB022" },
];

const CULTURAL_NOTES = [
  {
    title: "Mollywood Narrative",
    ml: "ത്യാഗം — sacrifice — is culturally prized",
    icon: "🎬",
  },
  {
    title: "Emotional Language",
    ml: "പ്രണയ വേദന — love pain — is a core theme",
    icon: "❤️",
  },
  {
    title: "Kerala Setting",
    ml: "മഴ (rain) = grief, ഉദയം (dawn) = hope",
    icon: "🌴",
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
        <Sparkles className="w-4 h-4" style={{ color: "var(--accent-gold)" }} />
        <h3 className="text-sm font-semibold text-white">
          Malayalam Mode{" "}
          <span className="font-malayalam" style={{ color: "var(--accent-gold)" }}>
            — മലയാളം
          </span>
        </h3>
      </div>

      {/* Emotion tags */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
          Mollywood emotion vocabulary:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EMOTION_TAGS.map((tag) => (
            <motion.div
              key={tag.ml}
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg cursor-default"
              style={{
                background: `${tag.color}12`,
                border: `1px solid ${tag.color}28`,
              }}
            >
              <span
                className="font-malayalam text-xs font-medium"
                style={{ color: tag.color }}
              >
                {tag.ml}
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                · {tag.en}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cultural notes */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
          Cultural context:
        </p>
        <div className="space-y-2">
          {CULTURAL_NOTES.map((note) => (
            <div
              key={note.title}
              className="flex gap-2 p-2.5 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span className="text-base flex-shrink-0">{note.icon}</span>
              <div>
                <p className="text-xs font-medium text-white">{note.title}</p>
                <p
                  className="text-xs mt-0.5 font-malayalam"
                  style={{ color: "var(--text-muted)" }}
                >
                  {note.ml}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sample Malayalam queries */}
      {onQuerySelect && (
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
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
                  background: "rgba(253,176,34,0.04)",
                  border: "1px solid rgba(253,176,34,0.1)",
                  color: "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(253,176,34,0.1)";
                  e.currentTarget.style.borderColor = "rgba(253,176,34,0.3)";
                  e.currentTarget.style.color = "var(--accent-gold)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(253,176,34,0.04)";
                  e.currentTarget.style.borderColor = "rgba(253,176,34,0.1)";
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
