"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Spinner from "../../../components/common/Spinner";
import Header from "../../../components/common/Header";

interface Company {
  id: number;
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  current_price: number;
}

interface TickerSuggestion {
  id: number;
  ticker: string;
  name: string;
  sector: string | null;
  exchange: string | null;
}

interface PortfolioHolding {
  id: number;
  user_id: number;
  company_id: number;
  shares: number;
  average_price: number;
  created_at: string;
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

interface StockCorrelation {
  ticker1: string;
  ticker2: string;
  correlation: number;
}

interface PortfolioAnalysis {
  total_value: number;
  total_cost: number;
  total_pnl: number;
  total_pnl_percentage: number;
  risk_score: number;
  diversification_score: number;
  concentration_risk: string;
  sector_allocations: SectorAllocation[];
  correlations: StockCorrelation[];
  correlation_alerts: string[];
  ai_advisor_report: string;
}

interface FitEvaluation {
  ticker: string;
  fit_score: number;
  recommendation: string;
  reasons: string[];
  sector: string;
  current_weight: number;
  prospective_weight: number;
}

interface PositionSizeResponse {
  ticker: string;
  company_name: string;
  risk_profile: string;
  entry_price: number;
  win_probability: number;
  reward_risk_ratio: number;
  kelly_fraction: number;
  suggested_allocation_amt: number;
  suggested_allocation_pct: number;
  suggested_shares: number;
  stop_loss_pct: number;
  take_profit_pct: number;
  stop_loss_price: number;
  take_profit_price: number;
  max_capital_risk_pct_allowed: number;
  max_capital_risk_amt_allowed: number;
  actual_capital_risk_amt: number;
  actual_capital_risk_pct: number;
  normal_drawdown_scenario: number;
  worst_case_drawdown_scenario: number;
  extreme_drawdown_scenario: number;
}

interface BuilderHoldingRecommendation {
  ticker: string;
  company_name: string;
  sector: string;
  price: number;
  allocation_pct: number;
  allocation_amt: number;
  shares: number;
  suggested_stop_loss_pct: number;
  suggested_take_profit_pct: number;
  stop_loss_price: number;
  take_profit_price: number;
  capital_at_risk_amt: number;
  capital_at_risk_pct: number;
  composite_score: number;
}

interface PortfolioBuilderResponse {
  total_capital: number;
  investable_capital: number;
  cash_reserve_amt: number;
  cash_reserve_pct: number;
  holdings: BuilderHoldingRecommendation[];
  portfolio_max_drawdown_amt: number;
  portfolio_max_drawdown_pct: number;
  worst_case_drawdown_amt: number;
  worst_case_drawdown_pct: number;
  extreme_drawdown_amt: number;
  extreme_drawdown_pct: number;
}


interface User {
  id: number;
  email: string;
  full_name: string | null;
  plan: string;
  is_verified: boolean;
  created_at: string;
}

const renderInlineItalic = (text: string) => {
  const parts = text.split(/(\*.*?\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={idx} className="italic text-gray-200">{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

const renderInline = (text: string, isHeader: boolean = false) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={idx} className={isHeader ? "font-extrabold text-emerald-300" : "font-extrabold text-white"}>
          {renderInlineItalic(boldText)}
        </strong>
      );
    }
    return renderInlineItalic(part);
  });
};

