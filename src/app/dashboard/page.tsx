"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../context/LanguageContext";
import LanguageSelector from "../../components/LanguageSelector";
import SearchAutocomplete from "../../components/SearchAutocomplete";

/* ═══════════════════════════════════════════════════════════
   AI Stock Kundli — Dashboard (Protected)
   ═══════════════════════════════════════════════════════════ */

interface User {
  id: number;
  email: string;
  full_name: string | null;
  plan: string;
  is_verified: boolean;
  created_at: string;
}

const WATCHLIST_MOCK = [
  { ticker: "RELIANCE", name: "Reliance Industries", signal: "Strong Buy", score: 84, color: "text-emerald-400", badge: "badge-green" },
  { ticker: "TCS", name: "Tata Consultancy Services", signal: "Buy", score: 72, color: "text-emerald-400", badge: "badge-green" },
  { ticker: "HDFCBANK", name: "HDFC Bank Ltd", signal: "Strong Buy", score: 88, color: "text-emerald-400", badge: "badge-green" },
  { ticker: "INFY", name: "Infosys Ltd", signal: "Neutral", score: 55, color: "text-gold-400", badge: "badge-gold" },
  { ticker: "ITC", name: "ITC Ltd", signal: "Buy", score: 68, color: "text-emerald-400", badge: "badge-green" },
  { ticker: "TATAMOTORS", name: "Tata Motors Ltd", signal: "Caution", score: 38, color: "text-rose-400", badge: "badge-red" },
];

