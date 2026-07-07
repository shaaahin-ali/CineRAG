"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronRight,
  Film,
  Layers3,
  LogOut,
  Mail,
  MessageSquare,
  Shield,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, PLAN_DETAILS } from "@/hooks/useSubscription";
import { PricingModal } from "@/components/PricingModal";
import { api } from "@/lib/api-client";
import { Footer } from "@/components/ui/footer-section";
import type { Project } from "@/types";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getStatusColor(status: string) {
  switch (status) {
    case "ready":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/25";
    case "indexing":
      return "bg-amber-500/15 text-amber-400 border-amber-500/25";
    case "uploading":
      return "bg-blue-500/15 text-blue-400 border-blue-500/25";
    case "error":
      return "bg-red-500/15 text-red-400 border-red-500/25";
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/25";
  }
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Animation variants                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
} as const;

/* ────────────────────────────────────────────────────────────────────────── */
/*  Page                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { logout } = useAuth();
  const { plan } = useSubscription();
  const [showPricing, setShowPricing] = useState(false);

  const name = session?.user?.name || "CineRAG User";
  const email = session?.user?.email || "";
  const avatar = session?.user?.image || "";
  const handle = email ? `@${email.split("@")[0]}` : "@user";

  /* ── Fetch projects for stats ──────────────────────────────────────── */
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => api.get<Project[]>("/api/v1/projects"),
  });

  const stats = useMemo(() => {
    const ready = projects.filter((p) => p.status === "ready").length;
    const totalScenes = projects.reduce(
      (sum, p) => sum + (p.scene_count ?? 0),
      0
    );
    const totalChars = projects.reduce(
      (sum, p) => sum + (p.character_count ?? 0),
      0
    );
    return {
      total: projects.length,
      ready,
      scenes: totalScenes,
      characters: totalChars,
    };
  }, [projects]);

  const recentProjects = projects.slice(0, 5);

  const memberSince = session?.user
    ? formatDate(new Date().toISOString())
    : "—";

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white pt-16">
      {/* ── Ambient background gradients ─────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 20% 0%, rgba(253,176,34,0.07), transparent 60%), radial-gradient(ellipse 50% 50% at 80% 10%, rgba(253,176,34,0.04), transparent 50%), radial-gradient(circle at 50% 80%, rgba(255,255,255,0.02), transparent 40%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        {/* ── Hero Card ──────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-zinc-950 shadow-2xl"
        >
          {/* Gold accent strip */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />

          {/* Decorative shimmer */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(253,176,34,0.06), transparent 70%)",
            }}
          />

          <div className="relative p-6 sm:p-8 md:p-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-start">
              {/* Avatar + Identity */}
              <div className="flex flex-1 items-start gap-5">
                {/* Avatar */}
                <div className="group relative">
                  <div className="absolute -inset-1 rounded-[22px] bg-gradient-to-br from-amber-500/30 via-amber-600/10 to-transparent opacity-60 blur-sm transition-opacity group-hover:opacity-100" />
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[20px] border border-white/15 bg-zinc-900 ring-1 ring-amber-500/10 sm:h-24 sm:w-24">
                    {avatar ? (
                      <Image
                        src={avatar}
                        alt={name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-600/5">
                        <span className="text-2xl font-bold tracking-tight text-amber-400/80 sm:text-3xl">
                          {getInitials(name)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name + Meta */}
                <div className="min-w-0 pt-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-amber-500/70">
                    Your profile
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                    {name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-400">
                    <span className="font-mono text-zinc-500">{handle}</span>
                    <span className="text-zinc-700">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Shield className="h-3 w-3 text-emerald-500/70" />
                      Authenticated
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA buttons */}
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  id="profile-goto-dashboard"
                  onClick={() => router.push("/dashboard")}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/10"
                >
                  Go to dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  id="profile-logout"
                  onClick={() => void logout()}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Stats Grid ─────────────────────────────────────────────── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {[
            {
              label: "Projects",
              value: stats.total,
              icon: Layers3,
              accent: "from-amber-500/20 to-amber-600/5",
            },
            {
              label: "Ready",
              value: stats.ready,
              icon: Film,
              accent: "from-emerald-500/20 to-emerald-600/5",
            },
            {
              label: "Scenes parsed",
              value: stats.scenes,
              icon: BookOpen,
              accent: "from-blue-500/20 to-blue-600/5",
            },
            {
              label: "Characters",
              value: stats.characters,
              icon: MessageSquare,
              accent: "from-violet-500/20 to-violet-600/5",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                variants={fadeUp}
                className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-zinc-950 p-5 transition-all hover:border-white/15"
              >
                {/* subtle gradient bg */}
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent} opacity-0 transition-opacity group-hover:opacity-100`}
                />
                <div className="relative flex items-center justify-between">
                  <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                    {item.label}
                  </span>
                  <Icon className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-white" />
                </div>
                <div className="relative mt-3 text-3xl font-black tracking-tight text-white">
                  {item.value}
                </div>
              </motion.div>
            );
          })}
        </motion.section>

        {/* ── Two-column layout ───────────────────────────────────────── */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Left — Recent Projects */}
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 sm:p-8"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-500">
                  Recent activity
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
                  Your Projects
                </h2>
              </div>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-400"
              >
                View all
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-zinc-900">
                  <Film className="h-7 w-7 text-zinc-600" />
                </div>
                <p className="mt-4 text-sm font-medium text-zinc-400">
                  No projects yet
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  Create a project from the dashboard to get started.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Create project
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 * i }}
                    className="group cursor-pointer rounded-[20px] border border-white/8 bg-zinc-900/50 p-4 transition-all hover:border-amber-500/20 hover:bg-zinc-900"
                    onClick={() => {
                      if (project.status === "ready") {
                        router.push(`/query/${project.id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <Film className="h-4 w-4 shrink-0 text-amber-500/60" />
                          <h3 className="truncate text-sm font-semibold text-white">
                            {project.title}
                          </h3>
                        </div>
                        {project.description && (
                          <p className="mt-1.5 line-clamp-1 pl-6 text-xs text-zinc-500">
                            {project.description}
                          </p>
                        )}
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-6 text-[11px] text-zinc-600">
                          <span>{project.scene_count ?? 0} scenes</span>
                          <span className="text-zinc-800">·</span>
                          <span>
                            {project.character_count ?? 0} characters
                          </span>
                          <span className="text-zinc-800">·</span>
                          <span>{formatDate(project.created_at)}</span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${getStatusColor(project.status)}`}
                      >
                        {project.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Right — Account details + Quick actions */}
          <motion.aside
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="grid gap-4 self-start"
          >
            {/* Account info */}
            <div className="rounded-[32px] border border-white/10 bg-zinc-950 p-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-500">
                Account
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Details
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-zinc-900/50 p-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                    <UserCircle2 className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                      Name
                    </p>
                    <p className="truncate text-sm font-medium text-white">
                      {name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-zinc-900/50 p-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10">
                    <Mail className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                      Email
                    </p>
                    <p className="truncate text-sm font-medium text-white">
                      {email || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-zinc-900/50 p-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                      Member since
                    </p>
                    <p className="text-sm font-medium text-white">
                      {memberSince}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-zinc-900/50 p-3.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                    <Shield className="h-4 w-4 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                      Status
                    </p>
                    <p className="flex items-center gap-2 text-sm font-medium text-white">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                      Active
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-[32px] border border-white/10 bg-zinc-950 p-6">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Quick actions
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  {
                    label: "Create new project",
                    desc: "Upload and analyze a screenplay",
                    href: "/dashboard",
                    icon: Film,
                  },
                  {
                    label: "Explore features",
                    desc: "See what CineRAG can do",
                    href: "/features",
                    icon: BarChart3,
                  },
                  {
                    label: "About CineRAG",
                    desc: "Learn about the platform",
                    href: "/about",
                    icon: BookOpen,
                  },
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => router.push(action.href)}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-zinc-900/30 p-3.5 text-left transition-all hover:border-amber-500/20 hover:bg-zinc-900"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-zinc-900 transition-colors group-hover:border-amber-500/20 group-hover:bg-amber-500/10">
                        <Icon className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">
                          {action.label}
                        </p>
                        <p className="text-[11px] text-zinc-600">
                          {action.desc}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-700 transition-all group-hover:translate-x-0.5 group-hover:text-amber-500/60" />
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.aside>
        </div>
      </div>

      {/* ── Subscription Section ─────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8"
      >
        <div className="rounded-[32px] border border-white/10 bg-zinc-950 p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-500">
                Subscription
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
                Your Plan
              </h2>
            </div>
            {plan && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] ${
                  plan === "pro"
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                    : "bg-zinc-800 text-zinc-400 border border-white/10"
                }`}
              >
                {plan === "pro" ? "Pro" : "Free"}
              </span>
            )}
          </div>

          {!plan ? (
            <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 py-14 text-center">
              <p className="text-sm font-medium text-zinc-400 mb-2">
                No plan selected yet
              </p>
              <p className="text-xs text-zinc-600 mb-5">
                Choose a plan to unlock AI features.
              </p>
              <button
                type="button"
                onClick={() => setShowPricing(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200"
              >
                Choose a plan
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Plan details */}
              <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-zinc-900/50 p-4">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {PLAN_DETAILS[plan].name} Plan
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {plan === "pro" ? "$24 / user / month" : "Free forever"}
                  </p>
                </div>
                {plan === "free" && (
                  <button
                    type="button"
                    onClick={() => setShowPricing(true)}
                    className="rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-black transition hover:-translate-y-0.5 hover:bg-amber-400"
                  >
                    Upgrade to Pro
                  </button>
                )}
              </div>

              {/* Features unlocked */}
              <div className="rounded-2xl border border-white/8 bg-zinc-900/50 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3">
                  Features unlocked
                </p>
                <div className="space-y-2">
                  {PLAN_DETAILS[plan].features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="text-sm text-zinc-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.section>

      <Footer />

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        onPlanSelected={() => setShowPricing(false)}
      />
    </main>
  );
}
