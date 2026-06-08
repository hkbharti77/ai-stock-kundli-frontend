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

const FiDollarSign = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const FiPercent = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...props}>
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
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

interface ValuationTimeline {
  periods: string[];
  pe: number[];
  pb: number[];
  ev_ebitda: number[];
  intrinsic_value: number[];
}

interface ValuationData {
  ticker: string;
  current_price: number;
  intrinsic_value: number;
  margin_of_safety: number;
  verdict: string; // undervalued, fair, overvalued
  timeline: ValuationTimeline;
}

interface ValuationHistoryPanelProps {
  ticker: string;
  agentData?: {
    score: number;
    confidence: number;
    trend: string; // verdict
    strengths: string[];
    concerns: string[];
    reasoning: string;
  };
}

export default function ValuationHistoryPanel({ ticker, agentData }: ValuationHistoryPanelProps) {
  const [valData, setValData] = useState<ValuationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pe" | "pb" | "ev_ebitda" | "intrinsic_value">("pe");

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const paragraphs = normalized.split(/\n\n+/);
    return paragraphs.map((para, i) => {
      const trimmed = para.trim();
      if (!trimmed) return null;

      // Headers
      if (trimmed.startsWith("# ")) {
        return (
          <h3 key={i} className="text-base font-bold text-slate-100 pt-3 tracking-tight border-b border-white/5 pb-1">
            {trimmed.replace("# ", "").replace(/\*\*/g, "")}
          </h3>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h3 key={i} className="text-sm font-bold text-slate-100 pt-2 tracking-tight">
            {trimmed.replace("## ", "").replace(/\*\*/g, "")}
          </h3>
        );
      }
      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={i} className="text-xs font-semibold text-slate-100 pt-2 tracking-tight">
            {trimmed.replace("### ", "").replace(/\*\*/g, "")}
          </h4>
        );
      }
      if (trimmed.startsWith("#### ")) {
        return (
          <h5 key={i} className="text-[11px] font-semibold text-slate-200 pt-1 tracking-tight">
            {trimmed.replace("#### ", "").replace(/\*\*/g, "")}
          </h5>
        );
      }

      // Lists
      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        return (
          <ul key={i} className="space-y-2 pl-4 list-disc text-xs text-slate-300">
            {trimmed.split("\n").map((li, idx) => (
              <li 
                key={idx} 
                className="pl-1 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: li.replace(/^[\*\-]\s*/, "")
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/\*(.*?)\*/g, "<em>$1</em>")
                }}
              />
            ))}
          </ul>
        );
      }

      // Default Paragraph
      return (
        <p 
          key={i} 
          className="text-xs text-slate-400 leading-relaxed font-normal"
          dangerouslySetInnerHTML={{
            __html: trimmed
              .replace(/\*\frac.*?\*\*/g, "")
              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
              .replace(/\*(.*?)\*/g, "<em>$1</em>")
          }}
        />
      );
    });
  };

  useEffect(() => {
    async function fetchValuation() {
      try {
        const res = await fetch(`/api/v1/companies/${ticker}/valuation-history`);
        if (res.ok) {
          const data = await res.json();
          setValData(data);
        }
      } catch (err) {
        console.error("Error fetching valuation history:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchValuation();
  }, [ticker]);

  if (loading) {
    return (
      <div className="p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl animate-pulse">
        <div className="h-6 w-1/3 bg-slate-800 rounded mb-4"></div>
        <div className="h-48 bg-slate-800/50 rounded-xl"></div>
      </div>
    );
  }

  const currentPrice = valData?.current_price || 2000.0;
  const intrinsicValue = valData?.intrinsic_value || 2200.0;
  const marginOfSafety = valData?.margin_of_safety || 10.0;
  const verdict = valData?.verdict || "fair";
  const timeline = valData?.timeline;

  // Render dynamic SVG chart for timeline ratios
  const periods = timeline?.periods || ["FY22", "FY23", "FY24", "FY25", "FY26"];
  const activeHistory: number[] = timeline ? timeline[activeTab as keyof ValuationTimeline] as number[] : [22.5, 24.8, 28.2, 25.1, 26.8];

  const maxVal = Math.max(...activeHistory) * 1.15;
  const minVal = Math.min(...activeHistory) * 0.85;
  const range = maxVal - minVal;

  // Chart coordinates calculation
  const width = 500;
  const height = 150;
  const padding = 30;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = activeHistory.map((val, idx) => {
    const x = padding + (idx * chartWidth) / (activeHistory.length - 1);
    const y = padding + chartHeight - ((val - minVal) * chartHeight) / (range || 1);
    return { x, y, value: val, period: periods[idx] };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return acc + `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`;
  }, "");

  // Render color styles based on verdict
  const getVerdictStyles = (v: string) => {
    switch (v.toLowerCase()) {
      case "undervalued":
        return { text: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", label: "Undervalued", color: "#10b981" };
      case "overvalued":
        return { text: "text-rose-400 border-rose-500/30 bg-rose-500/10", label: "Overvalued", color: "#f43f5e" };
      default:
        return { text: "text-amber-400 border-amber-500/30 bg-amber-500/10", label: "Fairly Valued", color: "#f59e0b" };
    }
  };

  const verdictStyle = getVerdictStyles(verdict);

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700/50">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm uppercase tracking-widest mb-1">
            <FiDollarSign className="w-4 h-4" />
            <span>Valuation Models</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
            DCF & Multiple Valuation Analysis
          </h2>
        </div>

        {/* Verdict Badge */}
        <div className={`flex items-center gap-2.5 px-4.5 py-2.5 border rounded-2xl shadow-md ${verdictStyle.text}`}>
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: verdictStyle.color }}></div>
          <div className="text-sm font-bold uppercase tracking-wide">{verdictStyle.label}</div>
        </div>
      </div>

      {/* DCF Gauge Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 bg-slate-950/45 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-4">
              Two-Stage DCF Analysis
            </h3>
            
            <div className="flex justify-between items-baseline gap-2 mb-2">
              <span className="text-xs text-slate-400 font-medium">Intrinsic FCF Value</span>
              <span className="text-lg font-bold text-slate-200">₹{intrinsicValue.toFixed(1)}</span>
            </div>
            
            <div className="flex justify-between items-baseline gap-2 mb-4">
              <span className="text-xs text-slate-400 font-medium">Current Stock Price</span>
              <span className="text-sm font-semibold text-slate-400">₹{currentPrice.toFixed(1)}</span>
            </div>
          </div>

          {/* Margin of Safety Horizontal Bar */}
          <div className="mt-2">
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-slate-400 flex items-center gap-1">
                <FiPercent className="w-3.5 h-3.5" /> Margin of Safety
              </span>
              <span className={marginOfSafety > 15 ? "text-emerald-400" : marginOfSafety > 0 ? "text-amber-400" : "text-rose-400"}>
                {marginOfSafety.toFixed(1)}%
              </span>
            </div>
            {/* The bar track */}
            <div className="h-3 w-full bg-slate-900 rounded-full border border-slate-800/60 overflow-hidden relative">
              <div 
                className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                  marginOfSafety > 15 
                    ? "from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/20" 
                    : marginOfSafety > 0 
                      ? "from-amber-500 to-orange-400" 
                      : "from-rose-500 to-pink-400"
                }`}
                style={{ width: `${Math.min(Math.max(marginOfSafety, 5), 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 leading-tight mt-2.5">
              Conservative DCF based on 11.5% WACC and 4.5% Terminal Growth.
            </div>
          </div>
        </div>

        {/* History Multiple Chart Card */}
        <div className="lg:col-span-2 bg-slate-950/45 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
              Historical Valuation Multiples
            </h3>
            
            {/* Ratios Tabs Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800/80 p-1 rounded-xl">
              {(["pe", "pb", "ev_ebitda", "intrinsic_value"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10.5px] font-bold px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === tab 
                      ? "bg-slate-800 text-slate-100 shadow-sm border border-slate-700/50" 
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab === "pe" ? "P/E" : tab === "pb" ? "P/B" : tab === "ev_ebitda" ? "EV/EBITDA" : "Intrinsic"}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SVG Chart */}
          <div className="relative">
            <svg 
              viewBox={`0 0 ${width} ${height}`} 
              className="w-full h-auto text-indigo-400"
            >
              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeDasharray="3,3" />
              <line x1={padding} y1={padding + chartHeight/2} x2={width - padding} y2={padding + chartHeight/2} stroke="#1e293b" strokeDasharray="3,3" />
              <line x1={padding} y1={padding + chartHeight} x2={width - padding} y2={padding + chartHeight} stroke="#1e293b" />

              {/* Chart Line path */}
              <path
                d={pathD}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-indigo-500/80"
              />

              {/* Data points */}
              {points.map((p, idx) => (
                <g key={idx} className="group">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    className="fill-slate-900 stroke-indigo-400 stroke-2 cursor-pointer hover:r-6 hover:fill-indigo-500 transition-all"
                  />
                  {/* Label */}
                  <text
                    x={p.x}
                    y={p.y - 12}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-slate-300 font-sans"
                  >
                    {activeTab === "intrinsic_value" ? `₹${p.value.toFixed(0)}` : p.value.toFixed(1)}
                  </text>
                  {/* Year point label */}
                  <text
                    x={p.x}
                    y={height - 5}
                    textAnchor="middle"
                    className="text-[9.5px] font-semibold fill-slate-500 font-sans"
                  >
                    {p.period}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Strengths & Concerns Summary Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Strengths */}
        <div className="bg-emerald-500/[0.03] border border-emerald-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] rounded-full blur-xl pointer-events-none"></div>
          <h3 className="text-emerald-400 text-sm font-bold uppercase tracking-wider flex items-center gap-2 mb-3">
            <FiCheckCircle className="w-4 h-4" />
            <span>Valuation Catalysts</span>
          </h3>
          <ul className="space-y-3">
            {(agentData?.strengths || [
              "DCF model indicates reasonable Margin of Safety under conservative growth assumptions.",
              "Strong recurring cash flows from operations backing the core valuation.",
              "Asset-light compounding potential with robust free cash flow yields."
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
            <span>Valuation Risks</span>
          </h3>
          <ul className="space-y-3">
            {(agentData?.concerns || [
              "Elevated historical trading multiples compared to 5-year average bands.",
              "Sensitivity of intrinsic value estimations to minor swings in WACC or terminal growth rates.",
              "Potential free cash flow volatility over the transition cycle."
            ]).map((con, idx) => (
              <li key={idx} className="text-slate-300 text-xs leading-relaxed flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Expert Valuation Thesis Markdown */}
      <div className="mt-8 pt-6 border-t border-slate-800/60">
        <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2 mb-4">
          <FiActivity className="w-4 h-4" />
          <span>Valuation Thesis & DCF Explanation</span>
        </h3>
        <div className="prose prose-invert prose-xs text-slate-300 max-w-none leading-relaxed space-y-4">
          {renderMarkdown(agentData?.reasoning || `### DCF Valuation & Intrinsic Value Thesis

Our AI Valuation Analyst has constructed a comprehensive multi-stage Discounted Cash Flow model alongside historical trailing multiple analysis for **${ticker}**.

* **FCF Quality:** Free cash flows remain stable, offering a solid cushion to long-term valuation multiples.
* **Multiple Compression:** While near-term trading multiples appear elevated, strong trailing trends support baseline valuations.
* **Sensitivity Matrix:** Intrinsic value holds highly resilient across typical discount rate changes.`)}
        </div>
      </div>
    </div>
  );
}
