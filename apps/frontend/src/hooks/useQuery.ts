// Zustand store for query state

"use client";

import { create } from "zustand";
import { Citation, CrewRole, Language, Query, QueryState } from "@/types";

export const useQueryStore = create<QueryState>()((set) => ({
  currentQuery: "",
  setCurrentQuery: (q) => set({ currentQuery: q }),

  streamingResponse: "",
  appendToken: (t) => set((s) => ({ streamingResponse: s.streamingResponse + t })),
  resetResponse: () => set({ streamingResponse: "" }),

  citations: [],
  addCitation: (c) => set((s) => ({ citations: [...s.citations, c] })),
  clearCitations: () => set({ citations: [] }),

  isStreaming: false,
  setStreaming: (v) => set({ isStreaming: v }),

  selectedLanguage: "en" as Language,
  setLanguage: (l) => set({ selectedLanguage: l }),

  selectedRole: null as CrewRole | null,
  setRole: (r) => set({ selectedRole: r }),
}));
