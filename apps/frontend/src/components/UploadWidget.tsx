"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, AlertCircle, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { getSession } from "next-auth/react";

interface UploadWidgetProps {
  projectId: string;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
}

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

/** Maps backend step names → { label, progress% } */
const STEP_MAP: Record<string, { label: string; progress: number }> = {
  extracting:     { label: "Reading file…",                progress: 8  },
  extracted:      { label: "Text extracted",               progress: 14 },
  parsing:        { label: "Parsing scenes…",              progress: 20 },
  parsed:         { label: "Scenes identified",            progress: 28 },
  emotions:       { label: "Analysing emotions…",          progress: 36 },
  emotions_done:  { label: "Emotions detected",            progress: 44 },
  chunking:       { label: "Chunking content…",            progress: 50 },
  embedding:      { label: "Generating embeddings…",       progress: 58 },
  embedding_done: { label: "Embeddings ready",             progress: 70 },
  indexing:       { label: "Indexing into Pinecone…",      progress: 78 },
  indexing_done:  { label: "Scenes mapped",              progress: 86 },
  saving:         { label: "Saving to database…",          progress: 92 },
  images:         { label: "Queuing scene images…",        progress: 96 },
  ready:          { label: "Processing complete!",           progress: 100 },
  error:          { label: "Processing failed",            progress: 100 },
};

export function UploadWidget({ projectId, onUploadStart, onUploadComplete }: UploadWidgetProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("Uploading screenplay…");
  const [fromCache, setFromCache] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Clean up SSE on unmount
  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const openProgressStream = useCallback(
    async (pid: string) => {
      // Get auth token for the SSE request
      const session = await getSession();
      const token = (session?.user as { token?: string })?.token;
      if (!token) return;

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      // EventSource doesn't support custom headers; pass token via query param
      const url = `${API_BASE}/api/v1/projects/${pid}/upload/progress?token=${token}`;

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (e) => {
        try {
          const { step, detail } = JSON.parse(e.data) as { step: string; detail: string };
          const mapped = STEP_MAP[step];
          if (mapped) {
            setProgress(mapped.progress);
            setProgressLabel(mapped.label + (detail ? ` — ${detail}` : ""));
          }

          if (step === "ready") {
            es.close();
            setProgress(100);
            setState("success");
            toast.success("Screenplay indexed!", {
              description: "All scenes are ready to query.",
            });
            onUploadComplete?.();
          } else if (step === "error") {
            es.close();
            setError(detail || "Processing failed");
            setState("error");
            toast.error("Indexing failed", { description: detail });
          }
        } catch {
          // Ignore malformed events
        }
      };

      es.addEventListener("done", () => {
        es.close();
      });

      es.onerror = () => {
        es.close();
      };
    },
    [onUploadComplete]
  );

  const handleFile = useCallback(
    async (file: File) => {
      const allowed = [".pdf", ".docx", ".txt"];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();

      if (!allowed.includes(ext)) {
        setError(`File type not allowed. Use: ${allowed.join(", ")}`);
        setState("error");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        setError("File too large. Maximum size is 50MB.");
        setState("error");
        return;
      }

      setFileName(file.name);
      setState("uploading");
      setProgress(4);
      setProgressLabel("Uploading to server…");
      setFromCache(false);
      onUploadStart?.();

      try {
        const result = await api.upload<{ status: string; message: string }>(
          `/api/v1/projects/${projectId}/upload`,
          file
        );

        if (result.status === "ready") {
          // Cache hit — already indexed
          setProgress(100);
          setProgressLabel("Loaded from cache");
          setFromCache(true);
          setState("success");
          toast.success("Loaded from cache!", {
            description: "This screenplay was already indexed.",
          });
          onUploadComplete?.();
          return;
        }

        // Start SSE stream for live progress
        setProgress(6);
        setProgressLabel("Processing starting…");
        await openProgressStream(projectId);
      } catch (err: unknown) {
        eventSourceRef.current?.close();
        const msg = err instanceof Error ? err.message : "Upload failed";
        setError(msg);
        setState("error");
        toast.error("Upload failed", { description: msg });
      }
    },
    [projectId, onUploadStart, onUploadComplete, openProgressStream]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setState("idle");
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const reset = () => {
    eventSourceRef.current?.close();
    setState("idle");
    setFileName("");
    setError("");
    setProgress(0);
    setProgressLabel("Uploading screenplay…");
    setFromCache(false);
  };

  const borderColor =
    state === "dragging"
      ? "border-amber-500/40"
      : state === "success"
        ? "border-emerald-500/30"
        : state === "error"
          ? "border-red-500/30"
          : "border-white/[0.08]";

  const bgColor =
    state === "dragging"
      ? "bg-amber-500/[0.03]"
      : state === "success"
        ? "bg-emerald-500/[0.02]"
        : state === "error"
          ? "bg-red-500/[0.02]"
          : "bg-white/[0.01]";

  return (
    <div
      id="upload-widget"
      onDragOver={(e) => { e.preventDefault(); setState("dragging"); }}
      onDragLeave={() => state === "dragging" && setState("idle")}
      onDrop={onDrop}
      className={`relative rounded-[20px] border-2 border-dashed p-10 text-center transition-all duration-300 ${borderColor} ${bgColor}`}
      style={{
        cursor: state === "idle" || state === "dragging" ? "pointer" : "default",
      }}
    >
      <AnimatePresence mode="wait">
        {state === "idle" || state === "dragging" ? (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <Upload className="h-5 w-5 text-amber-400/70" />
            </div>
            <p className="text-sm font-medium text-white">
              {state === "dragging" ? "Drop it here" : "Upload Screenplay"}
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              PDF, DOCX, or TXT · Max 50 MB
            </p>
            <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200">
              Browse files
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={onFileInput}
                className="hidden"
                id="screenplay-file-input"
              />
            </label>
            <p className="font-malayalam mt-3 text-[11px] text-zinc-700">
              തിരക്കഥ അപ്‌ലോഡ് ചെയ്യുക
            </p>
          </motion.div>
        ) : state === "uploading" ? (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FileText className="mx-auto mb-3 h-8 w-8 text-amber-400/60" />
            <p className="text-sm font-medium text-white">{fileName}</p>
            <p className="mt-1 text-xs text-zinc-500 min-h-[1rem] transition-all duration-300">
              {progressLabel}
            </p>
            <div className="mx-auto mt-4 max-w-xs">
              <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.04]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="mt-2 text-[11px] text-amber-400/60">{progress}%</p>
            </div>
          </motion.div>
        ) : state === "success" ? (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-400" />
            <p className="text-sm font-semibold text-white">Uploaded successfully</p>
            {fromCache ? (
              <p className="mt-1 text-xs text-zinc-500 flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Loaded instantly from cache
              </p>
            ) : (
              <p className="mt-1 text-xs text-zinc-600">
                Scenes indexed and ready to query.
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
            <p className="text-sm font-semibold text-white">Upload failed</p>
            <p className="mt-1 text-xs text-red-400/80">{error}</p>
            <button
              onClick={reset}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] px-4 py-2 text-xs font-medium text-zinc-400 transition hover:border-white/15 hover:text-white"
            >
              <X className="w-3 h-3" />
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
