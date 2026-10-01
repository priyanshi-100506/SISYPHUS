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
  const height = 44;
  const tickGap = width / Math.max(totalSteps, 1);

  // Helper to check if a step index (1-based) is in any flagged range
  const getFlaggedRange = (step: number): FlaggedRange | undefined => {
    return flaggedRanges.find(
      (r) => step >= r.step_start && step <= r.step_end
    );
  };

  return (
    <div className="w-full bg-surface border border-border-soft rounded-tile p-3 shadow-inner relative overflow-hidden select-none">
      <div className="flex items-center justify-between text-xs text-muted mb-2 font-mono">
        <span className="text-[12px] uppercase font-sans tracking-wide text-faint">
          Run trace minimap
        </span>
        <span>
          {totalSteps} steps {flaggedRanges.length > 0 && `· ${flaggedRanges.length} issue(s)`}
        </span>
      </div>

      <div className="relative w-full h-[36px] bg-surface-2 rounded overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full cursor-pointer overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="gloss-overlay" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
              <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="stuck-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5C0F1E" />
              <stop offset="100%" stopColor="#7A152A" />
            </linearGradient>
          </defs>

          {/* Render base background grid ticks */}
          {Array.from({ length: totalSteps }).map((_, i) => {
            const stepNum = i + 1;
            const x = i * tickGap;
            const isFlagged = Boolean(getFlaggedRange(stepNum));
            const isHovered = hoveredStep === stepNum;
            const isSelected = selectedStep === stepNum;

            if (isFlagged) return null; // Flagged ranges rendered separately as impasto block

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
                  strokeWidth={Math.max(1.5, tickGap * 0.5)}
                  opacity={isHovered || isSelected ? 1 : 0.65}
                />
              </g>
            );
          })}

          {/* Render Flagged Ranges with 20 degree diagonal edge */}
          {flaggedRanges.map((range, index) => {
            const startIdx = Math.max(0, range.step_start - 1);
            const endIdx = Math.min(totalSteps - 1, range.step_end - 1);

            const startX = startIdx * tickGap;
            const endX = (endIdx + 1) * tickGap;
            const diagOffset = Math.min(12, tickGap * 1.5); // ~20 deg slant

            // SVG Path with 20-deg slant diagonal intersection
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
                className="transition-opacity duration-150 hover:opacity-95"
                onMouseEnter={(e) => {
                  onRangeHover?.(range);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({
                    text: `${range.type}: ${range.description} (Steps ${range.step_start}-${range.step_end})`,
                    x: rect.left + rect.width / 2,
                    y: rect.top - 36,
                  });
                }}
                onMouseLeave={() => {
                  onRangeHover?.(null);
                  setTooltip(null);
                }}
                onClick={() => onStepClick?.(range.step_start)}
              >
                {/* Thick Oxblood Impasto Fill */}
                <path d={pathD} fill="url(#stuck-gradient)" />
                {/* Gloss highlight on top */}
                <path d={pathD} fill="url(#gloss-overlay)" />
                {/* Oxblood glossy top border stroke */}
                <path
                  d={`M ${startX + diagOffset} 0 L ${endX} 0`}
                  stroke="var(--stuck)"
                  strokeWidth="2.5"
                />
              </g>
            );
          })}

          {/* Invisible click targets per step */}
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
                    y: rect.top - 28,
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
          className="fixed z-50 px-2.5 py-1 text-xs font-sans bg-surface-2 text-text border border-border rounded shadow-lg pointer-events-none transform -translate-x-1/2 whitespace-nowrap"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};
