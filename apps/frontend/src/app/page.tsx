"use client";

import dynamic from "next/dynamic";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { motion } from "framer-motion";

const GooeyText = dynamic(() => import("@/components/ui/gooey-text-morphing").then(m => m.GooeyText), { ssr: false });
const GooeyMarquee = dynamic(() => import("@/components/ui/gooey-marquee").then(m => m.GooeyMarquee), { ssr: false });

// Lazy-load the heavy feature sections — they are below the fold
// and don't need to be in the critical render path
const SectionWithMockup = dynamic(
  () =>
    import("@/components/ui/section-with-mockup").then(
      (m) => m.SectionWithMockup
    ),
  { ssr: false }
);

export default function LandingPage() {

  return (
    <main className="min-h-screen bg-black text-white flex flex-col overflow-hidden relative">
      {/* ── Subtle radial backdrop ─────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(253,176,34,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(34,197,94,0.04) 0%, transparent 50%), #000000",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,#000000_85%)]" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — above the fold, loads immediately
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 flex flex-col items-center justify-center w-full min-h-[85vh] pt-28 pb-16 px-6">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-xs uppercase tracking-[0.35em] text-zinc-500 mb-8 font-mono text-center"
        >
          AI for Mollywood Screenplays
        </motion.p>

        <div className="h-[260px] md:h-[320px] w-full flex items-center justify-center">
          <GooeyText
            texts={["Welcome to", "CineRAG"]}
            morphTime={1.5}
            cooldownTime={1.5}
            className="font-black tracking-tighter"
          />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 md:mt-12 max-w-lg text-center text-sm md:text-base text-zinc-500 leading-relaxed"
        >
          Upload a Malayalam screenplay. Query in Malayalam or English.
          Get streaming answers with exact scene citations.
        </motion.p>

        {/* CTA — visible instantly, label updates once session resolves */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10"
        >
          <LandingCTA />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mt-12"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border border-zinc-700 flex items-start justify-center p-1"
          >
            <div className="w-1 h-2 rounded-full bg-zinc-500" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          GOOEY MARQUEE — Feature Strip
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-8">
        <div className="border-y border-white/5">
          <GooeyMarquee
            text="Screenplay AI  •  Scene Citations  •  Role-Based Context  •  Malayalam & English  •  Streaming Answers  •  Film Crew Intelligence  •  "
            speed={20}
            className="text-6xl md:text-8xl font-black tracking-tighter text-white/90"
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURE SECTIONS — lazy loaded (below the fold)
      ═══════════════════════════════════════════════════════════════════ */}
      <SectionWithMockup
        title={
          <>
            Cinematic
            <br />
            Understanding.
          </>
        }
        description={
          <>
            Our AI models are specifically trained on Malayalam cinema tropes,
            cultural nuances, and emotional arcs to provide authentic analysis
            that understands the soul of Mollywood storytelling.
          </>
        }
        primaryImageSrc="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop"
        secondaryImageSrc="https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop"
      />

      <SectionWithMockup
        title={
          <>
            Role-based
            <br />
            Context.
          </>
        }
        description={
          <>
            Whether you are the Director, Cinematographer, or Music Composer,
            the AI extracts the exact scenes, emotions, and technical cues
            personalized for your specific role in the crew.
          </>
        }
        primaryImageSrc="https://images.unsplash.com/photo-1604928141064-207cea6f571f?q=80&w=800&auto=format&fit=crop"
        secondaryImageSrc="https://images.unsplash.com/photo-1585647347384-2593bc35786b?q=80&w=800&auto=format&fit=crop"
        reverseLayout={true}
      />

      <SectionWithMockup
        title={
          <>
            Bilingual
            <br />
            Intelligence.
          </>
        }
        description={
          <>
            Query your screenplay in Malayalam or English and receive precise,
            context-aware answers. CineRAG bridges language barriers so every
            crew member can access the story&apos;s depth effortlessly.
          </>
        }
        primaryImageSrc="https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=800&auto=format&fit=crop"
        secondaryImageSrc="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800&auto=format&fit=crop"
      />

      {/* ═══════════════════════════════════════════════════════════════════
          CTA — Get Started
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 flex flex-col items-center justify-center py-32 px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-5xl font-black tracking-tighter text-center mb-4"
        >
          Ready to elevate your screenplay?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-zinc-500 text-center mb-10 max-w-md"
        >
          Join film crews across Mollywood using AI to unlock deeper story insights.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <LandingCTA />
        </motion.div>
      </section>

      {/* ── Footer gradient line ──────────────────────────────────────── */}
      <div
        className="w-full h-px"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(253,176,34,0.3) 0%, rgba(253,176,34,0) 100%)",
        }}
      />
    </main>
  );
}
