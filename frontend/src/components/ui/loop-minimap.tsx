"use client";

import React, { useRef, useState } from "react";

const FINDING_COLORS: Record<string, { fill: string; border: string; label: string }> = {
  REPEATED_TOOL:    { fill: "rgba(198,90,116,0.22)",  border: "#C65A74", label: "Repeated Tool" },
  STATE_LOOP:       { fill: "rgba(240,115,124,0.18)", border: "#F0737C", label: "State Loop" },
  RETRY_STORM:      { fill: "rgba(227,178,92,0.20)",  border: "#E3B25C", label: "Retry Storm" },
  EXECUTION_BLOAT:  { fill: "rgba(143,163,201,0.18)", border: "#8FA3C9", label: "Execution Bloat" },
  TOOL_OSCILLATION: { fill: "rgba(198,90,116,0.15)",  border: "#C65A74", label: "Oscillation" },
};

function getColor(type: string) {
  return FINDING_COLORS[type] ?? { fill: "rgba(198,90,116,0.18)", border: "#C65A74", label: type.replace(/_/g, " ") };
}

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  if (totalSteps <= 0) return null;

  const TRACK_H = 36;
  const BAR_H = 11;
  const BAR_Y = (TRACK_H - BAR_H) / 2;

  const getFlaggedRange = (step: number) =>
    flaggedRanges.find((r) => step >= r.step_start && step <= r.step_end);

  const isFlaggedStep = (step: number) => Boolean(getFlaggedRange(step));

  return (
    <div
      ref={containerRef}
      className="w-full bg-surface border border-border-soft rounded-tile select-none"
      style={{ padding: "14px 16px 12px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse-slow"
            style={{ background: "var(--stuck)" }}
          />
          <span
            className="uppercase font-sans font-medium tracking-widest"
            style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.09em" }}
          >
            Execution Minimap &amp; Loop Bounds
          </span>
        </div>
        <span className="font-mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>
          {totalSteps} steps total
          {flaggedRanges.length > 0 && (
            <span style={{ color: "var(--stuck)", marginLeft: 6, fontWeight: 500 }}>
              &middot; {flaggedRanges.length} loop issue{flaggedRanges.length !== 1 ? "s" : ""}
            </span>
          )}
        </span>
      </div>

      {/* Track */}
      <div
        ref={null}
        className="relative w-full rounded overflow-hidden"
        style={{
          height: TRACK_H,
          background: "var(--surface-2)",
          border: "1px solid var(--border-soft)",
        }}
      >
        <svg
          viewBox={`0 0 1000 ${TRACK_H}`}
          className="w-full h-full"
          preserveAspectRatio="none"
          style={{ display: "block" }}
        >
          {/* Clean step segments */}
          {Array.from({ length: totalSteps }).map((_, i) => {
            const stepNum = i + 1;
            const x = (i / totalSteps) * 1000;
            const w = Math.max((1000 / totalSteps) - 1.5, 1);
            const flagged = isFlaggedStep(stepNum);
            const isSelected = selectedStep === stepNum;
            const isHov = hoveredStep === stepNum;

            if (flagged) return null;

            return (
              <rect
                key={stepNum}
                x={x + 0.75}
                y={BAR_Y}
                width={w}
                height={BAR_H}
                rx={2}
                fill={
                  isSelected
                    ? "var(--accent-light)"
                    : isHov
                    ? "var(--accent)"
                    : "var(--accent-deep)"
                }
                opacity={isSelected || isHov ? 1 : 0.5}
                style={{ cursor: "pointer" }}
                onClick={() => onStepClick?.(stepNum)}
                onMouseEnter={() => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    const svgX = ((i + 0.5) / totalSteps) * rect.width + rect.left;
                    setTooltip({ text: `Step ${stepNum}`, x: svgX, y: rect.top - 36 });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}

          {/* Flagged range blocks — rendered on top of clean steps */}
          {flaggedRanges.map((range, idx) => {
            const color = getColor(range.type);
            const startFrac = (range.step_start - 1) / totalSteps;
            const endFrac = range.step_end / totalSteps;
            const x = startFrac * 1000;
            const w = Math.max((endFrac - startFrac) * 1000, 4);

            return (
              <g key={idx}>
                {/* Soft zone wash */}
                <rect x={x} y={0} width={w} height={TRACK_H} fill={color.fill} />
                {/* Solid bar */}
                <rect
                  x={x + 0.75}
                  y={BAR_Y}
                  width={Math.max(w - 1.5, 1)}
                  height={BAR_H}
                  rx={2}
                  fill={color.border}
                  opacity={0.88}
                  style={{ cursor: "pointer" }}
                  onClick={() => onStepClick?.(range.step_start)}
                  onMouseEnter={() => {
                    onRangeHover?.(range);
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      const midFrac = (startFrac + endFrac) / 2;
                      setTooltip({
                        text: `${color.label} · steps ${range.step_start}–${range.step_end}`,
                        x: midFrac * rect.width + rect.left,
                        y: rect.top - 36,
                      });
                    }
                  }}
                  onMouseLeave={() => { onRangeHover?.(null); setTooltip(null); }}
                />
                {/* Top accent line */}
                <rect x={x} y={BAR_Y} width={w} height={1.5} fill={color.border} opacity={1} />
              </g>
            );
          })}

          {/* Selected step overlay */}
          {selectedStep && selectedStep >= 1 && selectedStep <= totalSteps && (
            <rect
              x={((selectedStep - 1) / totalSteps) * 1000}
              y={0}
              width={1000 / totalSteps}
              height={TRACK_H}
              fill="var(--accent)"
              opacity={0.18}
              style={{ pointerEvents: "none" }}
            />
          )}
        </svg>

        {/* Step number axis labels */}
        <div
          className="absolute inset-x-0 flex justify-between pointer-events-none"
          style={{ bottom: 2, padding: "0 4px" }}
        >
          <span className="font-mono" style={{ fontSize: 9, color: "var(--text-faint)" }}>1</span>
          {totalSteps > 4 && (
            <span className="font-mono" style={{ fontSize: 9, color: "var(--text-faint)" }}>
              {Math.ceil(totalSteps / 2)}
            </span>
          )}
          <span className="font-mono" style={{ fontSize: 9, color: "var(--text-faint)" }}>{totalSteps}</span>
        </div>
      </div>

      {/* Legend */}
      {flaggedRanges.length > 0 && (
        <div className="flex items-center gap-5 mt-2.5 flex-wrap">
          {flaggedRanges.map((r, i) => {
            const color = getColor(r.type);
            return (
              <div key={i} className="flex items-center gap-1.5">
                <span
                  className="inline-block rounded-sm"
                  style={{ width: 10, height: 10, background: color.border, opacity: 0.9 }}
                />
                <span className="font-mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>
                  {color.label}&nbsp;<span style={{ color: "var(--text-muted)" }}>steps {r.step_start}–{r.step_end}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translateX(-50%)",
            background: "var(--surface-3, #2C1A22)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 11,
            color: "var(--text)",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 20px rgba(0,0,0,0.55)",
            fontFamily: "var(--font-geist-mono), monospace",
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};
