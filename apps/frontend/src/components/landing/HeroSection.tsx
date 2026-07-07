"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Play } from "lucide-react";
import { HeroChatPreview } from "@/components/landing/HeroChatPreview";

/* ─────────────────────────────────────────────────────────────────────────
   Cinematic intro state machine
   Phase 0 : "Welcome to"              (fade-in, 1.2s)
   Phase 1 : "CineRAG" sweeps in       (slide-up + glow, 1.4s)
   Phase 2 : Taglines appear           (stagger word-by-word, 2.4s)
   Phase 3 : Scene fades out           (crossfade, 0.8s)
   Phase 4 : "CineRAG" centred large   (scale + glow pulse, 1.8s)
   Phase 5 : Fade out → loop           (0.6s)
───────────────────────────────────────────────────────────────────────── */

const PHASE_DURATIONS = [1200, 1400, 2600, 700, 1900, 600]; // ms per phase

type Phase = 0 | 1 | 2 | 3 | 4 | 5;

export function HeroSection() {
  const router = useRouter();
  const { status } = useSession();
  const ctaHref  = status === "authenticated" ? "/dashboard" : "/auth";
  const ctaLabel = status === "authenticated" ? "Go to Dashboard" : "Try It Now";

  const [phase, setPhase] = useState<Phase>(0);
  const [introVisible, setIntroVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = () => {
    setPhase((prev) => {
      const next = (((prev as number) + 1) % 6) as Phase;
      return next;
    });
  };

  useEffect(() => {
    if (!introVisible) return;
    const dur = PHASE_DURATIONS[phase];
    timerRef.current = setTimeout(advance, dur);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, introVisible]);

  const skip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIntroVisible(false);
  };

  return (
    <section className="relative z-10 w-full min-h-screen flex flex-col justify-center overflow-hidden">

      {/* ── Ambient background glows ─────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute" style={{
          top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: "80vw", height: "60vh",
          background: "radial-gradient(ellipse at center, rgba(79,127,255,0.18) 0%, transparent 65%)",
          filter: "blur(2px)",
        }} />
        <div className="absolute" style={{
          top: "30%", left: "-10%", width: "50vw", height: "50vh",
          background: "radial-gradient(ellipse at center, rgba(56,201,232,0.07) 0%, transparent 65%)",
        }} />
        <div className="absolute" style={{
          top: "20%", right: "-10%", width: "50vw", height: "50vh",
          background: "radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 65%)",
        }} />
      </div>

      {/* ── Cinematic Intro Overlay ──────────────────────────────────── */}
      <AnimatePresence>
        {introVisible && (
          <motion.div
            key="intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: "var(--bg-deep)" }}
          >
            {/* Phase 0-2 sequence */}
            <AnimatePresence mode="wait">
              {(phase === 0 || phase === 1 || phase === 2) && (
                <motion.div
                  key="seq"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="flex flex-col items-center text-center px-6"
                >
                  {/* "Welcome to" */}
                  <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-sm md:text-base font-semibold tracking-[0.28em] uppercase mb-4"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Welcome to
                  </motion.p>

                  {/* "CineRAG" — phase 1 sweep */}
                  <AnimatePresence>
                    {phase >= 1 && (
                      <motion.h1
                        key="cr1"
                        initial={{ opacity: 0, y: 44, filter: "blur(12px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
                        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                        className="text-6xl md:text-8xl font-black tracking-tight mb-8"
                        style={{
                          background: "linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-cyan) 60%, #e0f0ff 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          filter: "drop-shadow(0 0 48px rgba(79,127,255,0.55))",
                        }}
                      >
                        CineRAG
                      </motion.h1>
                    )}
                  </AnimatePresence>

                  {/* Taglines — phase 2 stagger words */}
                  {phase >= 2 && (
                    <div className="flex flex-col items-center gap-2 mt-2">
                      {[
                        { text: "Talk to Your Movies.", delay: 0 },
                        { text: "Search Every Scene.", delay: 0.2 },
                      ].map(({ text, delay }) => (
                        <div key={text} className="overflow-hidden">
                          <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
                            className="text-2xl md:text-4xl font-black tracking-tight"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {text.split(" ").map((word, i) => (
                              <motion.span
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.38, delay: delay + i * 0.08 }}
                                className="inline-block mr-[0.25em]"
                              >
                                {word}
                              </motion.span>
                            ))}
                          </motion.p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Phase 4 — large CineRAG centred */}
              {phase === 4 && (
                <motion.div
                  key="cr-big"
                  initial={{ opacity: 0, scale: 0.82, filter: "blur(18px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.06, filter: "blur(10px)" }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center relative"
                >
                  {/* Glow ring */}
                  <motion.div
                    animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.65, 0.35] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: "480px", height: "180px",
                      background: "radial-gradient(ellipse, rgba(79,127,255,0.38) 0%, transparent 70%)",
                      filter: "blur(24px)",
                    }}
                  />
                  <h1
                    className="relative text-7xl md:text-[9rem] font-black tracking-tight text-center"
                    style={{
                      background: "linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-cyan) 55%, #ffffff 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      filter: "drop-shadow(0 0 64px rgba(79,127,255,0.65))",
                    }}
                  >
                    CineRAG
                  </h1>
                  <motion.div
                    initial={{ opacity: 0, width: "0px" }}
                    animate={{ opacity: 1, width: "220px" }}
                    transition={{ duration: 0.9, delay: 0.35 }}
                    className="h-px mt-5"
                    style={{ background: "linear-gradient(90deg, transparent, var(--accent-cyan), transparent)" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress dots */}
            <div className="absolute bottom-10 flex gap-2 items-center">
              {[0, 1, 2, 4].map((p, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-500"
                  style={{
                    width: phase === p ? "22px" : "6px",
                    height: "6px",
                    background: phase === p ? "var(--accent-blue)" : "var(--border-subtle)",
                  }}
                />
              ))}
            </div>

            {/* Skip */}
            <button
              onClick={skip}
              className="absolute top-6 right-6 text-xs font-mono tracking-wider uppercase transition-opacity"
              style={{ color: "var(--text-muted)", opacity: 0.5 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
            >
              Skip ↩
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Hero — two-column layout ────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center pt-24 pb-16 px-6">

        {/* LEFT */}
        <div className="flex flex-col items-start">

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <span className="tag-chip mb-7 inline-flex">✦ AI RETRIEVAL FOR MOVING IMAGES</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="w-full mb-6">
            <h1
              className="text-4xl md:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.1]"
              style={{ color: "var(--text-primary)" }}
            >
              Talk to Your Movies.
            </h1>
            <h1
              className="text-4xl md:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.1]"
              style={{
                background: "linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-cyan) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Search Every Scene.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
            className="text-base md:text-lg leading-relaxed mb-10 max-w-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            Instantly find scenes, quotes, emotions, and context across thousands
            of films using advanced AI retrieval and semantic video search.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.55 }}
            className="flex flex-wrap items-center gap-4"
          >
            <button type="button" onClick={() => router.push(ctaHref)} className="btn-primary flex items-center gap-2 text-sm">
              {ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => document.querySelector("#demo")?.scrollIntoView({ behavior: "smooth" })}
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <Play className="w-3.5 h-3.5" />
              Open Chat Demo
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.85 }}
            className="mt-8 text-xs font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            Free · 100 scene queries · No credit card required
          </motion.p>
        </div>

        {/* RIGHT */}
        <div className="flex justify-center lg:justify-end">
          <HeroChatPreview />
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] font-mono" style={{ color: "var(--text-muted)" }}>Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8"
          style={{ background: "linear-gradient(to bottom, rgba(79,127,255,0.5), transparent)" }}
        />
      </motion.div>
    </section>
  );
}
