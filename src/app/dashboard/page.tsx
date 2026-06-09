"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../context/LanguageContext";
import Header from "../../components/common/Header";
import Spinner from "../../components/common/Spinner";
import { useBranding } from "../../context/BrandingContext";
import AlertModal from "../../components/common/AlertModal";

/* ═══════════════════════════════════════════════════════════
   AI Stock Kundli — Dashboard (Protected)
   ═══════════════════════════════════════════════════════════ */

interface User {
  id: number;
  email: string;
  full_name: string | null;
  plan: string;
  is_verified: boolean;
  role?: string;
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

const formatRelativeTime = (dateStr: string) => {
  try {
    let date: Date;
    if (dateStr.includes(" ")) {
      date = new Date(dateStr.replace(" ", "T") + "Z");
    } else {
      date = new Date(dateStr);
    }
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return "just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr} hr ago`;
    return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
  } catch (err) {
    return dateStr;
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { branding: appBranding } = useBranding();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [kundliUsed, setKundliUsed] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "alert" } | null>(null);

  // Custom alert modal states
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
        
        // Fetch Watchlist in parallel with alerts
        setLoadingWatchlist(true);
        const fetchWatchlistPromise = fetch(`${apiUrl}/api/v1/watchlist/`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res && res.ok ? res.json() : []);

        // Fetch Alerts
        setLoadingAlerts(true);
        const fetchAlertsPromise = fetch(`${apiUrl}/api/v1/alerts/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res && res.ok ? res.json() : { alerts: [] });

        // Fetch today's Kundli usage count
        const fetchUsagePromise = fetch(`${apiUrl}/api/v1/auth/me/usage`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res && res.ok ? res.json() : { used: 0 });

        return Promise.all([fetchWatchlistPromise, fetchAlertsPromise, fetchUsagePromise]);
      })
      .then(([watchlistData, alertsData, usageData]) => {
        if (Array.isArray(watchlistData)) {
          setWatchlist(watchlistData);
        }
        if (alertsData && Array.isArray(alertsData.alerts)) {
          setAlerts(alertsData.alerts);
        }
        if (usageData && typeof usageData.used === "number") {
          setKundliUsed(usageData.used);
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
        setLoadingAlerts(false);
      });
  }, [router]);

  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem("access_token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const wsProto = apiUrl.startsWith("https") ? "wss" : "ws";
    const wsUrl = `${wsProto}://${apiUrl.replace(/^https?:\/\//, "")}/api/v1/alerts/ws/${user.id}`;
    
    let ws: WebSocket;
    let reconnectTimeout: any;

    const connectWebSocket = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("Dashboard Alerts WebSocket connected.");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === "alert_triggered") {
            // Add a beautiful toast notification
            setToast({
              message: `${payload.title}: ${payload.message}`,
              type: "alert"
            });
            // Auto hide toast after 6 seconds
            setTimeout(() => setToast(null), 6000);

            // Add the new alert to state
            setAlerts((prev) => [
              {
                id: Date.now(),
                ticker: payload.ticker,
                company_name: payload.ticker,
                title: payload.title,
                message: payload.message,
                severity: payload.severity || "info",
                channel: "push",
                delivered_at: payload.timestamp || new Date().toISOString()
              },
              ...prev
            ]);
          }
        } catch (err) {
          console.warn("Dashboard WebSocket parse error:", err);
        }
      };

      ws.onclose = () => {
        console.log("Dashboard Alerts WebSocket disconnected. Reconnecting in 5s...");
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (err) => {
        console.error("Dashboard WebSocket error:", err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [user?.id]);

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
            showAlert("Payment Successful", "Payment successful! Refreshing subscription status.", "success");
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
      showAlert("Upgrade Failed", "Subscription upgrade failed. Please try again.", "error");
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
        showAlert("Plan Reset", "🔄 Plan reset to 'Free' for testing rate limits.", "info");
      }
    } catch (err) {
      console.error("Failed to reset plan:", err);
    }
  };

  const handleSandboxUpgradeAdvisor = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const res = await fetch(`${apiUrl}/api/v1/subscriptions/sandbox-upgrade`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ plan: "advisor" })
      });
      
      if (res.ok) {
        setUser(prev => prev ? { ...prev, plan: "advisor" } : null);
        showAlert("Upgrade Successful", "🎉 Sandbox Upgrade Successful! Your plan is now upgraded to 'Advisor'.", "success");
      }
    } catch (err) {
      console.error("Failed to upgrade to advisor:", err);
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
        <Spinner size="h-8 w-8" color="text-electric-400" label={t("common.loading")} />
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

        {/* Portfolio Advisor Premium Invite Banner */}
        <div 
          onClick={() => router.push("/dashboard/portfolio")}
          className="glass-card glow-border-teal mb-8 overflow-hidden p-6 relative group cursor-pointer border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300 shadow-xl shadow-emerald-950/5"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-teal-500/5" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </span>
              <div>
                <h4 className="text-md font-bold text-white flex items-center gap-2">
                  💼 AI Portfolio Wealth Advisor
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">Multi-Agent</span>
                </h4>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
                  Run asset diversification analytics, construct standard stock-fit matrices, compute Pearson return correlations, and receive direct wealth planning reports.
                </p>
              </div>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 rounded-xl text-xs font-semibold text-white tracking-wide transition flex items-center gap-1 shrink-0">
              Analyze Portfolio
              <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
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
              <div className="glass-card p-12 flex items-center justify-center">
                <Spinner size="h-6 w-6" color="text-electric-400" label="Loading watchlist..." />
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
              {loadingAlerts ? (
                <div className="flex justify-center py-8">
                  <Spinner size="h-6 w-6" color="text-indigo-400" label="" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="glass-card p-6 text-center">
                  <p className="text-xs text-gray-500">No recent alerts found.</p>
                  <p className="text-[10px] text-gray-600 mt-1">Configured alert rules will trigger notifications here.</p>
                </div>
              ) : (
                alerts.map((alert, idx) => (
                  <div key={alert.id || idx} className="glass-card p-4 border border-white/5 hover:border-white/10 transition duration-300">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          alert.severity === "critical" || alert.severity === "risk"
                            ? "bg-rose-400"
                            : alert.severity === "high"
                            ? "bg-gold-400"
                            : alert.severity === "medium" || alert.severity === "bullish"
                            ? "bg-emerald-400"
                            : "bg-indigo-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">{alert.ticker}</span>
                          <span className="text-[9px] text-gray-500 uppercase tracking-widest">{alert.severity}</span>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-gray-200 leading-relaxed">
                          {alert.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400 leading-relaxed">
                          {alert.message}
                        </p>
                        <p className="mt-2 text-[10px] text-gray-600 font-mono">{formatRelativeTime(alert.delivered_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-sm font-medium text-gray-400">{t("dashboard.account")}</h3>
                <div className="flex flex-col gap-1.5 items-end">
                  {user?.plan?.toLowerCase() !== "free" && (
                    <button
                      onClick={handleSandboxReset}
                      className="text-[10px] text-gray-500 hover:text-rose-400 transition"
                    >
                      Reset Plan (Dev Sandbox)
                    </button>
                  )}
                  {user?.plan?.toLowerCase() !== "advisor" && (
                    <button
                      onClick={handleSandboxUpgradeAdvisor}
                      className="text-[10px] text-emerald-500 hover:text-emerald-400 font-semibold transition"
                    >
                      Upgrade to Advisor (Dev Sandbox)
                    </button>
                  )}
                </div>
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
                    {kundliUsed} / {user?.plan?.toLowerCase() === "free" ? "3" : user?.plan?.toLowerCase() === "starter" ? "20" : "Unlimited"}
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

      {/* Glassmorphic Real-Time Push Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 max-w-md ${
          toast.type === "error"
            ? "border-rose-500/40 bg-rose-950/70 text-rose-200 shadow-rose-500/10"
            : toast.type === "alert"
            ? "border-amber-500/40 bg-amber-950/70 text-amber-200 shadow-amber-500/10"
            : "border-emerald-500/40 bg-emerald-950/70 text-emerald-200 shadow-emerald-500/10"
        }`}>
          <div className="flex items-start gap-3">
            <span className="text-lg">🔔</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold tracking-wide leading-relaxed block">{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white text-xs font-mono ml-2">&times;</button>
          </div>
        </div>
      )}

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
