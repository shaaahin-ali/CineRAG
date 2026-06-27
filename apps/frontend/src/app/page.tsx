"use client";

import { HeroSection } from "@/components/landing/HeroSection";
import { BentoFeatures } from "@/components/landing/BentoFeatures";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <main className="min-h-screen text-white flex flex-col overflow-hidden relative" style={{ background: "#080808" }}>

      {/* Single, subtle top glow — one colour, that's it */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% -10%, rgba(253,176,34,0.07) 0%, transparent 60%)",
        }}
      />

      {/* HERO */}
      <HeroSection />

      {/* THIN DIVIDER */}
      <div className="w-full h-px bg-white/[0.05] relative z-10" />

      {/* BENTO FEATURES */}
      <BentoFeatures />

      {/* THIN DIVIDER */}
      <div className="w-full h-px bg-white/[0.05] relative z-10" />

      {/* CTA */}
      <section className="relative z-10 flex flex-col items-center py-28 px-6">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-mono mb-5"
        >
          Get started
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-5xl font-black tracking-tighter text-center mb-4 leading-tight"
        >
          Elevate your screenplay.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="text-zinc-500 text-center mb-10 max-w-sm text-sm leading-loose"
        >
          Join film crews across Mollywood using AI to unlock deeper story insights.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <LandingCTA />
        </motion.div>
      </section>

      {/* Footer line */}
      <div className="w-full h-px bg-white/[0.04] relative z-10" />
    </main>
  );
}
