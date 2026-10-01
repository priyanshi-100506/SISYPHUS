"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { CreateProjectModal } from "@/components/projects/create-project-modal";

export default function ProjectDashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "loops" | "failed">("all");

  const mockRuns = [
    {
      id: "run_8f31",
      display_id: "#8F31",
      status: "completed",
      steps: 12,
      duration: "4.2 s",
      tokens: "3.4k",
      cost: "$0.02",
      ago: "2m ago",
    },
    {
      id: "run_8f30",
      display_id: "#8F30",
      status: "loop",
      steps: 31,
      duration: "18.4 s",
      tokens: "8.4k",
      cost: "$0.08",
      ago: "14m ago",
    },
    {
      id: "run_8f29",
      display_id: "#8F29",
      status: "completed",
      steps: 9,
      duration: "3.1 s",
      tokens: "2.8k",
      cost: "$0.01",
      ago: "1h ago",
    },
    {
      id: "run_8f28",
      display_id: "#8F28",
      status: "timeout",
      steps: 42,
      duration: "42.2 s",
      tokens: "14.1k",
      cost: "$0.14",
      ago: "3h ago",
    },
  ];

  const filteredRuns = mockRuns.filter((r) => {
    if (filter === "loops") return r.status === "loop";
    if (filter === "failed") return r.status === "failed" || r.status === "timeout";
    return true;
  });

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border-soft bg-surface px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded text-muted hover:text-text hover:bg-surface-2">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-xs text-accent font-mono uppercase font-semibold">
                Project Dashboard
              </span>
              <h1 className="font-display text-2xl font-semibold text-text mt-0.5">
                Research Agent
              </h1>
            </div>
          </div>

          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            New project
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stat Tiles Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile label="Total runs" value={143} />
          <StatTile label="Detected loops" value={7} isStuck={true} subtext="Waste: 18.2k tok" />
          <StatTile label="Failed runs" value={12} />
          <StatTile label="Total tokens" value="184,291" subtext="Avg 1.2k/run" />
        </div>

        {/* Recent Runs Table */}
        <div className="bg-surface border border-border rounded-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-soft">
            <h3 className="font-sans font-semibold text-sm text-text">
              Recent Execution Runs
            </h3>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 text-xs font-sans">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded transition-colors ${
                  filter === "all" ? "bg-surface-2 text-text font-medium" : "text-muted hover:text-text"
                }`}
              >
                All runs
              </button>
              <button
                onClick={() => setFilter("loops")}
                className={`px-3 py-1 rounded transition-colors ${
                  filter === "loops" ? "bg-stuck-bg text-stuck font-medium" : "text-muted hover:text-text"
                }`}
              >
                Loops only
              </button>
              <button
                onClick={() => setFilter("failed")}
                className={`px-3 py-1 rounded transition-colors ${
                  filter === "failed" ? "bg-danger-bg text-danger font-medium" : "text-muted hover:text-text"
                }`}
              >
                Failures
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredRuns.map((run) => (
              <Link
                key={run.id}
                href="/demo"
                className="group flex items-center justify-between p-3.5 bg-surface-2/60 border border-border-soft rounded-tile hover:bg-surface-2 hover:border-border transition-all duration-150 font-mono text-xs"
              >
                <div className="flex items-center gap-4">
                  <StatusBadge status={run.status} />
                  <span className="text-text font-semibold">{run.display_id}</span>
                  <span className="text-muted font-sans">{run.steps} steps</span>
                </div>

                <div className="flex items-center gap-6 text-faint font-tabular">
                  <span>{run.duration}</span>
                  <span>{run.tokens} tokens</span>
                  <span>{run.cost}</span>
                  <span className="text-muted">{run.ago}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
