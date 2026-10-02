"use client";

import React from "react";
import { X } from "lucide-react";
import { Finding } from "../findings/finding-card";

interface GuardSimulationProps {
  finding: Finding | null;
  totalSteps: number;
  onClose: () => void;
}

export const GuardSimulationModal: React.FC<GuardSimulationProps> = ({
  finding,
  totalSteps,
  onClose,
}) => {
  if (!finding) return null;

  const savedSteps = Math.max(0, finding.step_end - finding.step_start);
  const totalSavedTokens = finding.waste_tokens;
  const totalSavedTime = (finding.waste_ms / 1000).toFixed(1);
  const totalSavedCost = finding.waste_cost.toFixed(2);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-surface border border-border rounded-card p-6 shadow-2xl flex flex-col space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-border-soft">
          <div>
            <span className="text-xs text-accent font-mono uppercase font-semibold">
              Guard Simulation
            </span>
            <h3 className="text-xl font-display font-semibold text-text mt-0.5">
              Simulated Trace Savings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted hover:text-text hover:bg-surface-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stacked Minimaps */}
        <div className="space-y-4">
          {/* Recorded Minimap */}
          <div>
            <div className="flex justify-between text-xs font-mono text-muted mb-1.5">
              <span>Original (Recorded)</span>
              <span>{totalSteps} steps</span>
            </div>
            <div className="w-full h-8 bg-surface-2 rounded relative overflow-hidden flex items-center px-1">
              <div
                className="h-6 bg-stuck-fill border-t-2 border-stuck rounded-xs relative flex items-center justify-center text-[10px] text-text font-mono"
                style={{
                  marginLeft: `${(finding.step_start / totalSteps) * 100}%`,
                  width: `${((finding.step_end - finding.step_start + 1) / totalSteps) * 100}%`,
                }}
              >
                Repeated loop
              </div>
            </div>
          </div>

          {/* Guarded Minimap */}
          <div>
            <div className="flex justify-between text-xs font-mono text-muted mb-1.5">
              <span>With Guard (Max 3 Identical Calls)</span>
              <span>{finding.step_start + 1} steps</span>
            </div>
            <div className="w-full h-8 bg-surface-2 rounded relative overflow-hidden flex items-center px-1">
              <div
                className="h-6 bg-accent-deep border-r-4 border-accent rounded-r flex items-center justify-center text-[10px] text-bg font-mono font-semibold"
                style={{
                  width: `${((finding.step_start + 1) / totalSteps) * 100}%`,
                }}
              >
                STOP
              </div>
            </div>
          </div>
        </div>

        {/* Savings Summary in Fraunces Numerals */}
        <div className="bg-surface-2/60 border border-border-soft rounded-tile p-4 grid grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-[11px] text-muted font-sans uppercase">Saved Steps</span>
            <p className="font-display text-2xl font-semibold text-text font-tabular mt-1">
              {savedSteps}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-muted font-sans uppercase">Saved Tokens</span>
            <p className="font-display text-2xl font-semibold text-accent font-tabular mt-1">
              {totalSavedTokens.toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-muted font-sans uppercase">Saved Latency</span>
            <p className="font-display text-2xl font-semibold text-text font-tabular mt-1">
              {totalSavedTime} s
            </p>
          </div>
          <div>
            <span className="text-[11px] text-muted font-sans uppercase">Saved Cost</span>
            <p className="font-display text-2xl font-semibold text-ok font-tabular mt-1">
              ${totalSavedCost}
            </p>
          </div>
        </div>

        <p className="text-xs text-faint font-sans italic text-center">
          Simulated from the recorded trace. Your agent is not re-run.
        </p>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-accent text-bg font-medium text-sm rounded-[10px] hover:bg-accent-light"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
