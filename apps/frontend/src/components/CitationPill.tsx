"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Clock, MapPin, Users } from "lucide-react";
import { Citation } from "@/types";

interface CitationPillProps {
  citation: Citation;
  index: number;
}

export function CitationPill({ citation, index }: CitationPillProps) {
  const [expanded, setExpanded] = useState(false);

  const emotionColors: Record<string, string> = {
    love: "#F43F5E",
    sacrifice: "#8B5CF6",
    conflict: "#EF4444",
    joy: "#F59E0B",
    hope: "#10B981",
    separation: "#6366F1",
    sadness: "#64748B",
    grief: "#64748B",
    longing: "#8B5CF6",
  };

  return (
    <div className="inline-block mb-2 mr-2">
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.08 }}
        onClick={() => setExpanded(!expanded)}
        className="citation-pill"
        aria-expanded={expanded}
        id={`citation-${citation.scene_number}-${index}`}
      >
        <Film className="w-3 h-3" />
        <span>Scene {citation.scene_number}</span>
        <span className="opacity-60">·</span>
        <span>p.{citation.page_start}–{citation.page_end}</span>
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mt-2 p-4 rounded-xl overflow-hidden"
            style={{
              background: "#0A0E1A",
              border: "1px solid rgba(253,176,34,0.2)",
              maxWidth: "380px",
            }}
          >
            {/* Heading */}
            <p className="text-xs font-semibold text-white mb-3">
              {citation.heading}
            </p>

            {/* Metadata row */}
            <div className="flex flex-wrap gap-3 mb-3">
              <span className="flex items-center gap-1 text-xs"
                style={{ color: "var(--text-muted)" }}>
                <MapPin className="w-3 h-3" />
                {citation.location}
              </span>
              <span className="flex items-center gap-1 text-xs"
                style={{ color: "var(--text-muted)" }}>
                <Clock className="w-3 h-3" />
                Pages {citation.page_start}–{citation.page_end}
              </span>
            </div>

            {/* Characters */}
            {citation.characters.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap mb-3">
                <Users className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                {citation.characters.map((char) => (
                  <span key={char}
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {char}
                  </span>
                ))}
              </div>
            )}

            {/* Emotions */}
            {citation.detected_emotions && citation.detected_emotions.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {citation.detected_emotions.map((emotion) => (
                  <span key={emotion}
                    className="emotion-badge"
                    style={{
                      background: `${emotionColors[emotion] || "#64748B"}18`,
                      color: emotionColors[emotion] || "#64748B",
                      border: `1px solid ${emotionColors[emotion] || "#64748B"}30`,
                    }}
                  >
                    {emotion}
                  </span>
                ))}
              </div>
            )}

            {/* Excerpt */}
            <p className="text-xs leading-relaxed"
              style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
              "{citation.excerpt.slice(0, 200)}{citation.excerpt.length > 200 ? "..." : ""}"
            </p>

            {/* Relevance score */}
            {citation.relevance_score !== undefined && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Relevance
                </span>
                <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: `${Math.round(citation.relevance_score * 100)}%`,
                      background: "var(--accent-gold)",
                    }}
                  />
                </div>
                <span className="text-xs" style={{ color: "var(--accent-gold)" }}>
                  {Math.round(citation.relevance_score * 100)}%
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
