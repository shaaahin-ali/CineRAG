"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Network,
  Crown,
  Shield,
  User,
  Clapperboard,
  ChevronDown,
  ChevronUp,
  Zap,
  Link2,
  MapPin,
  Film,
  Sparkles,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { api } from "@/lib/api-client";
import dagre from "dagre";

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB", nodesep: 50, ranksep: 100 });

  nodes.forEach((node) => {
    let w = 180, h = 60;
    if (node.type === "scene") { w = 80; h = 30; }
    if (node.type === "location") { w = 100; h = 40; }
    dagreGraph.setNode(node.id, { width: w, height: h });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    let w = 180, h = 60;
    if (node.type === "scene") { w = 80; h = 30; }
    if (node.type === "location") { w = 100; h = 40; }
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - w / 2,
        y: nodeWithPosition.y - h / 2,
      },
    };
  });
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

interface CharacterConnection {
  name: string;
  shared_scenes: number;
  relationship: string;
  confidence: number;
  supporting_text?: string;
  first_meeting?: number | null;
}

interface CharacterSummary {
  name: string;
  role: "lead" | "supporting" | "minor";
  scene_count: number;
  scenes: number[];
  color: string;
  connections: CharacterConnection[];
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
  summary: CharacterSummary[];
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Role config                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

const ROLE_META = {
  lead: {
    Icon: Crown,
    label: "Lead",
    color: "#FDB022",
    bg: "rgba(253,176,34,0.12)",
    border: "rgba(253,176,34,0.50)",
    glow: "0 0 24px rgba(253,176,34,0.25), 0 0 48px rgba(253,176,34,0.08)",
    gradient: "linear-gradient(135deg, rgba(253,176,34,0.18), rgba(253,176,34,0.06))",
    pad: "12px 20px",
    nameSize: "14px",
    metaSize: "10px",
    iconSize: 15,
    nodeWidth: 160,
  },
  supporting: {
    Icon: Shield,
    label: "Supporting",
    color: "#FFFFFF",
    bg: "rgba(255,255,255,0.10)",
    border: "rgba(255,255,255,0.40)",
    glow: "0 0 16px rgba(255,255,255,0.15)",
    gradient: "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))",
    pad: "10px 16px",
    nameSize: "13px",
    metaSize: "9px",
    iconSize: 12,
    nodeWidth: 140,
  },
  minor: {
    Icon: User,
    label: "Minor",
    color: "#94A3B8",
    bg: "rgba(148,163,184,0.08)",
    border: "rgba(148,163,184,0.30)",
    glow: "0 0 8px rgba(148,163,184,0.08)",
    gradient: "linear-gradient(135deg, rgba(148,163,184,0.10), rgba(148,163,184,0.03))",
    pad: "8px 12px",
    nameSize: "11px",
    metaSize: "9px",
    iconSize: 10,
    nodeWidth: 110,
  },
} as const;

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Custom Character Node                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

function CharacterNode({ data }: NodeProps) {
  const role = (data.role as keyof typeof ROLE_META) ?? "minor";
  const meta = ROLE_META[role];
  const { Icon } = meta;
  const sceneCount = Number(data.scene_count ?? 0);

  return (
    <div
      style={{
        background: meta.gradient,
        border: `2px solid ${meta.border}`,
        borderRadius: "16px",
        padding: meta.pad,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        boxShadow: meta.glow,
        backdropFilter: "blur(12px)",
        cursor: "grab",
        userSelect: "none",
        minWidth: `${meta.nodeWidth}px`,
        transition: "all 0.2s ease",
      }}
    >
      {/* Handles for edge connections - all 4 sides */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ opacity: 0, width: 8, height: 8 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        style={{ opacity: 0, width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0, width: 8, height: 8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        style={{ opacity: 0, width: 8, height: 8 }}
      />

      {/* Role icon with glow circle */}
      <div
        style={{
          width: role === "lead" ? 36 : role === "supporting" ? 30 : 26,
          height: role === "lead" ? 36 : role === "supporting" ? 30 : 26,
          borderRadius: "50%",
          background: meta.bg,
          border: `1.5px solid ${meta.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: meta.glow,
        }}
      >
        <Icon size={meta.iconSize} style={{ color: meta.color }} />
      </div>

      {/* Name + meta */}
      <div style={{ lineHeight: 1.2 }}>
        <div
          style={{
            color: "#F9FAFB",
            fontSize: meta.nameSize,
            fontWeight: 700,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          }}
        >
          {String(data.label ?? "")}
        </div>
        <div
          style={{
            marginTop: "4px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              color: meta.color,
              fontSize: "9px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            {meta.label}
          </span>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "8px" }}>
            •
          </span>
          <span
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: meta.metaSize,
              fontWeight: 500,
            }}
          >
            {sceneCount} {sceneCount === 1 ? "scene" : "scenes"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Custom Scene Node                                                          */
/* ─────────────────────────────────────────────────────────────────────────── */

function SceneNode({ data: rawData }: NodeProps) {
  const data = rawData as unknown as SceneNodeData;
  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))",
        border: "1.5px solid rgba(99,102,241,0.35)",
        borderRadius: "10px",
        padding: "6px 12px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: "0 0 12px rgba(99,102,241,0.12)",
        backdropFilter: "blur(8px)",
        cursor: "pointer",
        userSelect: "none" as const,
        minWidth: "70px",
        transition: "all 0.2s ease",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 6, height: 6 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right} id="right-source" style={{ opacity: 0, width: 6, height: 6 }} />
      <Film size={11} style={{ color: "#818CF8", flexShrink: 0 }} />
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ color: "#E0E7FF", fontSize: "11px", fontWeight: 700 }}>
          {String(data.label ?? "")}
        </div>
        {data.location && (
          <div style={{ color: "rgba(129,140,248,0.6)", fontSize: "8px", fontWeight: 500, marginTop: 2 }}>
            {String(data.location)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Custom Location Node                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

function LocationNode({ data }: NodeProps) {
  const sceneCount = Number(data.scene_count ?? 0);
  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(52,211,153,0.15), rgba(52,211,153,0.05))",
        border: "1.5px solid rgba(52,211,153,0.35)",
        borderRadius: "12px",
        padding: "8px 14px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 0 12px rgba(52,211,153,0.12)",
        backdropFilter: "blur(8px)",
        cursor: "pointer",
        userSelect: "none" as const,
        minWidth: "90px",
        transition: "all 0.2s ease",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0, width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right} id="right-source" style={{ opacity: 0, width: 6, height: 6 }} />
      <MapPin size={12} style={{ color: "#34D399", flexShrink: 0 }} />
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ color: "#D1FAE5", fontSize: "11px", fontWeight: 700 }}>
          {String(data.label ?? "")}
        </div>
        <div style={{ color: "rgba(52,211,153,0.5)", fontSize: "8px", fontWeight: 500, marginTop: 2 }}>
          {sceneCount} {sceneCount === 1 ? "scene" : "scenes"}
        </div>
      </div>
    </div>
  );
}

/* Register custom nodes */
const nodeTypes = { character: CharacterNode, scene: SceneNode, location: LocationNode };

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Relationship badge color helper                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

function getRelationshipColor(relationship: string): string {
  const r = relationship.toLowerCase();
  if (["father", "mother", "son", "daughter", "brother", "sister", "family", "parent"].some(k => r.includes(k)))
    return "#F472B6"; // Pink for family
  if (["husband", "wife", "lover", "romance", "love"].some(k => r.includes(k)))
    return "#FB7185"; // Rose for romantic
  if (["friend", "confidant", "ally", "companion"].some(k => r.includes(k)))
    return "#34D399"; // Green for friendship
  if (["rival", "enemy", "antagonist", "opponent"].some(k => r.includes(k)))
    return "#F87171"; // Red for conflict
  if (["boss", "employee", "colleague", "mentor", "student", "teacher"].some(k => r.includes(k)))
    return "#FFFFFF"; // Blue for professional
  if (["uncle", "aunt", "cousin", "nephew", "niece", "guardian"].some(k => r.includes(k)))
    return "#C084FC"; // Purple for extended family
  return "#94A3B8"; // Default gray
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Panel                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */

interface CharacterGraphPanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = "network" | "characters_only";
type LayoutMode = "network" | "hierarchy";

// Typed data shapes for each node type
interface CharacterNodeData { label: string; color: string; role: string; scene_count: number }
interface SceneNodeData {
  label: string;
  scene_number: number;
  heading?: string;
  location?: string;
  page_start?: number;
  page_end?: number;
  characters?: string[];
}
interface LocationNodeData { label: string; scene_count?: number; scenes?: number[] }

type SelectedNodeInfo =
  | { id: string; type: "character"; data: CharacterNodeData }
  | { id: string; type: "scene";     data: SceneNodeData }
  | { id: string; type: "location";  data: LocationNodeData };

export function CharacterGraphPanel({
  projectId,
  isOpen,
  onClose,
}: CharacterGraphPanelProps) {
  const [expandedChar, setExpandedChar] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"cast" | "relationships">("cast");
  const [viewMode, setViewMode] = useState<ViewMode>("network");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("network");
  const [showScenes, setShowScenes] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [selectedNode, setSelectedNode] = useState<SelectedNodeInfo | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenMessage, setRegenMessage] = useState<string>("");

  const regenerateImages = async () => {
    setIsRegenerating(true);
    setRegenMessage("");
    try {
      const res = await api.post<{ scenes_queued: number; message: string }>(
        `/api/v1/projects/${projectId}/regenerate-images`,
        {}
      );
      setRegenMessage(`✓ ${res.scenes_queued} scenes queued — images will appear in Storyboard shortly.`);
    } catch (err: unknown) {
      setRegenMessage(`✗ ${err instanceof Error ? err.message : "Failed to start regeneration"}`);
    } finally {
      setIsRegenerating(false);
    }
  };


  /* ── Fetch ── */
  const { data, isLoading, error } = useQuery<GraphData>({
    queryKey: ["character-graph", projectId],
    queryFn: () => {
      return api.get<GraphData>(
        `/api/v1/projects/${projectId}/character-graph?include_scenes=true&include_locations=true`
      );
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  /* ── React Flow state ── */
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (!data) return;
    let filteredNodes = data.nodes as Node[];
    let filteredEdges = data.edges as Edge[];

    if (viewMode === "characters_only") {
      filteredNodes = filteredNodes.filter((n) => n.type === "character");
    } else {
      if (!showScenes) {
        filteredNodes = filteredNodes.filter((n) => n.type !== "scene");
      }
      if (!showLocations) {
        filteredNodes = filteredNodes.filter((n) => n.type !== "location");
      }
    }

    const validNodeIds = new Set(filteredNodes.map((n) => n.id));
    filteredEdges = filteredEdges.filter(
      (e) => validNodeIds.has(e.source) && validNodeIds.has(e.target)
    );

    if (layoutMode === "hierarchy") {
      filteredNodes = getLayoutedElements(filteredNodes, filteredEdges);
    }

    setNodes(filteredNodes);
    setEdges(filteredEdges);
  }, [data, viewMode, layoutMode, showScenes, showLocations, setNodes, setEdges]);

  /* ── Node click handler ── */
  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    const nodeType = (node.type ?? "character") as "character" | "scene" | "location";
    if (nodeType === "scene") {
      setSelectedNode({ id: node.id, type: "scene", data: node.data as unknown as SceneNodeData });
    } else if (nodeType === "location") {
      setSelectedNode({ id: node.id, type: "location", data: node.data as unknown as LocationNodeData });
    } else {
      setSelectedNode({ id: node.id, type: "character", data: node.data as unknown as CharacterNodeData });
    }
    setExplanation("");
  };

  /* ── RAG explain ── */
  const fetchExplanation = async (charName: string) => {
    setIsExplaining(true);
    setExplanation("");
    try {
      const res = await api.get<{ explanation: string }>(
        `/api/v1/projects/${projectId}/graph/explain?character=${encodeURIComponent(charName)}`
      );
      setExplanation(res.explanation || "No explanation available.");
    } catch {
      setExplanation("Failed to generate explanation.");
    } finally {
      setIsExplaining(false);
    }
  };

  /* ── Derived stats ── */
  const { leadCount, supportingCount, minorCount, totalCharacters } =
    useMemo(() => {
      const s = data?.summary ?? [];
      return {
        totalCharacters: s.length,
        leadCount: s.filter((c) => c.role === "lead").length,
        supportingCount: s.filter((c) => c.role === "supporting").length,
        minorCount: s.filter((c) => c.role === "minor").length,
      };
    }, [data?.summary]);

  /* ── Deduplicated relationship pairs (only meaningful ones) ── */
  const relationships = useMemo(() => {
    if (!data?.summary) return [];
    const seen = new Set<string>();
    const pairs: Array<{
      a: string;
      b: string;
      scenes: number;
      relationship: string;
      confidence: number;
      first_meeting?: number | null;
      supporting_text?: string;
      colorA: string;
      colorB: string;
    }> = [];

    for (const char of data.summary) {
      for (const conn of char.connections) {
        const key = [char.name, conn.name].sort().join("\0");
        if (!seen.has(key)) {
          seen.add(key);
          const rel = conn.relationship || "Co-appears";
          const conf = Number(conn.confidence) || 0;
          // Skip pure "Co-appears" with zero confidence — no useful info
          if (rel === "Co-appears" && conf === 0) continue;
          const charB = data.summary.find((c) => c.name === conn.name);
          // Sanitize supporting_text: skip if it contains Malayalam or is too long
          const rawText = conn.supporting_text || "";
          const hasMalayalam = /[\u0D00-\u0D7F]/.test(rawText);
          const safeText = hasMalayalam || rawText.length > 120 ? "" : rawText.trim();
          pairs.push({
            a: char.name,
            b: conn.name,
            scenes: conn.shared_scenes,
            relationship: rel,
            confidence: conf,
            first_meeting: conn.first_meeting,
            supporting_text: safeText || undefined,
            colorA: char.color,
            colorB: charB?.color ?? "#64748B",
          });
        }
      }
    }

    return pairs.sort((x, y) => y.scenes - x.scenes);
  }, [data?.summary]);

  const maxRelScenes = relationships[0]?.scenes ?? 1;

  /* ── Render ── */
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
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 40,
              background: "rgba(0,0,0,0.70)",
              backdropFilter: "blur(6px)",
            }}
            onClick={onClose}
          />

          {/* Full-screen panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{
              position: "fixed",
              inset: "20px",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
              background: "rgba(0,0,0,0.98)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow:
                "0 25px 50px rgba(0,0,0,0.5), 0 0 80px rgba(253,176,34,0.03)",
            }}
          >
            {/* ── Header ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                flexShrink: 0,
                background: "rgba(255,255,255,0.02)",
              }}
            >
              {/* Left: icon + title */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, rgba(253,176,34,0.15), rgba(253,176,34,0.05))",
                    border: "1px solid rgba(253,176,34,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 0 20px rgba(253,176,34,0.1)",
                  }}
                >
                  <Network size={20} style={{ color: "#FDB022" }} />
                </div>
                <div>
                  <h2
                    style={{
                      color: "#F9FAFB",
                      fontSize: "17px",
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      margin: 0,
                    }}
                  >
                    Character Relationship Graph
                  </h2>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "12px",
                      margin: "3px 0 0",
                    }}
                  >
                    {totalCharacters > 0
                      ? [
                          leadCount > 0 && `${leadCount} lead`,
                          supportingCount > 0 && `${supportingCount} supporting`,
                          minorCount > 0 && `${minorCount} minor`,
                        ]
                          .filter(Boolean)
                          .join(" · ")
                      : isLoading
                      ? "Analyzing screenplay relationships…"
                      : "No cast found"}
                  </p>
                </div>
              </div>

              {/* Centre: role legend */}
              {totalCharacters > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                  }}
                  className="hidden md:flex"
                >
                  {(["lead", "supporting", "minor"] as const).map((role) => {
                    const m = ROLE_META[role];
                    return (
                      <div
                        key={role}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 10px",
                          borderRadius: 8,
                          background: m.bg,
                          border: `1px solid ${m.border}`,
                        }}
                      >
                        <m.Icon size={12} style={{ color: m.color }} />
                        <span
                          style={{
                            color: m.color,
                            fontSize: "11px",
                            fontWeight: 700,
                          }}
                        >
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Right: regenerate + close */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Regenerate scene images */}
                {data && data.nodes.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <button
                      id="regenerate-images-btn"
                      onClick={regenerateImages}
                      disabled={isRegenerating}
                      title="Regenerate storyboard images for all scenes"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        borderRadius: 10,
                        padding: "7px 12px",
                        background: isRegenerating
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.20)",
                        color: isRegenerating ? "rgba(255,255,255,0.5)" : "#FBBF24",
                        cursor: isRegenerating ? "wait" : "pointer",
                        fontSize: "11px",
                        fontWeight: 700,
                        transition: "all 0.15s",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isRegenerating ? (
                        <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                      ) : (
                        <Film size={12} />
                      )}
                      {isRegenerating ? "Generating…" : "Regenerate Images"}
                    </button>
                    {regenMessage && (
                      <span style={{
                        fontSize: "10px",
                        color: regenMessage.startsWith("✓") ? "#34D399" : "#F87171",
                        maxWidth: 240,
                        textAlign: "right",
                        lineHeight: 1.3,
                      }}>
                        {regenMessage}
                      </span>
                    )}
                  </div>
                )}
                <button
                  id="close-graph-panel"
                  onClick={onClose}
                  style={{
                    borderRadius: 12,
                    padding: "8px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#6B7280",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.color = "#F9FAFB";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.color = "#6B7280";
                  }}
                >
                 <X size={18} />
                </button>
              </div>
            </div>{/* ── end header ── */}

            {/* ── Main content area ── */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              {/* ── LEFT: Graph Canvas (70%) ── */}
              <div
                style={{
                  flex: "1 1 70%",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {isLoading ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "50%",
                        border: "3px solid rgba(253,176,34,0.15)",
                        borderTopColor: "#FDB022",
                        animation: "spin 0.9s linear infinite",
                      }}
                    />
                    <div style={{ textAlign: "center" }}>
                      <p style={{ color: "#F9FAFB", fontSize: "14px", fontWeight: 600 }}>
                        Building character graph…
                      </p>
                      <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: 4 }}>
                        Analyzing screenplay for character relationships
                      </p>
                    </div>
                  </div>
                ) : error ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <p style={{ color: "#F87171", fontSize: "14px", fontWeight: 600 }}>
                        Failed to load character data
                      </p>
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "12px",
                          marginTop: 6,
                        }}
                      >
                        {(error as Error)?.message}
                      </p>
                    </div>
                  </div>
                ) : nodes.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <Clapperboard
                        size={40}
                        style={{ color: "#374151", margin: "0 auto 16px" }}
                      />
                      <p style={{ color: "#6B7280", fontSize: "14px", fontWeight: 600 }}>
                        No characters found in this screenplay
                      </p>
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "12px",
                          marginTop: 6,
                        }}
                      >
                        Characters are detected from ALL-CAPS speaker cue lines.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "radial-gradient(ellipse at center, rgba(253,176,34,0.02) 0%, transparent 70%)",
                      position: "relative",
                    }}
                  >
                    {/* ── Graph filter toolbar ── */}
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        zIndex: 10,
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      {/* View mode toggle */}
                      <button
                        onClick={() => setViewMode(viewMode === "network" ? "characters_only" : "network")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "5px 10px",
                          borderRadius: 8,
                          border: "1px solid rgba(253,176,34,0.25)",
                          background: viewMode === "network"
                            ? "rgba(253,176,34,0.12)"
                            : "rgba(10,14,26,0.85)",
                          color: viewMode === "network" ? "#FDB022" : "#94A3B8",
                          fontSize: "10px",
                          fontWeight: 700,
                          cursor: "pointer",
                          backdropFilter: "blur(8px)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Network size={11} />
                        {viewMode === "network" ? "Full Graph" : "Characters Only"}
                      </button>

                      {/* Layout mode toggle */}
                      <button
                        onClick={() => setLayoutMode(layoutMode === "network" ? "hierarchy" : "network")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "5px 10px",
                          borderRadius: 8,
                          border: "1px solid rgba(253,176,34,0.25)",
                          background: layoutMode === "network"
                            ? "rgba(10,14,26,0.85)"
                            : "rgba(253,176,34,0.12)",
                          color: layoutMode === "network" ? "#94A3B8" : "#FDB022",
                          fontSize: "10px",
                          fontWeight: 700,
                          cursor: "pointer",
                          backdropFilter: "blur(8px)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Network size={11} />
                        {layoutMode === "network" ? "Network Layout" : "Hierarchy Layout"}
                      </button>

                      {/* Scene toggle */}
                      <button
                        onClick={() => setShowScenes(!showScenes)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "5px 10px",
                          borderRadius: 8,
                          border: `1px solid ${showScenes ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                          background: showScenes
                            ? "rgba(99,102,241,0.15)"
                            : "rgba(10,14,26,0.85)",
                          color: showScenes ? "#818CF8" : "#64748B",
                          fontSize: "10px",
                          fontWeight: 700,
                          cursor: "pointer",
                          backdropFilter: "blur(8px)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Film size={10} />
                        Scenes
                        {showScenes ? <Eye size={10} /> : <EyeOff size={10} />}
                      </button>

                      {/* Location toggle */}
                      <button
                        onClick={() => setShowLocations(!showLocations)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "5px 10px",
                          borderRadius: 8,
                          border: `1px solid ${showLocations ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.08)"}`,
                          background: showLocations
                            ? "rgba(52,211,153,0.15)"
                            : "rgba(10,14,26,0.85)",
                          color: showLocations ? "#34D399" : "#64748B",
                          fontSize: "10px",
                          fontWeight: 700,
                          cursor: "pointer",
                          backdropFilter: "blur(8px)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <MapPin size={10} />
                        Locations
                        {showLocations ? <Eye size={10} /> : <EyeOff size={10} />}
                      </button>
                    </div>

                    {/* ── ReactFlow canvas ── */}
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onNodeClick={handleNodeClick}
                      nodeTypes={nodeTypes}
                      fitView
                      fitViewOptions={{ padding: 0.3 }}
                      minZoom={0.15}
                      maxZoom={3}
                      proOptions={{ hideAttribution: true }}
                      style={{ width: "100%", height: "100%" }}
                      defaultEdgeOptions={{
                        style: { strokeWidth: 2, stroke: "#FFFFFF" },
                      }}
                    >
                      <Background
                        color="rgba(253,176,34,0.03)"
                        gap={30}
                        size={1}
                      />
                      <Controls
                        position="bottom-left"
                        style={{
                          background: "rgba(10,14,26,0.95)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 12,
                          overflow: "hidden",
                        }}
                      />
                      <MiniMap
                        position="bottom-right"
                        style={{
                          background: "rgba(10,14,26,0.90)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 12,
                        }}
                        maskColor="rgba(0,0,0,0.6)"
                        nodeColor={(node) => {
                          const ntype = node.type;
                          if (ntype === "scene") return "#818CF8";
                          if (ntype === "location") return "#34D399";
                          const role = (node.data?.role as string) ?? "minor";
                          return ROLE_META[role as keyof typeof ROLE_META]?.color ?? "#475569";
                        }}
                      />
                    </ReactFlow>

                    {/* ── Node detail panel (slides in when a node is clicked) ── */}
                    {selectedNode && (
                      <div
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          width: 280,
                          maxHeight: "calc(100% - 24px)",
                          overflowY: "auto",
                          background: "rgba(10,14,26,0.96)",
                          border: "1px solid rgba(253,176,34,0.15)",
                          borderRadius: 14,
                          padding: "16px",
                          zIndex: 20,
                          backdropFilter: "blur(16px)",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        }}
                      >
                        {/* Close button */}
                        <button
                          onClick={() => setSelectedNode(null)}
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            background: "transparent",
                            border: "none",
                            color: "#64748B",
                            cursor: "pointer",
                            padding: 4,
                          }}
                        >
                          <X size={14} />
                        </button>

                        {/* Character detail */}
                        {selectedNode.type === "character" && (() => {
                          const charSummary = data?.summary?.find((s) => s.name === selectedNode.id);
                          const roleMeta = ROLE_META[(charSummary?.role ?? "minor") as keyof typeof ROLE_META];
                          const RoleIcon = roleMeta.Icon;
                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              {/* Header */}
                              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingRight: 20 }}>
                                <div
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    background: roleMeta.bg,
                                    border: `1.5px solid ${roleMeta.border}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: roleMeta.glow,
                                  }}
                                >
                                  <RoleIcon size={14} style={{ color: roleMeta.color }} />
                                </div>
                                <div>
                                  <div style={{ color: "#F9FAFB", fontSize: "14px", fontWeight: 700 }}>
                                    {selectedNode.id}
                                  </div>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                                    <span style={{ color: roleMeta.color, fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                      {roleMeta.label}
                                    </span>
                                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "9px" }}>
                                      {charSummary?.scene_count ?? 0} scenes
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Connections */}
                              {charSummary && charSummary.connections.length > 0 && (
                                <div>
                                  <div style={{ color: "#94A3B8", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>
                                    Connections ({charSummary.connections.length})
                                  </div>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    {charSummary.connections.slice(0, 8).map((conn) => {
                                      const relColor = getRelationshipColor(conn.relationship);
                                      return (
                                        <div
                                          key={conn.name}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            padding: "4px 6px",
                                            borderRadius: 6,
                                            background: "rgba(255,255,255,0.02)",
                                          }}
                                        >
                                          <Zap size={8} style={{ color: relColor, flexShrink: 0 }} />
                                          <span style={{ color: "#E2E8F0", fontSize: "10px", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {conn.name}
                                          </span>
                                          <span style={{ padding: "1px 5px", borderRadius: 4, background: `${relColor}15`, color: relColor, fontSize: "8px", fontWeight: 700, border: `1px solid ${relColor}30`, whiteSpace: "nowrap" }}>
                                            {conn.relationship}
                                          </span>
                                          {conn.first_meeting && (
                                            <span style={{ color: "rgba(253,176,34,0.5)", fontSize: "8px", flexShrink: 0 }}>
                                              S{conn.first_meeting}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Generate Summary button */}
                              <button
                                onClick={() => fetchExplanation(selectedNode.id)}
                                disabled={isExplaining}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 6,
                                  padding: "8px 14px",
                                  borderRadius: 10,
                                  border: "1px solid rgba(253,176,34,0.3)",
                                  background: "rgba(253,176,34,0.08)",
                                  color: "#FDB022",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  cursor: isExplaining ? "wait" : "pointer",
                                  opacity: isExplaining ? 0.6 : 1,
                                  transition: "all 0.2s ease",
                                }}
                              >
                                {isExplaining ? (
                                  <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
                                ) : (
                                  <><Sparkles size={12} /> Generate Summary</>
                                )}
                              </button>

                              {/* Explanation text */}
                              {explanation && (
                                <div
                                  style={{
                                    padding: "10px 12px",
                                    borderRadius: 10,
                                    background: "rgba(253,176,34,0.05)",
                                    border: "1px solid rgba(253,176,34,0.12)",
                                    color: "rgba(255,255,255,0.75)",
                                    fontSize: "11px",
                                    lineHeight: 1.5,
                                    fontStyle: "normal",
                                  }}
                                >
                                  {explanation}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Scene detail */}
                        {selectedNode.type === "scene" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingRight: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Film size={16} style={{ color: "#818CF8" }} />
                              <div>
                                <div style={{ color: "#E0E7FF", fontSize: "14px", fontWeight: 700 }}>
                                 Scene {selectedNode.data.scene_number ?? "?"}
                               </div>
                               <div style={{ color: "rgba(129,140,248,0.6)", fontSize: "10px", marginTop: 2 }}>
                                 {String(selectedNode.data.heading || "No heading")}
                                </div>
                              </div>
                            </div>
                            {selectedNode.data.location && (
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <MapPin size={10} style={{ color: "#34D399" }} />
                                <span style={{ color: "#D1FAE5", fontSize: "11px" }}>{String(selectedNode.data.location ?? "")}</span>
                              </div>
                            )}
                            {(selectedNode.data.page_start ?? 0) > 0 && (
                              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px" }}>
                                Pages {selectedNode.data.page_start}–{selectedNode.data.page_end}
                              </div>
                            )}
                            {(selectedNode.data.characters as string[])?.length > 0 && (
                              <div>
                                <div style={{ color: "#94A3B8", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                                  Characters in Scene
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                  {(selectedNode.data.characters as string[]).map((c: string) => (
                                    <span
                                      key={c}
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: 6,
                                        background: "rgba(253,176,34,0.08)",
                                        border: "1px solid rgba(253,176,34,0.15)",
                                        color: "#FDB022",
                                        fontSize: "10px",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Location detail */}
                        {selectedNode.type === "location" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingRight: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <MapPin size={16} style={{ color: "#34D399" }} />
                              <div>
                                <div style={{ color: "#D1FAE5", fontSize: "14px", fontWeight: 700 }}>
                                   {String(selectedNode.data.label ?? "")}
                                </div>
                                <div style={{ color: "rgba(52,211,153,0.5)", fontSize: "10px", marginTop: 2 }}>
                                   {selectedNode.data.scene_count ?? 0} scenes at this location
                                </div>
                              </div>
                            </div>
                            {(selectedNode.data.scenes as number[])?.length > 0 && (
                              <div>
                                <div style={{ color: "#94A3B8", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                                  Scenes
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                  {(selectedNode.data.scenes as number[]).map((sn: number) => (
                                    <span
                                      key={sn}
                                      style={{
                                        padding: "2px 6px",
                                        borderRadius: 4,
                                        background: "rgba(99,102,241,0.10)",
                                        border: "1px solid rgba(99,102,241,0.20)",
                                        color: "#818CF8",
                                        fontSize: "10px",
                                        fontWeight: 600,
                                      }}
                                    >
                                      S{sn}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── RIGHT: Sidebar (30%) ── */}
              {!isLoading && !error && (
                <div
                  style={{
                    flex: "0 0 320px",
                    maxWidth: "360px",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    borderLeft: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(0,0,0,0.15)",
                  }}
                >
                  {/* Tab buttons */}
                  <div
                    style={{
                      display: "flex",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      flexShrink: 0,
                    }}
                  >
                    <button
                      onClick={() => setActiveTab("cast")}
                      style={{
                        flex: 1,
                        padding: "12px 16px",
                        background: activeTab === "cast" ? "rgba(253,176,34,0.06)" : "transparent",
                        border: "none",
                        borderBottom: activeTab === "cast" ? "2px solid #FDB022" : "2px solid transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        transition: "all 0.15s",
                      }}
                    >
                      <User size={13} style={{ color: activeTab === "cast" ? "#FDB022" : "#6B7280" }} />
                      <span
                        style={{
                          color: activeTab === "cast" ? "#FDB022" : "var(--text-muted)",
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                        }}
                      >
                        Cast
                      </span>
                      {totalCharacters > 0 && (
                        <span
                          style={{
                            padding: "1px 6px",
                            borderRadius: 6,
                            background: activeTab === "cast" ? "rgba(253,176,34,0.12)" : "rgba(255,255,255,0.06)",
                            color: activeTab === "cast" ? "#FDB022" : "#6B7280",
                            fontSize: "9px",
                            fontWeight: 700,
                          }}
                        >
                          {totalCharacters}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab("relationships")}
                      style={{
                        flex: 1,
                        padding: "12px 16px",
                        background: activeTab === "relationships" ? "rgba(255,255,255,0.06)" : "transparent",
                        border: "none",
                        borderBottom: activeTab === "relationships" ? "2px solid #FFFFFF" : "2px solid transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        transition: "all 0.15s",
                      }}
                    >
                      <Link2 size={13} style={{ color: activeTab === "relationships" ? "#FFFFFF" : "#6B7280" }} />
                      <span
                        style={{
                          color: activeTab === "relationships" ? "#FFFFFF" : "var(--text-muted)",
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                        }}
                      >
                        Relations
                      </span>
                      {relationships.length > 0 && (
                        <span
                          style={{
                            padding: "1px 6px",
                            borderRadius: 6,
                            background: activeTab === "relationships" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                            color: activeTab === "relationships" ? "#FFFFFF" : "#6B7280",
                            fontSize: "9px",
                            fontWeight: 700,
                          }}
                        >
                          {relationships.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Tab content - scrollable */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                    {activeTab === "cast" ? (
                      /* ── Cast List ── */
                      data?.summary && data.summary.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {data.summary.map((char) => {
                            const meta = ROLE_META[char.role];
                            const { Icon } = meta;
                            const isOpen = expandedChar === char.name;

                            return (
                              <div key={char.name}>
                                <button
                                  id={`char-${char.name.replace(/\s/g, "-")}`}
                                  onClick={() =>
                                    setExpandedChar(isOpen ? null : char.name)
                                  }
                                  style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "10px 12px",
                                    borderRadius: 12,
                                    border: `1px solid ${isOpen ? meta.border : "transparent"}`,
                                    background: isOpen ? meta.bg : "transparent",
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                    textAlign: "left",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isOpen)
                                      e.currentTarget.style.background =
                                        "rgba(255,255,255,0.03)";
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isOpen)
                                      e.currentTarget.style.background = "transparent";
                                  }}
                                >
                                  {/* Role icon pill */}
                                  <div
                                    style={{
                                      width: 30,
                                      height: 30,
                                      borderRadius: 10,
                                      background: meta.bg,
                                      border: `1.5px solid ${meta.border}`,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <Icon size={13} style={{ color: meta.color }} />
                                  </div>

                                  {/* Name + scenes */}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        color: "#F9FAFB",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {char.name}
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 5,
                                        marginTop: 2,
                                        alignItems: "center",
                                      }}
                                    >
                                      <span
                                        style={{
                                          color: meta.color,
                                          fontSize: "9px",
                                          fontWeight: 800,
                                          textTransform: "uppercase",
                                          letterSpacing: "0.10em",
                                        }}
                                      >
                                        {meta.label}
                                      </span>
                                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "9px" }}>·</span>
                                      <span
                                        style={{
                                          color: "rgba(255,255,255,0.4)",
                                          fontSize: "10px",
                                          fontWeight: 500,
                                        }}
                                      >
                                        {char.scene_count} {char.scene_count !== 1 ? "scenes" : "scene"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Chevron */}
                                  <div style={{ color: "#374151", flexShrink: 0 }}>
                                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </div>
                                </button>

                                {/* Expanded: connections with relationship labels */}
                                <AnimatePresence>
                                  {isOpen && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.18 }}
                                      style={{ overflow: "hidden" }}
                                    >
                                      <div style={{ padding: "8px 12px 10px 52px" }}>
                                        {/* Scene numbers */}
                                        <p
                                          style={{
                                            color: "var(--text-muted)",
                                            fontSize: "9px",
                                            fontWeight: 700,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.12em",
                                            marginBottom: 6,
                                          }}
                                        >
                                          Appears in scenes
                                        </p>
                                        <div
                                          style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: 4,
                                            marginBottom: 12,
                                          }}
                                        >
                                          {char.scenes.map((s) => (
                                            <span
                                              key={s}
                                              style={{
                                                padding: "2px 7px",
                                                borderRadius: 6,
                                                background: "rgba(253,176,34,0.08)",
                                                color: "#FDB022",
                                                border: "1px solid rgba(253,176,34,0.18)",
                                                fontSize: "9px",
                                                fontWeight: 700,
                                              }}
                                            >
                                              #{s}
                                            </span>
                                          ))}
                                        </div>

                                        {/* Connections with relationship labels */}
                                        {char.connections.length > 0 && (
                                          <>
                                            <p
                                              style={{
                                                color: "var(--text-muted)",
                                                fontSize: "9px",
                                                fontWeight: 700,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.12em",
                                                marginBottom: 6,
                                              }}
                                            >
                                              Connections
                                            </p>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                              {char.connections.map((conn) => {
                                                const relColor = getRelationshipColor(conn.relationship);
                                                const confPct = Math.round((conn.confidence ?? 0) * 100);
                                                const confColor = confPct >= 85 ? "#34D399" : confPct >= 70 ? "#FBBF24" : "#F87171";
                                                return (
                                                  <div
                                                    key={conn.name}
                                                    style={{
                                                      display: "flex",
                                                      flexDirection: "column",
                                                      gap: 4,
                                                      padding: "6px 8px",
                                                      borderRadius: 8,
                                                      background: "rgba(255,255,255,0.02)",
                                                      border: "1px solid rgba(255,255,255,0.04)",
                                                    }}
                                                  >
                                                    {/* Top row: icon, name, relationship, confidence, scene count */}
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                      <Zap size={10} style={{ color: relColor, flexShrink: 0 }} />
                                                      <span
                                                        style={{
                                                          color: "#E2E8F0",
                                                          fontSize: "11px",
                                                          fontWeight: 600,
                                                          flex: 1,
                                                          overflow: "hidden",
                                                          textOverflow: "ellipsis",
                                                          whiteSpace: "nowrap",
                                                        }}
                                                      >
                                                        {conn.name}
                                                      </span>
                                                      <span
                                                        style={{
                                                          padding: "2px 6px",
                                                          borderRadius: 5,
                                                          background: `${relColor}15`,
                                                          color: relColor,
                                                          fontSize: "9px",
                                                          fontWeight: 700,
                                                          border: `1px solid ${relColor}30`,
                                                          whiteSpace: "nowrap",
                                                        }}
                                                      >
                                                        {conn.relationship}
                                                      </span>
                                                      {/* Confidence badge */}
                                                      <span
                                                        title={`Confidence: ${confPct}%`}
                                                        style={{
                                                          padding: "1px 5px",
                                                          borderRadius: 4,
                                                          background: `${confColor}15`,
                                                          color: confColor,
                                                          fontSize: "8px",
                                                          fontWeight: 800,
                                                          border: `1px solid ${confColor}30`,
                                                          flexShrink: 0,
                                                        }}
                                                      >
                                                        {confPct}%
                                                      </span>
                                                      <span
                                                        style={{
                                                          color: "rgba(255,255,255,0.3)",
                                                          fontSize: "9px",
                                                          flexShrink: 0,
                                                        }}
                                                      >
                                                        {conn.shared_scenes}s
                                                      </span>
                                                    </div>
                                                    {/* Bottom row: first meeting + supporting text */}
                                                    {(conn.first_meeting || conn.supporting_text) && (
                                                      <div style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 2 }}>
                                                        {conn.first_meeting && (
                                                          <span style={{ color: "rgba(253,176,34,0.6)", fontSize: "9px", fontWeight: 500 }}>
                                                            First meet: Scene #{conn.first_meeting}
                                                          </span>
                                                        )}
                                                        {conn.supporting_text && (
                                                          <span
                                                            style={{
                                                              color: "rgba(255,255,255,0.35)",
                                                              fontSize: "9px",
                                                              fontStyle: "italic",
                                                              lineHeight: 1.3,
                                                              overflow: "hidden",
                                                              textOverflow: "ellipsis",
                                                              display: "-webkit-box",
                                                              WebkitLineClamp: 2,
                                                              WebkitBoxOrient: "vertical",
                                                            }}
                                                            >
                                                              &quot;{conn.supporting_text}&quot;
                                                            </span>
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            color: "var(--text-muted)",
                            fontSize: "12px",
                          }}
                        >
                          No characters detected.
                        </div>
                      )
                    ) : (
                      /* ── Relationships List ── */
                      relationships.length === 0 ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            color: "var(--text-muted)",
                            fontSize: "12px",
                            textAlign: "center",
                          }}
                        >
                          No relationships detected between characters.
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {relationships.map((rel, i) => {
                            const relColor = getRelationshipColor(rel.relationship);
                            const barPct = Math.max(8, (rel.scenes / maxRelScenes) * 100);
                            return (
                              <motion.div
                                key={`${rel.a}\0${rel.b}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                style={{
                                  padding: "10px 12px",
                                  borderRadius: 12,
                                  background: "rgba(255,255,255,0.02)",
                                  border: "1px solid rgba(255,255,255,0.05)",
                                }}
                              >
                                {/* Character names row */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: 4,
                                  }}
                                >
                                  <span
                                    style={{
                                      color: rel.colorA,
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      maxWidth: "30%",
                                    }}
                                  >
                                    {rel.a}
                                  </span>

                                  {/* Relationship badge + confidence */}
                                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <span
                                      style={{
                                        padding: "3px 10px",
                                        borderRadius: 20,
                                        background: `${relColor}15`,
                                        color: relColor,
                                        fontSize: "10px",
                                        fontWeight: 700,
                                        border: `1px solid ${relColor}30`,
                                        whiteSpace: "nowrap",
                                        letterSpacing: "0.02em",
                                      }}
                                    >
                                      {rel.relationship}
                                    </span>
                                    {rel.confidence > 0 && (
                                      <span
                                        title={`Confidence: ${Math.round(rel.confidence * 100)}%`}
                                        style={{
                                          padding: "2px 5px",
                                          borderRadius: 4,
                                          background: rel.confidence >= 0.85
                                            ? "rgba(52,211,153,0.12)"
                                            : rel.confidence >= 0.70
                                            ? "rgba(255,255,255,0.12)"
                                            : "rgba(248,113,113,0.12)",
                                          color: rel.confidence >= 0.85
                                            ? "#34D399"
                                            : rel.confidence >= 0.70
                                            ? "#FBBF24"
                                            : "#F87171",
                                          fontSize: "8px",
                                          fontWeight: 800,
                                          border: `1px solid ${
                                            rel.confidence >= 0.85
                                              ? "rgba(52,211,153,0.3)"
                                              : rel.confidence >= 0.70
                                              ? "rgba(255,255,255,0.3)"
                                              : "rgba(248,113,113,0.3)"
                                          }`,
                                        }}
                                      >
                                       {Math.round(Number(rel.confidence) * 100)}%
                                      </span>
                                    )}
                                  </div>

                                  <span
                                    style={{
                                      color: rel.colorB,
                                      fontSize: "12px",
                                      fontWeight: 700,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      maxWidth: "30%",
                                      textAlign: "right",
                                    }}
                                  >
                                    {rel.b}
                                  </span>
                                </div>

                                {/* First meeting + supporting text */}
                                {(rel.first_meeting || rel.supporting_text) && (
                                  <div style={{ marginBottom: 6 }}>
                                    {rel.first_meeting && (
                                      <span style={{ color: "rgba(253,176,34,0.5)", fontSize: "9px", fontWeight: 500 }}>
                                        First meet: Scene #{rel.first_meeting}
                                        {rel.supporting_text ? " · " : ""}
                                      </span>
                                    )}
                                    {rel.supporting_text && (
                                      <span
                                        style={{
                                          color: "rgba(255,255,255,0.3)",
                                          fontSize: "9px",
                                          fontStyle: "italic",
                                        }}
                                      >
                                        &quot;{rel.supporting_text.length > 80 ? rel.supporting_text.slice(0, 77) + "..." : rel.supporting_text}&quot;
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Bar + count */}
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <div
                                    style={{
                                      flex: 1,
                                      height: 4,
                                      borderRadius: 2,
                                      background: "rgba(255,255,255,0.05)",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${barPct}%`,
                                        height: "100%",
                                        borderRadius: 2,
                                        background: `linear-gradient(90deg, ${rel.colorA}, ${relColor})`,
                                        transition: "width 0.4s ease",
                                      }}
                                    />
                                  </div>
                                  <span
                                    style={{
                                      color: "var(--text-muted)",
                                      fontSize: "10px",
                                      fontWeight: 600,
                                      flexShrink: 0,
                                      minWidth: 52,
                                      textAlign: "right",
                                    }}
                                  >
                                    {rel.scenes}{" "}
                                    {rel.scenes === 1 ? "scene" : "scenes"}
                                  </span>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
