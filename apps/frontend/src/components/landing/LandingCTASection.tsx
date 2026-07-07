"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Zap } from "lucide-react";

export function LandingCTASection() {
  const router = useRouter();
  const { status } = useSession();
  const ctaHref  = status === "authenticated" ? "/dashboard" : "/auth";
  const ctaLabel = status === "authenticated" ? "Go to Dashboard" : "Get Started Free";

  return (
    <section
      id="pricing"
      className="relative z-10 py-24 md:py-32 px-6"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(79,127,255,0.25), rgba(56,201,232,0.2), transparent)",
        }}
      />

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="gradient-border-card p-10 md:p-14 text-center"
        >
          {/* Icon badge */}
          <div className="flex justify-center mb-6">
            <div
              className="flex items-center justify-center w-14 h-14 rounded-2xl"
              style={{
                background: "var(--accent-blue-dim)",
                border:     "1px solid rgba(79,127,255,0.3)",
              }}
            >
              <Zap className="w-6 h-6" style={{ color: "var(--accent-blue)" }} />
            </div>
          </div>

          <p
            className="text-xs uppercase tracking-[0.4em] font-mono mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            Free to Start
          </p>

          <h2
            className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-5"
            style={{ color: "var(--text-primary)" }}
          >
            Start free with 100 scene queries.
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor:  "transparent",
                backgroundClip:       "text",
              }}
            >
              Upgrade when your film library
              <br />
              becomes mission-critical.
            </span>
          </h2>

          <p
            className="text-base mb-10 max-w-lg mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            No credit card required. No time limit on the free tier.
            Scale to unlimited scenes when your production demands it.
          </p>

          <motion.button
            type="button"
            onClick={() => router.push(ctaHref)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3.5"
          >
            {ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </motion.button>

          <p
            className="mt-6 text-xs font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            Free tier · No credit card · Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}
