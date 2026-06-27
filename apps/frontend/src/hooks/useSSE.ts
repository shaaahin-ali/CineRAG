// SSE streaming hook for real-time query responses

"use client";

import { useCallback, useRef } from "react";
import { Citation } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface UseSSEOptions {
  onToken: (token: string) => void;
  onCitation?: (citation: Citation) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

async function getAuthToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/session");
    const session = await res.json();
    return session?.user?.token || null;
  } catch {
    return null;
  }
}

export function useSSE(options: UseSSEOptions) {
  const abortRef = useRef<AbortController | null>(null);

  const query = useCallback(
    async (
      projectId: string,
      queryText: string,
      opts?: { language?: string; userRole?: string }
    ) => {
      // Cancel any in-progress stream
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const token = await getAuthToken();

      try {
        const response = await fetch(
          `${API_BASE}/api/v1/projects/${projectId}/query`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              query: queryText,
              language: opts?.language,
              user_role: opts?.userRole,
            }),
            signal: abortRef.current.signal,
          }
        );

        if (!response.ok) {
          const err = await response.json().catch(() => ({ detail: "Query failed" }));
          options.onError?.(err.detail || "Query failed");
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          let eventType = "";
          let dataLine = "";

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataLine = line.slice(5).trim();
            } else if (line === "" && eventType && dataLine) {
              // Dispatch complete event
              try {
                const data = JSON.parse(dataLine);

                if (eventType === "token") {
                  options.onToken(data.token);
                } else if (eventType === "citation") {
                  options.onCitation?.(data as Citation);
                } else if (eventType === "done") {
                  options.onComplete?.();
                } else if (eventType === "error") {
                  options.onError?.(data.error);
                }
              } catch {
                // Ignore malformed JSON
              }

              eventType = "";
              dataLine = "";
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
          options.onError?.(error.message || "Stream error");
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.onToken, options.onCitation, options.onError, options.onComplete]
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { query, abort };
}
