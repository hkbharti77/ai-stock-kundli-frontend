"use client";

import { useEffect, useState } from "react";
import Spinner from "../../../../../components/common/Spinner";

interface SentimentScore {
  date: string;
  score: number;
  management_score: number;
  news_score: number;
  market_score: number;
  confidence: number;
}

interface SentimentData {
  ticker: string;
  score: number;
  confidence: number;
  confidence_low: number;
  confidence_high: number;
  trend: string;
  breakdown: {
    management: number;
    news: number;
    market: number;
  };
  strengths: string[];
  concerns: string[];
  reasoning: string;
  timeline: SentimentScore[];
}

interface SentimentEnginePanelProps {
  ticker: string;
}

export default function SentimentEnginePanel({ ticker }: SentimentEnginePanelProps) {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSentiment() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8000/api/v1/companies/${ticker}/sentiment-analysis`);
        if (!res.ok) {
          throw new Error("Failed to load sentiment analysis from backend server");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchSentiment();
  }, [ticker]);

  if (loading) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
        <Spinner size="w-10 h-10" color="text-indigo-400" label="Running FinBERT Sentiment Model..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-card p-12 flex flex-col items-center justify-center space-y-4 min-h-[400px] text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400 font-bold text-lg">!</div>
        <p className="text-slate-300 text-sm font-semibold">Error Loading Sentiment Engine</p>
        <p className="text-slate-500 text-xs max-w-md">{error || "No data was returned."}</p>
      </div>
    );
  }

  const { score, confidence, confidence_low, confidence_high, trend, breakdown, strengths, concerns, reasoning, timeline } = data;

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
              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
              .replace(/\*(.*?)\*/g, "<em>$1</em>")
          }}
        />
      );
    });
  };

  // Gauge calculations
  // Map -100 to +100 range onto 0 to 180 degrees
  const angle = ((score + 100) / 200) * 180;
  
  // Hinglish label
  let sentimentLabel = "Neutral Tone (Samaanya)";
  let sentimentColor = "text-slate-400";
  let gaugeGradient = "from-slate-400 to-indigo-500";
  if (score > 35.0) {
    sentimentLabel = "Very Optimistic (Ashaavadi)";
    sentimentColor = "text-emerald-400";
    gaugeGradient = "from-emerald-500 to-teal-400";
  } else if (score > 10.0) {
    sentimentLabel = "Slightly Optimistic (Pragati-Sheel)";
    sentimentColor = "text-blue-400";
    gaugeGradient = "from-blue-500 to-indigo-400";
  } else if (score < -35.0) {
    sentimentLabel = "Highly Pessimistic (Niraash)";
    sentimentColor = "text-rose-400";
    gaugeGradient = "from-rose-500 to-pink-500";
  } else if (score < -10.0) {
    sentimentLabel = "Slightly Cautious (Satark)";
    sentimentColor = "text-amber-400";
    gaugeGradient = "from-amber-500 to-orange-400";
  }

  // SVG Chart points calculation
  const chartWidth = 600;
  const chartHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const pointsCount = timeline.length;
  const effectiveWidth = chartWidth - paddingLeft - paddingRight;
  const effectiveHeight = chartHeight - paddingTop - paddingBottom;

  // Determine min/max values
  const allScores = timeline.map(t => t.score);
  const minVal = Math.min(...allScores, -50.0);
  const maxVal = Math.max(...allScores, 50.0);
  const valRange = maxVal - minVal || 1;

  // Compute point coordinates
  const coords = timeline.map((t, idx) => {
    const x = paddingLeft + (idx / (pointsCount - 1 || 1)) * effectiveWidth;
    const y = paddingTop + effectiveHeight - ((t.score - minVal) / valRange) * effectiveHeight;
    // Bounds overlay coords
    const yLow = paddingTop + effectiveHeight - (((t.score - 10) - minVal) / valRange) * effectiveHeight;
    const yHigh = paddingTop + effectiveHeight - (((t.score + 10) - minVal) / valRange) * effectiveHeight;
    return { x, y, yLow, yHigh, date: t.date, score: t.score };
  });

  // Construct chart paths
  let linePath = "";
  let bandPath = "";
  if (coords.length > 0) {
    linePath = `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(" ");
    
    // Band overlay path (draws upper bounds going left-to-right, then lower bounds going right-to-left to close polygon)
    const upperPoints = coords.map(c => `${c.x},${Math.max(c.yHigh, paddingTop)}`).join(" ");
    const lowerPoints = [...coords].reverse().map(c => `${c.x},${Math.min(c.yLow, chartHeight - paddingBottom)}`).join(" ");
    bandPath = `M ${upperPoints} L ${lowerPoints} Z`;
  }

  return (
    <div className="space-y-6">
      {/* Top Aggregates Dashboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Radial Sentiment Gauge */}
        <div className="glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.02] rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Overall Sentiment Score</h3>
          
          <div className="relative w-48 h-28 flex items-end justify-center overflow-hidden">
            {/* Background Arch Track */}
            <svg className="absolute w-44 h-44 -bottom-16" viewBox="0 0 100 100">
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="#1e293b"
                strokeWidth="10"
                strokeLinecap="round"
              />
              {/* Colored active score arc */}
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="url(#gauge-glow-gradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="125"
                strokeDashoffset={125 - (125 * angle) / 180}
              />
              <defs>
                <linearGradient id="gauge-glow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center Dial Value */}
            <div className="text-center z-10 -mb-1 select-none">
              <div className="text-3xl font-extrabold text-white tracking-tight">
                {score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">NET SCORE (-100 to +100)</div>
            </div>
          </div>

          <div className="text-center mt-3 z-10">
            <span className={`text-xs font-bold tracking-tight ${sentimentColor}`}>{sentimentLabel}</span>
            <div className="flex items-center gap-1.5 justify-center mt-1.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Confidence:</span>
              <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-400/20">{confidence.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Multi-Dimensional Tone Matrix */}
        <div className="glass-card p-6 flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Multi-Dimensional Tone Matrix</h3>
            
            <div className="space-y-4">
              {/* Management Tone */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Management & Corporate Announcements
                  </span>
                  <span className="text-emerald-400 font-bold">{breakdown.management > 0 ? `+${breakdown.management}` : breakdown.management}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    style={{ width: `${Math.min(Math.max((breakdown.management + 100) / 2, 5), 100)}%` }}
                  />
                </div>
              </div>

              {/* General Media Tone */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    Media Reporting & News Sentiment
                  </span>
                  <span className="text-indigo-400 font-bold">{breakdown.news > 0 ? `+${breakdown.news}` : breakdown.news}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full"
                    style={{ width: `${Math.min(Math.max((breakdown.news + 100) / 2, 5), 100)}%` }}
                  />
                </div>
              </div>

              {/* Technical Market Tone */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    Broker Ratings & Momentum Demand
                  </span>
                  <span className="text-sky-400 font-bold">{breakdown.market > 0 ? `+${breakdown.market}` : breakdown.market}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full"
                    style={{ width: `${Math.min(Math.max((breakdown.market + 100) / 2, 5), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-[10px] text-slate-500 leading-relaxed font-semibold uppercase flex items-center gap-1">
            <span>Aggregated Momentum Trajectory:</span>
            <span className={`font-bold ${trend === "improving" ? "text-emerald-400" : trend === "deteriorating" ? "text-rose-400" : "text-blue-400"}`}>
              {trend.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Confidence Bands & Alert Boundaries */}
        <div className="glass-card p-6 flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Confidence & Uncertainty Bands</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
              Our FinBERT model applies high-performance confidence boundaries mapping standard errors to identify potential sentiment outliers.
            </p>
            
            <div className="space-y-3 bg-slate-900/40 border border-slate-800/40 rounded-xl p-3.5 shadow-inner">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Lower Band Boundary:</span>
                <span className="font-semibold text-rose-400">{confidence_low.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Calculated Median Score:</span>
                <span className="font-bold text-white">{score.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Upper Band Boundary:</span>
                <span className="font-semibold text-emerald-400">{confidence_high.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 text-[10.5px] text-slate-400 leading-relaxed font-normal">
            * Uncertainty range of **{(confidence_high - confidence_low).toFixed(1)}** points indicates standard deviation fluctuations.
          </div>
        </div>

      </div>

      {/* SVG Sentiment Rolling 30-Day Trend Chart */}
      <div className="glass-card p-6">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">30-Day Rolling Net Sentiment Trend</h3>
        
        <div className="w-full overflow-x-auto select-none">
          <div className="min-w-[600px] h-[220px]">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              {/* Shaded Grid lines */}
              <line x1={paddingLeft} y1={paddingTop} x2={chartWidth - paddingRight} y2={paddingTop} stroke="#1e293b" strokeWidth="1" strokeDasharray="3" />
              <line x1={paddingLeft} y1={paddingTop + effectiveHeight / 2} x2={chartWidth - paddingRight} y2={paddingTop + effectiveHeight / 2} stroke="#334155" strokeWidth="1" strokeDasharray="3" />
              <line x1={paddingLeft} y1={chartHeight - paddingBottom} x2={chartWidth - paddingRight} y2={chartHeight - paddingBottom} stroke="#1e293b" strokeWidth="1" strokeDasharray="3" />
              
              {/* Shaded confidence band area */}
              {bandPath && (
                <path
                  d={bandPath}
                  fill="url(#confidence-band-gradient)"
                  className="transition-all duration-300"
                />
              )}

              {/* Center Line for Zero value */}
              <line
                x1={paddingLeft}
                y1={paddingTop + effectiveHeight - ((0.0 - minVal) / valRange) * effectiveHeight}
                x2={chartWidth - paddingRight}
                y2={paddingTop + effectiveHeight - ((0.0 - minVal) / valRange) * effectiveHeight}
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="2"
              />

              {/* Main Sentiment Trend Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="url(#chart-glow-gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />
              )}

              {/* Data points markers */}
              {coords.map((c, i) => (
                <g key={i}>
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r="4"
                    fill="#1e1b4b"
                    stroke={c.score >= 0 ? "#10b981" : "#f43f5e"}
                    strokeWidth="2.5"
                    className="hover:scale-150 transition cursor-pointer"
                  />
                </g>
              ))}

              {/* X axis labels (Dates) */}
              {coords.length > 0 && [0, Math.floor(pointsCount / 2), pointsCount - 1].map(idx => {
                if (idx >= pointsCount) return null;
                const c = coords[idx];
                return (
                  <text
                    key={idx}
                    x={c.x}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    fill="#64748b"
                    className="text-[9.5px] font-bold tracking-tight uppercase"
                  >
                    {new Date(c.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </text>
                );
              })}

              {/* Y axis labels */}
              <text x={paddingLeft - 10} y={paddingTop + 4} textAnchor="end" fill="#64748b" className="text-[9.5px] font-bold">{maxVal.toFixed(0)}</text>
              <text x={paddingLeft - 10} y={paddingTop + effectiveHeight / 2 + 4} textAnchor="end" fill="#64748b" className="text-[9.5px] font-bold">{((maxVal + minVal) / 2).toFixed(0)}</text>
              <text x={paddingLeft - 10} y={chartHeight - paddingBottom + 4} textAnchor="end" fill="#64748b" className="text-[9.5px] font-bold">{minVal.toFixed(0)}</text>

              {/* Chart Gradients */}
              <defs>
                <linearGradient id="chart-glow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="50%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="confidence-band-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Strengths & Concerns summary box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-emerald-500/[0.03] border border-emerald-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] rounded-full blur-xl pointer-events-none" />
          <h3 className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-3">Sentiment Boosters</h3>
          <ul className="space-y-3">
            {strengths.map((str, idx) => (
              <li key={idx} className="text-slate-300 text-xs leading-relaxed flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Concerns */}
        <div className="bg-rose-500/[0.03] border border-rose-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/[0.02] rounded-full blur-xl pointer-events-none" />
          <h3 className="text-rose-400 text-sm font-bold uppercase tracking-wider mb-3">Sentiment Deterrents</h3>
          <ul className="space-y-3">
            {concerns.map((con, idx) => (
              <li key={idx} className="text-slate-300 text-xs leading-relaxed flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Expert Sentiment Analysis Markdown */}
      <div className="mt-8 pt-6 border-t border-slate-800/60">
        <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2 mb-4">
          <span>AI Sentiment Analytical Thesis</span>
        </h3>
        <div className="prose prose-invert prose-xs text-slate-300 max-w-none leading-relaxed space-y-4">
          {renderMarkdown(reasoning)}
        </div>
      </div>

    </div>
  );
}