export default function PortfolioPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);

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
  
  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // Manual Add State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTicker, setNewTicker] = useState("");
  const [newShares, setNewShares] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [adding, setAdding] = useState(false);
  // Ticker autocomplete for Add modal
  const [tickerSuggestions, setTickerSuggestions] = useState<TickerSuggestion[]>([]);
  const [showTickerDropdown, setShowTickerDropdown] = useState(false);
  const [tickerSearching, setTickerSearching] = useState(false);
  const tickerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Edit Holding State
  const [editingHoldingId, setEditingHoldingId] = useState<number | null>(null);
  const [editShares, setEditShares] = useState("");
  const [editPrice, setEditPrice] = useState("");

  // Stock Fit Checker State
  const [fitTicker, setFitTicker] = useState("");
  const [fitEvaluation, setFitEvaluation] = useState<FitEvaluation | null>(null);
  const [evaluatingFit, setEvaluatingFit] = useState(false);
  // Ticker autocomplete for Fit Checker
  const [fitSuggestions, setFitSuggestions] = useState<TickerSuggestion[]>([]);
  const [showFitDropdown, setShowFitDropdown] = useState(false);
  const [fitSearching, setFitSearching] = useState(false);
  const fitDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<"holdings" | "calculator" | "builder">("holdings");

  // Position Sizing Calculator State
  const [calcTicker, setCalcTicker] = useState("");
  const [calcCapital, setCalcCapital] = useState("100000");
  const [calcRiskProfile, setCalcRiskProfile] = useState("moderate");
  const [calcStopLossPct, setCalcStopLossPct] = useState("8.0");
  const [calcTakeProfitPct, setCalcTakeProfitPct] = useState("24.0");
  const [calcManualPrice, setCalcManualPrice] = useState("");
  const [calcResult, setCalcResult] = useState<PositionSizeResponse | null>(null);
  const [calculating, setCalculating] = useState(false);
  // Autocomplete suggestions
  const [calcSuggestions, setCalcSuggestions] = useState<TickerSuggestion[]>([]);
  const [showCalcDropdown, setShowCalcDropdown] = useState(false);
  const [calcSearching, setCalcSearching] = useState(false);
  const calcDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Portfolio Builder Wizard State
  const [builderStep, setBuilderStep] = useState(1); // 1, 2, 3
  const [builderCapital, setBuilderCapital] = useState("100000");
  const [builderRiskProfile, setBuilderRiskProfile] = useState("moderate");
  const [builderHorizon, setBuilderHorizon] = useState("Medium-term");
  const [builderPreferences, setBuilderPreferences] = useState<string[]>([]);
  const [builderResult, setBuilderResult] = useState<PortfolioBuilderResponse | null>(null);
  const [building, setBuilding] = useState(false);
  const [applyingBuilder, setApplyingBuilder] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // ─── Ticker Search Helper ───────────────────────────────────────────────────
  const searchTickers = useCallback(async (q: string): Promise<TickerSuggestion[]> => {
    if (!q || q.length < 1) return [];
    try {
      const res = await fetch(`${apiUrl}/api/v1/companies/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.results || []) as TickerSuggestion[];
    } catch {
      return [];
    }
  }, [apiUrl]);

  // Debounced handler for Add-modal ticker field
  const handleNewTickerChange = useCallback((val: string) => {
    setNewTicker(val.toUpperCase());
    if (tickerDebounceRef.current) clearTimeout(tickerDebounceRef.current);
    if (val.length < 1) { setTickerSuggestions([]); setShowTickerDropdown(false); return; }
    setTickerSearching(true);
    tickerDebounceRef.current = setTimeout(async () => {
      const results = await searchTickers(val);
      setTickerSuggestions(results);
      setShowTickerDropdown(results.length > 0);
      setTickerSearching(false);
    }, 300);
  }, [searchTickers]);

  // Debounced handler for Fit-checker ticker field
  const handleFitTickerChange = useCallback((val: string) => {
    setFitTicker(val.toUpperCase());
    if (fitDebounceRef.current) clearTimeout(fitDebounceRef.current);
    if (val.length < 1) { setFitSuggestions([]); setShowFitDropdown(false); return; }
    setFitSearching(true);
    fitDebounceRef.current = setTimeout(async () => {
      const results = await searchTickers(val);
      setFitSuggestions(results);
      setShowFitDropdown(results.length > 0);
      setFitSearching(false);
    }, 300);
  }, [searchTickers]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/");
  };

  const handleDownloadPDF = () => {
    if (!analysis?.ai_advisor_report) return;
    
    const reportContent = analysis.ai_advisor_report;
    
    const parseToHTML = (text: string) => {
      return text.split("\n\n").map(para => {
        let trimmed = para.trim();
        if (!trimmed) return "";
        
        const parseInline = (str: string) => {
          str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          str = str.replace(/\*(.*?)\*/g, '<em>$1</em>');
          return str;
        };
        
        if (trimmed.startsWith("###")) {
          return `<h3 style="color: #059669; font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.75rem; border-left: 3px solid #059669; padding-left: 0.5rem; font-family: sans-serif;">${parseInline(trimmed.replace("###", "").trim())}</h3>`;
        }
        if (trimmed.startsWith("##")) {
          return `<h2 style="color: #059669; font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; border-left: 4px solid #059669; padding-left: 0.5rem; font-family: sans-serif;">${parseInline(trimmed.replace("##", "").trim())}</h2>`;
        }
        if (trimmed.startsWith("#")) {
          return `<h1 style="color: #059669; font-size: 1.75rem; margin-top: 2rem; margin-bottom: 1rem; border-left: 4px solid #059669; padding-left: 0.5rem; font-family: sans-serif;">${parseInline(trimmed.replace("#", "").trim())}</h1>`;
        }
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          const items = trimmed.split("\n").map(li => {
            const itemText = li.replace(/^[\-\*\s]+/, "");
            return `<li style="margin-bottom: 0.5rem; line-height: 1.6;">${parseInline(itemText)}</li>`;
          }).join("");
          return `<ul style="padding-left: 1.5rem; margin-bottom: 1rem; color: #374151;">${items}</ul>`;
        }
        if (/^\d+\./.test(trimmed)) {
          const items = trimmed.split("\n").map(li => {
            const itemText = li.replace(/^\d+\.[\s]*/, "");
            return `<li style="margin-bottom: 0.5rem; line-height: 1.6;">${parseInline(itemText)}</li>`;
          }).join("");
          return `<ol style="padding-left: 1.5rem; margin-bottom: 1rem; color: #374151;">${items}</ol>`;
        }
        
        return `<p style="margin-bottom: 1rem; line-height: 1.6; color: #374151;">${parseInline(trimmed)}</p>`;
      }).join("");
    };

    const formattedHTML = parseToHTML(reportContent);
    const clientName = user ? (user.full_name || user.email) : "Valued Investor";
    
    // Create temporary hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;
    
    iframeDoc.write(`
      <html>
        <head>
          <title>AI Portfolio Wealth Advisor Report - ${clientName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #1f2937;
              line-height: 1.6;
              max-width: 800px;
              margin: 40px auto;
              padding: 0 20px;
            }
            .header {
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #111827;
              margin: 0;
            }
            .subtitle {
              font-size: 14px;
              color: #6b7280;
              margin-top: 5px;
            }
            .timestamp {
              font-size: 12px;
              color: #4b5563;
              text-align: right;
              line-height: 1.4;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
              font-size: 11px;
              color: #9ca3af;
              text-align: center;
              line-height: 1.4;
            }
            strong {
              color: #111827;
              font-weight: 700;
            }
            h1, h2, h3 {
              page-break-after: avoid;
            }
            @media print {
              body {
                margin: 20px auto;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">AI Portfolio Wealth Advisor</h1>
              <div class="subtitle">Custom Portfolio Strategy & Investment Report</div>
            </div>
            <div class="timestamp">
              <strong>Prepared for:</strong> ${clientName}<br>
              <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}<br>
              <strong>Time:</strong> ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          
          <div class="content">
            ${formattedHTML}
          </div>
          
          <div class="footer">
            Disclaimer: This is an AI-synthesized wealth advisory report based on your portfolio holdings. 
            All suggestions are for educational/informational purposes only. Please perform independent verification 
            or consult a SEBI registered investment advisor before executing trades.
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();
    
    // Focus and print the iframe content
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      
      // Remove the iframe after a short delay to allow print system dialog to run
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 100);
  };

  // Check auth and initial fetch
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setUser(data);
      })
      .catch((err) => {
        console.error("Auth check failed:", err);
        localStorage.removeItem("access_token");
        router.push("/login");
      });

    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Holdings
      const holdingsRes = await fetch(`${apiUrl}/api/v1/portfolio/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!holdingsRes.ok) throw new Error("Failed to fetch holdings");
      const holdingsData = await holdingsRes.ok ? await holdingsRes.json() : [];
      setHoldings(holdingsData);

      // 2. Fetch Portfolio Analysis Agent data
      const analysisRes = await fetch(`${apiUrl}/api/v1/portfolio/analysis`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (analysisRes.ok) {
        const analysisData = await analysisRes.json();
        setAnalysis(analysisData);
      }
    } catch (err) {
      console.error("Error loading portfolio data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker || !newShares || !newPrice) return;
    setAdding(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/portfolio/holding`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker: newTicker.trim().toUpperCase(),
          shares: parseFloat(newShares),
          average_price: parseFloat(newPrice),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to add holding");
      }

      setNewTicker("");
      setNewShares("");
      setNewPrice("");
      setShowAddModal(false);
      await fetchData(); // refresh stats and listings
    } catch (err: any) {
      showToast(err.message || "Could not add holding. Ticker might not be supported.", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleEditHolding = (holding: PortfolioHolding) => {
    setEditingHoldingId(holding.id);
    setEditShares(holding.shares.toString());
    setEditPrice(holding.average_price.toString());
  };

  const handleSaveEdit = async (holdingId: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/portfolio/holding/${holdingId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shares: parseFloat(editShares),
          average_price: parseFloat(editPrice),
        }),
      });

      if (!res.ok) throw new Error("Failed to update holding");
      setEditingHoldingId(null);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to update holding.", "error");
    }
  };

  const handleDeleteHolding = async (holdingId: number) => {
    if (!confirm("Are you sure you want to remove this stock from your portfolio?")) return;
    try {
      const res = await fetch(`${apiUrl}/api/v1/portfolio/holding/${holdingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete holding");
      await fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete holding.", "error");
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setImporting(true);
    
    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const res = await fetch(`${apiUrl}/api/v1/portfolio/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to import CSV");
      }

      setCsvFile(null);
      // Reset input element
      const fileInput = document.getElementById("csv-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      showToast("🎉 CSV portfolio holdings imported successfully!", "success");
      await fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to parse and enrich CSV tickers.", "error");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/portfolio/template`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to download CSV template");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "portfolio_template.csv");
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) link.parentNode.removeChild(link);
    } catch (err: any) {
      showToast(err.message || "Failed to download template.", "error");
    }
  };

  const handleCheckFit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fitTicker) return;
    setEvaluatingFit(true);
    try {
      const res = await fetch(
        `${apiUrl}/api/v1/portfolio/fit-check?ticker=${fitTicker.trim().toUpperCase()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Stock ticker fit evaluation failed.");
      const data = await res.json();
      setFitEvaluation(data);
    } catch (err: any) {
      showToast(err.message || "Ticker not supported for fit analytics.", "error");
    } finally {
      setEvaluatingFit(false);
    }
  };

  // Debounced handler for Calculator ticker field
  const handleCalcTickerChange = useCallback((val: string) => {
    setCalcTicker(val.toUpperCase());
    if (calcDebounceRef.current) clearTimeout(calcDebounceRef.current);
    if (val.length < 1) { setCalcSuggestions([]); setShowCalcDropdown(false); return; }
    setCalcSearching(true);
    calcDebounceRef.current = setTimeout(async () => {
      const results = await searchTickers(val);
      setCalcSuggestions(results);
      setShowCalcDropdown(results.length > 0);
      setCalcSearching(false);
    }, 300);
  }, [searchTickers]);

  const handleCalculatePositionSize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calcTicker) return;
    setCalculating(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/portfolio/position-size`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker: calcTicker.trim().toUpperCase(),
          total_capital: parseFloat(calcCapital),
          risk_profile: calcRiskProfile,
          stop_loss_pct: parseFloat(calcStopLossPct),
          take_profit_pct: parseFloat(calcTakeProfitPct),
          manual_price: calcManualPrice ? parseFloat(calcManualPrice) : null,
        }),
      });
      if (!res.ok) throw new Error("Could not calculate position size.");
      const data = await res.json();
      setCalcResult(data);
    } catch (err: any) {
      showToast(err.message || "Failed to calculate position sizing.", "error");
    } finally {
      setCalculating(false);
    }
  };

  const handleGenerateBuilder = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuilding(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/portfolio/builder`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          total_capital: parseFloat(builderCapital),
          risk_profile: builderRiskProfile,
          horizon: builderHorizon,
          preferences: builderPreferences.length > 0 ? builderPreferences : null,
        }),
      });
      if (!res.ok) throw new Error("Could not generate builder suggestions.");
      const data = await res.json();
      setBuilderResult(data);
      setBuilderStep(3);
    } catch (err: any) {
      showToast(err.message || "Failed to generate recommended portfolio.", "error");
    } finally {
      setBuilding(false);
    }
  };

  const handleApplyBuilderHoldings = async () => {
    if (!builderResult || builderResult.holdings.length === 0) return;
    setApplyingBuilder(true);
    try {
      const promises = builderResult.holdings.map((h) =>
        fetch(`${apiUrl}/api/v1/portfolio/holding`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticker: h.ticker,
            shares: h.shares,
            average_price: h.price,
          }),
        })
      );
      
      const responses = await Promise.all(promises);
      const allSuccess = responses.every((r) => r.ok);
      
      if (!allSuccess) {
        showToast("Some recommended holdings could not be added (possibly already present or pricing limits exceeded).", "error");
      } else {
        showToast("🎉 Successfully applied recommended holdings to your active portfolio!", "success");
      }
      
      await fetchData();
      setActiveTab("holdings");
      setBuilderResult(null);
      setBuilderStep(1);
    } catch (err: any) {
      showToast(err.message || "Failed to apply recommended portfolio.", "error");
    } finally {
      setApplyingBuilder(false);
    }
  };

  // Preset default values on profile switch for calculator
  useEffect(() => {
    if (calcRiskProfile === "conservative") {
      setCalcStopLossPct("5.0");
      setCalcTakeProfitPct("15.0");
    } else if (calcRiskProfile === "moderate") {
      setCalcStopLossPct("8.0");
      setCalcTakeProfitPct("24.0");
    } else if (calcRiskProfile === "aggressive") {
      setCalcStopLossPct("12.0");
      setCalcTakeProfitPct("36.0");
    }
  }, [calcRiskProfile]);


  // Helper colors for scores
  const getDiversificationColor = (score: number) => {
    if (score >= 70) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 40) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  const getRiskColor = (score: number) => {
    if (score <= 35) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score <= 65) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0f14] text-white flex flex-col justify-center items-center">
        <Spinner size="h-12 w-12" color="text-emerald-400" label="Compiling portfolio metrics & correlations..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090c] bg-radial bg-no-repeat bg-cover text-white font-sans">
      {/* Background Glows */}
      <div className="fixed top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[45vw] h-[45vw] bg-blue-500/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto space-y-8 p-6 lg:p-8">
        
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
              <span>/</span>
              <span className="text-gray-200">Portfolio Advisor</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
              AI Portfolio Wealth Advisor
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Multi-agent asset diversification scoring, pairwise daily returns correlation matrices, and custom wealth advice.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Add Stock Manually Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-[#08090c] hover:scale-[1.02] active:scale-[0.98] rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/10 flex items-center gap-2 transition-all duration-200"
            >
              <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Stock Manually
            </button>

            {/* Download CSV Template Button */}
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2"
              title="Download empty CSV template"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download CSV Template
            </button>
            
            {/* Custom Styled CSV Upload */}
            <form onSubmit={handleCsvImport} className="flex items-center gap-2">
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              
              {!csvFile ? (
                <label
                  htmlFor="csv-input"
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  Import CSV Portfolio
                </label>
              ) : (
                <div className="flex items-center gap-2 bg-[#0c101b] border border-emerald-500/30 px-3 py-1.5 rounded-xl shadow-lg shadow-emerald-950/20 animate-fade-in">
                  <div className="flex items-center gap-1.5 max-w-[150px] md:max-w-[200px]">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <span className="text-xs text-gray-200 font-mono truncate" title={csvFile.name}>
                      {csvFile.name}
                    </span>
                  </div>
                  
                  {/* Clear Selected File Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setCsvFile(null);
                      const fileInput = document.getElementById("csv-input") as HTMLInputElement;
                      if (fileInput) fileInput.value = "";
                    }}
                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-rose-400 transition"
                    title="Remove selected file"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <div className="h-4 w-px bg-white/10" />

                  {/* Upload Confirm Button */}
                  <button
                    type="submit"
                    disabled={importing}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    {importing ? "Uploading..." : "Upload"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 gap-2 pb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab("holdings")}
            className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === "holdings"
                ? "border-emerald-400 text-emerald-400 bg-white/5"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            My Portfolio & Analytics
          </button>
          <button
            onClick={() => setActiveTab("calculator")}
            className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === "calculator"
                ? "border-emerald-400 text-emerald-400 bg-white/5"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Position Sizing Calculator
          </button>
          <button
            onClick={() => setActiveTab("builder")}
            className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === "builder"
                ? "border-emerald-400 text-emerald-400 bg-white/5"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Portfolio Builder Wizard
          </button>
        </div>

        {activeTab === "holdings" && (
          <>
            {/* ── KEY PORTFOLIO KPIS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Total Portfolio Value */}
              <div className="relative group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:border-emerald-500/30 hover:shadow-emerald-500/5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Value</span>
                  <span className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </span>
                </div>
                <div className="text-2xl font-bold tracking-tight text-white mb-1">
                  ₹{analysis ? analysis.total_value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </div>
                <div className="text-gray-400 text-xs">
                  Cost: ₹{analysis ? analysis.total_cost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </div>
              </div>

              {/* Card 2: Total Return (PnL) */}
              <div className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl transition-all duration-300`}>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Total Gain / Loss</span>
                  <span className={`p-1.5 rounded-lg ${(analysis && analysis.total_pnl >= 0) ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28m-2.28 5.941L15.75 9.75M2.25 12h19.5" />
                    </svg>
                  </span>
                </div>
                <div className={`text-2xl font-bold tracking-tight ${(analysis && analysis.total_pnl >= 0) ? "text-emerald-400" : "text-rose-400"} mb-1`}>
                  {(analysis && analysis.total_pnl >= 0) ? "+" : ""}
                  ₹{analysis ? analysis.total_pnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </div>
                <div className={`text-xs ${(analysis && analysis.total_pnl >= 0) ? "text-emerald-500" : "text-rose-500"} font-medium`}>
                  {(analysis && analysis.total_pnl >= 0) ? "▲" : "▼"} {analysis ? analysis.total_pnl_percentage.toFixed(2) : "0.00"}%
                </div>
              </div>

              {/* Card 3: Diversification Score (HHI-based) */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl transition-all duration-300">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Diversification Score</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getDiversificationColor(analysis ? analysis.diversification_score : 100)}`}>
                    {analysis ? analysis.diversification_score.toFixed(0) : "100"}/100
                  </span>
                </div>
                <div className="text-2xl font-bold tracking-tight text-white mb-1">
                  {analysis ? analysis.diversification_score.toFixed(1) : "100"}
                </div>
                <div className="text-gray-400 text-xs truncate">
                  Exposure: {analysis ? analysis.concentration_risk : "N/A"}
                </div>
              </div>

              {/* Card 4: Portfolio Risk Score */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl transition-all duration-300">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Weighted Risk Score</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getRiskColor(analysis ? analysis.risk_score : 0)}`}>
                    {analysis ? analysis.risk_score.toFixed(0) : "0"}/100
                  </span>
                </div>
                <div className="text-2xl font-bold tracking-tight text-white mb-1">
                  {analysis ? analysis.risk_score.toFixed(1) : "0"}
                </div>
                <div className="text-gray-400 text-xs">
                  Risk Appetite Correlation: Healthy
                </div>
              </div>
            </div>

            {/* ── SECTOR EXPOSURE & CORRELATION ALERT LAYOUT ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sector Exposure Chart Panel */}
              <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-gray-200 mb-5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Sector Allocation Distribution
                </h3>
                
                {analysis && analysis.sector_allocations.length > 0 ? (
                  <div className="space-y-4">
                    {analysis.sector_allocations.map((sa, i) => (
                      <div key={sa.sector} className="space-y-1.5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-gray-300">{sa.sector}</span>
                          <div className="text-gray-400">
                            <span className="text-gray-200 font-bold mr-1">₹{sa.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                            ({sa.percentage.toFixed(1)}%)
                          </div>
                        </div>
                        {/* Horizontal Bar Chart Component */}
                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                            style={{ width: `${sa.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No sector details available. Add manual holdings or upload a CSV above to inspect sector exposure weights.
                  </div>
                )}
              </div>

              {/* Active Correlation Warnings & Multi-agent alerts */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    Active Correlation Warnings
                  </h3>
                  
                  {analysis && analysis.correlation_alerts.length > 0 ? (
                    <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                      {analysis.correlation_alerts.map((alert, index) => (
                        <div
                          key={index}
                          className="text-xs p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 leading-relaxed shadow-sm hover:bg-rose-500/10 transition"
                        >
                          {alert}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 text-sm">
                      ✨ Perfect stock selection! No highly-correlated pair risks identified in this portfolio setup.
                    </div>
                  )}
                </div>
                
                <div className="border-t border-white/10 mt-4 pt-4">
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>Pearson Coefficient Formula</span>
                    <span className="font-mono text-emerald-400">r = Cov(X,Y)/(Std(X)*Std(Y))</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── CURRENT PORTFOLIO HOLDINGS LIST ── */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  Active Portfolio Holdings ({holdings.length})
                </h3>
                <span className="text-xs text-gray-400 tracking-wide">
                  Live updates via Yahoo Finance ingestion pipelines.
                </span>
              </div>

              {holdings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider font-semibold bg-white/[0.02]">
                        <th className="px-6 py-4">Ticker</th>
                        <th className="px-6 py-4">Company</th>
                        <th className="px-6 py-4">Sector</th>
                        <th className="px-6 py-4 text-right">Shares</th>
                        <th className="px-6 py-4 text-right">Avg Cost</th>
                        <th className="px-6 py-4 text-right">Current Price</th>
                        <th className="px-6 py-4 text-right">Total Cost</th>
                        <th className="px-6 py-4 text-right">Current Value</th>
                        <th className="px-6 py-4 text-right">PnL</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {holdings.map((h) => {
                        const isEditing = editingHoldingId === h.id;
                        const gainLoss = h.pnl >= 0;

                        return (
                          <tr key={h.id} className="hover:bg-white/[0.02] transition">
                            <td className="px-6 py-4 font-mono font-bold text-emerald-400">{h.company.ticker}</td>
                            <td className="px-6 py-4 text-gray-300 font-medium">{h.company.name}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
                                {h.company.sector || "Other"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-mono">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.0001"
                                  value={editShares}
                                  onChange={(e) => setEditShares(e.target.value)}
                                  className="w-20 bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-right font-mono focus:outline-none focus:border-emerald-500"
                                />
                              ) : (
                                h.shares.toFixed(2)
                              )}
                            </td>
                            <td className="px-6 py-4 text-right font-mono">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  className="w-24 bg-white/10 border border-white/20 rounded px-1.5 py-0.5 text-right font-mono focus:outline-none focus:border-emerald-500"
                                />
                              ) : (
                                `₹${h.average_price.toFixed(2)}`
                              )}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-gray-300">
                              ₹{h.current_price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-gray-400">
                              ₹{h.total_cost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-gray-200 font-semibold">
                              ₹{h.current_value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-right font-mono">
                              <div className={`font-semibold ${gainLoss ? "text-emerald-400" : "text-rose-400"}`}>
                                {gainLoss ? "+" : ""}
                                ₹{h.pnl.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <span className={`text-xs ${gainLoss ? "text-emerald-500" : "text-rose-500"}`}>
                                {gainLoss ? "▲" : "▼"} {h.pnl_percentage.toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveEdit(h.id)}
                                      className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded transition"
                                      title="Save Changes"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => setEditingHoldingId(null)}
                                      className="p-1 text-gray-400 hover:bg-white/10 rounded transition"
                                      title="Cancel"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleEditHolding(h)}
                                      className="p-1 text-gray-400 hover:bg-white/10 hover:text-emerald-400 rounded transition"
                                      title="Edit shares or cost basis"
                                    >
                                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteHolding(h.id)}
                                      className="p-1 text-gray-400 hover:bg-white/10 hover:text-rose-400 rounded transition"
                                      title="Remove stock from portfolio"
                                    >
                                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.008 1.24l.885 1.77a2.25 2.25 0 0 0 2.007 1.24h1.98a2.25 2.25 0 0 0 2.007-1.24l.885-1.77a2.25 2.25 0 0 1 2.007-1.24h3.86m-18 0h18" />
                  </svg>
                  <p className="font-semibold text-gray-400 mb-1">Your portfolio is currently empty</p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                    Add stocks manually or upload a standard broker holdings CSV to generate complete multi-agent diversification and risk advisory indexes.
                  </p>
                </div>
              )}
            </div>

            {/* ── STOCK FIT ADVISOR & AI WEALTH REPORT LAYOUT ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Column 1: Dynamic Stock Fit Advisor */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                      </svg>
                    </span>
                    <h3 className="text-lg font-bold text-gray-200">Stock Fit Advisor</h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-5">
                    Buying a new equity? Check how it integrates into your existing holdings list. We analyze redundancy, sector correlation, and risk metrics dynamically.
                  </p>

                  <form onSubmit={handleCheckFit} className="flex flex-col gap-3 mb-6">
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Search ticker or company name…"
                            value={fitTicker}
                            autoComplete="off"
                            onChange={(e) => handleFitTickerChange(e.target.value)}
                            onFocus={() => { if (fitSuggestions.length > 0) setShowFitDropdown(true); }}
                            onBlur={() => setTimeout(() => setShowFitDropdown(false), 160)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold font-mono"
                          />
                          {fitSearching && (
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                              <Spinner size="w-4 h-4" color="text-emerald-400" />
                            </span>
                          )}
                        </div>
                        <button
                          type="submit"
                          disabled={evaluatingFit || !fitTicker}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-sm font-semibold rounded-xl transition"
                        >
                          {evaluatingFit ? "Evaluating..." : "Check Fit"}
                        </button>
                      </div>
                      {showFitDropdown && fitSuggestions.length > 0 && (
                        <ul className="absolute z-50 w-full mt-1 bg-[#141c2b] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                          {fitSuggestions.map((s) => (
                            <li
                              key={s.id}
                              onMouseDown={() => {
                                setFitTicker(s.ticker);
                                setShowFitDropdown(false);
                                setFitSuggestions([]);
                              }}
                              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-emerald-500/10 transition group"
                            >
                              <span className="font-mono font-bold text-emerald-400 text-sm w-24 shrink-0 group-hover:text-emerald-300">{s.ticker}</span>
                              <span className="text-gray-300 text-sm truncate">{s.name}</span>
                              {s.sector && <span className="ml-auto text-xs text-gray-500 shrink-0">{s.sector}</span>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </form>


                  {fitEvaluation ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-xl font-bold font-mono text-emerald-400">{fitEvaluation.ticker}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-extrabold border ${fitEvaluation.fit_score >= 70 ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/5" : "text-amber-400 border-amber-500/25 bg-amber-500/5"}`}>
                          {fitEvaluation.fit_score}/100 Fit Score
                        </span>
                      </div>

                      <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Verdit</div>
                        <p className="text-sm font-semibold text-gray-100">{fitEvaluation.recommendation}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Impact Analytics</div>
                        <div className="flex justify-between items-center text-xs text-gray-300 bg-white/[0.02] px-3 py-2 rounded-lg border border-white/5">
                          <span>Sectors Concentration Weight:</span>
                          <span className="font-semibold text-emerald-400">{fitEvaluation.sector}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-300 bg-white/[0.02] px-3 py-2 rounded-lg border border-white/5">
                          <span>Holding Weights Change:</span>
                          <span className="font-mono font-semibold text-gray-300">
                            {fitEvaluation.current_weight.toFixed(1)}% → <span className="text-teal-400">{fitEvaluation.prospective_weight.toFixed(1)}%</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500 text-xs">
                      🔍 Awaiting ticker input to evaluate portfolio correlation fits.
                    </div>
                  )}
                </div>

                {fitEvaluation && fitEvaluation.reasons.length > 0 && (
                  <div className="border-t border-white/10 mt-4 pt-4">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Key Reasons & Constraints</div>
                    <ul className="space-y-1.5">
                      {fitEvaluation.reasons.map((r, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5 leading-relaxed">
                          <span className="text-emerald-400 shrink-0">✔</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Column 2 & 3: Custom senior agentic reports */}
              <div className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div className="flex items-start gap-3 mb-5 border-b border-white/10 pb-4 w-full">
                  <div className="flex justify-between items-start w-full">
                    <div className="flex items-start gap-3">
                      <span className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                        </svg>
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-gray-200">AI Advisor Portfolio Report</h3>
                        <span className="text-xs text-gray-400">Custom Hinglish advisory synthesized by senior multi-agent strategists.</span>
                      </div>
                    </div>
                    {analysis && (
                      <button
                        onClick={handleDownloadPDF}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
                        title="Download report as PDF"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Download PDF
                      </button>
                    )}
                  </div>
                </div>

                {analysis ? (
                  <div className="flex-1 max-h-[460px] overflow-y-auto text-sm text-gray-300 leading-relaxed space-y-4 pr-1 scrollbar-thin">
                    {/* Processed Markdown Report */}
                    {analysis.ai_advisor_report.split("\n\n").map((para, pIdx) => {
                      if (para.startsWith("###")) {
                        return (
                          <h4 key={pIdx} className="text-base font-extrabold text-emerald-400 mt-5 mb-2.5 border-l-2 border-emerald-500 pl-2">
                            {renderInline(para.replace("###", "").trim(), true)}
                          </h4>
                        );
                      }
                      if (para.startsWith("##")) {
                        return (
                          <h3 key={pIdx} className="text-lg font-extrabold text-emerald-400 mt-6 mb-3 border-l-2 border-emerald-500 pl-2">
                            {renderInline(para.replace("##", "").trim(), true)}
                          </h3>
                        );
                      }
                      if (para.startsWith("#")) {
                        return (
                          <h2 key={pIdx} className="text-xl font-extrabold text-emerald-400 mt-8 mb-4 border-l-2 border-emerald-500 pl-2">
                            {renderInline(para.replace("#", "").trim(), true)}
                          </h2>
                        );
                      }
                      if (para.startsWith("1.") || para.startsWith("2.") || para.startsWith("3.")) {
                        return (
                          <div key={pIdx} className="my-2 text-gray-200 pl-4 border-l border-white/10 italic">
                            {renderInline(para)}
                          </div>
                        );
                      }
                      if (para.startsWith("-") || para.startsWith("*")) {
                        return (
                          <ul key={pIdx} className="list-disc pl-5 space-y-1.5 text-gray-300">
                            {para.split("\n").map((li, lIdx) => (
                              <li key={lIdx}>{renderInline(li.replace(/^[\-\*\s]+/, ""))}</li>
                            ))}
                          </ul>
                        );
                      }
                      return <p key={pIdx} className="text-gray-300">{renderInline(para)}</p>;
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 text-gray-500 text-sm flex-1 flex flex-col justify-center items-center">
                    <svg className="w-10 h-10 text-gray-600 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    Upload holdings to receive customized SEBI-styled AI wealth strategy recommendations.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "calculator" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel: Inputs */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-200 mb-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Position Calculator
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Calculate the mathematically optimal size for your next trade using fractional Kelly Criterion and dynamic risk profiles.
                </p>
              </div>

              <form onSubmit={handleCalculatePositionSize} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Investment Capital (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={calcCapital}
                    onChange={(e) => setCalcCapital(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Stock Ticker Symbol
                  </label>
                  <div className="relative">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        required
                        placeholder="Search ticker or company name…"
                        value={calcTicker}
                        onChange={(e) => handleCalcTickerChange(e.target.value)}
                        onFocus={() => { if (calcSuggestions.length > 0) setShowCalcDropdown(true); }}
                        onBlur={() => setTimeout(() => setShowCalcDropdown(false), 160)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 pr-8 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                      />
                      {calcSearching && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                          <Spinner size="w-4 h-4" color="text-emerald-400" />
                        </span>
                      )}
                    </div>
                    {showCalcDropdown && calcSuggestions.length > 0 && (
                      <ul className="absolute z-50 w-full mt-1 bg-[#141c2b] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                        {calcSuggestions.map((s) => (
                          <li
                            key={s.id}
                            onMouseDown={() => {
                              setCalcTicker(s.ticker);
                              setShowCalcDropdown(false);
                              setCalcSuggestions([]);
                            }}
                            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-emerald-500/10 transition group"
                          >
                            <span className="font-mono font-bold text-emerald-400 text-sm w-24 shrink-0 group-hover:text-emerald-300">{s.ticker}</span>
                            <span className="text-gray-300 text-sm truncate">{s.name}</span>
                            {s.sector && <span className="ml-auto text-xs text-gray-500 shrink-0">{s.sector}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Manual Price (Optional fallback ₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Auto-fetched if left blank"
                    value={calcManualPrice}
                    onChange={(e) => setCalcManualPrice(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {["conservative", "moderate", "aggressive"].map((profile) => (
                    <button
                      key={profile}
                      type="button"
                      onClick={() => setCalcRiskProfile(profile)}
                      className={`py-2 px-3 text-xs font-bold rounded-lg border capitalize transition ${
                        calcRiskProfile === profile
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {profile}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Stop-Loss (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={calcStopLossPct}
                      onChange={(e) => setCalcStopLossPct(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      Take-Profit (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={calcTakeProfitPct}
                      onChange={(e) => setCalcTakeProfitPct(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={calculating || !calcTicker}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 disabled:opacity-55 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex justify-center items-center gap-2"
                >
                  {calculating ? "Calculating Allocation Parameters..." : "Compute Sizing Guidance"}
                </button>
              </form>
            </div>

            {/* Right Panel: Results & Sizing Metrics */}
            <div className="lg:col-span-2 space-y-6">
              {calcResult ? (
                <div className="space-y-6">
                  {/* Summary Card */}
                  <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-6 shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 capitalize">
                          {calcResult.risk_profile} Risk Sizing
                        </span>
                        <h2 className="text-2xl font-extrabold text-white mt-1.5 font-mono">
                          {calcResult.ticker} : <span className="text-gray-300 text-lg font-sans font-medium">{calcResult.company_name}</span>
                        </h2>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Current / Entry Level</div>
                        <div className="text-xl font-bold font-mono text-emerald-400 font-mono">₹{calcResult.entry_price.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/10">
                      <div>
                        <div className="text-xs text-gray-400">Suggested Share Quantity</div>
                        <div className="text-2xl font-bold text-white font-mono mt-0.5">{calcResult.suggested_shares} Units</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Suggested Allocation</div>
                        <div className="text-2xl font-bold text-emerald-400 font-mono mt-0.5">₹{calcResult.suggested_allocation_amt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                        <div className="text-xs text-emerald-500 font-medium">({calcResult.suggested_allocation_pct.toFixed(2)}% of capital)</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Stop Loss / Target Boundaries</div>
                        <div className="text-sm font-bold text-rose-400 font-mono mt-1">SL: ₹{calcResult.stop_loss_price.toFixed(2)} (-{calcResult.stop_loss_pct}%)</div>
                        <div className="text-sm font-bold text-emerald-400 font-mono">TP: ₹{calcResult.take_profit_price.toFixed(2)} (+{calcResult.take_profit_pct}%)</div>
                      </div>
                    </div>
                  </div>

                  {/* Math Sizing Details (Kelly Model) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Win Probability (p)</div>
                      <div className="text-3xl font-extrabold text-teal-400 font-mono">{(calcResult.win_probability * 100).toFixed(0)}%</div>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        Inferred probability based on technical trend indicators and fundamentals.
                      </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Payout Odds Ratio (b)</div>
                      <div className="text-3xl font-extrabold text-blue-400 font-mono">{calcResult.reward_risk_ratio.toFixed(2)}:1</div>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        Reward to risk ratio. An odds-ratio greater than 2:1 is highly favorable.
                      </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Raw Kelly Fraction</div>
                      <div className="text-3xl font-extrabold text-purple-400 font-mono">{(calcResult.kelly_fraction * 100).toFixed(1)}%</div>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        Pure Kelly sizing recommendation before fractional scaling and safety caps.
                      </p>
                    </div>
                  </div>

                  {/* Capital at Risk Visualizer */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg">
                    <h4 className="text-sm font-bold text-gray-200 mb-4 flex items-center justify-between">
                      <span>Maximum Safe Capital at Risk Constraint</span>
                      <span className="text-emerald-400 font-mono">₹{calcResult.actual_capital_risk_amt.toLocaleString("en-IN", { maximumFractionDigits: 2 })} ({calcResult.actual_capital_risk_pct.toFixed(2)}%)</span>
                    </h4>
                    
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between text-xs text-gray-400">
                        <span>Actual Sizing Risk: {calcResult.actual_capital_risk_pct.toFixed(2)}%</span>
                        <span>Maximum Allowed Safety Cap: {calcResult.max_capital_risk_pct_allowed}%</span>
                      </div>
                      <div className="overflow-hidden h-3 text-xs flex rounded-full bg-white/5 border border-white/10">
                        <div
                          style={{ width: `${Math.min(100, (calcResult.actual_capital_risk_pct / calcResult.max_capital_risk_pct_allowed) * 100)}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 to-teal-400"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                      💡 Even if Kelly mathematics suggest a higher allocation, we strictly enforce a hard safety cap of <strong>{calcResult.max_capital_risk_pct_allowed}%</strong> of total capital at risk per trade to insulate your portfolio against black-swan occurrences.
                    </p>
                  </div>

                  {/* Expected Drawdown Risk Scenarios */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      Expected Trade Drawdown Risk Scenarios
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Normal Stop Loss Scenario */}
                      <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                        <div className="text-xs text-gray-400 font-semibold mb-1">Normal Loss Scenario</div>
                        <div className="text-xl font-bold text-gray-200 font-mono">₹{calcResult.normal_drawdown_scenario.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Calculated based on standard stop-loss hit without severe slippage.
                        </p>
                      </div>

                      {/* Worst Case Slippage Scenario */}
                      <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/5">
                        <div className="text-xs text-rose-400 font-semibold mb-1">Worst-case Slippage</div>
                        <div className="text-xl font-bold text-rose-400 font-mono">₹{calcResult.worst_case_drawdown_scenario.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                        <p className="text-[11px] text-rose-500/70 mt-1">
                          Calculated under high-volatility conditions with 5% overnight gap down.
                        </p>
                      </div>

                      {/* Extreme Market Correction */}
                      <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-900/15">
                        <div className="text-xs text-rose-300 font-semibold mb-1">Extreme Systemic Crash</div>
                        <div className="text-xl font-bold text-rose-300 font-mono">₹{calcResult.extreme_drawdown_scenario.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                        <p className="text-[11px] text-rose-300/60 mt-1">
                          Extreme black-swan market event causing automatic asset devaluation up to 25%.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-gray-500 h-full flex flex-col justify-center items-center min-h-[400px]">
                  <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                  </svg>
                  <h4 className="text-base font-bold text-gray-400 mb-1">Awaiting Calculation Input</h4>
                  <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                    Select a stock, input your total capital amount, and hit compute to evaluate maximum safe fractional Kelly sizes.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "builder" && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl space-y-8">
            {/* Step Wizard Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </span>
                  AI Smart Portfolio Builder
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Step-by-step model portfolio generator. Instantly selects 4-8 high-scoring equities customized to your profile.
                </p>
              </div>

              {/* Steps indicators */}
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      builderStep === step
                        ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                        : builderStep > step
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-white/5 text-gray-400 border border-white/10"
                    }`}>
                      {step}
                    </span>
                    {step < 3 && <div className={`w-8 h-0.5 ${builderStep > step ? "bg-emerald-500/40" : "bg-white/5"}`} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 1: Core Financial Parameters */}
            {builderStep === 1 && (
              <div className="max-w-xl mx-auto space-y-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Total Capital Budget (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={builderCapital}
                      onChange={(e) => setBuilderCapital(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Risk Profile
                      </label>
                      <select
                        value={builderRiskProfile}
                        onChange={(e) => setBuilderRiskProfile(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="conservative" className="bg-[#12151d]">Conservative (Safety first)</option>
                        <option value="moderate" className="bg-[#12151d]">Moderate (Balanced growth)</option>
                        <option value="aggressive" className="bg-[#12151d]">Aggressive (Maximize Kelly payout)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Investment Horizon
                      </label>
                      <select
                        value={builderHorizon}
                        onChange={(e) => setBuilderHorizon(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Short-term" className="bg-[#12151d]">Short-term (&lt; 1 year)</option>
                        <option value="Medium-term" className="bg-[#12151d]">Medium-term (1-3 years)</option>
                        <option value="Long-term" className="bg-[#12151d]">Long-term (3+ years)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setBuilderStep(2)}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition"
                  >
                    Next: Sector Focus Preferences →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Sector Preference Preferences */}
            {builderStep === 2 && (
              <div className="max-w-2xl mx-auto space-y-6 py-4">
                <div className="text-center space-y-2">
                  <h4 className="text-base font-bold text-gray-200">Personalize Your Focus Theme</h4>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    Select one or more sectors you are highly optimistic about to prioritize allocation in those verticals (optional).
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    "Technology",
                    "Financial Services",
                    "Healthcare",
                    "Energy",
                    "Consumer Defensive",
                    "Consumer Cyclical",
                    "Industrials",
                    "Basic Materials",
                    "Utilities",
                  ].map((sector) => {
                    const isSelected = builderPreferences.includes(sector);
                    return (
                      <button
                        key={sector}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setBuilderPreferences(builderPreferences.filter((p) => p !== sector));
                          } else {
                            setBuilderPreferences([...builderPreferences, sector]);
                          }
                        }}
                        className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                          isSelected
                            ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/5"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {sector}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setBuilderStep(1)}
                    className="px-5 py-3 border border-white/10 hover:bg-white/5 rounded-xl font-semibold text-sm transition"
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerateBuilder}
                    disabled={building}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 disabled:opacity-55 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition"
                  >
                    {building ? "Synthesizing Model Portfolio..." : "Construct Model Portfolio 🚀"}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Model Portfolio Recommendations & Verification */}
            {builderStep === 3 && builderResult && (
              <div className="space-y-8">
                {/* Cash Reserve Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gradient-to-br from-[#121622] to-[#0c0d12] border border-white/10 rounded-2xl p-6 shadow-xl">
                  <div className="md:col-span-2 space-y-3">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Mandatory Safe Cash Reserve</div>
                    <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                      ₹{builderResult.cash_reserve_amt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      <span className="text-sm font-sans font-medium text-gray-400 ml-2">({builderResult.cash_reserve_pct}% of capital reserved)</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2.5 bg-white/5 border border-white/15 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${builderResult.cash_reserve_pct}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col justify-center">
                    <div className="text-xs text-gray-400 font-semibold mb-1">Total Investable Capital</div>
                    <div className="text-xl font-bold font-mono text-white">₹{builderResult.investable_capital.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                  </div>
                </div>

                {/* Recommendations Table */}
                <div className="bg-white/5 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center">
                    <h4 className="text-base font-bold text-gray-200">Chosen Portfolio Constituents</h4>
                    <span className="text-xs text-gray-400">Total Holdings: {builderResult.holdings.length} equities</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider font-semibold bg-white/[0.02]">
                          <th className="px-6 py-4">Symbol</th>
                          <th className="px-6 py-4">Company Name</th>
                          <th className="px-6 py-4 text-right">Model Weight</th>
                          <th className="px-6 py-4 text-right">Price</th>
                          <th className="px-6 py-4 text-right">Allocated Amount</th>
                          <th className="px-6 py-4 text-right">Shares</th>
                          <th className="px-6 py-4 text-center">Stop Loss</th>
                          <th className="px-6 py-4 text-center">Take Profit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm">
                        {builderResult.holdings.map((rec) => (
                          <tr key={rec.ticker} className="hover:bg-white/[0.02] transition">
                            <td className="px-6 py-4 font-mono font-bold text-emerald-400">{rec.ticker}</td>
                            <td className="px-6 py-4 text-gray-300 font-medium">{rec.company_name}</td>
                            <td className="px-6 py-4 text-right font-semibold text-emerald-400 font-mono">{rec.allocation_pct.toFixed(1)}%</td>
                            <td className="px-6 py-4 text-right font-mono text-gray-300">₹{rec.price.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-mono text-gray-200">₹{rec.allocation_amt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-gray-300">{rec.shares}</td>
                            <td className="px-6 py-4 text-center text-rose-400 font-mono text-xs font-semibold font-mono">₹{rec.stop_loss_price.toFixed(2)} (-{rec.suggested_stop_loss_pct}%)</td>
                            <td className="px-6 py-4 text-center text-emerald-400 font-mono text-xs font-semibold font-mono">₹{rec.take_profit_price.toFixed(2)} (+{rec.suggested_take_profit_pct}%)</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Portfolio Maximum Drawdown Visualizer */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
                  <h4 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    Overall Model Portfolio Drawdown Projections
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 rounded-xl border border-white/5 bg-white/[0.02] space-y-1">
                      <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Normal Stop-Loss Drawdown</div>
                      <div className="text-2xl font-extrabold text-white font-mono">₹{builderResult.portfolio_max_drawdown_amt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                      <div className="text-xs text-emerald-500 font-medium">({builderResult.portfolio_max_drawdown_pct.toFixed(2)}% of total portfolio)</div>
                      <p className="text-[10px] text-gray-500 leading-relaxed mt-2">
                        Projected loss if stop-loss thresholds are hit cleanly under standard market liquidity.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl border border-rose-500/10 bg-rose-500/5 space-y-1">
                      <div className="text-xs text-rose-400 font-bold uppercase tracking-wider">Worst-Case Drawdown</div>
                      <div className="text-2xl font-extrabold text-rose-400 font-mono">₹{builderResult.worst_case_drawdown_amt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                      <div className="text-xs text-rose-500 font-medium">({builderResult.worst_case_drawdown_pct.toFixed(2)}% of total portfolio)</div>
                      <p className="text-[10px] text-rose-500/70 leading-relaxed mt-2">
                        Drawdown under volatile conditions incorporating 5% average slippage gaps on stop orders.
                      </p>
                    </div>

                    <div className="p-5 rounded-xl border border-rose-500/20 bg-rose-900/15 space-y-1">
                      <div className="text-xs text-rose-300 font-bold uppercase tracking-wider">Extreme Systemic Correction</div>
                      <div className="text-2xl font-extrabold text-rose-300 font-mono">₹{builderResult.extreme_drawdown_amt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                      <div className="text-xs text-rose-300 font-medium">({builderResult.extreme_drawdown_pct.toFixed(2)}% of total portfolio)</div>
                      <p className="text-[10px] text-rose-300/60 leading-relaxed mt-2">
                        Severe systemic black-swan correction model simulating up to 25% global equity decline.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Apply wizard choices */}
                <div className="pt-6 flex justify-between border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setBuilderStep(2)}
                    className="px-5 py-3 border border-white/10 hover:bg-white/5 rounded-xl font-semibold text-sm transition"
                  >
                    ← Modify Sector Focus
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyBuilderHoldings}
                    disabled={applyingBuilder}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 disabled:opacity-55 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
                  >
                    {applyingBuilder ? "Applying Recommended Allocations..." : "Confirm & Apply to Active Portfolio 📈"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MANUAL ADD DIALOG MODAL ── */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-[#06080a]/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#12151d] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Add Stock Holding</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleManualAdd} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Stock Ticker Symbol</label>
                  <div className="relative">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        placeholder="Search ticker or company name…"
                        value={newTicker}
                        onChange={(e) => handleNewTickerChange(e.target.value)}
                        onFocus={() => { if (tickerSuggestions.length > 0) setShowTickerDropdown(true); }}
                        onBlur={() => setTimeout(() => setShowTickerDropdown(false), 160)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 pr-8 text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold font-mono"
                      />
                      {tickerSearching && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                          <Spinner size="w-4 h-4" color="text-emerald-400" />
                        </span>
                      )}
                    </div>
                    {showTickerDropdown && tickerSuggestions.length > 0 && (
                      <ul className="absolute z-50 w-full mt-1 bg-[#141c2b] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                        {tickerSuggestions.map((s) => (
                          <li
                            key={s.id}
                            onMouseDown={() => {
                              setNewTicker(s.ticker);
                              setShowTickerDropdown(false);
                              setTickerSuggestions([]);
                            }}
                            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-emerald-500/10 transition group"
                          >
                            <span className="font-mono font-bold text-emerald-400 text-sm w-24 shrink-0 group-hover:text-emerald-300">{s.ticker}</span>
                            <span className="text-gray-300 text-sm truncate">{s.name}</span>
                            {s.sector && <span className="ml-auto text-xs text-gray-500 shrink-0">{s.sector}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Shares Quantity</label>
                    <input
                      type="number"
                      required
                      step="0.0001"
                      placeholder="e.g. 25"
                      value={newShares}
                      onChange={(e) => setNewShares(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Average Cost (₹)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      placeholder="e.g. 2420.50"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 border border-white/10 hover:bg-white/5 rounded-xl text-sm font-semibold tracking-wide transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 disabled:opacity-55 rounded-xl text-sm font-semibold tracking-wide shadow-lg shadow-emerald-500/20 transition"
                  >
                    {adding ? "Adding..." : "Add Holding"}
                  </button>
                </div>
              </form>
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
    </div>
  );
}
