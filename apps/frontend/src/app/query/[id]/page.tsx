"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Film, ArrowLeft, BookOpen, Users, X, ChevronDown, Send } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { QueryInterface } from "@/components/QueryInterface";
import { QueryHistory } from "@/components/QueryHistory";
import { api } from "@/lib/api-client";
import { Project } from "@/types";

interface QueryPageProps {
  params: { id: string };
}

const CREW_ROLES = [
  { value: "producer", label: "Producer" },
  { value: "director", label: "Director" },
  { value: "actor", label: "Actor" },
  { value: "cinematographer", label: "Cinematographer" },
  { value: "editor", label: "Editor" },
  { value: "music", label: "Music Director" },
  { value: "viewer", label: "Viewer (Read only)" },
] as const;

export default function QueryPage({ params }: QueryPageProps) {
  const [showShare, setShowShare] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("viewer");

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["project", params.id],
    queryFn: () => api.get<Project>(`/api/v1/projects/${params.id}`),
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/v1/projects/${params.id}/invite`, {
        email: inviteEmail,
        role: inviteRole,
      }),
    onSuccess: () => {
      toast.success("Invitation sent!", {
        description: `${inviteEmail} now has ${inviteRole} access to this project.`,
      });
      setInviteEmail("");
      setInviteRole("viewer");
      setShowShare(false);
    },
    onError: (err: Error) => {
      toast.error("Failed to invite", { description: err.message });
    },
  });

  return (
    <main className="min-h-screen flex flex-col bg-transparent">
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav
        className="border-b px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{
          borderColor: "var(--border-subtle)",
          background: "rgba(5,7,15,0.9)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            id="back-to-dashboard"
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>/</span>
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4" style={{ color: "var(--accent-gold)" }} />
            <span className="font-semibold text-white text-sm">
              {isLoading ? "Loading..." : project?.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {project && (
            <div
              className="hidden md:flex items-center gap-1.5 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              {project.scene_count} scenes · {project.page_count} pages
            </div>
          )}

          {/* Share button */}
          {project && (
            <button
              id="share-project-btn"
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: "rgba(253,176,34,0.1)",
                border: "1px solid rgba(253,176,34,0.25)",
                color: "var(--accent-gold)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(253,176,34,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(253,176,34,0.1)";
              }}
            >
              <Users className="w-3.5 h-3.5" />
              Share
            </button>
          )}
        </div>
      </nav>

      {/* ── Share Modal ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showShare && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowShare(false)}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <div
                className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
                style={{
                  background: "rgba(10,12,20,0.98)",
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-semibold text-white">Share Project</h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Invite a crew member to access{" "}
                      <span style={{ color: "var(--accent-gold)" }}>{project?.title}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowShare(false)}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Email address
                  </label>
                  <input
                    id="invite-email-input"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="crew@example.com"
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(253,176,34,0.4)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>

                {/* Role */}
                <div className="mb-6">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Crew role
                  </label>
                  <div className="relative">
                    <select
                      id="invite-role-select"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full appearance-none rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition cursor-pointer pr-9"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      {CREW_ROLES.map((r) => (
                        <option key={r.value} value={r.value} style={{ background: "#0a0c14" }}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                    They will only see this project on their dashboard.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => inviteMutation.mutate()}
                    disabled={!inviteEmail || inviteMutation.isPending}
                    id="send-invite-btn"
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-black transition-all disabled:opacity-50"
                    style={{ background: "var(--accent-gold)" }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {inviteMutation.isPending ? "Sending..." : "Send Invite"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShare(false)}
                    className="px-4 rounded-xl py-2.5 text-sm font-medium text-zinc-400 transition-all hover:text-white hover:bg-white/5"
                    style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* History Sidebar */}
        <div
          className="w-80 border-r hidden lg:block overflow-hidden"
          style={{ borderColor: "var(--border-subtle)", background: "rgba(255,255,255,0.02)" }}
        >
          {project && <QueryHistory projectId={params.id} />}
        </div>

        {/* Query area */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto h-full min-h-[calc(100vh-120px)]">
            {isLoading ? (
              <div className="space-y-4">
                <div className="skeleton h-40 rounded-2xl" />
                <div className="skeleton h-20 rounded-xl" />
              </div>
            ) : project?.status !== "ready" ? (
              <div className="text-center py-24">
                <div
                  className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "rgba(253,176,34,0.1)" }}
                >
                  <Film className="w-8 h-8" style={{ color: "var(--accent-gold)" }} />
                </div>
                <p className="text-lg font-semibold text-white mb-2">
                  Still indexing…
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Scenes are being embedded. Check back in a minute.
                </p>
              </div>
            ) : (
              <QueryInterface projectId={params.id} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
