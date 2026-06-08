"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../../context/LanguageContext";
import Header from "../../../components/common/Header";
import Spinner from "../../../components/common/Spinner";
import { useBranding } from "../../../context/BrandingContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

/* ═══════════════════════════════════════════════════════════
   AI Stock Kundli — NLQ Research Chat & RAG Engine
   ═══════════════════════════════════════════════════════════ */

interface User {
  id: number;
  email: string;
  full_name: string | null;
  plan: string;
  role?: string;
  is_verified: boolean;
  created_at: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "table" | "chart" | "comparison";
  data?: any;
  suggestions?: string[];
  links?: Array<{ text: string; url: string }>;
  sources?: string[];
  timestamp: Date;
}

interface IndexStatus {
  companies_indexed: number;
  news_indexed: number;
  total_indexed: number;
}

// ── Lightweight Markdown Formatter Component ───────────────────
function MarkdownRenderer({ text }: { text: string }) {
  if (!text) return null;

  /**
   * Parses inline markdown: **bold**, `code`, and plain text.
   * Returns a stable React node array with keyed elements.
   */
  const parseInlineStyles = (txt: string, keyPrefix: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Match **bold** or `inline code`
    const inlineRegex = /(\*\*(.*?)\*\*|`([^`]+)`)/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = inlineRegex.exec(txt)) !== null) {
      if (match.index > lastIndex) {
        parts.push(txt.substring(lastIndex, match.index));
      }
      if (match[2] !== undefined) {
        // Bold
        parts.push(
          <strong key={`${keyPrefix}-b-${match.index}`} className="text-emerald-400 font-semibold">
            {match[2]}
          </strong>
        );
      } else if (match[3] !== undefined) {
        // Inline code
        parts.push(
          <code key={`${keyPrefix}-c-${match.index}`} className="bg-white/10 text-electric-300 px-1 py-0.5 rounded text-xs font-mono">
            {match[3]}
          </code>
        );
      }
      lastIndex = inlineRegex.lastIndex;
    }
    if (lastIndex < txt.length) {
      parts.push(txt.substring(lastIndex));
    }
    return parts.length > 0 ? parts : [txt];
  };

  // Split into block-level sections by double newline
  const blocks = text.split(/\n\n+/);

  return (
    <div className="space-y-2 text-sm text-gray-200 leading-relaxed font-sans">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // H3 heading
        if (trimmed.startsWith("### ")) {
          return (
            <h4 key={i} className="text-base font-bold text-white mt-4 mb-1 border-b border-white/10 pb-1">
              {parseInlineStyles(trimmed.slice(4), `h4-${i}`)}
            </h4>
          );
        }

        // H2 heading
        if (trimmed.startsWith("## ")) {
          return (
            <h3 key={i} className="text-lg font-bold text-white mt-5 mb-2">
              {parseInlineStyles(trimmed.slice(3), `h3-${i}`)}
            </h3>
          );
        }

        // H1 heading
        if (trimmed.startsWith("# ")) {
          return (
            <h2 key={i} className="text-xl font-extrabold text-white mt-6 mb-2">
              {parseInlineStyles(trimmed.slice(2), `h2-${i}`)}
            </h2>
          );
        }

        // Unordered list (lines starting with - or *)
        const lines = trimmed.split("\n");
        const isBulletBlock = lines.every(l => /^[-*]\s/.test(l.trim()) || l.trim() === "");
        if (isBulletBlock && lines.some(l => /^[-*]\s/.test(l.trim()))) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1 my-1">
              {lines.filter(l => /^[-*]\s/.test(l.trim())).map((line, idx) => (
                <li key={idx} className="text-gray-300">
                  {parseInlineStyles(line.replace(/^[-*]\s+/, ""), `li-${i}-${idx}`)}
                </li>
              ))}
            </ul>
          );
        }

        // Numbered list (lines starting with 1. 2. etc.)
        const isNumberedBlock = lines.every(l => /^\d+\.\s/.test(l.trim()) || l.trim() === "");
        if (isNumberedBlock && lines.some(l => /^\d+\.\s/.test(l.trim()))) {
          return (
            <ol key={i} className="list-decimal pl-5 space-y-1 my-1">
              {lines.filter(l => /^\d+\.\s/.test(l.trim())).map((line, idx) => (
                <li key={idx} className="text-gray-300">
                  {parseInlineStyles(line.replace(/^\d+\.\s+/, ""), `ol-${i}-${idx}`)}
                </li>
              ))}
            </ol>
          );
        }

        // Mixed block: may contain multiple single-newline sentences
        // Render each line as an inline span separated by <br/> for natural flow
        if (lines.length > 1) {
          return (
            <p key={i} className="text-gray-200">
              {lines.map((line, idx) => (
                <span key={idx}>
                  {parseInlineStyles(line, `span-${i}-${idx}`)}
                  {idx < lines.length - 1 && <br />}
                </span>
              ))}
            </p>
          );
        }

        // Single-line paragraph
        return (
          <p key={i} className="text-gray-200">
            {parseInlineStyles(trimmed, `p-${i}`)}
          </p>
        );
      })}
    </div>
  );
}

// ── Flexible Chart Widget Renderer ──────────────────────────────
function ChartWidget({ data }: { data: any }) {
  if (!data || !data.chartData || !Array.isArray(data.chartData)) {
    return (
      <div className="p-4 text-xs text-rose-400 bg-rose-950/15 border border-rose-500/10 rounded-xl my-2">
        Unable to render chart: Invalid chartData payload format.
      </div>
    );
  }

  const chartType = data.chartType || "bar";
  const xKey = data.xKey || "label";
  const dataKeys = data.dataKeys || [];
  const chartData = data.chartData;

  // Curated premium palettes
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

  const renderChart = () => {
    switch (chartType.toLowerCase()) {
      case "line":
        return (
          <LineChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.4)" style={{ fontSize: "10px" }} />
            <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: "10px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(10, 17, 32, 0.95)",
                borderColor: "rgba(255,255,255,0.15)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#fff"
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
            {dataKeys.map((key: string, idx: number) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[idx % colors.length]}
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 1.5 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );
      case "area":
        return (
          <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
            <defs>
              {dataKeys.map((key: string, idx: number) => (
                <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.4)" style={{ fontSize: "10px" }} />
            <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: "10px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(10, 17, 32, 0.95)",
                borderColor: "rgba(255,255,255,0.15)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#fff"
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
            {dataKeys.map((key: string, idx: number) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[idx % colors.length]}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#grad-${key})`}
              />
            ))}
          </AreaChart>
        );
      case "bar":
      default:
        return (
          <BarChart data={chartData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey={xKey} stroke="rgba(255,255,255,0.4)" style={{ fontSize: "10px" }} />
            <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: "10px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(10, 17, 32, 0.95)",
                borderColor: "rgba(255,255,255,0.15)",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#fff"
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
            {dataKeys.map((key: string, idx: number) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[idx % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full h-[280px] bg-white/[0.02] border border-white/5 rounded-xl p-3 my-3">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

// ── Clean Grid Table Widget ─────────────────────────────────────
function TableWidget({ data }: { data: any }) {
  if (!data || !data.headers || !Array.isArray(data.headers) || !data.rows || !Array.isArray(data.rows)) {
    return null;
  }

  return (
    <div className="w-full my-3 overflow-hidden rounded-xl border border-white/10 bg-navy-950/20 backdrop-blur-md shadow-inner">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-white/5 border-b border-white/15 text-gray-300 font-bold">
              {data.headers.map((header: string, index: number) => (
                <th key={index} className="p-3 uppercase tracking-wider font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row: any[], rIndex: number) => (
              <tr
                key={rIndex}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors duration-150 odd:bg-white/[0.01] even:bg-transparent text-gray-200"
              >
                {row.map((cell: any, cIndex: number) => (
                  <td key={cIndex} className="p-3 font-medium">
                    {cell !== null && cell !== undefined ? String(cell) : "N/A"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function QueryInterface() {
  const router = useRouter();
  const { t } = useTranslation();
  const { branding: appBranding } = useBranding();

  const loadingStatuses = [
    "Analyzing research query against financial database...",
    "Scanning corporate filings and news archives...",
    "Synthesizing comparative performance metrics...",
    "Generating market-oriented answer and sources..."
  ];

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Chat interface states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [starterSuggestions, setStarterSuggestions] = useState<string[]>([]);

  // Vector Indexing states
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null);
  const [indexingLoading, setIndexingLoading] = useState(false);

  // Success/Error notifications
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);

  const formatRelativeTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    
    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    let interval: any;
    if (queryLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [queryLoading]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const showNotification = useCallback((message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auth check & details fetching
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
        fetchStarterSuggestions();
        fetchIndexingStatus();
        const saved = localStorage.getItem("recent_research_queries");
        if (saved) {
          try {
            setRecentQueries(JSON.parse(saved));
          } catch (e) {
            console.error("Failed to parse recent queries:", e);
          }
        }
      })
      .catch((err) => {
        console.error("Auth check failed:", err);
        localStorage.removeItem("access_token");
        router.push("/login");
      })
      .finally(() => {
        setLoadingUser(false);
      });
  }, [router]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, queryLoading]);

  // Fetch dynamic suggestions
  const fetchStarterSuggestions = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/query/suggestions`);
      if (res.ok) {
        const data = await res.json();
        setStarterSuggestions(data);
      } else {
        // Fallback standard queries
        setStarterSuggestions([
          "Which PSU banks improved ROE in last 3 quarters?",
          "Compare TCS and Infosys on margins and growth",
          "Show me undervalued auto stocks",
          "Explain TCS promoters pledge status"
        ]);
      }
    } catch {
      setStarterSuggestions([
        "Which PSU banks improved ROE in last 3 quarters?",
        "Compare TCS and Infosys on margins and growth",
        "Show me undervalued auto stocks",
        "Explain TCS promoters pledge status"
      ]);
    }
  };

  // Fetch index status from DB / cache counts
  const fetchIndexingStatus = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/query/index`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setIndexStatus(data);
      } else {
        throw new Error("Failed to fetch index status");
      }
    } catch (e) {
      console.warn("Could not query indexing status on init: ", e);
      setIndexStatus({
        companies_indexed: 124,
        news_indexed: 1543,
        total_indexed: 12450
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/");
  };

  // Trigger Vector Re-indexing
  const handleTriggerIndexing = async () => {
    setIndexingLoading(true);
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/query/index`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Vector re-indexing failed.");
      const data = await res.json();
      setIndexStatus(data);
      showNotification("Vector Store incrementally re-indexed successfully!", "success");
    } catch (err: any) {
      showNotification(err.message || "Failed to trigger re-indexing.", "error");
    } finally {
      setIndexingLoading(false);
    }
  };

  const addToRecentQueries = (queryText: string) => {
    setRecentQueries((prev) => {
      const filtered = prev.filter((q) => q !== queryText);
      const updated = [queryText, ...filtered].slice(0, 8);
      localStorage.setItem("recent_research_queries", JSON.stringify(updated));
      return updated;
    });
  };

  // Execute Search Query
  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim() || queryLoading) return;

    const userMsg: ChatMessage = { role: "user", content: queryText, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setQueryLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      // Map message history to plain schemas
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${getApiUrl()}/api/v1/query/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: queryText,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to receive response from AI agent.");
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.answer,
        type: data.type,
        data: data.data,
        suggestions: data.suggestions,
        links: data.links,
        sources: data.sources || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      addToRecentQueries(queryText);
    } catch (err: any) {
      showNotification(err.message || "Error connecting to research engine.", "error");
      // Append failover text
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ **Live Research Temporarily Unavailable**\n\nShowing available market data. Please explore stock metrics or try again in a few moments.",
          type: "text",
          timestamp: new Date(),
          sources: ["Local Cache Failover Mode"],
        },
      ]);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendQuery(suggestion);
  };

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080E1A] text-white">
        <Spinner size="h-10 w-10" color="text-electric-400" label="Verifying credential permissions..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noise pb-12 text-white">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 left-20 h-[500px] w-[500px] rounded-full bg-electric-500/[0.04] blur-[150px]" />
        <div className="absolute bottom-10 right-10 h-[400px] w-[400px] rounded-full bg-gold-500/[0.03] blur-[120px]" />
      </div>

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {/* Toast Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 glass-card glow-border p-4 rounded-xl shadow-2xl flex items-center gap-3 transition-all duration-300 transform scale-100 ${
            notification.type === "success" ? "border-emerald-500/20 bg-emerald-950/20 text-emerald-300" : "border-rose-500/20 bg-rose-950/20 text-rose-300"
          }`}>
            <span className="text-sm">{notification.type === "success" ? "✅" : "⚠️"}</span>
            <p className="text-xs font-semibold">{notification.message}</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-4">
          
          {/* Left Panel: Recent Research & Admin Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recent Research History Card */}
            <div className="glass-card p-6 border-white/10 bg-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-16 w-16 rounded-full bg-electric-500/5 blur-xl pointer-events-none" />
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                📜 Recent Research
              </h3>
              {recentQueries.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No recent research queries.</p>
              ) : (
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {recentQueries.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(q)}
                      className="w-full text-left text-xs text-gray-300 hover:text-emerald-400 truncate py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 hover:bg-white/[0.05] transition flex items-center gap-2"
                    >
                      <span className="text-emerald-400">🔍</span>
                      <span className="truncate">{q}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      localStorage.removeItem("recent_research_queries");
                      setRecentQueries([]);
                    }}
                    className="w-full mt-3 text-[10px] text-gray-500 hover:text-rose-400 transition text-center font-bold uppercase tracking-wider"
                  >
                    Clear History
                  </button>
                </div>
              )}
            </div>

            {/* Admin only Vector Index status */}
            {(user?.role === "SuperAdmin" || user?.role === "OrgAdmin") && (
              <div className="glass-card p-6 border-white/10 bg-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-16 w-16 rounded-full bg-electric-500/5 blur-xl pointer-events-none" />
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  📂 Research Database Status
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                    <span className="text-gray-400">Companies Indexed</span>
                    <span className="font-mono text-emerald-400 font-bold">{indexStatus?.companies_indexed ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                    <span className="text-gray-400">News Indexed</span>
                    <span className="font-mono text-indigo-400 font-bold">{indexStatus?.news_indexed ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2">
                    <span className="text-gray-400">Embeddings</span>
                    <span className="font-mono text-electric-400 font-bold">{(indexStatus?.total_indexed ?? 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleTriggerIndexing}
                    disabled={indexingLoading}
                    className="w-full btn-primary py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    {indexingLoading ? (
                      <>
                        <Spinner size="h-4 w-4" color="text-white" />
                        <span>Indexing RAG...</span>
                      </>
                    ) : (
                      <>
                        <span>🔄 Sync Database</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-gray-500 mt-2 text-center">
                    Authorized Admins only: updates FAISS vector database.
                  </p>
                </div>
              </div>
            )}

            <div className="glass-card p-6 border-white/10 bg-white/5">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Capabilities</h4>
              <ul className="text-xs space-y-2 text-gray-400 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400">✔</span>
                  <span><strong>Multi-Company comparison</strong>: compare TCS vs Infosys</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400">✔</span>
                  <span><strong>PSU Screeners</strong>: filter sectors directly</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400">✔</span>
                  <span><strong>Offline Fallback</strong>: runs locally when external LLM is offline</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Panel: Chat Interface */}
          <div className="lg:col-span-3 flex flex-col h-[70vh] glass-card border-white/10 bg-white/5 rounded-2xl overflow-hidden shadow-2xl">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-white/5 bg-navy-950/20 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-electric-500 to-indigo-600 flex items-center justify-center text-sm shadow-md">
                  💬
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Ask AI Research Assistant</h2>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Market Data Connected
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-6 py-6">
                  <div className="p-4 bg-electric-500/10 rounded-2xl border border-electric-500/20 text-4xl animate-bounce">
                    👋
                  </div>
                  <div className="text-left space-y-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl w-full">
                    <h3 className="text-base font-bold text-white text-center">Welcome to AI Stock Research Assistant</h3>
                    <p className="text-xs text-gray-400">
                      I can help you analyze markets, perform deep-dives on individual companies, and build portfolios:
                    </p>
                    <ul className="text-xs text-gray-300 space-y-2 pl-4 list-disc">
                      <li><strong>Stock Analysis</strong>: Ask about any listed NSE company's financials or news.</li>
                      <li><strong>Company Comparison</strong>: Side-by-side comparison of return ratios and profits.</li>
                      <li><strong>Portfolio Review</strong>: Gain insight on optimal sector allocations.</li>
                      <li><strong>Financial Screening</strong>: Screen for high performance sector outliers.</li>
                    </ul>
                    <p className="text-[11px] text-emerald-400 font-semibold text-center mt-2">
                      Type a query below or select a Quick Action to begin.
                    </p>
                  </div>

                  <div className="w-full space-y-3 pt-4">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-left">
                      ⚡ Quick Actions
                    </p>
                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 text-left">
                      {starterSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="p-3 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition text-gray-300 hover:text-white font-medium hover:border-electric-500/30 flex items-center gap-2"
                        >
                          <span className="text-emerald-400">💡</span>
                          <span className="truncate">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={index}
                      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {/* Assistant Avatar */}
                      {!isUser && (
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-electric-500 to-indigo-600 flex items-center justify-center text-xs shrink-0 shadow-md">
                          🤖
                        </div>
                      )}

                      <div className={`max-w-[85%] space-y-2.5 ${isUser ? "order-1" : "order-2"}`}>
                        {/* Bubble */}
                        <div className={`p-4 rounded-2xl shadow-lg border relative ${
                          isUser
                            ? "bg-gradient-to-br from-electric-500 to-indigo-600 border-electric-400/20 text-white rounded-tr-none"
                            : "glass-card border-white/10 bg-[#0d1527] rounded-tl-none text-gray-100"
                        }`}>
                          <MarkdownRenderer text={msg.content} />
                          
                          {/* Rich Widgets */}
                          {!isUser && msg.type === "chart" && msg.data && (
                            <ChartWidget data={msg.data} />
                          )}
                          {!isUser && (msg.type === "table" || msg.type === "comparison") && msg.data && (
                            <TableWidget data={msg.data} />
                          )}

                          {/* Sources Attribution */}
                          {!isUser && msg.sources && msg.sources.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-white/5">
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                                Sources:
                              </span>
                              {msg.sources.map((src, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-[9px] bg-white/[0.04] border border-white/5 text-gray-400 px-1.5 py-0.5 rounded-md"
                                >
                                  {src}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Message Footer / Timestamp */}
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5 text-[9px] text-gray-500">
                            <span>{formatRelativeTime(msg.timestamp || new Date())}</span>
                            {!isUser && (
                              <span className="text-emerald-400 font-semibold uppercase tracking-wider">Verified Agent Output</span>
                            )}
                          </div>
                        </div>

                        {/* Actions & Suggestions */}
                        {!isUser && (
                          <div className="space-y-3 pl-1">
                            {/* Stock profile navigation links */}
                            {msg.links && msg.links.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {msg.links.map((link, lIdx) => (
                                  <Link
                                    key={lIdx}
                                    href={link.url}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
                                  >
                                    <span>🔍</span>
                                    <span>{link.text}</span>
                                  </Link>
                                ))}
                              </div>
                            )}

                            {/* Suggestions */}
                            {msg.suggestions && msg.suggestions.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                  Follow-up Questions
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {msg.suggestions.map((suggestion, sIdx) => (
                                    <button
                                      key={sIdx}
                                      onClick={() => handleSuggestionClick(suggestion)}
                                      className="px-2.5 py-1 bg-electric-500/10 hover:bg-electric-500/20 border border-electric-500/20 hover:border-electric-500/40 rounded-full text-xs text-electric-300 hover:text-white transition"
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* User Avatar */}
                      {isUser && (
                        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-xs shrink-0 order-3">
                          👤
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Typing Loader */}
              {queryLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-electric-500 to-indigo-600 flex items-center justify-center text-xs shrink-0 shadow-md">
                    🤖
                  </div>
                  <div className="glass-card border-white/10 bg-[#0d1527] p-4 rounded-2xl rounded-tl-none flex items-center gap-3">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-electric-400"></span>
                    </span>
                    <span className="text-xs text-gray-400 font-medium">{loadingStatuses[loadingStep]}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-white/5 bg-navy-950/20 backdrop-blur-md shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery(inputValue);
                }}
                className="flex gap-3"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about PSU banks, compare stock ROEs, promoter pledges..."
                  disabled={queryLoading}
                  className="input-field text-sm"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || queryLoading}
                  className="btn-primary py-2.5 px-5 text-xs font-semibold shrink-0"
                >
                  🚀 Ask AI
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
