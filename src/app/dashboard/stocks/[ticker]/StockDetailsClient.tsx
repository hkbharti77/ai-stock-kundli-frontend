"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "../../../../context/LanguageContext";
import LanguageSelector from "../../../../components/LanguageSelector";
import SearchAutocomplete from "../../../../components/SearchAutocomplete";
import AlertModal from "../../../../components/AlertModal";

// Import modular extracted sub-components
import FinancialVisualizer from "./components/FinancialVisualizer";
import KundliThesis from "./components/KundliThesis";
import KundliGauge from "./components/KundliGauge";
import TechnicalVisualizer, { TechnicalIndicatorsWrapper } from "./components/TechnicalVisualizer";
import TechnicalGauge from "./components/TechnicalGauge";
import TechnicalThesis from "./components/TechnicalThesis";
import NewsVisualizer from "./components/NewsVisualizer";
import KundliReportVisualizer from "./components/KundliReportVisualizer";
import SEBIDisclaimer from "./components/SEBIDisclaimer";

interface CompanyProfile {
  ticker: string;
  name: string;
  isin: string;
  exchange: string;
  market_cap: number | null;
  sector: string | null;
  sub_sector: string | null;
}

interface FinancialStatement {
  period_end: string;
  period_type: string;
  revenue: number | null;
  ebitda: number | null;
  pat: number | null;
  eps: number | null;
  debt_equity: number | null;
  roce: number | null;
  roe: number | null;
  operating_cash_flow: number | null;
  free_cash_flow: number | null;
}

interface FinancialsWrapper {
  ticker: string;
  annual: FinancialStatement[];
  quarterly: FinancialStatement[];
}

interface PriceRecord {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PricesWrapper {
  ticker: string;
  prices: PriceRecord[];
  count: number;
}

interface AgentOutputData {
  id: number;
  company_id: number;
  agent_type: string;
  score: number;
  confidence: number;
  trend: string;
  strengths: string[];
  concerns: string[];
  reasoning: string;
  created_at: string;
  updated_at: string;
}

export default function StockDetailsClient() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const ticker = (params.ticker as string).toUpperCase();

  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [financials, setFinancials] = useState<FinancialsWrapper | null>(null);
  const [prices, setPrices] = useState<PricesWrapper | null>(null);
  const [agentOutput, setAgentOutput] = useState<AgentOutputData | null>(null);
  const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalIndicatorsWrapper | null>(null);
  const [technicalAnalysis, setTechnicalAnalysis] = useState<AgentOutputData | null>(null);
  const [newsData, setNewsData] = useState<{ articles: unknown[]; sentimentBreakdown: Record<string, number>; sentimentTrend: unknown[] } | null>(null);
  const [newsAnalysis, setNewsAnalysis] = useState<Record<string, unknown> | null>(null);
  const [kundliReport, setKundliReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [loadingTechnical, setLoadingTechnical] = useState(false);
  const [loadingTechnicalIndicators, setLoadingTechnicalIndicators] = useState(false);
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingKundliReport, setLoadingKundliReport] = useState(false);

  // Real-time ingestion state (shown when company not in DB)
  const [realtimeFetching, setRealtimeFetching] = useState(false);
  const [realtimeStep, setRealtimeStep] = useState(0);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"kundli_report" | "chart" | "financials" | "fundamental" | "technical" | "news">("kundli_report");

  // Interactive chart state
  const [hoveredPrice, setHoveredPrice] = useState<PriceRecord | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Watchlist state & toggling
  const [inWatchlist, setInWatchlist] = useState(false);
  const [togglingWatchlist, setTogglingWatchlist] = useState(false);

  // User and Rate Limiting states
  const [user, setUser] = useState<any>(null);
  const [rateLimited, setRateLimited] = useState(false);

  // Custom Alert Modal state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error" | "info">("info");

