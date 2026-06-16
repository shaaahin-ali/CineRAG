"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Film, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";

export default function RotatingGradientRight() {
  const router = useRouter();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const primaryHref = isAuthenticated ? "/dashboard" : "/auth";
  const primaryLabel = isAuthenticated ? "Open dashboard" : "Create account";

  return (
    <section className="w-full text-white px-6 py-16 md:px-12">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div className="relative mx-auto flex h-[28rem] w-full max-w-[36rem] items-center justify-center overflow-hidden rounded-3xl">
          <div className="absolute -inset-10 flex items-center justify-center">
            <div
              className="h-[120%] w-[120%] rounded-[36px] blur-3xl opacity-70 animate-[spin_10s_linear_infinite]"
              style={{
                background:
                  "conic-gradient(from 0deg, #FDB022, #22C55E, #60A5FA, #8B5CF6, #F43F5E, #FDB022)",
              }}
            />
          </div>

          <Card className="w-[300px] z-10 rounded-2xl border border-white/10 bg-black/85 shadow-2xl backdrop-blur-xl">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Film className="w-4 h-4 text-gold-400" />
                  CineRAG
                </span>
                <span className="text-xs text-zinc-400">Live</span>
              </div>

              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full w-[88%] rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #FDB022, #F79009, #22C55E)",
                  }}
                />
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Malayalam screenplay intelligence — scene citations, role-based
                context, and streaming answers for your entire crew.
              </p>

              <Button
                variant="secondary"
                className="mt-4 w-full rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                asChild
              >
                <Link href="/features">
                  Explore features <Sparkles className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-400/80 font-mono">
            Mollywood AI Assistant
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-tight">
            Query your screenplay.
            <span className="block text-zinc-500 font-normal text-xl md:text-2xl mt-3 tracking-normal">
              Upload a script, ask in Malayalam or English, and get precise scene
              citations — built for directors, writers, and the full film crew.
            </span>
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              onClick={() => router.push(primaryHref)}
            >
              {primaryLabel} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            {!isAuthenticated ? (
              <Button
                type="button"
                variant="ghost"
                className="text-zinc-400 hover:text-white"
                onClick={() => router.push("/auth/login")}
              >
                Sign in
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="text-zinc-400 hover:text-white"
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
