"use client";

import React from "react";

interface TechnicalGaugeProps {
  score: number;
  trend: string;
  patterns: string[];
  supports: number[];
  resistances: number[];
  stopLossZone: number | number[];
  rsi: number | null;
  macdSignal: string; // e.g. "Bullish Crossover", "Bearish", "Neutral"
}

export default function TechnicalGauge({
  score,
  trend,
  patterns,
  supports,
  resistances,
  stopLossZone,
  rsi,
  macdSignal
}: TechnicalGaugeProps) {
  const scoreColor = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#f43f5e";
  const badgeColor = score >= 75
    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
    : score >= 50
    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
    : "bg-rose-500/10 text-rose-400 border border-rose-500/20";
  
  const scoreText = score >= 75 ? "BULLISH CHARGE" : score >= 50 ? "SIDEWAYS ACCUMULATION" : "BEARISH RISK";
  const circleRadius = 60;
  const strokeW = 10;

  return (
    <div className="glass-card p-6 overflow-hidden relative space-y-6">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] to-electric-500/[0.02]" />
      
      <div>
        <h3 className="text-md font-bold text-white relative z-10 flex items-center gap-2">
          Technical Health Gauge
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 relative z-10">AI-driven momentum & multi-indicator consolidation</p>
      </div>

      {/* Score Circle Gauge */}
      <div className="flex flex-col items-center justify-center my-4 relative z-10">
        <div className="relative flex items-center justify-center h-36 w-36">
          <svg className="h-full w-full transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r={circleRadius}
              fill="transparent"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={strokeW}
            />
            <circle
              cx="72"
              cy="72"
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
            <span className="text-3xl font-extrabold font-mono text-white">{score}</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Tech Score</span>
          </div>
        </div>

        <span className={`mt-4 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${badgeColor}`}>
          {scoreText}
        </span>
      </div>

      {/* Active Candlestick Patterns */}
      <div className="space-y-2 relative z-10 border-t border-white/5 pt-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider text-gray-400">
          Detected Price Action Patterns
        </h4>
        {patterns.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {patterns.map((pat, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20"
              >
                {pat}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[11px] text-gray-500 italic block">No active candlestick patterns detected</span>
        )}
      </div>

      {/* Support & Resistance Levels Grid */}
      <div className="grid grid-cols-2 gap-4 relative z-10 border-t border-white/5 pt-4">
        <div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">
            Support Levels (S)
          </span>
          <div className="space-y-1.5 font-mono text-xs text-white">
            {supports.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center bg-emerald-950/20 border border-emerald-900/30 p-1.5 rounded">
                <span className="text-gray-500 font-bold">S{idx + 1}</span>
                <span className="font-extrabold text-emerald-400">₹{s.toFixed(2)}</span>
              </div>
            ))}
            {supports.length === 0 && <span className="text-gray-600">No key supports found</span>}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block mb-2">
            Resistance Levels (R)
          </span>
          <div className="space-y-1.5 font-mono text-xs text-white">
            {resistances.map((r, idx) => (
              <div key={idx} className="flex justify-between items-center bg-rose-950/20 border border-rose-900/30 p-1.5 rounded">
                <span className="text-gray-500 font-bold">R{idx + 1}</span>
                <span className="font-extrabold text-rose-400">₹{r.toFixed(2)}</span>
              </div>
            ))}
            {resistances.length === 0 && <span className="text-gray-600">No key resistances found</span>}
          </div>
        </div>
      </div>

      {/* Stop Loss & Key Metrics */}
      <div className="space-y-3 relative z-10 border-t border-white/5 pt-4">
        <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
          <span className="text-gray-500">Suggested Stop Loss Zone</span>
          <span className="font-mono font-extrabold text-amber-400">
            {stopLossZone !== undefined && stopLossZone !== null
              ? typeof stopLossZone === "number"
                ? `₹${(stopLossZone as number).toFixed(2)}`
                : Array.isArray(stopLossZone) && (stopLossZone as any).length === 2
                  ? `₹${(stopLossZone as any)[0].toFixed(2)} - ₹${(stopLossZone as any)[1].toFixed(2)}`
                  : Array.isArray(stopLossZone) && (stopLossZone as any).length === 1
                    ? `₹${(stopLossZone as any)[0].toFixed(2)}`
                    : "—"
              : "—"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
          <span className="text-gray-500">Primary Trend (Daily)</span>
          <span className={`font-semibold uppercase ${
            trend.toLowerCase() === "bullish" 
              ? "text-emerald-400" 
              : trend.toLowerCase() === "bearish" 
                ? "text-rose-400" 
                : "text-amber-400"
          }`}>
            {trend}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">MACD Momentum Signal</span>
          <span className="font-semibold text-white">
            {macdSignal}
          </span>
        </div>
      </div>
    </div>
  );
}
