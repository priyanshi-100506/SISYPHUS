"use client";

import React, { useState } from "react";
import { Wrench, Terminal, AlertOctagon, Copy, Check, X } from "lucide-react";

export interface EventData {
  id?: string;
  sequence_number: number;
  event_type: string;
  tool_name?: string;
  model?: string;
  input_preview?: string;
  output_preview?: string;
  status: string;
  error_code?: string;
  tokens_in: number;
  tokens_out: number;
  latency_ms?: number;
  timestamp: string;
}

export interface FindingMatch {
  finding_type: string;
  step_start: number;
  step_end: number;
  repeat_index?: number;
  total_repeats?: number;
}

interface TimelineListProps {
  events: EventData[];
  findings?: FindingMatch[];
  selectedStep?: number | null;
  highlightedStepRange?: [number, number] | null;
  onStepSelect?: (step: number) => void;
}

export const TimelineList: React.FC<TimelineListProps> = ({
  events,
  findings = [],
  selectedStep,
  highlightedStepRange,
  onStepSelect,
}) => {
  const [activeDrawerEvent, setActiveDrawerEvent] = useState<EventData | null>(null);
  const [copied, setCopied] = useState(false);

  // Helper to find matching finding for step
  const getStepFindingMatch = (seq: number): FindingMatch | undefined => {
    return findings.find((f) => seq >= f.step_start && seq <= f.step_end);
  };

  const copyEventJson = (event: EventData) => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 text-[11px] text-faint border-b border-border-soft font-mono uppercase tracking-wider">
        <span className="w-10">Step</span>
        <span className="w-28">Type</span>
        <span className="flex-1">Input preview</span>
        <span className="w-24 text-right">Tokens</span>
        <span className="w-20 text-right">Latency</span>
      </div>

      <div className="flex flex-col border-b border-border-soft divide-y divide-border-soft/40">
        {events.map((ev) => {
          const seq = ev.sequence_number;
          const findingMatch = getStepFindingMatch(seq);
          const isFlagged = Boolean(findingMatch);
          const isSelected = selectedStep === seq;
          const isHighlighted =
            highlightedStepRange &&
            seq >= highlightedStepRange[0] &&
            seq <= highlightedStepRange[1];

          const isThink = ev.event_type.toLowerCase() === "think";
          const isError = ev.event_type.toLowerCase() === "error" || ev.status === "error";

          // Check if this step is a repeat step
          const isRepeatStep = findingMatch && seq > findingMatch.step_start;
          const repeatIndex = isRepeatStep ? seq - findingMatch.step_start + 1 : null;
          const totalRepeats = findingMatch ? findingMatch.step_end - findingMatch.step_start + 1 : null;

          return (
            <div
              key={`timeline-step-${seq}`}
              onClick={() => {
                onStepSelect?.(seq);
                setActiveDrawerEvent(ev);
              }}
              className={`group flex items-center px-3 py-2.5 text-xs font-mono rounded-none cursor-pointer transition-colors duration-140 ${
                isFlagged
                  ? "border-l-[3px] border-stuck bg-stuck-bg hover:bg-stuck/20 text-text"
                  : isSelected
                  ? "border-l-[3px] border-accent bg-surface-2 box-ridge text-text"
                  : isHighlighted
                  ? "border-l-[3px] border-accent-light bg-accent-bg text-text"
                  : "border-l-[3px] border-transparent hover:bg-surface-2/60 text-muted"
              }`}
            >
              {/* Sequence number */}
              <span className="w-10 text-faint font-semibold">
                {String(seq).padStart(2, "0")}
              </span>

              {/* Event Type Icon + Label */}
              <span className="w-28 flex items-center gap-1.5 font-sans">
                {isThink ? (
                  <Terminal className="w-3.5 h-3.5 text-faint" />
                ) : isError ? (
                  <AlertOctagon className="w-3.5 h-3.5 text-danger" />
                ) : (
                  <Wrench className="w-3.5 h-3.5 text-accent" />
                )}
                <span
                  className={`font-mono text-[11px] ${
                    isThink
                      ? "text-faint"
                      : isError
                      ? "text-danger"
                      : "text-accent"
                  }`}
                >
                  {ev.tool_name || ev.event_type}
                </span>
              </span>

              {/* Input Preview & Redundancy Chip */}
              <div className="flex-1 flex items-center gap-2 overflow-hidden pr-3">
                <span className={`truncate font-sans text-xs ${isThink ? "text-faint" : "text-text"}`}>
                  {ev.input_preview || "—"}
                </span>

                {/* First redundant / repeated step chip */}
                {isRepeatStep && repeatIndex && totalRepeats && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-chip text-[10px] font-mono bg-stuck-fill text-stuck border border-stuck/30 whitespace-nowrap">
                    repeat #{repeatIndex} of {totalRepeats}
                  </span>
                )}
              </div>

              {/* Tokens In / Out */}
              <span className="w-24 text-right text-faint font-tabular">
                {ev.tokens_in + ev.tokens_out > 0
                  ? `${ev.tokens_in}↑ ${ev.tokens_out}↓`
                  : "—"}
              </span>

              {/* Latency */}
              <span className="w-20 text-right text-faint font-tabular">
                {ev.latency_ms ? `${ev.latency_ms} ms` : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detail Drawer Side Modal */}
      {activeDrawerEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-surface border-l border-border h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border-soft mb-6">
                <div>
                  <span className="text-xs text-faint font-mono">
                    Step detail #{activeDrawerEvent.sequence_number}
                  </span>
                  <h3 className="text-lg font-display font-semibold text-text mt-1">
                    {activeDrawerEvent.tool_name || activeDrawerEvent.event_type}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveDrawerEvent(null)}
                  className="p-1 rounded text-muted hover:text-text hover:bg-surface-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs font-mono">
                <div>
                  <label className="text-faint uppercase text-[10px]">Timestamp</label>
                  <p className="text-text mt-0.5">{activeDrawerEvent.timestamp}</p>
                </div>

                <div>
                  <label className="text-faint uppercase text-[10px]">Model</label>
                  <p className="text-text mt-0.5">{activeDrawerEvent.model || "N/A"}</p>
                </div>

                <div>
                  <label className="text-faint uppercase text-[10px]">Input preview</label>
                  <pre className="mt-1 p-3 bg-surface-2 rounded-tile border border-border-soft text-text overflow-x-auto whitespace-pre-wrap">
                    {activeDrawerEvent.input_preview || "{}"}
                  </pre>
                </div>

                <div>
                  <label className="text-faint uppercase text-[10px]">Output preview</label>
                  <pre className="mt-1 p-3 bg-surface-2 rounded-tile border border-border-soft text-text overflow-x-auto whitespace-pre-wrap">
                    {activeDrawerEvent.output_preview || "{}"}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-faint uppercase text-[10px]">Tokens in/out</label>
                    <p className="text-text mt-0.5">{activeDrawerEvent.tokens_in} / {activeDrawerEvent.tokens_out}</p>
                  </div>
                  <div>
                    <label className="text-faint uppercase text-[10px]">Latency</label>
                    <p className="text-text mt-0.5">{activeDrawerEvent.latency_ms ? `${activeDrawerEvent.latency_ms} ms` : "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border-soft flex justify-between items-center">
              <button
                onClick={() => copyEventJson(activeDrawerEvent)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-border text-xs text-muted hover:text-text hover:bg-surface-2"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-ok" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied JSON" : "Copy JSON"}
              </button>
              <button
                onClick={() => setActiveDrawerEvent(null)}
                className="px-4 py-1.5 bg-surface-2 text-text text-xs rounded hover:bg-border"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
