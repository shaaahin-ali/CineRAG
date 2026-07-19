"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Zap, Check, Sparkles } from "lucide-react";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   INTERACTIVE CTA SECTION
   â€¢ Magnetic button that follows mouse
   â€¢ Animated gradient border that rotates
   â€¢ Feature checklist with stagger animation
   â€¢ Floating particle accents
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const features = [
  "100 free scene queries",
  "Semantic search across all scenes",
  "Timestamp-accurate citations",
  "Role-based AI responses",
  "No credit card required",
  "Cancel anytime",
];

function MagneticButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const x = useSpring(mouseX, { stiffness: 300, damping: 20 });
  const y = useSpring(mouseY, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set((e.clientX - centerX) * 0.15);
    mouseY.set((e.clientY - centerY) * 0.15);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      className="btn-primary inline-flex items-center gap-2 text-base px-10 py-4 relative overflow-hidden group"
    >
      {/* Shimmer sweep */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        animate={{
          backgroundPosition: ["200% 0%", "-200% 0%"],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{
          background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)",
          backgroundSize: "200% 100%",
        }}
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

export function LandingCTASection() {
  const router = useRouter();
  const { status } = useSession();
  const ctaHref = status === "authenticated" ? "/dashboard" : "/auth";
  const ctaLabel = status === "authenticated" ? "Go to Dashboard" : "Get Started Free";
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <section
      id="pricing"
      className="relative z-10 py-24 md:py-32 px-6"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Animated top accent */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundSize: "200% 100%",
          background:
            "linear-gradient(90deg, transparent, rgba(43,92,230,0.35), rgba(56,201,232,0.25), transparent, rgba(43,92,230,0.35), rgba(56,201,232,0.25), transparent)",
        }}
      />

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden"
        >
          {/* Animated rotating gradient border */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            style={{
              background: "conic-gradient(from 0deg, var(--accent-blue), var(--accent-cyan), var(--accent-purple), var(--accent-blue))",
              padding: "1px",
            }}
          />
          {/* Inner card */}
          <div
            className="relative rounded-2xl p-10 md:p-14 m-[1px]"
            style={{ background: "var(--bg-secondary)" }}
          >
            {/* Background particle accents */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full"
                  style={{
                    background: i % 2 === 0 ? "var(--accent-blue)" : "var(--accent-cyan)",
                    left: `${15 + i * 18}%`,
                    top: `${20 + (i % 3) * 25}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.2, 0.6, 0.2],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.4,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 text-center">
              {/* Animated icon badge */}
              <div className="flex justify-center mb-6">
                <motion.div
                  className="flex items-center justify-center w-16 h-16 rounded-2xl"
                  style={{
                    background: "var(--accent-blue-dim)",
                    border: "1px solid rgba(43,92,230,0.3)",
                  }}
                  animate={{
                    boxShadow: [
                      "0 0 0px rgba(43,92,230,0)",
                      "0 0 30px rgba(43,92,230,0.3)",
                      "0 0 0px rgba(43,92,230,0)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  whileHover={{ rotate: 15, scale: 1.1 }}
                >
                  <Zap className="w-7 h-7" style={{ color: "var(--accent-blue)" }} />
                </motion.div>
              </div>

              <motion.p
                className="text-xs uppercase tracking-[0.4em] font-mono mb-4 inline-flex items-center gap-2"
                style={{ color: "var(--text-muted)" }}
              >
                <Sparkles className="w-3 h-3" style={{ color: "var(--accent-cyan)" }} />
                Free to Start
                <Sparkles className="w-3 h-3" style={{ color: "var(--accent-cyan)" }} />
              </motion.p>

              <h2
                className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-5"
                style={{ color: "var(--text-primary)" }}
              >
                Start free with 100 scene queries.
                <br />
                <motion.span
                  style={{
                    background:
                      "linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                  animate={{
                    filter: [
                      "drop-shadow(0 0 0px transparent)",
                      "drop-shadow(0 0 15px rgba(43,92,230,0.35))",
                      "drop-shadow(0 0 0px transparent)",
                    ],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  Upgrade when your film library
                  <br />
                  becomes mission-critical.
                </motion.span>
              </h2>

              {/* Feature checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto mb-10 text-left">
                {features.map((feature, i) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    onMouseEnter={() => setHoveredFeature(i)}
                    onMouseLeave={() => setHoveredFeature(null)}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-lg transition-all duration-200 cursor-default"
                    style={{
                      background: hoveredFeature === i ? "var(--bg-elevated)" : "transparent",
                    }}
                  >
                    <motion.div
                      className="flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0"
                      style={{
                        background: "var(--accent-green-dim)",
                        border: "1px solid rgba(34,211,160,0.25)",
                      }}
                      whileHover={{ scale: 1.2 }}
                    >
                      <Check className="w-2.5 h-2.5" style={{ color: "var(--accent-green)" }} />
                    </motion.div>
                    <span className="text-sm" style={{ color: hoveredFeature === i ? "var(--text-primary)" : "var(--text-secondary)" }}>
                      {feature}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Magnetic CTA button */}
              <MagneticButton onClick={() => router.push(ctaHref)}>
                {ctaLabel}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </MagneticButton>

              <p
                className="mt-6 text-xs font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                Free tier Â· No credit card Â· Cancel anytime
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
