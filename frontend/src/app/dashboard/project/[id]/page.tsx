"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { fetchProject, fetchProjectRuns, ProjectData, RunData } from "@/lib/api";

export default function ProjectDashboardPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [runs, setRuns] = useState<RunData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "loops" | "failed">("all");

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (projectId && projectId !== "demo") {
        let storedKey: string | undefined = undefined;
        if (typeof window !== "undefined") {
          try {
            storedKey = localStorage.getItem(`sisyphus_key_${projectId}`) || undefined;
          } catch (_) {}
        }
        const [projData, runsData] = await Promise.all([
          fetchProject(projectId),
          fetchProjectRuns(projectId, storedKey),
        ]);
        setProject(projData);
        setRuns(runsData);
      }
    } catch (err) {
      console.warn("API fetch error, falling back to mock data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [projectId]);

  // Fallback mock runs if backend runs array is empty
  const defaultRuns = [
    {
      id: "run_8f31",
      status: "completed",
      total_steps: 12,
      started_at: new Date(Date.now() - 120000).toISOString(),
      finished_at: new Date(Date.now() - 115800).toISOString(),
      total_tokens_in: 2400,
      total_tokens_out: 1000,
      estimated_cost: "0.02",
      input: "Summarize research on quantum computing",
    },
    {
      id: "run_8f30",
      status: "loop",
      total_steps: 31,
      started_at: new Date(Date.now() - 840000).toISOString(),
      finished_at: new Date(Date.now() - 821600).toISOString(),
      total_tokens_in: 5800,
      total_tokens_out: 2600,
      estimated_cost: "0.08",
      input: "Find three hotels in Paris with available rooms",
    },
    {
      id: "run_8f29",
      status: "completed",
      total_steps: 9,
      started_at: new Date(Date.now() - 3600000).toISOString(),
      finished_at: new Date(Date.now() - 3596900).toISOString(),
      total_tokens_in: 2000,
      total_tokens_out: 800,
      estimated_cost: "0.01",
      input: "Extract entity names from text block",
    },
  ];

  const displayRuns = runs.length > 0 ? runs : (defaultRuns as any[]);

  const filteredRuns = displayRuns.filter((r) => {
    if (filter === "loops") return r.status === "loop";
    if (filter === "failed") return r.status === "failed" || r.status === "timeout";
    return true;
  });

  const totalRunsCount = displayRuns.length;
  const loopCount = displayRuns.filter((r) => r.status === "loop").length;
  const failedCount = displayRuns.filter((r) => r.status === "failed" || r.status === "timeout").length;
  const totalTokens = displayRuns.reduce((acc, r) => acc + (r.total_tokens_in || 0) + (r.total_tokens_out || 0), 0);

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
                {project ? project.name : "Research Agent"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button size="sm" variant="secondary" onClick={loadDashboardData} disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" />
              New project
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stat Tiles Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile label="Total runs" value={totalRunsCount} />
          <StatTile label="Detected loops" value={loopCount} isStuck={loopCount > 0} subtext={loopCount > 0 ? "Action required" : "Clean execution"} />
          <StatTile label="Failed runs" value={failedCount} />
          <StatTile label="Total tokens" value={totalTokens.toLocaleString()} subtext={totalRunsCount > 0 ? `Avg ~${Math.round(totalTokens / totalRunsCount).toLocaleString()}/run` : ""} />
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
            {filteredRuns.map((run) => {
              const runIdStr = typeof run.id === "string" ? run.id : String(run.id);
              const displayId = "#" + runIdStr.substring(0, 6).toUpperCase();
              const tokensTotal = (run.total_tokens_in || 0) + (run.total_tokens_out || 0);

              return (
                <Link
                  key={runIdStr}
                  href={`/demo?run_id=${runIdStr}`}
                  className="group flex items-center justify-between p-3.5 bg-surface-2/60 border border-border-soft rounded-tile hover:bg-surface-2 hover:border-border transition-all duration-150 font-mono text-xs"
                >
                  <div className="flex items-center gap-4">
                    <StatusBadge status={run.status} />
                    <span className="text-text font-semibold">{displayId}</span>
                    <span className="text-muted font-sans truncate max-w-xs">{run.input || `${run.total_steps || 0} steps`}</span>
                  </div>

                  <div className="flex items-center gap-6 text-faint font-tabular">
                    <span>{run.total_steps || 0} steps</span>
                    <span>{tokensTotal.toLocaleString()} tokens</span>
                    <span>${Number(run.estimated_cost || 0).toFixed(2)}</span>
                    <span className="text-muted">{run.started_at ? new Date(run.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "recently"}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadDashboardData}
      />
    </div>
  );
}

