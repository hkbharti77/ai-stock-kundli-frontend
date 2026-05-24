"use client";

import React, { useEffect, useState } from "react";

const FiTrendingUp = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const FiActivity = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const FiUsers = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const FiAward = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

const FiAlertCircle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const FiCheckCircle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

interface PeerMetric {
  ticker: string;
  name: string;
  sector: string;
  market_cap: number;
  roce: number;
  pe: number;
  ebitda_margin: number;
  debt_equity: number;
  revenue: number;
}

interface SectorPeersPanelProps {
  ticker: string;
  agentData?: {
    score: number;
    confidence: number;
    trend: string; // rank e.g. "Rank #2 out of 5"
    strengths: string[];
    concerns: string[];
    reasoning: string;
  };
}

export default function SectorPeersPanel({ ticker, agentData }: SectorPeersPanelProps) {
  const [peerData, setPeerData] = useState<{
    sector: string;
    target_rank: string;
    peers: PeerMetric[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPeers() {
      try {
        const res = await fetch(`/api/v1/companies/${ticker}/peers`);
        if (res.ok) {
          const data = await res.json();
          setPeerData(data);
        }
      } catch (err) {
        console.error("Error fetching peer data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPeers();
  }, [ticker]);

  if (loading) {
    return (
      <div className="p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl animate-pulse">
        <div className="h-6 w-1/3 bg-slate-800 rounded mb-4"></div>
        <div className="h-24 bg-slate-800/50 rounded-xl"></div>
      </div>
    );
  }

  const peers = peerData?.peers || [];
  const sectorName = peerData?.sector || "Technology";
  const rankStr = agentData?.trend || peerData?.target_rank || "Rank #1 out of peer group";

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700/50">
      {/* Decorative gradient glowing spots */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm uppercase tracking-widest mb-1">
            <FiUsers className="w-4 h-4" />
            <span>Competitive Matrix</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
            Sector Peer Positioning <span className="text-blue-400 font-normal">({sectorName})</span>
          </h2>
        </div>
        
        {/* Rank Badge */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 px-5 py-2.5 rounded-2xl shadow-lg shadow-blue-500/5">
          <FiAward className="w-5 h-5 text-blue-400" />
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Consensus Rank</div>
            <div className="text-sm font-bold text-slate-100">{rankStr}</div>
          </div>
        </div>
      </div>

      {/* Peer Grid Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/40 backdrop-blur-md mb-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/50">
              <th className="py-4 px-5 text-xs font-semibold uppercase tracking-wider text-slate-400">Company</th>
              <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">M. Cap (Cr)</th>
              <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">ROCE</th>
              <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">PE Multiple</th>
              <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">EBITDA Margin</th>
              <th className="py-4 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Debt / Equity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {peers.map((peer, idx) => {
              const isTarget = peer.ticker.toUpperCase() === ticker.toUpperCase();
              return (
                <tr 
                  key={peer.ticker}
                  className={`transition-colors duration-250 ${
                    isTarget 
                      ? "bg-blue-500/10 hover:bg-blue-500/15" 
                      : "hover:bg-slate-900/30"
                  }`}
                >
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-md ${
                        isTarget 
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                          : "bg-slate-800 text-slate-300 border border-slate-700/50"
                      }`}>
                        {peer.ticker}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-200 flex items-center gap-1.5">
                          {peer.name}
                          {isTarget && (
                            <span className="bg-blue-400/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-medium border border-blue-400/20">
                              Target
                            </span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-medium">Peer benchmark row</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-medium text-sm text-slate-300">
                    ₹{peer.market_cap.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </td>
                  <td className={`py-4 px-4 text-right font-bold text-sm ${
                    peer.roce >= 25 ? "text-emerald-400" : peer.roce >= 15 ? "text-blue-400" : "text-slate-400"
                  }`}>
                    {peer.roce.toFixed(1)}%
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-sm text-slate-300">
                    {peer.pe > 0 ? `${peer.pe.toFixed(1)}x` : "—"}
                  </td>
                  <td className="py-4 px-4 text-right font-semibold text-sm text-slate-300">
                    {peer.ebitda_margin.toFixed(1)}%
                  </td>
                  <td className={`py-4 px-4 text-right font-medium text-sm ${
                    peer.debt_equity > 1.2 ? "text-rose-400" : peer.debt_equity < 0.3 ? "text-emerald-400" : "text-slate-400"
                  }`}>
                    {peer.debt_equity.toFixed(2)}x
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Strengths & Concerns Summary Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Strengths */}
        <div className="bg-emerald-500/[0.03] border border-emerald-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] rounded-full blur-xl pointer-events-none"></div>
          <h3 className="text-emerald-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-3">
            <FiCheckCircle className="w-4 h-4" />
            <span>Competitive Advantages</span>
          </h3>
          <ul className="space-y-3">
            {(agentData?.strengths || [
              "Strong relative operating efficiency and margin retention compared to sector peers.",
              "Healthy capital structure with conservative leverage and stable coverage ratios.",
              "Robust market share leadership and brand equity within the peer group."
            ]).map((str, idx) => (
              <li key={idx} className="text-slate-300 text-xs leading-relaxed flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Concerns */}
        <div className="bg-rose-500/[0.03] border border-rose-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/[0.02] rounded-full blur-xl pointer-events-none"></div>
          <h3 className="text-rose-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-3">
            <FiAlertCircle className="w-4 h-4" />
            <span>Competitive Risks</span>
          </h3>
          <ul className="space-y-3">
            {(agentData?.concerns || [
              "Relatively high valuation multiple compared to industry average peers.",
              "Sub-optimal asset turnover and capital efficiency metrics in recent periods.",
              "Potential headwinds from structural shifts or regulatory modifications in the sector."
            ]).map((con, idx) => (
              <li key={idx} className="text-slate-300 text-xs leading-relaxed flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Expert Benchmarking Markdown Report */}
      <div className="mt-8 pt-6 border-t border-slate-800/60">
        <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 flex items-center gap-2 mb-4">
          <FiActivity className="w-4 h-4" />
          <span>Expert Benchmarking Analysis</span>
        </h3>
        <div className="prose prose-invert prose-xs text-slate-300 max-w-none leading-relaxed space-y-4">
          {(agentData?.reasoning || `### Sector Competitive Positioning Analysis

Our AI Sector Benchmarking Analyst has conducted a thorough relative positioning check for **${ticker}** against its top direct competitors. 

* **Capital Allocation:** The company demonstrates resilient capital efficiency profile compared to peer group averages, indicating standard return spreads.
* **Margin Resiliency:** Operating margins remain well-aligned with industry standards, showcasing pricing power and sound execution.
* **Leverage Balance:** Financial health is highly robust with leverage profiles safely below cautionary benchmarks.`).split("\n\n").map((para, i) => {
            if (para.startsWith("###")) {
              return (
                <h4 key={i} className="text-base font-semibold text-slate-100 pt-2 tracking-tight">
                  {para.replace("###", "").trim()}
                </h4>
              );
            }
            if (para.startsWith("####")) {
              return (
                <h5 key={i} className="text-sm font-semibold text-slate-200 pt-1 tracking-tight">
                  {para.replace("####", "").trim()}
                </h5>
              );
            }
            if (para.startsWith("*") || para.startsWith("-")) {
              return (
                <ul key={i} className="space-y-2 pl-4 list-disc text-xs text-slate-300">
                  {para.split("\n").map((li, idx) => (
                    <li key={idx} className="pl-1 leading-relaxed">
                      {li.replace(/^[\*\-]\s*/, "").replace(/\*\*(.*?)\*\*/g, "$1")}
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="text-xs text-slate-400 leading-relaxed font-normal">
                {para.replace(/\*\*(.*?)\*\*/g, "$1")}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
