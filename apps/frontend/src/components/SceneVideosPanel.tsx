"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Video,
  Loader2,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Play,
  Clock,
  MapPin,
  Users,
  Wand2,
  Send,
  Info,
  Mic,
  MicOff,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Film,
  MessageSquare,
} from "lucide-react";
import { api } from "@/lib/api-client";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

type VideoJobStatus = "queued" | "generating" | "completed" | "failed";

interface VideoJob {
  id: string;
  scene_number: number;
  status: VideoJobStatus;
  output_url: string | null;
  error_message: string | null;
  prompt_json: {
    location?: string;
    mood?: string;
    characters?: string[];
    visual_style?: string;
    scene_summary?: string;
  } | null;
  extra_prompt: string | null;
  scene_summary: string | null;  // AI-distilled visual peak moment (theater overlay)
  created_at: string | null;
  updated_at: string | null;
}

interface SceneVideosPanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Voiceover hook — Web Speech API (free, no API key)                         */
/* ─────────────────────────────────────────────────────────────────────────── */

function buildNarration(job: VideoJob): string {
  const parts: string[] = [];
  const loc = job.prompt_json?.location;
  const mood = job.prompt_json?.mood;
  const chars = job.prompt_json?.characters ?? [];

  parts.push(`Scene ${job.scene_number}.`);
  if (loc) parts.push(`Location: ${loc}.`);
  if (mood) parts.push(`Mood: ${mood}.`);
  if (chars.length > 0) {
    const list =
      chars.length === 1
        ? chars[0]
        : chars.slice(0, -1).join(", ") + " and " + chars[chars.length - 1];
    parts.push(`Characters: ${list}.`);
  }
  return parts.join(" ");
}

function useVoiceover(text: string) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(() => {
    if (!enabled || !text || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.88;
    utt.pitch = 0.95;
    utt.volume = 0.85;
    // Prefer a deeper English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.toLowerCase().includes("male") ||
          v.name.toLowerCase().includes("david") ||
          v.name.toLowerCase().includes("james") ||
          v.name.toLowerCase().includes("george"))
    );
    if (preferred) utt.voice = preferred;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    uttRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, [enabled, text]);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      if (prev) {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, []);

  // Stop if component unmounts
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  return { isSpeaking, enabled, speak, stop, toggle };
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Character badge colors                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

