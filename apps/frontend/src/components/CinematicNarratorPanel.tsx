"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mic,
  MicOff,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Volume2,
  Film,
  Sparkles,
  RefreshCw,
  Globe,
} from "lucide-react";
import { api } from "@/lib/api-client";
import type { Scene } from "@/types";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

interface SceneImage {
  scene_number: number;
  image_url: string;
  image_prompt: string | null;
}

interface LLMNarration {
  scene_number: number;
  narration: string;
}

interface CinematicNarratorPanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Voice synthesis                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

function getPreferredVoice(language: "english" | "malayalam"): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;
  const voices = window.speechSynthesis.getVoices();

  if (language === "malayalam") {
    // Try to find a Malayalam voice
    const mlVoice = voices.find((v) => v.lang.startsWith("ml"));
    if (mlVoice) return mlVoice;
    // Fallback to English if no Malayalam voice found, though it might sound weird
  }

  // Priority order: deep/authoritative male English voices
  const preferred = [
    "Daniel",   // macOS — deep British
    "David",    // Windows — clear US male
    "James",    // macOS
    "Thomas",   // Windows
    "George",   // macOS British
    "Alex",     // macOS
    "Mark",     // Windows
    "Reed",     // macOS
    "Arthur",   // macOS British
  ];

  for (const name of preferred) {
    const v = voices.find((v) => v.name.includes(name) && v.lang.startsWith("en"));
    if (v) return v;
  }
  // Fallback: any English voice
  return voices.find((v) => v.lang.startsWith("en-US"))
    ?? voices.find((v) => v.lang.startsWith("en"))
    ?? voices[0]
    ?? null;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Word-reveal narration text                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

function NarrationText({ text, isActive }: { text: string; isActive: boolean }) {
  const [visible, setVisible] = useState(0);
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setVisible(0);
    if (!isActive || !text) return;
    // Spread reveal over ~5s or proportionally
    const totalMs = Math.min(5000, words.length * 140);
    const msPerWord = totalMs / words.length;
    ref.current = setInterval(() => {
      setVisible((p) => {
        if (p >= words.length) { if (ref.current) clearInterval(ref.current); return p; }
        return p + 1;
      });
    }, msPerWord);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [text, isActive, words.length]);

  if (!text) return null;

  return (
    <p
      style={{
        color: "rgba(255,255,255,0.93)",
        fontSize: 16,
        lineHeight: 1.85,
        fontWeight: 400,
        fontStyle: "italic",
        letterSpacing: "0.014em",
        textAlign: "center",
        maxWidth: "min(740px, 100%)",
        width: "100%",
        margin: "0 auto",
        wordBreak: "break-word",
        overflowWrap: "break-word",
      }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            opacity: i < visible ? 1 : 0.06,
            transition: "opacity 0.2s ease",
            marginRight: "0.3em",
          }}
        >
          {word}
        </span>
      ))}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Auto-advance progress bar                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

