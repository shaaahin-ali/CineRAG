"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface HoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function HoverButton({ children, className, ...props }: HoverButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setCoords({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full",
        "px-10 py-4 text-sm font-semibold uppercase tracking-[0.2em]",
        "bg-white text-black transition-all duration-500 ease-out",
        "hover:shadow-[0_0_40px_rgba(255,255,255,0.2),0_0_80px_rgba(255,255,255,0.06)]",
        "hover:scale-[1.03] active:scale-[0.98]",
        className
      )}
      {...props}
    >
      {/* Radial glow that follows cursor */}
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${coords.x}% ${coords.y}%, rgba(255,255,255,0.25) 0%, transparent 60%)`,
        }}
      />
      {/* Shimmer sweep on hover */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative z-10">{children}</span>
    </button>
  );
}
