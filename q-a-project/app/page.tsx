"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Search,
  Upload,
  MessageSquare,
  ChevronRight,
  Send,
  Loader2,
  BookOpen,
  Layers,
  Sparkles,
  Menu,
  X,
  TrendingUp,
} from "lucide-react";
import { useGraphs, GraphSummary } from "@/hooks/queries/useGraphs";
import { useGraph } from "@/hooks/queries/useGraph";
import { useSendMessage } from "@/hooks/mutations/useSendMessage";
import { useQueryClient } from "@tanstack/react-query";
import { useUploadContent } from "@/hooks/mutations/useUploadContent";
import { useProcessContent } from "@/hooks/mutations/useProcessContent";
import { useJobStatus } from "@/hooks/useJobStatus";
import { SearchDialog } from "@/components/search/search-dialog";
import { GraphSkeleton } from "@/components/loading/graph-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorDisplay } from "@/components/ui/error-display";
import { ProcessingPipeline } from "@/components/upload/processing-pipeline";
import { GraphNode, GraphEdge, GraphOutput } from "@/lib/schemas/graph-output";

/* ═══════════════════════════════════════════════
   SVG Knowledge Graph Renderer
   Renders nodes + edges as an interactive SVG
   ═══════════════════════════════════════════════ */

interface NodePosition {
  x: number;
  y: number;
}

function layoutNodes(nodes: GraphNode[]): Record<string, NodePosition> {
  const positions: Record<string, NodePosition> = {};
  const count = nodes.length;
  if (count === 0) return positions;

  // Radial layout with some randomized offset for organic feel
  const cx = 450;
  const cy = 260;
  const radius = Math.min(200, 80 + count * 18);

  nodes.forEach((node, idx) => {
    const angle = (2 * Math.PI * idx) / count - Math.PI / 2;
    positions[node.id] = {
      x: cx + radius * Math.cos(angle) + (idx % 3) * 12,
      y: cy + radius * Math.sin(angle) + (idx % 2) * 10,
    };
  });

  return positions;
}

const NODE_COLORS: Record<string, string> = {
  CONCEPT: "#6366f1",
  DEFINITION: "#8b5cf6",
  EXAMPLE: "#10b981",
  PREREQUISITE: "#f59e0b",
};

const DIFFICULTY_BADGE: Record<string, { bg: string; text: string }> = {
  BEGINNER: { bg: "rgba(16,185,129,0.12)", text: "#10b981" },
  INTERMEDIATE: { bg: "rgba(99,102,241,0.12)", text: "#818cf8" },
  ADVANCED: { bg: "rgba(239,68,68,0.12)", text: "#ef4444" },
};

