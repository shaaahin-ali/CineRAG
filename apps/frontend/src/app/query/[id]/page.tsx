"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Film,
  ArrowLeft,
  BookOpen,
  Users,
  X,
  ChevronDown,
  Send,
  Network,
  BookMarked,
  PlaySquare,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { QueryInterface } from "@/components/QueryInterface";
import { QueryHistory } from "@/components/QueryHistory";
import { CharacterGraphPanel } from "@/components/CharacterGraphPanel";
import { SceneStoryboardPanel } from "@/components/SceneStoryboardPanel";
import { SceneVideosPanel } from "@/components/SceneVideosPanel";
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
  const [showGraph, setShowGraph] = useState(false);
  const [showStoryboard, setShowStoryboard] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("viewer");

  const { data: session } = useSession();
  const avatar = session?.user?.image || "";
  const name = session?.user?.name || "User";

  const activePanel = showGraph
    ? { label: "Characters", close: () => setShowGraph(false) }
    : showStoryboard
    ? { label: "Story Beats", close: () => setShowStoryboard(false) }
    : showVideo
    ? { label: "Scene Clips", close: () => setShowVideo(false) }
    : null;

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
    <main
      className="min-h-screen flex flex-col"
      style={{ background: "#05070f" }}
    >
      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <nav
        className="border-b px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{
          borderColor: "rgba(30,40,80,0.7)",
          background: "rgba(5,7,15,0.95)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center gap-3">
          {activePanel ? (
            <button
              type="button"
              id="close-active-panel"
              onClick={activePanel.close}
              className="flex items-center gap-1.5 text-sm transition-colors rounded-lg px-2 py-1.5"
              style={{ color: "rgba(160,180,255,0.5)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "white";
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(160,180,255,0.5)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Close {activePanel.label}</span>
            </button>
          ) : (
            <Link
              href="/dashboard"
              id="back-to-dashboard"
              className="flex items-center gap-1.5 text-sm transition-colors"
              style={{ color: "rgba(160,180,255,0.5)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(160,180,255,0.5)")}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}
          <span style={{ color: "rgba(255,255,255,0.12)" }}>/</span>
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4" style={{ color: "#4f9eff" }} />
            <span className="font-semibold text-white text-sm">
              {isLoading ? "Loading..." : project?.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {project && (
            <div
              className="hidden md:flex items-center gap-1.5 text-xs"
              style={{ color: "rgba(160,180,255,0.4)" }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              {project.scene_count} scenes · {project.page_count} indexed page
            </div>
          )}

          {/* ── Feature toolbar ── */}
          {project && project.status === "ready" && (
            <>
              <div className="hidden md:block w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.06)" }} />

              {/* Characters */}
              <button
                id="character-graph-btn"
                onClick={() => setShowGraph(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: showGraph ? "rgba(139,92,246,0.18)" : "rgba(139,92,246,0.07)",
                  border: `1px solid ${showGraph ? "rgba(139,92,246,0.5)" : "rgba(139,92,246,0.2)"}`,
                  color: "#A78BFA",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.16)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = showGraph ? "rgba(139,92,246,0.18)" : "rgba(139,92,246,0.07)"; }}
              >
                <Network className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Characters</span>
              </button>

              {/* Story Beats */}
              <button
                id="scene-storyboard-btn"
                onClick={() => setShowStoryboard(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: showStoryboard ? "rgba(20,184,166,0.15)" : "rgba(20,184,166,0.06)",
                  border: `1px solid ${showStoryboard ? "rgba(20,184,166,0.5)" : "rgba(20,184,166,0.18)"}`,
                  color: "#2dd4bf",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(20,184,166,0.14)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = showStoryboard ? "rgba(20,184,166,0.15)" : "rgba(20,184,166,0.06)"; }}
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Story Beats</span>
              </button>

              {/* Scene Clips */}
              <button
                id="scene-video-btn"
                onClick={() => setShowVideo(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: showVideo ? "rgba(96,165,250,0.16)" : "rgba(96,165,250,0.06)",
                  border: `1px solid ${showVideo ? "rgba(96,165,250,0.5)" : "rgba(96,165,250,0.18)"}`,
                  color: "#60A5FA",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(96,165,250,0.14)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = showVideo ? "rgba(96,165,250,0.16)" : "rgba(96,165,250,0.06)"; }}
              >
                <PlaySquare className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Scene Clips</span>
              </button>

              {/* Share */}
              <button
                id="share-project-btn"
                onClick={() => setShowShare(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: "rgba(79,158,255,0.08)",
                  border: "1px solid rgba(79,158,255,0.2)",
                  color: "#4f9eff",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(79,158,255,0.16)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(79,158,255,0.08)"; }}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Share</span>
              </button>

              <div className="hidden md:block w-px h-5 mx-1" style={{ background: "rgba(255,255,255,0.06)" }} />

              {/* Avatar */}
              <Link
                href="/profile"
                className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border transition-all ml-1"
                style={{ borderColor: "rgba(79,158,255,0.25)", background: "#0d1020" }}
                title={`${name} — Profile`}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(79,158,255,0.6)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(79,158,255,0.25)"; }}
              >
                {avatar ? (
                  <Image src={avatar} alt={name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-xs font-bold text-white">
                    {name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                )}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Share Modal ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showShare && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowShare(false)}
            />
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
                  background: "rgba(8,11,24,0.99)",
                  borderColor: "rgba(79,158,255,0.15)",
                  boxShadow: "0 0 60px rgba(79,158,255,0.08)",
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-semibold text-white">Share Project</h2>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(160,180,255,0.5)" }}>
                      Invite a crew member to{" "}
                      <span style={{ color: "#4f9eff" }}>{project?.title}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowShare(false)}
                    className="rounded-lg p-1.5 transition-colors"
                    style={{ color: "rgba(160,180,255,0.4)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "white"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(160,180,255,0.4)"; }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(160,180,255,0.6)" }}>
                    Email address
                  </label>
                  <input
                    id="invite-email-input"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="crew@example.com"
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-zinc-700 focus:outline-none transition"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(79,158,255,0.15)",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(79,158,255,0.4)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(79,158,255,0.15)")}
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(160,180,255,0.6)" }}>
                    Crew role
                  </label>
                  <div className="relative">
                    <select
                      id="invite-role-select"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full appearance-none rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition cursor-pointer pr-9"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(79,158,255,0.15)",
                      }}
                    >
                      {CREW_ROLES.map((r) => (
                        <option key={r.value} value={r.value} style={{ background: "#05070f" }}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(160,180,255,0.4)" }} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => inviteMutation.mutate()}
                    disabled={!inviteEmail || inviteMutation.isPending}
                    id="send-invite-btn"
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#4f9eff,#7c6dff)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {inviteMutation.isPending ? "Sending..." : "Send Invite"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShare(false)}
                    className="px-4 rounded-xl py-2.5 text-sm font-medium transition-all"
                    style={{ border: "1px solid rgba(79,158,255,0.15)", color: "rgba(160,180,255,0.5)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "white"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(160,180,255,0.5)"; e.currentTarget.style.background = "transparent"; }}
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
          className="w-72 border-r hidden lg:block overflow-hidden flex-shrink-0"
          style={{ borderColor: "rgba(30,40,80,0.5)", background: "rgba(8,11,24,0.6)" }}
        >
          {project && <QueryHistory projectId={params.id} />}
        </div>

        {/* Query area — glowing blue border card */}
        <div className="flex-1 p-4 md:p-5 overflow-y-auto flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col rounded-2xl overflow-hidden"
            style={{
              border: "1.5px solid rgba(79,158,255,0.55)",
              boxShadow: "0 0 0 1px rgba(79,158,255,0.08), 0 0 40px rgba(79,158,255,0.12), inset 0 0 60px rgba(79,158,255,0.03)",
              background: "rgba(8,11,24,0.85)",
              minHeight: "calc(100vh - 120px)",
            }}
          >
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="space-y-4 w-full max-w-2xl px-8">
                  <div className="skeleton h-40 rounded-2xl" />
                  <div className="skeleton h-20 rounded-xl" />
                </div>
              </div>
            ) : project?.status !== "ready" ? (
              <div className="flex-1 flex items-center justify-center text-center py-24">
                <div>
                  <div
                    className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ background: "rgba(79,158,255,0.1)", border: "1px solid rgba(79,158,255,0.2)" }}
                  >
                    <Film className="w-8 h-8" style={{ color: "#4f9eff" }} />
                  </div>
                  <p className="text-lg font-semibold text-white mb-2">Still indexing…</p>
                  <p className="text-sm" style={{ color: "rgba(160,180,255,0.4)" }}>
                    Scenes are being embedded. Check back in a minute.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-6">
                <QueryInterface projectId={params.id} />
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Character Graph Slide-out Panel ──────────────────────────────────── */}
      <CharacterGraphPanel
        projectId={params.id}
        isOpen={showGraph}
        onClose={() => setShowGraph(false)}
      />

      {/* ── Scene Storyboard Panel ────────────────────────────────────────────── */}
      <SceneStoryboardPanel
        projectId={params.id}
        isOpen={showStoryboard}
        onClose={() => setShowStoryboard(false)}
      />

      {/* ── Scene Clips Panel ─────────────────────────────────────────────────── */}
      <SceneVideosPanel
        projectId={params.id}
        isOpen={showVideo}
        onClose={() => setShowVideo(false)}
      />
    </main>
  );
}
