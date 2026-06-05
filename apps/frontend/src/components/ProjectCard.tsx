"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Film, Clock, FileText, Users, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  index?: number;
}

const statusConfig = {
  ready: {
    label: "Ready",
    icon: <CheckCircle className="w-3 h-3" />,
    className: "status-ready",
    border: "rgba(52, 211, 153, 0.15)",
  },
  indexing: {
    label: "Indexing...",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    className: "status-indexing",
    border: "rgba(253, 176, 34, 0.15)",
  },
  uploading: {
    label: "Uploading...",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    className: "status-uploading",
    border: "rgba(96, 165, 250, 0.15)",
  },
  error: {
    label: "Error",
    icon: <AlertCircle className="w-3 h-3" />,
    className: "status-error",
    border: "rgba(248, 113, 113, 0.15)",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const status = statusConfig[project.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
    >
      <Link
        href={project.status === "ready" ? `/query/${project.id}` : "#"}
        className="block glass-card p-5 group"
        style={{
          borderColor: status.border,
          cursor: project.status === "ready" ? "pointer" : "default",
        }}
        onClick={project.status !== "ready" ? (e) => e.preventDefault() : undefined}
        id={`project-card-${project.id}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(253,176,34,0.1)" }}
            >
              <Film className="w-5 h-5" style={{ color: "var(--accent-gold)" }} />
            </div>
            <div>
              <h3 className="font-semibold text-white group-hover:text-yellow-300 transition-colors line-clamp-1">
                {project.title}
              </h3>
              {project.description && (
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-muted)" }}>
                  {project.description}
                </p>
              )}
            </div>
          </div>

          {/* Status badge */}
          <span
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${status.className}`}
          >
            {status.icon}
            {status.label}
          </span>
        </div>

        {/* Stats */}
        {project.status === "ready" && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { icon: <FileText className="w-3.5 h-3.5" />, label: "Pages", value: project.page_count ?? "—" },
              { icon: <Film className="w-3.5 h-3.5" />, label: "Scenes", value: project.scene_count ?? "—" },
              { icon: <Users className="w-3.5 h-3.5" />, label: "Characters", value: project.character_count ?? "—" },
            ].map((stat) => (
              <div key={stat.label}
                className="text-center p-2 rounded-lg"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex justify-center mb-1" style={{ color: "var(--accent-gold)" }}>
                  {stat.icon}
                </div>
                <div className="text-base font-bold text-white">{stat.value}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Indexing progress */}
        {(project.status === "indexing" || project.status === "uploading") && (
          <div className="mb-4">
            <div className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #FDB022, #F79009)" }}
                animate={{ width: ["20%", "80%", "20%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              {project.status === "uploading"
                ? "Uploading screenplay..."
                : "Parsing scenes and building vector index..."}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t"
          style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
            <Clock className="w-3 h-3" />
            {formatDate(project.created_at)}
          </span>
          {project.status === "ready" && (
            <span className="text-xs font-medium" style={{ color: "var(--accent-gold)" }}>
              Start querying →
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
