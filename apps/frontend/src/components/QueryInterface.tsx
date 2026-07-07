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
} from "lucide-react";
import { useSession } from "next-auth/react";
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
  { value: "director", label: "Director", icon: Film, description: "Vision, scene flow, story intent" },
  { value: "actor", label: "Actor", icon: Clapperboard, description: "Character arcs and motivation" },
  { value: "cinematographer", label: "Cinematographer", icon: Camera, description: "Shot language and visual motifs" },
  { value: "editor", label: "Editor", icon: Scissors, description: "Transitions, rhythm, pacing" },
  { value: "music", label: "Music Director", icon: Music, description: "Mood, tone, musical cues" },
  { value: "producer", label: "Producer", icon: Briefcase, description: "Budget, schedule, logistics" },
];

/* ── Typewriter hook ─────────────────────────────────────────────────── */

function useTypewriter(text: string, speed = 45, startDelay = 300) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const startTimer = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(iv);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(startTimer);
  }, [text, speed, startDelay]);
  return { displayed, done };
}

type GreetingStep = "greeting" | "subtitle" | "roles";

interface QueryInterfaceProps {
  projectId: string;
}

export function QueryInterface({ projectId }: QueryInterfaceProps) {
  const responseRef = useRef<HTMLDivElement>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [greetingStep, setGreetingStep] = useState<GreetingStep>("greeting");

  const { displayed: typedGreeting, done: greetingDone } = useTypewriter("Hey, director.", 50, 200);

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

  const { query: streamQuery, abort } = useSSE({
    onToken: useCallback(
      (token: string) => {
        appendToken(token);
        responseRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      },
      [appendToken],
    ),
    onCitation: useCallback((citation: Citation) => { addCitation(citation); }, [addCitation]),
    onComplete: useCallback(() => { setStreaming(false); }, [setStreaming]),
    onError: useCallback(
      (err: string) => {
        setStreaming(false);
        appendToken(`\n\nError: ${err}`);
      },
      [setStreaming, appendToken],
    ),
  });

  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const t = messages[selectedLanguage];
  const activeRole = CREW_ROLES.find((r) => r.value === selectedRole);

  /* Advance greeting steps */
  useEffect(() => {
    if (selectedRole) return;
    if (greetingStep === "greeting" && greetingDone) {
      const timer = setTimeout(() => setGreetingStep("subtitle"), 200);
      return () => clearTimeout(timer);
    }
    if (greetingStep === "subtitle") {
      const timer = setTimeout(() => setGreetingStep("roles"), 700);
      return () => clearTimeout(timer);
    }
  }, [greetingStep, greetingDone, selectedRole]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message || isStreaming) return;
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

  /* ── Role Picker Screen ─────────────────────────────────────────────── */
  if (!selectedRole) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* "Hey, director." typewriter */}
          <div className="text-center mb-8">
            <h2
              className="font-black tracking-tighter text-white"
              style={{ fontSize: "clamp(2.5rem,5vw,3.75rem)", lineHeight: 1.05 }}
            >
              {typedGreeting}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
                style={{ display: greetingDone ? "none" : "inline-block", marginLeft: 2 }}
              >
                |
              </motion.span>
            </h2>

            <AnimatePresence>
              {(greetingStep === "subtitle" || greetingStep === "roles") && (
                <motion.p
                  key="subtitle"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-3 text-sm max-w-sm mx-auto"
                  style={{ color: "rgba(160,180,255,0.55)", lineHeight: 1.65 }}
                >
                  Choose how CineRAG should reason about this production,
                  then ask anything with scene-backed citations.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Role cards */}
          <AnimatePresence>
            {greetingStep === "roles" && (
              <motion.div
                key="role-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-2.5"
              >
                {CREW_ROLES.map((role, i) => {
                  const Icon = role.icon;
                  return (
                    <motion.button
                      key={role.value}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.055, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => setRole(role.value)}
                      className="flex flex-col items-center gap-2.5 p-4 rounded-xl text-center cursor-pointer group transition-all"
                      style={{
                        background: "rgba(79,158,255,0.04)",
                        border: "1px solid rgba(79,158,255,0.14)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(79,158,255,0.45)";
                        e.currentTarget.style.background = "rgba(79,158,255,0.09)";
                        e.currentTarget.style.boxShadow = "0 0 20px rgba(79,158,255,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(79,158,255,0.14)";
                        e.currentTarget.style.background = "rgba(79,158,255,0.04)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl transition-all"
                        style={{
                          background: "rgba(79,158,255,0.08)",
                          border: "1px solid rgba(79,158,255,0.18)",
                        }}
                      >
                        <Icon className="h-5 w-5 transition-colors" style={{ color: "rgba(160,180,255,0.7)" }} />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block">{role.label}</span>
                        <span
                          className="text-[11px] leading-snug block mt-0.5"
                          style={{ color: "rgba(160,180,255,0.4)" }}
                        >
                          {role.description}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat input always visible at bottom of role picker */}
          <AnimatePresence>
            {greetingStep === "roles" && (
              <motion.div
                key="input-area"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="mt-5"
              >
                <ChatInputRow
                  placeholder="Ask CineRAG to compare motifs, dialogue, pacing, or scene logic..."
                  disabled={isStreaming}
                  onSend={(msg) => {
                    setRole("director");
                    setTimeout(() => handleSendMessage(msg), 50);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  /* ── Main Chat Interface ───────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Idle greeting — shown when no query has been made yet */}
      {!streamingResponse && !isStreaming && (
        <motion.div
          key="idle-greeting"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col items-center justify-center text-center px-4"
        >
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="font-black tracking-tighter"
            style={{
              fontSize: "clamp(2.2rem,4.5vw,3.25rem)",
              lineHeight: 1.05,
              color: "white",
            }}
          >
            Hey, {firstName}.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3 text-sm max-w-xs"
            style={{ color: "rgba(160,180,255,0.45)", lineHeight: 1.65 }}
          >
            Ask anything about this production.
          </motion.p>
          {/* Role badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(79,158,255,0.08)",
              border: "1px solid rgba(79,158,255,0.2)",
              color: "rgba(160,180,255,0.6)",
            }}
          >
            {activeRole && <activeRole.icon className="w-3 h-3" />}
            <span>Viewing as {activeRole?.label}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Response area */}
      {(streamingResponse || isStreaming) && (
        <div className="flex-1 overflow-y-auto">
          {citations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <p className="text-xs font-medium mb-2" style={{ color: "rgba(160,180,255,0.4)" }}>
                Referenced scenes:
              </p>
              <div>
                {citations.map((citation, i) => (
                  <CitationPill key={i} citation={citation} index={i} />
                ))}
              </div>
            </motion.div>
          )}

          <div
            ref={responseRef}
            className="p-5 rounded-xl leading-relaxed"
            style={{
              background: "rgba(79,158,255,0.04)",
              border: "1px solid rgba(79,158,255,0.14)",
              color: "rgba(200,215,255,0.85)",
              fontSize: "0.9375rem",
              lineHeight: "1.75",
              whiteSpace: "pre-wrap",
            }}
          >
            {streamingResponse}
            {isStreaming && <span className="streaming-cursor" />}
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-3 gap-3">
          {/* Role Dropdown */}
          <div className="relative">
            <button
              id="role-dropdown-btn"
              onClick={() => setRoleDropdownOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: "rgba(79,158,255,0.08)",
                border: "1px solid rgba(79,158,255,0.22)",
                color: "#4f9eff",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(79,158,255,0.14)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(79,158,255,0.08)"; }}
            >
              {activeRole && <activeRole.icon className="w-3.5 h-3.5" />}
              <span>I am a {activeRole?.label}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${roleDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {roleDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  className="absolute bottom-full mb-2 left-0 z-30 w-56 rounded-xl py-1.5 shadow-2xl"
                  style={{
                    background: "rgba(8,11,24,0.99)",
                    border: "1px solid rgba(79,158,255,0.18)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.8)",
                  }}
                >
                  {CREW_ROLES.map((role) => {
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.value}
                        id={`role-option-${role.value}`}
                        onClick={() => {
                          setRole(role.value);
                          setRoleDropdownOpen(false);
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm transition-colors"
                        style={{
                          color: selectedRole === role.value ? "#4f9eff" : "rgba(160,180,255,0.6)",
                          background: selectedRole === role.value ? "rgba(79,158,255,0.08)" : "transparent",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(79,158,255,0.06)"; }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            selectedRole === role.value ? "rgba(79,158,255,0.08)" : "transparent";
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        <div>
                          <div className="font-medium text-xs">{role.label}</div>
                          <div className="text-[10px] opacity-50">{role.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <LanguageToggle value={selectedLanguage} onChange={setLanguage} />
        </div>

        <div className="relative">
          {isStreaming && (
            <button
              onClick={abort}
              id="stop-streaming"
              className="absolute -top-12 right-0 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm transition-all"
              style={{
                background: "rgba(248,113,113,0.12)",
                border: "1px solid rgba(248,113,113,0.25)",
                color: "#F87171",
              }}
            >
              <StopCircle className="w-4 h-4" />
              Stop
            </button>
          )}
          <ChatInputRow
            placeholder={t.query.placeholder}
            disabled={isStreaming}
            onSend={handleSendMessage}
          />
        </div>
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

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    setValue("");
    onSend(trimmed);
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
      style={{
        background: "rgba(79,158,255,0.04)",
        border: "1px solid rgba(79,158,255,0.18)",
      }}
      onFocus={() => {}}
    >
      {/* Film icon */}
      <Film className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(79,158,255,0.4)" }} />

      <input
        id="chat-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
        style={{ color: "rgba(200,215,255,0.9)" }}
      />

      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-all disabled:opacity-30"
        style={{
          background: "linear-gradient(135deg,#4f9eff,#7c6dff)",
        }}
        onMouseEnter={(e) => {
          if (!disabled && value.trim()) {
            (e.currentTarget as HTMLElement).style.opacity = "0.85";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(79,158,255,0.4)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = "1";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}
      >
        <Send className="w-3.5 h-3.5 text-white" />
      </button>
    </div>
  );
}
