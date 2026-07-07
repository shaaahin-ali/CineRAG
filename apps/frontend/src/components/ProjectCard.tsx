"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Film,
  Clock,
  FileText,
  Users,
  AlertCircle,
  Loader2,
  Check,
  Edit2,
  Trash2,
  Share2,
  ArrowUpRight,
} from "lucide-react";
import { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  index?: number;
  currentUserId?: string;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

const statusConfig = {
  ready: {
    label: "Ready",
    icon: <Check className="w-3 h-3" />,
    badge: "text-zinc-300 bg-white/[0.04] border border-white/[0.1]",
    barColor: "bg-white/20",
  },
  indexing: {
    label: "Indexing",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    badge: "text-zinc-400 bg-white/[0.03] border border-white/[0.08]",
    barColor: "bg-white/15",
  },
  uploading: {
    label: "Uploading",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    badge: "text-zinc-400 bg-white/[0.03] border border-white/[0.08]",
    barColor: "bg-white/15",
  },
  error: {
    label: "Error",
    icon: <AlertCircle className="w-3 h-3" />,
    badge: "text-red-400/80 bg-red-500/[0.05] border border-red-500/[0.12]",
    barColor: "bg-red-400/20",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ProjectCard({
  project,
  index = 0,
  currentUserId,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const status = statusConfig[project.status];
  const isOwner = !currentUserId || project.owner_id === currentUserId;
  const isReady = project.status === "ready";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
    >
      <Link
        href={isReady ? `/query/${project.id}` : "#"}
        className="group relative block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]"
        onClick={!isReady ? (e) => e.preventDefault() : undefined}
        id={`project-card-${project.id}`}
      >
        {/* Top row: title + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <Film className="h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-white" />
              <h3 className="truncate text-[15px] font-semibold text-white transition-colors group-hover:text-zinc-100">
                {project.title}
              </h3>
            </div>
            {project.description && (
              <p className="mt-1 line-clamp-1 pl-[26px] text-xs text-zinc-600">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Owner-only edit/delete controls */}
            {isOwner && (
              <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit?.(project);
                  }}
                  className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:text-white"
                  title="Edit Project"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete?.(project);
                  }}
                  className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:text-red-400"
                  title="Delete Project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Premium box-style status badge */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${status.badge}`}
            >
              {status.icon}
              {status.label}
            </span>
          </div>
        </div>

        {/* Shared-with-you badge */}
        {!isOwner && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">
            <Share2 className="w-3 h-3" />
            Shared with you
          </div>
        )}

        {/* Stats row for ready projects */}
        {isReady && (
          <div className="mt-4 flex items-center gap-4 pl-[26px]">
            {[
              { icon: <FileText className="w-3 h-3" />, value: project.page_count ?? "—", label: "pg" },
              { icon: <Film className="w-3 h-3" />, value: project.scene_count ?? "—", label: "scenes" },
              { icon: <Users className="w-3 h-3" />, value: project.character_count ?? "—", label: "chars" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="text-zinc-700">{stat.icon}</span>
                <span className="font-medium text-zinc-300">{stat.value}</span>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Indexing progress */}
        {(project.status === "indexing" || project.status === "uploading") && (
          <div className="mt-4 pl-[26px]">
            <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.04]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-white/20 to-white/40"
                animate={{ width: ["15%", "75%", "15%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <p className="mt-2 text-[11px] text-zinc-600">
              {project.status === "uploading"
                ? "Uploading screenplay…"
                : "Parsing scenes & building index…"}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between pl-[26px]">
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-700">
            <Clock className="w-3 h-3" />
            {formatDate(project.created_at)}
          </span>
          {isReady && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-500 transition-colors group-hover:text-white">
              Query
              <ArrowUpRight className="h-3 w-3" />
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
