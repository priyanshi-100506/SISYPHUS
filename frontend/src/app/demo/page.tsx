"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, FileText, Sparkles, Filter, AlertTriangle } from "lucide-react";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoopMinimap, FlaggedRange } from "@/components/ui/loop-minimap";
import { TimelineList, EventData } from "@/components/timeline/timeline";
import { FindingCard, Finding } from "@/components/findings/finding-card";
import { EvidenceDrawer } from "@/components/findings/evidence-drawer";
import { GuardSimulationModal } from "@/components/simulation/guard-simulation";
import { Button } from "@/components/ui/button";

export default function DemoPage() {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [hoveredFinding, setHoveredFinding] = useState<Finding | null>(null);
  const [evidenceFinding, setEvidenceFinding] = useState<Finding | null>(null);
  const [simulationFinding, setSimulationFinding] = useState<Finding | null>(null);

  // Mocked seed events for flawed run demo
  const mockEvents: EventData[] = [
    {
      sequence_number: 1,
      event_type: "think",
      input_preview: "Analyzing request: Find three hotels in Paris",
      status: "ok",
      tokens_in: 320,
      tokens_out: 45,
      latency_ms: 210,
      timestamp: "2026-10-01T10:00:01Z",
    },
    {
      sequence_number: 2,
      event_type: "tool",
      tool_name: "search",
      input_preview: "query: Paris hotels",
      output_preview: "results: 10 hotels found",
      status: "ok",
      tokens_in: 410,
      tokens_out: 120,
      latency_ms: 450,
      timestamp: "2026-10-01T10:00:02Z",
    },
    {
      sequence_number: 3,
      event_type: "think",
      input_preview: "Processing search results...",
      status: "ok",
      tokens_in: 512,
      tokens_out: 60,
      latency_ms: 310,
      timestamp: "2026-10-01T10:00:03Z",
    },
    {
      sequence_number: 4,
      event_type: "tool",
      tool_name: "search",
      input_preview: "query: Paris hotels",
      output_preview: "results: 10 hotels found",
      status: "ok",
      tokens_in: 410,
      tokens_out: 120,
      latency_ms: 440,
      timestamp: "2026-10-01T10:00:04Z",
    },
    {
      sequence_number: 5,
      event_type: "tool",
      tool_name: "search",
      input_preview: "query: Paris hotels",
      output_preview: "results: 10 hotels found",
      status: "ok",
      tokens_in: 410,
      tokens_out: 120,
      latency_ms: 430,
      timestamp: "2026-10-01T10:00:05Z",
    },
    {
      sequence_number: 6,
      event_type: "tool",
      tool_name: "search",
      input_preview: "query: Paris hotels",
      output_preview: "results: 10 hotels found",
      status: "ok",
      tokens_in: 410,
      tokens_out: 120,
      latency_ms: 445,
      timestamp: "2026-10-01T10:00:06Z",
    },
    {
      sequence_number: 7,
      event_type: "tool",
      tool_name: "search",
      input_preview: "query: Paris hotels",
      output_preview: "results: 10 hotels found",
      status: "ok",
      tokens_in: 410,
      tokens_out: 120,
      latency_ms: 450,
      timestamp: "2026-10-01T10:00:07Z",
    },
    {
      sequence_number: 8,
      event_type: "tool",
      tool_name: "search",
      input_preview: "query: Paris hotels",
      output_preview: "results: 10 hotels found",
      status: "ok",
      tokens_in: 410,
      tokens_out: 120,
      latency_ms: 435,
      timestamp: "2026-10-01T10:00:08Z",
    },
    {
      sequence_number: 9,
      event_type: "tool",
      tool_name: "search",
      input_preview: "query: Paris hotels",
      output_preview: "results: 10 hotels found",
      status: "ok",
      tokens_in: 410,
      tokens_out: 120,
      latency_ms: 440,
      timestamp: "2026-10-01T10:00:09Z",
    },
    {
      sequence_number: 10,
      event_type: "think",
      input_preview: "Attempting to summarize findings...",
      status: "ok",
      tokens_in: 600,
      tokens_out: 250,
      latency_ms: 500,
      timestamp: "2026-10-01T10:00:10Z",
    },
  ];

  // Mock findings for demo run
  const mockFindings: Finding[] = [
    {
      id: "find_01",
      type: "REPEATED_TOOL",
      severity: "high",
      step_start: 4,
      step_end: 9,
      description: "tool 'search' executed 6 times consecutively with identical query: 'Paris hotels'",
      evidence: {
        tool_name: "search",
        input_hash: "a9f87c2b...",
        total_calls: 6,
        redundant_calls: 5,
      },
      waste_tokens: 2184,
      waste_ms: 1800,
      waste_cost: 0.0312,
      explanation: "The agent loop failed to advance state after receiving initial search results, repeatedly triggering the identical search call.",
    },
    {
      id: "find_02",
      type: "STATE_LOOP",
      severity: "medium",
      step_start: 4,
      step_end: 9,
      description: "Identical state hash revisited across steps 4 through 9 without state progress",
      evidence: {
        state_hash: "7f4c1e...",
        cycle_length: 1,
        repetitions: 6,
      },
      waste_tokens: 1500,
      waste_ms: 1200,
      waste_cost: 0.021,
      explanation: "No state variables changed between execution turns.",
    },
  ];

  const minimapFlaggedRanges: FlaggedRange[] = mockFindings.map((f) => ({
    step_start: f.step_start,
    step_end: f.step_end,
    type: f.type,
    description: f.description,
  }));

  const highlightedStepRange: [number, number] | null = hoveredFinding
    ? [hoveredFinding.step_start, hoveredFinding.step_end]
    : null;

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Top Header */}
      <header className="border-b border-border-soft bg-surface px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded text-muted hover:text-text hover:bg-surface-2">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-faint">RUN #8F30</span>
                <StatusBadge status="loop" />
              </div>
              <h1 className="font-display text-xl font-medium text-text mt-0.5">
                "Find three hotels in Paris with available rooms"
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-stuck-bg text-stuck text-xs font-mono border border-stuck/20">
              Demo Mode (Read-Only)
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Top Metric Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile label="Total duration" value="18.4 s" />
          <StatTile label="Total steps" value={10} />
          <StatTile label="Total tokens" value="8,412" subtext="in: 5.8k · out: 2.6k" />
          <StatTile label="Detected loops" value={2} isStuck={true} subtext="Waste: 2.1k tok ($0.03)" />
        </div>

        {/* Loop Minimap Full Width */}
        <LoopMinimap
          totalSteps={10}
          flaggedRanges={minimapFlaggedRanges}
          selectedStep={selectedStep}
          onStepClick={(step) => setSelectedStep(step)}
        />

        {/* Two Column Layout: Timeline (60%) and Findings (40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Timeline Section (60%) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-soft">
              <h3 className="font-sans font-semibold text-sm text-text">
                Execution Timeline
              </h3>
              <span className="text-xs font-mono text-faint">10 steps total</span>
            </div>

            <TimelineList
              events={mockEvents}
              findings={mockFindings.map((f) => ({
                finding_type: f.type,
                step_start: f.step_start,
                step_end: f.step_end,
              }))}
              selectedStep={selectedStep}
              highlightedStepRange={highlightedStepRange}
              onStepSelect={(step) => setSelectedStep(step)}
            />
          </div>

          {/* Findings Sidebar (40%) */}
          <div className="lg:col-span-5 space-y-4 sticky top-24">
            <div className="flex items-center justify-between pb-2 border-b border-border-soft">
              <h3 className="font-sans font-semibold text-sm text-text">
                Detected Findings
              </h3>
              <span className="text-xs font-mono text-stuck font-medium">
                {mockFindings.length} issues
              </span>
            </div>

            <div className="space-y-4">
              {mockFindings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  finding={finding}
                  onViewEvidence={(f) => setEvidenceFinding(f)}
                  onSimulateGuard={(f) => setSimulationFinding(f)}
                  onHover={(f) => setHoveredFinding(f)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Evidence Drawer */}
      <EvidenceDrawer
        finding={evidenceFinding}
        onClose={() => setEvidenceFinding(null)}
      />

      {/* Guard Simulation Modal */}
      <GuardSimulationModal
        finding={simulationFinding}
        totalSteps={10}
        onClose={() => setSimulationFinding(null)}
      />
    </div>
  );
}
