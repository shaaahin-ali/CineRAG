"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Search, Clock, Clapperboard, Wand2, ArrowUpRight } from "lucide-react";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   INTERACTIVE 3D TILT CARD
   Tracks mouse position and applies perspective rotation + spotlight glow
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function TiltCard({
  children,
  accentColor,
  accentBorder,
  index,
}: {
  children: React.ReactNode;
  accentColor: string;
  accentBorder: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-8, 8]), { stiffness: 200, damping: 20 });

  const spotlightX = useTransform(mouseX, [0, 1], [0, 100]);
  const spotlightY = useTransform(mouseY, [0, 1], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformStyle: "preserve-3d",
        perspective: "800px",
      }}
      className="relative group"
    >
      <motion.div
        className="relative rounded-2xl overflow-hidden p-6 h-full flex flex-col transition-colors duration-300"
        style={{
          background: "var(--bg-card)",
          border: `1px solid ${isHovered ? accentBorder : "var(--border-card)"}`,
          boxShadow: isHovered
            ? `0 20px 60px rgba(0,0,0,0.4), 0 0 30px ${accentColor}15`
            : "0 4px 20px rgba(0,0,0,0.2)",
        }}
      >
        {/* Spotlight glow effect */}
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: useTransform(
              [spotlightX, spotlightY],
              ([x, y]) => `radial-gradient(300px circle at ${x}% ${y}%, ${accentColor}12, transparent 70%)`
            ),
          }}
        />

        {/* Content */}
        <div className="relative z-10" style={{ transform: "translateZ(20px)" }}>
          {children}
        </div>

        {/* Bottom gradient line â€” animated */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 + index * 0.12 }}
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)`,
            transformOrigin: "left",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   ANIMATED ICON â€” morphs on hover
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function AnimatedIcon({
  Icon,
  color,
  dim,
  border,
}: {
  Icon: React.ElementType;
  color: string;
  dim: string;
  border: string;
}) {
  return (
    <motion.div
      className="flex items-center justify-center w-12 h-12 rounded-xl mb-5 flex-shrink-0 relative"
      style={{
        background: dim,
        border: `1px solid ${border}`,
      }}
      whileHover={{
        scale: 1.15,
        rotate: 5,
        transition: { duration: 0.2 },
      }}
    >
      <Icon className="w-5 h-5" style={{ color }} />
      {/* Pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        animate={{
          boxShadow: [
            `0 0 0px ${color}00`,
            `0 0 15px ${color}25`,
            `0 0 0px ${color}00`,
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   FEATURES DATA
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const features = [
  {
    id: "semantic",
    icon: Search,
    accentColor: "var(--accent-blue)",
    accentDim: "rgba(43,92,230,0.12)",
    accentBorder: "rgba(43,92,230,0.3)",
    tag: "Search",
    title: "Semantic Search",
    description:
      "Find what you mean, not just keywords. Vector embeddings surface the exact dramatic moment across thousands of scenes.",
    stat: { value: "2.4M", label: "vectors indexed" },
  },
  {
    id: "citations",
    icon: Clock,
    accentColor: "var(--accent-cyan)",
    accentDim: "rgba(56,201,232,0.10)",
    accentBorder: "rgba(56,201,232,0.3)",
    tag: "Accuracy",
    title: "Timestamp Citations",
    description:
      "Every AI answer links back to the exact scene, page range, characters present, and emotional beat â€” no hallucination.",
    stat: { value: "99.2%", label: "accuracy rate" },
  },
  {
    id: "scene",
    icon: Clapperboard,
    accentColor: "var(--accent-purple)",
    accentDim: "rgba(139,92,246,0.10)",
    accentBorder: "rgba(139,92,246,0.3)",
    tag: "Analysis",
    title: "Scene Breakdown",
    description:
      "The AI reads stage directions, detects emotion, parses characters, and generates visual storyboard shots per scene.",
    stat: { value: "50K+", label: "scenes analyzed" },
  },
  {
    id: "workflow",
    icon: Wand2,
    accentColor: "var(--accent-green)",
    accentDim: "rgba(34,211,160,0.10)",
    accentBorder: "rgba(34,211,160,0.3)",
    tag: "Creation",
    title: "Creator Workflow",
    description:
      "Role-based intelligence for Directors, Editors, Cinematographers, and Producers â€” each gets answers tailored to their craft.",
    stat: { value: "8", label: "specialized roles" },
  },
];

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   MAIN COMPONENT
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export function FeaturesGrid() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <section
      id="features"
      className="relative z-10 py-24 md:py-32 px-6"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Animated top border */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        animate={{
          backgroundPosition: ["0% 0%", "200% 0%"],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundSize: "200% 100%",
          background:
            "linear-gradient(90deg, transparent, rgba(43,92,230,0.3), rgba(56,201,232,0.2), transparent, rgba(43,92,230,0.3), rgba(56,201,232,0.2), transparent)",
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
          <motion.p
            className="text-xs uppercase tracking-[0.4em] font-mono mb-4 inline-flex items-center gap-2"
            style={{ color: "var(--text-muted)" }}
            animate={{
              textShadow: [
                "0 0 0px transparent",
                "0 0 8px rgba(56,201,232,0.3)",
                "0 0 0px transparent",
              ],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <span className="w-6 h-px" style={{ background: "var(--accent-cyan)" }} />
            Built for Filmmakers
            <span className="w-6 h-px" style={{ background: "var(--accent-cyan)" }} />
          </motion.p>
          <h2
            className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            A RAG pipeline that understands{" "}
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
                  "drop-shadow(0 0 12px rgba(43,92,230,0.4))",
                  "drop-shadow(0 0 0px transparent)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              cinema
            </motion.span>
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

        {/* Feature cards grid with 3D tilt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <TiltCard
                key={feat.id}
                accentColor={feat.accentColor}
                accentBorder={feat.accentBorder}
                index={i}
              >
                <div
                  onMouseEnter={() => setHoveredId(feat.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Icon */}
                  <AnimatedIcon
                    Icon={Icon}
                    color={feat.accentColor}
                    dim={feat.accentDim}
                    border={feat.accentBorder}
                  />

                  {/* Tag */}
                  <p
                    className="text-[10px] uppercase tracking-[0.3em] font-mono mb-2"
                    style={{ color: feat.accentColor }}
                  >
                    {feat.tag}
                  </p>

                  {/* Title */}
                  <h3
                    className="text-lg font-bold tracking-tight mb-3 flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {feat.title}
                    <ArrowUpRight
                      className="w-3.5 h-3.5 transition-all duration-300"
                      style={{
                        opacity: hoveredId === feat.id ? 1 : 0,
                        transform: hoveredId === feat.id ? "translate(0, 0)" : "translate(-4px, 4px)",
                        color: feat.accentColor,
                      }}
                    />
                  </h3>

                  {/* Description */}
                  <p
                    className="text-sm leading-relaxed mb-4"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {feat.description}
                  </p>

                  {/* Stat badge */}
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{
                      background: feat.accentDim,
                      border: `1px solid ${feat.accentBorder}`,
                    }}
                  >
                    <span className="text-sm font-black" style={{ color: feat.accentColor }}>
                      {feat.stat.value}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                      {feat.stat.label}
                    </span>
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>
      </div>

      {/* Animated bottom border */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px"
        animate={{
          backgroundPosition: ["200% 0%", "0% 0%"],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundSize: "200% 100%",
          background:
            "linear-gradient(90deg, transparent, rgba(43,92,230,0.2), transparent, rgba(43,92,230,0.2), transparent)",
        }}
      />
    </section>
  );
}
