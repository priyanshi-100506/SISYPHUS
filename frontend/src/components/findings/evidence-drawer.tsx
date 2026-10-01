"use client";

import React, { useState } from "react";
import { Finding } from "./finding-card";
import { Copy, Check, X } from "lucide-react";

interface EvidenceDrawerProps {
  finding: Finding | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  finding,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!finding) return null;

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(finding, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-surface border-l border-border h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-border-soft mb-6">
            <div>
              <span className="text-xs text-stuck font-mono uppercase font-semibold">
                Finding Evidence
              </span>
              <h3 className="text-lg font-display font-semibold text-text mt-1">
                {finding.type.replace(/_/g, " ")}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-muted hover:text-text hover:bg-surface-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="text-faint uppercase text-[10px]">Description</label>
              <p className="text-text mt-0.5 font-sans">{finding.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-faint uppercase text-[10px]">Step Range</label>
                <p className="text-text mt-0.5">{finding.step_start} to {finding.step_end}</p>
              </div>
              <div>
                <label className="text-faint uppercase text-[10px]">Severity</label>
                <p className="text-text mt-0.5 uppercase">{finding.severity}</p>
              </div>
            </div>

            <div>
              <label className="text-faint uppercase text-[10px]">Raw Evidence JSON</label>
              <pre className="mt-1 p-3 bg-surface-2 rounded border border-border-soft text-text overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(finding.evidence, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border-soft flex justify-between items-center">
          <button
            onClick={copyJson}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-border text-xs text-muted hover:text-text hover:bg-surface-2"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied evidence JSON" : "Copy evidence JSON"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-surface-2 text-text text-xs rounded hover:bg-border"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
