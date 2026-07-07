"use client";

import { useState, useRef, useCallback, RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  Loader2,
  Plus,
  Trash2,
  Wand2,
  User,
  Globe,
  ArrowRight,
  Pen,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { api } from "@/lib/api-client";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

interface CharacterEntry {
  id: string;
  name: string;
  description: string;
}

interface ScreenplayAssistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** When true, renders as an inline card (no fixed overlay) — for embedding inside a page layout */
  inline?: boolean;
}

interface AssistResponse {
  title: string;
  logline: string;
  screenplay: string;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Constants                                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

const GENRES = [
  { value: "drama", label: "Drama" },
  { value: "thriller", label: "Thriller" },
  { value: "romance", label: "Romance" },
  { value: "action", label: "Action" },
  { value: "comedy", label: "Comedy" },
  { value: "horror", label: "Horror" },
  { value: "mystery", label: "Mystery" },
  { value: "biopic", label: "Biopic" },
];

const TONES = [
  { value: "cinematic", label: "Cinematic" },
  { value: "dark", label: "Dark & Gritty" },
  { value: "lighthearted", label: "Lighthearted" },
  { value: "epic", label: "Epic" },
  { value: "intimate", label: "Intimate" },
];

const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "malayalam", label: "Malayalam" },
  { value: "hindi", label: "Hindi" },
  { value: "tamil", label: "Tamil" },
];

