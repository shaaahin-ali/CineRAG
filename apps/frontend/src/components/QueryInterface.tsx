"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, StopCircle, Sparkles } from "lucide-react";
import { useSSE } from "@/hooks/useSSE";
import { useQueryStore } from "@/hooks/useQuery";
import { CitationPill } from "./CitationPill";
import { LanguageToggle } from "./LanguageToggle";
import { Citation, CrewRole, Language } from "@/types";
import messages from "@/i18n";

const CREW_ROLES: CrewRole[] = [
  "actor", "director", "cinematographer", "editor", "music", "producer",
];

const ML_SUGGESTIONS = [
  { ml: "എന്റെ കഥാപാത്രത്തിന്റെ വികാസം വിവരിക്കുക", en: "Describe my character's arc", role: "actor" as CrewRole },
  { ml: "കുടുംബ സംഘർഷത്തിന്റെ ശിഖരം കാണിക്കുക", en: "Show the family conflict climax", role: "director" as CrewRole },
  { ml: "മഴകാലത്തിലെ കാണുകൾ കാണിക്കുക", en: "Show all monsoon scenes", role: "cinematographer" as CrewRole },
  { ml: "ത്യാഗത്തിന്റെ വികാസം വിവരിക്കുക", en: "Describe the sacrifice arc", role: "actor" as CrewRole },
  { ml: "സങ്കടമുഭരിത കാണിൽ സംഗീതത്തിന്റെ പങ്ക്", en: "Music role in emotional scenes", role: "music" as CrewRole },
];

interface QueryInterfaceProps {
  projectId: string;
}

export function QueryInterface({ projectId }: QueryInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  const {
    streamingResponse, appendToken, resetResponse,
    citations, addCitation, clearCitations,
    isStreaming, setStreaming,
    selectedLanguage, setLanguage,
    selectedRole, setRole,
  } = useQueryStore();

  const { query: streamQuery, abort } = useSSE({
    onToken: useCallback((token: string) => {
      appendToken(token);
      responseRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [appendToken]),
    onCitation: useCallback((citation: Citation) => {
      addCitation(citation);
    }, [addCitation]),
    onComplete: useCallback(() => {
      setStreaming(false);
    }, [setStreaming]),
    onError: useCallback((err: string) => {
      setStreaming(false);
      appendToken(`\n\n⚠️ Error: ${err}`);
    }, [setStreaming, appendToken]),
  });

  const t = messages[selectedLanguage];

  const handleSubmit = async (queryText?: string) => {
    const text = queryText || inputValue.trim();
    if (!text || isStreaming) return;

    resetResponse();
    clearCitations();
    setStreaming(true);
    setInputValue("");

    await streamQuery(projectId, text, {
      language: selectedLanguage,
      userRole: selectedRole || "director",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Suggestions ───────────────────────────────────────────────────── */}
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
                onClick={() => handleSubmit(selectedLanguage === "ml" ? s.ml : s.en)}
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

      {/* ── Streaming Response Area ────────────────────────────────────────── */}
      {(streamingResponse || isStreaming) && (
        <div className="flex-1 mb-6 overflow-y-auto">
          {/* Citations */}
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

          {/* Response text */}
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

      {/* ── Input Area ────────────────────────────────────────────────────── */}
      <div className="mt-auto">
        {/* Role + Language controls */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          {/* Role selector */}
          <div className="flex gap-1 flex-wrap">
            {CREW_ROLES.map((role) => (
              <button
                key={role}
                id={`role-${role}`}
                onClick={() => setRole(role)}
                className="px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all"
                style={{
                  background: selectedRole === role ? "rgba(253,176,34,0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${selectedRole === role ? "rgba(253,176,34,0.3)" : "rgba(255,255,255,0.06)"}`,
                  color: selectedRole === role ? "var(--accent-gold)" : "var(--text-muted)",
                }}
              >
                {t.roles[role]}
              </button>
            ))}
          </div>
          <LanguageToggle value={selectedLanguage} onChange={setLanguage} />
        </div>

        {/* Textarea + send */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            id="query-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.query.placeholder}
            disabled={isStreaming}
            rows={3}
            className={`input-field resize-none pr-16 ${selectedLanguage === "ml" ? "font-malayalam" : ""}`}
            style={{ minHeight: "80px" }}
          />

          <div className="absolute bottom-3 right-3">
            {isStreaming ? (
              <button
                onClick={abort}
                id="stop-streaming"
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "#F87171" }}
                title="Stop streaming"
              >
                <StopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmit()}
                id="submit-query"
                disabled={!inputValue.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                style={{
                  background: inputValue.trim() ? "linear-gradient(135deg, #FDB022, #F79009)" : "rgba(255,255,255,0.06)",
                  color: inputValue.trim() ? "#05070F" : "var(--text-muted)",
                }}
                title="Send query (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-xs mt-2 text-center" style={{ color: "var(--text-muted)" }}>
          Press <kbd className="px-1 py-0.5 rounded text-xs"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            Enter
          </kbd>{" "}
          to send · <kbd className="px-1 py-0.5 rounded text-xs"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            Shift+Enter
          </kbd>{" "}
          for new line
        </p>
      </div>
    </div>
  );
}
