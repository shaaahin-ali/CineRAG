"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Download,
  Loader2,
  Plus,
  Trash2,
  Film,
  ChevronDown,
  FileText,
  Wand2,
  User,
  BookOpen,
  Globe,
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
  { value: "drama", label: "Drama", emoji: "🎭" },
  { value: "thriller", label: "Thriller", emoji: "🔪" },
  { value: "romance", label: "Romance", emoji: "💕" },
  { value: "action", label: "Action", emoji: "💥" },
  { value: "comedy", label: "Comedy", emoji: "😄" },
  { value: "horror", label: "Horror", emoji: "👻" },
  { value: "mystery", label: "Mystery", emoji: "🔍" },
  { value: "biopic", label: "Biopic", emoji: "🎖️" },
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
    emoji: "🕵️",
    label: "Kerala detective noir",
    text: "A retired police detective in 1970s Kochi is pulled back into a cold case when a mysterious letter arrives at his door. The letter contains clues pointing to a powerful politician's dark secret. As he investigates, he discovers the case is linked to his own family's past. The detective must choose between exposing the truth and protecting the people he loves.",
  },
  {
    emoji: "🚂",
    label: "Two strangers on a train",
    text: "Two strangers — a cynical software engineer returning from a failed marriage and a free-spirited artist running from her conservative family — meet on an overnight train from Mumbai to Kerala. Over 18 hours of conversation, chai, and shared silences, they discover they are heading to the same small village for very different reasons. Their lives become entangled in unexpected ways.",
  },
  {
    emoji: "🎵",
    label: "Musician's comeback",
    text: "A once-celebrated Carnatic vocalist who lost her voice in a tragic accident five years ago now teaches music in a small town. When a documentary filmmaker discovers her story, he convinces her to attempt a comeback performance at the annual temple festival. But to sing again, she must confront the painful memories of the night she lost everything — and forgive the person responsible.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────── */
/*  PDF Download Helper                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

function downloadAsPdf(title: string, logline: string, screenplay: string) {
  // Create a print-optimised HTML page in a hidden iframe
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
            color: "#60A5FA",
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
            color: "#FDB022",
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
            borderTop: "1px solid rgba(255,255,255,0.08)",
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
            color: "rgba(255,255,255,0.45)",
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
            color: "rgba(167,139,250,0.7)",
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
          color: "rgba(255,255,255,0.82)",
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
          borderBottom: "1px solid rgba(255,255,255,0.08)",
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
              color: "rgba(253,176,34,0.8)",
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
/*  Main Panel                                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

export function ScreenplayAssistPanel({ isOpen, onClose }: ScreenplayAssistPanelProps) {
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

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "white",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  };

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .sa-input:focus { border-color: rgba(167,139,250,0.5) !important; }
        .sa-select:focus { border-color: rgba(167,139,250,0.5) !important; }
        .sa-genre-btn:hover { background: rgba(167,139,250,0.15) !important; border-color: rgba(167,139,250,0.4) !important; }
        .sa-tone-btn:hover { background: rgba(96,165,250,0.12) !important; border-color: rgba(96,165,250,0.35) !important; }
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
                zIndex: 60,
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(8px)",
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
                background: "rgba(5,7,18,0.99)",
                border: "1px solid rgba(167,139,250,0.15)",
                borderRadius: 22,
                overflow: "hidden",
                boxShadow:
                  "0 30px 60px rgba(0,0,0,0.6), 0 0 100px rgba(167,139,250,0.04)",
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
                  background:
                    "linear-gradient(90deg, rgba(167,139,250,0.06), rgba(96,165,250,0.03))",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background:
                        "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.06))",
                      border: "1px solid rgba(167,139,250,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 20px rgba(167,139,250,0.12)",
                    }}
                  >
                    <BookOpen size={20} style={{ color: "#A78BFA" }} />
                  </div>
                  <div>
                    <h2
                      style={{
                        color: "#F9FAFB",
                        fontSize: 17,
                        fontWeight: 700,
                        margin: 0,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Screenplay Assist
                    </h2>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.35)",
                        fontSize: 12,
                        margin: "3px 0 0",
                      }}
                    >
                      Turn your story idea into a complete screenplay
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* AI badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: "rgba(167,139,250,0.08)",
                      border: "1px solid rgba(167,139,250,0.2)",
                    }}
                  >
                    <Sparkles size={10} style={{ color: "#A78BFA" }} />
                    <span style={{ color: "#A78BFA", fontSize: 10, fontWeight: 700 }}>
                      Claude · Groq · Gemini
                    </span>
                  </div>

                  <button
                    id="close-screenplay-assist"
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
                        padding: "24px 28px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 24,
                      }}
                    >
                      {/* Story Idea */}
                      <div>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            color: "#E0E7FF",
                            fontSize: 13,
                            fontWeight: 700,
                            marginBottom: 10,
                          }}
                        >
                          <Wand2 size={14} style={{ color: "#A78BFA" }} />
                          Your Story Idea *
                        </label>

                        {/* Example story chips */}
                        {!storyIdea && (
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              flexWrap: "wrap",
                              marginBottom: 10,
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
                                  padding: "4px 10px",
                                  borderRadius: 8,
                                  background: "rgba(167,139,250,0.06)",
                                  border: "1px solid rgba(167,139,250,0.15)",
                                  color: "rgba(167,139,250,0.7)",
                                  fontSize: 10,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  transition: "all 0.12s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "rgba(167,139,250,0.12)";
                                  e.currentTarget.style.borderColor = "rgba(167,139,250,0.35)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "rgba(167,139,250,0.06)";
                                  e.currentTarget.style.borderColor = "rgba(167,139,250,0.15)";
                                }}
                              >
                                <span>{ex.emoji}</span>
                                {ex.label}
                              </button>
                            ))}
                          </div>
                        )}

                        <textarea
                          ref={textareaRef}
                          id="sa-story-idea"
                          className="sa-input"
                          value={storyIdea}
                          onChange={(e) => setStoryIdea(e.target.value)}
                          rows={6}
                          placeholder={"Example: A retired detective in 1970s Kochi receives a mysterious letter that pulls him back into a cold case connected to a powerful politician...\n\nTip: The more detail you give, the better the screenplay. Include character names, key scenes, conflicts, and the emotional core of your story."}
                          style={{
                            ...inputStyle,
                            width: "100%",
                            padding: "14px 16px",
                            resize: "vertical",
                            lineHeight: 1.6,
                          }}
                        />
                        <p
                          style={{
                            color:
                              storyIdea.length < 20
                                ? "rgba(248,113,113,0.6)"
                                : "rgba(255,255,255,0.25)",
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
                            gap: 7,
                            color: "#E0E7FF",
                            fontSize: 13,
                            fontWeight: 700,
                            marginBottom: 10,
                          }}
                        >
                          <User size={14} style={{ color: "#60A5FA" }} />
                          Characters{" "}
                          <span
                            style={{
                              color: "rgba(255,255,255,0.3)",
                              fontWeight: 400,
                            }}
                          >
                            (optional)
                          </span>
                        </label>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          {characters.map((char) => (
                            <div
                              key={char.id}
                              style={{ display: "flex", gap: 8, alignItems: "center" }}
                            >
                              <input
                                id={`sa-char-name-${char.id}`}
                                className="sa-input"
                                value={char.name}
                                onChange={(e) =>
                                  updateCharacter(char.id, "name", e.target.value)
                                }
                                placeholder="Character name"
                                style={{
                                  ...inputStyle,
                                  padding: "9px 12px",
                                  width: 160,
                                  flexShrink: 0,
                                }}
                              />
                              <input
                                id={`sa-char-desc-${char.id}`}
                                className="sa-input"
                                value={char.description}
                                onChange={(e) =>
                                  updateCharacter(char.id, "description", e.target.value)
                                }
                                placeholder="Brief description (e.g. a stubborn detective, 40s)"
                                style={{
                                  ...inputStyle,
                                  padding: "9px 12px",
                                  flex: 1,
                                }}
                              />
                              <button
                                onClick={() => removeCharacter(char.id)}
                                style={{
                                  padding: "9px",
                                  borderRadius: 8,
                                  background: "rgba(248,113,113,0.07)",
                                  border: "1px solid rgba(248,113,113,0.15)",
                                  color: "rgba(248,113,113,0.6)",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  flexShrink: 0,
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
                              borderRadius: 9,
                              background: "rgba(255,255,255,0.03)",
                              border: "1px dashed rgba(255,255,255,0.12)",
                              color: "rgba(255,255,255,0.4)",
                              fontSize: 12,
                              cursor: "pointer",
                              width: "fit-content",
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
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            color: "#E0E7FF",
                            fontSize: 13,
                            fontWeight: 700,
                            marginBottom: 10,
                          }}
                        >
                          <Film size={14} style={{ color: "#FDB022" }} />
                          Genre
                        </label>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {GENRES.map((g) => (
                            <button
                              key={g.value}
                              id={`sa-genre-${g.value}`}
                              className="sa-genre-btn"
                              onClick={() => setGenre(g.value)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "7px 12px",
                                borderRadius: 9,
                                background:
                                  genre === g.value
                                    ? "rgba(167,139,250,0.18)"
                                    : "rgba(255,255,255,0.04)",
                                border:
                                  genre === g.value
                                    ? "1px solid rgba(167,139,250,0.45)"
                                    : "1px solid rgba(255,255,255,0.08)",
                                color:
                                  genre === g.value
                                    ? "#A78BFA"
                                    : "rgba(255,255,255,0.5)",
                                fontSize: 12,
                                fontWeight: genre === g.value ? 700 : 500,
                                cursor: "pointer",
                                transition: "all 0.14s",
                              }}
                            >
                              <span>{g.emoji}</span>
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tone + Language row */}
                      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                        {/* Tone */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <label
                            style={{
                              display: "block",
                              color: "#E0E7FF",
                              fontSize: 13,
                              fontWeight: 700,
                              marginBottom: 10,
                            }}
                          >
                            Tone
                          </label>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {TONES.map((t) => (
                              <button
                                key={t.value}
                                id={`sa-tone-${t.value}`}
                                className="sa-tone-btn"
                                onClick={() => setTone(t.value)}
                                style={{
                                  padding: "6px 11px",
                                  borderRadius: 8,
                                  background:
                                    tone === t.value
                                      ? "rgba(96,165,250,0.15)"
                                      : "rgba(255,255,255,0.03)",
                                  border:
                                    tone === t.value
                                      ? "1px solid rgba(96,165,250,0.4)"
                                      : "1px solid rgba(255,255,255,0.08)",
                                  color:
                                    tone === t.value
                                      ? "#60A5FA"
                                      : "rgba(255,255,255,0.45)",
                                  fontSize: 11,
                                  fontWeight: tone === t.value ? 700 : 500,
                                  cursor: "pointer",
                                  transition: "all 0.14s",
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
                              color: "#E0E7FF",
                              fontSize: 13,
                              fontWeight: 700,
                              marginBottom: 10,
                            }}
                          >
                            <Globe size={13} style={{ color: "#34D399" }} />
                            Dialogue Language
                          </label>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {LANGUAGES.map((l) => (
                              <button
                                key={l.value}
                                id={`sa-lang-${l.value}`}
                                onClick={() => setLanguage(l.value)}
                                style={{
                                  padding: "6px 11px",
                                  borderRadius: 8,
                                  background:
                                    language === l.value
                                      ? "rgba(52,211,153,0.14)"
                                      : "rgba(255,255,255,0.03)",
                                  border:
                                    language === l.value
                                      ? "1px solid rgba(52,211,153,0.4)"
                                      : "1px solid rgba(255,255,255,0.08)",
                                  color:
                                    language === l.value
                                      ? "#34D399"
                                      : "rgba(255,255,255,0.45)",
                                  fontSize: 11,
                                  fontWeight: language === l.value ? 700 : 500,
                                  cursor: "pointer",
                                  transition: "all 0.14s",
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
                              background: "rgba(248,113,113,0.07)",
                              border: "1px solid rgba(248,113,113,0.2)",
                              color: "#F87171",
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
                        disabled={isGenerating || storyIdea.trim().length < 20}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "14px 24px",
                          borderRadius: 14,
                          background:
                            isGenerating || storyIdea.trim().length < 20
                              ? "rgba(167,139,250,0.08)"
                              : "linear-gradient(135deg, rgba(167,139,250,0.22), rgba(96,165,250,0.15))",
                          border:
                            isGenerating || storyIdea.trim().length < 20
                              ? "1px solid rgba(167,139,250,0.15)"
                              : "1px solid rgba(167,139,250,0.4)",
                          color:
                            isGenerating || storyIdea.trim().length < 20
                              ? "rgba(167,139,250,0.4)"
                              : "#A78BFA",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor:
                            isGenerating || storyIdea.trim().length < 20
                              ? "not-allowed"
                              : "pointer",
                          transition: "all 0.18s",
                          letterSpacing: "0.01em",
                          alignSelf: "stretch",
                        }}
                        onMouseEnter={(e) => {
                          if (!isGenerating && storyIdea.trim().length >= 20) {
                            e.currentTarget.style.background =
                              "linear-gradient(135deg, rgba(167,139,250,0.32), rgba(96,165,250,0.22))";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isGenerating && storyIdea.trim().length >= 20) {
                            e.currentTarget.style.background =
                              "linear-gradient(135deg, rgba(167,139,250,0.22), rgba(96,165,250,0.15))";
                          }
                        }}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2
                              size={16}
                              style={{ animation: "spin 1s linear infinite" }}
                            />
                            Writing your screenplay…
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            Generate Screenplay
                          </>
                        )}
                      </button>

                      {isGenerating && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          style={{
                            color: "rgba(167,139,250,0.55)",
                            fontSize: 12,
                            textAlign: "center",
                            marginTop: -12,
                          }}
                        >
                          This takes 30–60 seconds — the AI is writing a full screenplay.
                          Please wait…
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
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#34D399",
                              boxShadow: "0 0 8px rgba(52,211,153,0.5)",
                            }}
                          />
                          <span
                            style={{
                              color: "#34D399",
                              fontSize: 12,
                              fontWeight: 700,
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
                              borderRadius: 9,
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "rgba(255,255,255,0.5)",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            <FileText size={13} />
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
                              borderRadius: 9,
                              background:
                                "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.12))",
                              border: "1px solid rgba(167,139,250,0.4)",
                              color: "#A78BFA",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "linear-gradient(135deg, rgba(167,139,250,0.3), rgba(96,165,250,0.2))";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(96,165,250,0.12))";
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
    </>
  );
}
