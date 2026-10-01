"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [health, setHealth] = useState<{ status: string; db: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/healthz`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md w-full p-6 bg-surface border border-border rounded-card shadow-lg">
        <h1 className="text-2xl font-bold tracking-widest text-text mb-2">SISYPHUS</h1>
        <p className="text-muted text-sm mb-6">See where your AI agent gets stuck.</p>
        
        <div className="p-4 bg-surface-2 rounded border border-border text-left font-mono text-sm">
          <div className="text-muted mb-2">// Backend Health Check (/healthz)</div>
          {error ? (
            <div className="text-danger flex items-center gap-2">
              <span>✕</span> Error connecting to backend: {error}
            </div>
          ) : health ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-ok">✓</span> Status: <span className="text-ok">{health.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-ok">✓</span> DB Connection: <span className="text-ok">{health.db}</span>
              </div>
            </div>
          ) : (
            <div className="text-faint animate-pulse">Checking health status...</div>
          )}
        </div>
      </div>
    </main>
  );
}
