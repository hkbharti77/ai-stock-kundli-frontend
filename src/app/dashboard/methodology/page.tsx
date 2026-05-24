"use client";

import Link from "next/link";
import { useTranslation } from "../../../context/LanguageContext";
import LanguageSelector from "../../../components/LanguageSelector";

export default function MethodologyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-navy-950 text-white relative">
      {/* Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 left-20 h-[450px] w-[450px] rounded-full bg-electric-500/[0.04] blur-[130px]" />
        <div className="absolute bottom-10 right-10 h-[350px] w-[350px] rounded-full bg-gold-500/[0.03] blur-[110px]" />
      </div>

      {/* Top Nav */}
      <nav className="relative z-20 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-electric-500 to-electric-600">
                <span className="text-sm font-bold text-white">K</span>
              </div>
              <span className="text-base font-bold text-white">{t("dashboard.title") || "AI Stock Kundli"}</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Link href="/dashboard" className="nav-link text-xs">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-12 space-y-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-electric-400">
            <span>Platform Documentation</span>
            <span>•</span>
            <span>Consensus Engine</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-100 to-electric-300 bg-clip-text text-transparent">
            AI Stock Kundli Scoring Methodology
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
            The AI Stock Kundli processes trillions of datapoints across fundamental health, technical momentum, and live news sentiment, 
            combining them through a mathematical consensus framework to produce a single, actionable rating score.
          </p>
        </div>

        {/* 1. Consensus Weight Math */}
        <section className="glass-card p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-electric-500/[0.02] blur-3xl pointer-events-none" />
          
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-electric-500" />
            1. Weighted Multi-Agent Framework
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            Instead of evaluating metrics in isolation, our system runs three independent, domain-specialized AI analyst agents 
            and computes a weighted aggregate score. Weights reflect long-term value generation theory, prioritizing balance-sheet health 
            while honoring momentum and market narrative triggers.
          </p>

          <div className="grid gap-4 md:grid-cols-3 pt-2">
            <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Fundamental Analyst</span>
                <span className="text-xs font-bold text-emerald-400">55% Weight</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Calculates debt ratios, ROCE consistency, operating cash flows, PAT margins, and relative valuations.
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Technical Analyst</span>
                <span className="text-xs font-bold text-purple-400">25% Weight</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Tracks EMA/SMA breakouts, support/resistance clusters, MACD trend crossovers, and RSI levels.
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">News Analyst</span>
                <span className="text-xs font-bold text-rose-400">20% Weight</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Ingests live news, classifies events into 7 categories, and scores real-time sentiment impact.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-navy-900 border border-white/5 p-4 flex items-center justify-center font-mono text-sm font-semibold tracking-wide text-electric-300">
            Kundli Score = (F × 0.55) + (T × 0.25) + (N × 0.20)
          </div>
        </section>

        {/* 2. Signal Mapping Tiers */}
        <section className="glass-card p-8 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-gold-400" />
            2. Signal Mapping & Verdict Thresholds
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            The combined score yields a specific verdict tier. Higher ratings require not just score triggers, but also high overall AI consensus confidence.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Combined Score</th>
                  <th className="pb-3 px-4">Min. Confidence</th>
                  <th className="pb-3 px-4">Verdict Signal</th>
                  <th className="pb-3 pl-4 text-right">Indicator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                <tr>
                  <td className="py-3 pr-4 font-semibold text-white">≥ 80</td>
                  <td className="py-3 px-4 text-gray-300">≥ 70%</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">Strong Buy Signal</td>
                  <td className="py-3 pl-4 text-right text-base">🟢</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-white">65 – 79</td>
                  <td className="py-3 px-4 text-gray-300">≥ 60%</td>
                  <td className="py-3 px-4 font-bold text-blue-400">Buy Signal</td>
                  <td className="py-3 pl-4 text-right text-base">🔵</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-white">45 – 64</td>
                  <td className="py-3 px-4 text-gray-500">Any</td>
                  <td className="py-3 px-4 font-bold text-gold-400">Neutral / Watch</td>
                  <td className="py-3 pl-4 text-right text-base">🟡</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-white">30 – 44</td>
                  <td className="py-3 px-4 text-gray-500">Any</td>
                  <td className="py-3 px-4 font-bold text-orange-400">Caution</td>
                  <td className="py-3 pl-4 text-right text-base">🟠</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-white">&lt; 30</td>
                  <td className="py-3 px-4 text-gray-500">Any</td>
                  <td className="py-3 px-4 font-bold text-rose-400">Avoid Signal</td>
                  <td className="py-3 pl-4 text-right text-base">🔴</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Confidence Metrics */}
        <section className="glass-card p-8 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            3. Data Completeness & Confidence Disclosure
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            AI signals are only as strong as the underlying datasets. If an agent (e.g., News) suffers a pipeline failure or has insufficient recent data, the system implements a **normalized penalty math**:
          </p>
          <ul className="list-disc pl-5 text-xs text-gray-400 space-y-2 leading-relaxed">
            <li>
              <strong className="text-white">Normalized Scoring:</strong> We normalize the weights based on *only* active agents, ensuring that a stock is not unfairly graded with a 0 simply due to a missing news cycle.
            </li>
            <li>
              <strong className="text-white">Confidence Penalty:</strong> The overall confidence score is reduced proportionally to the missing weight. 100% data completeness is required for maximum confidence outputs.
            </li>
            <li>
              <strong className="text-white">Auto-Refreshing Pipelines:</strong> Missing agents automatically schedule ingestion tasks in the background to bring completeness back to 100%.
            </li>
          </ul>
        </section>

        {/* 4. Methodology Link Back */}
        <div className="flex justify-between items-center pt-4 border-t border-white/5">
          <Link href="/dashboard" className="text-xs text-electric-400 font-semibold flex items-center gap-1.5 hover:underline">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">
            AI Stock Kundli Consortium • Copyright © 2026
          </span>
        </div>
      </main>
    </div>
  );
}
