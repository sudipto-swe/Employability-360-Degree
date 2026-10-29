"use client";

import React from "react";

interface CircularMatchProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export function CircularMatch({
  percentage,
  size = 52,
  strokeWidth = 5,
  showLabel = true,
}: CircularMatchProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct >= 80) return { stroke: "#10b981", bg: "rgba(16,185,129,0.12)", text: "text-emerald-600" };
    if (pct >= 60) return { stroke: "#3b82f6", bg: "rgba(59,130,246,0.12)", text: "text-blue-600" };
    if (pct >= 40) return { stroke: "#f59e0b", bg: "rgba(245,158,11,0.12)", text: "text-amber-600" };
    return { stroke: "#ef4444", bg: "rgba(239,68,68,0.12)", text: "text-red-500" };
  };

  const colors = getColor(percentage);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/40"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showLabel && (
        <span className={`absolute text-[11px] font-bold ${colors.text}`}>
          {percentage}%
        </span>
      )}
    </div>
  );
}
