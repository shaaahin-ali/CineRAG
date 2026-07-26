"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, HelpCircle, LogIn } from "lucide-react";
import { CineRAGLogo } from "@/components/CineRAGLogo";
import { HowToUseModal } from "@/components/HowToUseModal";

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
  const isLanding = pathname === "/";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);

  // Don't show on auth page or query page
  if (pathname === "/auth" || pathname.startsWith("/query/")) return null;

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
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-1">
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

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* How to Use button — always visible */}
        <motion.button
          type="button"
          onClick={() => setShowHowToUse(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
          style={{
            color: "rgba(255,255,255,0.55)",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.borderColor = "rgba(99,149,255,0.35)";
            e.currentTarget.style.background = "rgba(99,149,255,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.55)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          }}
          title="How to use CineACUMEN"
        >
          <HelpCircle size={15} />
          <span className="hidden sm:inline">How to Use</span>
        </motion.button>

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
            {/* Login — clear text button, always visible */}
            <motion.button
              type="button"
              onClick={() => router.push("/auth")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                color: "#fff",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
            >
              <LogIn size={15} />
              Login
            </motion.button>

            {/* Get Started — prominent glowing CTA */}
            <motion.button
              type="button"
              onClick={() => router.push("/auth")}
              className="relative text-sm font-bold py-2.5 px-5 rounded-xl overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #6395FF 0%, #38C9E8 100%)",
                color: "#000",
                boxShadow: "0 0 20px rgba(99,149,255,0.3), 0 4px 16px rgba(56,201,232,0.2)",
                border: "none",
                cursor: "pointer",
              }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 opacity-60"
                style={{
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
                  backgroundSize: "200% 100%",
                }}
                animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
              <span className="relative z-10">Get Started</span>
            </motion.button>
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

          {/* How to Use — mobile */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              setShowHowToUse(true);
            }}
            className="flex items-center gap-2 text-lg font-medium text-white/70 hover:text-white transition-colors"
          >
            <HelpCircle size={18} />
            How to Use
          </button>

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
                className="w-full py-3 rounded-xl text-base font-semibold flex items-center justify-center gap-2 transition-all"
                style={{
                  color: "#fff",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <LogIn size={18} />
                Login
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/auth");
                }}
                className="w-full py-3 rounded-xl text-base font-bold"
                style={{
                  background: "linear-gradient(135deg, #6395FF 0%, #38C9E8 100%)",
                  color: "#000",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 0 20px rgba(99,149,255,0.3)",
                }}
              >
                Get Started
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>

    {/* How To Use Modal */}
    <HowToUseModal isOpen={showHowToUse} onClose={() => setShowHowToUse(false)} />
    </>
  );
}
