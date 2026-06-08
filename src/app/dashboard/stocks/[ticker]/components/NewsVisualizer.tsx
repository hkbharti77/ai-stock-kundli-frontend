"use client";

import React, { useMemo } from "react";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────

interface NewsArticle {
  id: number;
  title: string;
  source: string;
  url?: string;
  published_at: string;
  classification: string;
  impact_score: number;
  sentiment: "positive" | "negative" | "neutral";
  risk_flags?: string[];
}

interface SentimentTrendPoint {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  net_sentiment: number;
}

interface MaterialEvent {
  headline: string;
  classification: string;
  impact_score: number;
  date: string;
  source: string;
}

interface NewsVisualizerProps {
  ticker: string;
  articles: NewsArticle[];
  sentimentBreakdown: { positive: number; negative: number; neutral: number };
  sentimentTrend: SentimentTrendPoint[];
  newsAnalysis?: {
    score: number;
    confidence: number;
    trend: string;
    news_sentiment: string;
    reasoning: string;
    top_material_events: MaterialEvent[];
    risk_flags: string[];
    sentiment_trend_30d: string;
    article_count_analyzed: number;
  } | null;
}

// ─────────────────────────────────────────────────────
// Classification config
// ─────────────────────────────────────────────────────
const CLASSIFICATION_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; dot: string }
> = {
  "Positive — Fundamental":  { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "bg-emerald-400" },
  "Positive — Sentiment":    { color: "text-teal-400",    bg: "bg-teal-500/10",    border: "border-teal-500/20",    dot: "bg-teal-400"    },
  "Negative — Fundamental":  { color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  dot: "bg-orange-400"  },
  "Negative — Regulatory":   { color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20",    dot: "bg-rose-400"    },
  "Negative — Governance":   { color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     dot: "bg-red-500"     },
  "Neutral — Informational": { color: "text-gray-400",    bg: "bg-gray-500/10",    border: "border-gray-500/20",    dot: "bg-gray-500"    },
  "Risk Flag — Fraud Signal":{ color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20", dot: "bg-fuchsia-500"  },
};

const getClassConfig = (classification: string) =>
  CLASSIFICATION_CONFIG[classification] ?? CLASSIFICATION_CONFIG["Neutral — Informational"];

const impactColor = (score: number) => {
  if (score >= 9) return "text-red-400 bg-red-500/20 border-red-500/30";
  if (score >= 7) return "text-orange-400 bg-orange-500/20 border-orange-500/30";
  if (score >= 5) return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
  if (score >= 3) return "text-teal-400 bg-teal-500/20 border-teal-500/30";
  return "text-gray-400 bg-gray-500/20 border-gray-500/20";
};

const sentimentGradient = (sentiment: string) => {
  if (sentiment === "positive") return "from-emerald-500 to-teal-500";
  if (sentiment === "negative") return "from-rose-500 to-red-500";
  return "from-gray-500 to-slate-500";
};

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

// ─────────────────────────────────────────────────────
// Sentiment Trend Chart (SVG-based, neon styling)
// ─────────────────────────────────────────────────────
function SentimentTrendChart({ trend }: { trend: SentimentTrendPoint[] }) {
  const W = 700;
  const H = 120;
  const PAD = { top: 16, right: 16, bottom: 32, left: 40 };

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const values = trend.map((p) => p.net_sentiment);
  const minVal = Math.min(...values, -10);
  const maxVal = Math.max(...values, 10);
  const range = maxVal - minVal || 1;

  const toX = (i: number) => PAD.left + (i / Math.max(trend.length - 1, 1)) * chartW;
  const toY = (v: number) => PAD.top + chartH - ((v - minVal) / range) * chartH;

  const linePath = trend
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)},${toY(p.net_sentiment).toFixed(1)}`)
    .join(" ");

  const zeroY = toY(0);

  // Area fill for positive zone
  const areaPos = trend.length > 1
    ? `M ${toX(0).toFixed(1)},${zeroY.toFixed(1)} ` +
      trend.map((p, i) => `L ${toX(i).toFixed(1)},${Math.min(toY(p.net_sentiment), zeroY).toFixed(1)}`).join(" ") +
      ` L ${toX(trend.length - 1).toFixed(1)},${zeroY.toFixed(1)} Z`
    : "";

  const areaNeg = trend.length > 1
    ? `M ${toX(0).toFixed(1)},${zeroY.toFixed(1)} ` +
      trend.map((p, i) => `L ${toX(i).toFixed(1)},${Math.max(toY(p.net_sentiment), zeroY).toFixed(1)}`).join(" ") +
      ` L ${toX(trend.length - 1).toFixed(1)},${zeroY.toFixed(1)} Z`
    : "";

  if (trend.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500 text-xs">
        Insufficient data for trend chart (need 2+ data points)
      </div>
    );
  }

  // Axis labels
  const labels = trend
    .filter((_, i) => i % Math.max(Math.floor(trend.length / 6), 1) === 0)
    .map((p, _i, arr) => {
      const origIdx = trend.findIndex((t) => t.date === p.date);
      return { x: toX(origIdx), label: p.date.slice(5) }; // "MM-DD"
    });

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minHeight: 100 }}>
        <defs>
          <linearGradient id="pos-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="neg-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Zero baseline */}
        <line
          x1={PAD.left} y1={zeroY} x2={PAD.left + chartW} y2={zeroY}
          stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4"
        />
        {/* Grid */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD.left} y1={PAD.top + chartH * f}
            x2={PAD.left + chartW} y2={PAD.top + chartH * f}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1"
          />
        ))}

        {/* Positive fill */}
        <path d={areaPos} fill="url(#pos-grad)" />
        {/* Negative fill */}
        <path d={areaNeg} fill="url(#neg-grad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {trend.map((p, i) => (
          <circle
            key={i}
            cx={toX(i)} cy={toY(p.net_sentiment)} r="2.5"
            fill={p.net_sentiment >= 0 ? "#10b981" : "#f43f5e"}
            stroke="rgba(255,255,255,0.15)" strokeWidth="1"
          />
        ))}

        {/* X-axis labels */}
        {labels.map((l, i) => (
          <text
            key={i} x={l.x} y={H - 4}
            fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="middle"
          >
            {l.label}
          </text>
        ))}

        {/* Y-axis label */}
        <text x={PAD.left - 6} y={PAD.top + chartH / 2} fill="rgba(255,255,255,0.2)"
          fontSize="8" textAnchor="middle" transform={`rotate(-90, ${PAD.left - 6}, ${PAD.top + chartH / 2})`}>
          Sentiment
        </text>
      </svg>
      <div className="absolute top-1 right-2 flex items-center gap-3">
        <span className="flex items-center gap-1 text-[9px] text-emerald-400">
          <span className="h-1.5 w-3 rounded-full bg-emerald-400 inline-block" /> Positive
        </span>
        <span className="flex items-center gap-1 text-[9px] text-rose-400">
          <span className="h-1.5 w-3 rounded-full bg-rose-400 inline-block" /> Negative
        </span>
        <span className="flex items-center gap-1 text-[9px] text-indigo-400">
          <span className="h-1.5 w-3 rounded-full bg-indigo-400 inline-block" /> Net Trend
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────
export default function NewsVisualizer({
  ticker,
  articles,
  sentimentBreakdown,
  sentimentTrend,
  newsAnalysis,
}: NewsVisualizerProps) {
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

  const totalArticles = articles.length;
  const { positive = 0, negative = 0, neutral = 0 } = sentimentBreakdown;
  const total = Math.max(positive + negative + neutral, 1);

  const score = newsAnalysis?.score ?? Math.round(50 + ((positive - negative) / total) * 50);
  const scoreColor = score >= 70 ? "text-emerald-400" : score >= 45 ? "text-yellow-400" : "text-rose-400";
  const scoreLabel = score >= 70 ? "POSITIVE" : score >= 45 ? "NEUTRAL" : "NEGATIVE";

  const riskFlags = newsAnalysis?.risk_flags ?? [];
  const hasCritical = riskFlags.length > 0;

  // Sort articles: highest impact first
  const sortedArticles = useMemo(
    () => [...articles].sort((a, b) => b.impact_score - a.impact_score),
    [articles]
  );

  return (
    <div className="space-y-6">
      {/* ── Critical Risk Alert ─────────────────────────────────── */}
      {hasCritical && (
        <div className="relative overflow-hidden rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-4">
          <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 to-red-500/5 pointer-events-none" />
          <div className="relative z-10 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/20">
              <svg className="h-4 w-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider mb-1">
                ⚠ Risk Flags Detected
              </h4>
              <ul className="space-y-0.5">
                {riskFlags.map((flag, i) => (
                  <li key={i} className="text-xs text-fuchsia-200/80 flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-fuchsia-400 shrink-0" />
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Sentiment Score Overview ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Score card */}
        <div className="glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative h-24 w-24 mb-3">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#f43f5e"}
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - score / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-extrabold font-mono ${scoreColor}`}>{score}</span>
                <span className="text-[8px] text-gray-500 uppercase tracking-wider">Score</span>
              </div>
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
              score >= 70 ? "bg-emerald-500/10 text-emerald-400" :
              score >= 45 ? "bg-yellow-500/10 text-yellow-400" : "bg-rose-500/10 text-rose-400"
            }`}>
              {scoreLabel}
            </span>
            <span className="text-[10px] text-gray-500 mt-1">
              {newsAnalysis?.article_count_analyzed ?? totalArticles} articles analyzed
            </span>
          </div>
        </div>

        {/* Sentiment Breakdown bars */}
        <div className="glass-card p-5 flex flex-col justify-center gap-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">30-Day Breakdown</h4>
          {[
            { label: "Positive", count: positive, color: "bg-emerald-500" },
            { label: "Negative", count: negative, color: "bg-rose-500" },
            { label: "Neutral",  count: neutral,  color: "bg-gray-500"  },
          ].map(({ label, count, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-gray-400">{label}</span>
                <span className="text-[10px] font-mono text-white">{count}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${color} transition-all duration-700`}
                  style={{ width: `${Math.round((count / total) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Trend stats */}
        <div className="glass-card p-5 flex flex-col gap-3 justify-center">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">News Intelligence</h4>
          <div>
            <span className="text-[10px] text-gray-500 block">Sentiment Trend</span>
            <span className={`text-sm font-bold uppercase tracking-wide ${
              newsAnalysis?.sentiment_trend_30d === "improving" ? "text-emerald-400" :
              newsAnalysis?.sentiment_trend_30d === "deteriorating" ? "text-rose-400" : "text-yellow-400"
            }`}>
              {newsAnalysis?.sentiment_trend_30d ?? "Stable"}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 block">Confidence</span>
            <span className="text-sm font-bold font-mono text-white">{newsAnalysis?.confidence ?? 70}%</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 block">Overall Sentiment</span>
            <span className={`text-sm font-bold uppercase ${
              newsAnalysis?.news_sentiment === "positive" ? "text-emerald-400" :
              newsAnalysis?.news_sentiment === "negative" ? "text-rose-400" : "text-gray-400"
            }`}>
              {newsAnalysis?.news_sentiment ?? "Neutral"}
            </span>
          </div>
        </div>
      </div>

      {/* ── 30-Day Sentiment Trend Chart ──────────────────────────── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">30-Day Sentiment Trend</h3>
            <p className="text-[10px] text-gray-500">Net sentiment score (positive − negative) per day</p>
          </div>
          <span className="badge-blue text-[10px]">30 DAYS</span>
        </div>
        <SentimentTrendChart trend={sentimentTrend} />
      </div>

      {/* ── Top Material Events ───────────────────────────────────── */}
      {newsAnalysis?.top_material_events && newsAnalysis.top_material_events.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="h-4 w-4 text-electric-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Top Material Events
          </h3>
          <div className="space-y-3">
            {newsAnalysis.top_material_events.map((event, i) => {
              const cfg = getClassConfig(event.classification);
              return (
                <div key={i} className={`flex items-start gap-3 rounded-lg border ${cfg.border} ${cfg.bg} p-3`}>
                  <span className={`mt-1 text-lg font-extrabold font-mono ${cfg.color}`}>{event.impact_score}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white leading-snug truncate">{event.headline}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-bold uppercase ${cfg.color}`}>{event.classification}</span>
                      <span className="text-[9px] text-gray-500">{event.source} · {event.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── News Feed ─────────────────────────────────────────────── */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">News Feed</h3>
          <span className="text-[10px] text-gray-500">{totalArticles} articles · sorted by impact</span>
        </div>

        {sortedArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <svg className="h-10 w-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-sm text-gray-500">No news articles found. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedArticles.map((article) => {
              const cfg = getClassConfig(article.classification);
              const impCls = impactColor(article.impact_score);
              return (
                <div
                  key={article.id}
                  className="group flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3.5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200"
                >
                  {/* Impact badge */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-extrabold font-mono text-xs ${impCls}`}>
                    {article.impact_score}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    {article.url ? (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-white leading-snug hover:text-electric-400 transition-colors line-clamp-2"
                      >
                        {article.title}
                      </a>
                    ) : (
                      <p className="text-xs font-medium text-white leading-snug line-clamp-2">{article.title}</p>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {/* Classification badge */}
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                        <span className={`h-1 w-1 rounded-full ${cfg.dot}`} />
                        {article.classification}
                      </span>
                      {/* Source & date */}
                      <span className="text-[9px] text-gray-500">
                        {article.source} · {formatDate(article.published_at)}
                      </span>
                      {/* Risk flags */}
                      {article.risk_flags && article.risk_flags.length > 0 && (
                        <span className="text-[9px] text-fuchsia-400 font-semibold">⚠ Risk</span>
                      )}
                    </div>
                  </div>

                  {/* Sentiment dot */}
                  <div className="shrink-0 mt-1">
                    <div className={`h-2 w-2 rounded-full bg-gradient-to-br ${sentimentGradient(article.sentiment)}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── AI Analysis Thesis ────────────────────────────────────── */}
      {newsAnalysis?.reasoning && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            AI News Analyst Thesis
          </h3>
          <div className="prose prose-invert prose-sm max-w-none text-xs text-gray-300 leading-relaxed space-y-4">
            {renderMarkdown(newsAnalysis.reasoning)}
          </div>
        </div>
      )}
    </div>
  );
}
