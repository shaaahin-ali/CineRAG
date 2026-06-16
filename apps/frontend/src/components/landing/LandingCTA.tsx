"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { HoverButton } from "@/components/ui/hover-button";

export function LandingCTA() {
  const router = useRouter();
  const { status } = useSession();
  
  const ctaHref = status === "authenticated" ? "/dashboard" : "/auth";
  const ctaLabel = status === "authenticated" ? "Dashboard" : "Get Started";

  return (
    <HoverButton
      type="button"
      onClick={() => router.push(ctaHref)}
    >
      {ctaLabel}
    </HoverButton>
  );
}
