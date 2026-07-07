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
      aria-label="CineRAG home"
    >
      {/* Film aperture icon */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(sizeMap[size], "w-auto")}
      >
        {/* Outer ring */}
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="url(#logo-gradient)"
          strokeWidth="2"
          fill="none"
        />
        {/* Aperture blades */}
        <path
          d="M16 4 L18 12 L16 10 L14 12 Z"
          fill="#ffffff"
          opacity="0.9"
          transform="rotate(0, 16, 16)"
        />
        <path
          d="M16 4 L18 12 L16 10 L14 12 Z"
          fill="#ffffff"
          opacity="0.7"
          transform="rotate(60, 16, 16)"
        />
        <path
          d="M16 4 L18 12 L16 10 L14 12 Z"
          fill="#ffffff"
          opacity="0.5"
          transform="rotate(120, 16, 16)"
        />
        <path
          d="M16 4 L18 12 L16 10 L14 12 Z"
          fill="#ffffff"
          opacity="0.35"
          transform="rotate(180, 16, 16)"
        />
        <path
          d="M16 4 L18 12 L16 10 L14 12 Z"
          fill="#ffffff"
          opacity="0.25"
          transform="rotate(240, 16, 16)"
        />
        <path
          d="M16 4 L18 12 L16 10 L14 12 Z"
          fill="#ffffff"
          opacity="0.15"
          transform="rotate(300, 16, 16)"
        />
        {/* Center dot */}
        <circle cx="16" cy="16" r="3" fill="#ffffff" />
        <circle cx="16" cy="16" r="1.5" fill="#000000" />
        <defs>
          <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#52525b" />
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
          RAG
        </span>
      </span>
    </button>
  );
}