const ALERTS_MOCK = [
  { time: "2 min ago", text: "RELIANCE crossed above 200 DMA with volume confirmation", type: "bullish" },
  { time: "15 min ago", text: "ITC quarterly results beat analyst estimates by 12%", type: "news" },
  { time: "1 hr ago", text: "TATAMOTORS promoter pledge increased to 35%", type: "risk" },
  { time: "3 hr ago", text: "HDFCBANK sentiment score improved +18 points in 24h", type: "bullish" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);

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

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    setLoading(true);

    // Fetch user details
    fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        
        // Fetch Watchlist
        setLoadingWatchlist(true);
        return fetch(`${apiUrl}/api/v1/watchlist/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) => {
        if (res && res.ok) return res.json();
        return [];
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setWatchlist(data);
        }
      })
      .catch((err) => {
        console.error("Dashboard init error:", err);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/login");
      })
      .finally(() => {
        setLoading(false);
        setLoadingWatchlist(false);
      });
  }, [router]);

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
          const updatedUser = await upgradeRes.json();
          setUser(prev => prev ? { ...prev, plan: "starter" } : null);
          alert("🎉 Sandbox Upgrade Successful! Your plan is now upgraded to 'Starter'.");
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
            alert("Payment successful! Refreshing subscription status.");
            const userRes = await fetch(`${apiUrl}/api/v1/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (userRes.ok) {
              const data = await userRes.json();
              setUser(data);
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
      alert("Subscription upgrade failed. Please try again.");
    }
  };

  const handleSandboxReset = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const res = await fetch(`${apiUrl}/api/v1/subscriptions/sandbox-upgrade`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ plan: "free" })
      });
      
      if (res.ok) {
        setUser(prev => prev ? { ...prev, plan: "free" } : null);
        alert("🔄 Plan reset to 'Free' for testing rate limits.");
      }
    } catch (err) {
      console.error("Failed to reset plan:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/");
  };

  const getGreetingKey = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "dashboard.goodMorning";
    if (hr < 17) return "dashboard.goodAfternoon";
    return "dashboard.goodEvening";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-8 w-8 animate-spin text-electric-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-gray-400">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ── Ambient Glow ────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 left-20 h-[400px] w-[400px] rounded-full bg-electric-500/[0.05] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-gold-500/[0.04] blur-[100px]" />
      </div>

      {/* ── Top Nav ─────────────────────────────────────── */}
      <nav className="relative z-20 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
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
            <span className="badge-blue">{user?.plan?.toUpperCase()} PLAN</span>
            <span className="text-sm text-gray-400">{user?.full_name || user?.email}</span>
            <LanguageSelector />
            <button onClick={handleLogout} className="nav-link text-xs hover:text-rose-400">
              {t("common.logout")}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main Content ────────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {/* Welcome Banner */}
        <div className="glass-card glow-border mb-8 overflow-hidden p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-electric-500/5 via-transparent to-gold-500/5" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {t(getGreetingKey())},{" "}
                <span className="gradient-text">{user?.full_name?.split(" ")[0] || "Investor"}</span>
              </h1>
              <p className="mt-1 text-gray-400">
                {t("dashboard.pulseText")}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400"></span>
              </span>
              <span className="text-sm text-emerald-400 font-medium">{t("dashboard.marketsOpen")}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── Watchlist (2 cols) ───────────────────────── */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{t("dashboard.watchlist")}</h2>
              <span className="text-xs text-gray-500">{watchlist.length} stocks</span>
            </div>
            
            {loadingWatchlist ? (
              <div className="glass-card p-12 text-center text-gray-500">
                <svg className="mx-auto h-6 w-6 animate-spin text-electric-400 mb-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Loading watchlist...</span>
              </div>
            ) : watchlist.length === 0 ? (
              <div className="glass-card p-12 text-center border border-dashed border-white/10 rounded-2xl">
                <svg className="mx-auto h-10 w-10 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-300">Your watchlist is empty</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Search for companies like HDFCBANK or RELIANCE above and click &quot;Add to Watchlist&quot; to track them here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {watchlist.map((item) => {
                  const score = item.latest_score || 70;
                  const signal = item.latest_signal || "Buy";
                  const badgeClass =
                    score >= 80
                      ? "badge-green"
                      : score >= 65
                      ? "badge-blue"
                      : score >= 45
                      ? "badge-gold"
                      : "badge-red";

                  return (
                    <div
                      key={item.company.ticker}
                      onClick={() => router.push(`/dashboard/stocks/${item.company.ticker}`)}
                      className="glass-card-hover flex items-center justify-between p-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-electric-500/10 font-mono text-xs font-bold text-electric-400">
                          {item.company.ticker.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{item.company.ticker}</p>
                          <p className="text-xs text-gray-400">{item.company.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Score Bar */}
                        <div className="hidden sm:flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                score >= 75
                                  ? "bg-emerald-400"
                                  : score >= 50
                                  ? "bg-gold-400"
                                  : "bg-rose-400"
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-gray-400">{score}</span>
                        </div>
                        <span className={badgeClass}>{signal}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Alerts Sidebar ───────────────────────────── */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{t("dashboard.recentAlerts")}</h2>
              <span className="badge-blue text-[10px]">LIVE</span>
            </div>
            <div className="space-y-3">
              {ALERTS_MOCK.map((alert, idx) => (
                <div key={idx} className="glass-card p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                        alert.type === "bullish"
                          ? "bg-emerald-400"
                          : alert.type === "risk"
                          ? "bg-rose-400"
                          : "bg-gold-400"
                      }`}
                    />
                    <div>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {alert.text}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">{alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Premium Billing Section */}
            {user?.plan?.toLowerCase() === "free" && (
              <div className="mt-6 glass-card p-5 border border-indigo-500/20 bg-indigo-500/[0.02] relative overflow-hidden rounded-2xl">
                <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl" />
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">RECOMMENDED</span>
                <h4 className="text-md font-bold text-white flex items-center gap-1.5">
                  ✨ Upgrade to Starter Plan
                </h4>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Unlock 20 premium stock analyses per day, deep AI aggregations, and technical alerts.
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-xl font-extrabold text-white font-mono">₹299</span>
                  <span className="text-xs text-gray-500">/ month</span>
                </div>
                <button
                  onClick={handleUpgrade}
                  className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-electric-500 text-white font-semibold py-2 px-4 rounded-xl text-xs hover:from-indigo-600 hover:to-electric-600 transition shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20"
                  id="checkout-upgrade-btn"
                >
                  Subscribe Now
                </button>
              </div>
            )}

            {/* Quick Stats */}
            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-400">{t("dashboard.account")}</h3>
                {user?.plan?.toLowerCase() !== "free" && (
                  <button
                    onClick={handleSandboxReset}
                    className="text-[10px] text-gray-500 hover:text-rose-400 transition"
                  >
                    Reset Plan (Dev Sandbox)
                  </button>
                )}
              </div>
              <div className="glass-card p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-semibold text-white capitalize flex items-center gap-1">
                    {user?.plan === "starter" ? "✨ " : ""}{user?.plan}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("dashboard.kundlisToday")}</span>
                  <span className="font-mono text-white">
                    0 / {user?.plan?.toLowerCase() === "free" ? "3" : user?.plan?.toLowerCase() === "starter" ? "20" : "Unlimited"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("dashboard.memberSince")}</span>
                  <span className="text-white">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
