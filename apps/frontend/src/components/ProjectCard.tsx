"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Film,
  FileText,
  Users,
  Edit2,
  Trash2,
  Share2,
  Search,
  Loader2,
} from "lucide-react";
import { Project } from "@/types";
import { api } from "@/lib/api-client";

interface SceneImage {
  scene_number: number;
  image_url: string;
  image_prompt: string;
  generated_at: string;
}

interface ProjectCardProps {
  project: Project;
  index?: number;
  currentUserId?: string;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ready":
      return { cls: "ready", label: "Ready" };
    case "indexing":
    case "uploading":
      return { cls: "waiting", label: "Waiting" };
    case "error":
      return { cls: "error", label: "Error" };
    default:
      return { cls: "waiting", label: status };
  }
}

export function ProjectCard({
  project,
  index = 0,
  currentUserId,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const isOwner = !currentUserId || project.owner_id === currentUserId;
  const isReady = project.status === "ready";
  const badge = getStatusBadge(project.status);

  // Use the pre-fetched hero image from the backend to prevent initial waterfall delay
  const heroImage = project.hero_image_url;

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: "easeOut" }}
      className="project-card group"
      id={`project-card-${project.id}`}
    >
      {/* ── Hero Image ─────────────────────────────────────────────── */}
      <div className="project-card-image">
        {heroImage ? (
          <img
            src={heroImage}
            alt={`${project.title} scene`}
          />
        ) : (
          <div className="project-card-placeholder">
            <Film className="h-12 w-12" />
          </div>
        )}

        {/* Status badge overlay */}
        <div className={`card-status-badge ${badge.cls}`}>
          <span className="badge-dot" />
          {badge.label}
        </div>

        {/* Edit/Delete actions overlay — owner only */}
        {isOwner && (onEdit || onDelete) && (
          <div className="project-card-actions">
            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(project);
                }}
                className="project-card-action-btn"
                title="Edit Project"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(project);
                }}
                className="project-card-action-btn danger"
                title="Delete Project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Card Body ──────────────────────────────────────────────── */}
      <div className="project-card-body">
        {/* Title */}
        <h3 className="project-card-title">{project.title}</h3>

        {/* Shared badge */}
        {!isOwner && (
          <div className="shared-badge">
            <Share2 className="w-3 h-3" />
            Shared with you
          </div>
        )}

        {/* Stats row — for ready projects */}
        {isReady && (
          <div className="project-card-stats">
            <div className="project-card-stat">
              <span className="project-card-stat-label">Pages</span>
              <span className="project-card-stat-value">
                {project.page_count ?? "—"}
              </span>
            </div>
            <div className="project-card-stat">
              <span className="project-card-stat-label">Scenes</span>
              <span className="project-card-stat-value">
                {project.scene_count ?? "—"}
              </span>
            </div>
            <div className="project-card-stat">
              <span className="project-card-stat-label">Characters</span>
              <span className="project-card-stat-value">
                {project.character_count ?? "—"}
              </span>
            </div>
          </div>
        )}

        {/* Indexing/Uploading progress */}
        {(project.status === "indexing" || project.status === "uploading") && (
          <div className="project-card-progress">
            <div className="project-card-progress-bar">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-500/40 to-amber-400/70"
                animate={{ width: ["15%", "75%", "15%"] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
            <p className="project-card-progress-text">
              {project.status === "uploading"
                ? "Uploading screenplay…"
                : "Parsing scenes & building index…"}
            </p>
          </div>
        )}

        {/* Query Script button */}
        <div className="query-script-btn">
          {isReady ? (
            <>
              <Search className="h-4 w-4" />
              Query Script
            </>
          ) : project.status === "error" ? (
            <>
              <FileText className="h-4 w-4" />
              View Details
            </>
          ) : (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing…
            </>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Wrap in a Link if ready, otherwise just render the card
  if (isReady) {
    return (
      <Link
        href={`/query/${project.id}`}
        className="block"
        style={{ textDecoration: "none" }}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div
      onClick={(e) => e.preventDefault()}
      className="block"
      style={{ cursor: "default" }}
    >
      {cardContent}
    </div>
  );
}
