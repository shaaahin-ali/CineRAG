"use client";

import { useQuery } from "@tanstack/react-query";
import { Film, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { QueryInterface } from "@/components/QueryInterface";
import { api } from "@/lib/api-client";
import { Project } from "@/types";

interface QueryPageProps {
  params: { id: string };
}

export default function QueryPage({ params }: QueryPageProps) {
  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["project", params.id],
    queryFn: () => api.get<Project>(`/api/v1/projects/${params.id}`),
  });

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Nav */}
      <nav className="border-b px-6 py-3 flex items-center justify-between flex-shrink-0"
        style={{ borderColor: "var(--border-subtle)", background: "rgba(5,7,15,0.9)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" id="back-to-dashboard"
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
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
            <div className="flex items-center gap-1.5 text-xs"
              style={{ color: "var(--text-muted)" }}>
              <BookOpen className="w-3.5 h-3.5" />
              {project.scene_count} scenes · {project.page_count} pages
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Query area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto h-full">
            {isLoading ? (
              <div className="space-y-4">
                <div className="skeleton h-32 rounded-xl" />
                <div className="skeleton h-16 rounded-xl" />
              </div>
            ) : project?.status !== "ready" ? (
              <div className="text-center py-20">
                <p className="text-white font-medium mb-2">Project is still being indexed</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Check back in a minute — scenes are being embedded into Pinecone.
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
