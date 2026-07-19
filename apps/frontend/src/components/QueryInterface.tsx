"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StopCircle,
  ChevronDown,
  Film,
  Camera,
  Clapperboard,
  Music,
  Scissors,
  Briefcase,
  Send,
  Mic2,
  AlertCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useSSE } from "@/hooks/useSSE";
import { useQueryStore } from "@/hooks/useQuery";
import { CitationPill } from "./CitationPill";
import { LanguageToggle } from "./LanguageToggle";
import { Citation, CrewRole } from "@/types";
import messages from "@/i18n";

/* ── Role definitions ─────────────────────────────────────────────────── */

const CREW_ROLES: {
  value: CrewRole;
  label: string;
  icon: typeof Film;
  description: string;
}[] = [
  { value: "director",        label: "Director",        icon: Film,         description: "Vision, scene flow, story intent" },
  { value: "actor",           label: "Actor",            icon: Clapperboard, description: "Character arcs and motivation" },
  { value: "cinematographer", label: "Cinematographer",  icon: Camera,       description: "Shot language and visual motifs" },
  { value: "editor",          label: "Editor",           icon: Scissors,     description: "Transitions, rhythm, pacing" },
  { value: "music",           label: "Music Director",   icon: Music,        description: "Mood, tone, musical cues" },
  { value: "producer",        label: "Producer",         icon: Briefcase,    description: "Budget, schedule, logistics" },
  { value: "narrator",        label: "Narrator",         icon: Mic2,         description: "Story voice, perspective & tone" },
];

const SUGGESTIONS = [
  "Who are the main characters?",
  "Describe the opening scene",
  "What is the central conflict?",
  "List all exterior locations",
];

interface QueryInterfaceProps {
  projectId: string;
}

