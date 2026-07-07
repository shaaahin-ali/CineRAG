"use client";

import { CineRAGLogo } from "@/components/CineRAGLogo";
import { ExternalLink, Share2, MessageSquare } from "lucide-react";

const footerLinks = [
  {
    label: "Product",
    links: [
      { label: "Features",  href: "#features" },
      { label: "Pricing",   href: "#pricing" },
      { label: "Demo",      href: "#demo" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    label: "Company",
    links: [
      { label: "About",   href: "/about" },
      { label: "Blog",    href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    label: "Legal",
    links: [
      { label: "Privacy Policy",   href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy",    href: "#" },
    ],
  },
];

const socialLinks = [
  { icon: ExternalLink,   href: "#", label: "GitHub" },
  { icon: Share2,         href: "#", label: "Twitter" },
  { icon: MessageSquare,  href: "#", label: "LinkedIn" },
];

export function LandingFooter() {
  return (
    <footer
      className="relative z-10 pt-16 pb-8 px-6"
      style={{
        background:  "var(--bg-deep)",
        borderTop:   "1px solid var(--border-subtle)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <CineRAGLogo size="sm" />
            <p
              className="mt-4 text-sm leading-relaxed max-w-xs"
              style={{ color: "var(--text-muted)" }}
            >
              The AI screenplay intelligence platform for Mollywood and beyond.
            </p>
            {/* Social icons */}
            <div className="flex gap-3 mt-5">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200"
                  style={{
                    background: "var(--bg-elevated)",
                    border:     "1px solid var(--border-subtle)",
                    color:      "var(--text-muted)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-accent)";
                    (e.currentTarget as HTMLElement).style.color = "var(--accent-blue)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.label}>
              <p
                className="text-xs uppercase tracking-[0.3em] font-mono mb-4"
                style={{ color: "var(--text-muted)" }}
              >
                {col.label}
              </p>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm transition-colors duration-200"
                      style={{ color: "var(--text-secondary)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} CineRAG. Fine-tuned for cinema. Built with AI.
          </p>
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            Powered by RAG · Semantic Search · Gemini · Vector DB
          </p>
        </div>
      </div>
    </footer>
  );
}
