import React from "react";

export function GraphSkeleton() {
  return (
    <div className="glass w-full h-[500px] border border-[var(--border-card)] rounded-2xl relative overflow-hidden bg-[rgba(0,0,0,0.25)] flex items-center justify-center">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.01)_1px,_transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Shimmer Pulse Nodes & Edges Mock */}
      <svg className="w-full h-full absolute inset-0 opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        {/* Connection Lines */}
        <line x1="200" y1="250" x2="400" y2="150" stroke="var(--primary)" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" />
        <line x1="200" y1="250" x2="400" y2="350" stroke="var(--primary)" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" />
        <line x1="400" y1="150" x2="650" y2="150" stroke="var(--primary)" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" />
        <line x1="400" y1="350" x2="650" y2="350" stroke="var(--primary)" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" />
        <line x1="650" y1="150" x2="850" y2="250" stroke="var(--primary)" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" />
        <line x1="650" y1="350" x2="850" y2="250" stroke="var(--primary)" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" />

        {/* Nodes */}
        <rect x="130" y="225" rx="8" ry="8" width="140" height="50" fill="var(--primary)" className="animate-pulse" />
        <rect x="330" y="125" rx="8" ry="8" width="140" height="50" fill="var(--primary)" className="animate-pulse" />
        <rect x="330" y="325" rx="8" ry="8" width="140" height="50" fill="var(--primary)" className="animate-pulse" />
        <rect x="580" y="125" rx="8" ry="8" width="140" height="50" fill="var(--primary)" className="animate-pulse" />
        <rect x="580" y="325" rx="8" ry="8" width="140" height="50" fill="var(--primary)" className="animate-pulse" />
        <rect x="780" y="225" rx="8" ry="8" width="140" height="50" fill="var(--primary)" className="animate-pulse" />
      </svg>

      {/* Center Loader Overlay */}
      <div className="z-10 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-[var(--primary-glow)] border-t-[var(--primary)] animate-spin" />
        <p className="text-sm font-medium text-[var(--text-secondary)] font-mono animate-pulse">
          Rendering Cytoscape Map...
        </p>
      </div>
    </div>
  );
}
export default GraphSkeleton;
