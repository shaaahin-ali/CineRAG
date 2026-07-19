"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, Film, ChevronRight, Sparkles, MessageSquare, X } from "lucide-react";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   INTERACTIVE CHAT PREVIEW â€” simulates a live AI query session
   â€¢ Cycles through different queries automatically
   â€¢ Shows typing animation and streaming results
   â€¢ Cards react to hover with expand / glow
   â€¢ Search bar has a blinking cursor that types out queries
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const QUERIES = [
  {
    text: "Find the scene where they discuss dream physics",
    results: [
      { id: 1, scene: "Scene 42 â€” Laboratory", snippet: "Inception â€” Dom Cobb", timestamp: "01:14:23", color: "var(--accent-blue)", confidence: 97 },
      { id: 2, scene: "Scene 18 â€” Rooftop Limbo", snippet: "Inception â€” Mal & Cobb", timestamp: "00:38:07", color: "var(--accent-cyan)", confidence: 94 },
      { id: 3, scene: "Scene 71 â€” Dream Level 3", snippet: "Inception â€” Arthur", timestamp: "02:04:51", color: "var(--accent-purple)", confidence: 89 },
    ],
  },
  {
    text: "Show emotional confrontation scenes with rain",
    results: [
      { id: 4, scene: "Scene 89 â€” Rainy Street", snippet: "Blade Runner â€” Roy Batty", timestamp: "01:47:12", color: "var(--accent-cyan)", confidence: 98 },
      { id: 5, scene: "Scene 55 â€” Prison Escape", snippet: "Shawshank â€” Andy Dufresne", timestamp: "01:52:30", color: "var(--accent-blue)", confidence: 96 },
      { id: 6, scene: "Scene 31 â€” Fountain", snippet: "Oldboy â€” Oh Dae-su", timestamp: "01:08:44", color: "var(--accent-purple)", confidence: 91 },
    ],
  },
  {
    text: "Find monologues about time and mortality",
    results: [
      { id: 7, scene: "Scene 92 â€” Rooftop", snippet: "Blade Runner â€” Tears in Rain", timestamp: "01:49:01", color: "var(--accent-purple)", confidence: 99 },
      { id: 8, scene: "Scene 47 â€” Tesseract", snippet: "Interstellar â€” Cooper", timestamp: "02:21:15", color: "var(--accent-blue)", confidence: 95 },
      { id: 9, scene: "Scene 12 â€” Park Bench", snippet: "Ikiru â€” Watanabe", timestamp: "00:35:22", color: "var(--accent-cyan)", confidence: 93 },
    ],
  },
];

function TypingQuery({ text, onComplete }: { text: string; onComplete: () => void }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let idx = 0;
    const timer = setInterval(() => {
      idx++;
      if (idx <= text.length) {
        setDisplayed(text.slice(0, idx));
      } else {
        clearInterval(timer);
        setTimeout(onComplete, 300);
      }
    }, 35 + Math.random() * 20);
    return () => clearInterval(timer);
  }, [text, onComplete]);

  return (
    <span className="text-sm" style={{ color: "var(--text-primary)" }}>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-[2px] h-[14px] ml-0.5"
        style={{ background: "var(--accent-blue)", verticalAlign: "text-bottom" }}
      />
    </span>
  );
}

function ConfidenceBar({ confidence, color }: { confidence: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-deep)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-[9px] font-mono font-bold" style={{ color }}>{confidence}%</span>
    </div>
  );
}

