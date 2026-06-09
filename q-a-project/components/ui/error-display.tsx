"use client";

import React from "react";
import { AlertTriangle, AlertCircle, RefreshCw } from "lucide-react";

interface ErrorDisplayProps {
  message: string;
  type?: "warning" | "error";
  onRetry?: () => void;
}

export function ErrorDisplay({ message, type = "error", onRetry }: ErrorDisplayProps) {
  const isWarning = type === "warning";

  return (
    <div
      className={`glass p-6 rounded-2xl max-w-md w-full border flex flex-col gap-4 items-center text-center transition-all duration-300 ${
        isWarning
          ? "border-[var(--warning)] bg-[rgba(245,158,11,0.02)]"
          : "border-[var(--error)] bg-[rgba(239,68,68,0.02)]"
      }`}
    >
      <div className="p-3 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
        {isWarning ? (
          <AlertTriangle className="w-8 h-8 text-[var(--warning)]" />
        ) : (
          <AlertCircle className="w-8 h-8 text-[var(--error)]" />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <h5 className={`font-semibold text-base ${isWarning ? "text-[var(--warning)]" : "text-[var(--error)]"}`}>
          {isWarning ? "Validation Notice" : "System Failure"}
        </h5>
        <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
          {message}
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition duration-200 border ${
            isWarning
              ? "bg-[var(--warning)] border-[var(--warning)] hover:opacity-90 text-[#07090e]"
              : "bg-[var(--error)] border-[var(--error)] hover:opacity-90 text-white"
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Operation
        </button>
      )}
    </div>
  );
}
export default ErrorDisplay;
