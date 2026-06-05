"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Film, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectCard } from "@/components/ProjectCard";
import { UploadWidget } from "@/components/UploadWidget";
import { api } from "@/lib/api-client";
import { projectSchema, ProjectInput } from "@/lib/validators";
import { Project } from "@/types";

export default function DashboardPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [uploadProjectId, setUploadProjectId] = useState<string | null>(null);
  const queryClient = useQueryClient();

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
    onError: (err: Error) => {
      toast.error("Failed to create project", { description: err.message });
    },
  });

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: "var(--border-subtle)", background: "rgba(5,7,15,0.9)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5" style={{ color: "var(--accent-gold)" }} />
          <span className="font-bold text-white">CinePhile</span>
          <span className="text-xs ml-1 font-malayalam" style={{ color: "var(--text-muted)" }}>
            ഡാഷ്‌ബോർഡ്
          </span>
        </div>
        <button
          id="create-project-btn"
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold text-white mb-2">Your Screenplays</h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Upload screenplays and query them in Malayalam or English
          </p>
        </motion.div>

        {/* Upload widget for newly created project */}
        {uploadProjectId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 card-gold p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Upload Screenplay</h2>
              <button onClick={() => setUploadProjectId(null)} className="btn-ghost p-2">
                <X className="w-4 h-4" />
              </button>
            </div>
            <UploadWidget
              projectId={uploadProjectId}
              onUploadComplete={() => {
                queryClient.invalidateQueries({ queryKey: ["projects"] });
              }}
            />
          </motion.div>
        )}

        {/* Create project modal */}
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">New Project</h2>
              <button onClick={() => setShowCreate(false)} className="btn-ghost p-2">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Screenplay Title
                </label>
                <input
                  {...register("title")}
                  id="project-title-input"
                  placeholder="e.g. Kumbalangi Nights"
                  className="input-field"
                />
                {errors.title && (
                  <p className="text-xs mt-1" style={{ color: "#F87171" }}>{errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Description (optional)
                </label>
                <input
                  {...register("description")}
                  id="project-description-input"
                  placeholder="Brief description"
                  className="input-field"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  id="create-project-submit"
                  disabled={createMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {createMutation.isPending ? "Creating..." : "Create Project"}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Project grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-48 rounded-2xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <Film className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: "var(--accent-gold)" }} />
            <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Create a project and upload your first screenplay
            </p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
