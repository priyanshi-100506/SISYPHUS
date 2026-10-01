"use client";

import React, { useState } from "react";

export interface FlaggedRange {
  step_start: number;
  step_end: number;
  type: string;
  description: string;
}

interface LoopMinimapProps {
  totalSteps: number;
  flaggedRanges?: FlaggedRange[];
  hoveredStep?: number | null;
  selectedStep?: number | null;
  onStepClick?: (step: number) => void;
  onRangeHover?: (range: FlaggedRange | null) => void;
}

export const LoopMinimap: React.FC<LoopMinimapProps> = ({
  totalSteps,
  flaggedRanges = [],
  hoveredStep,
  selectedStep,
  onStepClick,
  onRangeHover,
}) => {
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  if (totalSteps <= 0) return null;

  const width = 800;
  const height = 48;
  const tickGap = width / Math.max(totalSteps, 1);

  const getFlaggedRange = (step: number): FlaggedRange | undefined => {
    return flaggedRanges.find(
      (r) => step >= r.step_start && step <= r.step_end
    );
  };

  return (
    <div className="w-full bg-surface border border-border-soft rounded-tile p-3.5 shadow-xl relative overflow-hidden select-none">
      <div className="flex items-center justify-between text-xs text-muted mb-2 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
          <span className="text-[11px] uppercase font-sans tracking-wider text-faint font-medium">
            Execution Minimap & Loop Bounds
          </span>
        </div>
        <span className="text-faint font-tabular">
          {totalSteps} steps total {flaggedRanges.length > 0 && `· ${flaggedRanges.length} loop issue(s)`}
        </span>
      </div>

      <div className="relative w-full h-[40px] bg-surface-2/90 rounded border border-border-soft/60 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full cursor-pointer overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="gloss-overlay" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="stuck-impasto-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#630D20" />
              <stop offset="50%" stopColor="#A81B38" />
              <stop offset="100%" stopColor="#E05670" />
            </linearGradient>

            <filter id="stuck-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Step Ticks */}
          {Array.from({ length: totalSteps }).map((_, i) => {
            const stepNum = i + 1;
            const x = i * tickGap;
            const isFlagged = Boolean(getFlaggedRange(stepNum));
            const isHovered = hoveredStep === stepNum;
            const isSelected = selectedStep === stepNum;

            if (isFlagged) return null;

            return (
              <g key={`step-tick-${stepNum}`}>
                <line
                  x1={x + tickGap / 2}
                  y1={8}
                  x2={x + tickGap / 2}
                  y2={height - 8}
                  stroke={
                    isSelected
                      ? "var(--accent-light)"
                      : isHovered
                      ? "var(--accent)"
                      : "var(--accent-deep)"
                  }
                  strokeWidth={Math.max(2, tickGap * 0.45)}
                  opacity={isHovered || isSelected ? 1 : 0.65}
                />
              </g>
            );
          })}

          {/* Flagged Ranges with 20-degree Slanted Diagonal Boundary */}
          {flaggedRanges.map((range, index) => {
            const startIdx = Math.max(0, range.step_start - 1);
            const endIdx = Math.min(totalSteps - 1, range.step_end - 1);

            const startX = startIdx * tickGap;
            const endX = (endIdx + 1) * tickGap;
            const diagOffset = Math.min(14, tickGap * 1.5); // ~20 deg slant

            const pathD = `
              M ${startX + diagOffset} 0
              L ${endX} 0
              L ${endX - diagOffset} ${height}
              L ${startX} ${height}
              Z
            `;

            return (
              <g
                key={`range-${index}`}
                className="transition-all duration-150 hover:brightness-110"
                filter="url(#stuck-glow)"
                onMouseEnter={(e) => {
                  onRangeHover?.(range);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({
                    text: `${range.type}: ${range.description} (Steps ${range.step_start}-${range.step_end})`,
                    x: rect.left + rect.width / 2,
                    y: rect.top - 40,
                  });
                }}
                onMouseLeave={() => {
                  onRangeHover?.(null);
                  setTooltip(null);
                }}
                onClick={() => onStepClick?.(range.step_start)}
              >
                {/* Thick Oxblood Impasto Fill */}
                <path d={pathD} fill="url(#stuck-impasto-gradient)" />
                {/* Gloss Overlay */}
                <path d={pathD} fill="url(#gloss-overlay)" />
                {/* Oxblood Gloss Top Catchlight Stroke */}
                <path
                  d={`M ${startX + diagOffset} 0 L ${endX} 0`}
                  stroke="var(--stuck)"
                  strokeWidth="3"
                />
              </g>
            );
          })}

          {/* Click / Hover Target overlay */}
          {Array.from({ length: totalSteps }).map((_, i) => {
            const stepNum = i + 1;
            const x = i * tickGap;
            const range = getFlaggedRange(stepNum);

            return (
              <rect
                key={`target-${stepNum}`}
                x={x}
                y={0}
                width={tickGap}
                height={height}
                fill="transparent"
                onClick={() => onStepClick?.(stepNum)}
                onMouseEnter={(e) => {
                  if (range) onRangeHover?.(range);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({
                    text: range
                      ? `Step ${stepNum} [${range.type}]: ${range.description}`
                      : `Step ${stepNum}`,
                    x: rect.left + rect.width / 2,
                    y: rect.top - 32,
                  });
                }}
                onMouseLeave={() => {
                  if (range) onRangeHover?.(null);
                  setTooltip(null);
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Floating Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-1.5 text-xs font-sans bg-surface-3 text-text border border-border rounded-md shadow-2xl pointer-events-none transform -translate-x-1/2 whitespace-nowrap box-ridge"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};
