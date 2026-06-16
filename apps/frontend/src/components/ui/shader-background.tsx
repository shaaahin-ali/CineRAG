"use client";

import { MeshGradient } from "@paper-design/shaders-react";

export function ShaderBackground() {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#05070F]">
      <MeshGradient
        className="w-full h-full absolute inset-0 opacity-90"
        colors={["#05070F", "#0A0E1A", "#111827", "#1a1a2e"]}
        speed={0.4}
      />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-48 h-48 bg-gold-500/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-white/3 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 right-1/3 w-24 h-24 bg-kerala-500/5 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
      </div>
    </div>
  );
}
