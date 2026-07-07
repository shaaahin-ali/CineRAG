"use client";

import { motion } from "framer-motion";
import { Search, Clock, Clapperboard, Wand2 } from "lucide-react";

const features = [
  {
    id:          "semantic",
    icon:        Search,
    accentColor: "var(--accent-blue)",
    accentDim:   "rgba(79,127,255,0.12)",
    accentBorder:"rgba(79,127,255,0.2)",
    tag:         "Search",
    title:       "Semantic Search",
    description:
      "Find what you mean, not just keywords. Vector embeddings surface the exact dramatic moment across thousands of scenes.",
  },
  {
    id:          "citations",
    icon:        Clock,
    accentColor: "var(--accent-cyan)",
    accentDim:   "rgba(56,201,232,0.10)",
    accentBorder:"rgba(56,201,232,0.2)",
    tag:         "Accuracy",
    title:       "Timestamp Citations",
    description:
      "Every AI answer links back to the exact scene, page range, characters present, and emotional beat — no hallucination.",
  },
  {
    id:          "scene",
    icon:        Clapperboard,
    accentColor: "var(--accent-purple)",
    accentDim:   "rgba(139,92,246,0.10)",
    accentBorder:"rgba(139,92,246,0.2)",
    tag:         "Analysis",
    title:       "Scene Breakdown",
    description:
      "The AI reads stage directions, detects emotion, parses characters, and generates visual storyboard shots per scene.",
  },
  {
    id:          "workflow",
    icon:        Wand2,
    accentColor: "var(--accent-green)",
    accentDim:   "rgba(34,211,160,0.10)",
    accentBorder:"rgba(34,211,160,0.2)",
    tag:         "Creation",
    title:       "Creator Workflow",
    description:
      "Role-based intelligence for Directors, Editors, Cinematographers, and Producers — each gets answers tailored to their craft.",
  },
];

export function FeaturesGrid() {
  return (
    <section
      id="features"
      className="relative z-10 py-24 md:py-32 px-6"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Subtle top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(79,127,255,0.2), rgba(56,201,232,0.15), transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="text-center mb-16 md:mb-20"
        >
          <p
            className="text-xs uppercase tracking-[0.4em] font-mono mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            Built for Filmmakers
          </p>
          <h2
            className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            A RAG pipeline that understands{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor:  "transparent",
                backgroundClip:       "text",
              }}
            >
              cinema
            </span>
            , not filenames.
          </h2>
          <p
            className="text-base max-w-xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Every tool designed for the way modern screenplays are written,
            analysed, and brought to life.
          </p>
        </motion.div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="feature-card flex flex-col"
              >
                {/* Icon */}
                <div
                  className="flex items-center justify-center w-11 h-11 rounded-xl mb-5 flex-shrink-0"
                  style={{
                    background: feat.accentDim,
                    border:     `1px solid ${feat.accentBorder}`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: feat.accentColor }} />
                </div>

                {/* Tag */}
                <p
                  className="text-[10px] uppercase tracking-[0.3em] font-mono mb-2"
                  style={{ color: feat.accentColor }}
                >
                  {feat.tag}
                </p>

                {/* Title */}
                <h3
                  className="text-lg font-bold tracking-tight mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  {feat.title}
                </h3>

                {/* Description */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {feat.description}
                </p>

                {/* Bottom accent line */}
                <div
                  className="mt-5 h-px rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${feat.accentColor}40, transparent)`,
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(99,149,255,0.12), transparent)",
        }}
      />
    </section>
  );
}