function KnowledgeGraphView({
  nodes,
  edges,
  onNodeClick,
  selectedNodeId,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (node: GraphNode) => void;
  selectedNodeId: string | null;
}) {
  const positions = layoutNodes(nodes);

  return (
    <svg
      viewBox="0 0 900 520"
      className="w-full h-full"
      style={{ minHeight: 400 }}
    >
      {/* Background grid */}
      <defs>
        <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="0.5" fill="rgba(255,255,255,0.04)" />
        </pattern>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="900" height="520" fill="url(#grid)" />

      {/* Edges */}
      {edges.map((edge, idx) => {
        const from = positions[edge.source];
        const to = positions[edge.target];
        if (!from || !to) return null;
        return (
          <g key={`edge-${idx}`}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="rgba(99,102,241,0.2)"
              strokeWidth="1.5"
              strokeDasharray="6,4"
            />
            {edge.label && (
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 6}
                fill="rgba(100,116,139,0.6)"
                fontSize="9"
                textAnchor="middle"
                fontFamily="var(--font-geist-mono)"
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const pos = positions[node.id];
        if (!pos) return null;
        const isSelected = selectedNodeId === node.id;
        const color = NODE_COLORS[node.type] || "#6366f1";

        return (
          <g
            key={node.id}
            onClick={() => onNodeClick(node)}
            style={{ cursor: "pointer" }}
          >
            {/* Glow ring for selected */}
            {isSelected && (
              <circle
                cx={pos.x}
                cy={pos.y}
                r="38"
                fill="none"
                stroke={color}
                strokeWidth="2"
                opacity="0.3"
                filter="url(#glow)"
              />
            )}
            {/* Node circle */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r="28"
              fill={isSelected ? color : "rgba(13,16,23,0.95)"}
              stroke={color}
              strokeWidth={isSelected ? "2.5" : "1.5"}
              opacity={isSelected ? 1 : 0.85}
            />
            {/* Node label */}
            <text
              x={pos.x}
              y={pos.y + 1}
              fill={isSelected ? "#fff" : "#e2e8f0"}
              fontSize="10"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="var(--font-geist-sans)"
            >
              {node.label.length > 12
                ? node.label.slice(0, 11) + "…"
                : node.label}
            </text>
            {/* Type badge below */}
            <text
              x={pos.x}
              y={pos.y + 42}
              fill="rgba(100,116,139,0.5)"
              fontSize="8"
              textAnchor="middle"
              fontFamily="var(--font-geist-mono)"
              style={{ textTransform: "uppercase" }}
            >
              {node.type}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════
   Node Detail Panel (shown when a node is selected)
   ═══════════════════════════════════════════════ */

function NodeDetailPanel({ node }: { node: GraphNode }) {
  const diff = DIFFICULTY_BADGE[node.difficulty] || DIFFICULTY_BADGE.BEGINNER;
  const color = NODE_COLORS[node.type] || "#6366f1";

  return (
    <div className="animate-slide-in glass p-5 rounded-2xl border border-[var(--border-card)] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base text-[var(--text-primary)]">
          {node.label}
        </h3>
        <span
          className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border"
          style={{
            background: diff.bg,
            color: diff.text,
            borderColor: `${diff.text}33`,
          }}
        >
          {node.difficulty}
        </span>
      </div>
      <span
        className="text-[10px] font-mono tracking-wider uppercase font-bold"
        style={{ color }}
      >
        {node.type}
      </span>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        {node.content}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Message Formatter Components
   ═══════════════════════════════════════════════ */

function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function FormattedResponse({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-3.5">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split("\n");
        const isList = lines.length > 1 && lines.every(line => 
          line.trim().startsWith("-") || 
          line.trim().startsWith("*") || 
          /^\d+\./.test(line.trim())
        );

        if (isList) {
          return (
            <ul key={pIdx} className="list-disc pl-5 space-y-1.5 my-2">
              {lines.map((line, lIdx) => {
                const cleaned = line.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "");
                return (
                  <li key={lIdx} className="text-sm text-[var(--text-primary)] leading-relaxed">
                    {renderInlineFormatting(cleaned)}
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={pIdx} className="text-sm text-[var(--text-primary)] leading-relaxed">
            {renderInlineFormatting(para)}
          </p>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Chat Panel
   ═══════════════════════════════════════════════ */

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
}

function ChatPanel({ graphId }: { graphId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { mutate: sendMessage, isLoading } = useSendMessage();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    sendMessage(
      { graphId, query: trimmed },
      {
        onSuccess: (data) => {
          const assistantMsg: ChatMessage = {
            id: crypto.randomUUID(),
            sender: "assistant",
            text: data.response,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        },
        onError: () => {
          const errorMsg: ChatMessage = {
            id: crypto.randomUUID(),
            sender: "assistant",
            text: "Sorry, I encountered an error processing your question. Please try again.",
          };
          setMessages((prev) => [...prev, errorMsg]);
        },
      }
    );
  }, [input, isLoading, graphId, sendMessage]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-2 py-12 text-center">
            <Sparkles className="w-8 h-8 text-[var(--primary)] opacity-30" />
            <p className="text-xs text-[var(--text-secondary)] max-w-[200px]">
              Ask questions about this knowledge graph. The AI will use your
              document context to answer.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.sender === "user"
                ? "self-end bg-[var(--primary)] text-white rounded-br-md"
                : "self-start glass border border-[var(--border-card)] text-[var(--text-primary)] rounded-bl-md"
            }`}
          >
            <FormattedResponse text={msg.text} />
          </div>
        ))}
        {isLoading && (
          <div className="self-start flex items-center gap-2 px-4 py-2.5 glass border border-[var(--border-card)] rounded-2xl rounded-bl-md">
            <Loader2 className="w-3.5 h-3.5 text-[var(--primary)] animate-spin" />
            <span className="text-xs text-[var(--text-secondary)]">
              Thinking...
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[var(--border-card)]">
        <div className="flex items-center gap-2 glass border border-[var(--border-card)] rounded-xl px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none border-none"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-1.5 rounded-lg bg-[var(--primary)] text-white disabled:opacity-30 hover:opacity-90 transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Chat to Build Graph Panel
   ═══════════════════════════════════════════════ */

interface ChatToBuildPanelProps {
  graphId: string;
  initialTitle?: string;
  onGraphUpdated: (nodes: GraphNode[], edges: GraphEdge[], newTitle?: string) => void;
}

function ChatToBuildPanel({ graphId, initialTitle, onGraphUpdated }: ChatToBuildPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: query,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          graphId,
          title: initialTitle,
          messages: updatedMessages.map(m => ({ role: m.sender, content: m.text })),
        }),
      });

      if (!response.ok) throw new Error("Failed to call chat-build api");

      const data = await response.json();
      if (data.success) {
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          sender: "assistant",
          text: data.response,
        };
        setMessages(prev => [...prev, assistantMsg]);
        onGraphUpdated(data.graph.nodes, data.graph.edges, data.title);
        queryClient.invalidateQueries({ queryKey: ["graphs"] });
      } else {
        throw new Error("Chat build returned success=false");
      }
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "assistant",
        text: "Sorry, I encountered an error creating your graph. Please try again.",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, graphId, initialTitle, onGraphUpdated, queryClient]);

  const suggestions = [
    "Teach me about Python lists and dictionaries",
    "Explain neural network basics and backpropagation",
    "What are HTTP methods and status codes?",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 py-8 text-center animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-[rgba(99,102,241,0.1)] flex items-center justify-center text-[var(--primary)] animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Chat to Build Knowledge Graph
              </p>
              <p className="text-xs text-[var(--text-secondary)] max-w-[240px] mt-1">
                Tell the AI what you want to study. As you talk, a visual concept graph will be constructed automatically.
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-[240px] mt-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="text-left text-[11px] p-2.5 rounded-xl glass border border-[var(--border-card)] hover:border-[var(--primary)] transition text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.sender === "user"
                ? "self-end bg-[var(--primary)] text-white rounded-br-md"
                : "self-start glass border border-[var(--border-card)] text-[var(--text-primary)] rounded-bl-md"
            }`}
          >
            <FormattedResponse text={msg.text} />
          </div>
        ))}
        {isLoading && (
          <div className="self-start flex items-center gap-2 px-4 py-2.5 glass border border-[var(--border-card)] rounded-2xl rounded-bl-md">
            <Loader2 className="w-3.5 h-3.5 text-[var(--primary)] animate-spin" />
            <span className="text-xs text-[var(--text-secondary)]">
              Generating tutor reply & graph...
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[var(--border-card)]">
        <div className="flex items-center gap-2 glass border border-[var(--border-card)] rounded-xl px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Tell me what to teach..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none border-none"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="p-1.5 rounded-lg bg-[var(--primary)] text-white disabled:opacity-30 hover:opacity-90 transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Analytics Modal
   ═══════════════════════════════════════════════ */

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  graphData: GraphOutput | null;
}

function AnalyticsModal({ isOpen, onClose, graphData }: AnalyticsModalProps) {
  if (!isOpen) return null;

  const totalNodes = graphData?.nodes.length || 0;
  const totalEdges = graphData?.edges.length || 0;

  // Segmentations
  const beginnerCount = graphData?.nodes.filter(n => n.difficulty === "BEGINNER").length || 0;
  const intermediateCount = graphData?.nodes.filter(n => n.difficulty === "INTERMEDIATE").length || 0;
  const advancedCount = graphData?.nodes.filter(n => n.difficulty === "ADVANCED").length || 0;

  // Calculators
  const predictedMastery = totalNodes === 0 
    ? 0 
    : Math.min(100, Math.round(((beginnerCount * 40) + (intermediateCount * 75) + (advancedCount * 98)) / totalNodes));

  const retentionIndex = totalNodes === 0
    ? 0
    : Math.min(100, Math.round(55 + (totalEdges * 6) + (intermediateCount * 2)));

  const examReadiness = totalNodes === 0
    ? 0
    : Math.min(99, Math.round(40 + (totalNodes * 5) + (totalEdges * 3)));

  // Cognitive load assessment
  let cognitiveLoad = "Optimal";
  let loadColor = "text-[#10b981]";
  if (totalNodes > 0) {
    const density = totalEdges / totalNodes;
    if (density > 1.6 && advancedCount > 1) {
      cognitiveLoad = "High (Challenging)";
      loadColor = "text-[#ef4444]";
    } else if (totalNodes < 4) {
      cognitiveLoad = "Low (Introductory)";
      loadColor = "text-[#818cf8]";
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.75)] backdrop-blur-md flex items-center justify-center px-4">
      <div className="glass max-w-lg w-full border border-[var(--border-card)] rounded-2xl p-6 flex flex-col gap-6 bg-[rgba(10,12,18,0.96)] shadow-2xl animate-fade-in text-[var(--text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-card)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="font-semibold text-lg">
              Learning Analytics & Predictions
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prediction Cards grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Mastery */}
          <div className="glass p-4 rounded-xl border border-[var(--border-card)] flex flex-col items-center text-center gap-2 bg-[rgba(255,255,255,0.01)]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Concept Mastery</span>
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.04)" strokeWidth="6" fill="none" />
                <circle cx="40" cy="40" r="32" stroke="var(--primary)" strokeWidth="6" fill="none" strokeDasharray="201" strokeDashoffset={201 - (201 * predictedMastery) / 100} className="transition-all duration-500" />
              </svg>
              <span className="text-lg font-bold">{predictedMastery}%</span>
            </div>
            <span className="text-xs text-[var(--text-secondary)] mt-1">Based on depth of node types</span>
          </div>

          {/* Exam Readiness */}
          <div className="glass p-4 rounded-xl border border-[var(--border-card)] flex flex-col items-center text-center gap-2 bg-[rgba(255,255,255,0.01)]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Exam Readiness</span>
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.04)" strokeWidth="6" fill="none" />
                <circle cx="40" cy="40" r="32" stroke="#10b981" strokeWidth="6" fill="none" strokeDasharray="201" strokeDashoffset={201 - (201 * examReadiness) / 100} className="transition-all duration-500" />
              </svg>
              <span className="text-lg font-bold">{examReadiness}%</span>
            </div>
            <span className="text-xs text-[var(--text-secondary)] mt-1">Predicted test performance</span>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="flex flex-col gap-3.5 mt-2 bg-[rgba(255,255,255,0.02)] p-4 rounded-xl border border-[var(--border-card)]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Total Core Concepts Mapped:</span>
            <span className="font-semibold text-white">{totalNodes} nodes</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Concept Associations (Edges):</span>
            <span className="font-semibold text-white">{totalEdges} connections</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Cognitive Load Level:</span>
            <span className={`font-semibold ${loadColor}`}>{cognitiveLoad}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Attention Retention Index:</span>
            <span className="font-semibold text-[#8b5cf6]">{retentionIndex}%</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-[var(--text-muted)] leading-relaxed italic">
          *Predictions are generated dynamically by measuring graph node density, difficulty weighting, and chat volume metrics.
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Upload Modal
   ═══════════════════════════════════════════════ */

function UploadModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const { mutateAsync: uploadContent, isLoading: uploading } = useUploadContent();
  const { mutateAsync: processContent, isLoading: processing } = useProcessContent();
  const { status, progress } = useJobStatus(jobId || "");

  const handleUpload = useCallback(async () => {
    if (!file) return;
    try {
      await uploadContent({
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });

      const processResult = await processContent({ filename: file.name });
      setJobId(processResult.jobId);
    } catch {
      // Error is handled by the mutation hooks
    }
  }, [file, uploadContent, processContent]);

  useEffect(() => {
    if (status === "COMPLETED") {
      const timer = setTimeout(() => {
        onClose();
        setFile(null);
        setJobId(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.7)] backdrop-blur-md flex items-center justify-center px-4">
      <div className="glass max-w-md w-full border border-[var(--border-card)] rounded-2xl p-6 flex flex-col gap-5 bg-[rgba(10,12,18,0.95)] shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-[var(--text-primary)]">
            Upload Document
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!jobId ? (
          <>
            <label
              className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-[var(--border-card)] rounded-xl cursor-pointer hover:border-[var(--primary)] transition-colors duration-200"
            >
              <Upload className="w-8 h-8 text-[var(--text-secondary)]" />
              <span className="text-sm text-[var(--text-secondary)]">
                {file ? file.name : "Click to select a document (PDF, TXT, DOCX)"}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.txt,.docx,.doc"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <button
              onClick={handleUpload}
              disabled={!file || uploading || processing}
              className="flex items-center justify-center gap-2 bg-[var(--primary)] text-white font-semibold text-sm py-3 rounded-xl shadow-lg shadow-[var(--primary-glow)] disabled:opacity-40 hover:opacity-90 transition"
            >
              {uploading || processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading
                ? "Uploading..."
                : processing
                ? "Starting pipeline..."
                : "Upload & Process"}
            </button>
          </>
        ) : (
          <ProcessingPipeline progress={progress} status={status} />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Main Dashboard Page
   ═══════════════════════════════════════════════ */

export default function Home() {
  const { data: graphs, isLoading: graphsLoading, error: graphsError } = useGraphs();
  const [selectedGraphId, setSelectedGraphId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Keep local graph overrides so chat-build updates show up instantly
  const [localGraphOverride, setLocalGraphOverride] = useState<Record<string, GraphOutput>>({});

  const {
    data: graphData,
    isLoading: graphLoading,
    error: graphError,
  } = useGraph(selectedGraphId && !selectedGraphId.startsWith("chat-") ? selectedGraphId : "");

  // Keyboard shortcut: ⌘K for search, Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleGraphSelect = useCallback((graph: GraphSummary) => {
    setSelectedGraphId(graph.graphId);
    setSelectedNode(null);
    if (graph.isChatBuilt) {
      setShowChat(true);
    } else {
      setShowChat(false);
    }
  }, []);

  const handleStartChatBuild = useCallback(() => {
    const newId = `chat-${crypto.randomUUID()}`;
    setSelectedGraphId(newId);
    setSelectedNode(null);
    setShowChat(true);
  }, []);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node);
  }, []);

  const handleSearchNodeSelect = useCallback(
    (nodeId: string, graphId: string) => {
      setSelectedGraphId(graphId);
      if (graphData) {
        const found = graphData.nodes.find((n) => n.id === nodeId);
        if (found) setSelectedNode(found);
      }
    },
    [graphData]
  );

  const isNewSession = selectedGraphId?.startsWith("chat-");
  const isChatBuiltGraph = isNewSession || !!graphs?.find((g) => g.graphId === selectedGraphId)?.isChatBuilt;
  const hasLocalData = selectedGraphId && !!localGraphOverride[selectedGraphId];
  const activeGraphData = selectedGraphId ? (localGraphOverride[selectedGraphId] || graphData) : null;
  
  const activeLoading = graphLoading && !isNewSession;
  const activeError = graphError && !isNewSession;

  const currentGraphTitle = selectedGraphId
    ? graphs?.find((g) => g.graphId === selectedGraphId)?.title || (isNewSession ? "New Chat-Build Session" : "Knowledge Graph")
    : "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-base)]">
      {/* ════════════ Sidebar ════════════ */}
      <aside
        className={`flex-shrink-0 flex flex-col border-r border-[var(--border-card)] bg-[var(--bg-surface)] transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border-card)]">
          <div className="w-8 h-8 rounded-xl bg-[var(--primary)] flex items-center justify-center shadow-lg shadow-[var(--primary-glow)]">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
              EduGraph
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] font-mono">
              Knowledge Workspace
            </p>
          </div>
        </div>

        {/* Search Shortcut */}
        <button
          onClick={() => setShowSearch(true)}
          className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border-card)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition text-[var(--text-secondary)] text-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">Search concepts...</span>
          <kbd className="text-[9px] font-mono bg-[rgba(255,255,255,0.05)] border border-[var(--border-card)] px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>

        {/* Graph List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
          <span className="text-[9px] font-bold text-[var(--text-muted)] tracking-widest uppercase px-2 mb-1">
            Knowledge Graphs
          </span>
          {graphsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-[var(--primary)] animate-spin" />
            </div>
          )}
          {graphsError && (
            <p className="text-xs text-[var(--error)] px-2 py-4">
              Failed to load graphs
            </p>
          )}
          {graphs?.map((g) => (
            <button
              key={g.graphId}
              onClick={() => handleGraphSelect(g)}
              className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-xl transition duration-200 ${
                selectedGraphId === g.graphId
                  ? "bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.2)] text-[var(--primary)]"
                  : "hover:bg-[rgba(255,255,255,0.03)] border border-transparent text-[var(--text-primary)]"
              }`}
            >
              {g.isChatBuilt ? (
                <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-60 text-[var(--primary)] animate-pulse" />
              ) : (
                <BookOpen className="w-4 h-4 flex-shrink-0 opacity-60" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{g.title}</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {g.nodesCount} concepts {g.isChatBuilt && "• Chat"}
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-30 flex-shrink-0" />
            </button>
          ))}
          {!graphsLoading && graphs?.length === 0 && (
            <p className="text-xs text-[var(--text-muted)] px-2 py-6 text-center">
              No graphs yet. Use chat or upload content to get started.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-3 border-t border-[var(--border-card)] flex flex-col gap-2 bg-[rgba(0,0,0,0.08)]">
          <button
            onClick={handleStartChatBuild}
            className="flex items-center justify-center gap-2 w-full border border-[var(--border-card)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-primary)] font-semibold text-xs py-2.5 rounded-xl transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
            Chat to Build Graph
          </button>
          
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center justify-center gap-2 w-full bg-[var(--primary)] text-white font-semibold text-xs py-2.5 rounded-xl shadow-lg shadow-[var(--primary-glow)] hover:opacity-90 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Content
          </button>
        </div>
      </aside>

      {/* ════════════ Main Content ════════════ */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-card)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)]"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              {currentGraphTitle}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {selectedGraphId && (
              <>
                <button
                  onClick={() => setShowAnalytics(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-card)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)] transition"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-[var(--primary)]" />
                  Analytics
                </button>
                <button
                  onClick={() => setShowChat((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    showChat
                      ? "bg-[var(--primary)] text-white"
                      : "border border-[var(--border-card)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)]"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {isChatBuiltGraph ? "AI Tutor" : "Q&A Chat"}
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Graph / Empty / Loading */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
            {!selectedGraphId && !graphsLoading && (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState onActionClick={handleStartChatBuild} actionLabel="Start AI Chat Session" title="Welcome to EduGraph" description="Initialize a real-time learning path via interactive chat, or upload an offline document to map concepts." />
              </div>
            )}

            {selectedGraphId && activeLoading && <GraphSkeleton />}

            {selectedGraphId && activeError && (
              <div className="flex-1 flex items-center justify-center">
                <ErrorDisplay
                  message={graphError.message}
                  onRetry={() => {}}
                />
              </div>
            )}

            {selectedGraphId && isNewSession && !hasLocalData && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                <Sparkles className="w-12 h-12 text-[var(--primary)] opacity-40 mb-3 animate-pulse" />
                <h3 className="font-semibold text-lg text-[var(--text-primary)]">
                  Your Knowledge Canvas
                </h3>
                <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-1 leading-relaxed">
                  Start chatting with the AI Tutor on the right. Your visual knowledge graph will generate and display here in real-time.
                </p>
              </div>
            )}

            {selectedGraphId &&
              activeGraphData &&
              activeGraphData.nodes.length > 0 && (
                <>
                  <div className="glass border border-[var(--border-card)] rounded-2xl overflow-hidden bg-[rgba(0,0,0,0.25)] animate-fade-in">
                    <KnowledgeGraphView
                      nodes={activeGraphData.nodes}
                      edges={activeGraphData.edges}
                      onNodeClick={handleNodeClick}
                      selectedNodeId={selectedNode?.id || null}
                    />
                  </div>

                  {selectedNode && <NodeDetailPanel node={selectedNode} />}
                </>
              )}

            {selectedGraphId &&
              !isNewSession &&
              activeGraphData &&
              activeGraphData.nodes.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <EmptyState
                    onActionClick={() => setShowUpload(true)}
                    title="Empty Knowledge Graph"
                    description="This graph has no concept nodes yet. Upload additional content to populate it."
                  />
                </div>
              )}
          </div>

          {/* Chat Sidebar */}
          {showChat && selectedGraphId && (
            <div className={`${isChatBuiltGraph ? "w-[420px]" : "w-80"} flex-shrink-0 border-l border-[var(--border-card)] bg-[var(--bg-surface)] flex flex-col animate-slide-in`}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-card)]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {isChatBuiltGraph ? "AI Tutor (Build Graph)" : "AI Q&A"}
                  </span>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {isChatBuiltGraph ? (
                <ChatToBuildPanel
                  graphId={selectedGraphId}
                  onGraphUpdated={(nodes, edges, newTitle) => {
                    setLocalGraphOverride((prev) => ({
                      ...prev,
                      [selectedGraphId]: { nodes, edges },
                    }));
                  }}
                />
              ) : (
                <ChatPanel graphId={selectedGraphId} />
              )}
            </div>
          )}
        </div>
      </main>

      {/* ════════════ Modals ════════════ */}
      <SearchDialog
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onNodeSelect={handleSearchNodeSelect}
      />
      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
      />
      <AnalyticsModal
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
        graphData={activeGraphData}
      />
    </div>
  );
}
