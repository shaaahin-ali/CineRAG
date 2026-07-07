"use client";

import { create } from "zustand";

export type PlanTier = "free" | "pro";

export interface SubscriptionState {
  plan: PlanTier | null;
  autoRenew: boolean;
  productUpdates: boolean;
  selectedAt: string | null;

  setPlan: (plan: PlanTier) => void;
  setAutoRenew: (v: boolean) => void;
  setProductUpdates: (v: boolean) => void;
  hasPlan: () => boolean;
}

const STORAGE_KEY = "cinerag-subscription";

function loadFromStorage(): Partial<SubscriptionState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* noop */
  }
  return {};
}

function saveToStorage(state: {
  plan: PlanTier | null;
  autoRenew: boolean;
  productUpdates: boolean;
  selectedAt: string | null;
}) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const useSubscription = create<SubscriptionState>((set, get) => {
  const persisted = loadFromStorage();

  return {
    plan: persisted.plan ?? null,
    autoRenew: persisted.autoRenew ?? true,
    productUpdates: persisted.productUpdates ?? false,
    selectedAt: persisted.selectedAt ?? null,

    setPlan: (plan) => {
      const next = { plan, autoRenew: get().autoRenew, productUpdates: get().productUpdates, selectedAt: new Date().toISOString() };
      saveToStorage(next);
      set({ plan: next.plan, selectedAt: next.selectedAt });
    },

    setAutoRenew: (v) => {
      set({ autoRenew: v });
      saveToStorage({ plan: get().plan, autoRenew: v, productUpdates: get().productUpdates, selectedAt: get().selectedAt });
    },

    setProductUpdates: (v) => {
      set({ productUpdates: v });
      saveToStorage({ plan: get().plan, autoRenew: get().autoRenew, productUpdates: v, selectedAt: get().selectedAt });
    },

    hasPlan: () => get().plan !== null,
  };
});

/* ── Plan metadata ────────────────────────────────────────────────────── */

export const PLAN_DETAILS = {
  free: {
    name: "Free",
    price: 0,
    billing: "forever",
    features: [
      "1 project",
      "Basic AI queries",
      "Malayalam + English support",
      "Scene citations",
    ],
    limits: {
      maxProjects: 1,
    },
  },
  pro: {
    name: "Pro",
    price: 24,
    billing: "per user / month",
    features: [
      "Unlimited projects",
      "Priority support",
      "AI narration & video generation",
      "Character relationship graphs",
      "AI storyboard generation",
      "Screenplay writing assistant",
      "Early access to labs",
    ],
    limits: {
      maxProjects: Infinity,
    },
  },
} as const;
