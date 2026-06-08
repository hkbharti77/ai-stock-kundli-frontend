"use client";

import React from "react";

interface RiskFlagsPanelProps {
  promoterHolding: number;
  promoterPledge: number;
  fiiHolding: number;
  diiHolding: number;
  publicHolding: number;
  debtEquity: number;
  hasLegalAlerts: boolean;
  riskScore: number;
  riskCategory: string;
}

export default function RiskFlagsPanel({
  promoterHolding = 54.5,
  promoterPledge = 0.0,
  fiiHolding = 18.2,
  diiHolding = 12.3,
  publicHolding = 15.0,
  debtEquity = 0.5,
  hasLegalAlerts = false,
  riskScore = 75,
  riskCategory = "Low"
}: RiskFlagsPanelProps) {

  // High-pledging threshold check (>30% is a critical trigger)
  const isPledgeCritical = promoterPledge > 30.0;
  // High leverage threshold check (>1.5x)
  const isLeverageCritical = debtEquity > 1.5;

  const getRiskColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "low":
        return { text: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/10", glow: "shadow-emerald-500/20" };
      case "medium":
        return { text: "text-gold-400", border: "border-amber-500/20", bg: "bg-amber-500/10", glow: "shadow-amber-500/20" };
      case "high":
        return { text: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/10", glow: "shadow-orange-500/20" };
      case "critical":
      default:
        return { text: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/10", glow: "shadow-rose-500/20" };
    }
  };

  const colors = getRiskColor(riskCategory);

  return (
    <div className="glass-card p-5 space-y-5 border border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500/5 to-transparent blur-2xl pointer-events-none" />

      {/* Title & Governance/Risk Category Badge */}
      <div className="flex justify-between items-center pb-3 border-b border-white/5">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
            <svg className="h-4 w-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Corporate Risk & Governance
          </h4>
          <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider block mt-0.5">Governance Audit Score: {riskScore}/100</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${colors.bg} ${colors.text} ${colors.border} shadow-sm ${colors.glow} animate-pulse`}>
          {riskCategory} Risk
        </span>
      </div>

      {/* ACTIVE RISK FLAGS & AUDITS */}
      <div className="space-y-3">
        {/* Promoter Pledging Flag */}
        <div className={`p-3 rounded-xl border flex items-start gap-3 transition duration-300 ${isPledgeCritical
            ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
            : "bg-white/[0.005] border-white/5 text-gray-300"
          }`}>
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${isPledgeCritical ? "bg-rose-500/20 text-rose-400" : "bg-white/5 text-gray-400"
            }`}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">Promoter Share Pledging</span>
              <span className={`text-xs font-bold font-mono ${isPledgeCritical ? "text-rose-400" : "text-emerald-400"}`}>
                {promoterPledge.toFixed(2)}%
              </span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              {isPledgeCritical
                ? "⚠️ CRITICAL ALERT: Promoter pledged shares exceed the 30% safety threshold, exposing the stock to margin-call liquidation risks."
                : "Promoters have kept pledge levels safe and healthy, indicating zero immediate margin-call liquidation threat."}
            </p>
          </div>
        </div>

        {/* Debt-to-Equity Auditor Flag */}
        <div className={`p-3 rounded-xl border flex items-start gap-3 transition duration-300 ${isLeverageCritical
            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
            : "bg-white/[0.005] border-white/5 text-gray-300"
          }`}>
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${isLeverageCritical ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-gray-400"
            }`}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">Debt / Equity Ratio</span>
              <span className={`text-xs font-bold font-mono ${isLeverageCritical ? "text-amber-400" : "text-emerald-400"}`}>
                {debtEquity.toFixed(2)}x
              </span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              {isLeverageCritical
                ? "⚠️ LEVERAGE WARNING: Debt/Equity ratio exceeds 1.5x. High structural leverage may squeeze net margins during credit cycles."
                : "Debt structure is extremely conservative and well-funded. Strong solvency profile."}
            </p>
          </div>
        </div>

        {/* Legal & Regulatory SEBI Notices */}
        <div className={`p-3 rounded-xl border flex items-start gap-3 transition duration-300 ${hasLegalAlerts
            ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
            : "bg-white/[0.005] border-white/5 text-gray-300"
          }`}>
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${hasLegalAlerts ? "bg-rose-500/20 text-rose-400 animate-pulse" : "bg-white/5 text-emerald-400"
            }`}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white">Regulatory / SEBI Warning Alerts</span>
            <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
              {hasLegalAlerts
                ? "🚨 ALERT DETECTED: Recent news feeds contain active litigation, promoter audit issues, or regulatory SEBI order keywords."
                : "No active regulatory inquiries, auditor disputes, or corporate governance warnings detected."}
            </p>
          </div>
        </div>
      </div>

      {/* SHAREHOLDING PATTERN BAR */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <span className="text-[10px] uppercase font-extrabold text-gray-500 tracking-wider">Shareholding Pattern Distribution</span>

        {/* Horizontal stacked bar chart */}
        <div className="h-4.5 w-full rounded-lg overflow-hidden flex border border-white/[0.03]">
          <div
            className="h-full bg-indigo-500 hover:opacity-95 transition-all duration-300 relative group cursor-pointer"
            style={{ width: `${promoterHolding}%` }}
            title={`Promoters: ${promoterHolding}%`}
          />
          <div
            className="h-full bg-cyan-400 hover:opacity-95 transition-all duration-300 relative group cursor-pointer"
            style={{ width: `${fiiHolding}%` }}
            title={`FIIs: ${fiiHolding}%`}
          />
          <div
            className="h-full bg-amber-400 hover:opacity-95 transition-all duration-300 relative group cursor-pointer"
            style={{ width: `${diiHolding}%` }}
            title={`DIIs: ${diiHolding}%`}
          />
          <div
            className="h-full bg-purple-500 hover:opacity-95 transition-all duration-300 relative group cursor-pointer"
            style={{ width: `${publicHolding}%` }}
            title={`Public: ${publicHolding}%`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-4 gap-2 pt-1 text-[10px] font-semibold text-gray-400">
          <div className="flex items-center gap-1.5 justify-center sm:justify-start">
            <span className="h-2 w-2 rounded bg-indigo-500 shrink-0" />
            <span className="truncate">Prom: {promoterHolding.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center sm:justify-start">
            <span className="h-2 w-2 rounded bg-cyan-400 shrink-0" />
            <span className="truncate">FII: {fiiHolding.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center sm:justify-start">
            <span className="h-2 w-2 rounded bg-amber-400 shrink-0" />
            <span className="truncate">DII: {diiHolding.toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-1.5 justify-center sm:justify-start">
            <span className="h-2 w-2 rounded bg-purple-500 shrink-0" />
            <span className="truncate">Pub: {publicHolding.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
