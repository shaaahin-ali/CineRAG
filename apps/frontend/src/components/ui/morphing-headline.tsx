"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface MorphingHeadlineProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
}

/**
 * A left-aligned, inline morphing text component.
 * Morphs between an array of text strings with a gooey blur effect.
 * Designed for single-line use inside a heading — no absolute positioning issues.
 */
export function MorphingHeadline({
  texts,
  morphTime    = 1.4,
  cooldownTime = 2.2,
  className,
}: MorphingHeadlineProps) {
  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let textIndex = texts.length - 1;
    let time      = new Date();
    let morph     = 0;
    let cooldown  = cooldownTime;

    const setMorph = (fraction: number) => {
      if (!text1Ref.current || !text2Ref.current) return;
      text2Ref.current.style.filter  = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      text2Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

      const inv = 1 - fraction;
      text1Ref.current.style.filter  = `blur(${Math.min(8 / inv - 8, 100)}px)`;
      text1Ref.current.style.opacity = `${Math.pow(inv, 0.4) * 100}%`;
    };

    const doCooldown = () => {
      morph = 0;
      if (!text1Ref.current || !text2Ref.current) return;
      text2Ref.current.style.filter  = "";
      text2Ref.current.style.opacity = "100%";
      text1Ref.current.style.filter  = "";
      text1Ref.current.style.opacity = "0%";
    };

    const doMorph = () => {
      morph    -= cooldown;
      cooldown  = 0;
      const fraction = morph / morphTime;
      if (fraction > 1) {
        cooldown = cooldownTime;
        setMorph(1);
      } else {
        setMorph(fraction);
      }
    };

    let raf: number;
    function animate() {
      raf = requestAnimationFrame(animate);
      const now = new Date();
      const shouldInc = cooldown > 0;
      const dt = (now.getTime() - time.getTime()) / 1000;
      time     = now;
      cooldown -= dt;

      if (cooldown <= 0) {
        if (shouldInc) {
          textIndex = (textIndex + 1) % texts.length;
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent = texts[textIndex % texts.length];
            text2Ref.current.textContent = texts[(textIndex + 1) % texts.length];
          }
        }
        doMorph();
      } else {
        doCooldown();
      }
    }

    const timer = setTimeout(() => animate(), 0);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [texts, morphTime, cooldownTime]);

  return (
    <span
      className={cn("relative inline-block", className)}
      style={{ filter: "url(#morph-threshold)" }}
    >
      {/* SVG filter — inline so it's scoped to this instance */}
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="morph-threshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      {/* Two overlapping spans — one fades out as the other fades in */}
      <span ref={text1Ref} className="inline-block select-none" style={{ opacity: 0 }} />
      <span ref={text2Ref} className="inline-block select-none absolute left-0 top-0 whitespace-nowrap" />
    </span>
  );
}
