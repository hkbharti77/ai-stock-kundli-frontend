"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../../context/LanguageContext";
import LanguageSelector from "../../../components/common/LanguageSelector";
import Spinner from "../../../components/common/Spinner";
import {
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface User {
  id: number;
  email: string;
  full_name: string | null;
  plan: string;
  is_verified: boolean;
  created_at: string;
}

interface APIKey {
  id: string;
  name: string;
  prefix: string;
  rate_limit_tier: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}

interface WebhookSubscription {
  id: string;
  url: string;
  secret: string;
  tickers: string[] | null;
  is_active: boolean;
  created_at: string;
}

interface DailyVolume {
  date: string;
  count: number;
}

interface DailyCost {
  date: string;
  cost: number;
}

interface StatusDistribution {
  status: string;
  count: number;
}

interface UsageTelemetry {
  total_calls: number;
  total_cost_inr: number;
  daily_volume: DailyVolume[];
  daily_cost: DailyCost[];
  status_codes: StatusDistribution[];
}

export default function DeveloperPortal() {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [revealKey, setRevealKey] = useState<string | null>(null);

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookTickers, setNewWebhookTickers] = useState("");
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [revealWebhookSecret, setRevealWebhookSecret] = useState<Record<string, boolean>>({});

  // Telemetry state
  const [telemetry, setTelemetry] = useState<UsageTelemetry | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [timeframeDays, setTimeframeDays] = useState(30);

  // Alerts & Messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoadingUser(true);
    fetch(`${getApiUrl()}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setUser(data);
        fetchAllData(token);
      })
      .catch((err) => {
        console.error("Developer page authentication failure:", err);
        localStorage.removeItem("access_token");
        router.push("/login");
      })
      .finally(() => {
        setLoadingUser(false);
      });
  }, [router]);

  const fetchAllData = (token: string) => {
    fetchApiKeys(token);
    fetchWebhooks(token);
    fetchTelemetry(token, timeframeDays);
  };

  const fetchApiKeys = async (token: string) => {
    setLoadingKeys(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/developer/keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data);
      }
    } catch (err) {
      console.error("Error fetching API keys:", err);
    } finally {
      setLoadingKeys(false);
    }
  };

  const fetchWebhooks = async (token: string) => {
    setLoadingWebhooks(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/developer/webhooks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data);
      }
    } catch (err) {
      console.error("Error fetching webhooks:", err);
    } finally {
      setLoadingWebhooks(false);
    }
  };

  const fetchTelemetry = async (token: string, days: number) => {
    setLoadingTelemetry(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/developer/usage?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (err) {
      console.error("Error fetching usage telemetry:", err);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token && user) {
      fetchTelemetry(token, timeframeDays);
    }
  }, [timeframeDays]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/");
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setRevealKey(null);

    if (!newKeyName.trim()) {
      setErrorMsg("Please enter a descriptive friendly name for the key.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) return;

    setGeneratingKey(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/developer/keys`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to generate API Key.");
      }

      const data = await res.json();
      setRevealKey(data.plain_key);
      setNewKeyName("");
      setSuccessMsg("API Key generated successfully! Make sure to copy it now. You won't be able to see it again.");
      fetchApiKeys(token);
    } catch (err: any) {
      setErrorMsg(err.message || "Error generating API Key.");
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRotateKey = async (keyId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setRevealKey(null);

    const token = localStorage.getItem("access_token");
    if (!token) return;

    if (!confirm("Are you sure you want to rotate this key? The previous key will be immediately revoked.")) {
      return;
    }

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/developer/keys/${keyId}/rotate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to rotate API Key.");
      }

      const data = await res.json();
      setRevealKey(data.plain_key);
      setSuccessMsg("API Key rotated successfully! Make sure to copy the new key now. The old key prefix has been revoked.");
      fetchApiKeys(token);
    } catch (err: any) {
      setErrorMsg(err.message || "Error rotating API Key.");
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const token = localStorage.getItem("access_token");
    if (!token) return;

    if (!confirm("Are you sure you want to revoke this key? All active services using it will fail to authenticate.")) {
      return;
    }

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/developer/keys/${keyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to revoke API Key.");
      }

      setSuccessMsg("API Key successfully revoked.");
      fetchApiKeys(token);
    } catch (err: any) {
      setErrorMsg(err.message || "Error revoking API Key.");
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newWebhookUrl.trim()) {
      setErrorMsg("Please enter a valid target payload URL.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) return;

    setCreatingWebhook(true);
    try {
      const tickerArray = newWebhookTickers
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter((t) => t.length > 0);

      const res = await fetch(`${getApiUrl()}/api/v1/developer/webhooks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: newWebhookUrl,
          tickers: tickerArray.length > 0 ? tickerArray : null,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create Webhook subscription.");
      }

      setNewWebhookUrl("");
      setNewWebhookTickers("");
      setSuccessMsg("Webhook subscription registered successfully.");
      fetchWebhooks(token);
    } catch (err: any) {
      setErrorMsg(err.message || "Error creating Webhook.");
    } finally {
      setCreatingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const token = localStorage.getItem("access_token");
    if (!token) return;

    if (!confirm("Are you sure you want to delete this webhook subscription?")) {
      return;
    }

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/developer/webhooks/${webhookId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to delete webhook.");
      }

      setSuccessMsg("Webhook subscription deleted successfully.");
      fetchWebhooks(token);
    } catch (err: any) {
      setErrorMsg(err.message || "Error deleting webhook.");
    }
  };

  const toggleRevealSecret = (id: string) => {
    setRevealWebhookSecret((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  // Setup donut chart colors
  const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"];

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="h-8 w-8" color="text-electric-400" label="Loading portal state..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noise pb-12">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 left-20 h-[500px] w-[500px] rounded-full bg-electric-500/[0.04] blur-[150px]" />
        <div className="absolute bottom-10 right-10 h-[400px] w-[400px] rounded-full bg-indigo-500/[0.03] blur-[120px]" />
      </div>

      {/* Top Navbar */}
      <nav className="relative z-20 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-electric-500 to-electric-600">
                <span className="text-sm font-bold text-white">K</span>
              </div>
              <span className="text-base font-bold text-white">{t("dashboard.title")}</span>
            </Link>
            <Link href="/dashboard" className="text-xs font-semibold text-gray-300 hover:text-white transition pl-4 border-l border-white/10 hidden md:block">
              🏠 Dashboard Home
            </Link>
            <Link href="/dashboard/portfolio" className="text-xs font-semibold text-gray-300 hover:text-white transition pl-4 border-l border-white/10 hidden md:block">
              💼 AI Portfolio Advisor
            </Link>
            <Link href="/dashboard/backtest" className="text-xs font-semibold text-gray-300 hover:text-white transition pl-4 border-l border-white/10 hidden md:block">
              📈 Historical Backtester
            </Link>
            <Link href="/dashboard/developer" className="text-xs font-semibold text-electric-400 hover:text-electric-300 transition pl-4 border-l border-white/10 hidden md:block">
              ⚡ Developer Portal
            </Link>
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

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl flex items-center gap-3">
              ⚡ <span className="gradient-text">Developer Infrastructure</span>
            </h1>
            <p className="mt-2 text-sm text-gray-400 max-w-2xl leading-relaxed">
              Provision API access keys, configure real-time webhook signaling callbacks for consensus rating changes, and trace consumption logs.
            </p>
          </div>

          {/* Timeframe Select */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Metrics window:</span>
            <select
              value={timeframeDays}
              onChange={(e) => setTimeframeDays(Number(e.target.value))}
              className="bg-navy-900 border border-white/10 text-white rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer focus:outline-none focus:border-electric-500 transition"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="glass-card glow-border border-rose-500/20 bg-rose-950/10 p-4 rounded-xl flex items-start gap-3 mb-6">
            <span className="text-rose-400 text-sm mt-0.5">⚠️</span>
            <div>
              <p className="text-xs text-rose-300 font-semibold">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="glass-card glow-border border-emerald-500/20 bg-emerald-950/10 p-4 rounded-xl flex items-start gap-3 mb-6">
            <span className="text-emerald-400 text-sm mt-0.5">✅</span>
            <div>
              <p className="text-xs text-emerald-300 font-semibold">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Display New Secret Plain Text once in a high-visibility modal popup screen */}
        {revealKey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
            <div className="w-full max-w-lg glass-card glow-border border-emerald-400 bg-navy-950 p-6 rounded-2xl relative overflow-hidden shadow-2xl transition-all transform scale-100">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 text-lg border border-emerald-500/20">
                  🔑
                </div>
                <div>
                  <h4 className="text-md font-bold text-white">
                    API Key Provisioned Successfully!
                  </h4>
                  <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                    Copy and store securely
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                For security reasons, this key will only be shown <span className="text-emerald-400 font-bold">once</span>. Copy it now and store it in a secure credential vault. If lost, you must rotate the key to obtain a new one.
              </p>

              <div className="flex items-center gap-2 bg-navy-900 border border-white/10 rounded-xl p-3 font-mono text-xs text-emerald-400 overflow-x-auto mb-6">
                <span className="select-all break-all">{revealKey}</span>
                <button
                  onClick={() => {
                    copyToClipboard(revealKey);
                  }}
                  className="ml-auto shrink-0 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 hover:text-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                >
                  Copy Key
                </button>
              </div>

              <div className="flex justify-end border-t border-white/5 pt-4">
                <button
                  onClick={() => setRevealKey(null)}
                  className="btn-primary px-5 py-2 text-xs font-bold"
                >
                  I Have Saved the Key
                </button>
              </div>
            </div>
          </div>
        )}


        {/* ── SECTION 1: Usage & Telemetry Graphs ──────────────── */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="stat-card border border-white/10 bg-white/5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total API Requests</span>
            <span className="text-3xl font-black text-white font-mono mt-1">
              {telemetry ? telemetry.total_calls.toLocaleString() : "0"}
            </span>
            <span className="text-[10px] text-gray-500 font-bold">Successful routing calls</span>
          </div>

          <div className="stat-card border border-white/10 bg-white/5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Billing (INR)</span>
            <span className="text-3xl font-black text-emerald-400 font-mono mt-1">
              ₹{telemetry ? telemetry.total_cost_inr.toFixed(2) : "0.00"}
            </span>
            <span className="text-[10px] text-gray-500 font-bold">Calculated on token weight</span>
          </div>

          <div className="stat-card border border-white/10 bg-white/5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Webhook Callbacks</span>
            <span className="text-3xl font-black text-indigo-400 font-mono mt-1">
              {webhooks.length}
            </span>
            <span className="text-[10px] text-gray-500 font-bold">Active callback endpoints</span>
          </div>

          <div className="stat-card border border-white/10 bg-white/5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rate Limit Tier</span>
            <span className="text-3xl font-black text-electric-400 font-mono mt-1 capitalize">
              {user?.plan || "Free"}
            </span>
            <span className="text-[10px] text-gray-500 font-bold">Volume-based tier quota</span>
          </div>
        </div>

        {/* Telemetry Visual Charts */}
        <div className="grid gap-8 lg:grid-cols-3 mb-8">
          {/* Daily Request Volume Chart */}
          <div className="lg:col-span-2 glass-card p-6 border-white/10 bg-white/5 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              📊 Daily Request Traffic
            </h3>
            <div className="h-[250px] w-full">
              {loadingTelemetry ? (
                <div className="h-full flex items-center justify-center">
                  <Spinner size="h-6 w-6" color="text-electric-400" />
                </div>
              ) : telemetry && telemetry.daily_volume.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetry.daily_volume}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" style={{ fontSize: "10px" }} />
                    <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: "10px" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(10, 17, 32, 0.95)",
                        borderColor: "rgba(255,255,255,0.15)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#fff"
                      }}
                    />
                    <Area type="monotone" name="Requests" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVolume)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs">
                  <span>No traffic recorded during the select timeframe.</span>
                </div>
              )}
            </div>
          </div>

          {/* Status code breakdown pie */}
          <div className="lg:col-span-1 glass-card p-6 border-white/10 bg-white/5 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              🛡️ API Response Distribution
            </h3>
            <div className="h-[200px] w-full relative">
              {loadingTelemetry ? (
                <div className="h-full flex items-center justify-center">
                  <Spinner size="h-6 w-6" color="text-electric-400" />
                </div>
              ) : telemetry && telemetry.status_codes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={telemetry.status_codes}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="status"
                    >
                      {telemetry.status_codes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(10, 17, 32, 0.95)",
                        borderColor: "rgba(255,255,255,0.15)",
                        borderRadius: "12px",
                        fontSize: "11px",
                        color: "#fff"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs">
                  <span>No response metrics available.</span>
                </div>
              )}
            </div>
            {/* Legend for pie */}
            {telemetry && telemetry.status_codes.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {telemetry.status_codes.map((item, idx) => (
                  <div key={item.status} className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold font-mono">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span>HTTP {item.status}: {item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 2: API Keys Management ─────────────────── */}
        <div className="grid gap-8 lg:grid-cols-3 mb-8">
          {/* Create Key Card */}
          <div className="lg:col-span-1 glass-card p-6 border-white/10 bg-white/5 h-fit">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
              🔑 Generate Security Token
            </h3>
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Friendly Label Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production Mobile App"
                  className="input-field py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={generatingKey}
                className="w-full btn-primary py-2 text-xs flex items-center justify-center gap-2"
              >
                {generatingKey ? (
                  <>
                    <Spinner size="h-4 w-4" color="text-white" />
                    <span>Provisioning...</span>
                  </>
                ) : (
                  <span>🚀 Provision API Key</span>
                )}
              </button>
            </form>
          </div>

          {/* Active Keys List Table */}
          <div className="lg:col-span-2 glass-card p-6 border-white/10 bg-white/5">
            <h3 className="text-md font-bold text-white mb-4">
              🗝️ Active Developer API Keys
            </h3>

            {loadingKeys ? (
              <div className="p-8 flex items-center justify-center">
                <Spinner size="h-6 w-6" color="text-electric-400" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                <p className="text-xs text-gray-500">No active keys generated yet. Use the side panel to provision keys.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-gray-400 font-bold">
                      <th className="p-3">Friendly Name</th>
                      <th className="p-3">Prefix</th>
                      <th className="p-3">Rate Limit Tier</th>
                      <th className="p-3 font-mono">Last Used</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((k) => (
                      <tr key={k.id} className="border-b border-white/5 hover:bg-white/[0.01] transition font-mono text-gray-300">
                        <td className="p-3 font-bold text-white font-sans">{k.name}</td>
                        <td className="p-3 text-electric-400 font-bold">{k.prefix}...</td>
                        <td className="p-3 capitalize">{k.rate_limit_tier}</td>
                        <td className="p-3">
                          {k.last_used_at
                            ? new Date(k.last_used_at).toLocaleDateString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Never"}
                        </td>
                        <td className="p-3">
                          <span
                            className={
                              k.is_active
                                ? "badge-green"
                                : "badge-red"
                            }
                          >
                            {k.is_active ? "active" : "revoked"}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-2 font-sans">
                          {k.is_active && (
                            <>
                              <button
                                onClick={() => copyToClipboard(k.prefix)}
                                className="text-[10px] text-gray-400 hover:text-white font-bold transition mr-2"
                                title="Copy key prefix"
                              >
                                Copy Prefix
                              </button>
                              <button
                                onClick={() => handleRotateKey(k.id)}
                                className="text-[10px] text-electric-400 hover:text-electric-300 font-bold transition mr-2"
                                title="Rotate security key"
                              >
                                Rotate
                              </button>
                              <button
                                onClick={() => handleRevokeKey(k.id)}
                                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold transition"
                                title="Revoke access immediately"
                              >
                                Revoke
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 3: Webhook callback registrations ───────── */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Create Webhook Card */}
          <div className="lg:col-span-1 glass-card p-6 border-white/10 bg-white/5 h-fit">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
              🔗 Register Callback Webhook
            </h3>
            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Target Payload URL
                </label>
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://yourdomain.com/webhooks/kundli"
                  className="input-field py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Tickers Scope (Optional)
                </label>
                <input
                  type="text"
                  value={newWebhookTickers}
                  onChange={(e) => setNewWebhookTickers(e.target.value)}
                  placeholder="e.g. RELIANCE, TCS, HDFCBANK"
                  className="input-field py-2 text-sm font-mono"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Comma separated. Leave empty to subscribe to rating transitions of all companies.
                </p>
              </div>
              <button
                type="submit"
                disabled={creatingWebhook}
                className="w-full btn-primary py-2 text-xs flex items-center justify-center gap-2"
              >
                {creatingWebhook ? (
                  <>
                    <Spinner size="h-4 w-4" color="text-white" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <span>🚀 Register Callback Subscription</span>
                )}
              </button>
            </form>
          </div>

          {/* Webhooks table list */}
          <div className="lg:col-span-2 glass-card p-6 border-white/10 bg-white/5">
            <h3 className="text-md font-bold text-white mb-4">
              📡 Active Webhook Subscriptions
            </h3>

            {loadingWebhooks ? (
              <div className="p-8 flex items-center justify-center">
                <Spinner size="h-6 w-6" color="text-electric-400" />
              </div>
            ) : webhooks.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                <p className="text-xs text-gray-500">No webhooks registered yet. Use the side panel to register callbacks.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-gray-400 font-bold">
                      <th className="p-3">Callback Payload URL</th>
                      <th className="p-3">HMAC Secret</th>
                      <th className="p-3">Ticker Scope</th>
                      <th className="p-3">Created At</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhooks.map((w) => (
                      <tr key={w.id} className="border-b border-white/5 hover:bg-white/[0.01] transition font-mono text-gray-300">
                        <td className="p-3 font-semibold text-white break-all max-w-[200px]">{w.url}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-navy-950/80 px-2 py-1 rounded text-[10px] text-gray-400 font-mono">
                              {revealWebhookSecret[w.id] ? w.secret : "••••••••••••••••"}
                            </span>
                            <button
                              onClick={() => toggleRevealSecret(w.id)}
                              className="text-[10px] text-electric-400 hover:underline"
                            >
                              {revealWebhookSecret[w.id] ? "Hide" : "Reveal"}
                            </button>
                            {revealWebhookSecret[w.id] && (
                              <button
                                onClick={() => copyToClipboard(w.secret)}
                                className="text-[10px] text-emerald-400 hover:underline"
                              >
                                Copy
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {w.tickers && w.tickers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {w.tickers.map((t) => (
                                <span key={t} className="badge-blue text-[9px] px-1.5 py-0.5 rounded font-mono">
                                  {t}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500 italic">All Tickers</span>
                          )}
                        </td>
                        <td className="p-3">
                          {new Date(w.created_at).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="p-3 text-right font-sans">
                          <button
                            onClick={() => handleDeleteWebhook(w.id)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-bold transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 4: Developer Integration & Callback Guide ── */}
        <div className="mt-12 border-t border-white/5 pt-12 animate-fade-in">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            📖 Developer Integration & Callback Guide
          </h2>
          
          <div className="grid gap-8 lg:grid-cols-2">
            {/* API Keys Guide */}
            <div className="glass-card p-6 border-white/10 bg-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric-500/10 text-electric-400 font-bold border border-electric-500/20">
                    🔑
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    API Key Authentication Step-by-Step
                  </h3>
                </div>
                
                <div className="space-y-4 text-xs text-gray-300 leading-relaxed font-sans">
                  <div className="flex gap-3">
                    <span className="text-electric-400 font-bold font-mono">STEP 1:</span>
                    <p>Enter a name for your token and click <strong className="text-white">Provision API Key</strong> above. Make sure to copy the secret token value instantly.</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-electric-400 font-bold font-mono">STEP 2:</span>
                    <p>Configure all outgoing API requests to send the token in the request headers under the <strong className="text-white">`X-API-Key`</strong> field.</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-electric-400 font-bold font-mono">STEP 3:</span>
                    <div>
                      <p>Consume the endpoints to extract market intelligence or transition history:</p>
                      <ul className="list-disc pl-4 mt-1.5 space-y-1 text-gray-400">
                        <li><span className="font-mono text-white text-[10px]">GET /api/v1/kundli/&#123;ticker&#125;</span> — Fetch detailed AI ratings</li>
                        <li><span className="font-mono text-white text-[10px]">GET /api/v1/kundli/&#123;ticker&#125;/history</span> — Fetch signal records</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-white/5 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-400 font-bold font-mono">EXAMPLE CURL REQUEST</span>
                  <button
                    onClick={() => copyToClipboard(`curl -X GET "http://localhost:8000/api/v1/kundli/RELIANCE?lang=en" \\\n     -H "X-API-Key: YOUR_API_KEY_HERE"`)}
                    className="text-[10px] text-electric-400 hover:underline"
                  >
                    Copy Snippet
                  </button>
                </div>
                <pre className="bg-navy-950/80 p-3 rounded-lg border border-white/5 text-[10px] font-mono text-gray-400 select-all overflow-x-auto">
                  {`curl -X GET "http://localhost:8000/api/v1/kundli/RELIANCE?lang=en" \\\n     -H "X-API-Key: YOUR_API_KEY_HERE"`}
                </pre>
              </div>
            </div>

            {/* Webhooks/Callback Guide */}
            <div className="glass-card p-6 border-white/10 bg-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                    📡
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Callback Webhooks Step-by-Step
                  </h3>
                </div>

                <div className="space-y-4 text-xs text-gray-300 leading-relaxed font-sans">
                  <div className="flex gap-3">
                    <span className="text-indigo-400 font-bold font-mono">STEP 1:</span>
                    <p>Set up an HTTP POST endpoint on your servers that is ready to accept JSON payloads (e.g. <span className="font-mono text-white text-[10px]">https://yoursite.com/webhooks/kundli</span>).</p>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-indigo-400 font-bold font-mono">STEP 2:</span>
                    <p>Enter the URL and list target tickers to narrow scope (or leave empty to receive changes for all tickers). Click <strong className="text-white">Register Callback Subscription</strong>.</p>
                  </div>

                  <div className="flex gap-3">
                    <span className="text-indigo-400 font-bold font-mono">STEP 3:</span>
                    <p>Verify payload signatures: When we fire a webhook, we compute a SHA256 HMAC of the body using your signing secret and append it in the header <strong className="text-white">`X-Webhook-Signature`</strong>. Verify this signature to ensure authenticity.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-white/5 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-400 font-bold font-mono">EXAMPLE WEBHOOK JSON PAYLOAD</span>
                  <button
                    onClick={() => copyToClipboard(`{\n  "timestamp": "2026-05-30T12:00:00Z",\n  "event": "signal_change",\n  "ticker": "RELIANCE",\n  "old_signal": "Neutral",\n  "new_signal": "Strong Buy"\n}`)}
                    className="text-[10px] text-indigo-400 hover:underline"
                  >
                    Copy Payload
                  </button>
                </div>
                <pre className="bg-navy-950/80 p-3 rounded-lg border border-white/5 text-[10px] font-mono text-gray-400 select-all overflow-x-auto">
                  {`{\n  "timestamp": "2026-05-30T12:00:00Z",\n  "event": "signal_change",\n  "ticker": "RELIANCE",\n  "old_signal": "Neutral",\n  "new_signal": "Strong Buy"\n}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

