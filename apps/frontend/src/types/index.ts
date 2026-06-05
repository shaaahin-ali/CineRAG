// Shared TypeScript interfaces for CinePhile Malayalam Edition

export type Language = "ml" | "en";

export type ProjectStatus = "uploading" | "indexing" | "ready" | "error";

export type CrewRole =
  | "producer"
  | "director"
  | "actor"
  | "cinematographer"
  | "editor"
  | "music"
  | "viewer";

export interface Project {
  id: string;
  title: string;
  description?: string;
  owner_id: string;
  status: ProjectStatus;
  file_url?: string;
  page_count?: number;
  scene_count?: number;
  character_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  user_id: string;
  role: CrewRole;
  invited_at: string;
}

export interface Citation {
  scene_number: number;
  page_start: number;
  page_end: number;
  heading: string;
  location: string;
  characters: string[];
  excerpt: string;
  relevance_score?: number;
  detected_emotions?: string[];
  cultural_context?: string;
}

export interface Query {
  id: string;
  project_id: string;
  user_id: string;
  query_text: string;
  response_text?: string;
  citations?: Citation[];
  detected_language?: Language;
  latency_ms?: number;
  tokens_used?: number;
  bookmarked: boolean;
  created_at: string;
}

export interface Scene {
  id: string;
  project_id: string;
  scene_number: number;
  page_start: number;
  page_end: number;
  heading: string;
  location: string;
  time_of_day?: string;
  int_ext?: "INT" | "EXT" | "INT/EXT";
  characters: string[];
  content: string;
  detected_emotions?: string[];
  cultural_context?: string;
  estimated_duration_seconds?: number;
  created_at: string;
}

export interface Character {
  name: string;
  scene_count: number;
  scenes: number[];
}

// SSE Event types
export type SSEEvent =
  | { type: "token"; token: string }
  | { type: "citation"; citation: Citation }
  | { type: "done"; query_id: string; latency_ms: number }
  | { type: "error"; error: string };

// Query store state
export interface QueryState {
  currentQuery: string;
  setCurrentQuery: (q: string) => void;
  streamingResponse: string;
  appendToken: (t: string) => void;
  resetResponse: () => void;
  citations: Citation[];
  addCitation: (c: Citation) => void;
  clearCitations: () => void;
  isStreaming: boolean;
  setStreaming: (v: boolean) => void;
  selectedLanguage: Language;
  setLanguage: (l: Language) => void;
  selectedRole: CrewRole | null;
  setRole: (r: CrewRole) => void;
}

// Malayalam query suggestion
export interface MLQuerySuggestion {
  ml: string;
  en: string;
  role: CrewRole;
  emotion?: string;
}
