"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Film,
  Layers3,
  MessageSquareText,
  Search,
  Sparkles,
} from "lucide-react";

const pillars = [
  {
    icon: Search,
    title: "Scene-level search",
    description:
      "Ask questions in Malayalam or English and jump directly to the lines that matter.",
  },
  {
    icon: MessageSquareText,
    title: "Crew-aware context",
    description:
      "Responses can be shaped for directors, writers, cinematographers, and composers.",
  },
  {
    icon: BookOpen,
    title: "Exact citations",
    description:
      "Every answer is anchored to screenplay scenes so teams can trust and verify it quickly.",
  },
  {
    icon: Layers3,
    title: "Project workflow",
    description:
      "Upload scripts, index them, and keep everything organized inside one dashboard.",
  },
];

export default function AboutPage() {
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const primaryHref = isAuthenticated ? "/dashboard" : "/auth";
  const primaryLabel = isAuthenticated ? "Open dashboard" : "Get started";

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white pt-16">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(253,176,34,0.10), transparent 25%), radial-gradient(circle at 85% 25%, rgba(96,165,250,0.08), transparent 22%), radial-gradient(circle at 50% 80%, rgba(34,197,94,0.06), transparent 28%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.7)_90%)]" />

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-28 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-zinc-400"
        >
          <Film className="h-4 w-4 text-gold-400" />
          About CineACUMEN
        </motion.div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-3xl text-5xl font-black tracking-tighter md:text-7xl"
            >
              Built for Malayalam film crews who need faster screenplay insight.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg"
            >
              CineACUMEN helps film teams upload scripts, search scenes, and ask questions
              in the language that feels natural. The goal is simple: reduce manual
              script hunting and give creative teams trustworthy answers with citations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Button
                type="button"
                className="rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-black hover:bg-gold-400/90"
                onClick={() => router.push(primaryHref)}
              >
                {primaryLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                onClick={() => router.push("/features")}
              >
                View features
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Sparkles className="h-4 w-4 text-gold-400" />
              What CineACUMEN does
            </div>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-400">
              <p>1. Upload a screenplay and create a project.</p>
              <p>2. Wait for indexing, then query by scene or topic.</p>
              <p>3. Use bilingual answers to keep the whole crew aligned.</p>
              <p>4. Return to the dashboard anytime to manage projects.</p>
            </div>
          </motion.div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="rounded-[28px] border border-white/10 bg-black/30 p-6 backdrop-blur-xl"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-white">{pillar.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {pillar.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
