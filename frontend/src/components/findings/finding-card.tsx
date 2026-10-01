"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, FileText, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Finding {
  id?: string;
  type: string;
  severity: "low" | "medium" | "high" | string;
  step_start: number;
  step_end: number;
  description: string;
  evidence: Record<string, any>;
  waste_tokens: number;
  waste_ms: number;
  waste_cost: number;
  explanation?: string | null;
}

interface FindingCardProps {
  finding: Finding;
  onViewEvidence?: (finding: Finding) => void;
  onSimulateGuard?: (finding: Finding) => void;
  onHover?: (finding: Finding | null) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  onViewEvidence,
  onSimulateGuard,
  onHover,
}) => {
  const [showAiExplanation, setShowAiExplanation] = useState(false);

  const isLoop = finding.type.includes("LOOP") || finding.type.includes("REPEATED");
  const leftBorderColor = isLoop ? "border-stuck" : "border-warn";

  const severityBadges: Record<string, string> = {
    high: "bg-danger-bg text-danger border-danger/30",
    medium: "bg-warn-bg text-warn border-warn/30",
    low: "bg-accent-bg text-accent border-accent/30",
  };

  // Section 12 Deterministic Template Builder
  const buildDeterministicSummary = (f: Finding): string => {
    const tool = f.evidence?.tool_name || "tool";
    const count = f.evidence?.total_calls || f.step_end - f.step_start + 1;

    let baseText = "";
    if (f.type.includes("REPEATED")) {
      baseText = `${tool} ran ${count} times with the same input (steps ${f.step_start}-${f.step_end}).`;
    } else if (f.type.includes("STATE")) {
      baseText = `Steps ${f.step_start}-${f.step_end} returned to an earlier state.`;
    } else if (f.type.includes("RETRY")) {
      baseText = `${tool} failed ${count} times in a row (steps ${f.step_start}-${f.step_end}).`;
    } else {
      baseText = f.description;
    }

    if (f.waste_tokens > 0 || f.waste_ms > 0 || f.waste_cost > 0) {
      baseText += ` About ${f.waste_tokens.toLocaleString()} tokens, ${(
        f.waste_ms / 1000
      ).toFixed(1)} s, $${f.waste_cost.toFixed(2)} wasted.`;
    }
    return baseText;
  };

  return (
    <div
      onMouseEnter={() => onHover?.(finding)}
      onMouseLeave={() => onHover?.(null)}
      className={`bg-surface border border-border-soft border-l-4 ${leftBorderColor} rounded-tile p-4 flex flex-col space-y-3 transition-all duration-150 hover:border-border`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle
            className={`w-4 h-4 ${isLoop ? "text-stuck" : "text-warn"}`}
          />
          <h4 className="font-sans font-semibold text-sm text-text capitalize-first">
            {finding.type.replace(/_/g, " ").toLowerCase()}
          </h4>
        </div>
        <span
          className={`px-2 py-0.5 text-[11px] font-sans font-medium rounded-chip border uppercase tracking-wider ${
            severityBadges[finding.severity.toLowerCase()] || severityBadges.medium
          }`}
        >
          {finding.severity}
        </span>
      </div>

      {/* Deterministic Template Summary */}
      <p className="text-xs font-sans text-muted leading-relaxed">
        {buildDeterministicSummary(finding)}
      </p>

      {/* AI Explanation Collapsible - Section 12 Label: "Explanation, written by an AI from the evidence above" */}
      {finding.explanation && (
        <div className="pt-1">
          <button
            onClick={() => setShowAiExplanation(!showAiExplanation)}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-text focus:outline-none"
          >
            <span>Explanation, written by an AI from the evidence above</span>
            {showAiExplanation ? (
              <ChevronUp className="w-3 h-3 text-faint" />
            ) : (
              <ChevronDown className="w-3 h-3 text-faint" />
            )}
          </button>
          {showAiExplanation && (
            <div className="mt-2 p-3 bg-accent-bg/80 border border-accent/20 rounded text-xs text-text font-sans leading-relaxed">
              {finding.explanation}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-border-soft">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onViewEvidence?.(finding)}
        >
          <FileText className="w-3.5 h-3.5" />
          View evidence
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onSimulateGuard?.(finding)}
        >
          <Play className="w-3.5 h-3.5" />
          Simulate guard
        </Button>
      </div>
    </div>
  );
};