export function QueryInterface({ projectId }: QueryInterfaceProps) {
  const bottomRef          = useRef<HTMLDivElement>(null);
  const [roleOpen, setRoleOpen]   = useState(false);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);

  const {
    streamingResponse,
    appendToken,
    resetResponse,
    citations,
    addCitation,
    clearCitations,
    isStreaming,
    setStreaming,
    selectedLanguage,
    setLanguage,
    selectedRole,
    setRole,
  } = useQueryStore();

  /* Default to "director" on first visit */
  useEffect(() => {
    if (!selectedRole) setRole("director");
  }, [selectedRole, setRole]);

  /* Keep callbacks stable with refs so SSE never sees stale closures */
  const appendTokenRef  = useRef(appendToken);
  const addCitationRef  = useRef(addCitation);
  const setStreamingRef = useRef(setStreaming);
  useEffect(() => { appendTokenRef.current  = appendToken;  }, [appendToken]);
  useEffect(() => { addCitationRef.current  = addCitation;  }, [addCitation]);
  useEffect(() => { setStreamingRef.current = setStreaming;  }, [setStreaming]);

  const { query: streamQuery, abort } = useSSE({
    onToken:    useCallback((token: string)      => { appendTokenRef.current(token); bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, []),
    onCitation: useCallback((citation: Citation) => { addCitationRef.current(citation); }, []),
    onComplete: useCallback(()                   => { setStreamingRef.current(false); setErrorMsg(null); }, []),
    onError:    useCallback((err: string)        => {
      setStreamingRef.current(false);
      setErrorMsg(err);
      toast.error("Query failed", { description: err });
    }, []),
  });

  const { data: session } = useSession();
  const firstName  = session?.user?.name?.split(" ")[0] || "there";
  const t          = messages[selectedLanguage];
  const activeRole = CREW_ROLES.find((r) => r.value === selectedRole) ?? CREW_ROLES[0];

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isStreaming) return;
      setErrorMsg(null);
      resetResponse();
      clearCitations();
      setStreaming(true);
      await streamQuery(projectId, message, {
        language: selectedLanguage,
        userRole: selectedRole || "director",
      });
    },
    [projectId, selectedLanguage, selectedRole, isStreaming, resetResponse, clearCitations, setStreaming, streamQuery],
  );

  const handleAbort = useCallback(() => {
    abort();
    setStreaming(false);
  }, [abort, setStreaming]);

  /* Close role dropdown on outside click */
  useEffect(() => {
    if (!roleOpen) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest("#role-dropdown-wrapper")) setRoleOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [roleOpen]);

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Idle / greeting ───────────────────────────────────────────── */}
      {!streamingResponse && !isStreaming && !errorMsg && (
        <motion.div
          key="idle"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex-1 flex flex-col items-center justify-center text-center px-4 py-6 min-h-0"
        >
          <h2
            className="font-black tracking-tighter text-white"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", lineHeight: 1.08 }}
          >
            Hey, {firstName}.
          </h2>
          <p className="mt-2 text-sm max-w-xs" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
            Ask anything about this production — I&apos;ll find the exact scenes.
          </p>

          {/* Role badge */}
          <div
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.6)" }}
          >
            <activeRole.icon className="w-3 h-3" />
            Viewing as {activeRole.label}
          </div>

          {/* Quick-start suggestions */}
          <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-md">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-full transition-all"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.55)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "#FFFFFF"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }}
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Error state ────────────────────────────────────────────────── */}
      {errorMsg && !isStreaming && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex items-center justify-center min-h-0"
        >
          <div
            className="flex flex-col items-center gap-3 text-center p-6 rounded-xl max-w-sm mx-4"
            style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.2)" }}
          >
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm font-semibold text-white">Query failed</p>
            <p className="text-xs" style={{ color: "rgba(248,113,113,0.8)" }}>{errorMsg}</p>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs px-4 py-1.5 rounded-full border border-red-400/30 text-red-400/80 hover:text-red-300 hover:border-red-400/50 transition-all"
            >
              Try again
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Response area ──────────────────────────────────────────────── */}
      {(streamingResponse || isStreaming) && (
        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pb-2">
          {citations.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-xs font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                Referenced scenes:
              </p>
              <div className="flex flex-wrap">
                {citations.map((c, i) => <CitationPill key={i} citation={c} index={i} />)}
              </div>
            </motion.div>
          )}

          <div
            className="p-5 rounded-xl"
            style={{
              background:  "rgba(255,255,255,0.04)",
              border:      "1px solid rgba(255,255,255,0.14)",
              color:       "rgba(255,255,255,0.85)",
              fontSize:    "0.9375rem",
              lineHeight:  "1.75",
              whiteSpace:  "pre-wrap",
            }}
          >
            {(() => {
              const cleanText = streamingResponse.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '').trim();
              const isThinking = streamingResponse.includes('<think>') && !streamingResponse.includes('</think>');
              
              const showLoading = isStreaming && cleanText.length < 8;

              if (showLoading) {
                return (
                  <div className="flex items-center gap-3 py-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                    Generating response...
                  </div>
                );
              }

              return (
                <>
                  {cleanText}
                  {isThinking && (
                    <span className="inline-flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded text-xs font-medium" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                      Thinking...
                    </span>
                  )}
                  {isStreaming && !isThinking && <span className="streaming-cursor" />}
                </>
              );
            })()}
          </div>

          <div ref={bottomRef} />
        </div>
      )}

      {/* ── Bottom Controls ────────────────────────────────────────────── */}
      {/*
          Everything is in normal flow (no absolute positioning that could clip).
          The role dropdown opens UPWARD via CSS but the container has overflow-visible.
      */}
      <div className="flex-shrink-0 pt-3" style={{ overflow: "visible" }}>

        {/* Row 1: role + language + STOP (all inline, no clipping) */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">

          {/* Role dropdown — opens upward, overflow visible */}
          <div id="role-dropdown-wrapper" className="relative" style={{ overflow: "visible" }}>
            <button
              id="role-dropdown-btn"
              onClick={() => setRoleOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.22)", color: "#FFFFFF" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            >
              <activeRole.icon className="w-3.5 h-3.5" />
              <span>I am a {activeRole.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${roleOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {roleOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  /* Opens upward; z-[200] ensures it sits above everything */
                  className="absolute left-0 z-[200] w-56 rounded-xl py-1.5 shadow-2xl"
                  style={{
                    bottom:      "calc(100% + 6px)",
                    background:  "rgba(0,0,0,0.99)",
                    border:      "1px solid rgba(255,255,255,0.2)",
                    boxShadow:   "0 -8px 40px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.08)",
                  }}
                >
                  {CREW_ROLES.map((role) => {
                    const Icon = role.icon;
                    const active = selectedRole === role.value;
                    return (
                      <button
                        key={role.value}
                        id={`role-option-${role.value}`}
                        onClick={() => { setRole(role.value); setRoleOpen(false); }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm transition-all"
                        style={{ color: active ? "#FFFFFF" : "rgba(255,255,255,0.65)", background: active ? "rgba(255,255,255,0.1)" : "transparent" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#E8E8E8"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = active ? "rgba(255,255,255,0.1)" : "transparent"; e.currentTarget.style.color = active ? "#FFFFFF" : "rgba(255,255,255,0.65)"; }}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold text-xs">{role.label}</div>
                          <div className="text-[10px] opacity-50 truncate">{role.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <LanguageToggle value={selectedLanguage} onChange={setLanguage} />

          {/* Stop button — inline, always visible when streaming, never clipped */}
          <AnimatePresence>
            {isStreaming && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                onClick={handleAbort}
                id="stop-streaming"
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: "rgba(248,113,113,0.14)",
                  border:     "1px solid rgba(248,113,113,0.35)",
                  color:      "#F87171",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.22)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.55)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(248,113,113,0.14)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.35)"; }}
              >
                <StopCircle className="w-4 h-4" />
                Stop
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Row 2: Chat input */}
        <ChatInputRow
          placeholder={isStreaming ? "Generating response…" : t.query.placeholder}
          disabled={isStreaming}
          onSend={handleSendMessage}
        />
      </div>
    </div>
  );
}

/* ── Chat Input Row ──────────────────────────────────────────────────── */

function ChatInputRow({
  placeholder,
  disabled,
  onSend,
}: {
  placeholder: string;
  disabled: boolean;
  onSend: (msg: string) => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /* Auto-focus input on mount */
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  /* Re-focus after streaming ends */
  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    setValue("");
    onSend(trimmed);
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-text transition-all"
      style={{
        background: disabled ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
        border:     `1px solid ${disabled ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.28)"}`,
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <Film
        className="w-4 h-4 flex-shrink-0 transition-colors"
        style={{ color: disabled ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.55)" }}
      />

      <input
        ref={inputRef}
        id="chat-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
        }}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        className="flex-1 bg-transparent text-sm text-white focus:outline-none disabled:cursor-not-allowed"
        style={{ color: "rgba(255,255,255,0.9)", caretColor: "#FFFFFF" }}
      />

      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        id="send-query-btn"
        title="Send (Enter)"
        className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: "linear-gradient(135deg, #FFFFFF, #C0C0C0)" }}
        onMouseEnter={(e) => {
          if (!disabled && value.trim()) {
            (e.currentTarget as HTMLElement).style.opacity    = "0.82";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 18px rgba(255,255,255,0.45)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.opacity    = "1";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}
      >
        <Send className="w-3.5 h-3.5 text-white" />
      </button>
    </div>
  );
}
