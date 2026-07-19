"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Film } from "lucide-react";
import { signupSchema, SignupInput } from "@/lib/validators";
import { useAuth } from "@/hooks/useAuth";
import { RoleSelector } from "@/components/RoleSelector";
import { CrewRole } from "@/types";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Google icon                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

/* ────────────────────────────────────────────────────────────────────────── */
/*  Page                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SignupPageContent />
    </Suspense>
  );
}

function SignupPageContent() {
  const [selectedRole, setSelectedRole] = useState<CrewRole>("director");
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser } = useAuth();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    setServerError("");
    try {
      await registerUser(data.email, data.password, callbackUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setServerError(message);
    }
  };

  /* shared input classes */
  const inputCls =
    "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-amber-500/30 focus:outline-none focus:ring-1 focus:ring-amber-500/10";
  const inputErrCls =
    "w-full rounded-xl border border-red-500/20 bg-red-500/[0.02] px-4 py-3.5 text-sm text-white placeholder:text-zinc-600 transition-all focus:border-red-500/30 focus:outline-none focus:ring-1 focus:ring-red-500/10";

  return (
    <div className="flex min-h-[100dvh] w-full bg-black text-white">
      {/* ── Left: Form ──────────────────────────────────────────────── */}
      <section className="flex flex-1 flex-col justify-center overflow-y-auto px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-[420px]">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 flex items-center gap-2"
          >
            <Film className="h-5 w-5 text-amber-400" />
            <span className="text-sm font-semibold tracking-tight text-white">CineACUMEN</span>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <h1 className="text-4xl font-black tracking-tighter sm:text-5xl">
              Join CineACUMEN.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Create your account and start analyzing screenplays with AI.
            </p>
          </motion.div>

          {/* Error */}
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="1.5" />
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="1.5" />
              </svg>
              {serverError}
            </motion.div>
          )}

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-7 space-y-4"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="mb-1.5 block text-xs font-medium text-zinc-400">
                Email address
              </label>
              <input
                {...register("email")}
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className={errors.email ? inputErrCls : inputCls}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="mb-1.5 block text-xs font-medium text-zinc-400">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className={errors.password ? inputErrCls + " pr-12" : inputCls + " pr-12"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-zinc-600 transition-colors hover:text-white" />
                  ) : (
                    <Eye className="h-4 w-4 text-zinc-600 transition-colors hover:text-white" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="signup-confirm-password" className="mb-1.5 block text-xs font-medium text-zinc-400">
                Confirm password
              </label>
              <div className="relative">
                <input
                  {...register("confirmPassword")}
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className={errors.confirmPassword ? inputErrCls + " pr-12" : inputCls + " pr-12"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-3 flex items-center"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-zinc-600 transition-colors hover:text-white" />
                  ) : (
                    <Eye className="h-4 w-4 text-zinc-600 transition-colors hover:text-white" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                Your role in film crew
              </label>
              <p className="mb-3 text-[11px] text-zinc-600">
                Personalizes AI responses for your perspective.
              </p>
              <RoleSelector value={selectedRole} onChange={setSelectedRole} />
            </div>

            <button
              type="submit"
              id="signup-submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/5 disabled:opacity-50"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative my-6 flex items-center justify-center"
          >
            <span className="w-full border-t border-white/[0.06]" />
            <span className="absolute bg-black px-4 text-[11px] uppercase tracking-[0.15em] text-zinc-600">
              or
            </span>
          </motion.div>

          {/* Google */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            type="button"
            onClick={() => console.log("Google sign-up clicked")}
            className="flex w-full items-center justify-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.02] py-3.5 text-sm font-medium text-white transition hover:border-white/15 hover:bg-white/[0.05]"
          >
            <GoogleIcon />
            Continue with Google
          </motion.button>

          {/* Link to login */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-7 text-center text-sm text-zinc-600"
          >
            Already have an account?{" "}
            <Link
              href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="text-white transition-colors hover:text-amber-400"
            >
              Sign in
            </Link>
          </motion.p>
        </div>
      </section>

      {/* ── Right: Hero Image ───────────────────────────────────────── */}
      <section className="relative hidden w-[45%] lg:block">
        <div className="absolute inset-0">
          <Image
            src="/images/auth-signup.png"
            alt="Cinematic film camera"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        </div>

        {/* Feature highlights */}
        <div className="absolute bottom-10 left-10 right-10 z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-3"
          >
            {[
              { label: "Scene-aware AI", desc: "Query by scene, character, or emotion" },
              { label: "Bilingual support", desc: "Malayalam & English, seamlessly" },
              { label: "Role-based context", desc: "Tailored answers for every crew role" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="rounded-xl border border-white/[0.08] bg-black/60 px-5 py-3.5 backdrop-blur-xl"
              >
                <p className="text-sm font-medium text-white">{feature.label}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
