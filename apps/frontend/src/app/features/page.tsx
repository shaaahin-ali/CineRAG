"use client";

import React from 'react';
import { SectionWithMockup } from "@/components/ui/section-with-mockup";
import { HoverButton } from "@/components/ui/hover-button";
import { GooeyMarquee } from "@/components/ui/gooey-marquee";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

export default function FeaturesPage() {
    const router = useRouter();
    const { status } = useSession();
    const isAuthenticated = status === "authenticated";
    const ctaHref = isAuthenticated ? "/dashboard" : "/auth";
    const ctaLabel = isAuthenticated ? "Open dashboard" : "Start Your Project";

    return (
        <main className="min-h-screen bg-black text-white flex flex-col pt-28 pb-20 relative">

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="container mx-auto px-6 mb-4 text-center relative z-10">
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-xs uppercase tracking-[0.35em] text-gold-400/80 font-mono mb-6"
                >
                    What Powers CineRAG
                </motion.p>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-black tracking-tighter mb-6"
                >
                    Our Features
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.25 }}
                    className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed"
                >
                    The intelligence behind CineRAG. A deep dive into the capabilities of our AI-powered screenplay assistant.
                </motion.p>
            </div>

            {/* ── Marquee Strip ────────────────────────────────────────── */}
            <div className="relative z-10 py-6 border-y border-white/5">
                <GooeyMarquee
                    text="Screenplay AI  •  Scene Citations  •  Role-Based Context  •  Malayalam & English  •  Streaming Answers  •  "
                    speed={22}
                    className="text-5xl md:text-7xl font-black tracking-tighter text-white/90"
                />
            </div>

            {/* ── Feature 1: Cinematic Understanding ───────────────────── */}
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
                        Our AI models are specifically trained on
                        Malayalam cinema tropes, cultural nuances,
                        and emotional arcs to provide authentic analysis
                        that understands the soul of Mollywood storytelling.
                    </>
                }
                primaryImageSrc="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop"
                secondaryImageSrc="https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop"
            />

            {/* ── Feature 2: Role-Based Context ────────────────────────── */}
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
                        Whether you are the Director, Cinematographer,
                        or Music Composer, the AI extracts the exact
                        scenes, emotions, and technical cues for your specific role
                        in the film crew.
                    </>
                }
                primaryImageSrc="https://images.unsplash.com/photo-1440407876336-54f4b23dfb01?q=80&w=800&auto=format&fit=crop"
                secondaryImageSrc="https://images.unsplash.com/photo-1501426026826-31c667bdf23d?q=80&w=800&auto=format&fit=crop"
                reverseLayout={true}
            />

            {/* ── Feature 3: Bilingual Intelligence ────────────────────── */}
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
                        Query your screenplay in Malayalam or English and receive
                        precise, context-aware answers. CineRAG bridges language
                        barriers so every crew member can access the story&apos;s
                        depth effortlessly.
                    </>
                }
                primaryImageSrc="https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=800&auto=format&fit=crop"
                secondaryImageSrc="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=800&auto=format&fit=crop"
            />

            {/* ── CTA ──────────────────────────────────────────────────── */}
            <div className="container mx-auto px-6 mt-20 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <HoverButton
                        type="button"
                        onClick={() => router.push(ctaHref)}
                    >
                        {ctaLabel}
                    </HoverButton>
                </motion.div>
            </div>
        </main>
    );
}
