"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, MotionValue } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Play, Sparkles, Film, Brain, Database, Eye } from "lucide-react";
import { HeroChatPreview } from "@/components/landing/HeroChatPreview";

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
   INTERACTIVE PARTICLE CANVAS
   Neural-network style particles that connect when close and react to mouse
   Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  pulsePhase: number;
  pulseSpeed: number;
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = [
      "255,255,255",   // white
      "220,220,220",   // silver
      "180,180,180",   // light gray
      "150,150,150",   // medium gray
    ];

    // Initialize particles
    const count = Math.min(120, Math.floor(window.innerWidth / 14));
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      size: Math.random() * 2.5 + 0.8,
      opacity: Math.random() * 0.5 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
    }));

    const handleMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMove);

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // time += 0.016;

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      for (const p of particles) {
        // Update pulse
        p.pulsePhase += p.pulseSpeed;

        // Mouse attraction / repulsion
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 0) {
          const force = (200 - dist) / 200 * 0.02;
          p.vx += dx / dist * force;
          p.vy += dy / dist * force;
        }

        // Damping
        p.vx *= 0.995;
        p.vy *= 0.995;

        // Movement
        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        // Draw particle with pulse
        const pulse = Math.sin(p.pulsePhase) * 0.3 + 0.7;
        const alpha = p.opacity * pulse;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${alpha * 0.08})`;
        ctx.fill();
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            const opacity = (1 - dist / 140) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw mouse connections
      if (mouse.x > 0) {
        for (const p of particles) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const opacity = (1 - dist / 180) * 0.25;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(56, 201, 232, ${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
   MORPHING TEXT — cycles through taglines with a typewriter effect
   Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

const TAGLINES = [
  "Talk to Your Movies.",
  "Search Every Scene.",
  "Decode Any Screenplay.",
  "AI That Sees Cinema.",
];

function MorphingText() {
  const [lineIdx, setLineIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const target = TAGLINES[lineIdx];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayed.length < target.length) {
      timer = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 55 + Math.random() * 35);
    } else if (!isDeleting && displayed.length === target.length) {
      timer = setTimeout(() => setIsDeleting(true), 2200);
    } else if (isDeleting && displayed.length > 0) {
      timer = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 28);
    } else {
      setIsDeleting(false);
      setLineIdx((prev) => (prev + 1) % TAGLINES.length);
    }

    return () => clearTimeout(timer);
  }, [displayed, isDeleting, lineIdx]);

  return (
    <span className="inline">
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
        className="inline-block w-[3px] h-[1em] ml-1 align-baseline rounded-sm"
        style={{ background: "var(--accent-cyan)", verticalAlign: "text-bottom" }}
      />
    </span>
  );
}

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
   FLOATING STATS CARDS — orbit/float around with parallax
   Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

const STATS = [
  { icon: Film,     label: "Films Indexed",    value: "10,000+", color: "var(--accent-blue)"   },
  { icon: Brain,    label: "AI Queries/Day",    value: "50K+",    color: "var(--accent-cyan)"   },
  { icon: Database, label: "Scene Vectors",     value: "2.4M",    color: "var(--accent-purple)" },
  { icon: Eye,      label: "Accuracy Rate",     value: "99.2%",   color: "var(--accent-green)"  },
];

function FloatingStatCard({ stat, index, mouseX, mouseY }: {
  stat: typeof STATS[0];
  index: number;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}) {
  const Icon = stat.icon;

  // Each card has a different parallax intensity
  const intensity = 0.015 + index * 0.008;
  const x = useTransform(mouseX, (v) => {
    if (typeof window === 'undefined') return 0;
    return (v - window.innerWidth / 2) * intensity;
  });
  const y = useTransform(mouseY, (v) => {
    if (typeof window === 'undefined') return 0;
    return (v - window.innerHeight / 2) * intensity;
  });
  const springX = useSpring(x, { stiffness: 120, damping: 25 });
  const springY = useSpring(y, { stiffness: 120, damping: 25 });

  const positions = [
    { top: "8%", right: "5%" },
    { top: "25%", right: "2%" },
    { bottom: "30%", right: "8%" },
    { bottom: "12%", right: "3%" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 + index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      style={{
        ...positions[index],
        x: springX,
        y: springY,
        position: "absolute",
        zIndex: 15,
      }}
      whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
      className="hidden xl:flex items-center gap-3 px-4 py-3 rounded-xl cursor-default select-none"
    >
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--glass-border)",
        }}
      />
      <div
        className="relative flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
        style={{
          background: `${stat.color}18`,
          border: `1px solid ${stat.color}30`,
        }}
      >
        <Icon className="w-4 h-4" style={{ color: stat.color }} />
      </div>
      <div className="relative">
        <p className="text-lg font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
          {stat.value}
        </p>
        <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          {stat.label}
        </p>
      </div>
    </motion.div>
  );
}

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
   ANIMATED COUNTER — counts up to a target number
   Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !hasStarted) setHasStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [hasStarted, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

/* Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
   CINEMATIC INTRO — immersive Welcome > CineACUMEN > Reveal sequence
   Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

const PHASE_DURATIONS = [1200, 1400, 2600, 700, 1900, 600];
type Phase = 0 | 1 | 2 | 3 | 4 | 5;

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN HERO SECTION
   ═══════════════════════════════════════════════════════════════════════════ */

export function HeroSection() {
  const router = useRouter();
  const { status } = useSession();
  const ctaHref = status === "authenticated" ? "/dashboard" : "/auth";
  const ctaLabel = status === "authenticated" ? "Go to Dashboard" : "Try It Now";

  /* Intro state machine */
  const [phase, setPhase] = useState<Phase>(0);
  const [introVisible, setIntroVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Mouse tracking for parallax */
  const mouseX = useMotionValue(typeof window !== "undefined" ? window.innerWidth / 2 : 700);
  const mouseY = useMotionValue(typeof window !== "undefined" ? window.innerHeight / 2 : 400);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }, [mouseX, mouseY]);

  /* Intro phase advance */
  const advance = () => {
    setPhase((prev) => {
      const next = (((prev as number) + 1) % 6) as Phase;
      return next;
    });
  };

  useEffect(() => {
    if (!introVisible) return;
    const dur = PHASE_DURATIONS[phase];
    timerRef.current = setTimeout(advance, dur);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, introVisible]);

  const skip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIntroVisible(false);
  };

  /* Active highlight index for the interactive demo strip */
  const [activeDemo, setActiveDemo] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setActiveDemo((p) => (p + 1) % 3), 3000);
    return () => clearInterval(interval);
  }, []);

  const demoItems = useMemo(() => [
    { emoji: "🎬", label: "Upload Screenplay", desc: "Drag & drop your PDF screenplay" },
    { emoji: "🔍", label: "Ask Anything", desc: "\"Show scenes with rain at night\"" },
    { emoji: "⚡", label: "Get Cited Answers", desc: "Scene 42 — INT. WAREHOUSE — NIGHT" },
  ], []);

  return (
    <section
      className="relative z-10 w-full min-h-screen flex flex-col justify-center overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Particle canvas background Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <ParticleCanvas />

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Ambient gradient glows Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.18, 0.28, 0.18],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute"
          style={{
            top: "-20%", left: "50%", transform: "translateX(-50%)",
            width: "80vw", height: "60vh",
            background: "radial-gradient(ellipse at center, rgba(43,92,230,0.18) 0%, transparent 65%)",
            filter: "blur(2px)",
          }}
        />
        <motion.div
          animate={{
            x: [0, 30, 0],
            opacity: [0.07, 0.12, 0.07],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute"
          style={{
            top: "30%", left: "-10%", width: "50vw", height: "50vh",
            background: "radial-gradient(ellipse at center, rgba(56,201,232,0.07) 0%, transparent 65%)",
          }}
        />
        <motion.div
          animate={{
            x: [0, -25, 0],
            opacity: [0.08, 0.14, 0.08],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute"
          style={{
            top: "20%", right: "-10%", width: "50vw", height: "50vh",
            background: "radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 65%)",
          }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(43,92,230,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(43,92,230,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Cinematic Intro Overlay Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <AnimatePresence>
        {introVisible && (
          <motion.div
            key="intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center"
            style={{ background: "var(--bg-deep)" }}
          >
            {/* Intro particles */}
            <ParticleCanvas />

            <AnimatePresence mode="wait">
              {(phase === 0 || phase === 1 || phase === 2) && (
                <motion.div
                  key="seq"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45 }}
                  className="flex flex-col items-center text-center px-6 relative z-10"
                >
                  {/* "Welcome to" */}
                  <motion.p
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-sm md:text-base font-semibold tracking-[0.28em] uppercase mb-4"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Welcome to
                  </motion.p>

                  {/* "CineACUMEN" */}
                  <AnimatePresence>
                    {phase >= 1 && (
                      <motion.h1
                        key="cr1"
                        initial={{ opacity: 0, y: 44, filter: "blur(12px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
                        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                        className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-8"
                        style={{
                          background: "linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-cyan) 60%, #e0f0ff 100%)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          filter: "drop-shadow(0 0 48px rgba(43,92,230,0.55))",
                        }}
                      >
                        CineACUMEN
                      </motion.h1>
                    )}
                  </AnimatePresence>

                  {/* Taglines — staggered words */}
                  {phase >= 2 && (
                    <div className="flex flex-col items-center gap-2 mt-2">
                      {[
                        { text: "Talk to Your Movies.", delay: 0 },
                        { text: "Search Every Scene.", delay: 0.2 },
                      ].map(({ text, delay }) => (
                        <div key={text} className="overflow-hidden">
                          <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
                            className="text-xl sm:text-2xl md:text-4xl font-black tracking-tight"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {text.split(" ").map((word, i) => (
                              <motion.span
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.38, delay: delay + i * 0.08 }}
                                className="inline-block mr-[0.25em]"
                              >
                                {word}
                              </motion.span>
                            ))}
                          </motion.p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Phase 4 — large centred CineACUMEN */}
              {phase === 4 && (
                <motion.div
                  key="cr-big"
                  initial={{ opacity: 0, scale: 0.82, filter: "blur(18px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.06, filter: "blur(10px)" }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center relative z-10"
                >
                  {/* Glow ring */}
                  <motion.div
                    animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.65, 0.35] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: "600px", height: "200px",
                      background: "radial-gradient(ellipse, rgba(43,92,230,0.38) 0%, transparent 70%)",
                      filter: "blur(24px)",
                    }}
                  />
                  <h1
                    className="relative text-4xl sm:text-5xl md:text-8xl font-black tracking-tight text-center px-4"
                    style={{
                      background: "linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-cyan) 55%, #ffffff 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      filter: "drop-shadow(0 0 64px rgba(43,92,230,0.65))",
                    }}
                  >
                    CineACUMEN
                  </h1>
                  <motion.div
                    initial={{ opacity: 0, width: "0px" }}
                    animate={{ opacity: 1, width: "220px" }}
                    transition={{ duration: 0.9, delay: 0.35 }}
                    className="h-px mt-5"
                    style={{ background: "linear-gradient(90deg, transparent, var(--accent-cyan), transparent)" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress dots */}
            <div className="absolute bottom-10 flex gap-2 items-center z-20">
              {[0, 1, 2, 4].map((p, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-500"
                  style={{
                    width: phase === p ? "22px" : "6px",
                    height: "6px",
                    background: phase === p ? "var(--accent-blue)" : "var(--border-subtle)",
                  }}
                />
              ))}
            </div>

            {/* Skip */}
            <button
              onClick={skip}
              className="absolute top-6 right-6 text-xs font-mono tracking-wider uppercase transition-all duration-300 z-20 px-3 py-1.5 rounded-lg"
              style={{
                color: "var(--text-muted)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--border-accent)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              Skip ↩
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Floating stat cards (parallax) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {STATS.map((stat, i) => (
        <FloatingStatCard key={stat.label} stat={stat} index={i} mouseX={mouseX} mouseY={mouseY} />
      ))}

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Main Hero Content — two-column layout Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div className="relative z-10 max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center pt-24 pb-16 px-6">

        {/* LEFT */}
        <div className="flex flex-col items-start">

          {/* Tag chip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.span
              className="tag-chip mb-7 inline-flex gap-2 items-center"
              animate={{
                boxShadow: [
                  "0 0 0px rgba(43,92,230,0)",
                  "0 0 20px rgba(43,92,230,0.3)",
                  "0 0 0px rgba(43,92,230,0)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-3 h-3" />
              AI RETRIEVAL FOR MOVING IMAGES
            </motion.span>
          </motion.div>

          {/* Main headline with morphing text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full mb-6"
          >
            <h1
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.1] min-h-[2.4em]"
              style={{
                background: "linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-cyan) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              <MorphingText />
            </h1>
          </motion.div>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-base md:text-lg leading-relaxed mb-8 max-w-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            Instantly find scenes, quotes, emotions, and context across thousands
            of films using advanced AI retrieval and semantic video search.
          </motion.p>

          {/* Interactive Demo Strip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="w-full max-w-lg mb-8"
          >
            <div className="flex gap-2">
              {demoItems.map((item, i) => (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => setActiveDemo(i)}
                  className="flex-1 text-left px-3 py-3 rounded-xl transition-all duration-300 relative overflow-hidden"
                  style={{
                    background: activeDemo === i ? "var(--bg-elevated)" : "transparent",
                    border: `1px solid ${activeDemo === i ? "var(--border-accent)" : "var(--border-subtle)"}`,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {activeDemo === i && (
                    <motion.div
                      layoutId="demo-highlight"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: "linear-gradient(135deg, rgba(43,92,230,0.06), rgba(56,201,232,0.04))",
                      }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10">
                    <span className="text-lg">{item.emoji}</span>
                    <p className="text-xs font-bold mt-1" style={{ color: activeDemo === i ? "var(--text-primary)" : "var(--text-secondary)" }}>
                      {item.label}
                    </p>
                    <AnimatePresence mode="wait">
                      {activeDemo === i && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-[10px] mt-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {item.desc}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              ))}
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: "var(--border-subtle)" }}>
              <motion.div
                key={activeDemo}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "linear" }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, var(--accent-blue), var(--accent-cyan))" }}
              />
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.55 }}
            className="flex flex-wrap items-center gap-4"
          >
            <motion.button
              type="button"
              onClick={() => router.push(ctaHref)}
              className="btn-primary flex items-center gap-2 text-sm relative overflow-hidden group"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                  backgroundSize: "200% 100%",
                }}
                animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              <span className="relative z-10 flex items-center gap-2">
                {ctaLabel}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </motion.button>
            <motion.button
              type="button"
              onClick={() => document.querySelector("#demo")?.scrollIntoView({ behavior: "smooth" })}
              className="btn-ghost flex items-center gap-2 text-sm group"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Play className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
              Open Chat Demo
            </motion.button>
          </motion.div>

          {/* Inline stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.85 }}
            className="mt-8 flex flex-wrap items-center gap-6"
          >
            {[
              { value: 10000, suffix: "+", label: "Films" },
              { value: 99, suffix: "%", label: "Accuracy" },
              { value: 50, suffix: "K+", label: "Daily Queries" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-lg font-black" style={{ color: "var(--accent-cyan)" }}>
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT — Chat Preview */}
        <div className="flex justify-center lg:justify-end">
          <HeroChatPreview />
        </div>
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Scroll indicator (animated) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] font-mono" style={{ color: "var(--text-muted)" }}>
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full flex justify-center pt-2"
          style={{ border: "1px solid var(--border-subtle)" }}
        >
          <motion.div
            animate={{ y: [0, 10, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-2 rounded-full"
            style={{ background: "var(--accent-blue)" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
