// Zustand store for query state — persists role & language to localStorage

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CrewRole, Language, QueryState } from "@/types";

export const useQueryStore = create<QueryState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: "cineacumen-query-prefs",
      storage: createJSONStorage(() => localStorage),
      // Only persist user preferences, not transient query state
      partialize: (state) => ({
        selectedRole: state.selectedRole,
        selectedLanguage: state.selectedLanguage,
      }),
    }
  )
);
