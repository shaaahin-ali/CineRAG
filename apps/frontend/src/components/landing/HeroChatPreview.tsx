"use client";

import { motion } from "framer-motion";
import { Search, Clock, Film, ChevronRight } from "lucide-react";

const mockResults = [
  {
    id: 1,
    scene: "Scene 42 — Laboratory",
    snippet: "Inception — Full Cast",
    timestamp: "01:14:23",
    color: "var(--accent-blue)",
  },
  {
    id: 2,
    scene: "Scene 18 — Rooftop",
    snippet: "Strange Story — Alan Ward",
    timestamp: "00:38:07",
    color: "var(--accent-cyan)",
  },
  {
    id: 3,
    scene: "Scene 71 — Dream Level",
    snippet: "Interstellar — Cooper",
    timestamp: "02:04:51",
    color: "var(--accent-purple)",
  },
];

export function HeroChatPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-md mx-auto lg:mx-0"
      style={{ animation: "float 5s ease-in-out infinite" }}
    >
      {/* Outer glow */}
      <div
        className="absolute -inset-4 rounded-3xl pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(79,127,255,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Card */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background:   "var(--bg-card)",
          border:       "1px solid var(--border-card)",
          boxShadow:    "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,149,255,0.08)",
        }}
      >
        {/* Card header bar */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#F87171" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FBBF24" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#34D399" }} />
          </div>
          <span className="ml-2 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            cinerag — scene query
          </span>
        </div>

        {/* Search bar mock */}
        <div className="px-4 pt-4 pb-3">
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              background: "var(--bg-elevated)",
              border:     "1px solid rgba(79,127,255,0.2)",
            }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent-blue)" }} />
            <span className="text-sm flex-1" style={{ color: "var(--text-muted)" }}>
              Find the scene where they talk about the dream physics...
            </span>
            <div
              className="w-px h-4 animate-pulse"
              style={{ background: "var(--accent-blue)" }}
            />
          </div>
        </div>

        {/* Results label */}
        <div className="px-4 pb-2">
          <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Scene matches · 3 found
          </p>
        </div>

        {/* Result cards */}
        <div className="px-4 pb-4 flex flex-col gap-2">
          {mockResults.map((result, i) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.12 }}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200"
              style={{
                background: "var(--bg-elevated)",
                border:     "1px solid var(--border-subtle)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-accent)";
                e.currentTarget.style.background  = "var(--bg-card-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.background  = "var(--bg-elevated)";
              }}
            >
              {/* Color dot */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${result.color}20`, border: `1px solid ${result.color}30` }}
              >
                <Film className="w-3.5 h-3.5" style={{ color: result.color }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {result.snippet}
                </p>
                <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                  {result.scene}
                </p>
              </div>

              {/* Timestamp */}
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-md flex-shrink-0"
                style={{
                  background: "rgba(56,201,232,0.08)",
                  border:     "1px solid rgba(56,201,232,0.15)",
                }}
              >
                <Clock className="w-2.5 h-2.5" style={{ color: "var(--accent-cyan)" }} />
                <span className="text-[10px] font-mono font-semibold" style={{ color: "var(--accent-cyan)" }}>
                  {result.timestamp}
                </span>
              </div>

              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }} />
            </motion.div>
          ))}
        </div>

        {/* Typing indicator */}
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--accent-blue)" }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            AI is analyzing your screenplay…
          </span>
        </div>
      </div>
    </motion.div>
  );
}
