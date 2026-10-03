"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoopMinimap, FlaggedRange } from "@/components/ui/loop-minimap";
import { TimelineList, EventData } from "@/components/timeline/timeline";
import { FindingCard, Finding } from "@/components/findings/finding-card";
import { EvidenceDrawer } from "@/components/findings/evidence-drawer";
import { GuardSimulationModal } from "@/components/simulation/guard-simulation";
import { Button } from "@/components/ui/button";
import { fetchRunEvents, fetchRunFindings, fetchRunDetail, EventDataApi, FindingDataApi } from "@/lib/api";

export default function DemoPage() {
  const searchParams = useSearchParams();
  const runId = searchParams?.get("run_id");

  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [hoveredFinding, setHoveredFinding] = useState<Finding | null>(null);
  const [evidenceFinding, setEvidenceFinding] = useState<Finding | null>(null);
  const [simulationFinding, setSimulationFinding] = useState<Finding | null>(null);

  const [loading, setLoading] = useState(false);
  const [liveRun, setLiveRun] = useState<any>(null);
  const [liveEvents, setLiveEvents] = useState<EventData[]>([]);
  const [liveFindings, setLiveFindings] = useState<Finding[]>([]);

  const loadRunData = async () => {
    if (!runId) return;
    setLoading(true);
    try {
      const [detail, events, findings] = await Promise.all([
        fetchRunDetail(runId),
        fetchRunEvents(runId),
        fetchRunFindings(runId),
      ]);

      if (detail) setLiveRun(detail);

      if (events && events.length > 0) {
        const mappedEvents: EventData[] = events.map((e: EventDataApi) => ({
          sequence_number: e.sequence_number,
          event_type: e.event_type as any,
          tool_name: e.tool_name,
          input_preview: e.input_preview || undefined,
          output_preview: e.output_preview || undefined,
          status: e.status,
          tokens_in: e.tokens_in,
          tokens_out: e.tokens_out,
          latency_ms: e.latency_ms,
          timestamp: e.timestamp,
        }));
        setLiveEvents(mappedEvents);
      }

      if (findings && findings.length > 0) {
        const mappedFindings: Finding[] = findings.map((f: FindingDataApi) => ({
          id: f.id,
          type: f.type,
          severity: f.severity as any,
          step_start: f.step_start,
          step_end: f.step_end,
          description: f.description,
          evidence: f.evidence,
          waste_tokens: f.waste_tokens,
          waste_ms: f.waste_ms,
          waste_cost: f.waste_cost,
          explanation: f.explanation || undefined,
        }));
        setLiveFindings(mappedFindings);
      }
    } catch (err) {
      console.warn("Failed to fetch live run data, falling back to mock:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (runId) {
      loadRunData();
    }
  }, [runId]);

  // Default Mocked seed events for flawed run demo
  const defaultEvents: EventData[] = [
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

  // Default Mock findings for demo run
  const defaultFindings: Finding[] = [
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
      explanation: "The agent repeatedly called the 'search' tool with the exact same input, indicating it did not store or reuse the initial result.",
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

  const events = liveEvents.length > 0 ? liveEvents : defaultEvents;
  const findings = liveFindings.length > 0 ? liveFindings : defaultFindings;

  const totalStepsCount = events.length;
  const totalTokensCount = events.reduce((acc, e) => acc + e.tokens_in + e.tokens_out, 0);
  const totalWasteTokens = findings.reduce((acc, f) => acc + f.waste_tokens, 0);
  const totalWasteCost = findings.reduce((acc, f) => acc + f.waste_cost, 0);

  const minimapFlaggedRanges: FlaggedRange[] = findings.map((f) => ({
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
                <span className="font-mono text-xs text-faint">
                  {liveRun ? `RUN #${String(liveRun.id).substring(0, 6).toUpperCase()}` : "RUN #8F30"}
                </span>
                <StatusBadge status={liveRun?.status || (findings.length > 0 ? "loop" : "completed")} />
              </div>
              <h1 className="font-display text-xl font-medium text-text mt-0.5">
                {liveRun?.input ? `"${liveRun.input}"` : '"Find three hotels in Paris with available rooms"'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {liveRun ? (
              <span className="px-2.5 py-1 rounded bg-ok-bg text-ok text-xs font-mono border border-ok/20">
                Live Trace
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded bg-stuck-bg text-stuck text-xs font-mono border border-stuck/20">
                Demo Mode (Read-Only)
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Top Metric Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile label="Total duration" value={liveRun?.duration_ms ? `${(liveRun.duration_ms / 1000).toFixed(1)} s` : "18.4 s"} />
          <StatTile label="Total steps" value={totalStepsCount} />
          <StatTile label="Total tokens" value={totalTokensCount.toLocaleString()} />
          <StatTile label="Detected loops" value={findings.length} isStuck={findings.length > 0} subtext={`Waste: ${totalWasteTokens.toLocaleString()} tok ($${totalWasteCost.toFixed(2)})`} />
        </div>

        {/* Loop Minimap Full Width */}
        <LoopMinimap
          totalSteps={totalStepsCount}
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
              <span className="text-xs font-mono text-faint">{totalStepsCount} steps total</span>
            </div>

            <TimelineList
              events={events}
              findings={findings.map((f) => ({
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
                {findings.length} issues
              </span>
            </div>

            <div className="space-y-4">
              {findings.map((finding) => (
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
        totalSteps={totalStepsCount}
        onClose={() => setSimulationFinding(null)}
      />
    </div>
  );
}

