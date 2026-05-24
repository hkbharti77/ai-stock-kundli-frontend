"use client";

import React, { useEffect, useState } from "react";

interface MacroIndicators {
  repo_rate: number;
  cpi_inflation: number;
  fii_flows_monthly: number;
  inr_usd: number;
}

interface MacroEnvironmentWidgetProps {
  sector: string;
  macroScore?: number;
  strengths?: string[];
  concerns?: string[];
}

export default function MacroEnvironmentWidget({
  sector = "Technology",
  macroScore = 60,
  strengths = [],
  concerns = []
}: MacroEnvironmentWidgetProps) {
  const [indicators, setIndicators] = useState<MacroIndicators>({
    repo_rate: 6.50,
    cpi_inflation: 4.85,
    fii_flows_monthly: 12450.0,
    inr_usd: 83.45
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMacroIndicators() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = localStorage.getItem("access_token");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        
        const res = await fetch(`${apiUrl}/api/v1/companies/macro-data/indicators`, { headers });
        if (res.ok) {
          const data = await res.json();
          setIndicators({
            repo_rate: data.repo_rate ?? 6.50,
            cpi_inflation: data.cpi_inflation ?? 4.85,
            fii_flows_monthly: data.fii_flows_monthly ?? 12450.0,
            inr_usd: data.inr_usd ?? 83.45
          });
        }
      } catch (err) {
        console.error("Failed to load macro indicators:", err);
      } finally {
        setLoading(false);
      }
    }

    loadMacroIndicators();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
    if (score >= 50) return "text-gold-400 border-amber-500/20 bg-amber-500/10";
    return "text-rose-400 border-rose-500/20 bg-rose-500/10";
  };

  // Safe tags for dynamic sector environmental tailwinds & headwinds
  const defaultTailwinds = strengths.length > 0 ? strengths : [
    "Resilient domestic demand cushioned by strong credit cycles.",
    "Decelerating wholesale inflation stabilizing input costs."
  ];

  const defaultHeadwinds = concerns.length > 0 ? concerns : [
    "High global interest rates exerting depreciation pressure on the INR.",
    "Elevated crude prices impacting logistics and import balance sheets."
  ];

  return (
    <div className="glass-card p-5 space-y-4 border border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500/5 to-transparent blur-2xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex justify-between items-center pb-3 border-b border-white/5">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
            <svg className="h-4 w-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2a2.5 2.5 0 002.5-2.5V14a2 2 0 00-2-2h-.5A2.5 2.5 0 0113 9.5V6a1.5 1.5 0 00-1.5-1.5h-1A2.5 2.5 0 008 3.935z" />
            </svg>
            Macroeconomic Environment
          </h4>
          <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider block mt-0.5">National Indicators Snapshot</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${getScoreColor(macroScore)}`}>
          Outlook Score: {macroScore}/100
        </span>
      </div>

      {/* DYNAMIC METRIC SNAPSHOT GRID */}
      <div className="grid grid-cols-2 gap-3">
        {/* Repo Rate */}
        <div className="bg-white/[0.005] border border-white/5 p-2.5 rounded-xl space-y-1">
          <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-wider block">RBI Repo Rate</span>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold font-mono text-white">
              {loading ? "..." : `${indicators.repo_rate.toFixed(2)}%`}
            </span>
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Stable</span>
          </div>
        </div>

        {/* CPI Inflation */}
        <div className="bg-white/[0.005] border border-white/5 p-2.5 rounded-xl space-y-1">
          <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-wider block">CPI Inflation</span>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold font-mono text-white">
              {loading ? "..." : `${indicators.cpi_inflation.toFixed(2)}%`}
            </span>
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Moderate</span>
          </div>
        </div>

        {/* INR/USD exchange */}
        <div className="bg-white/[0.005] border border-white/5 p-2.5 rounded-xl space-y-1">
          <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-wider block">INR / USD Forex</span>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold font-mono text-white">
              {loading ? "..." : `₹${indicators.inr_usd.toFixed(2)}`}
            </span>
            <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Consolidating</span>
          </div>
        </div>

        {/* FII Flows */}
        <div className="bg-white/[0.005] border border-white/5 p-2.5 rounded-xl space-y-1">
          <span className="text-[9px] font-extrabold text-gray-500 uppercase tracking-wider block">FII Net Flows</span>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold font-mono text-white">
              {loading ? "..." : `+₹${indicators.fii_flows_monthly.toLocaleString("en-IN")} Cr`}
            </span>
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Inflow</span>
          </div>
        </div>
      </div>

      {/* SECTOR ENVIRONMENT ANALYSIS */}
      <div className="space-y-2.5 pt-2 border-t border-white/5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase font-extrabold text-gray-500 tracking-wider">Macro Environmental Impact</span>
          <span className="text-[9px] bg-electric-500/10 text-electric-400 border border-electric-500/25 px-2 py-0.5 rounded font-extrabold uppercase tracking-widest">{sector} Sector</span>
        </div>

        {/* Tailwinds List */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
            Active Tailwinds
          </span>
          <ul className="space-y-1 pl-2.5 text-[10px] text-gray-400 leading-relaxed font-medium">
            {defaultTailwinds.slice(0, 2).map((tw, idx) => (
              <li key={idx} className="list-disc">{tw}</li>
            ))}
          </ul>
        </div>

        {/* Headwinds List */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-extrabold text-rose-400 uppercase tracking-wider block flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
            Active Headwinds
          </span>
          <ul className="space-y-1 pl-2.5 text-[10px] text-gray-400 leading-relaxed font-medium">
            {defaultHeadwinds.slice(0, 2).map((hw, idx) => (
              <li key={idx} className="list-disc">{hw}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
