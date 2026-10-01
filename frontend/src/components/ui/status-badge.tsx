import React from "react";
import { Check, RefreshCw, AlertTriangle, X } from "lucide-react";

export type RunStatus = "completed" | "loop" | "retrying" | "failed" | "terminated" | "timeout" | "running";

interface StatusBadgeProps {
  status: RunStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const normStatus = status.toLowerCase();

  switch (normStatus) {
    case "completed":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-chip text-xs font-medium bg-ok-bg text-ok border border-ok/20 ${className}`}>
          <Check className="w-3.5 h-3.5" />
          Completed
        </span>
      );
    case "loop":
    case "loop_detected":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-chip text-xs font-medium bg-stuck-bg text-stuck border border-stuck/20 ${className}`}>
          <RefreshCw className="w-3.5 h-3.5" />
          Loop detected
        </span>
      );
    case "retrying":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-chip text-xs font-medium bg-warn-bg text-warn border border-warn/20 ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          Retrying
        </span>
      );
    case "failed":
    case "terminated":
    case "timeout":
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-chip text-xs font-medium bg-danger-bg text-danger border border-danger/20 ${className}`}>
          <X className="w-3.5 h-3.5" />
          {normStatus === "timeout" ? "Timeout" : normStatus === "terminated" ? "Terminated" : "Failed"}
        </span>
      );
    case "running":
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-chip text-xs font-medium bg-accent-bg text-accent border border-accent/20 ${className}`}>
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
          Running
        </span>
      );
  }
};
