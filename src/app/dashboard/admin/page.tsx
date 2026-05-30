"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../../context/LanguageContext";
import LanguageSelector from "../../../components/common/LanguageSelector";
import Spinner from "../../../components/common/Spinner";
import { useBranding } from "../../../context/BrandingContext";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface Tenant {
  id: number;
  name: string;
  domain: string | null;
  brand_name: string | null;
  logo_url: string | null;
  brand_color: string | null;
  brand_color_secondary: string | null;
  created_at: string;
  is_active: boolean;
}

interface AdminUser {
  id: number;
  email: string;
  full_name: string | null;
  plan: string;
  role: string;
  is_suspended: boolean;
  tenant_id: number | null;
  created_at: string;
}

interface Invoice {
  id: number;
  tenant_id: number | null;
  tenant_name: string | null;
  user_id: number | null;
  user_email: string | null;
  billing_period_start: string;
  billing_period_end: string;
  amount_inr: number;
  status: string;
  created_at: string;
}

interface AuditLog {
  id: number;
  tenant_id: number | null;
  tenant_name: string | null;
  user_id: number | null;
  user_email: string | null;
  action: string;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
}

interface DailyHit {
  date: string;
  count: number;
}

interface EndpointHit {
  endpoint: string;
  count: number;
}

interface StatusHit {
  status: string;
  count: number;
}

interface UsageTelemetry {
  total_calls: number;
  active_users: number;
  daily_volume: DailyHit[];
  endpoint_breakdown: EndpointHit[];
  status_distribution: StatusHit[];
}

interface AgentLatency {
  agent: string;
  avg_latency_ms: number;
  error_rate: number;
  fallback_rate: number;
}

interface ConfidenceDistribution {
  score_range: string;
  count: number;
}

interface AgentMonitoring {
  agents: AgentLatency[];
  confidence_distribution: ConfidenceDistribution[];
  api_uptime_pct: number;
  llm_costs_inr: number;
}

