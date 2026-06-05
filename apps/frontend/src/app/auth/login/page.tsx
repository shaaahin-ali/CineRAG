"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { Film, Eye, EyeOff, AlertCircle } from "lucide-react";
import { loginSchema, LoginInput } from "@/lib/validators";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError("");
    try {
      await login(data.email, data.password);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid email or password";
      setServerError(message);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--bg-primary)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{
              background: "rgba(253,176,34,0.1)",
              border: "1px solid rgba(253,176,34,0.2)",
              boxShadow: "0 0 30px rgba(253,176,34,0.1)",
            }}
          >
            <Film className="w-8 h-8" style={{ color: "var(--accent-gold)" }} />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="font-malayalam text-sm" style={{ color: "var(--text-muted)" }}>
            CinePhile-ലേക്ക് സ്വാഗതം
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {serverError && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg mb-5 text-sm"
              style={{
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.3)",
                color: "#F87171",
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {serverError}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">
                Email
              </label>
              <input
                {...register("email")}
                id="login-email"
                type="email"
                placeholder="your@email.com"
                className="input-field"
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: "#F87171" }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="input-field pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  id="toggle-password-visibility"
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: "#F87171" }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              id="login-submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium"
              style={{ color: "var(--accent-gold)" }}
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        <p
          className="text-center text-xs mt-4"
          style={{ color: "var(--text-muted)" }}
        >
          🎬 Built for Mollywood film crews
        </p>
      </motion.div>
    </main>
  );
}
