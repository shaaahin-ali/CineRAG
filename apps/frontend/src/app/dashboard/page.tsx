"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Film,
  Plus,
  Sparkles,
  X,
  Upload,
  Wand2,
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

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Animation variants                                                        */
/* ──────────────────────────────────────────────────────────────────────────── */

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
} as const;

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" as const } },
} as const;

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Page                                                                      */
/* ──────────────────────────────────────────────────────────────────────────── */

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
  const userName = session?.user?.name || "User";
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

  /* ── Shared panel styles ─────────────────────────────────────────── */
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
      {/* ── Ambient radial glows ─────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div style={{
          position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
          width: "80vw", height: "50vh",
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.035) 0%, transparent 65%)",
          filter: "blur(1px)",
        }} />
        <div style={{
          position: "absolute", bottom: "0", right: "0",
          width: "40vw", height: "40vh",
          background: "radial-gradient(ellipse at bottom right, rgba(255,255,255,0.015) 0%, transparent 65%)",
        }} />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Welcome Header ─────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: "var(--text-primary)" }}
          >
            Welcome back, {userName}.
          </h1>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Here is the status of your active productions.
          </p>

          {/* Action buttons */}
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              id="header-create-project"
              onClick={() => hasPlan() ? setShowCreate(true) : setShowPricing(true)}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                color: "#FFFFFF",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(255,255,255,0.06)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>

            <button
              type="button"
              id="header-screenplay-assist"
              onClick={() => setShowScreenplayAssist(true)}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.10)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
                e.currentTarget.style.color = "#FFFFFF";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.10)";
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              <Wand2 className="h-4 w-4" />
              Write Screenplay
            </button>
          </div>
        </motion.header>

        {/* ── Panels: Create / Upload / Edit ── */}
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
                      {createMutation.isPending ? "Creating…" : "Create project"}
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
                      {updateMutation.isPending ? "Saving…" : "Save changes"}
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

        {/* ── Projects grid ─────────────────────────────────────────── */}
        <section className="pb-20">
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl skeleton"
                  style={{
                    border: "1px solid var(--border-subtle)",
                    height: "320px",
                  }}
                />
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
                Upload a screenplay to unlock AI scene analysis, character graphs, and video previews — or write one from scratch.
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
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {/* Screenplay Assist card — always first */}
              <motion.button
                variants={staggerItem}
                onClick={() => setShowScreenplayAssist(true)}
                id="screenplay-assist-card"
                className="project-card group text-left"
                style={{ border: "1px dashed rgba(255, 255, 255, 0.12)" }}
              >
                {/* Gradient hero placeholder */}
                <div className="project-card-image">
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(180,180,180,0.03) 50%, rgba(120,120,120,0.02) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Wand2 className="h-6 w-6" style={{ color: "#FFFFFF" }} />
                    </div>
                  </div>
                </div>

                <div className="project-card-body">
                  <h3 className="project-card-title" style={{ color: "#FFFFFF" }}>
                    Write Screenplay
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    AI-powered screenplay from your idea
                  </p>
                  <div
                    className="query-script-btn"
                    style={{
                      borderColor: "rgba(255, 255, 255, 0.10)",
                      background: "rgba(255, 255, 255, 0.03)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Screenplay
                  </div>
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
            </motion.div>
          )}
        </section>
      </div>

      <Footer />

      {/* ── Screenplay Assist Panel ── */}
      <ScreenplayAssistPanel
        isOpen={showScreenplayAssist}
        onClose={() => setShowScreenplayAssist(false)}
      />

      {/* ── Pricing Modal ── */}
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