export function HeroChatPreview() {
  const [queryIdx, setQueryIdx] = useState(0);
  const [phase, setPhase] = useState<"typing" | "loading" | "results">("typing");
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const cycleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuery = QUERIES[queryIdx];

  // Auto-cycle queries
  useEffect(() => {
    if (phase === "results") {
      cycleTimer.current = setTimeout(() => {
        setPhase("typing");
        setQueryIdx((p) => (p + 1) % QUERIES.length);
        setExpandedCard(null);
      }, 5000);
    }
    return () => { if (cycleTimer.current) clearTimeout(cycleTimer.current); };
  }, [phase]);

  const handleTypingComplete = () => {
    setPhase("loading");
    setTimeout(() => setPhase("results"), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full max-w-md mx-auto lg:mx-0"
      style={{ animation: "float 5s ease-in-out infinite" }}
    >
      {/* Outer glow â€” animated */}
      <motion.div
        animate={{
          boxShadow: [
            "0 0 60px rgba(43,92,230,0.08)",
            "0 0 100px rgba(43,92,230,0.15)",
            "0 0 60px rgba(43,92,230,0.08)",
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -inset-4 rounded-3xl pointer-events-none"
      />

      {/* Card */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(43,92,230,0.08)",
        }}
      >
        {/* Header bar with traffic lights */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex gap-1.5">
            <motion.span whileHover={{ scale: 1.3 }} className="w-2.5 h-2.5 rounded-full cursor-pointer" style={{ background: "#F87171" }} />
            <motion.span whileHover={{ scale: 1.3 }} className="w-2.5 h-2.5 rounded-full cursor-pointer" style={{ background: "#FBBF24" }} />
            <motion.span whileHover={{ scale: 1.3 }} className="w-2.5 h-2.5 rounded-full cursor-pointer" style={{ background: "#34D399" }} />
          </div>
          <span className="ml-2 text-xs font-mono flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--accent-green)" }}
            />
            cineacumen â€” live query
          </span>
          {/* Query index dots */}
          <div className="ml-auto flex gap-1">
            {QUERIES.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer"
                style={{
                  background: i === queryIdx ? "var(--accent-blue)" : "var(--border-subtle)",
                  transform: i === queryIdx ? "scale(1.3)" : "scale(1)",
                }}
                onClick={() => {
                  setQueryIdx(i);
                  setPhase("typing");
                  setExpandedCard(null);
                }}
              />
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pt-4 pb-3">
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300"
            style={{
              background: "var(--bg-elevated)",
              border: phase === "typing" ? "1px solid rgba(43,92,230,0.4)" : "1px solid rgba(43,92,230,0.2)",
              boxShadow: phase === "typing" ? "0 0 20px rgba(43,92,230,0.1)" : "none",
            }}
          >
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent-blue)" }} />
            {phase === "typing" ? (
              <TypingQuery text={currentQuery.text} onComplete={handleTypingComplete} />
            ) : (
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                {currentQuery.text}
              </span>
            )}
          </div>
        </div>

        {/* Results area */}
        <div className="px-4 pb-2">
          <AnimatePresence mode="wait">
            {phase === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 py-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 rounded-full"
                  style={{ border: "2px solid var(--border-subtle)", borderTopColor: "var(--accent-blue)" }}
                />
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  Searching 10,247 scenes across 842 films...
                </span>
              </motion.div>
            )}

            {phase === "results" && (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-mono uppercase tracking-widest flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                    <Sparkles className="w-3 h-3" style={{ color: "var(--accent-cyan)" }} />
                    Scene matches Â· {currentQuery.results.length} found
                  </p>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: "var(--accent-green-dim)", color: "var(--accent-green)" }}>
                    0.12s
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Result cards */}
        <div className="px-4 pb-4 flex flex-col gap-2">
          <AnimatePresence>
            {phase === "results" && currentQuery.results.map((result, i) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, x: 16, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group flex flex-col rounded-xl cursor-pointer transition-all duration-200 overflow-hidden"
                style={{
                  background: expandedCard === result.id ? "var(--bg-card-hover)" : "var(--bg-elevated)",
                  border: `1px solid ${expandedCard === result.id ? "var(--border-accent)" : "var(--border-subtle)"}`,
                }}
                onClick={() => setExpandedCard(expandedCard === result.id ? null : result.id)}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  {/* Color dot */}
                  <motion.div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${result.color}20`, border: `1px solid ${result.color}30` }}
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <Film className="w-3.5 h-3.5" style={{ color: result.color }} />
                  </motion.div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {result.snippet}
                    </p>
                    <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                      {result.scene}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-md flex-shrink-0"
                    style={{
                      background: "rgba(56,201,232,0.08)",
                      border: "1px solid rgba(56,201,232,0.15)",
                    }}
                  >
                    <Clock className="w-2.5 h-2.5" style={{ color: "var(--accent-cyan)" }} />
                    <span className="text-[10px] font-mono font-semibold" style={{ color: "var(--accent-cyan)" }}>
                      {result.timestamp}
                    </span>
                  </div>

                  <motion.div
                    animate={{ rotate: expandedCard === result.id ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                  </motion.div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {expandedCard === result.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-3 pb-2.5 overflow-hidden"
                    >
                      <div
                        className="pt-2 mt-1"
                        style={{ borderTop: "1px solid var(--border-subtle)" }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                            Confidence
                          </span>
                          <ConfidenceBar confidence={result.confidence} color={result.color} />
                        </div>
                        <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          AI detected emotional resonance, thematic alignment, and visual motif matching with high confidence.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom bar â€” AI status */}
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          {phase === "results" ? (
            <>
              <MessageSquare className="w-3 h-3" style={{ color: "var(--accent-blue)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Click a result to see confidence analysis
              </span>
            </>
          ) : (
            <>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--accent-blue)" }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                AI is analyzing scenesâ€¦
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
