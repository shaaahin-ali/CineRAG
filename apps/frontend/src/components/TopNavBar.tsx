"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { CineRAGLogo } from "@/components/CineRAGLogo";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Demo",     href: "#demo" },
  { label: "Pricing",  href: "#pricing" },
];

export function TopNavBar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isAuthenticated = status === "authenticated";
  const name   = session?.user?.name  || "User";
  const avatar = session?.user?.image || "";

  // Don't show on auth page or query page
  if (pathname === "/auth" || pathname.startsWith("/query/")) return null;

  const isLanding = pathname === "/";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
      style={{
        background:           "rgba(0, 0, 0, 0.85)",
        backdropFilter:       "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom:         "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Left: Logo */}
      <CineRAGLogo size="sm" onClick={() => router.push("/")} />

      {/* Center: Nav links — only on landing */}
      {isLanding && (
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      {/* Right: Auth actions */}
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="btn-outline text-sm hidden md:flex"
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full transition-all"
              style={{
                border:    "1px solid rgba(99,149,255,0.2)",
                background: "var(--bg-elevated)",
              }}
              title={`${name} — Profile`}
            >
              {avatar ? (
                <Image src={avatar} alt={name} fill className="object-cover" unoptimized />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xs font-bold"
                      style={{ color: "#FFFFFF" }}>
                  {getInitials(name)}
                </span>
              )}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => router.push("/auth")}
              className="btn-outline hidden md:flex"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => router.push("/auth")}
              className="btn-primary text-sm py-2 px-4"
            >
              Get Started
            </button>
          </>
        )}
        {/* Mobile Menu Toggle */}
        {isLanding && (
          <button
            className="md:hidden p-2 ml-2 text-white/70 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </div>
    </motion.nav>

    {/* Mobile Menu Dropdown */}
    <AnimatePresence>
      {isMobileMenuOpen && isLanding && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-16 left-0 right-0 z-40 bg-black/95 border-b border-white/10 backdrop-blur-xl md:hidden flex flex-col items-center py-6 gap-6"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-lg font-medium text-white/70 hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="w-full h-px bg-white/10 my-2" />
          {isAuthenticated ? (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                router.push("/dashboard");
              }}
              className="btn-primary w-11/12 py-3"
            >
              Dashboard
            </button>
          ) : (
            <div className="flex flex-col gap-3 w-11/12">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/auth");
                }}
                className="btn-outline w-full py-3"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/auth");
                }}
                className="btn-primary w-full py-3"
              >
                Get Started
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
