"use client";

import React from "react";
import Link from "next/link";
import SEBIDisclaimer from "./SEBIDisclaimer";

export interface AgentContribution {
  agent_type: string;
  score: number;
  confidence: number;
  trend: string | null;
  weight: number;
  weighted_contribution: number;
}

export interface SignalSensitizer {
  trigger: string;
  direction: string;
  impact: string;
}

export interface ProbabilityHorizon {
  horizon: string;
  output: string;
  probability: number;
}

export interface KundliReportData {
  ticker: string;
  company_name: string;
  kundli_score: number;
  signal_label: string;
  signal_emoji: string;
  overall_confidence: number;
  trend: string;
  agents: AgentContribution[];
  data_completeness: number;
  signal_summary: string;
  top_positives: string[];
  top_risks: string[];
  sensitizers: SignalSensitizer[];
  confidence_note: string;
  methodology_url: string;
  generated_at: string;
  cached?: boolean;
  probability_horizons?: ProbabilityHorizon[];
}

interface VisualizerProps {
  report: KundliReportData;
}

export default function KundliReportVisualizer({ report }: VisualizerProps) {
  const parseMarkdown = (text: string | null | undefined): string => {
    if (!text) return "";
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />");
  };

  // Determine color matching for the score
  const getThemeColors = (score: number) => {
    if (score >= 80) return { border: "border-emerald-500/20", glow: "from-emerald-500/10 to-transparent", text: "text-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25", stroke: "#10b981" };
    if (score >= 65) return { border: "border-blue-500/20", glow: "from-blue-500/10 to-transparent", text: "text-blue-400", badge: "bg-blue-500/10 text-blue-400 border-blue-500/25", stroke: "#3b82f6" };
    if (score >= 45) return { border: "border-gold-500/20", glow: "from-gold-500/10 to-transparent", text: "text-gold-400", badge: "bg-gold-500/10 text-gold-400 border-gold-500/25", stroke: "#eab308" };
    if (score >= 30) return { border: "border-orange-500/20", glow: "from-orange-500/10 to-transparent", text: "text-orange-400", badge: "bg-orange-500/10 text-orange-400 border-orange-500/25", stroke: "#f97316" };
    return { border: "border-rose-500/20", glow: "from-rose-500/10 to-transparent", text: "text-rose-400", badge: "bg-rose-500/10 text-rose-400 border-rose-500/25", stroke: "#f43f5e" };
  };

  const colors = getThemeColors(report.kundli_score);

  // Formatting helpers
  const getAgentLabel = (agentType: string) => {
    switch (agentType) {
      case "fundamental_analyst": return "Fundamental Analyst";
      case "technical_analyst": return "Technical Analyst";
      case "news_analyst": return "News Analyst";
      case "risk_analyst": return "Risk & Governance Analyst";
      case "macro_analyst": return "Macroeconomic Analyst";
      default: return agentType;
    }
  };

  return (
    <div className="space-y-6">

      {/* 1. TOP HERO SECTION: Score Gauge, Signal Badge, and Data Completeness */}
      <div className="glass-card p-6 grid gap-6 md:grid-cols-3 items-center relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-r ${colors.glow} pointer-events-none`} />

        {/* CIRCULAR GAUGE COMPONENT */}
        <div className="flex flex-col items-center justify-center relative z-10 md:border-r border-white/5 py-4">
          <div className="relative flex items-center justify-center h-36 w-36">
            <svg className="h-full w-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="60"
                fill="transparent"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="10"
              />
              <circle
                cx="72"
                cy="72"
                r="60"
                fill="transparent"
                stroke={colors.stroke}
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 60}
                strokeDashoffset={2 * Math.PI * 60 * (1 - report.kundli_score / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold font-mono text-white">{report.kundli_score}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Kundli Score</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 mt-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${colors.badge} flex items-center gap-1.5`}>
              <span>{report.signal_emoji}</span>
              <span>{report.signal_label}</span>
            </span>
            {report.cached && (
              <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded mt-1.5">
                ⚡ Cached Report
              </span>
            )}
          </div>
        </div>

        {/* FACT SHEET & OVERVIEW */}
        <div className="md:col-span-2 space-y-4 relative z-10">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-500">Agent Consensus Summary</span>
            <h3 className="text-lg font-bold text-white mt-1 leading-snug">
              Multi-Agent Aggregated Analysis for <span className="font-mono text-electric-400 font-semibold">{report.ticker}</span>
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed mt-2" dangerouslySetInnerHTML={{ __html: parseMarkdown(report.signal_summary) }} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-white/5">
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Overall Trend Direction</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-sm font-bold uppercase tracking-wider ${report.trend === "improving" ? "text-emerald-400" :
                    report.trend === "declining" ? "text-rose-400" : "text-gold-400"
                  }`}>
                  {report.trend}
                </span>
                <svg className={`h-4.5 w-4.5 ${report.trend === "improving" ? "text-emerald-400" :
                    report.trend === "declining" ? "text-rose-400" : "text-gold-400"
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {report.trend === "improving" ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  ) : report.trend === "declining" ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14" />
                  )}
                </svg>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                <span>Data Completeness Indicator</span>
                <span className="text-gray-400 font-mono font-bold">{report.data_completeness}%</span>
              </div>
              <div className="h-2 w-full rounded bg-white/5 overflow-hidden mt-1.5 border border-white/[0.02]">
                <div
                  className="h-full rounded bg-gradient-to-r from-electric-600 to-electric-400 transition-all duration-1000"
                  style={{ width: `${report.data_completeness}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROBABILITY DISTRIBUTION ENGINE HORIZONS */}
      {report.probability_horizons && report.probability_horizons.length > 0 && (
        <div className="glass-card p-6 space-y-4 border-indigo-500/10 bg-indigo-500/[0.005]">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
              <svg className="h-3.5 w-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            AI Quantitative Probability Engine (Calibrated Horizons)
          </h4>
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
            Horizon-based probabilistic forecasts calculated using historical returns volatility, fundamental quality shifts, and technical breakouts.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {report.probability_horizons.map((horizon, idx) => {
              const pct = horizon.probability;
              const probColors = pct >= 75 ? "text-emerald-400" : pct >= 50 ? "text-blue-400" : pct >= 30 ? "text-yellow-400" : "text-rose-400";
              const probBg = pct >= 75 ? "bg-emerald-500/10 border-emerald-500/20" : pct >= 50 ? "bg-blue-500/10 border-blue-500/20" : pct >= 30 ? "bg-yellow-500/10 border-yellow-500/20" : "bg-rose-500/10 border-rose-500/20";
              return (
                <div key={idx} className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.01] p-4 flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">{horizon.horizon}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold border ${probBg} ${probColors}`}>
                      {pct}%
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-white font-semibold leading-snug">{horizon.output}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-white/5 rounded overflow-hidden">
                      <div
                        className={`h-full rounded ${pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-blue-500" : pct >= 30 ? "bg-yellow-500" : "bg-rose-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. THREE-AGENT DATA CONTRIBUTION DETAILS */}
      <div className="glass-card p-6 space-y-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <svg className="h-4 w-4 text-electric-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
          Multi-Agent Score Weight Contribution Breakdown
        </h4>
        <div className="grid gap-4 sm:grid-cols-3">
          {report.agents.map((agent, index) => {
            const agentColors = getThemeColors(agent.score);
            return (
              <div key={index} className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.01] p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-xs font-bold text-white">{getAgentLabel(agent.agent_type)}</h5>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Weight Coefficient: {(agent.weight * 100).toFixed(0)}%</span>
                  </div>
                  <span className={`text-base font-extrabold font-mono ${agentColors.text}`}>
                    {agent.score > 0 ? `${agent.score}/100` : "N/A"}
                  </span>
                </div>

                {agent.score > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-gray-400">
                      <span>Weighted Score Share:</span>
                      <span className="font-mono font-bold text-white">+{agent.weighted_contribution} pts</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded overflow-hidden">
                      <div
                        className="h-full rounded bg-electric-500"
                        style={{ width: `${agent.score}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 text-[10px] text-rose-400 font-semibold uppercase flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                    Agent data pipeline failed/offline
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. POSITIVES & RISKS COMPONENT */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* TOP 3 POSITIVES */}
        <div className="glass-card p-6 border-emerald-500/10 bg-emerald-500/[0.005]">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <svg className="h-3 w-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            Top Supporting Strengths (Mitras)
          </h4>
          <ul className="space-y-3.5">
            {report.top_positives.map((pos, idx) => (
              <li key={idx} className="flex gap-2.5 items-start text-xs text-gray-300 leading-relaxed font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-2 shrink-0 animate-pulse" />
                {pos}
              </li>
            ))}
          </ul>
        </div>

        {/* TOP 3 RISKS */}
        <div className="glass-card p-6 border-rose-500/10 bg-rose-500/[0.005]">
          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <div className="h-5 w-5 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
              <svg className="h-3.5 w-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            Top Cautionary Risks (Khatras)
          </h4>
          <ul className="space-y-3.5">
            {report.top_risks.map((risk, idx) => (
              <li key={idx} className="flex gap-2.5 items-start text-xs text-gray-300 leading-relaxed font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-2 shrink-0 animate-pulse" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 4. SIGNAL SENSITIZERS: Upgrade / Downgrade Triggers */}
      <div className="glass-card p-6 space-y-4">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
            <svg className="h-4 w-4 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Signal Sensitizers & Monitoring Triggers
          </h4>
          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
            Key triggers that would dynamically upgrade or downgrade the current consensus signal. Set alerts for these thresholds.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {report.sensitizers.map((sens, idx) => {
            const isUpgrade = sens.direction.toLowerCase() === "upgrade";
            const isHigh = sens.impact.toLowerCase() === "high";
            return (
              <div key={idx} className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.006] p-4 flex items-start gap-3">
                <div className={`mt-0.5 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase shrink-0 font-mono tracking-widest ${isUpgrade ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                  {sens.direction}
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-gray-300 font-medium leading-relaxed">{sens.trigger}</p>
                  <div className="flex items-center gap-1.5 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                    <span>Impact Severity:</span>
                    <span className={isHigh ? "text-rose-400" : "text-amber-400"}>{sens.impact}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. CONFIDENCE DISCLOSURE SECTION */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              AI Consensus Confidence Disclosure
            </h4>
            <p className="text-[11px] text-gray-500 leading-relaxed max-w-xl">
              Calculated by combining raw analyst confidences. Reduced completeness penalizes confidence shares automatically.
            </p>
          </div>

          <div className="flex items-baseline gap-2 shrink-0">
            <span className="text-2xl font-bold font-mono text-white">{report.overall_confidence}%</span>
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-500">Confidence Factor</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-2 w-full rounded bg-white/5 overflow-hidden border border-white/[0.02]">
            <div
              className="h-full rounded bg-gradient-to-r from-purple-600 to-indigo-400 transition-all duration-1000"
              style={{ width: `${report.overall_confidence}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed text-justify font-medium" dangerouslySetInnerHTML={{ __html: parseMarkdown(report.confidence_note) }} />
        </div>
      </div>

      {/* 6. METHODOLOGY QUICK LINK & LEGAL DISCLAIMER */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.005] gap-4">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center sm:text-left">
          Consensus Model v2.4 • SEBI registered Intermediary PR-2026-X
        </span>
        <Link
          href="/dashboard/methodology"
          className="rounded-lg bg-electric-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-electric-400 border border-electric-500/20 hover:bg-electric-500 hover:text-white transition duration-300"
        >
          View Scoring Methodology Guide
        </Link>
      </div>

      <SEBIDisclaimer />

    </div>
  );
}
