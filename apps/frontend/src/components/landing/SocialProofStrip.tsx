"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Users, Award, TrendingUp } from "lucide-react";

/* ————————————————————————————————————————————————————————————————————————————————
   INTERACTIVE SOCIAL PROOF — dual scrolling rows, hover-expandable chips,
   animated stat counters, and testimonial quotes
   ———————————————————————————————————————————————————————————————————————————————— */

const items = [
  { label: "Movie Buffs", emoji: "🎬", count: "12K+" },
  { label: "Video Essayists", emoji: "📹", count: "3.2K" },
  { label: "Film Editors", emoji: "✂️", count: "5.8K" },
  { label: "Archive Teams", emoji: "📚", count: "890" },
  { label: "Screenplay Writers", emoji: "✍️", count: "7.1K" },
  { label: "Film Students", emoji: "🎓", count: "15K+" },
  { label: "Directors", emoji: "🎥", count: "2.4K" },
  { label: "Cinematographers", emoji: "📸", count: "1.9K" },
  { label: "Producers", emoji: "🎭", count: "3.5K" },
  { label: "Sound Designers", emoji: "🎧", count: "1.2K" },
];

const stats = [
  { icon: Users, value: "50K+", label: "Active Users", color: "var(--accent-blue)" },
  { icon: Star, value: "4.9/5", label: "User Rating", color: "var(--accent-cyan)" },
  { icon: Award, value: "12", label: "Awards Won", color: "var(--accent-purple)" },
  { icon: TrendingUp, value: "340%", label: "Growth YoY", color: "var(--accent-green)" },
];

const testimonials = [
  { quote: "Changed how I analyze screenplays forever.", author: "Sarah M.", role: "Film Editor", avatar: "🎬" },
  { quote: "Like having a brilliant film scholar on speed dial.", author: "Raj K.", role: "Director", avatar: "🎥" },
  { quote: "Found the exact scene in seconds. Incredible.", author: "Luis P.", role: "Video Essayist", avatar: "📹" },
];

function ScrollingRow({ items: rowItems, direction, speed }: { items: typeof items; direction: "left" | "right"; speed: number }) {
  const doubled = [...rowItems, ...rowItems];
  return (
    <div className="relative overflow-hidden">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10" style={{ background: "linear-gradient(to right, var(--bg-deep), transparent)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10" style={{ background: "linear-gradient(to left, var(--bg-deep), transparent)" }} />

      <motion.div
        className="flex items-center gap-3 w-max"
        animate={{
          x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {doubled.map((item, i) => (
          <motion.div
            key={`${item.label}-${i}`}
            className="shrink-0 flex items-center gap-2.5 px-4 py-2 rounded-xl cursor-default select-none group"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
            }}
            whileHover={{
              scale: 1.08,
              borderColor: "var(--border-accent)",
              transition: { duration: 0.2 },
            }}
          >
            <span className="text-base">{item.emoji}</span>
            <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
              {item.label}
            </span>
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "var(--accent-blue-dim)", color: "var(--accent-cyan)" }}
            >
              {item.count}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export function SocialProofStrip() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  return (
    <section
      className="relative z-10 py-20 px-6 overflow-hidden"
      style={{ background: "var(--bg-deep)" }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        {/* Section label */}
        <motion.p
          className="text-xs uppercase tracking-[0.4em] font-mono mb-3 text-center flex items-center justify-center gap-2"
          style={{ color: "var(--text-muted)" }}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="w-4 h-px" style={{ background: "var(--accent-cyan)" }} />
          Trusted By
          <span className="w-4 h-px" style={{ background: "var(--accent-cyan)" }} />
        </motion.p>

        <motion.p
          className="text-base md:text-lg font-medium mb-10 text-center"
          style={{ color: "var(--text-secondary)" }}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          The cinema intelligence platform trusted by{" "}
          <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>50,000+</span>{" "}
          filmmakers worldwide.
        </motion.p>

        {/* Dual scrolling rows */}
        <div className="flex flex-col gap-3 mb-12">
          <ScrollingRow items={items.slice(0, 5)} direction="left" speed={35} />
          <ScrollingRow items={items.slice(5)} direction="right" speed={40} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.04, transition: { duration: 0.2 } }}
                className="flex flex-col items-center py-5 px-4 rounded-xl cursor-default"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                }}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-lg mb-3"
                  style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}
                >
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <span className="text-2xl font-black" style={{ color: stat.color }}>
                  {stat.value}
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>
                  {stat.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Testimonials */}
        <div className="max-w-2xl mx-auto">
          <motion.div
            key={activeTestimonial}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-6"
          >
            <p className="text-3xl mb-3">{testimonials[activeTestimonial].avatar}</p>
            <p className="text-base md:text-lg italic mb-3" style={{ color: "var(--text-primary)" }}>
              &ldquo;{testimonials[activeTestimonial].quote}&rdquo;
            </p>
            <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              — {testimonials[activeTestimonial].author}, {testimonials[activeTestimonial].role}
            </p>
          </motion.div>

          {/* Testimonial dots */}
          <div className="flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === activeTestimonial ? "24px" : "8px",
                  height: "8px",
                  background: i === activeTestimonial ? "var(--accent-blue)" : "var(--border-subtle)",
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
