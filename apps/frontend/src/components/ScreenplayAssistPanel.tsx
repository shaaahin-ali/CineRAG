"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download, Loader2, Plus, Trash2, Wand2, User, Globe,
  Sparkles, ChevronLeft, Save, Zap, Film, Users, Clapperboard, BarChart3, X
} from "lucide-react";
import { api } from "@/lib/api-client";

interface CharacterEntry { id: string; name: string; description: string; }
interface ScreenplayAssistPanelProps { isOpen: boolean; onClose: () => void; inline?: boolean; }
interface AssistResponse { title: string; logline: string; screenplay: string; }

const GENRES = [
  { value: "drama", label: "Drama" }, { value: "thriller", label: "Thriller" },
  { value: "romance", label: "Romance" }, { value: "action", label: "Action" },
  { value: "comedy", label: "Comedy" }, { value: "horror", label: "Horror" },
  { value: "mystery", label: "Mystery" }, { value: "biopic", label: "Biopic" },
];
const TONES = [
  { value: "cinematic", label: "Cinematic" }, { value: "dark", label: "Dark" },
  { value: "gritty", label: "Gritty" }, { value: "epic", label: "Epic" },
  { value: "intimate", label: "Intimate" },
];
const LANGUAGES = [
  { value: "english", label: "English" }, { value: "malayalam", label: "Malayalam" },
  { value: "hindi", label: "Hindi" }, { value: "tamil", label: "Tamil" },
];
const EXAMPLE_IDEAS = [
  { label: "Kerala detective noir", text: "A retired police detective in 1970s Kochi is pulled back into a cold case when a mysterious letter arrives at his door. The letter contains clues pointing to a powerful politician's dark secret. As he investigates, he discovers the case is linked to his own family's past. The detective must choose between exposing the truth and protecting the people he loves." },
  { label: "Two strangers on a train", text: "Two strangers meet on an overnight train from Mumbai to Kerala. A cynical software engineer and a free-spirited artist discover they are heading to the same small village for very different reasons. Their lives become entangled in unexpected ways over 18 hours of conversation and shared silences." },
  { label: "Musician's comeback", text: "A once-celebrated Carnatic vocalist who lost her voice in a tragic accident five years ago now teaches music in a small town. When a documentary filmmaker discovers her story, he convinces her to attempt a comeback at the annual temple festival. But to sing again, she must confront the painful memories of the night she lost everything." },
];
const NEURAL_QUOTES = [
  "Our system is currently calibrated for Neo-Noir and Neo-Realism styles. Ready to process multi-character dynamics.",
  "Neo-classical structure mode active. Character arc analysis enabled for dramatic depth.",
  "Dialogue engine primed for authentic regional voice patterns and emotional resonance.",
];

