"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Film, ArrowLeft, BookOpen, History, Sparkles, Menu, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { QueryInterface } from "@/components/QueryInterface";
import { QueryHistory } from "@/components/QueryHistory";
import { MalayalamInterface } from "@/components/MalayalamInterface";
import { RoleSelector } from "@/components/RoleSelector";
import { api } from "@/lib/api-client";
import { useQueryStore } from "@/hooks/useQuery";
import { Project } from "@/types";

interface QueryPageProps {
  params: { id: string };
}

type SidePanel = "history" | "malayalam" | "role";

export default function QueryPage({ params }: QueryPageProps) {
  const [activePanel, setActivePanel] = useState<SidePanel>("malayalam");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { setCurrentQuery, selectedRole, setRole } = useQueryStore();

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["project", params.id],
    queryFn: () => api.get<Project>(`/api/v1/projects/${params.id}`),
  });

  const panelTabs: { id: SidePanel; label: string; icon: React.ReactNode }[] = [
    { id: "malayalam", label: "Malayalam", icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: "role", label: "Role", icon: <Film className="w-3.5 h-3.5" /> },
    { id: "history", label: "History", icon: <History className="w-3.5 h-3.5" /> },
  ];

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
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
          <button
            id="toggle-sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg transition-all"
            style={{
              background: sidebarOpen ? "rgba(253,176,34,0.08)" : "transparent",
              color: sidebarOpen ? "var(--accent-gold)" : "var(--text-muted)",
            }}
            title="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
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

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-shrink-0 flex flex-col border-l overflow-hidden"
              style={{
                borderColor: "var(--border-subtle)",
                background: "rgba(10,14,26,0.8)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Tab bar */}
              <div
                className="flex gap-0.5 p-2 border-b flex-shrink-0"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}
              >
                {panelTabs.map((tab) => (
                  <button
                    key={tab.id}
                    id={`sidebar-tab-${tab.id}`}
                    onClick={() => setActivePanel(tab.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background:
                        activePanel === tab.id
                          ? "rgba(253,176,34,0.1)"
                          : "transparent",
                      color:
                        activePanel === tab.id
                          ? "var(--accent-gold)"
                          : "var(--text-muted)",
                      border:
                        activePanel === tab.id
                          ? "1px solid rgba(253,176,34,0.2)"
                          : "1px solid transparent",
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-y-auto p-4">
                <AnimatePresence mode="wait">
                  {activePanel === "malayalam" && (
                    <motion.div
                      key="malayalam"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <MalayalamInterface
                        onQuerySelect={setCurrentQuery}
                        isActive
                      />
                    </motion.div>
                  )}

                  {activePanel === "role" && (
                    <motion.div
                      key="role"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <p
                        className="text-xs font-medium mb-3"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Select your crew role for contextual AI responses:
                      </p>
                      <RoleSelector value={selectedRole} onChange={setRole} />
                    </motion.div>
                  )}

                  {activePanel === "history" && (
                    <motion.div
                      key="history"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="h-full"
                    >
                      <QueryHistory projectId={params.id} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
