"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "../../context/LanguageContext";
import { useBranding } from "../../context/BrandingContext";

interface User {
  id: number;
  email: string;
  full_name: string | null;
  plan: string;
  role?: string;
  is_verified: boolean;
  created_at: string;
}

interface Alert {
  id: number;
  ticker?: string;
  company_name?: string;
  title: string;
  message: string;
  severity: "high" | "medium" | "low" | "info";
  channel?: string;
  delivered_at: string;
  is_read?: boolean;
}

interface CompanyResult {
  ticker: string;
  name: string;
  isin: string;
  exchange: string;
  market_cap: number | null;
  sector: string | null;
}

interface HeaderProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

export default function Header({ currentUser, onLogout }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language, setLanguage } = useTranslation();
  const { branding: appBranding } = useBranding();

  // Core User / Navigation State
  const [user, setUser] = useState<User | null>(currentUser || null);
  const [loadingUser, setLoadingUser] = useState(!currentUser);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Notification Alerts State
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);

  // Command Palette State
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CompanyResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);

  // Recent Searches & Trending Stocks State
  const [recentSearches, setRecentSearches] = useState<{ ticker: string; name: string }[]>([]);
  const [trendingStocks, setTrendingStocks] = useState([
    { ticker: "RELIANCE", name: "Reliance Industries Ltd", price: 2452.15, change: 18.35, pct: 0.75 },
    { ticker: "TCS", name: "Tata Consultancy Services", price: 3412.40, change: -26.20, pct: -0.76 },
    { ticker: "AAPL", name: "Apple Inc.", price: 175.45, change: 2.15, pct: 1.24 }
  ]);

  useEffect(() => {
    if (commandPaletteOpen && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("recent_stock_searches");
        const parsed = raw ? JSON.parse(raw) : [];
        if (parsed.length > 0) {
          setRecentSearches(parsed);
        } else {
          // Default fallbacks if empty
          setRecentSearches([
            { ticker: "HDFCBANK", name: "HDFC Bank Ltd" },
            { ticker: "INFY", name: "Infosys Ltd" },
            { ticker: "TATAMOTORS", name: "Tata Motors Ltd" }
          ]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (!commandPaletteOpen) return;

    const interval = setInterval(() => {
      setTrendingStocks((prev) =>
        prev.map((stock) => {
          // Simulate small market tick
          const tick = (Math.random() - 0.5) * 2; // -1.0 to +1.0
          const newPrice = Math.max(1, stock.price + tick);
          const newChange = stock.change + tick;
          const originalPrice = stock.price - stock.change;
          const newPct = (newChange / originalPrice) * 100;
          return {
            ...stock,
            price: Number(newPrice.toFixed(2)),
            change: Number(newChange.toFixed(2)),
            pct: Number(newPct.toFixed(2))
          };
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [commandPaletteOpen]);

  // References
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // ─── Fetch User Profile ───────────────────────────────────────────────────
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      setLoadingUser(false);
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoadingUser(false);
      return;
    }

    fetch(`${getApiUrl()}/api/v1/auth/me`, {
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
        console.error("Header Auth check failed:", err);
      })
      .finally(() => {
        setLoadingUser(false);
      });
  }, [currentUser]);

  // ─── Fetch Notification History ───────────────────────────────────────────
  const fetchAlertHistory = useCallback(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    fetch(`${getApiUrl()}/api/v1/alerts/history`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : { alerts: [] }))
      .then((data) => {
        if (data && Array.isArray(data.alerts)) {
          const fetchedAlerts: Alert[] = data.alerts.map((a: any) => ({
            ...a,
            is_read: false, // Default is_read since backend stores simple timeline
          }));
          setAlerts(fetchedAlerts);
          setUnreadCount(fetchedAlerts.filter((a) => !a.is_read).length);
        }
      })
      .catch((err) => console.warn("Failed to fetch alert history in Header:", err));
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchAlertHistory();
    }
  }, [user, fetchAlertHistory]);

  // ─── Realtime WebSocket Connection ────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem("access_token");
    const apiUrl = getApiUrl();
    const wsProto = apiUrl.startsWith("https") ? "wss" : "ws";
    const wsUrl = `${wsProto}://${apiUrl.replace(/^https?:\/\//, "")}/api/v1/alerts/ws/${user.id}`;

    let ws: WebSocket;
    let reconnectTimeout: any;

    const connectWS = () => {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Global Header Alerts WebSocket connected.");
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === "alert_triggered") {
            const newAlert: Alert = {
              id: Date.now(),
              ticker: payload.ticker,
              company_name: payload.ticker,
              title: payload.title,
              message: payload.message,
              severity: payload.severity || "info",
              channel: "push",
              delivered_at: payload.timestamp || new Date().toISOString(),
              is_read: false,
            };

            // Audio Notification
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              oscillator.type = "sine";
              oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
              gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.15);
            } catch (e) {
              // Ignore audio errors if blocked by browser policy
            }

            setAlerts((prev) => [newAlert, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        } catch (err) {
          console.warn("Header WebSocket message parsing error:", err);
        }
      };

      ws.onclose = () => {
        console.log("Global Header Alerts WebSocket closed. Reconnecting...");
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWS, 5000);
      };

      ws.onerror = (err) => {
        console.error("Global Header Alerts WebSocket error:", err);
        ws.close();
      };
    };

    connectWS();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [user]);

  // ─── Click Outside Listeners ──────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
        setLangMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Stock Search Autocomplete (Command Palette) ──────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(
          `${getApiUrl()}/api/v1/companies/search?q=${encodeURIComponent(searchQuery)}`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Command palette search error:", err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Command Palette Action Handler ───────────────────────────────────────
  const executeCommand = useCallback((type: "nav" | "stock" | "lang", payload: string, extra?: { name?: string }) => {
    setCommandPaletteOpen(false);
    setSearchQuery("");

    if (type === "nav") {
      router.push(payload);
    } else if (type === "stock") {
      // Log search telemetry
      const token = localStorage.getItem("access_token");
      if (token) {
        fetch(`${getApiUrl()}/api/v1/analytics/log-event?event_name=search_stock`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ticker: payload.toUpperCase() }),
        }).catch((err) => console.error("Telemetry log error in Header:", err));
      }

      // Save to recent searches in localStorage
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("recent_stock_searches");
          const current: { ticker: string; name: string }[] = raw ? JSON.parse(raw) : [];
          const stockName = extra?.name || payload.toUpperCase();
          const filtered = current.filter((s) => s.ticker.toUpperCase() !== payload.toUpperCase());
          const updated = [{ ticker: payload.toUpperCase(), name: stockName }, ...filtered].slice(0, 3);
          localStorage.setItem("recent_stock_searches", JSON.stringify(updated));
        } catch (e) {
          console.error("Error saving recent search:", e);
        }
      }

      router.push(`/dashboard/stocks/${payload}`);
    } else if (type === "lang") {
      setLanguage(payload as any);
    }
  }, [router, setLanguage]);

  // ─── Keyboard Hotkey Listeners ────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Toggle command palette: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        setSearchQuery("");
        setSelectedSearchIndex(0);
        return;
      }

      if (!commandPaletteOpen) return;

      const emptyItems = searchQuery.trim() === "" ? [...recentSearches.slice(0, 3), ...trendingStocks] : [];
      const stocksCount = searchResults.length;
      const totalCount = searchQuery.trim() === "" ? emptyItems.length : stocksCount;

      // 2. Escape to close
      if (e.key === "Escape") {
        e.preventDefault();
        setCommandPaletteOpen(false);
        return;
      }

      // 3. Arrow Down navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSearchIndex((prev) => (totalCount > 0 ? (prev + 1) % totalCount : 0));
        return;
      }

      // 4. Arrow Up navigation
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSearchIndex((prev) => (totalCount > 0 ? (prev - 1 + totalCount) % totalCount : 0));
        return;
      }

      // 5. Enter to execute
      if (e.key === "Enter") {
        e.preventDefault();
        if (totalCount === 0) return;

        if (searchQuery.trim() === "") {
          const stock = emptyItems[selectedSearchIndex];
          if (stock) executeCommand("stock", stock.ticker, { name: stock.name });
        } else {
          // If query has text, the list holds stock results
          const stock = searchResults[selectedSearchIndex];
          if (stock) executeCommand("stock", stock.ticker, { name: stock.name });
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, searchResults, searchQuery, user, executeCommand, recentSearches, trendingStocks]);

  // Focus input when palette opens
  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [commandPaletteOpen]);

  // ─── Logout Helper ────────────────────────────────────────────────────────
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/");
  };

  // Helper for notification colors
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    }
  };

  const getPlanColorBadge = (plan: string) => {
    const p = plan?.toLowerCase();
    if (p === "admin" || p === "enterprise") return "bg-rose-500/10 text-rose-400 border border-rose-500/30";
    if (p === "advisor") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
    if (p === "pro") return "bg-electric-500/10 text-electric-400 border border-electric-500/30";
    return "bg-white/5 text-gray-400 border border-white/10";
  };

  const getUserInitials = () => {
    if (user?.full_name) {
      const parts = user.full_name.trim().split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || "US";
  };

  const isSuperAdmin = user?.role === "SuperAdmin" || user?.role === "OrgAdmin";
  const isAdvisor = user?.plan === "advisor" || user?.plan === "admin";

  return (
    <>
      {/* Dynamic Ambient Header Backdrop */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full h-[72px] bg-[#070a14]/80 border-b border-white/[0.05] backdrop-blur-2xl flex items-center justify-between px-6 shadow-[0_1px_0_rgba(255,255,255,0.04),0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300">
        
        {/* Left Branding */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            {appBranding.logo_url ? (
              <img src={appBranding.logo_url} alt="Logo" className="h-7 w-7 rounded-lg object-cover ring-1 ring-white/10 group-hover:ring-white/20 transition" />
            ) : (
              <img src="/favicon.ico" alt="Logo" className="h-7 w-7 rounded-lg object-contain ring-1 ring-white/10 group-hover:ring-white/20 transition" />
            )}
            <span className="text-sm font-bold text-white tracking-tight group-hover:text-white/90 transition">
              {appBranding.brand_name || "AI Stock Kundli"}
            </span>
          </Link>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-0.5 bg-white/[0.025] border border-white/[0.06] p-1 rounded-xl backdrop-blur-sm">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`group relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              pathname === "/dashboard"
                ? "bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            {/* Dashboard grid icon */}
            <svg className={`w-3.5 h-3.5 transition-colors ${pathname === "/dashboard" ? "text-blue-400" : "text-gray-500 group-hover:text-gray-300"}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>{t("dashboard.title")}</span>
            {pathname === "/dashboard" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent rounded-full" />
            )}
          </Link>

          {/* Portfolio */}
          <Link
            href="/dashboard/portfolio"
            className={`group relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              pathname === "/dashboard/portfolio"
                ? "bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            {/* Briefcase / portfolio icon */}
            <svg className={`w-3.5 h-3.5 transition-colors ${pathname === "/dashboard/portfolio" ? "text-violet-400" : "text-gray-500 group-hover:text-gray-300"}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              <rect x="2" y="6" width="20" height="14" rx="2" />
              <path d="M12 12v2m-4-2v2m8-2v2" strokeWidth="1.5" />
              <path d="M2 11h20" />
            </svg>
            <span>Portfolio</span>
            {pathname === "/dashboard/portfolio" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent rounded-full" />
            )}
          </Link>

          {/* Backtest */}
          <Link
            href="/dashboard/backtest"
            className={`group relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              pathname === "/dashboard/backtest"
                ? "bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            {/* Chart / backtest icon */}
            <svg className={`w-3.5 h-3.5 transition-colors ${pathname === "/dashboard/backtest" ? "text-cyan-400" : "text-gray-500 group-hover:text-gray-300"}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
            <span>Backtest</span>
            {pathname === "/dashboard/backtest" && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent rounded-full" />
            )}
          </Link>

          {/* Divider */}
          <span className="w-px h-4 bg-white/[0.08] mx-0.5" />

          {/* Ask AI — Premium gradient CTA */}
          <Link
            href="/dashboard/query"
            className={`relative group flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white overflow-hidden transition-all duration-300 ${
              pathname === "/dashboard/query"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-500/40 shadow-[0_0_16px_rgba(99,102,241,0.3)]"
                : "bg-gradient-to-r from-blue-600/80 via-indigo-600/80 to-violet-600/80 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 border border-white/[0.12] hover:border-indigo-400/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)]"
            }`}
          >
            {/* Sparkle / AI icon */}
            <svg className="w-3.5 h-3.5 text-blue-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z" />
              <path d="M19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z" strokeWidth="1.5" />
            </svg>
            <span className="relative z-10">Ask AI</span>
            {/* Shimmer overlay */}
            <span className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-700 pointer-events-none" />
          </Link>

          {/* More Dropdown */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                moreMenuOpen ? "bg-white/[0.07] text-white" : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {/* Grid dots / more icon */}
              <svg className={`w-3.5 h-3.5 transition-colors ${moreMenuOpen ? "text-white" : "text-gray-500 group-hover:text-gray-300"}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
                <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
              </svg>
              <span>More</span>
              <svg className={`h-2.5 w-2.5 transition-transform duration-200 ${moreMenuOpen ? "rotate-180 text-white" : "text-gray-500"}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {moreMenuOpen && (
              <div className="absolute left-0 mt-2 w-52 rounded-xl border border-white/[0.08] bg-[#0a0d1a]/95 backdrop-blur-xl shadow-[0_24px_48px_rgba(0,0,0,0.5)] p-1.5 z-50 animate-fade-in text-left">
                {/* Developer Portal */}
                <Link
                  href="/dashboard/developer"
                  onClick={() => setMoreMenuOpen(false)}
                  className="group flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg text-gray-300 hover:bg-white/[0.05] hover:text-white transition-all duration-150"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.06] group-hover:border-white/10 transition-colors">
                    <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M8 9l-3 3 3 3M16 9l3 3-3 3M10 18l4-12" />
                    </svg>
                  </span>
                  <span>Developer Portal</span>
                </Link>

                {/* Methodology */}
                <Link
                  href="/dashboard/methodology"
                  onClick={() => setMoreMenuOpen(false)}
                  className="group flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg text-gray-300 hover:bg-white/[0.05] hover:text-white transition-all duration-150"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.06] group-hover:border-white/10 transition-colors">
                    <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </span>
                  <span>Methodology</span>
                </Link>

                {/* Advisor Hub — plan gated */}
                {isAdvisor && (
                  <>
                    <div className="border-t border-white/[0.05] my-1" />
                    <Link
                      href="/dashboard/advisor"
                      onClick={() => setMoreMenuOpen(false)}
                      className="group flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg text-emerald-400 hover:bg-emerald-500/[0.08] transition-all duration-150"
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 group-hover:border-emerald-500/30 transition-colors">
                        <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
                        </svg>
                      </span>
                      <span>Advisor Hub</span>
                      <span className="ml-auto text-[8px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-full">PRO</span>
                    </Link>
                  </>
                )}

                {/* Control Console — admin only */}
                {isSuperAdmin && (
                  <>
                    <div className="border-t border-white/[0.05] my-1" />
                    <Link
                      href="/dashboard/admin"
                      onClick={() => setMoreMenuOpen(false)}
                      className="group flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg text-violet-400 hover:bg-violet-500/[0.08] transition-all duration-150"
                    >
                      <span className="flex items-center justify-center w-6 h-6 rounded-md bg-violet-500/10 border border-violet-500/20 group-hover:border-violet-500/30 transition-colors">
                        <svg className="w-3 h-3 text-violet-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                      </span>
                      <span>Control Console</span>
                      <span className="ml-auto text-[8px] font-black uppercase tracking-wider bg-violet-500/15 text-violet-400 border border-violet-500/25 px-1.5 py-0.5 rounded-full">ADMIN</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          
          {/* Search trigger button */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.02] text-xs font-medium text-gray-400 hover:text-white hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200 group"
            title="Global Stock Search (Ctrl+K)"
          >
            <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span className="hidden sm:inline text-[10px] text-gray-600 bg-white/[0.04] px-1.5 py-0.5 rounded-md font-mono tracking-tight border border-white/[0.06]">⌘K</span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                if (!notificationsOpen) setUnreadCount(0);
              }}
              className={`relative p-2 rounded-lg border transition-all duration-200 ${
                notificationsOpen
                  ? "bg-white/[0.06] border-white/[0.1] text-white"
                  : "bg-white/[0.02] border-white/[0.05] text-gray-400 hover:text-white hover:border-white/[0.1] hover:bg-white/[0.04]"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-[8px] font-black text-white shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-3 w-80 rounded-xl border border-white/[0.08] bg-[#0a0d1a]/95 backdrop-blur-xl shadow-[0_24px_48px_rgba(0,0,0,0.5)] p-1 z-50 animate-fade-in text-left">
                <div className="p-3 border-b border-white/[0.05] flex items-center justify-between">
                  <span className="text-xs font-bold text-white tracking-tight">Notifications</span>
                  <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${wsConnected ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)] animate-pulse" : "bg-gray-600"}`} />
                    {wsConnected ? "Live" : "Offline"}
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                  {alerts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500 italic">
                      No recent alerts.
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert.id} className="p-3 hover:bg-white/[0.02] transition">
                        <div className="flex justify-between items-start gap-2">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${getSeverityBadge(alert.severity)}`}>
                            {alert.ticker || "ALERT"}
                          </span>
                          <span className="text-[9px] text-gray-500 font-medium">
                            {new Date(alert.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-1">{alert.title}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-normal">{alert.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Account Circle & Action Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all duration-200 group ${
                userMenuOpen
                  ? "bg-white/[0.06] border-white/[0.1]"
                  : "bg-white/[0.02] border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 text-[11px] font-bold text-white shadow-[0_2px_8px_rgba(99,102,241,0.35)]">
                {getUserInitials()}
              </div>
              <svg className={`w-2.5 h-2.5 transition-all duration-200 ${userMenuOpen ? "rotate-180 text-white" : "text-gray-500 group-hover:text-gray-300"}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 rounded-xl border border-white/[0.08] bg-[#0a0d1a]/95 backdrop-blur-xl shadow-[0_24px_48px_rgba(0,0,0,0.5)] p-1.5 z-50 animate-fade-in text-left">
                {/* User Information Header */}
                <div className="px-3 py-2.5 border-b border-white/5 mb-1.5">
                  <p className="text-xs font-bold text-white truncate">{user?.full_name || "User Profile"}</p>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{user?.email}</p>
                  {user?.plan && (
                    <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-2 ${getPlanColorBadge(user.plan)}`}>
                      {user.plan} PLAN
                    </span>
                  )}
                </div>

                {/* Sub-menu Options */}
                <Link
                  href="/dashboard/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-gray-300 hover:bg-white/[0.05] hover:text-white transition"
                >
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  My Profile
                </Link>

                {/* Inline Language Selector */}
                <div className="border-t border-white/5 my-1.5" />
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold rounded-lg text-gray-300 hover:bg-white/[0.05] hover:text-white transition"
                >
                  <span className="flex items-center gap-2.5">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Language
                  </span>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <span className="font-mono">{language === "en" ? "EN" : language === "hi" ? "HI" : "GU"}</span>
                    <svg className={`h-2.5 w-2.5 transition-transform ${langMenuOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </span>
                </button>

                {langMenuOpen && (
                  <div className="bg-navy-950/60 border border-white/5 rounded-lg p-1 mx-2 space-y-0.5 animate-fade-in">
                    <button
                      onClick={() => {
                        setLanguage("en");
                        setUserMenuOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-2.5 py-1 text-[11px] font-medium rounded transition ${
                        language === "en" ? "text-indigo-400 bg-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span>🇬🇧 English</span>
                    </button>
                    <button
                      onClick={() => {
                        setLanguage("hi");
                        setUserMenuOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-2.5 py-1 text-[11px] font-medium rounded transition ${
                        language === "hi" ? "text-indigo-400 bg-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span>🇮🇳 हिन्दी (Hindi)</span>
                    </button>
                    <button
                      onClick={() => {
                        setLanguage("gu");
                        setUserMenuOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-2.5 py-1 text-[11px] font-medium rounded transition ${
                        language === "gu" ? "text-indigo-400 bg-white/5" : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span>🇮🇳 ગુજરાતી (Gujarati)</span>
                    </button>
                  </div>
                )}

                <div className="border-t border-white/5 my-1.5" />
                
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <span>Sign out</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ─── Global Command Palette Modal ─────────────────────────────────────── */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-md p-4 pt-[15vh] animate-fade-in">
          {/* Click background to close */}
          <div className="fixed inset-0" onClick={() => setCommandPaletteOpen(false)} />

          <div className="relative border border-white/[0.08] bg-[#0a0d1a]/97 shadow-[0_32px_64px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.03)] w-full max-w-3xl rounded-2xl overflow-hidden animate-fade-in-up">
            
            {/* Search Input Box */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.05]">
              <svg className="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search stocks (NSE/BSE) or navigate..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedSearchIndex(0);
                }}
                className="w-full bg-transparent border-0 p-0 text-sm text-white placeholder-gray-600 focus:ring-0 focus:outline-none"
              />
              <span className="text-[10px] text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-md font-mono border border-white/[0.06]">ESC</span>
            </div>

            {/* Results Body */}
            <div className="max-h-96 overflow-y-auto p-3">
              {searchQuery.trim() === "" ? (
                // Recent Searches & Trending Stocks side by side
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
                  
                  {/* Left Column: Recent Searches */}
                  <div className="space-y-4">
                    <div className="px-3 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center justify-between">
                      <span>Recent Searches</span>
                      {recentSearches.length > 0 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            localStorage.removeItem("recent_stock_searches");
                            setRecentSearches([
                              { ticker: "HDFCBANK", name: "HDFC Bank Ltd" },
                              { ticker: "INFY", name: "Infosys Ltd" },
                              { ticker: "TATAMOTORS", name: "Tata Motors Ltd" }
                            ]);
                          }}
                          className="text-[8px] text-gray-400 hover:text-white transition bg-white/5 px-1.5 py-0.5 rounded"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="space-y-1 mt-2">
                      {recentSearches.slice(0, 3).map((item, idx) => {
                        const isSelected = selectedSearchIndex === idx;
                        return (
                          <button
                            key={item.ticker}
                            onClick={() => executeCommand("stock", item.ticker, { name: item.name })}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition ${
                              isSelected ? "bg-white/5 text-white animate-pulse" : "text-gray-300 hover:bg-white/[0.02]"
                            }`}
                          >
                            <div className="truncate">
                              <span className="font-bold font-mono text-electric-400 mr-2">
                                {item.ticker}
                              </span>
                              <span className="text-[10px] text-gray-500 truncate">
                                {item.name}
                              </span>
                            </div>
                            <svg className="w-3.5 h-3.5 text-gray-500 shrink-0 ml-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                            </svg>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Trending Stocks */}
                  <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                    <div className="px-3 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">
                      Trending Real-Time
                    </div>
                    <div className="space-y-1 mt-2">
                      {trendingStocks.map((stock, idx) => {
                        const globalIdx = idx + recentSearches.slice(0, 3).length;
                        const isSelected = selectedSearchIndex === globalIdx;
                        return (
                          <button
                            key={stock.ticker}
                            onClick={() => executeCommand("stock", stock.ticker, { name: stock.name })}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition ${
                              isSelected ? "bg-white/5 text-white animate-pulse" : "text-gray-300 hover:bg-white/[0.02]"
                            }`}
                          >
                            <div className="truncate pr-2">
                              <p className="font-bold font-mono text-white flex items-center gap-1.5">
                                <span className="text-electric-400">{stock.ticker}</span>
                                <span className="text-[9px] text-gray-500 font-normal truncate max-w-[120px]">{stock.name}</span>
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-mono font-bold text-[11px] text-white">
                                ₹{stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </p>
                              <p className={`font-mono text-[9px] font-bold ${stock.pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                {stock.pct >= 0 ? "+" : ""}{stock.pct.toFixed(2)}%
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              ) : (
                // Live Stock Database Search Matches
                <div>
                  <div className="px-3 py-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">
                    Stock Matches
                  </div>
                  {searching ? (
                    <div className="p-4 text-center text-xs text-gray-500 font-mono">
                      Querying index databases...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500 italic">
                      No stock matches found for "{searchQuery}".
                    </div>
                  ) : (
                    <div className="space-y-0.5 mt-1">
                      {searchResults.map((stock, idx) => {
                        const isSelected = selectedSearchIndex === idx;
                        return (
                          <button
                            key={stock.ticker}
                            onClick={() => executeCommand("stock", stock.ticker, { name: stock.name })}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition ${
                              isSelected ? "bg-white/5 text-white" : "text-gray-300 hover:bg-white/[0.02]"
                            }`}
                          >
                            <div className="min-w-0 pr-4">
                              <span className="text-xs font-extrabold font-mono text-electric-400">
                                {stock.ticker}
                              </span>
                              <span className="text-[10px] text-gray-400 ml-2 truncate inline-block max-w-[280px] align-bottom">
                                {stock.name}
                              </span>
                              {stock.sector && (
                                <p className="text-[9px] text-gray-500 mt-0.5">{stock.sector} • {stock.exchange}</p>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono border border-white/5 bg-white/5 px-1.5 py-0.5 rounded">
                              ENTER
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer tips */}
            <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[9px] text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span>↑↓</span>
                <span>to navigate</span>
                <span className="ml-2">↵</span>
                <span>to select</span>
              </span>
              <span>Search NSE & BSE indexes</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
