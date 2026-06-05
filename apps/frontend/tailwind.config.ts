import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Cinematic Color Palette ──────────────────────────────────────────
      colors: {
        // Deep cinematic dark
        cinema: {
          950: "#05070F",
          900: "#0A0E1A",
          800: "#111827",
          700: "#1A2235",
          600: "#243047",
        },
        // Mollywood gold / amber accent
        gold: {
          50: "#FFF9EB",
          100: "#FEF0C7",
          200: "#FEDF89",
          300: "#FEC84B",
          400: "#FDB022",
          500: "#F79009",
          600: "#DC6803",
          700: "#B54708",
          800: "#93370D",
          900: "#7A2E0E",
        },
        // Kerala green (nature / hope)
        kerala: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          300: "#86EFAC",
          500: "#22C55E",
          700: "#15803D",
          900: "#14532D",
        },
        // Emotion colors
        emotion: {
          love: "#F43F5E",
          sacrifice: "#8B5CF6",
          conflict: "#EF4444",
          joy: "#F59E0B",
          hope: "#10B981",
          separation: "#6366F1",
          melancholy: "#64748B",
        },
      },

      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        malayalam: ["Meera Inimai", "Noto Sans Malayalam", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },

      // ── Animations ────────────────────────────────────────────────────────
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
        shimmer: "shimmer 2s infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(251, 176, 34, 0.15)" },
          "50%": { boxShadow: "0 0 40px rgba(251, 176, 34, 0.4)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },

      // ── Backdrop Blur ─────────────────────────────────────────────────────
      backdropBlur: {
        xs: "2px",
      },

      // ── Background Gradients ──────────────────────────────────────────────
      backgroundImage: {
        "cinema-gradient":
          "linear-gradient(135deg, #05070F 0%, #0A0E1A 50%, #111827 100%)",
        "gold-gradient":
          "linear-gradient(135deg, #FDB022 0%, #F79009 50%, #DC6803 100%)",
        "kerala-gradient":
          "linear-gradient(135deg, #14532D 0%, #15803D 50%, #22C55E 100%)",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