const EXAMPLE_IDEAS = [
  {
    label: "Kerala detective noir",
    text: "A retired police detective in 1970s Kochi is pulled back into a cold case when a mysterious letter arrives at his door. The letter contains clues pointing to a powerful politician's dark secret. As he investigates, he discovers the case is linked to his own family's past. The detective must choose between exposing the truth and protecting the people he loves.",
  },
  {
    label: "Two strangers on a train",
    text: "Two strangers — a cynical software engineer returning from a failed marriage and a free-spirited artist running from her conservative family — meet on an overnight train from Mumbai to Kerala. Over 18 hours of conversation, chai, and shared silences, they discover they are heading to the same small village for very different reasons. Their lives become entangled in unexpected ways.",
  },
  {
    label: "Musician's comeback",
    text: "A once-celebrated Carnatic vocalist who lost her voice in a tragic accident five years ago now teaches music in a small town. When a documentary filmmaker discovers her story, he convinces her to attempt a comeback performance at the annual temple festival. But to sing again, she must confront the painful memories of the night she lost everything — and forgive the person responsible.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────── */
/*  PDF Download Helper                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

function downloadAsPdf(title: string, logline: string, screenplay: string) {
  const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page { margin: 1in; }
    * { box-sizing: border-box; }
    body {
      font-family: "Courier New", Courier, monospace;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      max-width: 640px;
      margin: 0 auto;
      padding: 20px;
    }
    .cover {
      text-align: center;
      margin-bottom: 60px;
      padding-top: 80px;
    }
    .cover h1 {
      font-size: 20pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 16px;
    }
    .cover .by { font-size: 12pt; margin-bottom: 8px; }
    .cover .logline {
      font-style: italic;
      font-size: 11pt;
      max-width: 480px;
      margin: 24px auto 0;
      border-top: 1px solid #ccc;
      padding-top: 16px;
    }
    .screenplay {
      white-space: pre-wrap;
      font-size: 12pt;
    }
    @media print {
      .cover { page-break-after: always; }
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1>${title}</h1>
    <p class="by">Written with CineRAG Screenplay Assist</p>
    ${logline ? `<p class="logline">${logline}</p>` : ""}
  </div>
  <div class="screenplay">${screenplay.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
  <script>
    window.onload = function() {
      window.print();
    };
  <\/script>
</body>
</html>`;

  const blob = new Blob([content], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.onafterprint = () => URL.revokeObjectURL(url);
  } else {
    // Fallback: download as .txt if popup blocked
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([`${title}\n\n${logline}\n\n${screenplay}`], { type: "text/plain" }));
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.txt`;
    a.click();
  }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Screenplay Viewer                                                           */
/* ─────────────────────────────────────────────────────────────────────────── */

function ScreenplayViewer({ title, logline, screenplay }: AssistResponse) {
  const lines = screenplay.split("\n");

  const renderLine = (line: string, i: number) => {
    const trimmed = line.trim();

    // Scene headings: INT./EXT.
    if (/^(INT\.|EXT\.|INT\/EXT\.)/i.test(trimmed)) {
      return (
        <div
          key={i}
          style={{
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "0.04em",
            marginTop: 20,
            marginBottom: 4,
            fontSize: 12,
            textTransform: "uppercase",
          }}
        >
          {line}
        </div>
      );
    }

    // Character cues (ALL CAPS, short)
    if (
      trimmed.length > 0 &&
      trimmed === trimmed.toUpperCase() &&
      /^[A-Z][A-Z\s]{1,30}$/.test(trimmed) &&
      !trimmed.startsWith("INT") &&
      !trimmed.startsWith("EXT") &&
      !trimmed.includes("===")
    ) {
      return (
        <div
          key={i}
          style={{
            color: "#d4d4d8",
            fontWeight: 700,
            textAlign: "center",
            marginTop: 14,
            fontSize: 12,
            letterSpacing: "0.06em",
          }}
        >
          {line}
        </div>
      );
    }

    // Scene break dividers
    if (trimmed.includes("===") || trimmed.startsWith("---")) {
      return (
        <div
          key={i}
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            margin: "20px 0",
          }}
        />
      );
    }

    // Parentheticals
    if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
      return (
        <div
          key={i}
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 11,
            fontStyle: "italic",
            textAlign: "center",
            marginBottom: 2,
          }}
        >
          {line}
        </div>
      );
    }

    // Transitions: FADE IN/OUT, CUT TO
    if (/^(FADE|CUT TO|SMASH CUT|DISSOLVE)/i.test(trimmed)) {
      return (
        <div
          key={i}
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 11,
            textAlign: "right",
            marginTop: 10,
            marginBottom: 6,
            fontStyle: "italic",
          }}
        >
          {line}
        </div>
      );
    }

    // Empty line
    if (!trimmed) {
      return <div key={i} style={{ height: 8 }} />;
    }

    // Default: action / dialogue
    return (
      <div
        key={i}
        style={{
          color: "rgba(255,255,255,0.7)",
          fontSize: 13,
          lineHeight: 1.65,
          marginBottom: 2,
        }}
      >
        {line}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'Courier New', Courier, monospace" }}>
      {/* Title block */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <h2
          style={{
            color: "#F9FAFB",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            margin: "0 0 10px",
          }}
        >
          {title}
        </h2>
        {logline && (
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: 12,
              fontStyle: "italic",
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            {logline}
          </p>
        )}
      </div>

      {/* Screenplay body */}
      <div>{lines.map(renderLine)}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Shared sub-components (used by both inline & modal modes)                   */
/* ─────────────────────────────────────────────────────────────────────────── */

interface FormContentProps {
  storyIdea: string;
  setStoryIdea: (v: string) => void;
  characters: CharacterEntry[];
  addCharacter: () => void;
  removeCharacter: (id: string) => void;
  updateCharacter: (id: string, field: "name" | "description", value: string) => void;
  genre: string;
  setGenre: (v: string) => void;
  tone: string;
  setTone: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  error: string | null;
  isDisabled: boolean;
  isGenerating: boolean;
  handleGenerate: () => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
}

function InlineFormContent({
  storyIdea, setStoryIdea, characters, addCharacter, removeCharacter,
  updateCharacter, genre, setGenre, tone, setTone, language, setLanguage,
  error, isDisabled, isGenerating, handleGenerate, textareaRef,
}: FormContentProps) {
  return (
    <motion.div
      key="form"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.22 }}
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "28px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      {/* Story Idea */}
      <div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#e4e4e7",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 12,
            letterSpacing: "-0.01em",
          }}
        >
          <Wand2 size={14} style={{ color: "#a1a1aa" }} />
          Your Story Idea
          <span style={{ color: "#52525b", fontSize: 11, fontWeight: 400 }}>*</span>
        </label>

        {!storyIdea && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {EXAMPLE_IDEAS.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => setStoryIdea(ex.text)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "5px 12px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          id="sa-story-idea"
          value={storyIdea}
          onChange={(e) => setStoryIdea(e.target.value)}
          rows={6}
          placeholder={"Describe your story in detail — characters, key scenes, conflicts, and the emotional core...\n\nThe more detail you give, the better the screenplay."}
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            color: "white",
            fontSize: 13,
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.15s",
            width: "100%",
            padding: "14px 16px",
            resize: "vertical",
            lineHeight: 1.6,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(79,158,255,0.45)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(79,158,255,0.12)"; }}
        />
        <p
          style={{
            color: storyIdea.length < 20 ? "rgba(248,113,113,0.5)" : "rgba(79,158,255,0.4)",
            fontSize: 11,
            marginTop: 6,
            transition: "color 0.2s",
          }}
        >
          {storyIdea.length} characters{storyIdea.length < 20 ? " (minimum 20)" : ""}
        </p>
      </div>

      {/* Characters */}
      <div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <User size={14} style={{ color: "#a1a1aa" }} />
          Characters
          <span style={{ color: "#52525b", fontWeight: 400, fontSize: 11 }}>optional</span>
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {characters.map((char) => (
            <div key={char.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                id={`sa-char-name-${char.id}`}
                value={char.name}
                onChange={(e) => updateCharacter(char.id, "name", e.target.value)}
                placeholder="Character name"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  color: "white",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s",
                  padding: "9px 12px",
                  width: 160,
                  flexShrink: 0,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
              />
              <input
                id={`sa-char-desc-${char.id}`}
                value={char.description}
                onChange={(e) => updateCharacter(char.id, "description", e.target.value)}
                placeholder="Brief description (e.g. a stubborn detective, 40s)"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  color: "white",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.15s",
                  padding: "9px 12px",
                  flex: 1,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
              />
              <button
                onClick={() => removeCharacter(char.id)}
                style={{
                  padding: 9,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.25)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#f87171";
                  e.currentTarget.style.borderColor = "rgba(248,113,113,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.25)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <button
            id="sa-add-character"
            onClick={addCharacter}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 10,
              background: "transparent",
              border: "1px dashed rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.3)",
              fontSize: 12,
              cursor: "pointer",
              width: "fit-content",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "rgba(255,255,255,0.3)";
            }}
          >
            <Plus size={12} />
            Add character
          </button>
        </div>
      </div>

      {/* Genre */}
      <div>
        <label style={{ display: "block", color: "#e4e4e7", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          Genre
        </label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {GENRES.map((g) => (
            <button
              key={g.value}
              id={`sa-genre-${g.value}`}
              onClick={() => setGenre(g.value)}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                background: genre === g.value ? "#ffffff" : "rgba(255,255,255,0.02)",
                border: genre === g.value ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.08)",
                color: genre === g.value ? "#000000" : "rgba(255,255,255,0.4)",
                fontSize: 12,
                fontWeight: genre === g.value ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (genre !== g.value) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (genre !== g.value) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }
              }}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tone + Language row */}
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Tone */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: "block", color: "#e4e4e7", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            Tone
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TONES.map((t) => (
              <button
                key={t.value}
                id={`sa-tone-${t.value}`}
                onClick={() => setTone(t.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: tone === t.value ? "#ffffff" : "rgba(255,255,255,0.02)",
                  border: tone === t.value ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.08)",
                  color: tone === t.value ? "#000000" : "rgba(255,255,255,0.4)",
                  fontSize: 11,
                  fontWeight: tone === t.value ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (tone !== t.value) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (tone !== t.value) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  }
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div style={{ minWidth: 160 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#e4e4e7", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            <Globe size={13} style={{ color: "#a1a1aa" }} />
            Dialogue Language
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                id={`sa-lang-${l.value}`}
                onClick={() => setLanguage(l.value)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: language === l.value ? "#ffffff" : "rgba(255,255,255,0.02)",
                  border: language === l.value ? "1px solid #ffffff" : "1px solid rgba(255,255,255,0.08)",
                  color: language === l.value ? "#000000" : "rgba(255,255,255,0.4)",
                  fontSize: 11,
                  fontWeight: language === l.value ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (language !== l.value) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (language !== l.value) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  }
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "rgba(248,113,113,0.05)",
              border: "1px solid rgba(248,113,113,0.12)",
              color: "rgba(248,113,113,0.7)",
              fontSize: 13,
            }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate button */}
      <button
        id="sa-generate-btn"
        onClick={handleGenerate}
        disabled={isDisabled}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "14px 24px",
          borderRadius: 12,
          background: isDisabled ? "rgba(255,255,255,0.04)" : "#ffffff",
          border: isDisabled ? "1px solid rgba(255,255,255,0.08)" : "1px solid #ffffff",
          color: isDisabled ? "rgba(255,255,255,0.25)" : "#000000",
          fontSize: 14,
          fontWeight: 700,
          cursor: isDisabled ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          letterSpacing: "-0.01em",
          alignSelf: "stretch",
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.background = "#e4e4e7";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(255,255,255,0.12)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.boxShadow = "none";
          }
        }}
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            Writing your screenplay...
          </>
        ) : (
          <>
            <ArrowRight size={16} />
            Generate Screenplay
          </>
        )}
      </button>

      {isGenerating && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", marginTop: -12 }}
        >
          This takes 30–60 seconds. Please wait...
        </motion.p>
      )}
    </motion.div>
  );
}

