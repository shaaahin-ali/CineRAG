"use client";

import { cn } from "@/lib/utils";

interface CineRAGLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function CineRAGLogo({ className, size = "md", onClick }: CineRAGLogoProps) {
  const sizeMap = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex items-center gap-0.5 group", className)}
      aria-label="CineACUMEN home"
    >
      {/* Cinematic AI Prism Logo */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(sizeMap[size], "w-auto")}
      >
        {/* Outer Prism Diamond */}
        <path
          d="M16 2 L30 16 L16 30 L2 16 Z"
          stroke="url(#logo-gradient)"
          strokeWidth="2"
          strokeLinejoin="round"
          fill="rgba(255, 255, 255, 0.02)"
        />
        
        {/* Inner geometric AI nodes */}
        <path d="M16 2 L16 30 M2 16 L30 16" stroke="url(#logo-gradient-dark)" strokeWidth="1" opacity="0.6" />
        <path d="M9 9 L23 23 M9 23 L23 9" stroke="url(#logo-gradient-dark)" strokeWidth="1" opacity="0.4" />
        
        {/* Central Core (Camera Lens / Play Button) */}
        <circle cx="16" cy="16" r="6" fill="#09090b" stroke="#ffffff" strokeWidth="1.5" />
        <path d="M14 12.5 L20 16 L14 19.5 Z" fill="#ffffff" />

        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#d4d4d8" />
            <stop offset="100%" stopColor="#52525b" />
          </linearGradient>
          <linearGradient id="logo-gradient-dark" x1="0" y1="32" x2="32" y2="0">
            <stop offset="0%" stopColor="#a1a1aa" />
            <stop offset="100%" stopColor="#27272a" />
          </linearGradient>
        </defs>
      </svg>

      {/* Wordmark */}
      <span className="flex items-baseline tracking-tighter">
        <span
          className={cn(
            "font-black text-white transition-colors group-hover:text-zinc-300",
            size === "sm" && "text-base",
            size === "md" && "text-xl",
            size === "lg" && "text-2xl",
          )}
        >
          CINE
        </span>
        <span
          className={cn(
            "font-black text-zinc-400 transition-colors group-hover:text-zinc-300",
            size === "sm" && "text-base",
            size === "md" && "text-xl",
            size === "lg" && "text-2xl",
          )}
        >
          ACUMEN
        </span>
      </span>
    </button>
  );
}
