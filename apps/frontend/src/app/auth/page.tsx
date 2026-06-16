"use client";

import Link from "next/link";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowRight, LogIn, UserPlus, Film } from "lucide-react";
import { useSearchParams } from "next/navigation";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Page                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export default function AuthChoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <AuthChoiceContent />
    </Suspense>
  );
}

function AuthChoiceContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const loginHref = `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const signupHref = `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-6 text-white">
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 50% 0%, rgba(253,176,34,0.06), transparent 60%), #000000",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-lg">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10 flex items-center justify-center gap-2"
        >
          <Film className="h-5 w-5 text-amber-400" />
          <span className="text-sm font-semibold tracking-tight text-white">CineRAG</span>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-center"
        >
          <h1 className="text-4xl font-black tracking-tighter sm:text-5xl">
            Get started.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-500">
            Sign in to continue where you left off, or create an account to explore AI-powered screenplay analysis.
          </p>
        </motion.div>

        {/* Option cards */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mt-10 grid gap-3"
        >
          {/* Sign in */}
          <Link
            href={loginHref}
            className="group flex items-center gap-4 rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
              <LogIn className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-white">Sign in</p>
              <p className="mt-0.5 text-xs text-zinc-600">
                Return to your projects and screenplay queries.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-zinc-700 transition-all group-hover:translate-x-0.5 group-hover:text-white" />
          </Link>

          {/* Create account */}
          <Link
            href={signupHref}
            className="group flex items-center gap-4 rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-amber-500/20 hover:bg-amber-500/[0.03]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 ring-1 ring-amber-500/15">
              <UserPlus className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-white">Create account</p>
              <p className="mt-0.5 text-xs text-zinc-600">
                Set up your crew role and start your first project.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-zinc-700 transition-all group-hover:translate-x-0.5 group-hover:text-amber-400" />
          </Link>
        </motion.div>

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {["Secure auth", "Callback preserved", "Malayalam-friendly"].map(
            (tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1 text-[11px] text-zinc-600"
              >
                {tag}
              </span>
            )
          )}
        </motion.div>

        {/* Back to home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-10 text-center"
        >
          <Link
            href="/"
            className="text-xs text-zinc-600 transition-colors hover:text-white"
          >
            ← Back to home
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
