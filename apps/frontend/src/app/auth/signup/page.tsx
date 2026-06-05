"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Link from "next/link";
import { Film } from "lucide-react";
import { signupSchema, SignupInput } from "@/lib/validators";

const CREW_ROLES = [
  { value: "producer", label: "Producer", labelML: "നിർമ്മാതാവ്" },
  { value: "director", label: "Director", labelML: "സംവിധായകൻ" },
  { value: "actor", label: "Actor", labelML: "നടൻ" },
  { value: "cinematographer", label: "Cinematographer", labelML: "ഛായാഗ്രാഹകൻ" },
  { value: "editor", label: "Editor", labelML: "എഡിറ്റർ" },
  { value: "music", label: "Music", labelML: "സംഗീതം" },
];

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("director");

  const { register, handleSubmit, formState: { errors } } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupInput) => {
    setIsLoading(true);
    // TODO: Implement Supabase auth signup
    console.log("Signup:", { ...data, role: selectedRole });
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: "var(--bg-primary)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(253,176,34,0.1)", border: "1px solid rgba(253,176,34,0.2)" }}>
            <Film className="w-7 h-7" style={{ color: "var(--accent-gold)" }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Join CinePhile</h1>
          <p className="font-malayalam text-sm" style={{ color: "var(--text-muted)" }}>
            മൊള്ളിവുഡ് ക്രൂ-വിനായി
          </p>
        </div>

        {/* Form */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Email</label>
              <input
                {...register("email")}
                id="signup-email"
                type="email"
                placeholder="your@email.com"
                className="input-field"
              />
              {errors.email && (
                <p className="text-xs mt-1" style={{ color: "#F87171" }}>{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Password</label>
              <input
                {...register("password")}
                id="signup-password"
                type="password"
                placeholder="Min. 6 characters"
                className="input-field"
              />
              {errors.password && (
                <p className="text-xs mt-1" style={{ color: "#F87171" }}>{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Confirm Password</label>
              <input
                {...register("confirmPassword")}
                id="signup-confirm-password"
                type="password"
                placeholder="Repeat password"
                className="input-field"
              />
              {errors.confirmPassword && (
                <p className="text-xs mt-1" style={{ color: "#F87171" }}>{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">Your Role</label>
              <div className="grid grid-cols-3 gap-2">
                {CREW_ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    id={`role-select-${r.value}`}
                    onClick={() => setSelectedRole(r.value)}
                    className="p-2 rounded-lg text-xs transition-all text-center"
                    style={{
                      background: selectedRole === r.value ? "rgba(253,176,34,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${selectedRole === r.value ? "rgba(253,176,34,0.3)" : "rgba(255,255,255,0.06)"}`,
                      color: selectedRole === r.value ? "var(--accent-gold)" : "var(--text-muted)",
                    }}
                  >
                    <div className="font-medium">{r.label}</div>
                    <div className="font-malayalam opacity-70">{r.labelML}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              id="signup-submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium" style={{ color: "var(--accent-gold)" }}>
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}