function InlineResultContent({ result, handleReset }: { result: AssistResponse; handleReset: () => void }) {
  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25 }}
      style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      {/* Result toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffffff", boxShadow: "0 0 6px rgba(255,255,255,0.3)" }} />
          <span style={{ color: "#d4d4d8", fontSize: 12, fontWeight: 600 }}>
            Screenplay ready — {result.screenplay.split("\n").length} lines
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            id="sa-back-btn"
            onClick={handleReset}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
              borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              e.currentTarget.style.color = "rgba(255,255,255,0.5)";
            }}
          >
            <ChevronLeft size={13} />
            New Screenplay
          </button>
          <button
            id="sa-download-pdf"
            onClick={() => downloadAsPdf(result.title, result.logline, result.screenplay)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
              borderRadius: 8, background: "#ffffff", border: "1px solid #ffffff",
              color: "#000000", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e4e4e7";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Download size={13} />
            Download PDF
          </button>
        </div>
      </div>
      {/* Screenplay content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 40px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
        <ScreenplayViewer title={result.title} logline={result.logline} screenplay={result.screenplay} />
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Panel                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export function ScreenplayAssistPanel({ isOpen, onClose, inline = false }: ScreenplayAssistPanelProps) {
  const [storyIdea, setStoryIdea] = useState("");
  const [characters, setCharacters] = useState<CharacterEntry[]>([
    { id: "1", name: "", description: "" },
  ]);
  const [genre, setGenre] = useState("drama");
  const [tone, setTone] = useState("cinematic");
  const [language, setLanguage] = useState("english");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<AssistResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addCharacter = useCallback(() => {
    setCharacters((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", description: "" },
    ]);
  }, []);

  const removeCharacter = useCallback((id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateCharacter = useCallback(
    (id: string, field: "name" | "description", value: string) => {
      setCharacters((prev) =>
        prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
      );
    },
    []
  );

  const handleGenerate = useCallback(async () => {
    if (!storyIdea.trim() || storyIdea.trim().length < 20) {
      setError("Please describe your story idea in at least 20 characters.");
      return;
    }
    setError(null);
    setIsGenerating(true);
    setResult(null);

    try {
      const filledChars = characters.filter((c) => c.name.trim());
      const data = await api.post<AssistResponse>("/api/v1/screenplay/assist", {
        story_idea: storyIdea.trim(),
        characters: filledChars.map(({ name, description }) => ({ name, description })),
        genre,
        tone,
        language,
      });
      setResult(data);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [storyIdea, characters, genre, tone, language]);

  const handleReset = useCallback(() => {
    setResult(null);
    setShowForm(true);
    setError(null);
  }, []);

  const isDisabled = isGenerating || storyIdea.trim().length < 20;

  /* ── Inline mode: render directly as a panel card (no fixed overlay) ── */
  if (inline) {
    if (!isOpen) return null;
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pen size={18} style={{ color: "#ffffff" }} />
            </div>
            <div>
              <h2
                style={{
                  color: "#F9FAFB",
                  fontSize: 16,
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                Screenplay Assist
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 12,
                  margin: "2px 0 0",
                }}
              >
                Turn your story idea into a complete screenplay
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 8,
                background: "rgba(79,158,255,0.03)",
                border: "1px solid rgba(79,158,255,0.1)",
              }}
            >
              <Sparkles size={10} style={{ color: "#a1a1aa" }} />
              <span style={{ color: "#a1a1aa", fontSize: 10, fontWeight: 600 }}>AI Powered</span>
            </div>
            <button
              id="close-screenplay-assist-inline"
              onClick={onClose}
              style={{
                borderRadius: 10,
                padding: 8,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "#52525b",
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
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.color = "#52525b";
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body — shared form/result content */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          <AnimatePresence mode="wait">
            {showForm ? (
              <InlineFormContent
                key="inline-form"
                storyIdea={storyIdea}
                setStoryIdea={setStoryIdea}
                characters={characters}
                addCharacter={addCharacter}
                removeCharacter={removeCharacter}
                updateCharacter={updateCharacter}
                genre={genre}
                setGenre={setGenre}
                tone={tone}
                setTone={setTone}
                language={language}
                setLanguage={setLanguage}
                error={error}
                isDisabled={isDisabled}
                isGenerating={isGenerating}
                handleGenerate={handleGenerate}
                textareaRef={textareaRef}
              />
            ) : (
              result && (
                <InlineResultContent
                  key="inline-result"
                  result={result}
                  handleReset={handleReset}
                />
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  /* ── Modal mode (default) ── */
  return (
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
              zIndex: 60,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(12px)",
            }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            style={{
              position: "fixed",
              inset: "16px",
              zIndex: 70,
              display: "flex",
              flexDirection: "column",
              background: "#05070f",
              border: "1.5px solid rgba(79,158,255,0.45)",
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 0 0 1px rgba(79,158,255,0.06), 0 30px 80px rgba(0,0,0,0.85), 0 0 60px rgba(79,158,255,0.08)",
            }}
          >
            {/* ── Header ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderBottom: "1px solid rgba(79,158,255,0.08)",
                flexShrink: 0,
                background: "rgba(79,158,255,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "rgba(79,158,255,0.1)",
                    border: "1px solid rgba(79,158,255,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Pen size={18} style={{ color: "#4f9eff" }} />
                </div>
                <div>
                  <h2
                    style={{
                      color: "#c8d7ff",
                      fontSize: 16,
                      fontWeight: 700,
                      margin: 0,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Screenplay Assist
                  </h2>
                  <p
                    style={{
                      color: "rgba(160,180,255,0.4)",
                      fontSize: 12,
                      margin: "2px 0 0",
                    }}
                  >
                    Turn your story idea into a complete screenplay
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* AI badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "4px 10px",
                    borderRadius: 8,
                    background: "rgba(79,158,255,0.08)",
                    border: "1px solid rgba(79,158,255,0.2)",
                  }}
                >
                  <Sparkles size={10} style={{ color: "#4f9eff" }} />
                  <span style={{ color: "#4f9eff", fontSize: 10, fontWeight: 600 }}>
                    AI Powered
                  </span>
                </div>

                <button
                  id="close-screenplay-assist"
                  onClick={onClose}
                  style={{
                    borderRadius: 10,
                    padding: 8,
                    background: "rgba(79,158,255,0.06)",
                    border: "1px solid rgba(79,158,255,0.15)",
                    color: "rgba(79,158,255,0.5)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(79,158,255,0.14)";
                    e.currentTarget.style.color = "#4f9eff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(79,158,255,0.06)";
                    e.currentTarget.style.color = "rgba(79,158,255,0.5)";
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
              <AnimatePresence mode="wait">
                {/* ── Form view ── */}
                {showForm && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22 }}
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "28px 32px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 28,
                    }}
                  >
                    {/* Story Idea */}
                    <div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          color: "rgba(160,180,255,0.85)",
                          fontSize: 13,
                          fontWeight: 600,
                          marginBottom: 12,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        <Wand2 size={14} style={{ color: "#4f9eff" }} />
                        Your Story Idea
                        <span style={{ color: "rgba(79,158,255,0.4)", fontSize: 11, fontWeight: 400 }}>*</span>
                      </label>

                      {/* Example story chips */}
                      {!storyIdea && (
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "wrap",
                            marginBottom: 12,
                          }}
                        >
                          {EXAMPLE_IDEAS.map((ex) => (
                            <button
                              key={ex.label}
                              type="button"
                              onClick={() => setStoryIdea(ex.text)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "5px 12px",
                                borderRadius: 8,
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                color: "rgba(255,255,255,0.4)",
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                                e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                              }}
                            >
                              {ex.label}
                            </button>
                          ))}
                        </div>
                      )}

                      <textarea
                        ref={textareaRef}
                        id="sa-story-idea"
                        value={storyIdea}
                        onChange={(e) => setStoryIdea(e.target.value)}
                        rows={6}
                        placeholder={"Describe your story in detail — characters, key scenes, conflicts, and the emotional core...\n\nThe more detail you give, the better the screenplay."}
                        style={{
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 12,
                          color: "white",
                          fontSize: 13,
                          outline: "none",
                          fontFamily: "inherit",
                          transition: "border-color 0.15s",
                          width: "100%",
                          padding: "14px 16px",
                          resize: "vertical",
                          lineHeight: 1.6,
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                        }}
                      />
                      <p
                        style={{
                          color:
                            storyIdea.length < 20
                              ? "rgba(248,113,113,0.5)"
                              : "rgba(255,255,255,0.2)",
                          fontSize: 11,
                          marginTop: 6,
                          transition: "color 0.2s",
                        }}
                      >
                        {storyIdea.length} characters
                        {storyIdea.length < 20 ? " (minimum 20)" : ""}
                      </p>
                    </div>

                    {/* Characters */}
                    <div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          color: "#e4e4e7",
                          fontSize: 13,
                          fontWeight: 600,
                          marginBottom: 12,
                        }}
                      >
                        <User size={14} style={{ color: "#a1a1aa" }} />
                        Characters
                        <span style={{ color: "#52525b", fontWeight: 400, fontSize: 11 }}>
                          optional
                        </span>
                      </label>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {characters.map((char) => (
                          <div
                            key={char.id}
                            style={{ display: "flex", gap: 8, alignItems: "center" }}
                          >
                            <input
                              id={`sa-char-name-${char.id}`}
                              value={char.name}
                              onChange={(e) =>
                                updateCharacter(char.id, "name", e.target.value)
                              }
                              placeholder="Character name"
                              style={{
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 10,
                                color: "white",
                                fontSize: 13,
                                outline: "none",
                                fontFamily: "inherit",
                                transition: "border-color 0.15s",
                                padding: "9px 12px",
                                width: 160,
                                flexShrink: 0,
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                              }}
                            />
                            <input
                              id={`sa-char-desc-${char.id}`}
                              value={char.description}
                              onChange={(e) =>
                                updateCharacter(char.id, "description", e.target.value)
                              }
                              placeholder="Brief description (e.g. a stubborn detective, 40s)"
                              style={{
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 10,
                                color: "white",
                                fontSize: 13,
                                outline: "none",
                                fontFamily: "inherit",
                                transition: "border-color 0.15s",
                                padding: "9px 12px",
                                flex: 1,
                              }}
                              onFocus={(e) => {
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                              }}
                              onBlur={(e) => {
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                              }}
                            />
                            <button
                              onClick={() => removeCharacter(char.id)}
                              style={{
                                padding: 9,
                                borderRadius: 8,
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                color: "rgba(255,255,255,0.25)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                flexShrink: 0,
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = "#f87171";
                                e.currentTarget.style.borderColor = "rgba(248,113,113,0.2)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = "rgba(255,255,255,0.25)";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                        <button
                          id="sa-add-character"
                          onClick={addCharacter}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 14px",
                            borderRadius: 10,
                            background: "transparent",
                            border: "1px dashed rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.3)",
                            fontSize: 12,
                            cursor: "pointer",
                            width: "fit-content",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                            e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                            e.currentTarget.style.color = "rgba(255,255,255,0.3)";
                          }}
                        >
                          <Plus size={12} />
                          Add character
                        </button>
                      </div>
                    </div>

                    {/* Genre */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          color: "#e4e4e7",
                          fontSize: 13,
                          fontWeight: 600,
                          marginBottom: 12,
                        }}
                      >
                        Genre
                      </label>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {GENRES.map((g) => (
                          <button
                            key={g.value}
                            id={`sa-genre-${g.value}`}
                            onClick={() => setGenre(g.value)}
                            style={{
                              padding: "7px 14px",
                              borderRadius: 8,
                              background:
                                genre === g.value
                                  ? "#ffffff"
                                  : "rgba(255,255,255,0.02)",
                              border:
                                genre === g.value
                                  ? "1px solid #ffffff"
                                  : "1px solid rgba(255,255,255,0.08)",
                              color:
                                genre === g.value
                                  ? "#000000"
                                  : "rgba(255,255,255,0.4)",
                              fontSize: 12,
                              fontWeight: genre === g.value ? 700 : 500,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              if (genre !== g.value) {
                                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (genre !== g.value) {
                                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                              }
                            }}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tone + Language row */}
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                      {/* Tone */}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <label
                          style={{
                            display: "block",
                            color: "#e4e4e7",
                            fontSize: 13,
                            fontWeight: 600,
                            marginBottom: 12,
                          }}
                        >
                          Tone
                        </label>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {TONES.map((t) => (
                            <button
                              key={t.value}
                              id={`sa-tone-${t.value}`}
                              onClick={() => setTone(t.value)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                background:
                                  tone === t.value
                                    ? "#ffffff"
                                    : "rgba(255,255,255,0.02)",
                                border:
                                  tone === t.value
                                    ? "1px solid #ffffff"
                                    : "1px solid rgba(255,255,255,0.08)",
                                color:
                                  tone === t.value
                                    ? "#000000"
                                    : "rgba(255,255,255,0.4)",
                                fontSize: 11,
                                fontWeight: tone === t.value ? 700 : 500,
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                if (tone !== t.value) {
                                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (tone !== t.value) {
                                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                                }
                              }}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Language */}
                      <div style={{ minWidth: 160 }}>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: "#e4e4e7",
                            fontSize: 13,
                            fontWeight: 600,
                            marginBottom: 12,
                          }}
                        >
                          <Globe size={13} style={{ color: "#a1a1aa" }} />
                          Dialogue Language
                        </label>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {LANGUAGES.map((l) => (
                            <button
                              key={l.value}
                              id={`sa-lang-${l.value}`}
                              onClick={() => setLanguage(l.value)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                background:
                                  language === l.value
                                    ? "#ffffff"
                                    : "rgba(255,255,255,0.02)",
                                border:
                                  language === l.value
                                    ? "1px solid #ffffff"
                                    : "1px solid rgba(255,255,255,0.08)",
                                color:
                                  language === l.value
                                    ? "#000000"
                                    : "rgba(255,255,255,0.4)",
                                fontSize: 11,
                                fontWeight: language === l.value ? 700 : 500,
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) => {
                                if (language !== l.value) {
                                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (language !== l.value) {
                                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                                }
                              }}
                            >
                              {l.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          style={{
                            padding: "10px 14px",
                            borderRadius: 10,
                            background: "rgba(248,113,113,0.05)",
                            border: "1px solid rgba(248,113,113,0.12)",
                            color: "rgba(248,113,113,0.7)",
                            fontSize: 13,
                          }}
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Generate button */}
                    <button
                      id="sa-generate-btn"
                      onClick={handleGenerate}
                      disabled={isDisabled}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "14px 24px",
                        borderRadius: 12,
                        background: isDisabled ? "rgba(255,255,255,0.04)" : "#ffffff",
                        border: isDisabled
                          ? "1px solid rgba(255,255,255,0.08)"
                          : "1px solid #ffffff",
                        color: isDisabled ? "rgba(255,255,255,0.25)" : "#000000",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                        letterSpacing: "-0.01em",
                        alignSelf: "stretch",
                      }}
                      onMouseEnter={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.background = "#e4e4e7";
                          e.currentTarget.style.boxShadow = "0 0 30px rgba(255,255,255,0.12)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDisabled) {
                          e.currentTarget.style.background = "#ffffff";
                          e.currentTarget.style.boxShadow = "none";
                        }
                      }}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2
                            size={16}
                            style={{ animation: "spin 1s linear infinite" }}
                          />
                          Writing your screenplay...
                        </>
                      ) : (
                        <>
                          <ArrowRight size={16} />
                          Generate Screenplay
                        </>
                      )}
                    </button>

                    {isGenerating && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          color: "rgba(255,255,255,0.3)",
                          fontSize: 12,
                          textAlign: "center",
                          marginTop: -12,
                        }}
                      >
                        This takes 30-60 seconds. Please wait...
                      </motion.p>
                    )}
                  </motion.div>
                )}

                {/* ── Result view ── */}
                {!showForm && result && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    {/* Result toolbar */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 24px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        flexShrink: 0,
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#ffffff",
                            boxShadow: "0 0 6px rgba(255,255,255,0.3)",
                          }}
                        />
                        <span
                          style={{
                            color: "#d4d4d8",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          Screenplay ready — {result.screenplay.split("\n").length} lines
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          id="sa-back-btn"
                          onClick={handleReset}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "7px 14px",
                            borderRadius: 8,
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.5)",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                            e.currentTarget.style.color = "#ffffff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                            e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                          }}
                        >
                          <ChevronLeft size={13} />
                          New Screenplay
                        </button>

                        <button
                          id="sa-download-pdf"
                          onClick={() =>
                            downloadAsPdf(
                              result.title,
                              result.logline,
                              result.screenplay
                            )
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "7px 16px",
                            borderRadius: 8,
                            background: "#ffffff",
                            border: "1px solid #ffffff",
                            color: "#000000",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#e4e4e7";
                            e.currentTarget.style.boxShadow = "0 0 20px rgba(255,255,255,0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#ffffff";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <Download size={13} />
                          Download PDF
                        </button>
                      </div>
                    </div>

                    {/* Screenplay content */}
                    <div
                      style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "28px 40px",
                        maxWidth: 720,
                        margin: "0 auto",
                        width: "100%",
                      }}
                    >
                      <ScreenplayViewer
                        title={result.title}
                        logline={result.logline}
                        screenplay={result.screenplay}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
