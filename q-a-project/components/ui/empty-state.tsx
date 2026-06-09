"use client";

import React from "react";
import { Database, Plus } from "lucide-react";

interface EmptyStateProps {
  onActionClick: () => void;
  actionLabel?: string;
  title?: string;
  description?: string;
}

export function EmptyState({
  onActionClick,
  actionLabel = "Upload Content",
  title = "No Curriculum Graphs Found",
  description = "You haven't ingested any textbooks or academic content yet. Upload a document to construct your first local interactive knowledge graph.",
}: EmptyStateProps) {
  return (
    <div className="glass p-8 rounded-2xl max-w-lg w-full border border-[var(--border-card)] flex flex-col gap-6 items-center text-center bg-[rgba(255,255,255,0.01)] backdrop-blur-xl">
      <div className="p-4 rounded-2xl bg-[rgba(99,102,241,0.06)] border border-[rgba(99,102,241,0.15)] text-[var(--primary)] shadow-inner">
        <Database className="w-10 h-10 animate-bounce" />
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="font-semibold text-lg text-[var(--text-primary)]">
          {title}
        </h4>
        <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed max-w-sm">
          {description}
        </p>
      </div>

      <button
        onClick={onActionClick}
        className="flex items-center gap-2 bg-[var(--primary)] hover:opacity-90 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-lg shadow-[var(--primary-glow)] transition duration-200"
      >
        <Plus className="w-4 h-4" />
        {actionLabel}
      </button>
    </div>
  );
}
export default EmptyState;
