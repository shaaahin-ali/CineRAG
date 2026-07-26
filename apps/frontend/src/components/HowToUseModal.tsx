"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  MessageSquare,
  Film,
  Sparkles,
  UserPlus,
  LayoutDashboard,
  Search,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   STEP DATA
   ═══════════════════════════════════════════════════════════════════════════ */

const STEPS = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "Welcome to CineACUMEN",
    subtitle: "Your AI-Powered Screenplay Assistant",
    color: "#6395FF",
    description:
      "CineACUMEN uses advanced AI to let you talk to your screenplays. Upload a script, ask questions in Malayalam or English, and get cited answers pinpointing the exact scene.",
    tips: [
      "Works with Malayalam & English screenplays",
      "Supports PDF, DOCX, and plain-text files",
      "Get answers with exact scene & page citations",
    ],
  },
  {
    id: "signup",
    icon: UserPlus,
    title: "Step 1 — Sign Up / Login",
    subtitle: "Create your account in seconds",
    color: "#38C9E8",
    description:
      "Click the 'Get Started' or 'Login' button in the top navigation bar. You can sign in with Google for instant access — no passwords required.",
    tips: [
      "Google one-click sign-in supported",
      "Your projects & history are saved automatically",
      "Free tier available to explore features",
    ],
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Step 2 — Create a Project",
    subtitle: "Organize your screenplays",
    color: "#8B5CF6",
    description:
      "Once logged in, you'll land on the Dashboard. Click '+ New Project' to create a workspace for your screenplay. Name it after your film for easy tracking.",
    tips: [
      "Each project holds one screenplay",
      "Add a description for your team members",
      "Projects can be revisited anytime from Dashboard",
    ],
  },
  {
    id: "upload",
    icon: Upload,
    title: "Step 3 — Upload Your Screenplay",
    subtitle: "Drag & drop or browse files",
    color: "#10B981",
    description:
      "After creating a project, upload your screenplay file. The AI will automatically parse scenes, characters, and dialogue — building a searchable knowledge graph.",
    tips: [
      "Supported: PDF, DOCX, TXT formats",
      "Processing takes ~30 seconds for a full script",
      "Scene boundaries are auto-detected",
    ],
  },
  {
    id: "query",
    icon: MessageSquare,
    title: "Step 4 — Ask Anything",
    subtitle: "Chat with your screenplay",
    color: "#F59E0B",
    description:
      "Navigate to the Query workspace. Type your question in natural language — in Malayalam or English. The AI searches your screenplay and responds with cited answers.",
    tips: [
      "Try: \"Show all scenes with the villain\"",
      "Try: \"Find romantic scenes at night\"",
      "Try: \"What happens in Act 2?\"",
    ],
  },
  {
    id: "results",
    icon: Search,
    title: "Step 5 — Explore Results",
    subtitle: "Scene citations & visual insights",
    color: "#EF4444",
    description:
      "Each answer includes clickable scene citations. Explore the Character Graph to see relationships, view Scene Storyboards, and use the Cinematic Narrator for deeper analysis.",
    tips: [
      "Click any citation pill to jump to that scene",
      "Toggle between different view panels",
      "Use the Character Graph for relationship mapping",
    ],
  },
  {
    id: "roles",
    icon: Film,
    title: "Pro Tip — Role-Based Answers",
    subtitle: "Tailored for every crew member",
    color: "#EC4899",
    description:
      "Select your role (Director, Cinematographer, Editor, etc.) before querying. The AI tailors its response to focus on what matters most to your department.",
    tips: [
      "Director: focus on story arcs & character motivation",
      "Cinematographer: lighting, angles, visual mood",
      "Editor: scene flow, transitions, pacing notes",
    ],
  },
  {
    id: "tips",
    icon: Lightbulb,
    title: "Quick Tips & Shortcuts",
    subtitle: "Get the most out of CineACUMEN",
    color: "#06B6D4",
    description:
      "Master these shortcuts and patterns to supercharge your screenplay workflow.",
    tips: [
      "Use the bottom dock bar for quick navigation",
      "Screenplay Writer tool helps draft new scenes",
      "Query history saves all your past searches",
      "Works best with properly formatted screenplays",
      "Bookmark your favorite projects for fast access",
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MODAL COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export function HowToUseModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);

  // Reset to step 0 when opened
  useEffect(() => {
    if (isOpen) setCurrentStep(0);
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const goNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const step = STEPS[currentStep];
  const Icon = step.icon;

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.96,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.96,
    }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #0a0f1e 0%, #0d1117 50%, #0a0e1a 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              boxShadow: `
                0 0 80px ${step.color}15,
                0 32px 64px rgba(0, 0, 0, 0.6),
                inset 0 1px 0 rgba(255, 255, 255, 0.06)
              `,
            }}
          >
            {/* Glow accent */}
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{
                background: `linear-gradient(90deg, transparent, ${step.color}, transparent)`,
              }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 rounded-lg transition-all duration-200"
              style={{
                color: "rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
              }}
            >
              <X size={18} />
            </button>

            {/* Content area */}
            <div className="relative px-8 pt-8 pb-6 min-h-[420px] overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Step header */}
                  <div className="flex items-start gap-5 mb-6">
                    {/* Icon circle */}
                    <motion.div
                      className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl"
                      style={{
                        background: `${step.color}15`,
                        border: `1px solid ${step.color}30`,
                        boxShadow: `0 0 24px ${step.color}15`,
                      }}
                      animate={{
                        boxShadow: [
                          `0 0 16px ${step.color}10`,
                          `0 0 28px ${step.color}25`,
                          `0 0 16px ${step.color}10`,
                        ],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Icon size={26} style={{ color: step.color }} />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h2
                        className="text-xl font-bold tracking-tight"
                        style={{ color: "#F9FAFB" }}
                      >
                        {step.title}
                      </h2>
                      <p
                        className="text-sm mt-0.5"
                        style={{ color: step.color }}
                      >
                        {step.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p
                    className="text-sm leading-relaxed mb-6"
                    style={{ color: "rgba(255,255,255,0.65)" }}
                  >
                    {step.description}
                  </p>

                  {/* Tips */}
                  <div className="space-y-2.5">
                    {step.tips.map((tip, i) => (
                      <motion.div
                        key={tip}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.08 }}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <CheckCircle2
                          size={16}
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: step.color }}
                        />
                        <span
                          className="text-sm"
                          style={{ color: "rgba(255,255,255,0.75)" }}
                        >
                          {tip}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer — Progress + Nav */}
            <div
              className="px-8 py-5 flex items-center justify-between"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(0,0,0,0.3)",
              }}
            >
              {/* Step dots */}
              <div className="flex items-center gap-1.5">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setDirection(i > currentStep ? 1 : -1);
                      setCurrentStep(i);
                    }}
                    className="transition-all duration-300 rounded-full"
                    style={{
                      width: i === currentStep ? "20px" : "6px",
                      height: "6px",
                      background:
                        i === currentStep
                          ? step.color
                          : i < currentStep
                          ? `${step.color}60`
                          : "rgba(255,255,255,0.15)",
                    }}
                  />
                ))}
                <span
                  className="text-xs ml-3 font-mono"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {currentStep + 1}/{STEPS.length}
                </span>
              </div>

              {/* Nav buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200"
                  style={{
                    background:
                      currentStep === 0
                        ? "transparent"
                        : "rgba(255,255,255,0.05)",
                    border: `1px solid ${
                      currentStep === 0
                        ? "transparent"
                        : "rgba(255,255,255,0.08)"
                    }`,
                    color:
                      currentStep === 0
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(255,255,255,0.7)",
                    cursor: currentStep === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronLeft size={18} />
                </button>

                {currentStep === STEPS.length - 1 ? (
                  <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={{
                      background: step.color,
                      color: "#000",
                      boxShadow: `0 0 20px ${step.color}30`,
                    }}
                  >
                    Got it!
                    <CheckCircle2 size={16} />
                  </button>
                ) : (
                  <button
                    onClick={goNext}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${step.color}25`;
                      e.currentTarget.style.borderColor = `${step.color}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.08)";
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.1)";
                    }}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
