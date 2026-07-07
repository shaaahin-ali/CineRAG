"use client";

import { motion } from "framer-motion";

const items = [
  "Movie Buffs",
  "Video Essayists",
  "Film Editors",
  "Archive Teams",
  "Screenplay Writers",
  "Film Students",
  "Directors",
  "Cinematographers",
];

export function SocialProofStrip() {
  return (
    <section
      className="relative z-10 py-14 px-6 overflow-hidden"
      style={{ background: "var(--bg-deep)" }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center"
      >
        <p
          className="text-xs uppercase tracking-[0.4em] font-mono mb-5"
          style={{ color: "var(--text-muted)" }}
        >
          Trusted By
        </p>
        <p
          className="text-base md:text-lg font-medium mb-8"
          style={{ color: "var(--text-secondary)" }}
        >
          Trusted by movie buffs, video essayists, editors, and archive teams.
        </p>

        {/* Scrolling chips */}
        <div className="relative overflow-hidden">
          <div
            className="animate-ticker flex items-center gap-3 w-max"
            style={{ "--ticker-speed": "30s" } as React.CSSProperties}
          >
            {[...items, ...items].map((item, i) => (
              <span
                key={i}
                className="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: "var(--bg-elevated)",
                  border:     "1px solid var(--border-subtle)",
                  color:      "var(--text-secondary)",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
