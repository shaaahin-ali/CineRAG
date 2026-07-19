"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CineRAGLogo } from "@/components/CineRAGLogo";
import { ExternalLink, Share2, MessageSquare, ArrowUpRight, Send } from "lucide-react";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   INTERACTIVE FOOTER
   â€¢ Hover-interactive links with arrow reveals
   â€¢ Animated social icons
   â€¢ Email subscribe with interactive input
   â€¢ Back-to-top button with smooth scroll
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

const footerLinks = [
  {
    label: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Demo", href: "#demo" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    label: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  },
];

const socialLinks = [
  { icon: ExternalLink, href: "#", label: "GitHub" },
  { icon: Share2, href: "#", label: "Twitter" },
  { icon: MessageSquare, href: "#", label: "LinkedIn" },
];

function FooterLink({ label, href }: { label: string; href: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.a
      href={href}
      className="text-sm flex items-center gap-1 transition-all duration-200 py-0.5"
      style={{ color: hovered ? "var(--text-primary)" : "var(--text-secondary)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ x: 4 }}
    >
      {label}
      <motion.span
        initial={{ opacity: 0, x: -4 }}
        animate={{
          opacity: hovered ? 1 : 0,
          x: hovered ? 0 : -4,
        }}
        transition={{ duration: 0.15 }}
      >
        <ArrowUpRight className="w-3 h-3" style={{ color: "var(--accent-cyan)" }} />
      </motion.span>
    </motion.a>
  );
}

export function LandingFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes("@")) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail("");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer
      className="relative z-10 pt-16 pb-8 px-6"
      style={{
        background: "var(--bg-deep)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      {/* Animated top border */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundSize: "200% 100%",
          background:
            "linear-gradient(90deg, transparent, rgba(43,92,230,0.2), rgba(56,201,232,0.15), transparent, rgba(43,92,230,0.2), rgba(56,201,232,0.15), transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand column */}
          <div className="col-span-2">
            <CineRAGLogo size="sm" />
            <p
              className="mt-4 text-sm leading-relaxed max-w-xs"
              style={{ color: "var(--text-muted)" }}
            >
              The AI screenplay intelligence platform for Mollywood and beyond.
            </p>

            {/* Social icons â€” interactive */}
            <div className="flex gap-3 mt-5">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                  whileHover={{
                    scale: 1.15,
                    borderColor: "var(--border-accent)",
                    color: "var(--accent-blue)",
                    y: -2,
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </motion.a>
              ))}
            </div>

            {/* Newsletter subscribe */}
            <form onSubmit={handleSubscribe} className="mt-6 max-w-xs">
              <p className="text-[10px] uppercase tracking-widest font-mono mb-2" style={{ color: "var(--text-muted)" }}>
                Stay Updated
              </p>
              <div
                className="flex items-center rounded-xl overflow-hidden transition-all duration-300"
                style={{
                  background: "var(--bg-elevated)",
                  border: `1px solid ${inputFocused ? "var(--border-accent)" : "var(--border-subtle)"}`,
                  boxShadow: inputFocused ? "0 0 20px rgba(43,92,230,0.1)" : "none",
                }}
              >
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  className="flex-1 bg-transparent px-3 py-2 text-xs outline-none"
                  style={{ color: "var(--text-primary)" }}
                />
                <motion.button
                  type="submit"
                  className="px-3 py-2 flex items-center justify-center"
                  style={{ color: subscribed ? "var(--accent-green)" : "var(--accent-blue)" }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {subscribed ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-xs font-bold"
                    >
                      âœ“
                    </motion.span>
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </motion.button>
              </div>
            </form>
          </div>

          {/* Link columns */}
          {footerLinks.map((col, colIdx) => (
            <motion.div
              key={col.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: colIdx * 0.1 }}
            >
              <p
                className="text-xs uppercase tracking-[0.3em] font-mono mb-4 flex items-center gap-2"
                style={{ color: "var(--text-muted)" }}
              >
                <span className="w-3 h-px" style={{ background: "var(--accent-blue)" }} />
                {col.label}
              </p>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink label={link.label} href={link.href} />
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            Â© {new Date().getFullYear()} CineACUMEN. Fine-tuned for cinema. Built with AI.
          </p>

          <div className="flex items-center gap-4">
            <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              Powered by RAG Â· Semantic Search Â· Gemini Â· Vector DB
            </p>

            {/* Back to top */}
            <motion.button
              onClick={scrollToTop}
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
              }}
              whileHover={{
                y: -3,
                borderColor: "var(--border-accent)",
                color: "var(--accent-blue)",
              }}
              whileTap={{ scale: 0.9 }}
            >
              <motion.span
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xs font-bold"
              >
                â†‘
              </motion.span>
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
}
