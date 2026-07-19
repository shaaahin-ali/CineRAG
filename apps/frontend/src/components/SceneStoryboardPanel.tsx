"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clapperboard,
  Image as ImageIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  Users,
  MapPin,
  ZoomIn,
} from "lucide-react";
import { api } from "@/lib/api-client";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

interface SceneImage {
  scene_number: number;
  image_url: string;
  image_prompt: string | null;
  generated_at: string | null;
}

interface SceneData {
  scene_number: number;
  heading: string;
  location: string;
  characters: string[];
  time_of_day: string | null;
  int_ext: string | null;
}

interface ImageProgress {
  generated: number;
  total: number;
  status: "generating" | "complete" | "error";
}

interface SceneStoryboardPanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
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
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return CHAR_COLORS[h % CHAR_COLORS.length];
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Skeleton shimmer card                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        aspectRatio: "16/9",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
          animation: "shimmer 1.8s infinite",
          backgroundSize: "200% 100%",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 12,
          right: 12,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div style={{ width: 32, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)" }} />
        <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.05)" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Single scene image card                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

interface SceneImageCardProps {
  image: SceneImage;
  sceneData?: SceneData;
  index: number;
  onExpand: () => void;
}

function SceneImageCard({ image, sceneData, index, onExpand }: SceneImageCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const characters = sceneData?.characters ?? [];
  const heading = sceneData?.heading ?? `Scene ${image.scene_number}`;
  const location = sceneData?.location ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      onClick={onExpand}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        aspectRatio: "16/9",
        background: "#0a0c18",
        border: `1px solid ${hovered ? "rgba(253,176,34,0.35)" : "rgba(255,255,255,0.07)"}`,
        boxShadow: hovered
          ? "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(253,176,34,0.15)"
          : "0 4px 16px rgba(0,0,0,0.3)",
        transition: "all 0.22s ease",
        transform: hovered ? "translateY(-3px) scale(1.01)" : "none",
      }}
    >
      {/* Scene image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.image_url}
        alt={`Scene ${image.scene_number}`}
        onLoad={() => setLoaded(true)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.4s ease",
          position: "absolute",
          inset: 0,
        }}
      />

      {/* Loading skeleton overlay */}
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
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
            <Loader2 size={24} style={{ color: "rgba(253,176,34,0.3)", animation: "spin 1s linear infinite" }} />
          </div>
        </div>
      )}

      {/* Scene number badge */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          background: "rgba(253,176,34,0.9)",
          color: "#000",
          fontSize: 10,
          fontWeight: 800,
          padding: "3px 8px",
          borderRadius: 6,
          backdropFilter: "blur(4px)",
          letterSpacing: "0.04em",
        }}
      >
        #{image.scene_number}
      </div>

      {/* Expand icon */}
      <div
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.2s ease",
          background: "rgba(0,0,0,0.6)",
          borderRadius: 8,
          padding: 5,
          backdropFilter: "blur(8px)",
        }}
      >
        <ZoomIn size={13} style={{ color: "white" }} />
      </div>

      {/* Bottom overlay — heading + characters */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.88))",
          padding: "24px 10px 10px",
          transform: hovered ? "translateY(0)" : "translateY(2px)",
          transition: "transform 0.2s ease",
        }}
      >
        <p
          style={{
            color: "white",
            fontSize: 10,
            fontWeight: 700,
            marginBottom: 4,
            lineHeight: 1.3,
            letterSpacing: "0.01em",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {heading.length > 38 ? heading.slice(0, 38) + "…" : heading}
        </p>
        {/* Characters */}
        {characters.length > 0 && (
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {characters.slice(0, 3).map((char) => (
              <span
                key={char}
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  padding: "2px 5px",
                  borderRadius: 4,
                  background: `${charColor(char)}22`,
                  border: `1px solid ${charColor(char)}55`,
                  color: charColor(char),
                  letterSpacing: "0.04em",
                }}
              >
                {char}
              </span>
            ))}
            {characters.length > 3 && (
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", alignSelf: "center" }}>
                +{characters.length - 3}
              </span>
            )}
          </div>
        )}
        {location && (
          <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>
            <MapPin size={8} style={{ color: "rgba(52,211,153,0.8)" }} />
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 8 }}>
              {location.length > 30 ? location.slice(0, 30) + "…" : location}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Expanded full-screen image lightbox                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

