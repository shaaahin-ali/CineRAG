"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  BarChart3,
  Film,
  Layers3,
  Plus,
  Sparkles,
  X,
  Upload,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectCard } from "@/components/ProjectCard";
import { UploadWidget } from "@/components/UploadWidget";
import { api } from "@/lib/api-client";
import { projectSchema, ProjectInput } from "@/lib/validators";
import { Project } from "@/types";
import { Footer } from "@/components/ui/footer-section";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Animation variants                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
} as const;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
} as const;

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
} as const;

/* ────────────────────────────────────────────────────────────────────────── */
/*  Page                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [uploadProjectId, setUploadProjectId] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: () => api.get<Project[]>("/api/v1/projects"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectInput>({
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
    onError: (err: Error) => {
      toast.error("Failed to create project", { description: err.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; input: Partial<ProjectInput> }) =>
      api.patch<Project>(`/api/v1/projects/${data.id}`, data.input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setEditingProject(null);
      toast.success("Project updated successfully");
    },
    onError: (err: Error) => {
      toast.error("Failed to update project", { description: err.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully");
    },
    onError: (err: Error) => {
      toast.error("Failed to delete project", { description: err.message });
    },
  });

  const stats = useMemo(() => {
    const ready = projects.filter((project) => project.status === "ready").length;
    const processing = projects.filter(
      (project) => project.status === "uploading" || project.status === "indexing",
    ).length;
    const errored = projects.filter((project) => project.status === "error").length;

    return {
      total: projects.length,
      ready,
      processing,
      errors: errored,
    };
  }, [projects]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* ── Ambient background ───────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 30% 0%, rgba(253,176,34,0.05), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 10%, rgba(255,255,255,0.02), transparent 50%), #000000",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 flex items-end justify-between"
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-600">
              Dashboard
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tighter sm:text-5xl">
              Your workspace.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600">
              Create projects, upload screenplays, and query scenes with AI — all in one cinematic space.
            </p>
          </div>

          <button
            type="button"
            id="header-create-project"
            onClick={() => setShowCreate(true)}
            className="hidden items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/5 sm:inline-flex"
          >
            <Plus className="h-4 w-4" />
            New project
          </button>
        </motion.header>

        {/* ── Stats strip ────────────────────────────────────────────── */}
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {[
            { label: "Total", value: stats.total, icon: Layers3 },
            { label: "Ready", value: stats.ready, icon: Film },
            { label: "Processing", value: stats.processing, icon: BarChart3 },
            { label: "Errors", value: stats.errors, icon: X },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                variants={staggerItem}
                className="group rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
                    {item.label}
                  </span>
                  <Icon className="h-3.5 w-3.5 text-zinc-700 transition-colors group-hover:text-zinc-400" />
                </div>
                <div className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {item.value}
                </div>
              </motion.div>
            );
          })}
        </motion.section>

        {/* ── Panels: Create / Upload / Edit (conditionally rendered) ── */}
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
              <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">New project</h2>
                    <p className="mt-0.5 text-xs text-zinc-600">
                      Add your screenplay title and optional description.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreate(false)}
                    className="rounded-full p-2 text-zinc-600 transition hover:bg-white/5 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="grid gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                      Screenplay title
                    </label>
                    <input
                      {...register("title")}
                      id="project-title-input"
                      placeholder="e.g. Kumbalangi Nights"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-700 transition-colors focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/10"
                    />
                    {errors.title && (
                      <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                      Description
                    </label>
                    <input
                      {...register("description")}
                      id="project-description-input"
                      placeholder="Brief description (optional)"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-700 transition-colors focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/10"
                    />
                  </div>
                  <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                    <button
                      type="submit"
                      id="create-project-submit"
                      disabled={createMutation.isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 disabled:opacity-50"
                    >
                      {createMutation.isPending ? "Creating…" : "Create project"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="inline-flex items-center justify-center rounded-full border border-white/[0.08] px-5 py-3 text-sm font-medium text-zinc-400 transition hover:border-white/15 hover:text-white"
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
              <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                      <Upload className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Upload screenplay</h2>
                      <p className="text-xs text-zinc-600">Your new project is ready for a file.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadProjectId(null)}
                    className="rounded-full p-2 text-zinc-600 transition hover:bg-white/5 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <UploadWidget
                  projectId={uploadProjectId}
                  onUploadComplete={() => {
                    queryClient.invalidateQueries({ queryKey: ["projects"] });
                  }}
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
              <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Edit project</h2>
                    <p className="mt-0.5 text-xs text-zinc-600">Update your screenplay details.</p>
                  </div>
                  <button
                    onClick={() => setEditingProject(null)}
                    className="rounded-full p-2 text-zinc-600 transition hover:bg-white/5 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const title = formData.get("title") as string;
                    const description = formData.get("description") as string;
                    if (title) {
                      updateMutation.mutate({ id: editingProject.id, input: { title, description } });
                    }
                  }}
                  className="grid gap-4"
                >
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                      Screenplay title
                    </label>
                    <input
                      name="title"
                      defaultValue={editingProject.title}
                      required
                      placeholder="e.g. Kumbalangi Nights"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-700 transition-colors focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/10"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                      Description
                    </label>
                    <input
                      name="description"
                      defaultValue={editingProject.description || ""}
                      placeholder="Brief description"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-zinc-700 transition-colors focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/10"
                    />
                  </div>
                  <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 disabled:opacity-50"
                    >
                      {updateMutation.isPending ? "Saving…" : "Save changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProject(null)}
                      className="inline-flex items-center justify-center rounded-full border border-white/[0.08] px-5 py-3 text-sm font-medium text-zinc-400 transition hover:border-white/15 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Projects grid ───────────────────────────────────────────── */}
        <section className="pb-20">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Projects
              </h2>
              <p className="mt-1 text-xs text-zinc-600">
                {currentUserId
                  ? (() => {
                      const owned = projects.filter(p => p.owner_id === currentUserId).length;
                      const shared = projects.length - owned;
                      if (owned === 0 && shared === 0) return "No projects yet — create one to get started.";
                      if (owned > 0 && shared > 0) return `${owned} owned · ${shared} shared with you`;
                      if (shared > 0) return `${shared} project${shared === 1 ? "" : "s"} shared with you`;
                      return "Open a ready project to begin querying.";
                    })()
                  : "Open a ready project to begin querying."}
              </p>
            </div>

            {/* Mobile create button */}
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 sm:hidden"
            >
              <Plus className="h-4 w-4" />
              Create
            </button>
          </div>

          {isLoading ? (
            /* Skeleton grid */
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-[24px] border border-white/[0.04] bg-white/[0.02]"
                />
              ))}
            </div>
          ) : projects.length === 0 ? (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-white/[0.08] py-20 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                <Film className="h-7 w-7 text-zinc-600" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">No projects yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-600">
                Create your first screenplay project to begin uploading scripts and querying scenes with AI.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200"
              >
                <Sparkles className="h-4 w-4" />
                Create first project
              </button>
            </motion.div>
          ) : (
            /* Project cards */
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
    </main>
  );
}
