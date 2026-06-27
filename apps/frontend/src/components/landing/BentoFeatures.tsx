"use client";

import { motion } from "framer-motion";

const features = [
  {
    id: "cinematic",
    tag: "Intelligence",
    title: "Cinematic Understanding",
    description:
      "Trained on Malayalam cinema tropes, cultural nuances, and emotional arcs — not generic text.",
    wide: true,
  },
  {
    id: "bilingual",
    tag: "Language",
    title: "Malayalam & English",
    description:
      "Query in either language. Every crew member gets the same depth of insight.",
    wide: false,
  },
  {
    id: "roles",
    tag: "Context",
    title: "Role-Based Results",
    description:
      "Director, DP, Composer — the AI surfaces only what's relevant to your craft.",
    wide: false,
  },
  {
    id: "citations",
    tag: "Accuracy",
    title: "Exact Scene Citations",
    description:
      "Every answer links back to the page, scene, and line that grounds it.",
    wide: false,
  },
  {
    id: "streaming",
    tag: "Speed",
    title: "Streaming Responses",
    description:
      "Reads like a conversation. Token-level streaming, no waiting.",
    wide: false,
  },
  {
    id: "graph",
    tag: "Visualization",
    title: "Character Graph Engine",
    description:
      "Map relationships, power shifts, and arcs across the full screenplay.",
    wide: true,
  },
];

function BentoCard({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
      className={`relative rounded-2xl p-7 flex flex-col gap-4 group
        ${feature.wide ? "md:col-span-2" : "md:col-span-1"}
      `}
      style={{
        background: "rgba(255,255,255,0.032)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Hover shimmer */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(253,176,34,0.05) 0%, transparent 70%)",
        }}
      />

      {/* Tag */}
      <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-mono">
        {feature.tag}
      </span>

      {/* Title */}
      <h3 className="text-white text-lg md:text-xl font-semibold tracking-tight leading-snug">
        {feature.title}
      </h3>

      {/* Description */}
      <p className="text-zinc-500 text-sm leading-relaxed mt-auto">
        {feature.description}
      </p>
    </motion.div>
  );
}

export function BentoFeatures() {
  return (
    <section id="features" className="relative z-10 py-24 md:py-32 px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto mb-14"
      >
        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-mono mb-4">
          Features
        </p>
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white max-w-lg leading-tight">
          Built for the crew,
          <br />
          not the crowd.
        </h2>
      </motion.div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
        {features.map((f, i) => (
          <BentoCard key={f.id} feature={f} index={i} />
        ))}
      </div>
    </section>
  );
}
