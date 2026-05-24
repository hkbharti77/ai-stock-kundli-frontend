"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslation } from "../context/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";

/* ═══════════════════════════════════════════════════════════
   AI Stock Kundli — Landing Page
   Premium dark-theme hero with glassmorphism and animations
   ═══════════════════════════════════════════════════════════ */

const FEATURES = [
  {
    icon: "🧠",
    title: "7-Agent Weighted Consensus",
    description:
      "7 specialized AI agents analyze fundamentals, technicals, news, risk, macro, sector, and valuation in parallel for optimal consensus.",
    badge: "Core Engine",
  },
  {
    icon: "📊",
    title: "Bilingual Kundli Reports",
    description:
      "Comprehensive research reports generated in under 30 seconds with confidence scores in English and Hindi.",
    badge: "Instant",
  },
  {
    icon: "🔔",
    title: "Twilio SMS & Email Alerts",
    description:
      "Real-time breakout signals, news sentiment spikes, and agent consensus shifts delivered directly via SMS and Email.",
    badge: "Live Telemetry",
  },
  {
    icon: "🎯",
    title: "Smart Portfolio Builder",
    description:
      "AI-optimized position sizing with Kelly-criterion adjustments and correlation-aware diversification.",
    badge: "Pro Tier Only",
  },
  {
    icon: "📰",
    title: "Transparency Dashboard",
    description:
      "Track every historical consensus call in our public accuracy ledger to audit long-term predictive success.",
    badge: "Open Audit",
  },
  {
    icon: "🛡️",
    title: "Risk Quantification",
    description:
      "Promoter pledging, governance flags, debt analysis, and volatility scoring in one risk dashboard.",
    badge: "Safety",
  },
];

const STATS = [
  { value: "2,000+", label: "NSE Stocks Covered" },
  { value: "7", label: "AI Consensus Agents" },
  { value: "86.2%", label: "Verified Accuracy Rate" },
  { value: "<30s", label: "Report Generation" },
];

const TICKERS = [
  { name: "RELIANCE", price: "₹2,847.50", change: "+1.24%", up: true },
  { name: "TCS", price: "₹3,654.20", change: "-0.38%", up: false },
  { name: "HDFC BANK", price: "₹1,623.80", change: "+0.92%", up: true },
  { name: "INFY", price: "₹1,478.35", change: "+2.15%", up: true },
  { name: "ITC", price: "₹442.60", change: "-0.67%", up: false },
];

export default function LandingPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTickerIdx, setActiveTickerIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTickerIdx((prev) => (prev + 1) % TICKERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ── Ambient Background Glow ──────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-electric-500/[0.07] blur-[120px]" />
        <div className="absolute top-1/2 -right-40 h-[500px] w-[500px] rounded-full bg-gold-500/[0.05] blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-emerald-500/[0.04] blur-[100px]" />
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="relative z-20 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-electric-500 to-electric-600 shadow-lg shadow-electric-500/25">
              <span className="text-lg font-bold text-white">K</span>
            </div>
            <div>
              <span className="text-lg font-bold text-white">Stock Kundli</span>
              <span className="ml-2 badge-blue text-[10px]">AI</span>
            </div>
          </div>

          {/* Ticker strip */}
          <div className="hidden items-center gap-6 md:flex">
            {TICKERS.map((ticker, i) => (
              <div
                key={ticker.name}
                className={`flex items-center gap-2 text-xs transition-all duration-500 ${i === activeTickerIdx
                    ? "scale-110 opacity-100"
                    : "opacity-40"
                  }`}
              >
                <span className="font-medium text-gray-300">{ticker.name}</span>
                <span className="font-mono text-white">{ticker.price}</span>
                <span
                  className={`font-mono font-medium ${ticker.up ? "text-emerald-400" : "text-rose-400"
                    }`}
                >
                  {ticker.change}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Link href="/login" className="nav-link hidden sm:block">
              {t("landing.login")}
            </Link>
            <Link href="/signup" className="btn-primary !px-5 !py-2.5 text-sm">
              {t("landing.getStarted")}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ──────────────────────────────────── */}
      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-6 pt-20 pb-16 text-center lg:pt-32">
          <div className="animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric-500/20 bg-electric-500/10 px-4 py-1.5 text-sm text-electric-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-electric-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-electric-400"></span>
              </span>
              Now analyzing 2,000+ NSE/BSE stocks in real-time
            </div>
          </div>

          <h1 className="animate-fade-in-up mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl [animation-delay:100ms]">
            {t("landing.tagline")}
          </h1>

          <p className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 [animation-delay:200ms]">
            {t("landing.description")}
          </p>

          {/* Search Bar */}
          <div className="animate-fade-in-up mx-auto mt-10 max-w-xl [animation-delay:300ms]">
            <div className="glass-card glow-border flex items-center gap-3 p-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-electric-500/10 text-electric-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("landing.searchAnyStock")}
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
                id="hero-search"
              />
              <button className="btn-primary !rounded-lg !px-5 !py-2.5 text-sm">
                {t("landing.analyzeBtn")}
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Try: RELIANCE, INFY, TATAMOTORS, HDFCBANK
            </p>
          </div>

          {/* Stats Strip */}
          <div className="animate-fade-in-up mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 [animation-delay:400ms]">
            {STATS.map((stat) => (
              <div key={stat.label} className="stat-card items-center text-center">
                <span className="text-2xl font-bold text-white sm:text-3xl">
                  {stat.value}
                </span>
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features Grid ─────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="section-heading text-white">
              Everything you need,{" "}
              <span className="gradient-text">nothing you don&apos;t</span>
            </h2>
            <p className="mt-4 text-gray-400">
              Six powerful engines working together to give you an unfair
              advantage.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, idx) => (
              <div
                key={feature.title}
                className="glass-card-hover group p-6"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-3xl">{feature.icon}</span>
                  <span className="badge-blue">{feature.badge}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-electric-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Section ───────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="glass-card glow-border relative overflow-hidden p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-electric-500/5 via-transparent to-gold-500/5" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                {t("landing.smarterDecisions")}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-gray-400">
                Join thousands of investors using AI-powered research to cut
                through the noise and focus on what matters.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="/signup" className="btn-gold text-base">
                  {t("landing.startFreeBtn")}
                </Link>
                <Link href="/login" className="btn-secondary text-base">
                  {t("landing.viewDemoBtn")}
                </Link>
                <Link href="/dashboard/accuracy" className="btn-secondary text-base border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                  📈 View Live Accuracy Ledger
                </Link>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Free tier includes 3 Kundli reports per day. Upgrade anytime.
              </p>
            </div>
          </div>
        </section>

        {/* ── Footer ────────────────────────────────────────── */}
        <footer className="border-t border-white/5 py-12">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-electric-500/20">
                    <span className="text-xs font-bold text-electric-400">K</span>
                  </div>
                  AI Stock Kundli © {new Date().getFullYear()}
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
                  <span className="text-gray-700">|</span>
                  <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link>
                </div>
              </div>
              <p className="text-xs text-gray-600 max-w-lg text-center sm:text-right leading-relaxed">
                This platform is a research tool, not a SEBI-registered
                investment advisor. All signals are data-driven insights, not
                investment advice. Please read our full terms of service and disclaimers.
              </p>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
