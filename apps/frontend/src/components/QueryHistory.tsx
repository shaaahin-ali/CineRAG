"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Download,
  MessageSquare,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { CitationPill } from "./CitationPill";
import { Query } from "@/types";
import { MorphingSquare } from "@/components/ui/morphing-square";

interface QueryHistoryProps {
  projectId: string;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function downloadQueryAsText(query: Query) {
  const lines: string[] = [
    `CineRAG Query Export`,
    `===================`,
    ``,
    `Query:`,
    query.query_text,
    ``,
    `Date: ${new Date(query.created_at).toLocaleString()}`,
    query.latency_ms ? `Latency: ${query.latency_ms}ms` : "",
    ``,
  ];

  if (query.citations && query.citations.length > 0) {
    lines.push("Referenced Scenes:");
    query.citations.forEach((c, i) => {
      lines.push(
        `  [${i + 1}] Scene ${c.scene_number ?? "?"}: ${c.heading ?? ""}`
      );
    });
    lines.push("");
  }

  if (query.response_text) {
    lines.push("Response:");
    lines.push(query.response_text);
  }

  const blob = new Blob([lines.filter(Boolean).join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cinerag-query-${query.id.slice(0, 8)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function QueryRow({ query, projectId }: { query: Query; projectId: string }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const bookmarkMutation = useMutation({
    mutationFn: () =>
      api.post(`/api/v1/projects/${projectId}/queries/${query.id}/bookmark`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queries", projectId] });
    },
  });

  return (
    <div
      className="overflow-hidden transition-all last:border-b-0"
      style={{ borderBottom: "1px solid rgba(79,158,255,0.07)" }}
    >
      {/* Header row */}
      <div className="flex items-start gap-2 py-3.5">
        <div className="flex-1 min-w-0">
          <button
            id={`query-expand-${query.id}`}
            onClick={() => setExpanded(!expanded)}
            className="text-left w-full group"
          >
            <p
              className={`text-xs font-medium text-white line-clamp-2 transition-colors group-hover:text-blue-300 ${
                query.detected_language === "ml" ? "font-malayalam" : ""
              }`}
            >
              {query.query_text}
            </p>
          </button>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className="flex items-center gap-1 text-[10px]"
              style={{ color: "rgba(160,180,255,0.35)" }}
            >
              <Clock className="w-2.5 h-2.5" />
              {formatRelativeTime(query.created_at)}
            </span>

            {query.latency_ms && (
              <span className="text-[10px]" style={{ color: "rgba(160,180,255,0.25)" }}>
                {query.latency_ms}ms
              </span>
            )}

            {query.detected_language && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px]"
                style={{
                  background: "rgba(79,158,255,0.08)",
                  border: "1px solid rgba(79,158,255,0.15)",
                  color: "rgba(160,180,255,0.5)",
                  fontFamily:
                    query.detected_language === "ml"
                      ? "Noto Sans Malayalam, Malayalam MN, Nirmala UI, sans-serif"
                      : "inherit",
                }}
              >
                {query.detected_language === "ml" ? "മലയാളം" : "English"}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* Download */}
          <button
            id={`download-${query.id}`}
            onClick={() => downloadQueryAsText(query)}
            className="rounded-lg p-1.5 transition-all"
            style={{ color: "rgba(79,158,255,0.35)" }}
            title="Download query & response"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(79,158,255,0.1)";
              e.currentTarget.style.color = "#4f9eff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(79,158,255,0.35)";
            }}
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Bookmark */}
          <button
            id={`bookmark-${query.id}`}
            onClick={() => bookmarkMutation.mutate()}
            disabled={bookmarkMutation.isPending}
            className="rounded-lg p-1.5 transition-all"
            style={{
              color: query.bookmarked ? "#4f9eff" : "rgba(79,158,255,0.35)",
            }}
            title={query.bookmarked ? "Remove bookmark" : "Bookmark"}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(79,158,255,0.1)";
              e.currentTarget.style.color = "#4f9eff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = query.bookmarked
                ? "#4f9eff"
                : "rgba(79,158,255,0.35)";
            }}
          >
            {query.bookmarked ? (
              <BookmarkCheck className="w-3.5 h-3.5" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Expand */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg p-1.5 transition-all"
            style={{ color: "rgba(79,158,255,0.35)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(79,158,255,0.1)";
              e.currentTarget.style.color = "#4f9eff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(79,158,255,0.35)";
            }}
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && query.response_text && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="pb-4 pt-3"
              style={{ borderTop: "1px solid rgba(79,158,255,0.07)" }}
            >
              {/* Citations */}
              {query.citations && query.citations.length > 0 && (
                <div className="mb-3">
                  <p
                    className="mb-2 text-[10px] font-medium"
                    style={{ color: "rgba(160,180,255,0.4)" }}
                  >
                    References:
                  </p>
                  {query.citations.map((citation, i) => (
                    <CitationPill key={i} citation={citation} index={i} />
                  ))}
                </div>
              )}

              {/* Response */}
              <div
                className="text-xs leading-relaxed rounded-lg p-3"
                style={{
                  background: "rgba(79,158,255,0.04)",
                  border: "1px solid rgba(79,158,255,0.1)",
                  color: "rgba(200,215,255,0.7)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {query.response_text}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function QueryHistory({ projectId }: QueryHistoryProps) {
  const [showBookmarked, setShowBookmarked] = useState(false);

  const { data: queries = [], isLoading } = useQuery<Query[]>({
    queryKey: ["queries", projectId],
    queryFn: () =>
      api.get<Query[]>(`/api/v1/projects/${projectId}/queries`),
    refetchInterval: false,
  });

  const displayed = showBookmarked
    ? queries.filter((q) => q.bookmarked)
    : queries;

  /* Download ALL visible queries as one text file */
  const downloadAll = () => {
    if (!displayed.length) return;
    const lines: string[] = ["CineRAG Query History Export", "============================", ""];
    displayed.forEach((q, idx) => {
      lines.push(`[${idx + 1}] ${new Date(q.created_at).toLocaleString()}`);
      lines.push(`Q: ${q.query_text}`);
      if (q.response_text) lines.push(`A: ${q.response_text}`);
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cinerag-history-${projectId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="query-history"
      className="h-full flex flex-col"
      style={{ background: "transparent" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(79,158,255,0.08)" }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5" style={{ color: "#4f9eff" }} />
          <h3
            className="text-xs font-semibold"
            style={{ color: "rgba(200,215,255,0.8)" }}
          >
            Query History
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Download all */}
          <button
            id="download-all-queries"
            onClick={downloadAll}
            disabled={!displayed.length}
            className="rounded-lg p-1.5 transition-all disabled:opacity-30"
            style={{ color: "rgba(79,158,255,0.4)" }}
            title="Download all queries"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(79,158,255,0.1)";
              e.currentTarget.style.color = "#4f9eff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(79,158,255,0.4)";
            }}
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Bookmarked filter */}
          <button
            id="filter-bookmarked"
            onClick={() => setShowBookmarked(!showBookmarked)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all"
            style={{
              background: showBookmarked
                ? "rgba(79,158,255,0.12)"
                : "transparent",
              border: `1px solid ${showBookmarked ? "rgba(79,158,255,0.35)" : "rgba(79,158,255,0.12)"}`,
              color: showBookmarked ? "#4f9eff" : "rgba(160,180,255,0.4)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(79,158,255,0.35)";
              e.currentTarget.style.color = "#4f9eff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = showBookmarked
                ? "rgba(79,158,255,0.35)"
                : "rgba(79,158,255,0.12)";
              e.currentTarget.style.color = showBookmarked
                ? "#4f9eff"
                : "rgba(160,180,255,0.4)";
            }}
          >
            <Bookmark className="w-2.5 h-2.5" />
            Saved
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4">
        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <MorphingSquare
              message="Loading history..."
              messagePlacement="bottom"
              className="bg-transparent"
            />
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-12 text-center">
            <Clock
              className="w-7 h-7 mx-auto mb-3"
              style={{ color: "rgba(79,158,255,0.2)" }}
            />
            <p className="text-xs" style={{ color: "rgba(160,180,255,0.3)" }}>
              {showBookmarked ? "No saved queries" : "No queries yet"}
            </p>
            <p
              className="font-malayalam text-[10px] mt-1"
              style={{ color: "rgba(160,180,255,0.2)" }}
            >
              {showBookmarked
                ? "ബുക്ക്‌മാർക്ക് ഒന്നും ഇല്ല"
                : "ഇനിയും ചോദ്യങ്ങൾ ഇല്ല"}
            </p>
          </div>
        ) : (
          displayed.map((query) => (
            <QueryRow key={query.id} query={query} projectId={projectId} />
          ))
        )}
      </div>
    </div>
  );
}
