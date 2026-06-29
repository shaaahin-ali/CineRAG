"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { LandingCTA } from "@/components/landing/LandingCTA";

const GooeyText = dynamic(
  () => import("@/components/ui/gooey-text-morphing").then((m) => m.GooeyText),
  { ssr: false }
);

export function HeroSection() {
  return (
    <section className="relative z-10 flex flex-col items-center justify-center w-full min-h-[92vh] pt-28 pb-20 px-6">

      {/* Shahin Ali Product Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] font-semibold text-zinc-300 bg-zinc-900/50 border border-zinc-800/80 rounded-full backdrop-blur-sm shadow-xl">
          ✨ A Shahin Ali Product
        </span>
      </motion.div>

      {/* Eyebrow */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-[11px] uppercase tracking-[0.4em] text-zinc-600 mb-8 font-mono"
      >
        AI for Mollywood Screenplays
      </motion.p>

      {/* Headline */}
      <div className="h-[220px] md:h-[280px] w-full flex items-center justify-center">
        <GooeyText
          texts={["Welcome to", "CineRAG"]}
          morphTime={1.5}
          cooldownTime={1.5}
          className="font-black tracking-tighter"
        />
      </div>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-6 max-w-md text-center text-sm text-zinc-500 leading-loose"
      >
        Upload a Malayalam screenplay. Query in Malayalam or English.
        Get streaming answers with exact scene citations.
      </motion.p>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-10"
      >
        <LandingCTA />
      </motion.div>

      {/* Scroll dot */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="mt-16"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-[1px] h-10 bg-gradient-to-b from-zinc-700 to-transparent mx-auto"
        />
      </motion.div>
    </section>
  );
}
