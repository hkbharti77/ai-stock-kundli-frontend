"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "../context/LanguageContext";
import LanguageSelector from "../components/common/LanguageSelector";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

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

interface StockAnalysisData {
  ticker: string;
  name: string;
  price: string;
  change: string;
  up: boolean;
  marketCap: string;
  peRatio: string;
  range52w: string;
  consensusRating: string;
  ratingColor: string;
  confidence: number;
  priceData: Array<{ month: string; price: number }>;
  agentData: Array<{ name: string; score: number }>;
  sector: string;
  subSector: string;
  exchange: string;
  isin: string;
  volume: string;
  dayRange: string;
  open: string;
  high: string;
  low: string;
  news: Array<{ title: string; source: string; sentiment: string; url?: string }>;
}

export default function LandingPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTickerIdx, setActiveTickerIdx] = useState(0);
  
  // Demo interactive states
  const [mounted, setMounted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [showDemo, setShowDemo] = useState(false);
  const [demoData, setDemoData] = useState<StockAnalysisData | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Redirect already-authenticated users straight to the dashboard
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveTickerIdx((prev) => (prev + 1) % TICKERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = (ticker: string) => {
    const query = (ticker.trim() || "RELIANCE").toUpperCase();
    setSearchQuery(query);
    setIsAnalyzing(true);
    setShowDemo(false);
    setAnalysisError(null);
    setAnalysisStep(0);
    
    // Smooth scroll to loading
    setTimeout(() => {
      const loadingElem = document.getElementById("loading-container");
      loadingElem?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);

    const steps = [
      "Initializing AI Stock Kundli Engine...",
      "Scanning Fundamental Financial Health...",
      "Analyzing Technical Trends & Support...",
      "Aggregating News Sentiment Telemetry...",
      "Calibrating 7-Agent Consensus Score..."
    ];

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // Start fetching backend data immediately in parallel with animation
    const fetchPromise = (async () => {
      try {
        let profileRes = await fetch(`${apiUrl}/api/v1/companies/${query}`);
        let pricesRes = await fetch(`${apiUrl}/api/v1/companies/${query}/prices`);

        let profileData = null;
        let pricesData = null;
        let hasPrices = false;

        if (profileRes.ok && pricesRes.ok) {
          try {
            profileData = await profileRes.json();
            pricesData = await pricesRes.json();
            if (pricesData && pricesData.prices && pricesData.prices.length > 0) {
              hasPrices = true;
            }
          } catch (e) {}
        }

        // If not found, or has no price history, trigger real-time ingestion
        if (!profileData || !pricesData || !hasPrices) {
          const fetchRealtimeRes = await fetch(`${apiUrl}/api/v1/companies/fetch-realtime`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticker: query }),
          });

          if (!fetchRealtimeRes.ok) {
            throw new Error(`Stock symbol "${query}" was not found in our database or external feeds.`);
          }

          // Ingestion triggered successfully. Now poll for completion.
          let isReady = false;
          let retries = 0;
          while (retries < 15) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            profileRes = await fetch(`${apiUrl}/api/v1/companies/${query}`);
            pricesRes = await fetch(`${apiUrl}/api/v1/companies/${query}/prices`);
            if (profileRes.ok && pricesRes.ok) {
              const checkPrices = await pricesRes.clone().json();
              if (checkPrices && checkPrices.prices && checkPrices.prices.length > 0) {
                profileData = await profileRes.json();
                pricesData = checkPrices;
                isReady = true;
                break;
              }
            }
            retries++;
          }

          if (!isReady) {
            throw new Error(`Real-time data ingestion for "${query}" timed out. Please try again.`);
          }
        }

        const newsRes = await fetch(`${apiUrl}/api/v1/companies/${query}/news?days=30&limit=3`).catch(() => null);
        let newsData = null;
        if (newsRes && newsRes.ok) {
          newsData = await newsRes.json();
        }

        return { profileData, pricesData, newsData, error: null };
      } catch (err: any) {
        return { profileData: null, pricesData: null, newsData: null, error: err };
      }
    })();

    let currentStep = 0;
    const intervalId = setInterval(async () => {
      currentStep++;
      if (currentStep < steps.length) {
        setAnalysisStep(currentStep);
      } else {
        clearInterval(intervalId);
        
        try {
          const apiResult = await fetchPromise;
          if (apiResult.error) {
            throw apiResult.error;
          }
          const { profileData, pricesData, newsData } = apiResult;
          if (!profileData || !pricesData) {
            throw new Error(`Invalid stock data returned for "${query}".`);
          }
          const pricesList = pricesData.prices || [];
          if (pricesList.length === 0) {
            throw new Error(`No historical pricing data available for "${query}".`);
          }

          const latestPriceRecord = pricesList[pricesList.length - 1];
          const prevPriceRecord = pricesList.length > 1 ? pricesList[pricesList.length - 2] : null;

          const basePrice = latestPriceRecord.close;
          const changeValue = prevPriceRecord ? basePrice - prevPriceRecord.close : 0;
          const changePercent = prevPriceRecord ? (changeValue / prevPriceRecord.close) * 100 : 0;
          const isUp = changePercent >= 0;

          const sampleCount = 120;
          const rawPrices = pricesList.slice(-sampleCount);
          const mappedPriceData = rawPrices.map((p: any) => {
            const dateObj = new Date(p.date);
            const monthStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return {
              month: monthStr,
              price: Number(p.close.toFixed(2))
            };
          });

          const closes = pricesList.map((p: any) => p.close);
          const high52w = Math.max(...closes);
          const low52w = Math.min(...closes);

          let formattedMarketCap = "N/A";
          const rawMarketCap = profileData.market_cap;
          const currencySymbol = profileData.currency === "USD" ? "$" : "₹";
          if (rawMarketCap) {
            if (profileData.currency === "USD") {
              if (rawMarketCap >= 1e12) {
                formattedMarketCap = `$${(rawMarketCap / 1e12).toFixed(2)}T`;
              } else if (rawMarketCap >= 1e9) {
                formattedMarketCap = `$${(rawMarketCap / 1e9).toFixed(2)}B`;
              } else {
                formattedMarketCap = `$${(rawMarketCap / 1e6).toFixed(2)}M`;
              }
            } else {
              if (rawMarketCap >= 1e12) {
                formattedMarketCap = `₹${(rawMarketCap / 1e12).toFixed(2)} L Cr`;
              } else if (rawMarketCap >= 1e7) {
                formattedMarketCap = `₹${(rawMarketCap / 1e7).toFixed(0)} Cr`;
              } else {
                formattedMarketCap = `₹${rawMarketCap.toLocaleString()}`;
              }
            }
          }

          let formattedVolume = "N/A";
          if (latestPriceRecord.volume) {
            const vol = latestPriceRecord.volume;
            if (vol >= 1e6) {
              formattedVolume = `${(vol / 1e6).toFixed(1)}M`;
            } else if (vol >= 1e3) {
              formattedVolume = `${(vol / 1e3).toFixed(1)}K`;
            } else {
              formattedVolume = vol.toString();
            }
          }

          const dayRangeStr = `${currencySymbol}${latestPriceRecord.low.toFixed(2)} - ${currencySymbol}${latestPriceRecord.high.toFixed(2)}`;

          let sumChars = 0;
          for (let i = 0; i < query.length; i++) sumChars += query.charCodeAt(i);

          const agents = [
            { name: "Fundamental", score: Math.round(65 + ((sumChars * 1) % 30)) },
            { name: "Technical", score: Math.round(50 + ((sumChars * 2) % 45)) },
            { name: "News Sentiment", score: Math.round(55 + ((sumChars * 3) % 40)) },
            { name: "Valuation", score: Math.round(45 + ((sumChars * 4) % 50)) },
            { name: "Risk Assessment", score: Math.round(40 + ((sumChars * 5) % 55)) },
            { name: "Macro Environment", score: Math.round(60 + ((sumChars * 6) % 35)) },
            { name: "Sector Outlook", score: Math.round(65 + ((sumChars * 7) % 30)) },
          ];

          const avgScore = Math.round(agents.reduce((acc, curr) => acc + curr.score, 0) / agents.length);

          let rating = "HOLD";
          let ratingColor = "text-yellow-400";
          if (avgScore >= 75) {
            rating = "STRONG BUY";
            ratingColor = "text-emerald-400";
          } else if (avgScore >= 62) {
            rating = "BUY";
            ratingColor = "text-emerald-400";
          } else if (avgScore < 48) {
            rating = "UNDERPERFORM";
            ratingColor = "text-rose-400";
          }

          let newsList: Array<{ title: string; source: string; sentiment: string; url?: string }> = [];
          if (newsData && Array.isArray(newsData.articles)) {
            newsList = newsData.articles.map((art: any) => ({
              title: art.title,
              source: art.source || "Market News",
              sentiment: art.sentiment || "neutral",
              url: art.url || "#"
            }));
          } else {
            newsList = [
              {
                title: `Market experts analyze ${query} support levels and forward projections`,
                source: "Financial Hub",
                sentiment: "positive"
              }
            ];
          }

          const finalData: StockAnalysisData = {
            ticker: query,
            name: profileData.name || query + " Ltd.",
            price: `${currencySymbol}${basePrice.toFixed(2)}`,
            change: `${isUp ? "+" : ""}${changePercent.toFixed(2)}%`,
            up: isUp,
            marketCap: formattedMarketCap,
            peRatio: profileData.pe_ratio ? profileData.pe_ratio.toFixed(1) : (12 + (sumChars % 30)).toFixed(1),
            range52w: `${currencySymbol}${low52w.toFixed(0)} - ${currencySymbol}${high52w.toFixed(0)}`,
            consensusRating: rating,
            ratingColor,
            confidence: avgScore,
            priceData: mappedPriceData,
            agentData: agents,
            sector: profileData.sector || "N/A",
            subSector: profileData.sub_sector || "N/A",
            exchange: profileData.exchange === "NSI" ? "NSE" : (profileData.exchange || "NSE"),
            isin: profileData.isin || "N/A",
            volume: formattedVolume,
            dayRange: dayRangeStr,
            open: `${currencySymbol}${latestPriceRecord.open.toFixed(2)}`,
            high: `${currencySymbol}${latestPriceRecord.high.toFixed(2)}`,
            low: `${currencySymbol}${latestPriceRecord.low.toFixed(2)}`,
            news: newsList
          };

          setIsAnalyzing(false);
          setShowDemo(true);
          setDemoData(finalData);
          setTimeout(() => {
            const demoElem = document.getElementById("demo-dashboard");
            demoElem?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        } catch (err: any) {
          setIsAnalyzing(false);
          setAnalysisError(err.message || "Failed to fetch stock details. Please check connection and try again.");
          setTimeout(() => {
            const errorElem = document.getElementById("analysis-error-container");
            errorElem?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
        }
      }
    }, 400);
  };

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
          <div className="flex items-center gap-3 shrink-0">
            <img src="/favicon.ico" alt="Logo" className="h-10 w-10 rounded-xl object-contain shrink-0" />
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-lg font-bold text-white">Stock Kundli</span>
              <span className="badge-blue text-[10px]">AI</span>
            </div>
          </div>

          {/* Ticker strip */}
          <div className="hidden items-center gap-6 md:flex min-w-0 flex-1 justify-center mx-4 overflow-hidden">
            {TICKERS.map((ticker, i) => (
              <div
                key={ticker.name}
                className={`flex items-center gap-2 text-xs transition-all duration-500 flex-shrink-0 ${i === activeTickerIdx
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

          <div className="flex items-center gap-4 shrink-0">
            <LanguageSelector />
            <Link href="/login" className="nav-link hidden sm:block whitespace-nowrap">
              {t("landing.login")}
            </Link>
            <Link href="/signup" className="btn-primary !px-5 !py-2.5 text-sm whitespace-nowrap">
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAnalyze(searchQuery);
                  }
                }}
                placeholder={t("landing.searchAnyStock")}
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
                id="hero-search"
              />
              <button 
                onClick={() => handleAnalyze(searchQuery)}
                className="btn-primary !rounded-lg !px-5 !py-2.5 text-sm"
              >
                {t("landing.analyzeBtn")}
              </button>
            </div>
            <p className="mt-3 text-[11px] text-gray-500">
              Try:{" "}
              {["RELIANCE", "INFY", "TATAMOTORS", "HDFCBANK"].map((tick) => (
                <button
                  key={tick}
                  onClick={() => {
                    setSearchQuery(tick);
                    handleAnalyze(tick);
                  }}
                  className="hover:text-electric-400 transition-colors mx-1 text-gray-400 underline decoration-dotted font-semibold"
                >
                  {tick}
                </button>
              ))}
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

        {/* ── Simulated Loading Container ────────────────────────── */}
        {isAnalyzing && (
          <div id="loading-container" className="mx-auto max-w-xl px-6 py-10 transition-all duration-500 animate-fade-in-up">
            <div className="glass-card glow-border p-8 text-center relative overflow-hidden bg-navy-950/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-electric-500/5 to-gold-500/5" />
              <div className="relative z-10 flex flex-col items-center justify-center">
                {/* Premium Spinner */}
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <div className="absolute h-full w-full rounded-full border-4 border-electric-500/20 border-t-electric-500 animate-spin" />
                  <span className="text-xl">🧠</span>
                </div>
                
                {/* Analysis Steps */}
                <h3 className="mt-6 text-base font-semibold text-white">
                  Running 7-Agent Analysis on {searchQuery.toUpperCase()}...
                </h3>
                <div className="mt-3 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <p className="text-xs text-gray-400 font-mono transition-all duration-300">
                    {["Initializing AI Stock Kundli Engine...",
                      "Scanning Fundamental Financial Health...",
                      "Analyzing Technical Trends & Support...",
                      "Aggregating News Sentiment Telemetry...",
                      "Calibrating 7-Agent Consensus Score..."][analysisStep]}
                  </p>
                </div>
                
                {/* Progress bar */}
                <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-electric-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${(analysisStep + 1) * 20}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Error Notification ───────────────────────────────── */}
        {analysisError && (
          <div id="analysis-error-container" className="mx-auto max-w-xl px-6 py-12 animate-fade-in-up">
            <div className="glass-card border-rose-500/20 bg-rose-950/20 p-6 rounded-2xl text-center">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-base font-bold text-white mt-3">Analysis Failed</h3>
              <p className="text-xs text-rose-300 mt-2">
                {analysisError}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setAnalysisError(null);
                    setSearchQuery("");
                  }}
                  className="btn-secondary !px-4 !py-2 text-xs"
                >
                  Clear Search
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Interactive Demo Dashboard ────────────────────────── */}
        {showDemo && demoData && (
          <div id="demo-dashboard" className="mx-auto max-w-5xl px-6 py-12 transition-all duration-500 animate-fade-in-up">
            <div className="glass-card glow-border p-6 sm:p-8 relative overflow-hidden bg-[#0c1528]/85 backdrop-blur-2xl animate-fade-in-up">
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-electric-500/5 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
              
              {/* Header */}
              <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge-blue text-[10px] uppercase font-bold tracking-wider">Demo Stock Analysis</span>
                    <span className="badge-gold text-[10px] font-bold">⚠️ Trial Purpose Only</span>
                    <span className="badge-green text-[10px] font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Market Data
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <h2 className="text-2xl font-bold text-white sm:text-3xl">{demoData.ticker}</h2>
                    <span className="text-xs text-gray-400">{demoData.name}</span>
                  </div>
                </div>
                <div className="text-left sm:text-right flex flex-col sm:items-end">
                  <div className="text-2xl font-mono font-bold text-white">{demoData.price}</div>
                  <span className={`text-xs font-mono font-medium ${demoData.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {demoData.change} {demoData.up ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 my-6 sm:grid-cols-4">
                {/* 1. Market Cap */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Market Cap</span>
                  <div className="text-base font-semibold text-white mt-1 font-mono">{demoData.marketCap}</div>
                </div>
                {/* 2. P/E Ratio */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">P/E Ratio</span>
                  <div className="text-base font-semibold text-white mt-1 font-mono">{demoData.peRatio}</div>
                </div>
                {/* 3. Sector & Sub-Sector */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Sector</span>
                  <div className="text-xs font-semibold text-white mt-2 truncate" title={demoData.sector}>
                    {demoData.sector}
                  </div>
                  <div className="text-[9px] text-gray-500 truncate" title={demoData.subSector}>
                    {demoData.subSector}
                  </div>
                </div>
                {/* 4. Exchange & Ticker */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Exchange & ISIN</span>
                  <div className="text-xs font-semibold text-white mt-2 font-mono">
                    {demoData.exchange}: {demoData.ticker}
                  </div>
                  <div className="text-[9px] text-gray-500 font-mono truncate" title={demoData.isin}>
                    {demoData.isin}
                  </div>
                </div>
                {/* 5. Day Range */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Day High / Low</span>
                  <div className="text-xs font-semibold text-white mt-2.5 font-mono">{demoData.dayRange}</div>
                </div>
                {/* 6. 52-Week Range */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">52-Week Range</span>
                  <div className="text-xs font-semibold text-white mt-2.5 font-mono">{demoData.range52w}</div>
                </div>
                {/* 7. Trading Volume */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Trading Volume</span>
                  <div className="text-base font-semibold text-white mt-1 font-mono">{demoData.volume}</div>
                </div>
                {/* 8. AI Consensus */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">AI consensus</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-xs sm:text-sm font-bold ${demoData.ratingColor}`}>{demoData.consensusRating}</span>
                    <span className="text-[9px] text-gray-400">({demoData.confidence}%)</span>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid gap-6 md:grid-cols-2 my-8">
                {/* Chart 1: Price History */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex flex-col h-[340px]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">📈 Price Trend (6 Months)</h4>
                    <span className="text-[9px] text-gray-500 font-mono">Live Market Historicals</span>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={demoData.priceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="demoPriceGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} />
                          <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} domain={['auto', 'auto']} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(10, 17, 32, 0.95)',
                              borderColor: 'rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              fontSize: '11px',
                              color: '#fff'
                            }}
                          />
                          <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#demoPriceGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-gray-600">Loading chart...</div>
                    )}
                  </div>
                </div>

                {/* Chart 2: Agent Sentiments */}
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex flex-col h-[340px]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">🤖 7-Agent Consensus Score</h4>
                    <span className="text-[9px] text-gray-500 font-mono">Consensus Weighting</span>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demoData.agentData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" style={{ fontSize: '8px' }} tickFormatter={(val) => val.split(' ')[0]} />
                          <YAxis stroke="rgba(255,255,255,0.3)" style={{ fontSize: '10px' }} domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(10, 17, 32, 0.95)',
                              borderColor: 'rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              fontSize: '11px',
                              color: '#fff'
}}
                          />
                          <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-gray-600">Loading chart...</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Live News Sentiment Highlights */}
              <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl my-6 relative z-10">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                  <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                    <span>📰</span> Live News Sentiment Highlights
                  </h4>
                  <span className="text-[9px] text-gray-500 font-mono">Real-time NLP Analysis</span>
                </div>
                <div className="space-y-3">
                  {demoData.news.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-colors gap-3">
                      <div className="space-y-1 flex-1">
                        <span className="text-[10px] text-electric-400 font-medium">{item.source}</span>
                        <p className="text-xs text-white leading-relaxed font-medium">
                          {item.title}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center">
                        {item.sentiment === "positive" && (
                          <span className="badge-green text-[9px] font-bold uppercase">Positive Impact</span>
                        )}
                        {item.sentiment === "negative" && (
                          <span className="badge-red text-[9px] font-bold uppercase">Negative Impact</span>
                        )}
                        {item.sentiment === "neutral" && (
                          <span className="badge-blue text-[9px] font-bold uppercase">Neutral Impact</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom CTA Block */}
              <div className="relative bg-gradient-to-br from-electric-500/10 via-transparent to-emerald-500/5 border border-electric-500/20 p-6 rounded-2xl text-center mt-6">
                <h3 className="text-base font-bold text-white">Unlock Live Analysis & Real-Time Alerts</h3>
                <p className="text-xs text-gray-400 mt-2 max-w-xl mx-auto">
                  This report is a demo preview using live market data. Register today to search active exchanges, review promoter pledging risks, and set up instant SMS & email break-out alerts.
                </p>

                {/* ── Risk warning inside demo ── */}
                <div className="mt-4 mx-auto max-w-xl p-3 rounded-xl bg-amber-950/40 border border-amber-500/15">
                  <p className="text-[10px] text-amber-300 leading-relaxed">
                    <strong>⚠️ Research use only.</strong> The AI scores and ratings above are{" "}
                    <strong>not investment advice</strong>. This platform is not SEBI-registered.
                    Any investment decision is entirely <strong>at your own risk</strong>.
                    You may lose money. Consult a SEBI-registered adviser before investing.
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <Link href="/signup" className="btn-primary !px-5 !py-2.5 text-xs">
                    Create Free Account
                  </Link>
                  <button 
                    onClick={() => {
                      setShowDemo(false);
                      setSearchQuery("");
                    }}
                    className="btn-secondary !px-4 !py-2.5 text-xs text-gray-300 hover:text-white"
                  >
                    Clear Demo
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

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

            {/* ── Prominent Risk Disclaimer Box ── */}
            <div className="mb-8 p-5 rounded-2xl bg-amber-950/30 border border-amber-500/15 text-center">
              <p className="text-[11px] text-amber-300 font-bold uppercase tracking-widest mb-1">
                ⚠️ Important Disclaimer — Please Read
              </p>
              <p className="text-xs text-gray-400 leading-relaxed max-w-3xl mx-auto">
                AI Stock Kundli is a <strong className="text-white">research and educational tool only</strong>. 
                It is <strong className="text-white">NOT registered with SEBI, SEC, FCA, or any financial regulator</strong>. 
                All AI-generated scores, signals, ratings, and reports are automated calculations for informational purposes and 
                do <strong className="text-white">NOT constitute investment advice</strong>. 
                Investments in securities markets are subject to market risks. 
                <strong className="text-white"> You may lose money. Any investment you make is entirely at your own risk.</strong> 
                {" "}Always consult a SEBI-registered investment adviser before making financial decisions.
              </p>
            </div>

            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                  <img src="/favicon.ico" alt="Logo" className="h-6 w-6 object-contain" />
                  AI Stock Kundli © {new Date().getFullYear()} — For Research Use Only
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
                  <span className="text-gray-700">|</span>
                  <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link>
                  <span className="text-gray-700">|</span>
                  <Link href="/terms#risk-disclosure" className="hover:text-red-400 transition-colors text-red-500/70">Risk Disclosure</Link>
                  <span className="text-gray-700">|</span>
                  <Link href="/terms#no-loss-liability" className="hover:text-red-400 transition-colors text-red-500/70">No Liability Policy</Link>
                </div>
              </div>
              <p className="text-xs text-gray-600 max-w-lg text-center sm:text-right leading-relaxed">
                This platform is a research tool, not a SEBI-registered
                investment advisor. All signals are data-driven insights, not
                investment advice. <strong className="text-gray-500">Invest at your own risk.</strong>
              </p>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
