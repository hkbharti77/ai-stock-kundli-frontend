"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../../../components/common/Header";
import Spinner from "../../../components/common/Spinner";

interface Client {
  id: number;
  name: string;
  email: string;
  notes: string | null;
  created_at: string;
  holdings_count?: number;
  total_value?: number;
}

interface Company {
  id: number;
  ticker: string;
  name: string;
  sector: string;
  current_price: number;
}

interface ClientHolding {
  id: number;
  company_id: number;
  shares: number;
  average_price: number;
  company: Company;
  current_price: number;
  current_value: number;
  total_cost: number;
  pnl: number;
  pnl_percentage: number;
}

interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
}

interface ClientAnalysis {
  total_value: number;
  total_cost: number;
  total_pnl: number;
  total_pnl_percentage: number;
  risk_score: number;
  diversification_score: number;
  concentration_risk: string;
  sector_allocations: SectorAllocation[];
}

interface RiskAlert {
  client_id: number;
  client_name: string;
  ticker: string;
  company_name: string;
  current_score: number;
  previous_score: number;
  deterioration: number;
  signal: string;
  severity: "high" | "medium" | "low";
  timestamp: string;
}

interface BrandingConfig {
  brand_name: string | null;
  logo_url: string | null;
  brand_color: string | null;
  brand_color_secondary: string | null;
}

