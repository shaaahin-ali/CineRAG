"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StopCircle, ChevronDown } from "lucide-react";
import { useSSE } from "@/hooks/useSSE";
import { useQueryStore } from "@/hooks/useQuery";
import { CitationPill } from "./CitationPill";
import { LanguageToggle } from "./LanguageToggle";
import { Citation, CrewRole } from "@/types";
import messages from "@/i18n";
import { ClaudeChatInput } from "./ui/claude-style-ai-input";

const CREW_ROLES: { value: CrewRole; label: string; emoji: string; description: string }[] = [
  { value: "director", label: "Director", emoji: "🎬", description: "Vision, scene flow & storytelling" },
  { value: "actor", label: "Actor", emoji: "🎭", description: "Character arcs, dialogue & motivation" },
  { value: "cinematographer", label: "Cinematographer", emoji: "📷", description: "Shot composition & visual language" },
  { value: "editor", label: "Editor", emoji: "✂️", description: "Scene transitions & pacing" },
  { value: "music", label: "Music Director", emoji: "🎵", description: "Mood, tone & musical cues" },
  { value: "producer", label: "Producer", emoji: "💼", description: "Budget, schedule & logistics" },
];

const ML_SUGGESTIONS = [
  { ml: "എന്റെ കഥാപാത്രത്തിന്റെ വികാസം വിവരിക്കുക", en: "Describe my character's arc", role: "actor" as CrewRole },
  { ml: "കുടുംബ സംഘർഷത്തിന്റെ ശിഖരം കാണിക്കുക", en: "Show the family conflict climax", role: "director" as CrewRole },
  { ml: "മഴക്കാലത്തിലെ കാണുകൾ കാണിക്കുക", en: "Show all monsoon scenes", role: "cinematographer" as CrewRole },
  { ml: "ത്യാഗത്തിന്റെ വികാസം വിവരിക്കുക", en: "Describe the sacrifice arc", role: "actor" as CrewRole },
  { ml: "സങ്കടമുഭരിത കാണിൽ സംഗീതത്തിന്റെ പങ്ക്", en: "Music role in emotional scenes", role: "music" as CrewRole },
];

interface QueryInterfaceProps {
  projectId: string;
}

export function QueryInterface({ projectId }: QueryInterfaceProps) {
  const responseRef = useRef<HTMLDivElement>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

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
        appendToken(`\n\n⚠️ Error: ${err}`);
      },
      [setStreaming, appendToken],
    ),
  });

  const t = messages[selectedLanguage];
  const activeRole = CREW_ROLES.find((r) => r.value === selectedRole);

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

  const handleSuggestionClick = useCallback(
    async (suggestionText: string) => {
      if (isStreaming) return;
      resetResponse();
      clearCitations();
      setStreaming(true);
      await streamQuery(projectId, suggestionText, {
        language: selectedLanguage,
        userRole: selectedRole || "director",
      });
    },
    [projectId, selectedLanguage, selectedRole, isStreaming, resetResponse, clearCitations, setStreaming, streamQuery],
  );

  // ── Role Picker Screen (shown first time before any role is picked) ─────────
  if (!selectedRole) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          <div className="text-center mb-8">
            <p
              className="text-xs uppercase tracking-[0.35em] mb-3"
              style={{ color: "var(--accent-gold)" }}
            >
              Before you start
            </p>
            <h2 className="text-2xl font-bold text-white mb-2">Who are you in this production?</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              The AI will tailor every answer to your specific role and needs.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CREW_ROLES.map((role, i) => (
              <motion.button
                key={role.value}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setRole(role.value)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl text-center transition-all group"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(253,176,34,0.4)";
                  e.currentTarget.style.background = "rgba(253,176,34,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }}
              >
                <span className="text-2xl">{role.emoji}</span>
                <span className="text-sm font-semibold text-white">{role.label}</span>
                <span className="text-xs leading-snug" style={{ color: "var(--text-muted)" }}>
                  {role.description}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main Chat Interface ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {!streamingResponse && !isStreaming && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>
            {t.query.suggestions}
          </p>
          <div className="grid grid-cols-1 gap-2">
            {ML_SUGGESTIONS.slice(0, 3).map((s, i) => (
              <button
                key={i}
                id={`suggestion-${i}`}
                onClick={() => handleSuggestionClick(selectedLanguage === "ml" ? s.ml : s.en)}
                className="text-left p-3 rounded-xl text-sm transition-all group"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(253,176,34,0.25)";
                  e.currentTarget.style.background = "rgba(253,176,34,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
              >
                <span className={`text-white ${selectedLanguage === "ml" ? "font-malayalam" : ""}`}>
                  {selectedLanguage === "ml" ? s.ml : s.en}
                </span>
                <span className="block text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {s.role}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {(streamingResponse || isStreaming) && (
        <div className="flex-1 mb-6 overflow-y-auto">
          {citations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>
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
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "var(--text-secondary)",
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

      <div className="mt-auto">
        {/* Role Dropdown + Language Toggle row */}
        <div className="flex items-center justify-between mb-3 gap-3">
          {/* Role Dropdown */}
          <div className="relative">
            <button
              id="role-dropdown-btn"
              onClick={() => setRoleDropdownOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: "rgba(253,176,34,0.1)",
                border: "1px solid rgba(253,176,34,0.25)",
                color: "var(--accent-gold)",
              }}
            >
              <span>{activeRole?.emoji}</span>
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
                    background: "rgba(10,12,20,0.98)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {CREW_ROLES.map((role) => (
                    <button
                      key={role.value}
                      id={`role-option-${role.value}`}
                      onClick={() => {
                        setRole(role.value);
                        setRoleDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm transition-colors"
                      style={{
                        color: selectedRole === role.value ? "var(--accent-gold)" : "var(--text-secondary)",
                        background: selectedRole === role.value ? "rgba(253,176,34,0.06)" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          selectedRole === role.value ? "rgba(253,176,34,0.06)" : "transparent";
                      }}
                    >
                      <span className="text-base">{role.emoji}</span>
                      <div>
                        <div className="font-medium text-xs">{role.label}</div>
                        <div className="text-[10px] opacity-50">{role.description}</div>
                      </div>
                    </button>
                  ))}
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
                background: "rgba(248,113,113,0.15)",
                border: "1px solid rgba(248,113,113,0.3)",
                color: "#F87171",
              }}
              title="Stop streaming"
            >
              <StopCircle className="w-4 h-4" />
              Stop
            </button>
          )}
          <ClaudeChatInput
            onSendMessage={(msg) => handleSendMessage(msg)}
            disabled={isStreaming}
            placeholder={t.query.placeholder}
          />
        </div>
      </div>
    </div>
  );
}