  const showAlert = (title: string, message: string, type: "success" | "error" | "info" = "info") => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertOpen(true);
  };

  useEffect(() => {
    // Dynamic Razorpay script loading
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleUpgrade = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const res = await fetch(`${apiUrl}/api/v1/subscriptions/checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ plan: "starter" })
      });

      if (!res.ok) throw new Error("Checkout failed");
      const order = await res.json();

      if (order.sandbox) {
        // Simulation upgrade for sandbox testing
        const upgradeRes = await fetch(`${apiUrl}/api/v1/subscriptions/sandbox-upgrade`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ plan: "starter" })
        });
        if (upgradeRes.ok) {
          const userRes = await fetch(`${apiUrl}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (userRes.ok) {
            const data = await userRes.json();
            setUser(data);
          } else {
            const updatedUser = await upgradeRes.json();
            setUser(updatedUser);
          }
          setRateLimited(false); // Clear the rate limit block instantly on upgrade!
          // Retry fetching the Kundli report to show premium results instantly!
          fetchKundliReport();
          showAlert("Upgrade Successful", "🎉 Sandbox Upgrade Successful! Your plan is now upgraded to 'Starter'.", "success");
        }
      } else {
        const options = {
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: "AI Stock Kundli",
          description: "Starter Subscription",
          order_id: order.id,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch(`${apiUrl}/api/v1/subscriptions/verify`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  plan: "starter"
                })
              });
              
              if (verifyRes.ok) {
                const userRes = await fetch(`${apiUrl}/api/v1/auth/me`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (userRes.ok) {
                  const data = await userRes.json();
                  setUser(data);
                }
                setRateLimited(false);
                fetchKundliReport();
                showAlert("Upgrade Successful", "🎉 Thank you! Your plan is now upgraded to 'Starter'.", "success");
              } else {
                showAlert("Verification Failed", "Payment verification failed. Please contact support.", "error");
              }
            } catch (err) {
              console.error("Error verifying payment:", err);
              showAlert("Verification Error", "An error occurred while verifying payment.", "error");
            }
          },
          prefill: {
            email: user?.email || "",
          },
          theme: {
            color: "#6366f1"
          }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error("Failed to upgrade subscription:", err);
      showAlert("Upgrade Failed", "Subscription upgrade failed. Please try again.", "error");
    }
  };

  const toggleWatchlist = async () => {
    if (togglingWatchlist) return;
    setTogglingWatchlist(true);
    const token = localStorage.getItem("access_token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    try {
      if (inWatchlist) {
        const res = await fetch(`${apiUrl}/api/v1/watchlist/${ticker}`, {
          method: "DELETE",
          headers
        });
        if (res.ok) {
          setInWatchlist(false);
        }
      } else {
        const res = await fetch(`${apiUrl}/api/v1/watchlist/`, {
          method: "POST",
          headers,
          body: JSON.stringify({ ticker })
        });
        if (res.ok) {
          setInWatchlist(true);
        }
      }
    } catch (err) {
      console.error("Failed to toggle watchlist:", err);
    } finally {
      setTogglingWatchlist(false);
    }
  };


  const fetchKundliReport = async () => {
    setLoadingKundliReport(true);
    setRateLimited(false);
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${apiUrl}/api/v1/companies/${ticker}/kundli-report`, { headers });
      if (res.status === 429) {
        setRateLimited(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setKundliReport(data);
      }
    } catch (err) {
      console.error("Error loading Kundli report:", err);
    } finally {
      setLoadingKundliReport(false);
    }
  };

  const fetchFundamentalAnalysis = async () => {
    setLoadingAgent(true);
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${apiUrl}/api/v1/companies/${ticker}/fundamental-analysis`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAgentOutput(data);
      }
    } catch (err) {
      console.error("Error loading agent analysis:", err);
    } finally {
      setLoadingAgent(false);
    }
  };

  const fetchTechnicalAnalysis = async () => {
    setLoadingTechnical(true);
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${apiUrl}/api/v1/companies/${ticker}/technical-analysis`, { headers });
      if (res.ok) {
        const data = await res.json();
        setTechnicalAnalysis(data);
      }
    } catch (err) {
      console.error("Error loading technical analysis:", err);
    } finally {
      setLoadingTechnical(false);
    }
  };

  const fetchTechnicalIndicators = async () => {
    setLoadingTechnicalIndicators(true);
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${apiUrl}/api/v1/companies/${ticker}/technical-indicators`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.data)) {
          data.data = data.data.map((b: any) => ({
            ...b,
            rsi: b.rsi !== undefined && b.rsi !== null ? b.rsi : (b.rsi_14 !== undefined && b.rsi_14 !== null ? b.rsi_14 : null),
            relative_strength: b.relative_strength !== undefined && b.relative_strength !== null ? b.relative_strength : (b.rs_ratio !== undefined && b.rs_ratio !== null ? b.rs_ratio : null),
            volume_spike: b.volume_spike !== undefined ? b.volume_spike : (b.is_volume_spike !== undefined ? b.is_volume_spike : false),
          }));
        }
        setTechnicalIndicators(data);
      }
    } catch (err) {
      console.error("Error loading technical indicators:", err);
    } finally {
      setLoadingTechnicalIndicators(false);
    }
  };

  const fetchNewsData = async () => {
    setLoadingNews(true);
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const headers = { Authorization: `Bearer ${token}` };
      const [newsRes, analysisRes] = await Promise.all([
        fetch(`${apiUrl}/api/v1/companies/${ticker}/news?days=30&limit=50`, { headers }),
        fetch(`${apiUrl}/api/v1/companies/${ticker}/news-analysis`, { headers }),
      ]);
      if (newsRes.ok) {
        const nd = await newsRes.json();
        setNewsData({
          articles: nd.articles || [],
          sentimentBreakdown: nd.sentiment_breakdown || { positive: 0, negative: 0, neutral: 0 },
          sentimentTrend: nd.sentiment_trend || [],
        });
      }
      if (analysisRes.ok) {
        const na = await analysisRes.json();
        setNewsAnalysis(na);
      }
    } catch (err) {
      console.error("Error loading news data:", err);
    } finally {
      setLoadingNews(false);
    }
  };

  // Fetch company data in realtime when not found in DB
  const fetchRealtimeData = async () => {
    const token = localStorage.getItem("access_token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    setRealtimeFetching(true);
    setRealtimeError(null);
    setRealtimeStep(1); // Step 1: Discovering company

    try {
      // Trigger backend to register + enrich via Yahoo Finance
      const fetchRes = await fetch(`${apiUrl}/api/v1/companies/fetch-realtime`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ticker }),
      });

      if (!fetchRes.ok) {
        const errData = await fetchRes.json().catch(() => ({}));
        throw new Error(errData.detail || `Could not fetch data for "${ticker}". Please verify the ticker.`);
      }

      setRealtimeStep(2); // Step 2: Enriching data
      await new Promise((r) => setTimeout(r, 800));

      setRealtimeStep(3); // Step 3: Loading into dashboard
      await new Promise((r) => setTimeout(r, 600));

      // Now poll the profile endpoint until it's ready
      let retries = 0;
      while (retries < 8) {
        const profileRes = await fetch(`${apiUrl}/api/v1/companies/${ticker}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
          setRealtimeStep(4); // Step 4: Finalizing
          await new Promise((r) => setTimeout(r, 500));

          // Load financials and prices
          const [finRes, priceRes] = await Promise.all([
            fetch(`${apiUrl}/api/v1/companies/${ticker}/financials`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${apiUrl}/api/v1/companies/${ticker}/prices`, { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          if (finRes.ok) setFinancials(await finRes.json());
          if (priceRes.ok) setPrices(await priceRes.json());

          // Kick off AI agents in background
          fetchKundliReport();
          fetchFundamentalAnalysis();
          fetchTechnicalAnalysis();
          fetchTechnicalIndicators();
          fetchNewsData();

          // Load user
          fetch(`${apiUrl}/api/v1/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json()).then(setUser).catch(() => {});

          setRealtimeFetching(false);
          return;
        }
        retries++;
        await new Promise((r) => setTimeout(r, 1500));
      }

      throw new Error("Data fetched but profile not available yet. Please refresh the page.");
    } catch (err: any) {
      console.error("[realtime fetch] Error:", err);
      setRealtimeError(err.message || "An unexpected error occurred.");
      setRealtimeFetching(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const headers = { Authorization: `Bearer ${token}` };

    setLoading(true);

    // Fetch profile, financials, price history, and agent analysis in parallel
    Promise.all([
      fetch(`${apiUrl}/api/v1/companies/${ticker}`, { headers }).then((res) => {
        if (!res.ok) throw new Error("Profile not found");
        return res.json();
      }),
      fetch(`${apiUrl}/api/v1/companies/${ticker}/financials`, { headers }).then((res) => {
        if (res.ok) return res.json();
        return null;
      }),
      fetch(`${apiUrl}/api/v1/companies/${ticker}/prices`, { headers }).then((res) => {
        if (res.ok) return res.json();
        return null;
      }),
    ])
      .then(([profileData, finData, priceData]) => {
        setProfile(profileData);
        if (finData) setFinancials(finData);
        if (priceData) setPrices(priceData);
        // Load the agent analysis in the background
        fetchKundliReport();
        fetchFundamentalAnalysis();
        fetchTechnicalAnalysis();
        fetchTechnicalIndicators();
        fetchNewsData();

        // Fetch user profile
        fetch(`${apiUrl}/api/v1/auth/me`, { headers })
          .then((res) => res.json())
          .then((data) => setUser(data))
          .catch((err) => console.error("Error loading user profile:", err));

        // Check if stock is in user's watchlist
        fetch(`${apiUrl}/api/v1/watchlist/`, { headers })
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              const exists = data.some((item: any) => item.company?.ticker === ticker);
              setInWatchlist(exists);
            }
          })
          .catch((err) => console.error("Error loading watchlist state:", err));
      })
      .catch((err) => {
        console.error("Error loading stock details:", err);
        // Company not in DB — trigger real-time ingestion automatically
        setLoading(false);
        fetchRealtimeData();
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-electric-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-gray-400">{t("common.loading") || "Fetching real-time market data..."}</span>
        </div>
      </div>
    );
  }

  // ─── Real-time ingestion loading screen ───────────────────────────────────
  if (realtimeFetching || (!profile && !loading)) {
    const steps = [
      { icon: "🔍", label: "Discovering company on global exchanges" },
      { icon: "📊", label: "Fetching price history & financials" },
      { icon: "🧠", label: "Loading data into dashboard" },
      { icon: "✅", label: "Finalizing your Stock Kundli" },
    ];

    if (realtimeError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-navy-950 p-6">
          <div className="glass-card p-8 max-w-md w-full text-center space-y-5">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 mx-auto">
              <svg className="w-7 h-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white">Could Not Fetch Market Data</h2>
            <p className="text-sm text-gray-400 leading-relaxed">{realtimeError}</p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => { setRealtimeError(null); fetchRealtimeData(); }}
                className="btn-primary px-5 py-2 text-sm"
              >
                Try Again
              </button>
              <Link href="/dashboard" className="px-5 py-2 text-sm rounded-lg bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-navy-950 p-6">
        {/* Ambient glow */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-electric-500/[0.05] blur-[140px]" />
          <div className="absolute bottom-10 right-10 h-[200px] w-[200px] rounded-full bg-emerald-500/[0.04] blur-[100px]" />
        </div>

        <div className="relative z-10 glass-card p-8 max-w-sm w-full space-y-8">
          {/* Logo + Title */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-electric-500 to-electric-600 shadow-lg shadow-electric-500/25">
                <span className="text-base font-bold text-white">K</span>
              </div>
            </div>
            <p className="text-xs font-mono text-electric-400 uppercase tracking-[0.2em]">Real-Time Market Fetch</p>
            <h2 className="text-xl font-bold text-white">
              Fetching{" "}
              <span className="text-electric-400 font-mono">{ticker}</span>
            </h2>
            <p className="text-xs text-gray-500">This ticker isn&apos;t in our database yet. We&apos;re pulling live data from global markets.</p>
          </div>

          {/* Animated progress steps */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const stepNum = index + 1;
              const isActive = realtimeStep === stepNum;
              const isDone = realtimeStep > stepNum;
              const isPending = realtimeStep < stepNum;
              return (
                <div
                  key={stepNum}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
                    isDone
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                      : isActive
                      ? "bg-electric-500/10 border-electric-500/30 text-electric-400"
                      : "bg-white/[0.02] border-white/5 text-gray-600"
                  }`}
                >
                  {isDone ? (
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isActive ? (
                    <svg className="w-4 h-4 animate-spin text-electric-400 shrink-0" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center text-[10px] text-gray-600 shrink-0">{stepNum}</span>
                  )}
                  <span className="text-xs font-medium">{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Pulse bar */}
          <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-electric-500 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min((realtimeStep / 4) * 100, 100)}%` }}
            />
          </div>

          <p className="text-center text-[11px] text-gray-600">
            Powered by Yahoo Finance · This may take up to 30 seconds
          </p>
        </div>
      </div>
    );
  }
  // ──────────────────────────────────────────────────────────────────────────

  // Calculate pricing metrics
  const priceList = prices?.prices || [];
  const latestPrice = priceList[priceList.length - 1];
  const firstPrice = priceList[0];

  const priceChange = latestPrice && firstPrice ? latestPrice.close - firstPrice.close : 0;
  const priceChangePct = latestPrice && firstPrice ? (priceChange / firstPrice.close) * 100 : 0;

  const high52 = priceList.length > 0 ? Math.max(...priceList.map(p => p.high)) : 0;
  const low52 = priceList.length > 0 ? Math.min(...priceList.map(p => p.low)) : 0;

  // Format helpers
  const formatMcap = (mcap: number | null) => {
    if (!mcap) return "—";
    const cr = mcap / 10000000;
    if (cr >= 100) return `₹${(cr / 100).toFixed(2)} L Cr`;
    return `₹${cr.toFixed(0)} Cr`;
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return "—";
    return num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  // Generate SVG path for the chart
  const generateChartPaths = () => {
    if (priceList.length < 2) return { linePath: "", areaPath: "", coordinates: [] };

    const width = 800;
    const height = 300;
    const padding = 15;

    const maxX = priceList.length - 1;

    const closes = priceList.map(p => p.close);
    const minY = Math.min(...closes);
    const maxY = Math.max(...closes);

    const rangeY = maxY - minY || 1;

    const coordinates = priceList.map((p, index) => {
      const x = padding + (index / maxX) * (width - 2 * padding);
      const y = height - padding - ((p.close - minY) / rangeY) * (height - 2 * padding);
      return { x, y, price: p };
    });

    const linePath = coordinates.reduce((path, point, index) => {
      return index === 0 ? `M ${point.x} ${point.y}` : `${path} L ${point.x} ${point.y}`;
    }, "");

    const areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x} ${height - padding} L ${coordinates[0].x} ${height - padding} Z`;

    return { linePath, areaPath, coordinates };
  };

  const { linePath, areaPath, coordinates } = generateChartPaths();

  // Mouse move handler for interactive crosshair
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (coordinates.length === 0) return;

    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const relativeX = (mouseX / svgRect.width) * 800; // Match coordinate space width

    // Find closest point by x coordinate
    let closestIndex = 0;
    let minDiff = Infinity;

    coordinates.forEach((point, index) => {
      const diff = Math.abs(point.x - relativeX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });

    setHoverIndex(closestIndex);
    setHoveredPrice(coordinates[closestIndex].price);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setHoveredPrice(null);
  };

  const getActivePrice = () => {
    return hoveredPrice || latestPrice;
  };

  // Kundli Analysis Score generator based on parsed ratios
  const calculateKundliScore = () => {
    if (agentOutput && agentOutput.score !== undefined) {
      return agentOutput.score;
    }
    const fin = financials?.annual?.[financials.annual.length - 1];
    if (!fin) return 65; // Default safe middle score

    let base = 60;
    if (fin.roce && fin.roce > 20) base += 10;
    if (fin.roe && fin.roe > 15) base += 8;
    if (fin.debt_equity !== null && fin.debt_equity < 0.5) base += 12;
    if (fin.debt_equity !== null && fin.debt_equity > 1.5) base -= 10;
    if (fin.operating_cash_flow && fin.operating_cash_flow > 0) base += 10;

    return Math.min(Math.max(base, 25), 98);
  };

  const kundliScore = kundliReport?.kundli_score || calculateKundliScore();

  return (
    <div className="min-h-screen bg-navy-950 text-white">
      {/* Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 left-20 h-[400px] w-[400px] rounded-full bg-electric-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-gold-500/[0.03] blur-[100px]" />
      </div>

      {/* Top Nav */}
      <nav className="relative z-20 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-electric-500 to-electric-600">
                <span className="text-sm font-bold text-white">K</span>
              </div>
              <span className="text-base font-bold text-white">{t("dashboard.title")}</span>
            </Link>
            <div className="hidden md:block">
              <SearchAutocomplete />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Link href="/dashboard" className="nav-link text-xs">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Breadcrumb & Search for small screens */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-electric-400 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-300 font-mono font-medium">{ticker}</span>
        </div>
        <div className="md:hidden">
          <SearchAutocomplete />
        </div>
      </div>

      {/* Main Stock Profile Section */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-6 space-y-6">

        {/* Profile Card & Realtime Metrics */}
        <div className="glass-card p-6 overflow-hidden relative">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-electric-500/[0.03] blur-3xl" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">{profile.name}</h1>
                <span className="badge-blue font-mono">{profile.ticker}</span>
                <span className="badge-gray font-mono">{profile.exchange}</span>

                <button
                  onClick={toggleWatchlist}
                  disabled={togglingWatchlist}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-300 ${inWatchlist
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/25 hover:bg-rose-500/20"
                      : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10"
                    }`}
                  id="watchlist-toggle-btn"
                >
                  <svg className="h-3.5 w-3.5" fill={inWatchlist ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {inWatchlist ? "Watchlisted" : "Add to Watchlist"}
                </button>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {profile.sector} • {profile.sub_sector} • ISIN: {profile.isin}
              </p>
            </div>

            {/* Price display block */}
            <div className="text-left md:text-right shrink-0">
              <p className="text-xs text-gray-500 font-medium">
                {hoveredPrice ? "HOVERED CLOSE PRICE" : "LATEST CLOSE PRICE"}
              </p>
              <div className="flex items-baseline md:justify-end gap-2 mt-0.5">
                <span className="text-3xl font-mono font-bold">
                  ₹{getActivePrice()?.close?.toFixed(2) || "—"}
                </span>
                <span className={`text-sm font-semibold font-mono ${priceChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)} ({priceChangePct.toFixed(2)}%)
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {hoveredPrice
                  ? `As of ${new Date(hoveredPrice.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                  : latestPrice
                    ? `As of ${new Date(latestPrice.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                    : "—"
                }
              </p>
            </div>
          </div>

          <div className="border-t border-white/5 mt-6 pt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Market Cap</p>
              <p className="text-base font-semibold mt-1 font-mono">{formatMcap(profile.market_cap)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">52-Week High</p>
              <p className="text-base font-semibold mt-1 font-mono text-emerald-400">₹{high52.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">52-Week Low</p>
              <p className="text-base font-semibold mt-1 font-mono text-rose-400">₹{low52.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Volume (Avg)</p>
              <p className="text-base font-semibold mt-1 font-mono">
                {latestPrice ? formatNumber(latestPrice.volume) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabbed Analytical Dashboard */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Main Dashboard Tabs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex border-b border-white/10 gap-6 overflow-x-auto whitespace-nowrap scrollbar-none">
              <button
                onClick={() => setActiveTab("kundli_report")}
                className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all duration-300 ${activeTab === "kundli_report"
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-gray-400 hover:text-white"
                  }`}
              >
                AI Stock Kundli
              </button>
              <button
                onClick={() => setActiveTab("chart")}
                className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all duration-300 ${activeTab === "chart"
                    ? "border-electric-500 text-electric-400"
                    : "border-transparent text-gray-400 hover:text-white"
                  }`}
              >
                Stock Price Chart
              </button>
              <button
                onClick={() => setActiveTab("financials")}
                className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all duration-300 ${activeTab === "financials"
                    ? "border-electric-500 text-electric-400"
                    : "border-transparent text-gray-400 hover:text-white"
                  }`}
              >
                10-Year Financial Statements
              </button>
              <button
                onClick={() => setActiveTab("fundamental")}
                className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all duration-300 ${activeTab === "fundamental"
                    ? "border-electric-500 text-electric-400"
                    : "border-transparent text-gray-400 hover:text-white"
                  }`}
              >
                AI Fundamental Analyst
              </button>
              <button
                onClick={() => setActiveTab("technical")}
                className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all duration-300 ${activeTab === "technical"
                    ? "border-electric-500 text-electric-400"
                    : "border-transparent text-gray-400 hover:text-white"
                  }`}
              >
                AI Technical Analysis
              </button>
              <button
                onClick={() => setActiveTab("news")}
                className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all duration-300 ${activeTab === "news"
                    ? "border-rose-500 text-rose-400"
                    : "border-transparent text-gray-400 hover:text-white"
                  }`}
              >
                AI News Analyst
              </button>
            </div>

            {/* TAB CONTENTS */}
            {activeTab === "chart" && (
              <div className="glass-card p-6 relative">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-md font-semibold text-white">Interactive Daily Candles</h3>
                    <p className="text-xs text-gray-500">Showing historical line chart based on 1-year Yahoo Finance pricing candles</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="badge-blue text-[10px]">1 YEAR</span>
                  </div>
                </div>

                {coordinates.length > 0 ? (
                  <div className="relative">
                    <svg
                      viewBox="0 0 800 300"
                      className="w-full h-auto cursor-crosshair"
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    >
                      <defs>
                        <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="15" y1="75" x2="785" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="15" y1="150" x2="785" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="15" y1="225" x2="785" y2="225" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                      {/* Area Under Path */}
                      <path d={areaPath} fill="url(#chart-area-grad)" />

                      {/* Sparkline Path */}
                      <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />

                      {/* Interactive Crosshair & Indicator dot */}
                      {hoverIndex !== null && coordinates[hoverIndex] && (
                        <>
                          <line
                            x1={coordinates[hoverIndex].x}
                            y1="15"
                            x2={coordinates[hoverIndex].x}
                            y2="285"
                            stroke="rgba(99, 102, 241, 0.4)"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                          />
                          <circle
                            cx={coordinates[hoverIndex].x}
                            cy={coordinates[hoverIndex].y}
                            r="6"
                            fill="#6366f1"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="animate-pulse"
                          />
                        </>
                      )}
                    </svg>
                  </div>
                ) : (
                  <div className="h-60 flex items-center justify-center text-sm text-gray-500">
                    No historical prices available for this company.
                  </div>
                )}
              </div>
            )}

            {activeTab === "financials" && financials && (
              <FinancialVisualizer financials={financials} />
            )}

            {activeTab === "kundli_report" && (
              <div className="space-y-6">
                {rateLimited ? (
                  <div className="glass-card p-8 border border-indigo-500/30 bg-indigo-950/20 relative overflow-hidden rounded-2xl text-center">
                    <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto mb-4">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">LIMIT REACHED</span>
                    <h3 className="text-xl font-bold text-white">Daily AI Kundli Report Limit Reached</h3>
                    <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto leading-relaxed">
                      You have reached the daily consensus report generation limit on the Free Plan.
                      Upgrade to the <span className="font-semibold text-white">Starter Plan</span> to unlock 20 premium AI Stock Kundli reports per day, deep consensus metrics, and priority real-time stock alerts.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <span className="text-2xl font-extrabold text-white font-mono">₹299</span>
                      <span className="text-xs text-gray-500">/ month</span>
                    </div>
                    <button
                      onClick={handleUpgrade}
                      className="mt-4 px-8 py-3 bg-gradient-to-r from-indigo-500 to-electric-500 text-white font-bold rounded-xl text-xs hover:from-indigo-600 hover:to-electric-600 transition shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transform duration-200"
                      id="upgrade-rate-limit-btn"
                    >
                      Upgrade Instantly via Razorpay Sandbox
                    </button>
                  </div>
                ) : loadingKundliReport && !kundliReport ? (
                  <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-12 w-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                    <h3 className="text-md font-semibold text-white">Aggregating AI Stock Kundli Report...</h3>
                    <p className="text-xs text-gray-500 max-w-sm">
                      Running consensus engine across fundamental health, technical indicators, and news sentiment trackers. Please wait...
                    </p>
                  </div>
                ) : !kundliReport ? (
                  <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <p className="text-xs text-gray-400">Kundli Report could not be loaded for {profile?.name || ticker}.</p>
                    <button
                      onClick={fetchKundliReport}
                      className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition"
                    >
                      Trigger Consensus Report
                    </button>
                  </div>
                ) : (
                  <KundliReportVisualizer report={kundliReport} />
                )}
              </div>
            )}

            {activeTab === "fundamental" && (
              <div className="space-y-6">
                {/* Loader or Stale Agent fallback state */}
                {loadingAgent && !agentOutput ? (
                  <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-12 w-12 rounded-full border-4 border-electric-500/20 border-t-electric-500 animate-spin" />
                    <h3 className="text-md font-semibold text-white">AI Kundli Analyst Engine Active...</h3>
                    <p className="text-xs text-gray-500 max-w-sm">
                      Running multi-period 10-year financials calculations, capital structure analysis, and generating detailed Hinglish investment thesis via DeepSeek. Please wait...
                    </p>
                  </div>
                ) : !agentOutput ? (
                  <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <p className="text-xs text-gray-400">AI analysis is not yet generated for {profile?.name || ticker}.</p>
                    <button
                      onClick={fetchFundamentalAnalysis}
                      className="rounded-lg bg-electric-500 px-4 py-2 text-xs font-semibold text-white hover:bg-electric-600 transition"
                    >
                      Trigger AI Analysis Now
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Gauge & Metrics Overview Card */}
                    <div className="glass-card p-6 grid gap-6 md:grid-cols-3 items-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-electric-500/[0.03] to-gold-500/[0.03]" />

                      {/* Big circle rating gauge */}
                      <div className="flex flex-col items-center justify-center relative z-10 md:border-r border-white/5 py-4">
                        <div className="relative flex items-center justify-center h-32 w-32">
                          <svg className="h-full w-full transform -rotate-90">
                            <circle
                              cx="64"
                              cy="64"
                              r="54"
                              fill="transparent"
                              stroke="rgba(255,255,255,0.05)"
                              strokeWidth="8"
                            />
                            <circle
                              cx="64"
                              cy="64"
                              r="54"
                              fill="transparent"
                              stroke={agentOutput.score >= 75 ? "#10b981" : agentOutput.score >= 50 ? "#f59e0b" : "#f43f5e"}
                              strokeWidth="8"
                              strokeDasharray={2 * Math.PI * 54}
                              strokeDashoffset={2 * Math.PI * 54 * (1 - agentOutput.score / 100)}
                              strokeLinecap="round"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-3xl font-extrabold font-mono text-white">{agentOutput.score}</span>
                            <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400">Score</span>
                          </div>
                        </div>
                        <span className={`mt-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${agentOutput.score >= 75 ? "bg-emerald-500/10 text-emerald-400" :
                            agentOutput.score >= 50 ? "bg-gold-500/10 text-gold-400" : "bg-rose-500/10 text-rose-400"
                          }`}>
                          {agentOutput.score >= 75 ? "EXCELLENT" : agentOutput.score >= 50 ? "MODERATE" : "HIGH CAUTION"}
                        </span>
                      </div>

                      {/* Detail Metrics list */}
                      <div className="md:col-span-2 space-y-4 relative z-10">
                        <div>
                          <span className="text-xs text-gray-500">Fundamental Trend</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-md font-bold uppercase tracking-wide ${agentOutput.trend === "rising" || agentOutput.trend === "bullish" ? "text-emerald-400" :
                                agentOutput.trend === "declining" || agentOutput.trend === "bearish" ? "text-rose-400" : "text-gold-400"
                              }`}>
                              {agentOutput.trend}
                            </span>
                            <svg className={`h-5 w-5 ${agentOutput.trend === "rising" || agentOutput.trend === "bullish" ? "text-emerald-400" :
                                agentOutput.trend === "declining" || agentOutput.trend === "bearish" ? "text-rose-400" : "text-gold-400"
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {agentOutput.trend === "rising" || agentOutput.trend === "bullish" ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              ) : agentOutput.trend === "declining" || agentOutput.trend === "bearish" ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                              )}
                            </svg>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-gray-500 block">Agent Confidence</span>
                            <span className="text-sm font-semibold font-mono text-white">{agentOutput.confidence}%</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 block">Report Generated</span>
                            <span className="text-sm font-semibold text-white">
                              {new Date(agentOutput.updated_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Concerns Splits */}
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Strengths */}
                      <div className="glass-card p-6 border-emerald-500/10 bg-emerald-500/[0.01]">
                        <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider mb-4">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Key Strengths (Mazaas)
                        </h4>
                        <ul className="space-y-3">
                          {agentOutput.strengths?.map((str, idx) => (
                            <li key={idx} className="flex gap-2.5 items-start text-xs text-gray-300 leading-relaxed font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                              {str}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Concerns */}
                      <div className="glass-card p-6 border-rose-500/10 bg-rose-500/[0.01]">
                        <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider mb-4">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Major Concerns (Khatras)
                        </h4>
                        <ul className="space-y-3">
                          {agentOutput.concerns?.map((con, idx) => (
                            <li key={idx} className="flex gap-2.5 items-start text-xs text-gray-300 leading-relaxed font-medium">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Detailed Analysis Reasoning Thesis */}
                    <KundliThesis reasoning={agentOutput.reasoning} />
                  </>
                )}
              </div>
            )}

            {activeTab === "technical" && (
              <div className="space-y-6">
                {/* Loader or Stale Agent fallback state */}
                {loadingTechnicalIndicators && !technicalIndicators ? (
                  <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-12 w-12 rounded-full border-4 border-electric-500/20 border-t-electric-500 animate-spin" />
                    <h3 className="text-md font-semibold text-white">Calculating Technical Indicators...</h3>
                    <p className="text-xs text-gray-500 max-w-sm">
                      Running EMA, SMA, VWAP, Bollinger Bands, RSI, MACD, and Relative Strength indicators in a real-time pandas-ta engine. Please wait...
                    </p>
                  </div>
                ) : !technicalIndicators ? (
                  <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <p className="text-xs text-gray-400">Technical indicators could not be calculated.</p>
                    <button
                      onClick={fetchTechnicalIndicators}
                      className="rounded-lg bg-electric-500 px-4 py-2 text-xs font-semibold text-white hover:bg-electric-600 transition"
                    >
                      Retry Calculation
                    </button>
                  </div>
                ) : (
                  <TechnicalVisualizer indicators={technicalIndicators} />
                )}

                {loadingTechnical && !technicalAnalysis ? (
                  <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-12 w-12 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                    <h3 className="text-md font-semibold text-white">AI Technical Analyst Engine Active...</h3>
                    <p className="text-xs text-gray-500 max-w-sm">
                      Analyzing trendlines, support/resistance clusters, candlestick patterns, and generating technical thesis. Please wait...
                    </p>
                  </div>
                ) : !technicalAnalysis ? (
                  <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <p className="text-xs text-gray-400">AI Technical Analysis is not yet generated for {profile?.name || ticker}.</p>
                    <button
                      onClick={fetchTechnicalAnalysis}
                      className="rounded-lg bg-purple-500 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-600 transition"
                    >
                      Trigger AI Technical Analysis Now
                    </button>
                  </div>
                ) : (
                  <TechnicalThesis reasoning={technicalAnalysis.reasoning} />
                )}
              </div>
            )}

            {/* ── NEWS TAB ──────────────────────────────────────────── */}
            {activeTab === "news" && (
              <div className="space-y-6">
                {loadingNews && !newsData ? (
                  <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-12 w-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
                    <h3 className="text-md font-semibold text-white">News Analyst Engine Active...</h3>
                    <p className="text-xs text-gray-500 max-w-sm">
                      Fetching and classifying news from Economic Times, Mint, BSE, NSE, and Yahoo Finance. Running sentiment analysis...
                    </p>
                  </div>
                ) : !newsData ? (
                  <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
                    <p className="text-xs text-gray-400">Could not load news for {profile?.name || ticker}.</p>
                    <button
                      onClick={fetchNewsData}
                      className="rounded-lg bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition"
                    >
                      Retry News Load
                    </button>
                  </div>
                ) : (
                  <NewsVisualizer
                    ticker={ticker}
                    articles={newsData.articles as Parameters<typeof NewsVisualizer>[0]["articles"]}
                    sentimentBreakdown={newsData.sentimentBreakdown as { positive: number; negative: number; neutral: number }}
                    sentimentTrend={newsData.sentimentTrend as Parameters<typeof NewsVisualizer>[0]["sentimentTrend"]}
                    newsAnalysis={newsAnalysis as Parameters<typeof NewsVisualizer>[0]["newsAnalysis"]}
                  />
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar - AI Kundli score panel & SEBI Disclaimers */}
          <div className="space-y-6">

            {/* Gauge Panel Box */}
            {activeTab === "technical" ? (
              <TechnicalGauge
                score={technicalAnalysis?.score || 72}
                trend={technicalAnalysis?.trend || "Neutral"}
                patterns={
                  (technicalAnalysis as any)?.metadata?.patterns ||
                  (technicalAnalysis as any)?.patterns ||
                  []
                }
                supports={technicalIndicators?.support_levels || []}
                resistances={technicalIndicators?.resistance_levels || []}
                stopLossZone={technicalIndicators?.stop_loss_zone || []}
                rsi={
                  technicalIndicators?.data && technicalIndicators.data.length > 0
                    ? technicalIndicators.data[technicalIndicators.data.length - 1].rsi
                    : null
                }
                macdSignal={
                  technicalIndicators?.data && technicalIndicators.data.length > 0
                    ? (() => {
                      const last = technicalIndicators.data[technicalIndicators.data.length - 1];
                      if (last.macd_hist !== null) {
                        return last.macd_hist >= 0 ? "Bullish Crossover" : "Bearish Momentum";
                      }
                      return "Neutral";
                    })()
                    : "Neutral"
                }
              />
            ) : (
              <KundliGauge
                score={kundliScore}
                roce={financials?.annual?.[financials.annual.length - 1]?.roce}
                debtEquity={financials?.annual?.[financials.annual.length - 1]?.debt_equity}
              />
            )}

            {/* SEBI Compliance Warnings and Disclaimers */}
            <div className="glass-card p-5 border-rose-500/15 bg-rose-500/[0.01]">
              <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider mb-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                SEBI compliance disclaimer
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Investment in securities market are subject to market risks. Read all the related documents carefully before investing. Registration granted by SEBI, membership of BASL and certification from NISM in no way guarantee performance of the intermediary or provide any assurance of returns to investors.
              </p>
            </div>

          </div>
        </div>

      </main>
      <AlertModal
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
      />
    </div>
  );
}

