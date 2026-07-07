"use client";

import { HeroSection }        from "@/components/landing/HeroSection";
import { FeaturesGrid }       from "@/components/landing/FeaturesGrid";
import { SocialProofStrip }   from "@/components/landing/SocialProofStrip";
import { LandingCTASection }  from "@/components/landing/LandingCTASection";
import { LandingFooter }      from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <main
      className="min-h-screen text-white flex flex-col overflow-hidden relative"
      style={{ background: "var(--bg-deep)" }}
    >
      {/* HERO — two-column layout with morphing headline + chat preview */}
      <HeroSection />

      {/* FEATURES — 4-card horizontal grid */}
      <FeaturesGrid />

      {/* SOCIAL PROOF — scrolling trust strip */}
      <SocialProofStrip />

      {/* CTA — gradient-border card */}
      <LandingCTASection />

      {/* FOOTER */}
      <LandingFooter />
    </main>
  );
}
