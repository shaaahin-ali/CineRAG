"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Film,
  Layers3,
  Plus,
  Sparkles,
  X,
  Upload,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectCard } from "@/components/ProjectCard";
import { UploadWidget } from "@/components/UploadWidget";
import { ScreenplayAssistPanel } from "@/components/ScreenplayAssistPanel";
import { PricingModal } from "@/components/PricingModal";
import { useSubscription } from "@/hooks/useSubscription";
import { api } from "@/lib/api-client";
import { projectSchema, ProjectInput } from "@/lib/validators";
import { Project } from "@/types";
import { Footer } from "@/components/ui/footer-section";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  Animation variants                                                        */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
} as const;

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" as const } },
} as const;

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  Stat card config                                                          */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const STAT_CONFIG = [
  { label: "Total",      icon: Layers3,      accent: "var(--accent-blue)",   dim: "var(--accent-blue-dim)" },
  { label: "Ready",      icon: CheckCircle2, accent: "var(--accent-green)",  dim: "var(--accent-green-dim)" },
  { label: "Processing", icon: Loader2,      accent: "var(--accent-cyan)",   dim: "var(--accent-cyan-dim)" },
  { label: "Errors",     icon: AlertCircle,  accent: "#F87171",              dim: "rgba(248,113,113,0.08)" },
] as const;

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/*  Page                                                                      */
/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function DashboardContent() {
  const [showCreate, setShowCreate] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [uploadProjectId, setUploadProjectId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showScreenplayAssist, setShowScreenplayAssist] = useState(false);
  const { hasPlan } = useSubscription();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("assist") === "1") setShowScreenplayAssist(true);
  }, [searchParams]);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => api.get<Project[]>("/api/v1/projects"),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: ProjectInput) => api.post<Project>("/api/v1/projects", data),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowCreate(false);
      setUploadProjectId(project.id);
      reset();
      toast.success("Project created!", { description: "Now upload your screenplay." });
    },
    onError: (err: Error) => toast.error("Failed to create project", { description: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; input: Partial<ProjectInput> }) =>
      api.patch<Project>(`/api/v1/projects/${data.id}`, data.input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setEditingProject(null);
      toast.success("Project updated successfully");
    },
    onError: (err: Error) => toast.error("Failed to update project", { description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully");
    },
    onError: (err: Error) => toast.error("Failed to delete project", { description: err.message }),
  });

  const stats = useMemo(() => {
    const ready = projects.filter((p) => p.status === "ready").length;
    const processing = projects.filter((p) => p.status === "uploading" || p.status === "indexing").length;
    const errored = projects.filter((p) => p.status === "error").length;
    return { total: projects.length, ready, processing, errors: errored };
  }, [projects]);

  /* â”€â”€ Shared panel styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const panelStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border-card)",
    borderRadius: "16px",
  };

  const inputCls =
    "w-full rounded-xl px-4 py-3 text-sm transition-colors focus:outline-none";
  const inputStyle = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    color: "var(--text-primary)",
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden text-white pt-16"
      style={{ background: "var(--bg-deep)" }}
    >
      {/* â”€â”€ Ambient radial glows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div style={{
          position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: "80vw", height: "50vh",
          background: "radial-gradient(ellipse at center, rgba(79,127,255,0.1) 0%, transparent 65%)",
          filter: "blur(1px)",
        }} />
        <div style={{
          position: "absolute", bottom: "0", right: "0",
          width: "40vw", height: "40vh",
          background: "radial-gradient(ellipse at bottom right, rgba(56,201,232,0.05) 0%, transparent 65%)",
        }} />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-end justify-between"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em]" style={{ color: "var(--accent-blue)" }}>
              Dashboard
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl" style={{ color: "var(--text-primary)" }}>
              Your workspace.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Create projects, upload screenplays, and query scenes with AI â€” all in one cinematic space.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              id="header-screenplay-assist"
              onClick={() => setShowScreenplayAssist(true)}
              className="hidden items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 sm:inline-flex"
              style={{
                background: "linear-gradient(135deg,rgba(139,92,246,0.15),rgba(236,72,153,0.12))",
                border: "1px solid rgba(139,92,246,0.35)",
                color: "#c084fc",
                boxShadow: "0 0 20px rgba(139,92,246,0.1)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(139,92,246,0.6)";
                e.currentTarget.style.color = "#e879f9";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(139,92,246,0.2)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(139,92,246,0.35)";
                e.currentTarget.style.color = "#c084fc";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(139,92,246,0.1)";
              }}
            >
              <Wand2 className="h-4 w-4" />
              Write screenplay
            </button>

            <button
              type="button"
              id="header-create-project"
              onClick={() => hasPlan() ? setShowCreate(true) : setShowPricing(true)}
              className="hidden items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold sm:inline-flex btn-primary"
            >
              <Plus className="h-4 w-4" />
              New project
            </button>
          </div>
        </motion.header>

        {/* â”€â”€ Stats strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {STAT_CONFIG.map((cfg, idx) => {
            const Icon = cfg.icon;
            const value = [stats.total, stats.ready, stats.processing, stats.errors][idx];
            return (
              <motion.div
                key={cfg.label}
                variants={staggerItem}
                className="group rounded-2xl p-4 transition-all duration-300"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = cfg.accent;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px ${cfg.dim}`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border-card)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--text-muted)" }}>
                    {cfg.label}
                  </span>
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ background: cfg.dim }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: cfg.accent }} />
                  </div>
                </div>
                <div className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                  {value}
                </div>
              </motion.div>
            );
          })}
        </motion.section>

        {/* â”€â”€ Panels: Create / Upload / Edit â”€â”€ */}
        <AnimatePresence>
          {showCreate && (
            <motion.section
              key="create"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 overflow-hidden"
            >
              <div className="p-6" style={panelStyle}>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>New project</h2>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      Add your screenplay title and optional description.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreate(false)}
                    className="rounded-lg p-2 transition"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="grid gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                      Screenplay title
                    </label>
                    <input
                      {...register("title")}
                      id="project-title-input"
                      placeholder="e.g. Kumbalangi Nights"
                      className={inputCls}
                      style={inputStyle}
                    />
                    {errors.title && <p className="mt-1 text-xs" style={{ color: "#F87171" }}>{errors.title.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                      Description
                    </label>
                    <input
                      {...register("description")}
                      id="project-description-input"
                      placeholder="Brief description (optional)"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                    <button
                      type="submit"
                      id="create-project-submit"
                      disabled={createMutation.isPending}
                      className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {createMutation.isPending ? "Creatingâ€¦" : "Create project"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="btn-ghost inline-flex items-center justify-center"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.section>
          )}

          {uploadProjectId && (
            <motion.section
              key="upload"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 overflow-hidden"
            >
              <div className="p-6" style={panelStyle}>
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl icon-box">
                      <Upload className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Upload screenplay</h2>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Your new project is ready for a file.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadProjectId(null)}
                    className="rounded-lg p-2 transition"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <UploadWidget
                  projectId={uploadProjectId}
                  onUploadComplete={() => queryClient.invalidateQueries({ queryKey: ["projects"] })}
                />
              </div>
            </motion.section>
          )}

          {editingProject && (
            <motion.section
              key="edit"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 overflow-hidden"
            >
              <div className="p-6" style={panelStyle}>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Edit project</h2>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>Update your screenplay details.</p>
                  </div>
                  <button
                    onClick={() => setEditingProject(null)}
                    className="rounded-lg p-2 transition"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const title = fd.get("title") as string;
                    const description = fd.get("description") as string;
                    if (title) updateMutation.mutate({ id: editingProject.id, input: { title, description } });
                  }}
                  className="grid gap-4"
                >
                  <div>
                    <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                      Screenplay title
                    </label>
                    <input
                      name="title"
                      defaultValue={editingProject.title}
                      required
                      placeholder="e.g. Kumbalangi Nights"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                      Description
                    </label>
                    <input
                      name="description"
                      defaultValue={editingProject.description || ""}
                      placeholder="Brief description"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {updateMutation.isPending ? "Savingâ€¦" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProject(null)}
                      className="btn-ghost inline-flex items-center justify-center"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* â”€â”€ Projects grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section className="pb-20">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Projects
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {currentUserId
                  ? (() => {
                      const owned = projects.filter(p => p.owner_id === currentUserId).length;
                      const shared = projects.length - owned;
                      if (owned === 0 && shared === 0) return "No projects yet â€” create one to get started.";
                      if (owned > 0 && shared > 0) return `${owned} owned Â· ${shared} shared with you`;
                      if (shared > 0) return `${shared} project${shared === 1 ? "" : "s"} shared with you`;
                      return "Open a ready project to begin querying.";
                    })()
                  : "Open a ready project to begin querying."}
              </p>
            </div>

            {/* Mobile create button */}
            <button
              type="button"
              onClick={() => hasPlan() ? setShowCreate(true) : setShowPricing(true)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold btn-primary sm:hidden"
            >
              <Plus className="h-4 w-4" />
              Create
            </button>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 rounded-2xl skeleton" style={{ border: "1px solid var(--border-subtle)" }} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
              style={{ border: "1px dashed var(--border-subtle)" }}
            >
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-card)" }}
              >
                <Film className="h-7 w-7" style={{ color: "var(--text-muted)" }} />
              </div>
              <h3 className="mt-6 text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                No projects yet
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: "var(--text-secondary)" }}>
                Upload a screenplay to unlock AI scene analysis, character graphs, and video previews â€” or write one from scratch.
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                <button
                  id="empty-create-project"
                  onClick={() => hasPlan() ? setShowCreate(true) : setShowPricing(true)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Upload screenplay
                </button>
                <button
                  id="empty-screenplay-assist"
                  onClick={() => setShowScreenplayAssist(true)}
                  className="btn-ghost inline-flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  Write with AI
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {/* Screenplay Assist card — always first */}
              <motion.button
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, ease: "easeOut" }}
                onClick={() => setShowScreenplayAssist(true)}
                id="screenplay-assist-card"
                className="flex flex-col items-start gap-3 rounded-2xl p-5 text-left transition-all group cursor-pointer"
                style={{
                  background: "linear-gradient(135deg,rgba(139,92,246,0.08),rgba(236,72,153,0.06))",
                  border: "1px dashed rgba(139,92,246,0.3)",
                  minHeight: 160,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.55)";
                  (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,rgba(139,92,246,0.14),rgba(236,72,153,0.1))";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(139,92,246,0.12)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(139,92,246,0.3)";
                  (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg,rgba(139,92,246,0.08),rgba(236,72,153,0.06))";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl transition-all"
                  style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}
                >
                  <Wand2 className="h-5 w-5" style={{ color: "#c084fc" }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#c084fc" }}>Write Screenplay</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(192,132,252,0.5)" }}>
                    AI-powered screenplay from your idea
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-1.5 text-xs" style={{ color: "rgba(139,92,246,0.6)" }}>
                  <Sparkles className="h-3 w-3" />
                  Generate screenplay
                </div>
              </motion.button>

              {projects.map((project, index) => {
                const isOwner = !currentUserId || project.owner_id === currentUserId;
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    index={index}
                    currentUserId={currentUserId}
                    onEdit={isOwner ? (p) => setEditingProject(p) : undefined}
                    onDelete={isOwner ? (p) => {
                      if (confirm(`Are you sure you want to delete "${p.title}"?`)) {
                        deleteMutation.mutate(p.id);
                      }
                    } : undefined}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Footer />

      {/* â”€â”€ Screenplay Assist Panel â”€â”€ */}
      <ScreenplayAssistPanel
        isOpen={showScreenplayAssist}
        onClose={() => setShowScreenplayAssist(false)}
      />

      {/* â”€â”€ Pricing Modal â”€â”€ */}
      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        onPlanSelected={() => { setShowPricing(false); setShowCreate(true); }}
      />
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
