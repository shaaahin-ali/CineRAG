"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { Film, AlertCircle } from "lucide-react";
import { signupSchema, SignupInput } from "@/lib/validators";
import { useAuth } from "@/hooks/useAuth";
import { RoleSelector } from "@/components/RoleSelector";
import { CrewRole } from "@/types";

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState<CrewRole>("director");
  const [serverError, setServerError] = useState("");
  const { register: registerUser } = useAuth();

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
      await registerUser(data.email, data.password);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
      setServerError(message);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: "var(--bg-primary)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{
              background: "rgba(253,176,34,0.1)",
              border: "1px solid rgba(253,176,34,0.2)",
            }}
          >
            <Film className="w-8 h-8" style={{ color: "var(--accent-gold)" }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Join CinePhile</h1>
          <p className="font-malayalam text-sm" style={{ color: "var(--text-muted)" }}>
            മൊള്ളിവുഡ് ക്രൂ-വിനായി
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
                id="signup-email"
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
              <input
                {...register("password")}
                id="signup-password"
                type="password"
                placeholder="Min. 6 characters"
                className="input-field"
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: "#F87171" }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">
                Confirm Password
              </label>
              <input
                {...register("confirmPassword")}
                id="signup-confirm-password"
                type="password"
                placeholder="Repeat password"
                className="input-field"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-xs mt-1" style={{ color: "#F87171" }}>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Your Role in Film Crew
              </label>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                This personalizes AI responses for your specific perspective.
              </p>
              <RoleSelector value={selectedRole} onChange={setSelectedRole} />
            </div>

            <button
              type="submit"
              id="signup-submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-6"
            >
              {isSubmitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium"
              style={{ color: "var(--accent-gold)" }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
