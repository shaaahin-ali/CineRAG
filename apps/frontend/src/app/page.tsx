"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Film, Zap, Users, BookOpen, Star, ChevronRight, Sparkles } from "lucide-react";

const roleQueries = [
  {
    role: "Actor",
    roleML: "നടൻ",
    emoji: "🎭",
    en: "Describe my character's emotional journey",
    ml: "എന്റെ കഥാപാത്രത്തിന്റെ വികാസം വിവരിക്കുക",
    color: "#F43F5E",
    answer: "In Scene 14 (Pages 42–44), your character Hari undergoes a pivotal transformation as the weight of ത്യാഗം (sacrifice) becomes undeniable...",
  },
  {
    role: "Director",
    roleML: "സംവിധായകൻ",
    emoji: "🎬",
    en: "What is the climax structure?",
    ml: "കുടുംബ സംഘർഷത്തിന്റെ ശിഖരം കാണിക്കുക",
    color: "#FDB022",
    answer: "The climax unfolds across Scenes 82–87 (Pages 109–115). The family conflict (കുടുംബ സംഘർഷം) reaches its breaking point when...",
  },
  {
    role: "Cinematographer",
    roleML: "ഛായാഗ്രാഹകൻ",
    emoji: "📽️",
    en: "Show all exterior night scenes",
    ml: "മഴകാലത്തിലെ കാണുകൾ കാണിക്കുക",
    color: "#60A5FA",
    answer: "Found 12 monsoon sequences across the screenplay. Scene 7 (Pages 18–21) features the key backwater scene with heavy rain as emotional metaphor...",
  },
  {
    role: "Music",
    roleML: "സംഗീതം",
    emoji: "🎵",
    en: "Show emotional peak scenes for scoring",
    ml: "സങ്കടമുഭരിത കാണിൽ സംഗീതത്തിന്റെ പങ്ക്",
    color: "#8B5CF6",
    answer: "Scene 55 (Pages 72–74) is the primary emotional peak — the വിയോഗ വേദന (separation pain) moment. Silence followed by a single veena note would be powerful here...",
  },
];

