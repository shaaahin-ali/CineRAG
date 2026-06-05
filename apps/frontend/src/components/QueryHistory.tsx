"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Bookmark, BookmarkCheck, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "@/lib/api-client";
import { CitationPill } from "./CitationPill";
import { Query } from "@/types";

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
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex-1 min-w-0">
          <button
            id={`query-expand-${query.id}`}
            onClick={() => setExpanded(!expanded)}
            className="text-left w-full group"
          >
            <p
              className={`text-sm font-medium text-white line-clamp-2 group-hover:text-yellow-300 transition-colors ${
                query.detected_language === "ml" ? "font-malayalam" : ""
              }`}
            >
              {query.query_text}
            </p>
          </button>

          <div className="flex items-center gap-3 mt-2">
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <Clock className="w-3 h-3" />
              {formatRelativeTime(query.created_at)}
            </span>

            {query.latency_ms && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {query.latency_ms}ms
              </span>
            )}

            {query.detected_language && (
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  background:
                    query.detected_language === "ml"
                      ? "rgba(253,176,34,0.1)"
                      : "rgba(96,165,250,0.1)",
                  color:
                    query.detected_language === "ml"
                      ? "var(--accent-gold)"
                      : "#60A5FA",
                  fontFamily:
                    query.detected_language === "ml" ? "Meera Inimai" : "inherit",
                }}
              >
                {query.detected_language === "ml" ? "മലയാളം" : "English"}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            id={`bookmark-${query.id}`}
            onClick={() => bookmarkMutation.mutate()}
            disabled={bookmarkMutation.isPending}
            className="p-2 rounded-lg transition-all"
            style={{
              color: query.bookmarked ? "var(--accent-gold)" : "var(--text-muted)",
              background: query.bookmarked ? "rgba(253,176,34,0.08)" : "transparent",
            }}
            title={query.bookmarked ? "Remove bookmark" : "Bookmark"}
          >
            {query.bookmarked ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg transition-all"
            style={{ color: "var(--text-muted)" }}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
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
              className="px-4 pb-4 border-t"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}
            >
              {/* Citations */}
              {query.citations && query.citations.length > 0 && (
                <div className="pt-4 mb-3">
                  <p
                    className="text-xs font-medium mb-2"
                    style={{ color: "var(--text-muted)" }}
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
                className="text-sm leading-relaxed mt-3"
                style={{
                  color: "var(--text-secondary)",
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

  return (
    <div id="query-history" className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Query History</h3>
        <button
          id="filter-bookmarked"
          onClick={() => setShowBookmarked(!showBookmarked)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
          style={{
            background: showBookmarked
              ? "rgba(253,176,34,0.1)"
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${
              showBookmarked
                ? "rgba(253,176,34,0.3)"
                : "rgba(255,255,255,0.06)"
            }`,
            color: showBookmarked ? "var(--accent-gold)" : "var(--text-muted)",
          }}
        >
          <Bookmark className="w-3 h-3" />
          Bookmarked
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </>
        ) : displayed.length === 0 ? (
          <div
            className="text-center py-12"
            style={{ color: "var(--text-muted)" }}
          >
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              {showBookmarked ? "No bookmarked queries" : "No queries yet"}
            </p>
            <p className="font-malayalam text-xs mt-1 opacity-70">
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
