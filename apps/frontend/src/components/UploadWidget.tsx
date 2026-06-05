"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";

interface UploadWidgetProps {
  projectId: string;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
}

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

export function UploadWidget({ projectId, onUploadStart, onUploadComplete }: UploadWidgetProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

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
      setProgress(0);
      onUploadStart?.();

      // Fake progress while uploading
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 300);

      try {
        await api.upload(`/api/v1/projects/${projectId}/upload`, file);
        clearInterval(progressInterval);
        setProgress(100);
        setState("success");
        toast.success("Screenplay uploaded! Indexing scenes...", {
          description: "This may take 1–2 minutes.",
        });
        onUploadComplete?.();
      } catch (err: unknown) {
        clearInterval(progressInterval);
        const msg = err instanceof Error ? err.message : "Upload failed";
        setError(msg);
        setState("error");
        toast.error("Upload failed", { description: msg });
      }
    },
    [projectId, onUploadStart, onUploadComplete]
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
    setState("idle");
    setFileName("");
    setError("");
    setProgress(0);
  };

  return (
    <div
      id="upload-widget"
      onDragOver={(e) => { e.preventDefault(); setState("dragging"); }}
      onDragLeave={() => state === "dragging" && setState("idle")}
      onDrop={onDrop}
      className="relative rounded-2xl p-8 text-center transition-all"
      style={{
        border: `2px dashed ${
          state === "dragging" ? "rgba(253,176,34,0.6)"
          : state === "success" ? "rgba(52,211,153,0.4)"
          : state === "error" ? "rgba(248,113,113,0.4)"
          : "rgba(255,255,255,0.1)"
        }`,
        background:
          state === "dragging" ? "rgba(253,176,34,0.04)"
          : state === "success" ? "rgba(52,211,153,0.04)"
          : state === "error" ? "rgba(248,113,113,0.04)"
          : "rgba(255,255,255,0.02)",
        cursor: state === "idle" || state === "dragging" ? "pointer" : "default",
      }}
    >
      <AnimatePresence mode="wait">
        {state === "idle" || state === "dragging" ? (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(253,176,34,0.1)" }}>
              <Upload className="w-7 h-7" style={{ color: "var(--accent-gold)" }} />
            </div>
            <p className="font-semibold text-white mb-1">
              {state === "dragging" ? "Drop it here!" : "Upload Screenplay"}
            </p>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              PDF, DOCX, or TXT · Max 50MB
            </p>
            <label className="btn-primary inline-block cursor-pointer">
              Browse Files
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={onFileInput}
                className="hidden"
                id="screenplay-file-input"
              />
            </label>
            <p className="font-malayalam text-xs mt-3" style={{ color: "var(--text-muted)" }}>
              തിരക്കഥ അപ്‌ലോഡ് ചെയ്യുക
            </p>
          </motion.div>
        ) : state === "uploading" ? (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--accent-gold)" }} />
            <p className="font-medium text-white mb-1">{fileName}</p>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              {progress < 100 ? "Uploading screenplay..." : "Processing..."}
            </p>
            <div className="h-2 rounded-full overflow-hidden mx-auto max-w-xs"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #FDB022, #F79009)" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--accent-gold)" }}>{progress}%</p>
          </motion.div>
        ) : state === "success" ? (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "#34D399" }} />
            <p className="font-semibold text-white mb-1">Uploaded successfully!</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Scenes are being indexed into Pinecone. Check project status for updates.
            </p>
          </motion.div>
        ) : (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "#F87171" }} />
            <p className="font-semibold text-white mb-1">Upload failed</p>
            <p className="text-sm mb-4" style={{ color: "#F87171" }}>{error}</p>
            <button onClick={reset} className="btn-ghost flex items-center gap-2 mx-auto">
              <X className="w-4 h-4" />
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