export default function EnterpriseAdminDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const { branding: appBranding, refreshBranding } = useBranding();
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Active sub-tab: telemetry | tenants | users | billing | audit
  const [activeTab, setActiveTab] = useState<string>("telemetry");

  // Data states
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [telemetry, setTelemetry] = useState<UsageTelemetry | null>(null);
  const [monitoring, setMonitoring] = useState<AgentMonitoring | null>(null);

  // Search & filter states
  const [userQuery, setUserQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userPlanFilter, setUserPlanFilter] = useState("");
  const [metricsDays, setMetricsDays] = useState(30);

  // Forms state
  const [showCreateTenantModal, setShowCreateTenantModal] = useState(false);
  const [newTenantData, setNewTenantData] = useState({
    name: "",
    domain: "",
    brand_name: "",
    logo_url: "",
    brand_color: "#3b82f6",
    brand_color_secondary: "#14b8a6",
  });
  const [selectedTenantBranding, setSelectedTenantBranding] = useState<any>(null);

  // Action status indicators
  const [loadingAction, setLoadingAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Init auth & access verify
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
        if (data.role !== "SuperAdmin" && data.role !== "OrgAdmin") {
          alert("Access Denied: Administrative permissions required.");
          router.push("/dashboard");
          return;
        }
        setCurrentUser(data);
        fetchTabData("telemetry", token);
      })
      .catch((err) => {
        console.error("Admin portal verification failure:", err);
        localStorage.removeItem("access_token");
        router.push("/login");
      })
      .finally(() => {
        setLoadingUser(false);
      });
  }, [router]);

  // Load tab specific data
  const fetchTabData = async (tab: string, tokenOverride?: string) => {
    const token = tokenOverride || localStorage.getItem("access_token");
    if (!token) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (tab === "telemetry") {
        // Usage telemetry
        const resUsage = await fetch(`${getApiUrl()}/api/v1/admin/usage?days=${metricsDays}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resUsage.ok) {
          const uData = await resUsage.json();
          setTelemetry(uData);
        }

        // Multi-agent telemetry
        const resMon = await fetch(`${getApiUrl()}/api/v1/admin/monitoring`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resMon.ok) {
          const mData = await resMon.json();
          setMonitoring(mData);
        }
      } else if (tab === "tenants") {
        if (currentUser?.role === "SuperAdmin") {
          const res = await fetch(`${getApiUrl()}/api/v1/admin/tenants`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setTenants(data);
          }
        }
      } else if (tab === "users") {
        let url = `${getApiUrl()}/api/v1/admin/users?`;
        if (userQuery) url += `q=${encodeURIComponent(userQuery)}&`;
        if (userRoleFilter) url += `role=${encodeURIComponent(userRoleFilter)}&`;
        if (userPlanFilter) url += `plan=${encodeURIComponent(userPlanFilter)}&`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } else if (tab === "billing") {
        const res = await fetch(`${getApiUrl()}/api/v1/admin/billing/invoices`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setInvoices(data);
        }
      } else if (tab === "audit") {
        const res = await fetch(`${getApiUrl()}/api/v1/admin/audit-logs?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAuditLogs(data);
        }
      }
    } catch (err) {
      console.error(`Error loading tab data [${tab}]:`, err);
      setErrorMsg("Failed to load dashboard metrics. Check server status.");
    }
  };

  // Re-fetch telemetry if metrics days changes
  useEffect(() => {
    if (currentUser && activeTab === "telemetry") {
      fetchTabData("telemetry");
    }
  }, [metricsDays]);

  // Tab switch handler
  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    fetchTabData(tabName);
  };

  // Logout utility
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/");
  };

  // ── Tenant Administration Actions ──

  const handleCreateTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingAction(true);

    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/admin/tenants`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTenantData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create tenant.");
      }

      setSuccessMsg(`Enterprise Organization '${newTenantData.name}' created successfully!`);
      setShowCreateTenantModal(false);
      setNewTenantData({
        name: "",
        domain: "",
        brand_name: "",
        logo_url: "",
        brand_color: "#3b82f6",
        brand_color_secondary: "#14b8a6",
      });
      fetchTabData("tenants");
    } catch (err: any) {
      setErrorMsg(err.message || "Error creating tenant organization.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUpdateBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingAction(true);

    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/admin/tenants/${selectedTenantBranding.id}/branding`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand_name: selectedTenantBranding.brand_name,
          logo_url: selectedTenantBranding.logo_url,
          brand_color: selectedTenantBranding.brand_color,
          brand_color_secondary: selectedTenantBranding.brand_color_secondary,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to save settings.");
      }

      setSuccessMsg("White-label theme variables updated successfully!");
      setSelectedTenantBranding(null);
      
      // If we updated branding of current user's tenant, trigger refresh
      if (currentUser?.tenant_id === selectedTenantBranding.id) {
        refreshBranding(currentUser.tenant_id);
      }
      
      fetchTabData("tenants");
    } catch (err: any) {
      setErrorMsg(err.message || "Error updating branding.");
    } finally {
      setLoadingAction(false);
    }
  };

  // ── User Management Actions ──

  const toggleUserSuspension = async (targetUser: AdminUser) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingAction(true);

    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const newStatus = !targetUser.is_suspended;
      const res = await fetch(`${getApiUrl()}/api/v1/admin/users/${targetUser.id}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_suspended: newStatus }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update user status.");
      }

      setSuccessMsg(`User status updated: ${targetUser.email} is now ${newStatus ? 'suspended' : 'active'}.`);
      fetchTabData("users");
    } catch (err: any) {
      setErrorMsg(err.message || "Error changing user status.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingAction(true);

    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update user role.");
      }

      setSuccessMsg("User privilege role updated successfully.");
      fetchTabData("users");
    } catch (err: any) {
      setErrorMsg(err.message || "Error modifying role.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handlePlanChange = async (userId: number, currentRole: string, newPlan: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingAction(true);

    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: currentRole, plan: newPlan }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update user plan.");
      }

      setSuccessMsg("User pricing tier plan updated successfully.");
      fetchTabData("users");
    } catch (err: any) {
      setErrorMsg(err.message || "Error modifying plan.");
    } finally {
      setLoadingAction(false);
    }
  };

  // ── Billing Actions ──

  const triggerBillingGenerationCycle = async () => {
    if (!confirm("Are you sure you want to run the invoicing job manually now? This calculates costs and issues bills for the current period.")) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingAction(true);

    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/admin/billing/invoices/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to execute billing run.");
      }

      const generated = await res.json();
      setSuccessMsg(`Billing cycle completed successfully! Issued ${generated.length} invoices.`);
      fetchTabData("billing");
    } catch (err: any) {
      setErrorMsg(err.message || "Error executing billing cycle run.");
    } finally {
      setLoadingAction(false);
    }
  };

  const markInvoicePaid = async (invoiceId: number) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoadingAction(true);

    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/admin/billing/invoices/${invoiceId}/pay`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to record invoice payment.");
      }

      setSuccessMsg("Invoice payment captured and logged in audit trails.");
      fetchTabData("billing");
    } catch (err: any) {
      setErrorMsg(err.message || "Error logging payment.");
    } finally {
      setLoadingAction(false);
    }
  };

  const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#14b8a6"];

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-noise">
        <Spinner size="h-8 w-8" color="text-electric-400" label="Verifying console credentials..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noise pb-12">
      {/* Dynamic ambient backgrounds */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 left-20 h-[500px] w-[500px] rounded-full bg-electric-500/[0.04] blur-[150px]" />
        <div className="absolute bottom-10 right-10 h-[400px] w-[400px] rounded-full bg-indigo-500/[0.03] blur-[120px]" />
      </div>

      {/* Admin Navbar */}
      <nav className="relative z-20 border-b border-white/5 bg-navy-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              {appBranding.logo_url ? (
                <img src={appBranding.logo_url} alt="Logo" className="h-7 w-7 rounded object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-electric-500 to-electric-600">
                  <span className="text-sm font-bold text-white">K</span>
                </div>
              )}
              <span className="text-base font-bold text-white">{appBranding.brand_name}</span>
            </Link>
            <Link href="/dashboard" className="text-xs font-semibold text-gray-300 hover:text-white transition pl-4 border-l border-white/10 hidden md:block">
              🏠 Dashboard Home
            </Link>
            <Link href="/dashboard/portfolio" className="text-xs font-semibold text-gray-300 hover:text-white transition pl-4 border-l border-white/10 hidden md:block">
              💼 Portfolio Advisor
            </Link>
            <Link href="/dashboard/developer" className="text-xs font-semibold text-gray-300 hover:text-white transition pl-4 border-l border-white/10 hidden md:block">
              ⚡ Developer Portal
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="badge bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20 font-bold uppercase tracking-wider text-[10px]">
              🔒 PLATFORM {currentUser?.role}
            </span>
            <span className="text-xs text-gray-400 font-semibold">{currentUser?.email}</span>
            <LanguageSelector />
            <button onClick={handleLogout} className="nav-link text-xs hover:text-rose-400 font-semibold">
              {t("common.logout")}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Console */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl flex items-center gap-3">
              🛡️ <span className="gradient-text">Enterprise Control Console</span>
            </h1>
            <p className="mt-2 text-sm text-gray-400 max-w-2xl leading-relaxed">
              Consolidated administration panel for managing multi-tenant settings, auditing security logs, managing access policies, and tracing API execution performance metrics.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 bg-navy-900/60 p-1 border border-white/10 rounded-xl">
            <button
              onClick={() => handleTabChange("telemetry")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "telemetry" ? "bg-electric-500 text-white shadow-md shadow-electric-500/20" : "text-gray-400 hover:text-white"
              }`}
            >
              📊 Telemetry
            </button>
            {currentUser?.role === "SuperAdmin" && (
              <button
                onClick={() => handleTabChange("tenants")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === "tenants" ? "bg-electric-500 text-white shadow-md shadow-electric-500/20" : "text-gray-400 hover:text-white"
                }`}
              >
                🏢 Organizations
              </button>
            )}
            <button
              onClick={() => handleTabChange("users")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "users" ? "bg-electric-500 text-white shadow-md shadow-electric-500/20" : "text-gray-400 hover:text-white"
              }`}
            >
              👥 User Accounts
            </button>
            <button
              onClick={() => handleTabChange("billing")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "billing" ? "bg-electric-500 text-white shadow-md shadow-electric-500/20" : "text-gray-400 hover:text-white"
              }`}
            >
              💳 Billing Invoices
            </button>
            <button
              onClick={() => handleTabChange("audit")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "audit" ? "bg-electric-500 text-white shadow-md shadow-electric-500/20" : "text-gray-400 hover:text-white"
              }`}
            >
              📜 Compliance Audits
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="glass-card glow-border border-rose-500/20 bg-rose-950/10 p-4 rounded-xl flex items-start gap-3 mb-6 animate-fade-in">
            <span className="text-rose-400 text-sm mt-0.5">⚠️</span>
            <div>
              <p className="text-xs text-rose-300 font-semibold">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="glass-card glow-border border-emerald-500/20 bg-emerald-950/10 p-4 rounded-xl flex items-start gap-3 mb-6 animate-fade-in">
            <span className="text-emerald-400 text-sm mt-0.5">✅</span>
            <div>
              <p className="text-xs text-emerald-300 font-semibold">{successMsg}</p>
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: TELEMETRY ──────────────────────────── */}
        {activeTab === "telemetry" && (
          <div className="space-y-8 animate-fade-in">
            {/* Quick Metrics Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <div className="stat-card border border-white/10 bg-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Platform Requests</span>
                <span className="text-3xl font-black text-white font-mono mt-1">
                  {telemetry ? telemetry.total_calls.toLocaleString() : "0"}
                </span>
                <span className="text-[10px] text-gray-500 font-bold">API hits (current timeframe)</span>
              </div>

              <div className="stat-card border border-white/10 bg-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active System API Keys</span>
                <span className="text-3xl font-black text-emerald-400 font-mono mt-1">
                  {telemetry ? telemetry.active_users.toLocaleString() : "0"}
                </span>
                <span className="text-[10px] text-gray-500 font-bold">Configured developer channels</span>
              </div>

              <div className="stat-card border border-white/10 bg-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Core Agent API Uptime</span>
                <span className="text-3xl font-black text-indigo-400 font-mono mt-1">
                  {monitoring ? `${monitoring.api_uptime_pct}%` : "99.98%"}
                </span>
                <span className="text-[10px] text-gray-500 font-bold">Multi-agent response uptime</span>
              </div>

              <div className="stat-card border border-white/10 bg-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">LLM Cloud Costs</span>
                <span className="text-3xl font-black text-electric-400 font-mono mt-1">
                  ₹{monitoring ? monitoring.llm_costs_inr.toFixed(2) : "0.00"}
                </span>
                <span className="text-[10px] text-gray-500 font-bold">Computed model inference weight</span>
              </div>
            </div>

            {/* Main Graphs Panel */}
            <div className="grid gap-8 lg:grid-cols-3">
              {/* API Load Profile */}
              <div className="lg:col-span-2 glass-card p-6 border-white/10 bg-white/5 flex flex-col justify-between">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    📈 Platform Call Traffic
                  </h3>
                  {/* Select metrics window */}
                  <select
                    value={metricsDays}
                    onChange={(e) => setMetricsDays(Number(e.target.value))}
                    className="bg-navy-950 border border-white/10 text-white rounded-lg px-2 py-0.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                  </select>
                </div>
                <div className="h-[260px] w-full">
                  {telemetry && telemetry.daily_volume.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={telemetry.daily_volume}>
                        <defs>
                          <linearGradient id="colorAdminVolume" x1="0" y1="0" x2="0" y2="1">
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
                        <Area type="monotone" name="Requests" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAdminVolume)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 text-xs font-mono">
                      Gathering telemetry metrics...
                    </div>
                  )}
                </div>
              </div>

              {/* API Status Distribution */}
              <div className="lg:col-span-1 glass-card p-6 border-white/10 bg-white/5 flex flex-col justify-between font-mono">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 font-sans">
                  🛡️ Traffic Error Distributions
                </h3>
                <div className="h-[200px] w-full relative">
                  {telemetry && telemetry.status_distribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={telemetry.status_distribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="status"
                        >
                          {telemetry.status_distribution.map((entry, index) => (
                            <Cell key={`cell-admin-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
                    <div className="h-full flex items-center justify-center text-gray-500 text-xs font-sans">
                      No status logs captured.
                    </div>
                  )}
                </div>
                {telemetry && telemetry.status_distribution.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {telemetry.status_distribution.map((item, idx) => (
                      <div key={item.status} className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        <span>HTTP {item.status}: {item.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Agent Performance Latency List */}
            <div className="glass-card p-6 border-white/10 bg-white/5">
              <h3 className="text-md font-bold text-white mb-4">
                🤖 Multi-Agent Performance Analytics
              </h3>
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-gray-400 font-bold">
                      <th className="p-3">Agent Orchestrator Name</th>
                      <th className="p-3">Average Execution Speed</th>
                      <th className="p-3">Runtime Failure Rate</th>
                      <th className="p-3">LLM Fallback Trigger Frequency</th>
                      <th className="p-3 text-right">Status Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitoring?.agents.map((a) => (
                      <tr key={a.agent} className="border-b border-white/5 hover:bg-white/[0.01] transition font-mono text-gray-300">
                        <td className="p-3 font-bold text-white font-sans">{a.agent.replace("_", " ").toUpperCase()}</td>
                        <td className="p-3 text-electric-400 font-bold">{a.avg_latency_ms.toFixed(1)} ms</td>
                        <td className="p-3 font-bold text-rose-400">{(a.error_rate * 100).toFixed(1)}%</td>
                        <td className="p-3">{(a.fallback_rate * 100).toFixed(1)}%</td>
                        <td className="p-3 text-right">
                          <span className={a.error_rate < 0.03 ? "badge-green" : "badge-red"}>
                            {a.error_rate < 0.03 ? "HEALTHY" : "COMPROMISED"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB CONTENT: TENANTS ───────────────────────────── */}
        {activeTab === "tenants" && currentUser?.role === "SuperAdmin" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-bold text-white">🏢 Active Enterprise Client Tenants</h3>
              <button
                onClick={() => setShowCreateTenantModal(true)}
                className="btn-primary py-2 px-4 text-xs"
              >
                ➕ Create Tenant
              </button>
            </div>

            {/* Create Tenant Modal overlay */}
            {showCreateTenantModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="glass-card p-6 border-white/15 bg-navy-950 w-full max-w-lg relative animate-fade-in-up">
                  <h4 className="text-lg font-bold text-white mb-4">Create Enterprise Organization</h4>
                  <form onSubmit={handleCreateTenantSubmit} className="space-y-4 text-xs">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Company/Client Name</label>
                        <input
                          type="text"
                          required
                          value={newTenantData.name}
                          onChange={(e) => setNewTenantData({ ...newTenantData, name: e.target.value })}
                          placeholder="e.g. Acme Wealth Management"
                          className="input-field py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Domain Boundary</label>
                        <input
                          type="text"
                          required
                          value={newTenantData.domain}
                          onChange={(e) => setNewTenantData({ ...newTenantData, domain: e.target.value })}
                          placeholder="e.g. acme.advisor-portal.com"
                          className="input-field py-2 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">White-Label Title</label>
                        <input
                          type="text"
                          value={newTenantData.brand_name}
                          onChange={(e) => setNewTenantData({ ...newTenantData, brand_name: e.target.value })}
                          placeholder="e.g. Acme Advisory Hub"
                          className="input-field py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Logo Media URI</label>
                        <input
                          type="url"
                          value={newTenantData.logo_url}
                          onChange={(e) => setNewTenantData({ ...newTenantData, logo_url: e.target.value })}
                          placeholder="https://..."
                          className="input-field py-2 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Brand Theme Color</label>
                        <input
                          type="color"
                          value={newTenantData.brand_color}
                          onChange={(e) => setNewTenantData({ ...newTenantData, brand_color: e.target.value })}
                          className="w-full bg-transparent border-0 h-9 p-0 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Accent Theme Color</label>
                        <input
                          type="color"
                          value={newTenantData.brand_color_secondary}
                          onChange={(e) => setNewTenantData({ ...newTenantData, brand_color_secondary: e.target.value })}
                          className="w-full bg-transparent border-0 h-9 p-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateTenantModal(false)}
                        className="btn-secondary py-2 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loadingAction}
                        className="btn-primary py-2 text-xs"
                      >
                        {loadingAction ? "Provisioning..." : "Provision Organization"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Tenant Branding Config Overlay */}
            {selectedTenantBranding && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="glass-card p-6 border-white/15 bg-navy-950 w-full max-w-md relative animate-fade-in-up">
                  <h4 className="text-base font-bold text-white mb-4">Edit Custom Branding: {selectedTenantBranding.name}</h4>
                  <form onSubmit={handleUpdateBranding} className="space-y-4 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Custom Brand Title</label>
                      <input
                        type="text"
                        value={selectedTenantBranding.brand_name || ""}
                        onChange={(e) => setSelectedTenantBranding({ ...selectedTenantBranding, brand_name: e.target.value })}
                        className="input-field py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Logo Resource URL</label>
                      <input
                        type="url"
                        value={selectedTenantBranding.logo_url || ""}
                        onChange={(e) => setSelectedTenantBranding({ ...selectedTenantBranding, logo_url: e.target.value })}
                        className="input-field py-2 text-xs font-mono"
                      />
                    </div>
                    <div className="grid gap-4 grid-cols-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Primary Color</label>
                        <input
                          type="color"
                          value={selectedTenantBranding.brand_color || "#3b82f6"}
                          onChange={(e) => setSelectedTenantBranding({ ...selectedTenantBranding, brand_color: e.target.value })}
                          className="w-full bg-transparent border-0 h-9 p-0 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Secondary Color</label>
                        <input
                          type="color"
                          value={selectedTenantBranding.brand_color_secondary || "#14b8a6"}
                          onChange={(e) => setSelectedTenantBranding({ ...selectedTenantBranding, brand_color_secondary: e.target.value })}
                          className="w-full bg-transparent border-0 h-9 p-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTenantBranding(null)}
                        className="btn-secondary py-2 text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loadingAction}
                        className="btn-primary py-2 text-xs"
                      >
                        {loadingAction ? "Saving..." : "Save branding variables"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Tenants Listing */}
            {tenants.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                <p className="text-xs text-gray-500">No organizations found. Click create tenant to start.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {tenants.map((t) => (
                  <div key={t.id} className="glass-card p-6 border-white/10 bg-white/5 flex flex-col justify-between relative overflow-hidden">
                    {/* Visual color bar indicator */}
                    <div className="absolute top-0 left-0 right-0 h-1 flex">
                      <div className="flex-1" style={{ backgroundColor: t.brand_color || "#3b82f6" }} />
                      <div className="flex-1" style={{ backgroundColor: t.brand_color_secondary || "#14b8a6" }} />
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          🏢 {t.name}
                        </h4>
                        <span className={t.is_active ? "badge-green" : "badge-red"}>
                          {t.is_active ? "ACTIVE" : "SUSPENDED"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-semibold mb-1">Domain: <span className="font-mono text-electric-400">{t.domain || "Not set"}</span></p>
                      <p className="text-xs text-gray-400 font-semibold">Brand name: <span className="text-white font-sans">{t.brand_name || t.name}</span></p>
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-3 text-xs">
                      <button
                        onClick={() => setSelectedTenantBranding(t)}
                        className="text-electric-400 hover:text-electric-300 font-bold transition"
                      >
                        🎨 Customize Branding
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT: USERS ─────────────────────────────── */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-fade-in">
            {/* Filter Suite */}
            <div className="glass-card p-4 border-white/5 bg-white/[0.02] flex flex-col sm:flex-row gap-4 items-center justify-between text-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Search accounts by email or name..."
                  className="input-field py-1.5 text-xs font-sans w-full sm:w-64"
                />
                <button
                  onClick={() => fetchTabData("users")}
                  className="btn-primary py-1.5 px-3 text-xs shrink-0"
                >
                  🔍 Search
                </button>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Privilege:</span>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="bg-navy-950 border border-white/10 text-white rounded-lg px-2 py-1 text-xs"
                  >
                    <option value="">All Roles</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                    <option value="OrgAdmin">OrgAdmin</option>
                    <option value="Retail">Retail</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Pricing Tier:</span>
                  <select
                    value={userPlanFilter}
                    onChange={(e) => setUserPlanFilter(e.target.value)}
                    className="bg-navy-950 border border-white/10 text-white rounded-lg px-2 py-1 text-xs"
                  >
                    <option value="">All Plans</option>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="advisor">Advisor</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Listing Table */}
            {users.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                <p className="text-xs text-gray-500">No user accounts found matching current query filters.</p>
              </div>
            ) : (
              <div className="glass-card p-6 border-white/10 bg-white/5">
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-gray-400 font-bold">
                        <th className="p-3">User Profile</th>
                        <th className="p-3">Pricing Plan</th>
                        <th className="p-3">Control Role</th>
                        <th className="p-3 font-mono">Tenant ID</th>
                        <th className="p-3">Account Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.01] transition text-gray-300">
                          <td className="p-3">
                            <div>
                              <p className="font-bold text-white">{u.full_name || "Unnamed user"}</p>
                              <p className="text-[10px] text-gray-500 font-semibold">{u.email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <select
                              value={u.plan}
                              onChange={(e) => handlePlanChange(u.id, u.role, e.target.value)}
                              className="bg-navy-950 border border-white/10 text-white rounded px-1.5 py-0.5 text-xs font-semibold capitalize focus:outline-none"
                            >
                              <option value="free">Free</option>
                              <option value="pro">Pro</option>
                              <option value="enterprise">Enterprise</option>
                              <option value="advisor">Advisor</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="bg-navy-950 border border-white/10 text-white rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-none"
                            >
                              <option value="Retail">Retail</option>
                              <option value="OrgAdmin">OrgAdmin</option>
                              {currentUser?.role === "SuperAdmin" && (
                                <option value="SuperAdmin">SuperAdmin</option>
                              )}
                            </select>
                          </td>
                          <td className="p-3 font-mono font-bold text-electric-400">
                            {u.tenant_id ? `#${u.tenant_id}` : "Global"}
                          </td>
                          <td className="p-3">
                            <span className={u.is_suspended ? "badge-red" : "badge-green"}>
                              {u.is_suspended ? "SUSPENDED" : "ACTIVE"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => toggleUserSuspension(u)}
                              disabled={u.id === currentUser?.id}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded transition ${
                                u.is_suspended
                                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                  : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                              } disabled:opacity-50`}
                            >
                              {u.is_suspended ? "Activate" : "Suspend"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT: BILLING ───────────────────────────── */}
        {activeTab === "billing" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-bold text-white">💳 Enterprise Billing Invoices & Collections</h3>
              {currentUser?.role === "SuperAdmin" && (
                <button
                  onClick={triggerBillingGenerationCycle}
                  className="btn-primary py-2 px-4 text-xs"
                >
                  🚀 Run Billing Cycle
                </button>
              )}
            </div>

            {invoices.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                <p className="text-xs text-gray-500">No invoices generated for current period yet.</p>
              </div>
            ) : (
              <div className="glass-card p-6 border-white/10 bg-white/5">
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-gray-400 font-bold">
                        <th className="p-3">Invoice ID</th>
                        <th className="p-3">Enterprise Tenant</th>
                        <th className="p-3">Retail User</th>
                        <th className="p-3">Billing Cycle Period</th>
                        <th className="p-3">Charge Amount</th>
                        <th className="p-3">Billing Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.01] transition font-mono text-gray-300">
                          <td className="p-3 font-bold text-white font-sans">#INV-{inv.id.toString().padStart(5, "0")}</td>
                          <td className="p-3 font-sans text-electric-400 font-semibold">{inv.tenant_name || "—"}</td>
                          <td className="p-3 text-gray-400 font-sans">{inv.user_email || "—"}</td>
                          <td className="p-3">
                            {new Date(inv.billing_period_start).toLocaleDateString("en-IN")} to {new Date(inv.billing_period_end).toLocaleDateString("en-IN")}
                          </td>
                          <td className="p-3 font-bold text-white">₹{inv.amount_inr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td className="p-3">
                            <span className={inv.status === "paid" ? "badge-green" : "badge-red"}>
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 text-right font-sans">
                            {inv.status === "pending" && (
                              <button
                                onClick={() => markInvoicePaid(inv.id)}
                                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition"
                              >
                                Capture Payment
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB CONTENT: AUDITS ────────────────────────────── */}
        {activeTab === "audit" && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-md font-bold text-white mb-2">📜 Real-time Platform Security & Compliance Audit Log</h3>
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                <p className="text-xs text-gray-500">No audit trail records found.</p>
              </div>
            ) : (
              <div className="glass-card p-6 border-white/10 bg-white/5">
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-gray-400 font-bold">
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Operator</th>
                        <th className="p-3">Client Org</th>
                        <th className="p-3">Security Action</th>
                        <th className="p-3 font-mono">Trace Payload (details)</th>
                        <th className="p-3 text-right">IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.01] transition font-mono text-gray-300">
                          <td className="p-3 text-gray-500">
                            {new Date(log.timestamp).toLocaleString("en-IN", {
                              hour12: false,
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>
                          <td className="p-3 font-sans font-bold text-white">{log.user_email || "System"}</td>
                          <td className="p-3 font-sans">{log.tenant_name || "Platform Global"}</td>
                          <td className="p-3">
                            <span className="badge bg-electric-500/10 text-electric-400 ring-1 ring-electric-500/20 font-bold uppercase text-[9px]">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 text-gray-400 select-all overflow-x-auto max-w-[280px]">
                            {JSON.stringify(log.details)}
                          </td>
                          <td className="p-3 text-right text-gray-500">{log.ip_address || "127.0.0.1"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