const CHAR_COLORS = [
  "#FDB022", "#FFFFFF", "#34D399", "#F472B6",
  "#FFFFFF", "#FB923C", "#38BDF8", "#4ADE80",
];
function charColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return CHAR_COLORS[Math.abs(h) % CHAR_COLORS.length];
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Status config                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<
  VideoJobStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  queued: {
    label: "Queued",
    color: "#FFFFFF",
    bg: "rgba(255,255,255,0.1)",
    border: "rgba(255,255,255,0.25)",
  },
  generating: {
    label: "Generating",
    color: "#FDB022",
    bg: "rgba(253,176,34,0.1)",
    border: "rgba(253,176,34,0.25)",
  },
  completed: {
    label: "Ready",
    color: "#34D399",
    bg: "rgba(52,211,153,0.1)",
    border: "rgba(52,211,153,0.25)",
  },
  failed: {
    label: "Failed",
    color: "#F87171",
    bg: "rgba(248,113,113,0.1)",
    border: "rgba(248,113,113,0.25)",
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Skeleton placeholder card                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

function SkeletonVideoCard() {
  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        aspectRatio: "16/9",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.8s infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Video size={28} style={{ color: "rgba(255,255,255,0.08)" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Single video job card                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

function VideoJobCard({
  job,
  onRetry,
}: {
  job: VideoJob;
  onRetry: (sceneNumber: number) => void;
}) {
  const cfg = STATUS_CONFIG[job.status];
  const chars = job.prompt_json?.characters ?? [];
  const location = job.prompt_json?.location ?? "";
  const mood = job.prompt_json?.mood ?? "";
  const visualStyle = job.prompt_json?.visual_style ?? "";
  const videoRef = useRef<HTMLVideoElement>(null);
  const narration = buildNarration(job);
  const { isSpeaking, enabled, speak, stop, toggle } = useVoiceover(narration);

  // Sync voiceover with video play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video || job.status !== "completed") return;
    const onPlay = () => { if (enabled) speak(); };
    const onPause = () => stop();
    const onEnded = () => stop();
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, [enabled, speak, stop, job.status]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${cfg.border}`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Video area */}
      <div
        style={{
          aspectRatio: "16/9",
          background: "#050710",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {job.status === "completed" && job.output_url ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            ref={videoRef}
            src={job.output_url}
            controls
            loop
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : job.status === "queued" ? (
          <div style={{ textAlign: "center" }}>
            <Clock
              size={28}
              style={{ color: "rgba(255,255,255,0.5)", marginBottom: 8 }}
            />
            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Queued for generation
            </p>
          </div>
        ) : job.status === "generating" ? (
          <div style={{ textAlign: "center" }}>
            <Loader2
              size={28}
              style={{
                color: "#FDB022",
                animation: "spin 1s linear infinite",
                marginBottom: 8,
              }}
            />
            <p
              style={{
                color: "rgba(253,176,34,0.7)",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Generating clip…
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontSize: 10,
                marginTop: 2,
              }}
            >
              ~1–2 min on free GPU
            </p>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "0 12px" }}>
            <AlertTriangle
              size={28}
              style={{ color: "#F87171", marginBottom: 8 }}
            />
            <p
              style={{
                color: "#F87171",
                fontSize: 11,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Generation failed
            </p>
            {job.error_message && (
              <p
                style={{
                  color: "rgba(248,113,113,0.5)",
                  fontSize: 9,
                  lineHeight: 1.4,
                }}
              >
                {job.error_message.slice(0, 120)}
              </p>
            )}
            <button
              onClick={() => onRetry(job.scene_number)}
              style={{
                marginTop: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 12px",
                borderRadius: 8,
                background: "rgba(248,113,113,0.12)",
                border: "1px solid rgba(248,113,113,0.3)",
                color: "#F87171",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={11} />
              Retry
            </button>
          </div>
        )}

        {/* Scene number badge */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            borderRadius: 6,
            padding: "3px 8px",
            fontSize: 10,
            fontWeight: 800,
            color: "white",
            letterSpacing: "0.04em",
          }}
        >
          #{job.scene_number}
        </div>

        {/* Status badge */}
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            borderRadius: 6,
            padding: "3px 8px",
            fontSize: 9,
            fontWeight: 700,
            color: cfg.color,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            backdropFilter: "blur(6px)",
          }}
        >
          {cfg.label}
        </div>

        {/* Play hint overlay for completed */}
        {job.status === "completed" && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {/* Voiceover toggle button */}
            <button
              id={`voiceover-toggle-scene-${job.scene_number}`}
              onClick={(e) => {
                e.stopPropagation();
                toggle();
                // If enabling while video is already playing, start speaking
                if (!enabled && videoRef.current && !videoRef.current.paused) {
                  setTimeout(speak, 50);
                }
              }}
              title={enabled ? "Disable voiceover" : "Enable voiceover narration"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderRadius: 6,
                background: enabled
                  ? isSpeaking
                    ? "rgba(167,139,250,0.25)"
                    : "rgba(167,139,250,0.15)"
                  : "rgba(0,0,0,0.55)",
                border: enabled
                  ? "1px solid rgba(167,139,250,0.5)"
                  : "1px solid rgba(255,255,255,0.15)",
                backdropFilter: "blur(6px)",
                cursor: "pointer",
                transition: "all 0.18s",
              }}
            >
              {enabled ? (
                isSpeaking ? (
                  <Volume2
                    size={10}
                    style={{
                      color: "#FFFFFF",
                      animation: "pulse-ring 1.2s ease-in-out infinite",
                    }}
                  />
                ) : (
                  <Mic size={10} style={{ color: "#FFFFFF" }} />
                )
              ) : (
                <MicOff size={10} style={{ color: "rgba(255,255,255,0.45)" }} />
              )}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: enabled ? "#FFFFFF" : "rgba(255,255,255,0.45)",
                  letterSpacing: "0.04em",
                }}
              >
                {enabled ? (isSpeaking ? "Speaking" : "Voice On") : "Voice Off"}
              </span>
            </button>

            <div
              style={{
                background: "rgba(52,211,153,0.15)",
                border: "1px solid rgba(52,211,153,0.3)",
                borderRadius: 6,
                padding: "3px 8px",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 9,
                fontWeight: 700,
                color: "#34D399",
                backdropFilter: "blur(6px)",
              }}
            >
              <Play size={9} />
              Play
            </div>
          </div>
        )}
      </div>

      {/* Info row */}
      <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
        {/* Mood + style */}
        {(mood || visualStyle) && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {mood && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 5,
                  background: "rgba(167,139,250,0.12)",
                  border: "1px solid rgba(167,139,250,0.25)",
                  color: "#FFFFFF",
                  textTransform: "capitalize",
                }}
              >
                {mood}
              </span>
            )}
            {visualStyle && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  padding: "2px 7px",
                  borderRadius: 5,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {visualStyle}
              </span>
            )}
          </div>
        )}

        {/* Location */}
        {location && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              color: "rgba(52,211,153,0.7)",
              fontSize: 10,
            }}
          >
            <MapPin size={9} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {location}
            </span>
          </div>
        )}

        {/* Characters */}
        {chars.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            <Users size={9} style={{ color: "rgba(255,255,255,0.3)" }} />
            {chars.slice(0, 4).map((c) => (
              <span
                key={c}
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "1px 5px",
                  borderRadius: 4,
                  background: `${charColor(c)}18`,
                  border: `1px solid ${charColor(c)}44`,
                  color: charColor(c),
                }}
              >
                {c}
              </span>
            ))}
            {chars.length > 4 && (
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                +{chars.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Theater Mode — fullscreen single video player with Prev / Next navigation  */
/* ─────────────────────────────────────────────────────────────────────────── */

function VideoTheater({
  jobs,
  initialIndex,
  onClose,
}: {
  jobs: VideoJob[];
  initialIndex: number;
  onClose: () => void;
}) {
  const completedJobs = jobs.filter((j) => j.status === "completed" && j.output_url);
  const [idx, setIdx] = useState(() =>
    Math.max(0, Math.min(initialIndex, completedJobs.length - 1))
  );
  const [autoAdvance, setAutoAdvance] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = completedJobs[idx];
  const hasPrev = idx > 0;
  const hasNext = idx < completedJobs.length - 1;

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && hasNext) goNext();
      if (e.key === "ArrowLeft" && hasPrev) goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, hasNext, hasPrev, onClose]);

  // Auto-play on scene change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
    setAutoAdvance(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [idx]);

  // Auto-advance on video end
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onEnded = () => {
      if (!hasNext) return;
      let count = 4;
      setAutoAdvance(count);
      timerRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(timerRef.current!);
          setAutoAdvance(null);
          setIdx((i) => Math.min(i + 1, completedJobs.length - 1));
        } else {
          setAutoAdvance(count);
        }
      }, 1000);
    };
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("ended", onEnded);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [idx, hasNext, completedJobs.length]);

  const goNext = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setAutoAdvance(null);
    setIdx((i) => Math.min(i + 1, completedJobs.length - 1));
  }, [completedJobs.length]);

  const goPrev = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setAutoAdvance(null);
    setIdx((i) => Math.max(i - 1, 0));
  }, []);

  // Narration: prefer AI scene_summary from backend, fallback to metadata
  const narration =
    current?.scene_summary ||
    current?.prompt_json?.scene_summary ||
    [
      current?.prompt_json?.location ? `${current.prompt_json.location}.` : "",
      current?.prompt_json?.mood ? `Mood: ${current.prompt_json.mood}.` : "",
    ].filter(Boolean).join(" ") ||
    "";

  if (!current) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(0,0,0,0.97)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Close */}
      <button
        id="theater-close"
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 10,
          padding: 10,
          borderRadius: 12,
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.6)",
          cursor: "pointer",
          display: "flex",
        }}
      >
        <X size={18} />
      </button>

      {/* Scene counter */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          borderRadius: 20,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Film size={13} style={{ color: "#FFFFFF" }} />
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 700 }}>
          Scene #{current.scene_number}
        </span>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
          {idx + 1} / {completedJobs.length}
        </span>
      </div>

      {/* Video */}
      <div
        style={{
          width: "min(90vw, 1200px)",
          maxHeight: "68vh",
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 0 80px rgba(0,0,0,0.8)",
        }}
      >
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          src={current.output_url!}
          controls
          autoPlay
          style={{ width: "100%", display: "block", objectFit: "contain" }}
        />

        {/* Auto-advance countdown */}
        <AnimatePresence>
          {autoAdvance !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                bottom: 16,
                right: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 10,
                background: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.4)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Loader2 size={13} style={{ color: "#FFFFFF", animation: "spin 1s linear infinite" }} />
              <span style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 700 }}>
                Next scene in {autoAdvance}s
              </span>
              <button
                onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setAutoAdvance(null); }}
                style={{
                  padding: "2px 6px",
                  borderRadius: 5,
                  background: "rgba(248,113,113,0.15)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  color: "#F87171",
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Narration / scene summary */}
      {narration && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 18,
            maxWidth: "min(80vw, 780px)",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <MessageSquare size={14} style={{ color: "rgba(167,139,250,0.6)", flexShrink: 0, marginTop: 2 }} />
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 13,
              lineHeight: 1.7,
              fontStyle: "italic",
              margin: 0,
            }}
          >
            {narration}
          </p>
        </motion.div>
      )}

      {/* Prev / dots / Next */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 22 }}>
        <button
          id="theater-prev"
          onClick={goPrev}
          disabled={!hasPrev}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 20px",
            borderRadius: 12,
            background: hasPrev ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)",
            border: hasPrev ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.05)",
            color: hasPrev ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)",
            fontSize: 13,
            fontWeight: 600,
            cursor: hasPrev ? "pointer" : "not-allowed",
            transition: "all 0.15s",
          }}
        >
          <ChevronLeft size={16} />
          Prev
        </button>

        <div style={{ display: "flex", gap: 6 }}>
          {completedJobs.map((_, i) => (
            <button
              key={i}
              onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setAutoAdvance(null); setIdx(i); }}
              style={{
                width: i === idx ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: i === idx ? "#FFFFFF" : "rgba(255,255,255,0.2)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                padding: 0,
              }}
            />
          ))}
        </div>

        <button
          id="theater-next"
          onClick={goNext}
          disabled={!hasNext}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 20px",
            borderRadius: 12,
            background: hasNext ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.02)",
            border: hasNext ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.05)",
            color: hasNext ? "#FFFFFF" : "rgba(255,255,255,0.2)",
            fontSize: 13,
            fontWeight: 700,
            cursor: hasNext ? "pointer" : "not-allowed",
            transition: "all 0.15s",
          }}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>

      <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 11, marginTop: 14 }}>
        ← → to navigate · Esc to close
      </p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Panel                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export function SceneVideosPanel({
  projectId,
  isOpen,
  onClose,
}: SceneVideosPanelProps) {
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [extraPrompt, setExtraPrompt] = useState("");
  const [hasTriggered, setHasTriggered] = useState(false);
  const [theaterIndex, setTheaterIndex] = useState<number | null>(null);  // theater mode

  // Fetch current job statuses
  const fetchJobs = useCallback(async () => {
    if (!isOpen) return;
    try {
      const data = await api.get<VideoJob[]>(
        `/api/v1/projects/${projectId}/video/jobs`
      );
      setJobs(data || []);
    } catch {
      /* silent */
    }
  }, [isOpen, projectId]);

  // Initial load
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    fetchJobs().finally(() => setIsLoading(false));
  }, [isOpen, projectId, fetchJobs]);

  // Poll while any job is active
  useEffect(() => {
    const hasActive = jobs.some(
      (j) => j.status === "queued" || j.status === "generating"
    );
    if (!isOpen || !hasActive) return;
    const id = setInterval(fetchJobs, 5000);
    return () => clearInterval(id);
  }, [isOpen, jobs, fetchJobs]);

  // Trigger / re-trigger generation
  const handleGenerate = useCallback(async () => {
    setIsTriggering(true);
    try {
      await api.post(`/api/v1/projects/${projectId}/video/generate`, {
        extra_prompt: extraPrompt,
      });
      setHasTriggered(true);
      await fetchJobs();
    } catch (err) {
      console.error("Video generation trigger failed:", err);
    } finally {
      setIsTriggering(false);
    }
  }, [projectId, extraPrompt, fetchJobs]);

  // Retry single scene
  const handleRetry = useCallback(
    async (sceneNumber: number) => {
      try {
        await api.post(
          `/api/v1/projects/${projectId}/video/retry/${sceneNumber}`,
          {}
        );
        await fetchJobs();
      } catch (err) {
        console.error("Retry failed:", err);
      }
    },
    [projectId, fetchJobs]
  );

  const pendingCount = jobs.filter(
    (j) => j.status === "queued" || j.status === "generating"
  ).length;
  const completedCount = jobs.filter((j) => j.status === "completed").length;

  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 40,
                background: "rgba(0,0,0,0.72)",
                backdropFilter: "blur(6px)",
              }}
              onClick={onClose}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{
                position: "fixed",
                inset: "20px",
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                background: "rgba(0,0,0,0.98)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow:
                  "0 25px 50px rgba(0,0,0,0.5), 0 0 80px rgba(255,255,255,0.03)",
              }}
            >
              {/* ── Header ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 24px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  flexShrink: 0,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))",
                      border: "1px solid rgba(255,255,255,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 20px rgba(255,255,255,0.1)",
                    }}
                  >
                    <Video size={20} style={{ color: "#FFFFFF" }} />
                  </div>
                  <div>
                    <h2
                      style={{
                        color: "#F9FAFB",
                        fontSize: 17,
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                        margin: 0,
                      }}
                    >
                      Scene Video Preview
                    </h2>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.35)",
                        fontSize: 12,
                        margin: "3px 0 0",
                      }}
                    >
                      {jobs.length > 0
                        ? `${completedCount} / ${jobs.length} clips ready`
                        : isLoading
                        ? "Loading…"
                        : "No video jobs yet — click Generate below"}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Demo badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: "rgba(253,176,34,0.08)",
                      border: "1px solid rgba(253,176,34,0.2)",
                    }}
                  >
                    <Sparkles size={11} style={{ color: "#FDB022" }} />
                    <span style={{ color: "#FDB022", fontSize: 10, fontWeight: 700 }}>
                      DEMO MODE
                    </span>
                  </div>

                  {/* Veo badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    <span style={{ color: "#FFFFFF", fontSize: 10, fontWeight: 700 }}>
                      Veo 3.1 Fast · Vertex AI
                    </span>
                  </div>

                  <button
                    id="close-video-panel"
                    onClick={onClose}
                    style={{
                      borderRadius: 12,
                      padding: 8,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#6B7280",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color = "#F9FAFB";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.color = "#6B7280";
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* ── Extra Prompt Box ── */}
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  flexShrink: 0,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <Wand2 size={15} style={{ color: "#FFFFFF", marginTop: 1 }} />
                  <div>
                    <p
                      style={{
                        color: "#E0E7FF",
                        fontSize: 13,
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      Creative Direction (Optional)
                    </p>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.35)",
                        fontSize: 11,
                        marginTop: 3,
                      }}
                    >
                      Add a global style override that applies to all 4 scenes. The auto-detected
                      mood, camera, and lighting are already included.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <textarea
                    id="video-extra-prompt"
                    value={extraPrompt}
                    onChange={(e) => setExtraPrompt(e.target.value)}
                    placeholder='e.g. "Make it look like a 1980s Bollywood film with warm grain and dramatic lighting"'
                    rows={2}
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 12,
                      padding: "10px 14px",
                      color: "white",
                      fontSize: 13,
                      resize: "none",
                      outline: "none",
                      fontFamily: "inherit",
                      lineHeight: 1.5,
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)")
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)")
                    }
                  />
                  <button
                    id="video-generate-btn"
                    onClick={handleGenerate}
                    disabled={isTriggering}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "0 18px",
                      borderRadius: 12,
                      background:
                        isTriggering
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.35)",
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: isTriggering ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!isTriggering) {
                        e.currentTarget.style.background = "rgba(255,255,255,0.25)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isTriggering
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(255,255,255,0.15)";
                    }}
                  >
                    {isTriggering ? (
                      <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                    ) : hasTriggered ? (
                      <RefreshCw size={14} />
                    ) : (
                      <Send size={14} />
                    )}
                    {isTriggering
                      ? "Queuing…"
                      : hasTriggered
                      ? "Re-generate"
                      : "Generate"}
                  </button>
                </div>
              </div>

              {/* ── Body ── */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                {/* Active generation banner */}
                <AnimatePresence>
                  {pendingCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 16px",
                        borderRadius: 12,
                        background: "rgba(253,176,34,0.06)",
                        border: "1px solid rgba(253,176,34,0.18)",
                        marginBottom: 20,
                      }}
                    >
                      <Loader2
                        size={14}
                        style={{ color: "#FDB022", animation: "spin 1s linear infinite", flexShrink: 0 }}
                      />
                      <span style={{ color: "#FDB022", fontSize: 12, fontWeight: 700 }}>
                        {pendingCount} clip{pendingCount !== 1 ? "s" : ""} generating via
                        Veo 3.1 Fast — this can take 1–3 minutes per clip…
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading skeletons */}
                {isLoading && jobs.length === 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: 14,
                    }}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <SkeletonVideoCard key={i} />
                    ))}
                  </div>
                )}

                {/* Empty state — no jobs yet */}
                {!isLoading && jobs.length === 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 320,
                      gap: 16,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 20,
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Video size={28} style={{ color: "rgba(255,255,255,0.5)" }} />
                    </div>
                    <div>
                      <p
                        style={{
                          color: "#6B7280",
                          fontSize: 14,
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        No video clips generated yet
                      </p>
                      <p
                        style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}
                      >
                        Click <strong style={{ color: "#FFFFFF" }}>Generate</strong> above to
                        create cinematic AI video previews for the top 4 scenes.
                        <br />
                        Powered by <strong style={{ color: "#FFFFFF" }}>Veo 3.1 Fast</strong> · 5-second clips · 16:9 cinematic.
                        <br />
                        Optionally add creative direction first.
                      </p>
                    </div>
                  </div>
                )}

                {/* Video job cards grid */}
                {jobs.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: 14,
                    }}
                  >
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        style={{ position: "relative" }}
                      >
                        <VideoJobCard job={job} onRetry={handleRetry} />
                        {/* Theater mode open button — only for completed clips */}
                        {job.status === "completed" && job.output_url && (
                          <button
                            id={`theater-open-${job.scene_number}`}
                            onClick={() => {
                              const completedJobs = jobs.filter(
                                (j) => j.status === "completed" && j.output_url
                              );
                              const theaterIdx = completedJobs.findIndex(
                                (j) => j.id === job.id
                              );
                              setTheaterIndex(theaterIdx >= 0 ? theaterIdx : 0);
                            }}
                            title="Open in theater mode"
                            style={{
                              position: "absolute",
                              top: 44,
                              left: 8,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: "rgba(0,0,0,0.6)",
                              border: "1px solid rgba(255,255,255,0.15)",
                              backdropFilter: "blur(6px)",
                              color: "rgba(255,255,255,0.6)",
                              cursor: "pointer",
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: "0.04em",
                              zIndex: 5,
                            }}
                          >
                            <Maximize2 size={9} />
                            Theater
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Footer disclaimer ── */}
              <div
                style={{
                  padding: "10px 24px",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                 <Info size={12} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                 <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, margin: 0 }}>
                   First 4 scenes use <strong>Veo 3.1 Fast</strong> (Vertex AI · 5-second clips).
                   Already-generated videos load instantly from the database — no re-billing.
                   Voiceover uses the browser&apos;s built-in{" "}
                   <strong>Web Speech API</strong> — completely free.
                   Toggle the{" "}
                   <Mic size={9} style={{ display: "inline", verticalAlign: "middle", marginBottom: 1 }} />{" "}
                   button on any clip to enable cinematic narration.
                 </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Theater Mode ── */}
      {theaterIndex !== null && (
        <VideoTheater
          jobs={jobs}
          initialIndex={theaterIndex}
          onClose={() => setTheaterIndex(null)}
        />
      )}
    </>
  );
}
