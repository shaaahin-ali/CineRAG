"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Zap, Crown } from "lucide-react";
import { useSubscription, PLAN_DETAILS, PlanTier } from "@/hooks/useSubscription";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanSelected: (plan: PlanTier) => void;
}

function PlanCard({
  tier,
  isPopular,
  onSelect,
}: {
  tier: "free" | "pro";
  isPopular?: boolean;
  onSelect: () => void;
}) {
  const plan = PLAN_DETAILS[tier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: tier === "pro" ? 0.1 : 0 }}
      className={`relative flex flex-col rounded-[28px] border p-7 sm:p-8 transition-all ${
        isPopular
          ? "border-amber-500/40 bg-amber-500/[0.04]"
          : "border-white/[0.08] bg-white/[0.02]"
      }`}
    >
      {/* Popular badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-black">
            <Zap className="h-3 w-3" />
            Recommended
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {tier === "pro" ? (
            <Crown className="h-5 w-5 text-amber-400" />
          ) : (
            <div className="h-5 w-5 rounded-full border border-white/20 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-zinc-500" />
            </div>
          )}
          <h3 className="text-lg font-bold text-white tracking-tight">
            {plan.name}
          </h3>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black tracking-tighter text-white">
            ${plan.price}
          </span>
          {plan.price > 0 && (
            <span className="text-sm text-zinc-500">/ {plan.billing}</span>
          )}
          {plan.price === 0 && (
            <span className="text-sm text-zinc-500">{plan.billing}</span>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="flex-1 space-y-3 mb-8">
        {plan.features.map((feature) => (
          <div key={feature} className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                isPopular
                  ? "bg-amber-500/15 text-amber-400"
                  : "bg-white/10 text-zinc-400"
              }`}
            >
              <Check className="h-3 w-3" />
            </span>
            <span className="text-sm text-zinc-300">{feature}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onSelect}
        className={`w-full rounded-full py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
          isPopular
            ? "bg-white text-black hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/10"
            : "border border-white/15 bg-transparent text-white hover:bg-white/5 hover:border-white/25"
        }`}
      >
        {isPopular ? "Get started with Pro" : "Start for free"}
      </button>
    </motion.div>
  );
}

export function PricingModal({ isOpen, onClose, onPlanSelected }: PricingModalProps) {
  const { setPlan } = useSubscription();

  const handleSelect = (tier: PlanTier) => {
    setPlan(tier);
    onPlanSelected(tier);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div
              className="relative w-full max-w-3xl rounded-[32px] border border-white/[0.08] p-6 sm:p-10 shadow-2xl"
              style={{ background: "rgba(5,7,15,0.98)" }}
            >
              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="absolute right-5 top-5 rounded-full p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-10">
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-[10px] font-medium uppercase tracking-[0.4em] text-zinc-500 mb-3"
                >
                  Choose your plan
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-3xl font-black tracking-tighter text-white sm:text-4xl"
                >
                  Start creating.
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 text-sm text-zinc-500 max-w-md mx-auto"
                >
                  Select a plan to unlock AI-powered screenplay analysis.
                  Upgrade or downgrade anytime.
                </motion.p>
              </div>

              {/* Plan cards */}
              <div className="grid gap-5 sm:grid-cols-2">
                <PlanCard tier="free" onSelect={() => handleSelect("free")} />
                <PlanCard
                  tier="pro"
                  isPopular
                  onSelect={() => handleSelect("pro")}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
