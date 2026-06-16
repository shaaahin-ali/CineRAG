"use client"

import { useEffect, useRef } from "react"

interface GooeyMarqueeProps {
  text: string
  className?: string
  speed?: number
}

export function GooeyMarquee({ text, className = "", speed = 16 }: GooeyMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Inject the marquee keyframe once into the document
    const styleId = "gooey-marquee-keyframes"
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style")
      style.id = styleId
      style.textContent = `
        @keyframes gooey-marquee-scroll {
          from { transform: translateX(70%); }
          to { transform: translateX(-70%); }
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  const animationStyle = {
    animation: `gooey-marquee-scroll ${speed}s infinite linear`,
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-32 text-8xl flex items-center justify-center overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
        <p
          className="absolute min-w-full whitespace-nowrap text-white"
          style={animationStyle}
        >
          {text}
        </p>
      </div>
    </div>
  )
}
