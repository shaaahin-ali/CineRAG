"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowRight, Eye, EyeOff, LogOut, UserCircle2, Camera } from "lucide-react";

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 48 48"
  >
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z"
    />
  </svg>
);

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

export interface ProfileStat {
  label: string;
  value: string;
}

interface SignInPageProps {
  mode?: "auth" | "profile";
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  errorMessage?: string;
  profileName?: string;
  profileHandle?: string;
  profileRole?: string;
  profileBio?: string;
  profileAvatarSrc?: string;
  profileStats?: ProfileStat[];
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-colors focus-within:border-white/20 focus-within:bg-white/10">
    {children}
  </div>
);

const ErrorBanner = ({ message }: { message: string }) => (
  <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
    <svg
      className="h-4 w-4 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
      <line x1="12" y1="8" x2="12" y2="12" strokeWidth="1.5" />
      <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="1.5" />
    </svg>
    {message}
  </div>
);

const TestimonialCard = ({
  testimonial,
  delay,
}: {
  testimonial: Testimonial;
  delay: string;
}) => (
  <div
    className={`animate-testimonial ${delay} flex w-64 items-start gap-3 rounded-3xl border border-white/10 bg-black/50 p-5 backdrop-blur-xl`}
  >
    <Image
      src={testimonial.avatarSrc}
      width={40}
      height={40}
      className="h-10 w-10 object-cover rounded-2xl flex-shrink-0"
      alt={testimonial.name}
      unoptimized
    />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium text-white">
        {testimonial.name}
      </p>
      <p className="text-xs text-zinc-400">{testimonial.handle}</p>
      <p className="mt-1 text-xs text-zinc-300">{testimonial.text}</p>
    </div>
  </div>
);

const ProfileStatCard = ({ stat }: { stat: ProfileStat }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <div className="text-[11px] uppercase tracking-[0.24em] text-zinc-400">
      {stat.label}
    </div>
    <div className="mt-2 break-words text-sm font-semibold leading-snug text-white md:text-base">
      {stat.value}
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  mode = "auth",
  title = (
    <span className="font-light text-foreground tracking-tighter">Welcome</span>
  ),
  description = "Access your account and continue your journey with us",
  heroImageSrc,
  testimonials = [],
  errorMessage,
  profileName = "Your profile",
  profileHandle = "@user",
  profileRole = "Crew member",
  profileBio = "Manage your account and jump back into your projects.",
  profileAvatarSrc,
  profileStats = [],
  primaryActionLabel = "Open dashboard",
  secondaryActionLabel = "Sign out",
  onPrimaryAction,
  onSecondaryAction,
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  if (mode === "profile") {
    return (
      <div className="min-h-[100dvh] w-full bg-[#05070f] px-6 py-10 text-white md:px-10">
        <div className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-5xl items-center justify-center">
          <div className="w-full rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-start">
              <div className="flex flex-1 items-start gap-5">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 group">
                  {profileAvatarSrc ? (
                    <Image
                      src={profileAvatarSrc}
                      alt={profileName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white">
                      <UserCircle2 className="h-10 w-10 text-zinc-400" />
                    </div>
                  )}
                  {/* Upload overlay */}
                  <label className="absolute inset-0 bg-black/50 opacity-0 transition-opacity flex items-center justify-center cursor-pointer group-hover:opacity-100" title="Update Profile Picture">
                    <Camera className="w-6 h-6 text-white" />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          console.log("File selected:", e.target.files[0]);
                          // TODO: implement actual upload functionality
                        }
                      }} 
                    />
                  </label>
                </div>

                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-400">
                    Profile mode
                  </p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                    {profileName}
                  </h1>
                  <p className="mt-2 text-sm text-zinc-400">
                    {profileHandle} · {profileRole}
                  </p>
                  <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300">
                    {profileBio}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onPrimaryAction}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200"
                >
                  {primaryActionLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onSecondaryAction}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  <LogOut className="h-4 w-4" />
                  {secondaryActionLabel}
                </button>
              </div>
            </div>

            {profileStats.length > 0 && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {profileStats.map((stat) => (
                  <ProfileStatCard key={stat.label} stat={stat} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-[#05070f] text-white md:flex-row">
      {/* Left column: sign-in form */}
      <section className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl font-semibold leading-tight text-white md:text-5xl">
              {title}
            </h1>
            <p className="animate-element animate-delay-200 text-zinc-400">
              {description}
            </p>

            {errorMessage && <ErrorBanner message={errorMessage} />}

            <form className="space-y-5" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-white">
                  Email Address
                </label>
                <GlassInputWrapper>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your email address"
                    className="w-full rounded-2xl bg-transparent p-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-white">
                  Password
                </label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      name="password"
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="w-full rounded-2xl bg-transparent p-4 pr-12 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-zinc-400 transition-colors hover:text-white" />
                      ) : (
                        <Eye className="h-5 w-5 text-zinc-400 transition-colors hover:text-white" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    className="custom-checkbox border-white/20 bg-white/5"
                  />
                  <span className="text-white">Keep me signed in</span>
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onResetPassword?.();
                  }}
                  className="text-zinc-300 transition-colors hover:text-white hover:underline"
                >
                  Reset password
                </a>
              </div>

              <button
                type="submit"
                className="animate-element animate-delay-600 w-full rounded-2xl bg-white py-4 font-medium text-black transition-colors hover:bg-zinc-200"
              >
                Sign In
              </button>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center">
              <span className="w-full border-t border-white/10"></span>
              <span className="absolute whitespace-nowrap bg-[#05070f] px-4 text-sm text-zinc-400">
                Or continue with
              </span>
            </div>

            <button
               type="button"
              onClick={onGoogleSignIn}
              className="animate-element animate-delay-800 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 text-white transition-colors hover:bg-white/10"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <p className="animate-element animate-delay-900 text-center text-sm text-zinc-400">
              New to our platform?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onCreateAccount?.();
                }}
                className="text-white transition-colors hover:underline"
              >
                Create Account
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="relative hidden flex-1 p-4 md:block">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 overflow-hidden rounded-3xl bg-cover bg-center grayscale"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          >
            <div className="absolute inset-0 rounded-3xl bg-black/30 mix-blend-multiply" />
          </div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center z-10">
              <TestimonialCard
                testimonial={testimonials[0]}
                delay="animate-delay-1000"
              />
              {testimonials[1] && (
                <div className="hidden xl:flex">
                  <TestimonialCard
                    testimonial={testimonials[1]}
                    delay="animate-delay-1200"
                  />
                </div>
              )}
              {testimonials[2] && (
                <div className="hidden 2xl:flex">
                  <TestimonialCard
                    testimonial={testimonials[2]}
                    delay="animate-delay-1400"
                  />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