interface LightboxProps {
  images: SceneImage[];
  scenes: SceneData[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function ImageLightbox({ images, scenes, currentIndex, onClose, onNavigate }: LightboxProps) {
  const image = images[currentIndex];
  const sceneData = scenes.find((s) => s.scene_number === image.scene_number);
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < images.length - 1;

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && canPrev) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && canNext) onNavigate(currentIndex + 1);
    },
    [onClose, onNavigate, currentIndex, canPrev, canNext]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const characters = sceneData?.characters ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.95)",
        backdropFilter: "blur(20px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding: 8,
          color: "#9CA3AF",
          cursor: "pointer",
          display: "flex",
          zIndex: 10,
        }}
      >
        <X size={18} />
      </button>

      {/* Counter */}
      <div
        style={{
          position: "absolute",
          top: 22,
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.4)",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.06em",
        }}
      >
        {currentIndex + 1} / {images.length}
      </div>

      {/* Image + nav */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          width: "100%",
          maxWidth: 1100,
        }}
      >
        {/* Prev */}
        <button
          onClick={() => canPrev && onNavigate(currentIndex - 1)}
          disabled={!canPrev}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            padding: "12px 10px",
            color: canPrev ? "white" : "rgba(255,255,255,0.2)",
            cursor: canPrev ? "pointer" : "default",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
        >
          <ChevronLeft size={22} />
        </button>

        {/* Image */}
        <div
          style={{
            flex: 1,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.image_url}
            alt={`Scene ${image.scene_number}`}
            style={{ width: "100%", display: "block", aspectRatio: "16/9", objectFit: "cover" }}
          />
        </div>

        {/* Next */}
        <button
          onClick={() => canNext && onNavigate(currentIndex + 1)}
          disabled={!canNext}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14,
            padding: "12px 10px",
            color: canNext ? "white" : "rgba(255,255,255,0.2)",
            cursor: canNext ? "pointer" : "default",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Info panel below image */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          marginTop: 20,
          maxWidth: 800,
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: "14px 18px",
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        {/* Scene info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                background: "rgba(253,176,34,0.15)",
                border: "1px solid rgba(253,176,34,0.3)",
                color: "#FDB022",
                fontSize: 10,
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: 6,
              }}
            >
              SCENE #{image.scene_number}
            </span>
            {sceneData?.int_ext && (
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{sceneData.int_ext}</span>
            )}
            {sceneData?.time_of_day && (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Clock size={9} style={{ color: "rgba(255,255,255,0.3)" }} />
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{sceneData.time_of_day}</span>
              </div>
            )}
          </div>

          {sceneData && (
            <p style={{ color: "#F9FAFB", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              {sceneData.heading}
            </p>
          )}

          {image.image_prompt && (
            <p
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 11,
                lineHeight: 1.5,
                fontStyle: "italic",
              }}
            >
              &quot;{image.image_prompt.slice(0, 200)}{image.image_prompt.length > 200 ? "\u2026" : ""}&quot;
            </p>
          )}
        </div>

        {/* Characters */}
        {characters.length > 0 && (
          <div style={{ flexShrink: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginBottom: 6,
                color: "rgba(255,255,255,0.3)",
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <Users size={9} />
              Cast
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {characters.slice(0, 5).map((char) => (
                <span
                  key={char}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: `${charColor(char)}18`,
                    border: `1px solid ${charColor(char)}44`,
                    color: charColor(char),
                    whiteSpace: "nowrap",
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Progress bar                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

function GenerationProgress({ progress }: { progress: ImageProgress }) {
  const pct = progress.total > 0 ? Math.round((progress.generated / progress.total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{
        background: "rgba(253,176,34,0.06)",
        border: "1px solid rgba(253,176,34,0.18)",
        borderRadius: 12,
        padding: "10px 16px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <Loader2 size={14} style={{ color: "#FDB022", animation: "spin 1s linear infinite", flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ color: "#FDB022", fontSize: 11, fontWeight: 700 }}>
            Generating AI scene images…
          </span>
          <span style={{ color: "rgba(253,176,34,0.6)", fontSize: 11, fontWeight: 600 }}>
            {progress.generated} / {progress.total}
          </span>
        </div>
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: "rgba(253,176,34,0.12)",
            overflow: "hidden",
          }}
        >
          <motion.div
            style={{ height: "100%", background: "#FDB022", borderRadius: 2 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        </div>
      </div>
      <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, flexShrink: 0 }}>
        ~{Math.ceil(((progress.total - progress.generated) * 6) / 60)} min left
      </span>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Panel                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export function SceneStoryboardPanel({ projectId, isOpen, onClose }: SceneStoryboardPanelProps) {
  const [images, setImages] = useState<SceneImage[]>([]);
  const [scenes, setScenes] = useState<SceneData[]>([]);
  const [progress, setProgress] = useState<ImageProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Fetch scene metadata (only needed once)
  const fetchScenes = useCallback(async () => {
    if (!isOpen) return;
    try {
      const sceneData = await api.get<SceneData[]>(`/api/v1/projects/${projectId}/scenes`);
      setScenes(sceneData || []);
    } catch (err) {
      console.error("Failed to fetch scene metadata", err);
    }
  }, [isOpen, projectId]);

  // Fetch current images (called on open + every poll tick while generating)
  const fetchImages = useCallback(async () => {
    if (!isOpen) return;
    try {
      const imgData = await api.get<SceneImage[]>(`/api/v1/projects/${projectId}/scene-images`);
      setImages(imgData || []);
    } catch (err) {
      console.error("Failed to fetch scene images", err);
    }
  }, [isOpen, projectId]);

  // Fetch progress count (separate from images so we can track total)
  const fetchProgress = useCallback(async () => {
    try {
      const prog = await api.get<ImageProgress>(`/api/v1/projects/${projectId}/image-progress`);
      setProgress(prog);
    } catch {
      /* silent */
    }
  }, [projectId]);

  // Initial load
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    Promise.all([fetchImages(), fetchScenes(), fetchProgress()]).finally(() =>
      setIsLoading(false)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, projectId]);

  // ⚡ Poll BOTH images AND progress every 5s while generating
  // This ensures each newly-completed image appears in the grid within ~5s
  // (avoids stale-closure bug where images.length comparison always returned 0)
  useEffect(() => {
    if (!isOpen || progress?.status === "complete") return;
    const interval = setInterval(() => {
      fetchImages();
      fetchProgress();
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, progress?.status, fetchImages, fetchProgress]);

  const isGenerating = progress?.status === "generating" || (progress === null && isLoading);

  return (
    <>
      {/* Global keyframe styles */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
                boxShadow: "0 25px 50px rgba(0,0,0,0.5), 0 0 80px rgba(253,176,34,0.03)",
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
                {/* Left */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      background: "linear-gradient(135deg, rgba(253,176,34,0.15), rgba(253,176,34,0.05))",
                      border: "1px solid rgba(253,176,34,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 20px rgba(253,176,34,0.1)",
                    }}
                  >
                    <Clapperboard size={20} style={{ color: "#FDB022" }} />
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
                      Scene Storyboard
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "3px 0 0" }}>
                      {images.length > 0
                        ? `${images.length} AI-generated scene image${images.length !== 1 ? "s" : ""}`
                        : isLoading
                        ? "Loading storyboard…"
                        : "No images generated yet"}
                    </p>
                  </div>
                </div>

                {/* Right: AI badge + close */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: "rgba(99,102,241,0.1)",
                      border: "1px solid rgba(99,102,241,0.2)",
                    }}
                  >
                    <Sparkles size={11} style={{ color: "#818CF8" }} />
                    <span style={{ color: "#818CF8", fontSize: 10, fontWeight: 700 }}>
                      Pollinations.ai · Flux
                    </span>
                  </div>

                  <button
                    id="close-storyboard-panel"
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

              {/* ── Body ── */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                {/* Generation progress bar */}
                <AnimatePresence>
                  {isGenerating && progress && <GenerationProgress progress={progress} />}
                </AnimatePresence>

                {/* Loading skeleton grid — show while loading OR while generating with no images yet */}
                {(isLoading || isGenerating) && images.length === 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: 14,
                    }}
                  >
                    {Array.from({ length: progress?.total || 9 }).map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {!isLoading && images.length === 0 && progress?.status !== "generating" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 320,
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 20,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ImageIcon size={28} style={{ color: "#374151" }} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ color: "#6B7280", fontSize: 14, fontWeight: 600 }}>
                        No images generated yet
                      </p>
                      <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 4 }}>
                        Images are generated automatically when you upload a screenplay.
                        <br />
                        Re-upload to trigger generation.
                      </p>
                    </div>
                  </div>
                )}

                {/* Image grid */}
                {images.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: 14,
                    }}
                  >
                    {images.map((image, i) => (
                      <SceneImageCard
                        key={image.scene_number}
                        image={image}
                        sceneData={scenes.find((s) => s.scene_number === image.scene_number)}
                        index={i}
                        onExpand={() => setLightboxIndex(i)}
                      />
                    ))}

                    {/* Placeholder skeletons for in-progress images */}
                    {isGenerating &&
                      progress &&
                      Array.from({ length: Math.max(0, progress.total - images.length) }).map((_, i) => (
                        <SkeletonCard key={`pending-${i}`} />
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && images.length > 0 && (
          <ImageLightbox
            images={images}
            scenes={scenes}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </AnimatePresence>
    </>
  );
}