export default function AdvisorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"roster" | "risk" | "branding" | "comparison">("roster");

  // Premium Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  // Clients state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedClientHoldings, setSelectedClientHoldings] = useState<ClientHolding[]>([]);
  const [selectedClientAnalysis, setSelectedClientAnalysis] = useState<ClientAnalysis | null>(null);
  const [loadingClientDetails, setLoadingClientDetails] = useState(false);

  // CRUD Client Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientNotes, setNewClientNotes] = useState("");
  const [submittingClient, setSubmittingClient] = useState(false);

  // CRUD Holdings Modals
  const [showAddHoldingModal, setShowAddHoldingModal] = useState(false);
  const [newHoldingTicker, setNewHoldingTicker] = useState("");
  const [newHoldingShares, setNewHoldingShares] = useState("");
  const [newHoldingPrice, setNewHoldingPrice] = useState("");
  const [submittingHolding, setSubmittingHolding] = useState(false);
  const [tickerSuggestions, setTickerSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Bulk CSV Import
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importingCsv, setImportingCsv] = useState(false);

  // Cross-client risk alerts state
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Branding configuration
  const [branding, setBranding] = useState<BrandingConfig>({
    brand_name: "",
    logo_url: "",
    brand_color: "#10b981",
    brand_color_secondary: "#06b6d4",
  });
  const [savingBranding, setSavingBranding] = useState(false);

  // Comparison State
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [loadingComparison, setLoadingComparison] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Debouncer for Ticker Suggestion
  const searchTimeoutRef = useRef<any>(null);

  // Fetch initial data
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    // Verify advisor tier eligibility first
    fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((user) => {
        const plan = user.plan?.toLowerCase();
        if (plan !== "advisor" && plan !== "admin") {
          showToast("This workspace requires a premium Wealth Advisor Tier subscription.", "error");
          router.push("/dashboard");
          return;
        }
        
        // Fetch clients and branding config
        fetchClients();
        fetchBranding();
        fetchRiskAlerts();
      })
      .catch((err) => {
        console.error("Initialization error:", err);
        router.push("/dashboard");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, router]);

  // ─── API Fetchers ──────────────────────────────────────────────────────────
  const fetchClients = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/advisor/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  };

  const fetchBranding = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/advisor/branding`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBranding({
          brand_name: data.brand_name || "",
          logo_url: data.logo_url || "",
          brand_color: data.brand_color || "#10b981",
          brand_color_secondary: data.brand_color_secondary || "#06b6d4",
        });
      }
    } catch (err) {
      console.error("Failed to fetch branding:", err);
    }
  };

  const fetchRiskAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/advisor/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRiskAlerts(data);
      }
    } catch (err) {
      console.error("Failed to fetch risk alerts:", err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleSelectClient = async (client: Client) => {
    setSelectedClient(client);
    setLoadingClientDetails(true);
    try {
      // 1. Fetch Holdings
      const holdingsRes = await fetch(`${apiUrl}/api/v1/advisor/clients/${client.id}/holdings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let holdingsData: ClientHolding[] = [];
      if (holdingsRes.ok) {
        holdingsData = await holdingsRes.json();
        setSelectedClientHoldings(holdingsData);
      }

      // 2. Fetch Portfolio Analysis
      const analysisRes = await fetch(`${apiUrl}/api/v1/advisor/clients/${client.id}/analysis`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (analysisRes.ok) {
        const analysisData = await analysisRes.json();
        setSelectedClientAnalysis(analysisData);
      } else {
        setSelectedClientAnalysis(null);
      }
    } catch (err) {
      console.error("Error loading client portfolio:", err);
    } finally {
      setLoadingClientDetails(false);
    }
  };

  // ─── CRUD client operations ────────────────────────────────────────────────
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail) return;
    setSubmittingClient(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/advisor/clients`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newClientName,
          email: newClientEmail,
          notes: newClientNotes || null,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setClients((prev) => [created, ...prev]);
        setShowCreateModal(false);
        setNewClientName("");
        setNewClientEmail("");
        setNewClientNotes("");
        showToast("🎉 Client profile created successfully.", "success");
        // Instantly select new client
        handleSelectClient(created);
      } else {
        const errorData = await res.json();
        showToast(`Failed: ${errorData.detail || "Error occurred."}`, "error");
      }
    } catch (err) {
      console.error("Create client error:", err);
    } finally {
      setSubmittingClient(false);
    }
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newClientName || !newClientEmail) return;
    setSubmittingClient(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/advisor/clients/${selectedClient.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newClientName,
          email: newClientEmail,
          notes: newClientNotes || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setSelectedClient(updated);
        setShowEditClientModal(false);
        showToast("🎉 Client profile updated successfully.", "success");
      } else {
        showToast("Failed to update client.", "error");
      }
    } catch (err) {
      console.error("Update client error:", err);
    } finally {
      setSubmittingClient(false);
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!confirm("Are you sure you want to delete this client profile? All portfolio records will be permanently erased.")) return;
    try {
      const res = await fetch(`${apiUrl}/api/v1/advisor/clients/${clientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setClients((prev) => prev.filter((c) => c.id !== clientId));
        if (selectedClient?.id === clientId) {
          setSelectedClient(null);
          setSelectedClientHoldings([]);
          setSelectedClientAnalysis(null);
        }
        showToast("🗑️ Client profile successfully deleted.", "success");
      } else {
        showToast("Failed to delete client profile.", "error");
      }
    } catch (err) {
      console.error("Delete client error:", err);
    }
  };

  // ─── CRUD Holdings Operations ──────────────────────────────────────────────
  const handleSearchTicker = (query: string) => {
    setNewHoldingTicker(query.toUpperCase());
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query) {
      setTickerSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    setShowSuggestions(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${apiUrl}/api/v1/companies/search?query=${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTickerSuggestions(data);
        }
      } catch (err) {
        console.error("Suggestion fetch failed:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: any) => {
    setNewHoldingTicker(suggestion.ticker);
    setNewHoldingPrice(suggestion.current_price || "");
    setShowSuggestions(false);
  };

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !newHoldingTicker || !newHoldingShares || !newHoldingPrice) return;

    const sharesVal = parseFloat(newHoldingShares);
    const priceVal = parseFloat(newHoldingPrice);

    if (isNaN(sharesVal) || sharesVal <= 0) {
      showToast("Shares must be a positive number.", "error");
      return;
    }
    if (sharesVal > 99_999_999) {
      showToast("Shares quantity cannot exceed 99,999,999. Please enter a realistic value.", "error");
      return;
    }
    if (isNaN(priceVal) || priceVal <= 0) {
      showToast("Average price must be a positive number.", "error");
      return;
    }
    if (priceVal > 9_999_999_999) {
      showToast("Price value is unrealistically large. Please check and try again.", "error");
      return;
    }

    setSubmittingHolding(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/advisor/clients/${selectedClient.id}/holdings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker: newHoldingTicker,
          shares: sharesVal,
          average_price: priceVal,
        }),
      });

      if (res.ok) {
        showToast("🎉 Holding added successfully!", "success");
        setShowAddHoldingModal(false);
        setNewHoldingTicker("");
        setNewHoldingShares("");
        setNewHoldingPrice("");
        // Reload client context
        handleSelectClient(selectedClient);
        fetchClients(); // update counts
      } else {
        const errDetail = await res.json();
        showToast(`Failed to add holding: ${errDetail.detail || "Check ticker correctness."}`, "error");
      }
    } catch (err) {
      console.error("Error adding holding:", err);
    } finally {
      setSubmittingHolding(false);
    }
  };

  const handleDeleteHolding = async (holdingId: number) => {
    if (!selectedClient || !confirm("Delete this stock holding from the client's portfolio?")) return;
    try {
      const res = await fetch(`${apiUrl}/api/v1/advisor/clients/${selectedClient.id}/holdings/${holdingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast("🗑️ Holding deleted.", "success");
        handleSelectClient(selectedClient);
        fetchClients();
      } else {
        showToast("Failed to delete holding.", "error");
      }
    } catch (err) {
      console.error("Delete holding error:", err);
    }
  };

  // CSV Import Action
  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !csvFile) return;
    setImportingCsv(true);
    try {
      const formData = new FormData();
      formData.append("file", csvFile);

      const res = await fetch(`${apiUrl}/api/v1/advisor/clients/${selectedClient.id}/holdings/import-csv`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        showToast(`🎉 CSV Import Completed! Successfully imported ${result.imported_count} holdings.`, "success");
        setShowCsvModal(false);
        setCsvFile(null);
        handleSelectClient(selectedClient);
        fetchClients();
      } else {
        const errDetail = await res.json();
        showToast(`CSV Import Failed: ${errDetail.detail || "Check file layout."}`, "error");
      }
    } catch (err) {
      console.error("CSV import error:", err);
    } finally {
      setImportingCsv(false);
    }
  };

  const downloadCsvTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,ticker,shares,average_price\nRELIANCE,10,2450.50\nTCS,5,3200.00\nHDFCBANK,25,1600.00\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "client_holdings_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Save Branding Config ──────────────────────────────────────────────────
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranding(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/advisor/branding`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(branding),
      });

      if (res.ok) {
        showToast("🎨 Branding configuration updated successfully! All PDF and Print reports will now display this customization.", "success");
      } else {
        showToast("Failed to save branding customizations.", "error");
      }
    } catch (err) {
      console.error("Save branding error:", err);
    } finally {
      setSavingBranding(false);
    }
  };

  // ─── Portfolio Comparison Logic ────────────────────────────────────────────
  const handleToggleCompare = (clientId: number) => {
    setCompareIds((prev) => {
      if (prev.includes(clientId)) {
        return prev.filter((id) => id !== clientId);
      } else {
        if (prev.length >= 3) {
          showToast("You can compare a maximum of 3 clients side-by-side.", "error");
          return prev;
        }
        return [...prev, clientId];
      }
    });
  };

  const handleRunComparison = async () => {
    if (compareIds.length < 2) {
      showToast("Please select at least 2 clients for comparison.", "error");
      return;
    }
    setLoadingComparison(true);
    try {
      const results = [];
      for (const id of compareIds) {
        const clientObj = clients.find((c) => c.id === id);
        if (!clientObj) continue;

        // Fetch analysis
        const res = await fetch(`${apiUrl}/api/v1/advisor/clients/${id}/analysis`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        let details = {
          clientName: clientObj.name,
          email: clientObj.email,
          total_value: 0,
          total_cost: 0,
          total_pnl: 0,
          total_pnl_percentage: 0,
          risk_score: 50,
          diversification_score: 50,
          top_sector: "N/A",
          holdings_count: clientObj.holdings_count || 0
        };

        if (res.ok) {
          const analysis = await res.json();
          details.total_value = analysis.total_value;
          details.total_cost = analysis.total_cost;
          details.total_pnl = analysis.total_pnl;
          details.total_pnl_percentage = analysis.total_pnl_percentage;
          details.risk_score = analysis.risk_score;
          details.diversification_score = analysis.diversification_score;
          
          if (analysis.sector_allocations && analysis.sector_allocations.length > 0) {
            details.top_sector = analysis.sector_allocations[0].sector;
          }
        }
        results.push(details);
      }
      setComparisonData(results);
      setActiveTab("comparison");
    } catch (err) {
      console.error("Comparison load failure:", err);
    } finally {
      setLoadingComparison(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="h-8 w-8" color="text-electric-400" label="Verifying advisor credentials..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ── Ambient Background Glows ────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-10 left-10 h-[450px] w-[450px] rounded-full bg-emerald-500/[0.04] blur-[130px]" />
        <div className="absolute bottom-10 right-10 h-[350px] w-[350px] rounded-full bg-cyan-500/[0.04] blur-[110px]" />
      </div>

      {/* ── Main Container ───────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT PANEL: Tab navigation & client lists */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-4 space-y-1">
            <button
              onClick={() => setActiveTab("roster")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition ${
                activeTab === "roster" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" 
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              👥 Managed Client Roster
              <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {clients.length}/100
              </span>
            </button>
            <button
              onClick={() => {
                setActiveTab("risk");
                fetchRiskAlerts();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition ${
                activeTab === "risk" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" 
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              🚨 Risk Telemetry Alerts
              {riskAlerts.filter(a => a.severity === "high").length > 0 && (
                <span className="ml-auto bg-rose-500/20 text-rose-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {riskAlerts.filter(a => a.severity === "high").length} HIGH
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("branding")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition ${
                activeTab === "branding" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" 
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              🎨 White-Label Branding
            </button>
            <button
              onClick={() => {
                if (compareIds.length >= 2) handleRunComparison();
                else setActiveTab("comparison");
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition ${
                activeTab === "comparison" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" 
                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              ⚖️ Side-by-Side Comparison
              {compareIds.length > 0 && (
                <span className="ml-auto bg-cyan-500/20 text-cyan-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {compareIds.length} select
                </span>
              )}
            </button>
          </div>

          {/* Client Selection List (Only shown if we are in roster or comparison tabs) */}
          {(activeTab === "roster" || activeTab === "comparison") && (
            <div className="glass-card p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Select Client</span>
                <button
                  onClick={() => {
                    setNewClientName("");
                    setNewClientEmail("");
                    setNewClientNotes("");
                    setShowCreateModal(true);
                  }}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  + Add Client
                </button>
              </div>

              {clients.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">No managed clients added yet.</p>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {clients.map((c) => {
                    const isSelected = selectedClient?.id === c.id;
                    const isComparing = compareIds.includes(c.id);

                    return (
                      <div
                        key={c.id}
                        className={`p-3 rounded-xl border transition duration-300 relative group ${
                          isSelected 
                            ? "bg-emerald-500/10 border-emerald-500/30" 
                            : "bg-navy-900/50 border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div 
                          className="cursor-pointer"
                          onClick={() => handleSelectClient(c)}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                              {c.name}
                            </h4>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {c.holdings_count || 0} assets
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">{c.email}</p>
                        </div>

                        {/* Quick controls for comparison checkbox & delete */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                          <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-400 hover:text-white">
                            <input
                              type="checkbox"
                              checked={isComparing}
                              onChange={() => handleToggleCompare(c.id)}
                              className="rounded border-white/10 bg-navy-950 text-emerald-500 focus:ring-0 w-3 h-3"
                            />
                            Compare
                          </label>

                          <button
                            onClick={() => handleDeleteClient(c.id)}
                            className="text-[10px] text-rose-500 hover:text-rose-400 font-medium"
                          >
                            Delete Client
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {compareIds.length >= 2 && (
                <button
                  onClick={handleRunComparison}
                  className="w-full mt-2 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-white font-bold rounded-xl text-xs transition"
                >
                  ⚖️ Compare Selected ({compareIds.length})
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Dynamic content depending on active tab */}
        <div className="lg:col-span-3 space-y-6">

          {/* TAB 1: ROSTER & INDIVIDUAL CLIENT DETAILS */}
          {activeTab === "roster" && (
            <>
              {!selectedClient ? (
                <div className="glass-card p-12 text-center border border-dashed border-white/10 rounded-2xl flex flex-col justify-center items-center h-[450px]">
                  <span className="p-4 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 mb-4 animate-pulse">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 10.089 20a11.385 11.385 0 0 1-4.918-.763v-.109m0 0a9.38 9.38 0 0 1 2.625-.372 9.337 9.337 0 0 1 4.121-.952 4.125 4.125 0 0 1 7.533 2.493M10.089 20a11.38 11.38 0 0 1-5.111-1.2v-.007a4.125 4.125 0 0 1 7.532-2.492M9 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6-3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0ZM12 13.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                    </svg>
                  </span>
                  <h3 className="text-md font-bold text-white">No Client Selected</h3>
                  <p className="text-xs text-gray-500 mt-2 max-w-sm">
                    Select an advisor-managed client from the roster on the left or add a new profile to monitor analytical performance, import CSV portfolios, and generate custom branded Kundli reports.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Client Summary & Header */}
                  <div className="glass-card glow-border p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-cyan-500/5" />
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-extrabold text-white">{selectedClient.name}</h2>
                          <span className="badge-blue text-[10px]">MANAGED PORTFOLIO</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{selectedClient.email}</p>
                        {selectedClient.notes && (
                          <p className="text-xs text-gray-500 mt-2 bg-white/[0.02] border border-white/5 rounded-lg p-2 max-w-xl">
                            📝 {selectedClient.notes}
                          </p>
                        )}
                      </div>
                      
                      {/* Client Header Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setNewClientName(selectedClient.name);
                            setNewClientEmail(selectedClient.email);
                            setNewClientNotes(selectedClient.notes || "");
                            setShowEditClientModal(true);
                          }}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-gray-300 transition"
                        >
                          Edit Profile
                        </button>
                        <button
                          onClick={() => setShowCsvModal(true)}
                          className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-xs font-semibold text-emerald-400 border border-emerald-500/20 transition"
                        >
                          📥 Bulk CSV Import
                        </button>
                        <button
                          onClick={() => setShowAddHoldingModal(true)}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-white font-bold rounded-lg text-xs transition"
                        >
                          + Add Stock
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Valuation & Risk Overview Cards */}
                  {loadingClientDetails ? (
                    <div className="glass-card p-12 flex justify-center items-center">
                      <Spinner size="h-6 w-6" color="text-emerald-400" label="Analyzing portfolio metrics..." />
                    </div>
                  ) : (
                    <>
                      {selectedClientAnalysis && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="glass-card p-5 space-y-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Portfolio Value</span>
                            <h3 className="text-xl font-extrabold text-white font-mono">
                              ₹{selectedClientAnalysis.total_value?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <span className={`text-[11px] font-bold ${selectedClientAnalysis.total_pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                              {selectedClientAnalysis.total_pnl >= 0 ? "▲" : "▼"} ₹{Math.abs(selectedClientAnalysis.total_pnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })} ({selectedClientAnalysis.total_pnl_percentage?.toFixed(2)}%)
                            </span>
                          </div>

                          <div className="glass-card p-5 space-y-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Risk Assessment</span>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-extrabold text-white font-mono">
                                {selectedClientAnalysis.risk_score}/100
                              </h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                selectedClientAnalysis.risk_score >= 70 
                                  ? "bg-rose-500/20 text-rose-400" 
                                  : selectedClientAnalysis.risk_score >= 40 
                                  ? "bg-gold-500/20 text-gold-400" 
                                  : "bg-emerald-500/20 text-emerald-400"
                              }`}>
                                {selectedClientAnalysis.risk_score >= 70 ? "Aggressive" : selectedClientAnalysis.risk_score >= 40 ? "Moderate" : "Conservative"}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 block mt-1">Concentration Risk: <strong className="text-white">{selectedClientAnalysis.concentration_risk}</strong></span>
                          </div>

                          <div className="glass-card p-5 space-y-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Diversification Matrix</span>
                            <h3 className="text-xl font-extrabold text-white font-mono">
                              {selectedClientAnalysis.diversification_score}/100
                            </h3>
                            <span className="text-[10px] text-gray-400 block mt-1">
                              Sector allocations: <strong className="text-white">{selectedClientAnalysis.sector_allocations?.length || 0} categories</strong>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Holdings Table & Report Generators */}
                      <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Stock Holdings</h3>
                          <span className="text-[11px] text-gray-500 font-mono">{selectedClientHoldings.length} Positions</span>
                        </div>

                        {selectedClientHoldings.length === 0 ? (
                          <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl">
                            <p className="text-xs text-gray-500">This client currently holds no assets.</p>
                            <button
                              onClick={() => setShowAddHoldingModal(true)}
                              className="mt-4 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/20 rounded-lg text-[11px] transition"
                            >
                              Add First Position
                            </button>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="text-gray-500 border-b border-white/5">
                                  <th className="pb-3 font-semibold">Asset / Sector</th>
                                  <th className="pb-3 text-right font-semibold">Qty</th>
                                  <th className="pb-3 text-right font-semibold">Avg Cost</th>
                                  <th className="pb-3 text-right font-semibold">Current Price</th>
                                  <th className="pb-3 text-right font-semibold">Market Value</th>
                                  <th className="pb-3 text-right font-semibold">Unrealized P&L</th>
                                  <th className="pb-3 text-center font-semibold">Branded Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedClientHoldings.map((h) => {
                                  const isGain = h.pnl >= 0;

                                  return (
                                    <tr key={h.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                                      <td className="py-3.5">
                                        <div className="font-bold text-white font-mono">{h.company.ticker}</div>
                                        <div className="text-[10px] text-gray-500">{h.company.sector}</div>
                                      </td>
                                      <td className="py-3.5 text-right font-mono text-white">{h.shares}</td>
                                      <td className="py-3.5 text-right font-mono text-white">₹{h.average_price?.toFixed(2)}</td>
                                      <td className="py-3.5 text-right font-mono text-gray-300">₹{h.current_price?.toFixed(2)}</td>
                                      <td className="py-3.5 text-right font-mono text-white font-bold">₹{h.current_value?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                      <td className={`py-3.5 text-right font-mono font-bold ${isGain ? "text-emerald-400" : "text-rose-400"}`}>
                                        <div>{isGain ? "+" : ""}₹{h.pnl?.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                                        <div className="text-[10px]">{isGain ? "+" : ""}{h.pnl_percentage?.toFixed(2)}%</div>
                                      </td>
                                      <td className="py-3.5 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                          {/* PDF report download */}
                                          <a
                                            href={`${apiUrl}/api/v1/advisor/clients/${selectedClient.id}/reports/${h.company.ticker}/pdf?token=${token}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded transition flex items-center gap-0.5"
                                            title="Download Branded Analytical PDF"
                                          >
                                            📄 PDF
                                          </a>
                                          {/* HTML Print report */}
                                          <a
                                            href={`${apiUrl}/api/v1/advisor/clients/${selectedClient.id}/reports/${h.company.ticker}/print?token=${token}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded transition flex items-center gap-0.5"
                                            title="Open Print-Optimized Glass HTML Report"
                                          >
                                            🖨️ Print
                                          </a>
                                          
                                          <button
                                            onClick={() => handleDeleteHolding(h.id)}
                                            className="p-1 hover:bg-rose-500/10 rounded text-rose-500 transition ml-1"
                                            title="Delete Holding"
                                          >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                            </svg>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB 2: DETEORATING SIGNAL MONITORING & RISK telemetry ALERTS */}
          {activeTab === "risk" && (
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    🚨 Deteriorating Kundli Risk Matrix
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Direct multi-client telemetry capturing rapid rating drop-offs or emerging sentiment threats.
                  </p>
                </div>

                <button
                  onClick={fetchRiskAlerts}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-gray-300 transition"
                  disabled={loadingAlerts}
                >
                  {loadingAlerts ? "Syncing..." : "🔄 Force Sync Telemetry"}
                </button>
              </div>

              {loadingAlerts ? (
                <div className="py-12 flex justify-center items-center">
                  <Spinner size="h-6 w-6" color="text-electric-400" label="Scanning all client holdings..." />
                </div>
              ) : riskAlerts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl">
                  <span className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 inline-block mb-3">✓</span>
                  <p className="text-xs text-gray-300 font-semibold">Perfect Risk Health Checked</p>
                  <p className="text-[11px] text-gray-500 mt-1">No major score drop-offs or signal deteriorations identified across client holdings.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {riskAlerts.map((alert, idx) => {
                    return (
                      <div
                        key={idx}
                        className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition duration-300 ${
                          alert.severity === "high"
                            ? "bg-rose-500/[0.02] border-rose-500/20 hover:border-rose-500/40"
                            : alert.severity === "medium"
                            ? "bg-gold-500/[0.02] border-gold-500/20 hover:border-gold-500/40"
                            : "bg-navy-900/50 border-white/5 hover:border-white/15"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`p-2 rounded-lg text-xs font-bold font-mono mt-0.5 ${
                            alert.severity === "high" 
                              ? "bg-rose-500/10 text-rose-400" 
                              : alert.severity === "medium" 
                              ? "bg-gold-500/10 text-gold-400" 
                              : "bg-emerald-500/10 text-emerald-400"
                          }`}>
                            -{alert.deterioration} PTS
                          </span>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xs font-extrabold text-white font-mono">{alert.ticker}</h4>
                              <span className="text-[10px] text-gray-400">({alert.company_name})</span>
                              <span className="text-[10px] bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-full font-bold">
                                {alert.client_name}
                              </span>
                            </div>

                            <p className="text-xs text-gray-400 mt-1">
                              Score fell from <strong className="text-gray-300">{alert.previous_score}</strong> to <strong className="text-rose-400 font-bold">{alert.current_score}</strong>. Latest recommendation signal is <strong className="text-rose-400 uppercase font-bold">{alert.signal}</strong>.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                          <span className="text-[10px] text-gray-500 font-mono">
                            {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            onClick={() => {
                              const foundClient = clients.find(c => c.id === alert.client_id);
                              if (foundClient) {
                                handleSelectClient(foundClient);
                                setActiveTab("roster");
                              }
                            }}
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded text-[11px] font-bold text-gray-300 border border-white/5 transition"
                          >
                            Investigate Portfolio
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WHITE-LABEL BRANDING CUSTOMIZER & PREVIEW */}
          {activeTab === "branding" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Controls */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  🎨 White-Label Brand Configurations
                </h2>
                <p className="text-xs text-gray-500 mt-1 mb-6">
                  Set advisor branding colors and logo assets. This system replaces the default AI Stock Kundli headers with your custom styling for PDF report packages and print views.
                </p>

                <form onSubmit={handleSaveBranding} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1.5 uppercase">Corporate / Brand Name</label>
                    <input
                      type="text"
                      className="w-full bg-navy-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      value={branding.brand_name || ""}
                      onChange={(e) => setBranding(prev => ({ ...prev, brand_name: e.target.value }))}
                      placeholder="e.g. Acme Wealth Management"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1.5 uppercase">Logo Asset URL</label>
                    <input
                      type="text"
                      className="w-full bg-navy-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      value={branding.logo_url || ""}
                      onChange={(e) => setBranding(prev => ({ ...prev, logo_url: e.target.value }))}
                      placeholder="e.g. https://corp.com/logo.png"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 block mb-1.5 uppercase">Primary Theme Color</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          className="bg-transparent border-0 w-8 h-8 rounded cursor-pointer p-0 shrink-0"
                          value={branding.brand_color || "#10b981"}
                          onChange={(e) => setBranding(prev => ({ ...prev, brand_color: e.target.value }))}
                        />
                        <input
                          type="text"
                          className="w-full bg-navy-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                          value={branding.brand_color || "#10b981"}
                          onChange={(e) => setBranding(prev => ({ ...prev, brand_color: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-400 block mb-1.5 uppercase">Secondary Accent Color</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          className="bg-transparent border-0 w-8 h-8 rounded cursor-pointer p-0 shrink-0"
                          value={branding.brand_color_secondary || "#06b6d4"}
                          onChange={(e) => setBranding(prev => ({ ...prev, brand_color_secondary: e.target.value }))}
                        />
                        <input
                          type="text"
                          className="w-full bg-navy-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                          value={branding.brand_color_secondary || "#06b6d4"}
                          onChange={(e) => setBranding(prev => ({ ...prev, brand_color_secondary: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-white font-bold rounded-xl text-xs transition"
                    disabled={savingBranding}
                  >
                    {savingBranding ? "Saving configuration..." : "Save Branding Layout"}
                  </button>
                </form>
              </div>

              {/* Real-time PDF / HTML Preview Frame */}
              <div className="glass-card p-6 flex flex-col">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">REAL-TIME REPORT HEADER PREVIEW</span>
                <h3 className="text-md font-bold text-white mb-4">Branded Visual Preview</h3>

                <div className="border border-white/5 rounded-2xl bg-white/[0.01] p-6 flex-1 flex flex-col justify-center">
                  <div className="rounded-xl border border-white/10 overflow-hidden bg-navy-950 p-6 space-y-4">
                    {/* Header bar mirroring branding */}
                    <div 
                      className="p-4 rounded-xl flex items-center justify-between border transition duration-300"
                      style={{ 
                        borderColor: `${branding.brand_color}40`,
                        background: `linear-gradient(135deg, ${branding.brand_color}10, ${branding.brand_color_secondary}10)`
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {branding.logo_url ? (
                          <img 
                            src={branding.logo_url} 
                            alt="Logo" 
                            className="h-8 w-auto object-contain error-fallback"
                            onError={(e) => {
                              // If image fails, replace with dynamic circle
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div 
                            className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white text-xs transition"
                            style={{ backgroundColor: branding.brand_color || "#10b981" }}
                          >
                            {branding.brand_name ? branding.brand_name.charAt(0) : "W"}
                          </div>
                        )}
                        <div>
                          <h4 
                            className="text-xs font-bold transition"
                            style={{ color: branding.brand_color || "#10b981" }}
                          >
                            {branding.brand_name || "Wealth Advisory Corporation"}
                          </h4>
                          <p className="text-[9px] text-gray-500">Premium Wealth Advisory Analysis Report</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-white font-mono">STOCK KUNDLI</span>
                        <p className="text-[8px] text-gray-600">Confidential Analytical Signal</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="h-2 w-1/3 rounded bg-white/10" />
                      <div className="h-2 w-full rounded bg-white/5" />
                      <div className="h-2 w-5/6 rounded bg-white/5" />
                    </div>

                    <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[8px] text-gray-500">
                      <span>Compiled for: client_roster_preview@gmail.com</span>
                      <span className="font-mono" style={{ color: branding.brand_color_secondary || "#06b6d4" }}>
                        Active Signal: Buy (Score: 84)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: SIDE-BY-SIDE PORTFOLIO COMPARISON TOOL */}
          {activeTab === "comparison" && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                ⚖️ Advisor Portfolio Comparison Matrix
              </h2>
              <p className="text-xs text-gray-500 mt-1 mb-6">
                Compare multi-client holdings, sector concentration indexes, average risk scoring, and P&L results side-by-side.
              </p>

              {loadingComparison ? (
                <div className="py-12 flex justify-center items-center">
                  <Spinner size="h-6 w-6" color="text-cyan-400" label="Compiling side-by-side metrics..." />
                </div>
              ) : comparisonData.length < 2 ? (
                <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl">
                  <span className="text-2xl mb-3 block">⚖️</span>
                  <p className="text-xs text-gray-300 font-semibold">Insufficient Comparison Clients Selected</p>
                  <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
                    Select 2 or 3 client checkboxes from the left roster panel and click &quot;Compare Selected&quot; to inspect holdings weight, growth, and volatility side-by-side.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {comparisonData.map((data, idx) => {
                    const isGain = data.total_pnl >= 0;

                    return (
                      <div key={idx} className="glass-card p-5 space-y-4 border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
                        <div>
                          <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                            👤 {data.clientName}
                          </h3>
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">{data.email}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                          <div>
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Portfolio Value</span>
                            <span className="text-xs font-bold text-white font-mono">
                              ₹{data.total_value?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Total P&L</span>
                            <span className={`text-xs font-bold font-mono ${isGain ? "text-emerald-400" : "text-rose-400"}`}>
                              {isGain ? "+" : ""}₹{Math.abs(data.total_pnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-500">Unrealized Growth</span>
                            <span className={`font-bold font-mono ${isGain ? "text-emerald-400" : "text-rose-400"}`}>
                              {data.total_pnl_percentage?.toFixed(2)}%
                            </span>
                          </div>

                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-500">Volatilty Risk Score</span>
                            <span className="font-bold text-white font-mono">{data.risk_score}/100</span>
                          </div>

                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-500">Diversification Index</span>
                            <span className="font-bold text-white font-mono">{data.diversification_score}/100</span>
                          </div>

                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-500">Asset Variety</span>
                            <span className="font-bold text-white font-mono">{data.holdings_count} tickers</span>
                          </div>

                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-500">Primary Sector Focus</span>
                            <span className="font-bold text-gray-300 truncate max-w-[120px]">{data.top_sector}</span>
                          </div>
                        </div>

                        <div className="pt-4">
                          <button
                            onClick={() => {
                              const foundClient = clients.find(c => c.name === data.clientName);
                              if (foundClient) handleSelectClient(foundClient);
                              setActiveTab("roster");
                            }}
                            className="w-full py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 font-bold rounded-lg text-[10px] transition text-center"
                          >
                            View Active Positions
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </main>

      {/* ─── MODAL 1: Create client profile ────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card glow-border w-full max-w-md p-6 relative overflow-hidden">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Create Client Profile</h3>
            
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Client Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-navy-950/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full bg-navy-950/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="e.g. rajesh@kumarwealth.com"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Advisor Notes (Optional)</label>
                <textarea
                  className="w-full bg-navy-950/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-white h-20 focus:outline-none focus:border-emerald-500"
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  placeholder="e.g. Prefers large cap growth models; moderate risk tolerance."
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-white font-bold rounded-xl text-xs transition"
                disabled={submittingClient}
              >
                {submittingClient ? "Creating profile..." : "Save Profile"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Edit client profile ──────────────────────────────────────── */}
      {showEditClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card glow-border w-full max-w-md p-6 relative overflow-hidden">
            <button
              onClick={() => setShowEditClientModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Edit Client Profile</h3>
            
            <form onSubmit={handleEditClient} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Client Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-navy-950/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full bg-navy-950/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Advisor Notes</label>
                <textarea
                  className="w-full bg-navy-950/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-white h-20 focus:outline-none focus:border-emerald-500"
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-white font-bold rounded-xl text-xs transition"
                disabled={submittingClient}
              >
                {submittingClient ? "Updating profile..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Add stock holding manual ──────────────────────────────────── */}
      {showAddHoldingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card glow-border w-full max-w-md p-6 relative overflow-hidden">
            <button
              onClick={() => setShowAddHoldingModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Add Client Holding</h3>
            
            <form onSubmit={handleAddHolding} className="space-y-4">
              <div className="relative">
                <label className="text-xs text-gray-400 block mb-1">Company Stock Ticker</label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  className="w-full bg-navy-950/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  value={newHoldingTicker}
                  onChange={(e) => handleSearchTicker(e.target.value)}
                  placeholder="e.g. RELIANCE, TCS"
                />

                {/* Suggestions drop-down */}
                {showSuggestions && (
                  <div className="absolute left-0 right-0 mt-1 bg-navy-950 border border-white/10 rounded-xl max-h-40 overflow-y-auto z-50 p-1">
                    {loadingSuggestions ? (
                      <p className="text-[10px] text-gray-500 p-2">Searching stock codes...</p>
                    ) : tickerSuggestions.length === 0 ? (
                      <p className="text-[10px] text-gray-500 p-2">No matching stocks found.</p>
                    ) : (
                      tickerSuggestions.map((s) => (
                        <div
                          key={s.ticker}
                          onClick={() => handleSelectSuggestion(s)}
                          className="p-2 hover:bg-white/5 text-[11px] text-white cursor-pointer rounded-lg flex justify-between font-mono"
                        >
                          <span>{s.ticker} ({s.name})</span>
                          <span className="text-emerald-400">₹{s.current_price?.toFixed(1)}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Shares Count (Qty)</label>
                <input
                  type="number"
                  step="any"
                  min="0.0001"
                  max="99999999"
                  required
                  className="w-full bg-navy-950/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  value={newHoldingShares}
                  onChange={(e) => setNewHoldingShares(e.target.value)}
                  placeholder="e.g. 50"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Average Purchase Cost (INR)</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  max="9999999999"
                  required
                  className="w-full bg-navy-950/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  value={newHoldingPrice}
                  onChange={(e) => setNewHoldingPrice(e.target.value)}
                  placeholder="e.g. 2450.75"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-white font-bold rounded-xl text-xs transition"
                disabled={submittingHolding}
              >
                {submittingHolding ? "Saving holding..." : "Save Holding"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: Bulk CSV Import ───────────────────────────────────────────── */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card glow-border w-full max-w-md p-6 relative overflow-hidden">
            <button
              onClick={() => setShowCsvModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest">Bulk CSV Import</h3>
            <p className="text-xs text-gray-500 mb-4">
              Rapidly overwrite or populate this client portfolio using standard spreadsheets.
            </p>

            <div className="space-y-4">
              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="w-full py-2 border border-white/10 hover:bg-white/5 rounded-xl text-[11px] text-gray-300 font-bold transition flex items-center justify-center gap-1"
              >
                📥 Download Template CSV Layout
              </button>

              <form onSubmit={handleCsvImport} className="space-y-4 pt-2 border-t border-white/5">
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5 uppercase">Select CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    required
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-white font-bold rounded-xl text-xs transition"
                  disabled={importingCsv}
                >
                  {importingCsv ? "Parsing and importing holdings..." : "Submit File Import"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Premium Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-0 scale-100 ${
          toast.type === "success" 
            ? "bg-emerald-950/95 border-emerald-500/30 text-emerald-200 shadow-emerald-950/50" 
            : "bg-rose-950/95 border-rose-500/30 text-rose-200 shadow-rose-950/50"
        }`}>
          {toast.type === "success" ? (
            <span className="text-xl">✨</span>
          ) : (
            <span className="text-xl">⚠️</span>
          )}
          <span className="text-sm font-semibold tracking-wide">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
