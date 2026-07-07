"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Globe,
  Zap,
  BookMarked,
  Network,
  Clapperboard,
  Video,
  Radio,
  Users,
  Wand2,
} from "lucide-react";

/* ── Feature data (all real features from the codebase) ──────────────── */

const features = [
  {
    id: "upload",
    tag: "Ingestion",
    title: "Screenplay Upload & Parsing",
    description:
      "Drop a PDF, DOCX, or TXT. Our parser extracts scenes, characters, emotions, and locations — handling both English and Malayalam script formats with Unicode normalization.",
    icon: Upload,
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80",
    imageAlt: "Film production setup",
  },
  {
    id: "bilingual",
    tag: "Language",
    title: "Bilingual AI Queries",
    description:
      "Query in Malayalam or English — the system auto-detects, expands film terminology, and returns answers that respect the cultural weight of every word.",
    icon: Globe,
    image: "https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800&q=80",
    imageAlt: "Typography and language",
  },
  {
    id: "streaming",
    tag: "Speed",
    title: "Streaming AI Responses",
    description:
      "No waiting. Token-level streaming via SSE delivers answers as they're generated — it reads like a real conversation, not a loading spinner.",
    icon: Zap,
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
    imageAlt: "Fast technology",
  },
  {
    id: "citations",
    tag: "Accuracy",
    title: "Exact Scene Citations",
    description:
      "Every answer is grounded. Citations link back to the exact scene number, page range, characters present, and detected emotional tone.",
    icon: BookMarked,
    image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80",
    imageAlt: "Script and screenplay pages",
  },
  {
    id: "graph",
    tag: "Visualization",
    title: "Character Relationship Graph",
    description:
      "An interactive node graph maps character connections, power dynamics, and scene co-occurrences across the full screenplay. Powered by dagre layout.",
    icon: Network,
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80",
    imageAlt: "Network connections visualization",
  },
  {
    id: "storyboard",
    tag: "Generation",
    title: "AI Storyboard Generation",
    description:
      "Transform scenes into visual storyboard frames. The AI reads stage directions and generates shot-by-shot visual breakdowns for pre-production planning.",
    icon: Clapperboard,
    image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80",
    imageAlt: "Storyboard frames",
  },
  {
    id: "video",
    tag: "Generation",
    title: "AI Video Generation",
    description:
      "Generate cinematic preview videos from screenplay text. Visualize exteriors, interiors, and key dramatic moments before a single frame is shot.",
    icon: Video,
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80",
    imageAlt: "Video production camera",
  },
  {
    id: "narrator",
    tag: "Audio",
    title: "Cinematic AI Narration",
    description:
      "AI voice narration with emotional tone matching. Hear your scenes read aloud with the right cadence — from intimate whispers to dramatic peaks.",
    icon: Radio,
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
    imageAlt: "Audio recording studio",
  },
  {
    id: "roles",
    tag: "Intelligence",
    title: "Role-Based Intelligence",
    description:
      "Director, Actor, Cinematographer, Editor, Producer, Music Director — each crew member gets answers tailored to their specific craft and responsibilities.",
    icon: Users,
    image: "https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?w=800&q=80",
    imageAlt: "Film crew at work",
  },
  {
    id: "assist",
    tag: "Creation",
    title: "Screenplay Writing Assistant",
    description:
      "Write your screenplay with AI co-authoring. Scene formatting, dialogue suggestions, and narrative structure guidance — built for the Malayalam film tradition.",
    icon: Wand2,
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80",
    imageAlt: "Writing and creating",
  },
];

/* ── Single feature row ──────────────────────────────────────────────── */

function FeatureRow({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const isReversed = index % 2 === 1;
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
      className={`grid gap-8 lg:gap-16 items-center ${
        isReversed ? "lg:grid-cols-[1fr_1.2fr]" : "lg:grid-cols-[1.2fr_1fr]"
      }`}
    >
      {/* Image */}
      <motion.div
        style={{ y: imageY }}
        className={`relative overflow-hidden rounded-[24px] aspect-[4/3] ${
          isReversed ? "lg:order-2" : "lg:order-1"
        }`}
      >
        <Image
          src={feature.image}
          alt={feature.imageAlt}
          fill
          className="object-cover transition-transform duration-700 hover:scale-105"
          unoptimized
        />
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, x: isReversed ? -20 : 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className={isReversed ? "lg:order-1" : "lg:order-2"}
      >
        {/* Tag */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/[0.03]">
            <Icon className="h-4 w-4 text-white" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-mono">
            {feature.tag}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-white leading-tight mb-3">
          {feature.title}
        </h3>

        {/* Description */}
        <p className="text-sm md:text-base text-zinc-500 leading-relaxed max-w-lg">
          {feature.description}
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ── Divider line ────────────────────────────────────────────────────── */

function MonoDivider() {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="h-px w-full origin-left my-16 md:my-24"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), rgba(255,255,255,0.04), transparent)",
      }}
    />
  );
}

/* ── Main component ──────────────────────────────────────────────────── */

export function ScrollFeatures() {
  return (
    <section id="features" className="relative z-10 py-20 md:py-32 px-6">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto mb-20 md:mb-28"
      >
        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-mono mb-4">
          Features
        </p>
        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white max-w-xl leading-tight">
          Everything your crew needs, in one place.
        </h2>
        <p className="mt-4 text-sm text-zinc-500 max-w-md leading-relaxed">
          From script analysis to AI-generated previews — every tool designed for the way Malayalam cinema is made.
        </p>
      </motion.div>

      {/* Feature rows */}
      <div className="max-w-6xl mx-auto">
        {features.map((feature, i) => (
          <div key={feature.id}>
            <FeatureRow feature={feature} index={i} />
            {i < features.length - 1 && <MonoDivider />}
          </div>
        ))}
      </div>
    </section>
  );
}