const features = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Streaming Responses",
    desc: "Real-time AI answers via Server-Sent Events",
  },
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "Exact Citations",
    desc: "Every answer cites Scene #, Page #, Characters",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Multi-Role Access",
    desc: "Producer invites entire crew with role-based context",
  },
  {
    icon: <Star className="w-5 h-5" />,
    title: "Malayalam Intelligence",
    desc: "Understands Mollywood emotions, culture, narrative",
  },
];

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [displayedAnswer, setDisplayedAnswer] = useState("");
  const [language, setLanguage] = useState<"en" | "ml">("en");

  // Auto-rotate roles
  useEffect(() => {
    const interval = setInterval(() => {
      setShowAnswer(false);
      setDisplayedAnswer("");
      setTimeout(() => {
        setActiveRole((prev) => (prev + 1) % roleQueries.length);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Simulate streaming answer
  useEffect(() => {
    setShowAnswer(false);
    setDisplayedAnswer("");
    const timer = setTimeout(() => {
      setShowAnswer(true);
      const answer = roleQueries[activeRole].answer;
      let i = 0;
      const stream = setInterval(() => {
        setDisplayedAnswer(answer.slice(0, i));
        i += 3;
        if (i > answer.length) clearInterval(stream);
      }, 20);
      return () => clearInterval(stream);
    }, 600);
    return () => clearTimeout(timer);
  }, [activeRole]);

  const current = roleQueries[activeRole];

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "var(--border-subtle)", background: "rgba(5, 7, 15, 0.85)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-2">
          <Film className="w-6 h-6" style={{ color: "var(--accent-gold)" }} />
          <span className="text-lg font-bold text-white">CinePhile</span>
          <span className="text-xs px-2 py-0.5 rounded-full ml-1"
            style={{ background: "rgba(253,176,34,0.12)", color: "var(--accent-gold)", border: "1px solid rgba(253,176,34,0.25)" }}>
            Malayalam Edition
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-ghost text-sm">Sign In</Link>
          <Link href="/auth/signup" className="btn-primary text-sm">Get Started</Link>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────────────────────────────── */}
      <section className="pt-36 pb-24 px-6 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: "rgba(253,176,34,0.08)", border: "1px solid rgba(253,176,34,0.2)" }}>
            <Sparkles className="w-4 h-4" style={{ color: "var(--accent-gold)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--accent-gold)" }}>
              AI-Powered Screenplay Intelligence for Mollywood
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-black mb-4 leading-tight">
            <span className="text-white">Query Your</span>
            <br />
            <span style={{ background: "linear-gradient(135deg, #FDB022, #F79009)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Screenplay
            </span>
          </h1>

          <p className="font-malayalam text-2xl mb-3" style={{ color: "#9CA3AF" }}>
            സ്ക്രീൻപ്ലേ AI — മലയാള സിനിമ ക്രൂ-വിനായി
          </p>

          <p className="text-lg max-w-2xl mx-auto mb-10" style={{ color: "var(--text-secondary)" }}>
            Upload a screenplay → Query in Malayalam or English → Get streaming answers
            with exact <strong style={{ color: "white" }}>Scene #, Page #, Characters</strong> citations.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/signup" className="btn-primary flex items-center gap-2 text-base px-8 py-3">
              Start Free
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/login" className="btn-ghost text-base px-8 py-3">
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Live Demo ────────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.08)", background: "#0A0E1A" }}
        >
          {/* Demo header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>
              CinePhile Query Interface — Kumbalangi Nights
            </span>
          </div>

          {/* Role tabs */}
          <div className="flex gap-1 p-4 overflow-x-auto">
            {roleQueries.map((r, i) => (
              <button
                key={i}
                onClick={() => { setActiveRole(i); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
                style={{
                  background: activeRole === i ? `${r.color}18` : "transparent",
                  border: `1px solid ${activeRole === i ? `${r.color}40` : "transparent"}`,
                  color: activeRole === i ? r.color : "var(--text-muted)",
                }}
              >
                <span>{r.emoji}</span>
                <span>{r.role}</span>
              </button>
            ))}
          </div>

          {/* Language toggle */}
          <div className="flex gap-2 px-4 pb-3">
            <button
              onClick={() => setLanguage("ml")}
              className="text-xs px-3 py-1 rounded-md transition-all font-malayalam"
              style={{
                background: language === "ml" ? "rgba(253,176,34,0.15)" : "transparent",
                color: language === "ml" ? "var(--accent-gold)" : "var(--text-muted)",
                border: `1px solid ${language === "ml" ? "rgba(253,176,34,0.3)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              മലയാളം
            </button>
            <button
              onClick={() => setLanguage("en")}
              className="text-xs px-3 py-1 rounded-md transition-all"
              style={{
                background: language === "en" ? "rgba(253,176,34,0.15)" : "transparent",
                color: language === "en" ? "var(--accent-gold)" : "var(--text-muted)",
                border: `1px solid ${language === "en" ? "rgba(253,176,34,0.3)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              English
            </button>
          </div>

          {/* Query display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRole}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="px-4 pb-4"
            >
              {/* Query input */}
              <div className="p-4 rounded-xl mb-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{current.emoji}</span>
                  <div>
                    <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                      {language === "ml" ? current.roleML : current.role} Query
                    </p>
                    <p className={`text-base text-white ${language === "ml" ? "font-malayalam" : ""}`}>
                      {language === "ml" ? current.ml : current.en}
                    </p>
                  </div>
                </div>
              </div>

              {/* Response */}
              {showAnswer && (
                <div className="p-4 rounded-xl"
                  style={{ background: `${current.color}08`, border: `1px solid ${current.color}20` }}>
                  {/* Citation pills */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="citation-pill">🎬 Scene 14</span>
                    <span className="citation-pill">📄 Pages 42–44</span>
                    <span className="citation-pill">👤 HARI, ANMOL</span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {displayedAnswer}
                    {displayedAnswer.length < current.answer.length && (
                      <span className="streaming-cursor" />
                    )}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 mb-24">
        <h2 className="text-3xl font-bold text-center text-white mb-12">
          Built for Malayalam Film Industry
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="glass-card p-6"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "rgba(253,176,34,0.1)", color: "var(--accent-gold)" }}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="max-w-2xl mx-auto px-6 mb-24 text-center">
        <div className="card-gold p-10 rounded-2xl">
          <h2 className="text-3xl font-bold text-white mb-3">
            Ready to Query Your Screenplay?
          </h2>
          <p className="font-malayalam mb-8" style={{ color: "var(--text-secondary)" }}>
            ഇന്ന് ആരംഭിക്കുക — സൗജന്യം
          </p>
          <Link href="/auth/signup" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
            <Film className="w-5 h-5" />
            Start for Free
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t py-8 text-center"
        style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
        <p className="text-sm">
          CinePhile Malayalam Edition — Built for Mollywood 🎬
        </p>
      </footer>
    </main>
  );
}
