import React from "react";

interface StatTileProps {
  label: string;
  value: string | number;
  isStuck?: boolean;
  subtext?: string;
  className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  isStuck = false,
  subtext,
  className = "",
}) => {
  return (
    <div
      className={`bg-surface border border-border-soft rounded-tile p-4 flex flex-col justify-between ${className}`}
    >
      <span className="text-[13px] text-muted font-sans font-normal capitalize-first">
        {label}
      </span>
      <div className="mt-2 flex items-baseline justify-between">
        <span
          className={`font-display text-[36px] font-semibold leading-none font-tabular tracking-tight ${
            isStuck ? "text-stuck" : "text-text"
          }`}
        >
          {value}
        </span>
        {subtext && (
          <span className="text-xs text-faint font-mono ml-2">{subtext}</span>
        )}
      </div>
    </div>
  );
};
