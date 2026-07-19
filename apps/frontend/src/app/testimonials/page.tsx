"use client";

import { Carousel, TestimonialCard, iTestimonial } from "@/components/ui/retro-testimonial";
import { Footer } from "@/components/ui/footer-section";
import { motion } from "framer-motion";
import { Film } from "lucide-react";

const testimonials: iTestimonial[] = [
  {
    name: "Arun Krishnan",
    designation: "Director — Mollywood",
    description:
      "CineACUMEN has completely transformed how I reference scenes during pre-production. I can query the entire screenplay in seconds and get the exact scene with context. It's like having the script in my head.",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
  },
  {
    name: "Meena Pillai",
    designation: "Cinematographer",
    description:
      "As a DOP, I need to quickly understand the mood and lighting cues from the script. CineACUMEN finds every scene referencing visual tone in moments. Absolutely indispensable on set.",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80",
  },
  {
    name: "Rahul Menon",
    designation: "Music Composer",
    description:
      "I use CineACUMEN to find emotional arcs across the screenplay. Querying by emotion type gives me exactly the scenes I need to score. The Malayalam support is flawless.",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80",
  },
  {
    name: "Divya Nair",
    designation: "Screenwriter",
    description:
      "When reviewing drafts, I can compare scene intentions against the actual dialogue. CineACUMEN is the only AI tool that truly understands Mollywood storytelling conventions.",
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
  },
  {
    name: "Santhosh George",
    designation: "Production Designer",
    description:
      "Finding all scenes with specific location or prop requirements used to take hours. Now it takes seconds. CineACUMEN has made our production design workflow 10x faster.",
    profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80",
  },
  {
    name: "Lakshmi Varma",
    designation: "Assistant Director",
    description:
      "Managing shot lists from the screenplay is effortless with CineACUMEN. I query in Malayalam and get precise answers. No other tool has come close to this level of accuracy.",
    profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80",
  },
];

const cards = testimonials.map((t) => (
  <TestimonialCard
    key={t.name}
    testimonial={t}
    backgroundImage="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop"
  />
));

export default function TestimonialsPage() {
  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden pt-16">
      {/* Background gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(253,176,34,0.05) 0%, transparent 60%), #000",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-4 py-1.5 mb-8">
            <Film className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs uppercase tracking-[0.3em] text-amber-400">From the crew</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-5">
            Trusted by Mollywood{" "}
            <span className="text-amber-400">film crews</span>
          </h1>
          <p className="text-zinc-500 max-w-xl mx-auto text-base md:text-lg leading-relaxed">
            Directors, cinematographers, composers, and writers across Kerala use CineACUMEN to
            unlock deeper insights from their screenplays.
          </p>
        </motion.div>

        {/* Testimonial Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Carousel items={cards} />
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { value: "200+", label: "Film Crews" },
            { value: "50+", label: "Screenplays" },
            { value: "2", label: "Languages" },
            { value: "99%", label: "Satisfaction" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/8 bg-zinc-950 p-6 text-center"
            >
              <div className="text-3xl font-black text-white">{stat.value}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      <Footer />
    </main>
  );
}