function downloadAsPdf(title: string, logline: string, screenplay: string) {
  const safe = screenplay.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:'Courier New',monospace;font-size:12pt;max-width:640px;margin:0 auto;padding:20px;}.cover{text-align:center;margin-bottom:60px;padding-top:80px;}.screenplay{white-space:pre-wrap;}</style></head><body><div class="cover"><h1>${title}</h1><p>Written with CineACUMEN Screenplay Assist</p>${logline ? `<p><em>${logline}</em></p>` : ""}</div><div class="screenplay">${safe}</div><script>window.onload=function(){window.print();}<\/script></body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) { win.onafterprint = () => URL.revokeObjectURL(url); }
  else {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([`${title}\n\n${logline}\n\n${screenplay}`], { type: "text/plain" }));
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.txt`;
    a.click();
  }
}

function PillGroup({ options, value, onChange, idPrefix }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  idPrefix: string;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map(o => (
        <button key={o.value} id={`${idPrefix}-${o.value}`} onClick={() => onChange(o.value)}
          style={{ padding: "5px 13px", borderRadius: 6, background: value === o.value ? "#ffffff" : "rgba(255,255,255,0.04)", border: `1px solid ${value === o.value ? "#ffffff" : "rgba(255,255,255,0.10)"}`, color: value === o.value ? "#000000" : "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: value === o.value ? 700 : 500, cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={e => { if (value !== o.value) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; } }}
          onMouseLeave={e => { if (value !== o.value) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; } }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SectionCard({ icon, title, badge, children }: { icon: React.ReactNode; title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.5)" }}>{icon}</span>
          <span style={{ color: "#ffffff", fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</span>
        </div>
        {badge && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function ScreenplayViewer({ title, logline, screenplay, onBack, onDownload }: AssistResponse & { onBack: () => void; onDownload: () => void }) {
  const lines = screenplay.split("\n");
  const renderLine = (line: string, i: number) => {
    const t = line.trim();
    if (/^(INT\.|EXT\.|INT\/EXT\.)/i.test(t)) return <div key={i} style={{ fontWeight: 800, color: "#fff", letterSpacing: "0.04em", marginTop: 20, marginBottom: 4, fontSize: 12, textTransform: "uppercase" }}>{line}</div>;
    if (t.length > 0 && t === t.toUpperCase() && /^[A-Z][A-Z\s]{1,30}$/.test(t) && !t.startsWith("INT") && !t.startsWith("EXT") && !t.includes("===")) return <div key={i} style={{ color: "#d4d4d8", fontWeight: 700, textAlign: "center", marginTop: 14, fontSize: 12, letterSpacing: "0.06em" }}>{line}</div>;
    if (t.includes("===") || t.startsWith("---")) return <div key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "20px 0" }} />;
    if (t.startsWith("(") && t.endsWith(")")) return <div key={i} style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontStyle: "italic", textAlign: "center", marginBottom: 2 }}>{line}</div>;
    if (/^(FADE|CUT TO|SMASH CUT|DISSOLVE)/i.test(t)) return <div key={i} style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textAlign: "right", marginTop: 10, fontStyle: "italic" }}>{line}</div>;
    if (!t) return <div key={i} style={{ height: 8 }} />;
    return <div key={i} style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.65, marginBottom: 2 }}>{line}</div>;
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#000" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
          <ChevronLeft size={16} /> Back to editor
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button id="sa-save-draft-viewer" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Save size={13} /> Save Draft
          </button>
          <button id="sa-download-pdf" onClick={onDownload} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "#ffffff", border: "none", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <Download size={13} /> Download PDF
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "40px 60px", fontFamily: "Courier New, monospace" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40, paddingBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 style={{ color: "#F9FAFB", fontSize: 22, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 12px" }}>{title}</h2>
            {logline && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontStyle: "italic", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>{logline}</p>}
          </div>
          <div>{lines.map(renderLine)}</div>
        </div>
      </div>
    </div>
  );
}

export function ScreenplayAssistPanel({ isOpen, onClose, inline = false }: ScreenplayAssistPanelProps) {
  const [storyIdea, setStoryIdea] = useState("");
  const [characters, setCharacters] = useState<CharacterEntry[]>([{ id: crypto.randomUUID(), name: "", description: "" }]);
  const [genre, setGenre] = useState("drama");
  const [tone, setTone] = useState("cinematic");
  const [language, setLanguage] = useState("english");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssistResponse | null>(null);
  const [quoteIdx] = useState(() => Math.floor(Math.random() * NEURAL_QUOTES.length));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addCharacter = useCallback(() => setCharacters(p => [...p, { id: crypto.randomUUID(), name: "", description: "" }]), []);
  const removeCharacter = useCallback((id: string) => setCharacters(p => p.filter(c => c.id !== id)), []);
  const updateCharacter = useCallback((id: string, field: "name" | "description", value: string) => setCharacters(p => p.map(c => c.id === id ? { ...c, [field]: value } : c)), []);

  const handleGenerate = useCallback(async () => {
    if (storyIdea.trim().length < 20) { setError("Please describe your story idea in at least 20 characters."); return; }
    setError(null);
    setIsGenerating(true);
    try {
      const data = await api.post<AssistResponse>("/api/v1/screenplay/assist", { story_idea: storyIdea, characters: characters.filter(c => c.name.trim()), genre, tone, language });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [storyIdea, characters, genre, tone, language]);

  const handleSaveDraft = () => {
    if (!storyIdea) return;
    localStorage.setItem("sa-draft", JSON.stringify({ storyIdea, characters, genre, tone, language }));
  };

  const isDisabled = isGenerating || storyIdea.trim().length < 20;

  // When inline, render directly without overlay wrapper
  if (inline) {
    return (
      <PanelBody
        storyIdea={storyIdea} setStoryIdea={setStoryIdea}
        characters={characters} addCharacter={addCharacter}
        removeCharacter={removeCharacter} updateCharacter={updateCharacter}
        genre={genre} setGenre={setGenre}
        tone={tone} setTone={setTone}
        language={language} setLanguage={setLanguage}
        error={error} isDisabled={isDisabled} isGenerating={isGenerating}
        handleGenerate={handleGenerate} handleSaveDraft={handleSaveDraft}
        onClose={onClose} quoteIdx={quoteIdx} result={result}
        setResult={setResult} downloadAsPdf={downloadAsPdf}
        textareaRef={textareaRef}
      />
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="sa-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: "92vw", maxWidth: 1100, height: "88vh", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 40px 120px rgba(0,0,0,0.8)" }}
          >
            <PanelBody
              storyIdea={storyIdea} setStoryIdea={setStoryIdea}
              characters={characters} addCharacter={addCharacter}
              removeCharacter={removeCharacter} updateCharacter={updateCharacter}
              genre={genre} setGenre={setGenre}
              tone={tone} setTone={setTone}
              language={language} setLanguage={setLanguage}
              error={error} isDisabled={isDisabled} isGenerating={isGenerating}
              handleGenerate={handleGenerate} handleSaveDraft={handleSaveDraft}
              onClose={onClose} quoteIdx={quoteIdx} result={result}
              setResult={setResult} downloadAsPdf={downloadAsPdf}
              textareaRef={textareaRef}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Panel Body (shared between inline and modal modes) ── */
function PanelBody({
  storyIdea, setStoryIdea, characters, addCharacter, removeCharacter,
  updateCharacter, genre, setGenre, tone, setTone, language, setLanguage,
  error, isDisabled, isGenerating, handleGenerate, handleSaveDraft,
  onClose, quoteIdx, result, setResult, downloadAsPdf: downloadFn, textareaRef,
}: {
  storyIdea: string; setStoryIdea: (v:string)=>void;
  characters: CharacterEntry[]; addCharacter:()=>void;
  removeCharacter:(id:string)=>void;
  updateCharacter:(id:string,field:"name"|"description",value:string)=>void;
  genre:string; setGenre:(v:string)=>void;
  tone:string; setTone:(v:string)=>void;
  language:string; setLanguage:(v:string)=>void;
  error:string|null; isDisabled:boolean; isGenerating:boolean;
  handleGenerate:()=>void; handleSaveDraft:()=>void;
  onClose:()=>void; quoteIdx:number;
  result: AssistResponse|null; setResult:(v:AssistResponse|null)=>void;
  downloadAsPdf:(t:string,l:string,s:string)=>void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}) {
  if (result) {
    return (
      <ScreenplayViewer {...result} onBack={() => setResult(null)} onDownload={() => downloadFn(result.title, result.logline, result.screenplay)} />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", background: "#050505", color: "#fff", fontFamily: "var(--font-inter), Inter, sans-serif", overflow: "hidden", position: "relative" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", margin: 0 }}>Screenplay Assist</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "3px 0 0", lineHeight: 1.4 }}>
            Synthesize your creative spark into a structured screenplay. Our neural core understands character arcs and thematic resonance.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button id="sa-save-draft" onClick={handleSaveDraft}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}>
            <Save size={13} /> Save Draft
          </button>
          <button id="sa-generate-btn" onClick={handleGenerate} disabled={isDisabled}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 22px", borderRadius: 8, background: isDisabled ? "rgba(255,255,255,0.07)" : "#fff", border: "none", color: isDisabled ? "rgba(255,255,255,0.25)" : "#000", fontSize: 12, fontWeight: 700, cursor: isDisabled ? "not-allowed" : "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { if (!isDisabled) { e.currentTarget.style.background = "#e4e4e7"; e.currentTarget.style.boxShadow = "0 0 24px rgba(255,255,255,0.15)"; } }}
            onMouseLeave={e => { if (!isDisabled) { e.currentTarget.style.background = "#fff"; e.currentTarget.style.boxShadow = "none"; } }}>
            {isGenerating
              ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Writing...</>
              : <><Sparkles size={13} /> Generate Script</>}
          </button>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
          <button onClick={onClose}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "50%", background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left: Form */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Story Idea */}
          <SectionCard icon={<Wand2 size={14} />} title="Your Story Idea" badge={`${storyIdea.length} characters (min 20)`}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {EXAMPLE_IDEAS.map(ex => (
                <button key={ex.label} onClick={() => setStoryIdea(ex.text)}
                  style={{ padding: "4px 11px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.45)", fontSize: 11, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}>
                  {ex.label}
                </button>
              ))}
            </div>
            <textarea ref={textareaRef} id="sa-story-idea" value={storyIdea} onChange={e => setStoryIdea(e.target.value)} rows={7}
              placeholder={"Describe your story in detail \u2014 characters, key scenes, conflicts, and the emotional core...\n\nThe more detail you give, the better the screenplay."}
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, color: "rgba(255,255,255,0.85)", fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%", padding: "14px 16px", resize: "vertical", lineHeight: 1.65, transition: "border-color 0.15s" }}
              onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
              onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }} />
          </SectionCard>

          {/* Cast */}
          <SectionCard icon={<Users size={14} />} title="Cast &amp; Characters" badge="optional">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {characters.map(char => (
                <div key={char.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input id={`sa-char-name-${char.id}`} value={char.name} onChange={e => updateCharacter(char.id, "name", e.target.value)} placeholder="Character Name"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "white", fontSize: 12, outline: "none", fontFamily: "inherit", padding: "9px 12px", width: 160, flexShrink: 0, transition: "border-color 0.15s" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }} />
                  <input id={`sa-char-desc-${char.id}`} value={char.description} onChange={e => updateCharacter(char.id, "description", e.target.value)} placeholder="Brief description (e.g. a stubborn detective, 40s)"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "white", fontSize: 12, outline: "none", fontFamily: "inherit", padding: "9px 12px", flex: 1, transition: "border-color 0.15s" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }} />
                  <button onClick={() => removeCharacter(char.id)}
                    style={{ padding: 8, borderRadius: 7, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0, transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.25)"; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.25)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button id="sa-add-character" onClick={addCharacter}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "transparent", border: "1px dashed rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", width: "fit-content", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}>
                <Plus size={12} /> Add Character
              </button>
            </div>
          </SectionCard>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.15)", color: "rgba(248,113,113,0.8)", fontSize: 12 }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Sidebar */}
        <div style={{ width: 240, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.07)", overflowY: "auto", padding: "24px 18px", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Genre */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>GENRE</span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>Select one</span>
            </div>
            <PillGroup options={GENRES} value={genre} onChange={setGenre} idPrefix="sa-genre" />
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          {/* Tone */}
          <div>
            <div style={{ marginBottom: 12 }}><span style={{ color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>TONE</span></div>
            <PillGroup options={TONES} value={tone} onChange={setTone} idPrefix="sa-tone" />
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          {/* Language */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Globe size={11} style={{ color: "rgba(255,255,255,0.4)" }} />
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>LANGUAGE</span>
            </div>
            <PillGroup options={LANGUAGES} value={language} onChange={setLanguage} idPrefix="sa-lang" />
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          {/* Neural Engine */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Zap size={12} style={{ color: "#a1a1aa" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.04em" }}>Neural Engine Status</span>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: "0 0 12px", fontStyle: "italic" }}>
              &ldquo;{NEURAL_QUOTES[quoteIdx]}&rdquo;
            </p>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Creative Accuracy</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>85%</span>
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: "85%", background: "linear-gradient(to right, #ffffff, #a1a1aa)", borderRadius: 4 }} />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { icon: <Film size={12} />, label: "Scripts Generated", value: "2.4K+" },
              { icon: <User size={12} />, label: "Avg. Characters", value: "4.2" },
              { icon: <BarChart3 size={12} />, label: "Avg. Scenes", value: "12" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{s.icon} {s.label}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generating overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, zIndex: 50 }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 56, height: 56, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <Clapperboard size={22} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "rgba(255,255,255,0.7)" }} />
            </div>
            <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 }}>Writing your screenplay...</p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: 0 }}>This takes 30 to 60 seconds. Please wait.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
