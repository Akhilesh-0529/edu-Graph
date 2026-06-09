"use client";

import React, { useState, useEffect } from "react";
import { Check, Loader2, XCircle } from "lucide-react";

interface PipelineProps {
  progress: number; // 0 to 100
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  onCancel?: () => void;
}

export function ProcessingPipeline({ progress, status, onCancel }: PipelineProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "PENDING" || status === "PROCESSING") {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status]);

  const stages = [
    { name: "Uploading", minProgress: 0, label: "Preparing document metadata..." },
    { name: "Extracting Text", minProgress: 30, label: "Performing local optical text layout parse..." },
    { name: "Analyzing Content", minProgress: 60, label: "Orchestrating local AI Gemma graph logic..." },
    { name: "Building Graph", minProgress: 80, label: "Calculating Nomic similarity vector maps..." },
  ];

  return (
    <div className="glass p-6 max-w-md w-full border border-[var(--border-card)] rounded-2xl flex flex-col gap-6 bg-[rgba(255,255,255,0.02)] backdrop-blur-xl">
      <div className="flex justify-between items-center border-b border-[var(--border-card)] pb-3">
        <h4 className="font-semibold text-lg text-[var(--text-primary)]">Ingestion Engine</h4>
        <span className="text-xs text-[var(--text-secondary)] font-mono">{elapsedTime}s elapsed</span>
      </div>

      <div className="flex flex-col gap-4">
        {stages.map((stage, idx) => {
          const isCompleted = progress > stage.minProgress && (status === "COMPLETED" || progress > stages[idx + 1]?.minProgress || progress === 100);
          const isActive = status === "PROCESSING" && progress >= stage.minProgress && !isCompleted;
          const isPending = !isCompleted && !isActive;

          return (
            <div key={stage.name} className={`flex items-start gap-4 transition-opacity duration-300 ${isPending ? "opacity-40" : "opacity-100"}`}>
              <div className="mt-1">
                {isCompleted ? (
                  <div className="bg-[var(--accent)] text-white p-1 rounded-full flex items-center justify-center w-5 h-5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-[var(--primary)] animate-spin" />
                ) : (
                  <div className="border border-[var(--border-card)] w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-[var(--text-secondary)]">
                    {idx + 1}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isActive ? "text-[var(--primary)]" : "text-[var(--text-primary)]"}`}>
                  {stage.name}
                </p>
                {isActive && (
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 animate-pulse">
                    {stage.label}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-[var(--text-secondary)]">Progress</span>
          <span className="text-[var(--primary)] font-bold">{progress}%</span>
        </div>
        <div className="w-full h-2.5 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden border border-[var(--border-card)]">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {status !== "COMPLETED" && status !== "FAILED" && onCancel && (
        <button
          onClick={onCancel}
          className="flex items-center justify-center gap-2 text-xs border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.05)] hover:bg-[rgba(239,68,68,0.15)] text-[var(--error)] p-2 rounded-xl transition duration-200"
        >
          <XCircle className="w-4 h-4" />
          Cancel Pipeline
        </button>
      )}
    </div>
  );
}
