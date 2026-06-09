"use client";

import React, { useEffect, useRef } from "react";
import { Search, Loader2, Compass, AlertCircle } from "lucide-react";
import { useSearch, SearchResult } from "@/hooks/useSearch";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onNodeSelect: (nodeId: string, graphId: string) => void;
}

export function SearchDialog({ isOpen, onClose, onNodeSelect }: SearchDialogProps) {
  const { results, isLoading, error, search, query } = useSearch();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close dialog on clicking outside the card wrapper
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group search results by Graph Title
  const groupedResults: Record<string, SearchResult[]> = {};
  results.forEach((res) => {
    if (!groupedResults[res.graphTitle]) {
      groupedResults[res.graphTitle] = [];
    }
    groupedResults[res.graphTitle].push(res);
  });

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(0,0,0,0.7)] backdrop-blur-md flex items-start justify-center pt-24 px-4 transition-all duration-300">
      <div
        ref={dialogRef}
        className="glass max-w-xl w-full border border-[var(--border-card)] rounded-2xl flex flex-col overflow-hidden bg-[rgba(10,12,18,0.95)] shadow-2xl shadow-[var(--primary-glow)]"
      >
        {/* Search Input Area */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border-card)]">
          <Search className="w-5 h-5 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Type concepts to search semantically (e.g. nouns)..."
            className="flex-1 bg-transparent outline-none border-none text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
            autoFocus
          />
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-[var(--primary)] animate-spin" />
          ) : (
            <kbd className="text-[10px] bg-[rgba(255,255,255,0.05)] border border-[var(--border-card)] px-1.5 py-0.5 rounded font-mono text-[var(--text-secondary)]">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Pane */}
        <div className="max-h-[350px] overflow-y-auto p-4 flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-[var(--error)] bg-[rgba(239,68,68,0.05)] p-3 rounded-xl border border-[rgba(239,68,68,0.15)]">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {!query && (
            <div className="text-center py-8 flex flex-col items-center gap-2 text-[var(--text-secondary)]">
              <Compass className="w-8 h-8 text-[var(--primary)] opacity-40 animate-pulse" />
              <p className="text-xs">Find educational topics instantly via cosine similarity embeddings.</p>
            </div>
          )}

          {query && results.length === 0 && !isLoading && !error && (
            <p className="text-center text-xs text-[var(--text-secondary)] py-8 font-medium">
              No matching semantic concepts located in document library.
            </p>
          )}

          {Object.entries(groupedResults).map(([graphTitle, items]) => (
            <div key={graphTitle} className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold text-[var(--primary)] tracking-wider uppercase pl-2">
                {graphTitle}
              </span>
              <div className="flex flex-col gap-1">
                {items.map((item) => (
                  <button
                    key={item.nodeId}
                    onClick={() => {
                      onNodeSelect(item.nodeId, item.graphId);
                      onClose();
                    }}
                    className="flex justify-between items-center text-left p-3 rounded-xl bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(99,102,241,0.05)] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(99,102,241,0.15)] transition duration-200"
                  >
                    <div className="flex flex-col gap-0.5 max-w-[80%]">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {item.label}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] truncate">
                        {item.content}
                      </span>
                    </div>
                    {/* Similarity Score Badge */}
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[var(--accent-glow)] text-[var(--accent)] border border-[rgba(16,185,129,0.2)]">
                      {Math.round(item.score * 100)}% Match
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default SearchDialog;
