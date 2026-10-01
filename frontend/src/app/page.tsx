"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { LoopMinimap } from "@/components/ui/loop-minimap";
import { CreateProjectModal } from "@/components/projects/create-project-modal";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Demo run data for live interactive preview on landing page
  const demoTotalSteps = 31;
  const demoFlaggedRanges = [
    {
      step_start: 4,
      step_end: 9,
      type: "REPEATED_TOOL",
      description: "search ran 6 times with the same input",
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-accent-light selection:text-bg">
      {/* Navigation Header */}
      <header className="border-b border-border-soft bg-bg/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-sans font-bold text-lg tracking-[0.18em] text-text uppercase">
              SISYPHUS
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-surface-2 text-faint font-mono border border-border-soft">
              v1.0
            </span>
          </div>

          <nav className="flex items-center gap-6 text-sm font-sans">
            <Link href="/demo" className="text-muted hover:text-text transition-colors">
              Demo
            </Link>
            <Link
              href="https://github.com/priyanshi-100506/SISYPHUS"
              target="_blank"
              className="text-muted hover:text-text transition-colors"
            >
              Docs
            </Link>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
              Create project
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section with Diagonal Paint Split */}
      <section className="relative overflow-hidden pt-16 pb-24 border-b border-border-soft">
        {/* Background Hard Diagonal Split */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 600">
            <defs>
              <linearGradient id="hero-oxblood-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3A0913" />
                <stop offset="100%" stopColor="#12080C" />
              </linearGradient>
            </defs>
            <polygon points="450,0 1000,0 1000,600 350,600" fill="url(#hero-oxblood-grad)" />
            <line x1="450" y1="0" x2="350" y2="600" stroke="#C65A74" strokeWidth="2" opacity="0.6" />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline and Call to Actions */}
          <div className="lg:col-span-6 flex flex-col space-y-6">
            <h1 className="font-display text-5xl lg:text-[64px] font-semibold leading-[1.08] tracking-tight text-text">
              See where your AI agent gets stuck.
            </h1>

            <p className="text-lg text-muted font-sans font-normal leading-relaxed max-w-xl">
              Send your agent's tool calls to SISYPHUS. It shows which calls repeated, which retries failed, and what they cost.
            </p>

            <div className="flex items-center gap-4 pt-2">
              <Link href="/demo">
                <Button size="lg" className="gap-2">
                  Try the demo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setIsModalOpen(true)}
              >
                Create project
              </Button>
            </div>
          </div>

          {/* Right Column: Live Run Demo Panel */}
          <div className="lg:col-span-6">
            <div className="bg-surface border border-border rounded-card p-6 shadow-2xl box-ridge space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border-soft">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-faint font-semibold">
                    RUN #8F30
                  </span>
                  <StatusBadge status="loop" />
                </div>
                <span className="text-xs font-mono text-faint">
                  Demo run: 31 steps, 8,412 tokens, 18.4 s
                </span>
              </div>

              {/* Loop Minimap component */}
              <LoopMinimap
                totalSteps={demoTotalSteps}
                flaggedRanges={demoFlaggedRanges}
              />

              {/* Finding Notice */}
              <div className="bg-stuck-bg border border-stuck/30 rounded p-3 text-xs font-sans text-text">
                <p className="font-semibold text-stuck mb-0.5">Repeated tool call</p>
                <p>search ran 6 times with the same input (steps 4-9). About 2,184 tokens wasted.</p>
              </div>

              <div className="pt-1 flex justify-end">
                <Link
                  href="/demo"
                  className="text-xs text-accent hover:underline font-sans font-medium inline-flex items-center gap-1"
                >
                  Explore demo run →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Below the Fold: How it works (4 numbered steps) */}
      <section className="py-20 border-b border-border-soft bg-surface">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <h2 className="font-display text-3xl font-semibold text-text">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 bg-surface-2 border border-border-soft rounded-card space-y-3">
              <div className="w-8 h-8 rounded-full bg-accent-bg text-accent flex items-center justify-center font-mono text-sm font-bold">
                1
              </div>
              <h3 className="font-sans font-semibold text-text">1. Create project</h3>
              <p className="text-xs text-muted leading-relaxed">
                Create a project and copy its key.
              </p>
            </div>

            <div className="p-5 bg-surface-2 border border-border-soft rounded-card space-y-3">
              <div className="w-8 h-8 rounded-full bg-accent-bg text-accent flex items-center justify-center font-mono text-sm font-bold">
                2
              </div>
              <h3 className="font-sans font-semibold text-text">2. Post events</h3>
              <p className="text-xs text-muted leading-relaxed">
                POST your agent's tool calls to the API.
              </p>
            </div>

            <div className="p-5 bg-surface-2 border border-border-soft rounded-card space-y-3">
              <div className="w-8 h-8 rounded-full bg-stuck-bg text-stuck flex items-center justify-center font-mono text-sm font-bold">
                3
              </div>
              <h3 className="font-sans font-semibold text-text">3. Read findings</h3>
              <p className="text-xs text-muted leading-relaxed">
                Open the run and read the findings.
              </p>
            </div>

            <div className="p-5 bg-surface-2 border border-border-soft rounded-card space-y-3">
              <div className="w-8 h-8 rounded-full bg-ok-bg text-ok flex items-center justify-center font-mono text-sm font-bold">
                4
              </div>
              <h3 className="font-sans font-semibold text-text">4. View evidence</h3>
              <p className="text-xs text-muted leading-relaxed">
                Click a finding to see the exact steps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-bg text-xs text-faint">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <p>© 2026 SISYPHUS Platform.</p>
          <div className="flex gap-6">
            <Link href="/demo" className="hover:text-text">
              Demo
            </Link>
            <Link href="https://github.com/priyanshi-100506/SISYPHUS" className="hover:text-text">
              GitHub
            </Link>
          </div>
        </div>
      </footer>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