function ProgressBar({ durationMs, active, onDone }: { durationMs: number; active: boolean; onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const start = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    setPct(0);
    if (!active) return;
    start.current = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start.current) / durationMs, 1);
      setPct(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else onDone();
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, durationMs]);

  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.06)" }}>
      <div
        style={{
          height: "100%",
          width: `${pct * 100}%`,
          background: "linear-gradient(90deg, #A78BFA, #60A5FA)",
          borderRadius: 2,
          transition: "width 0.08s linear",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Panel                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export function CinematicNarratorPanel({
  projectId,
  isOpen,
  onClose,
}: CinematicNarratorPanelProps) {
  // ── Data state ─────────────────────────────────────────────────────────────
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [images, setImages] = useState<SceneImage[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // ── LLM narration state ────────────────────────────────────────────────────
  const [narrations, setNarrations] = useState<Record<number, string>>({});
  const [narrationStatus, setNarrationStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [narrationError, setNarrationError] = useState<string | null>(null);

  // ── Playback state ─────────────────────────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState<"english" | "malayalam">("english");

  const ADVANCE_MS = 16000; // 16s per scene in auto-play

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentScene = scenes[currentIndex];
  const currentNarration = currentScene ? narrations[currentScene.scene_number] : undefined;
  const currentImage = images.find((img) => img.scene_number === currentScene?.scene_number);
  const isReady = narrationStatus === "ready";

  // ── Voice synthesis ────────────────────────────────────────────────────────
  const speak = useCallback(
    (text: string) => {
      if (!voiceEnabled || !text || typeof window === "undefined") return;
      window.speechSynthesis.cancel();

      const doSpeak = () => {
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 0.78;      // slightly slow — documentary pacing
        utt.pitch = 0.88;     // deeper voice
        utt.volume = 0.95;
        utt.lang = language === "malayalam" ? "ml-IN" : "en-US";
        const voice = getPreferredVoice(language);
        if (voice) utt.voice = voice;
        utt.onstart = () => setIsSpeaking(true);
        utt.onend = () => setIsSpeaking(false);
        utt.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utt);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          doSpeak();
        };
      } else {
        doSpeak();
      }
    },
    [voiceEnabled, language]
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  // Speak current scene narration whenever index changes while playing
  useEffect(() => {
    if (!isPlaying || !currentNarration) return;
    speak(currentNarration);
  }, [currentIndex, isPlaying, currentNarration, speak]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= scenes.length) return;
      stopSpeaking();
      setCurrentIndex(index);
    },
    [scenes.length, stopSpeaking]
  );

  const goPrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);
  const goNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);

  const handleAutoAdvance = useCallback(() => {
    if (currentIndex < scenes.length - 1) {
      goNext();
    } else {
      setIsPlaying(false);
      stopSpeaking();
    }
  }, [currentIndex, scenes.length, goNext, stopSpeaking]);

  const togglePlay = useCallback(() => {
    if (!isReady) return; // don't allow play until narrations ready
    if (isPlaying) {
      setIsPlaying(false);
      stopSpeaking();
    } else {
      setIsPlaying(true);
      if (currentNarration) speak(currentNarration);
    }
  }, [isReady, isPlaying, stopSpeaking, currentNarration, speak]);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === " " && isReady) { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose, goPrev, goNext, togglePlay, isReady]);

  // ── Fetch LLM narrations ───────────────────────────────────────────────────
  const fetchNarrations = useCallback(
    async (forceRefresh = false, lang = language) => {
      if (!projectId) return;
      setNarrationStatus("loading");
      setNarrationError(null);
      try {
        const data = await api.post<LLMNarration[]>(
          `/api/v1/projects/${projectId}/narrator/generate`,
          { force_refresh: forceRefresh, language: lang }
        );
        if (!data?.length) throw new Error("No narrations returned");
        const map: Record<number, string> = {};
        for (const item of data) {
          if (item.narration && item.narration.trim()) {
            map[item.scene_number] = item.narration.trim();
          }
        }
        setNarrations(map);
        setNarrationStatus("ready");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to generate narrations";
        setNarrationError(msg);
        setNarrationStatus("error");
      }
    },
    [projectId, language]
  );

  // ── Initial data load ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      // Reset on close
      setCurrentIndex(0);
      setIsPlaying(false);
      setNarrations({});
      setNarrationStatus("idle");
      setNarrationError(null);
      stopSpeaking();
      return;
    }

    // 1. Load scenes + images
    setLoadingData(true);
    Promise.all([
      api.get<Scene[]>(`/api/v1/projects/${projectId}/scenes`),
      api.get<SceneImage[]>(`/api/v1/projects/${projectId}/scene-images`).catch(() => [] as SceneImage[]),
    ])
      .then(([sceneData, imageData]) => {
        setScenes(sceneData || []);
        setImages(imageData || []);
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, [isOpen, projectId, stopSpeaking]);

  // 2. Once scenes are loaded (or language changes), fetch LLM narrations
  useEffect(() => {
    if (!scenes.length) return;
    fetchNarrations(false, language);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenes.length, language]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(167,139,250,0.4); }
          50% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(167,139,250,0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes voice-pulse {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.8); }
        }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              background: "#020408",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* ── Blurred scene background ── */}
            <AnimatePresence mode="wait">
              {currentImage && (
                <motion.div
                  key={currentImage.scene_number}
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${currentImage.image_url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "brightness(0.18) saturate(0.5) blur(2px)",
                  }}
                />
              )}
            </AnimatePresence>

            {/* ── Cinematic gradient vignette ── */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, rgba(2,4,8,0.55) 0%, rgba(2,4,8,0.02) 28%, rgba(2,4,8,0.65) 62%, rgba(2,4,8,0.99) 100%)",
                pointerEvents: "none",
              }}
            />

            {/* ── Top bar ── */}
            <div
              style={{
                position: "relative",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 28px",
              }}
            >
              {/* Left — title + status */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 13,
                    background: "linear-gradient(135deg, rgba(167,139,250,0.25), rgba(96,165,250,0.12))",
                    border: "1px solid rgba(167,139,250,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 20px rgba(167,139,250,0.15)",
                  }}
                >
                  <Film size={19} style={{ color: "#A78BFA" }} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <p style={{ color: "#F9FAFB", fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
                      Cinematic Narrator
                    </p>
                    {narrationStatus === "loading" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Loader2
                          size={12}
                          style={{ color: "#A78BFA", animation: "spin 1s linear infinite" }}
                        />
                        <span style={{ color: "#A78BFA", fontSize: 10, fontWeight: 600, letterSpacing: "0.04em" }}>
                          AI WRITING…
                        </span>
                      </div>
                    )}
                    {narrationStatus === "ready" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Sparkles size={11} style={{ color: "#34D399" }} />
                        <span style={{ color: "#34D399", fontSize: 10, fontWeight: 600 }}>READY</span>
                      </div>
                    )}
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: 0 }}>
                    {loadingData
                      ? "Loading scenes…"
                      : narrationStatus === "loading"
                      ? `Groq AI is narrating all ${scenes.length} scenes…`
                      : narrationStatus === "error"
                      ? "Narration generation failed"
                      : scenes.length > 0
                      ? `${scenes.length} scenes · Scene ${currentIndex + 1} of ${scenes.length}`
                      : "No scenes found"}
                  </p>
                </div>
              </div>

              {/* Right — controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Language Toggle */}
                <button
                  onClick={() => {
                    const newLang = language === "english" ? "malayalam" : "english";
                    setLanguage(newLang);
                    setNarrations({});
                    setIsPlaying(false);
                    stopSpeaking();
                  }}
                  title="Switch Language"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "7px 12px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.18s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#A78BFA"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                >
                  <Globe size={13} />
                  {language === "english" ? "EN" : "ML"}
                </button>

                {/* Refresh narrations */}
                {narrationStatus !== "loading" && (
                  <button
                    onClick={() => {
                      setNarrationStatus("idle");
                      setNarrations({});
                      fetchNarrations(true);
                    }}
                    title="Re-generate narrations"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#A78BFA"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.4)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  >
                    <RefreshCw size={14} />
                  </button>
                )}

                {/* Voice toggle */}
                <button
                  id="narrator-voice-toggle"
                  onClick={() => {
                    setVoiceEnabled((p) => {
                      if (p) stopSpeaking();
                      return !p;
                    });
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "7px 14px",
                    borderRadius: 10,
                    background: voiceEnabled ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.05)",
                    border: voiceEnabled ? "1px solid rgba(167,139,250,0.4)" : "1px solid rgba(255,255,255,0.12)",
                    color: voiceEnabled ? "#A78BFA" : "rgba(255,255,255,0.35)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.18s",
                  }}
                >
                  {voiceEnabled
                    ? isSpeaking
                      ? (
                        <>
                          <Volume2 size={13} style={{ animation: "pulse-glow 1s ease-in-out infinite" }} />
                          Speaking…
                        </>
                      )
                      : <><Mic size={13} />Voice On</>
                    : <><MicOff size={13} />Voice Off</>}
                </button>

                {/* Close */}
                <button
                  id="narrator-close-btn"
                  onClick={onClose}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#6B7280",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── Scene image ── */}
            <div
              style={{
                position: "relative",
                zIndex: 5,
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 100px",
                minHeight: 0,
              }}
            >
              <AnimatePresence mode="wait">
                {loadingData ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      width: "100%", maxWidth: 860,
                      aspectRatio: "16/9", borderRadius: 18,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Loader2 size={28} style={{ color: "rgba(167,139,250,0.4)", animation: "spin 1s linear infinite" }} />
                  </motion.div>
                ) : currentImage ? (
                  <motion.div
                    key={`img-${currentScene?.scene_number}`}
                    initial={{ opacity: 0, y: 14, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -14, scale: 0.97 }}
                    transition={{ duration: 0.55, ease: "easeInOut" }}
                    style={{
                      maxHeight: "50vh",
                      width: "100%",
                      maxWidth: 860,
                      borderRadius: 18,
                      overflow: "hidden",
                      boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentImage.image_url}
                      alt={`Scene ${currentScene?.scene_number}`}
                      style={{ width: "100%", display: "block", aspectRatio: "16/9", objectFit: "cover" }}
                    />
                  </motion.div>
                ) : currentScene ? (
                  <motion.div
                    key={`noimg-${currentScene.scene_number}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      width: "100%", maxWidth: 860,
                      aspectRatio: "16/9", borderRadius: 18,
                      background: "linear-gradient(135deg, rgba(167,139,250,0.06), rgba(96,165,250,0.03))",
                      border: "1px solid rgba(167,139,250,0.1)",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 10,
                    }}
                  >
                    <Film size={44} style={{ color: "rgba(167,139,250,0.25)" }} />
                    <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, fontWeight: 600 }}>
                      {currentScene.heading}
                    </p>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Prev / Next arrows */}
              {scenes.length > 1 && (
                <>
                  <button
                    id="narrator-prev-btn"
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    style={{
                      position: "absolute", left: 24, top: "50%",
                      transform: "translateY(-50%)",
                      width: 48, height: 48, borderRadius: 14,
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: currentIndex === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.75)",
                      cursor: currentIndex === 0 ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    id="narrator-next-btn"
                    onClick={goNext}
                    disabled={currentIndex === scenes.length - 1}
                    style={{
                      position: "absolute", right: 24, top: "50%",
                      transform: "translateY(-50%)",
                      width: 48, height: 48, borderRadius: 14,
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: currentIndex === scenes.length - 1 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.75)",
                      cursor: currentIndex === scenes.length - 1 ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
            </div>

            {/* ── Bottom panel ── */}
            <div
              style={{
                position: "relative",
                zIndex: 10,
                padding: "16px 24px 28px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {/* Scene label */}
              <AnimatePresence mode="wait">
                {currentScene && (
                  <motion.div
                    key={`label-${currentScene.scene_number}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ textAlign: "center" }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap", justifyContent: "center" }}>
                      <span
                        style={{
                          background: "rgba(167,139,250,0.14)",
                          border: "1px solid rgba(167,139,250,0.28)",
                          color: "#A78BFA",
                          fontSize: 10, fontWeight: 800,
                          padding: "3px 10px", borderRadius: 6,
                          letterSpacing: "0.08em",
                        }}
                      >
                        SCENE {currentScene.scene_number}
                      </span>
                      {currentScene.location && (
                        <span style={{ color: "rgba(52,211,153,0.7)", fontSize: 11, fontWeight: 600 }}>
                          {currentScene.int_ext && `${currentScene.int_ext} · `}{currentScene.location}
                          {currentScene.time_of_day ? ` · ${currentScene.time_of_day}` : ""}
                        </span>
                      )}
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, margin: 0 }}>
                      {currentScene.heading}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Narration area ── */}
              <div style={{ minHeight: 100, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AnimatePresence mode="wait">
                  {narrationStatus === "loading" ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Sparkles size={14} style={{ color: "#A78BFA" }} />
                        <span style={{ color: "rgba(167,139,250,0.8)", fontSize: 13, fontWeight: 600 }}>
                          Groq AI is reading & narrating all {scenes.length} scenes…
                        </span>
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, margin: 0 }}>
                        Understanding each scene and writing cinematic voiceovers. This takes ~10 seconds.
                      </p>
                      {/* Animated loading bars */}
                      <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 20 }}>
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            style={{
                              width: 3,
                              height: 14,
                              borderRadius: 2,
                              background: "#A78BFA",
                              animation: `voice-pulse 1.2s ease-in-out ${i * 0.18}s infinite`,
                            }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : narrationStatus === "error" ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ textAlign: "center" }}
                    >
                      <p style={{ color: "rgba(248,113,113,0.7)", fontSize: 13, margin: "0 0 10px" }}>
                        {narrationError || "Could not generate narrations"}
                      </p>
                      <button
                        onClick={() => fetchNarrations(true)}
                        style={{
                          padding: "7px 18px", borderRadius: 9,
                          background: "rgba(248,113,113,0.1)",
                          border: "1px solid rgba(248,113,113,0.25)",
                          color: "#F87171", fontSize: 12, fontWeight: 600, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 5, margin: "0 auto",
                        }}
                      >
                        <RefreshCw size={12} /> Retry
                      </button>
                    </motion.div>
                  ) : narrationStatus === "ready" && currentNarration ? (
                    <motion.div
                      key={`narr-${currentScene?.scene_number}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.45 }}
                      style={{ width: "100%" }}
                    >
                      <NarrationText text={currentNarration} isActive={true} />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* ── Playback controls ── */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  id="narrator-first-btn"
                  onClick={() => goTo(0)}
                  disabled={currentIndex === 0}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: currentIndex === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.55)",
                    cursor: currentIndex === 0 ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <SkipBack size={15} />
                </button>
                <button
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: currentIndex === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.7)",
                    cursor: currentIndex === 0 ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Play / Pause — disabled while loading */}
                <button
                  id="narrator-play-btn"
                  onClick={togglePlay}
                  disabled={!isReady || !scenes.length}
                  title={!isReady ? "Waiting for AI narrations…" : isPlaying ? "Pause" : "Play narration"}
                  style={{
                    width: 62, height: 62, borderRadius: 18,
                    background: isReady && scenes.length
                      ? isPlaying
                        ? "linear-gradient(135deg, rgba(167,139,250,0.5), rgba(96,165,250,0.35))"
                        : "linear-gradient(135deg, rgba(167,139,250,0.3), rgba(96,165,250,0.2))"
                      : "rgba(255,255,255,0.04)",
                    border: isReady && scenes.length
                      ? "1px solid rgba(167,139,250,0.5)"
                      : "1px solid rgba(255,255,255,0.08)",
                    color: isReady && scenes.length ? "#C4B5FD" : "rgba(255,255,255,0.15)",
                    cursor: isReady && scenes.length ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: isReady && scenes.length ? "0 0 30px rgba(167,139,250,0.25)" : "none",
                    transition: "all 0.2s",
                    animation: isPlaying ? "pulse-glow 2s ease-in-out infinite" : "none",
                  }}
                >
                  {narrationStatus === "loading"
                    ? <Loader2 size={24} style={{ animation: "spin 1s linear infinite", color: "rgba(167,139,250,0.5)" }} />
                    : isPlaying
                    ? <Pause size={24} />
                    : <Play size={24} />}
                </button>

                <button
                  onClick={goNext}
                  disabled={currentIndex === scenes.length - 1}
                  style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: currentIndex === scenes.length - 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.7)",
                    cursor: currentIndex === scenes.length - 1 ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  id="narrator-last-btn"
                  onClick={() => goTo(scenes.length - 1)}
                  disabled={currentIndex === scenes.length - 1}
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: currentIndex === scenes.length - 1 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.55)",
                    cursor: currentIndex === scenes.length - 1 ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  <SkipForward size={15} />
                </button>
              </div>

              {/* Scene dots */}
              {scenes.length > 0 && scenes.length <= 60 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center", maxWidth: 520, marginTop: 2 }}>
                  {scenes.map((s, i) => {
                    const hasNarration = !!narrations[s.scene_number];
                    return (
                      <button
                        key={s.scene_number}
                        id={`narrator-dot-scene-${s.scene_number}`}
                        onClick={() => goTo(i)}
                        title={`Scene ${s.scene_number}`}
                        style={{
                          width: i === currentIndex ? 22 : 7,
                          height: 7,
                          borderRadius: 4,
                          background: i === currentIndex
                            ? "#A78BFA"
                            : hasNarration
                            ? "rgba(167,139,250,0.4)"
                            : "rgba(255,255,255,0.1)",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          transition: "all 0.25s ease",
                          flexShrink: 0,
                        }}
                      />
                    );
                  })}
                </div>
              )}
              {scenes.length > 60 && (
                <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 11, margin: "4px 0 0" }}>
                  Use ← → keys to navigate · {currentIndex + 1} / {scenes.length}
                </p>
              )}
            </div>

            {/* Auto-advance bar */}
            <ProgressBar durationMs={ADVANCE_MS} active={isPlaying} onDone={handleAutoAdvance} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
