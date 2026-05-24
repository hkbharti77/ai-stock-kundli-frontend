"use client";

import React from "react";

interface KundliGaugeProps {
  score: number;
  roce: number | null | undefined;
  debtEquity: number | null | undefined;
  size?: "sm" | "md";
}

export default function KundliGauge({ score, roce, debtEquity, size = "md" }: KundliGaugeProps) {
  const isSm = size === "sm";
  const circleRadius = isSm ? 54 : 60;
  const strokeW = isSm ? 8 : 10;
  const containerSize = isSm ? "h-32 w-32" : "h-36 w-36";

  const scoreColor = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#f43f5e";
  const badgeColor = score >= 75
    ? "bg-emerald-500/10 text-emerald-400"
    : score >= 50
    ? "bg-gold-500/10 text-gold-400"
    : "bg-rose-500/10 text-rose-400";
  
  const strengthText = score >= 75 ? "EXCELLENT STRENGTH" : score >= 50 ? "MODERATE STRENGTH" : "HIGH CAUTION";

  return (
    <div className="glass-card p-6 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-electric-500/[0.02] to-gold-500/[0.02]" />
      <h3 className="text-md font-bold text-white relative z-10">AI Stock Kundli</h3>
      <p className="text-xs text-gray-500 mt-0.5 relative z-10">Multi-dimensional rating score based on ratios</p>
      
      <div className="flex flex-col items-center justify-center my-8 relative z-10">
        <div className={`relative flex items-center justify-center ${containerSize}`}>
          {/* Glassmorphic score circle gauge */}
          <svg className="h-full w-full transform -rotate-90">
            <circle
              cx={isSm ? "64" : "72"}
              cy={isSm ? "64" : "72"}
              r={circleRadius}
              fill="transparent"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={strokeW}
            />
            <circle
              cx={isSm ? "64" : "72"}
              cy={isSm ? "64" : "72"}
              r={circleRadius}
              fill="transparent"
              stroke={scoreColor}
              strokeWidth={strokeW}
              strokeDasharray={2 * Math.PI * circleRadius}
              strokeDashoffset={2 * Math.PI * circleRadius * (1 - score / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className={`${isSm ? "text-3xl" : "text-3xl"} font-extrabold font-mono text-white`}>{score}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Kundli Score</span>
          </div>
        </div>

        <span className={`mt-4 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${badgeColor}`}>
          {strengthText}
        </span>
      </div>

      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
          <span className="text-gray-500">ROCE Status</span>
          <span className="font-semibold text-white">
            {roce !== undefined && roce !== null ? `${roce.toFixed(1)}%` : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
          <span className="text-gray-500">Leverage Profile</span>
          <span className="font-semibold text-white">
            {debtEquity !== undefined && debtEquity !== null ? debtEquity.toFixed(2) : "0.00"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Data Freshness</span>
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"></span>
            Verified SLA
          </span>
        </div>
      </div>
    </div>
  );
}
