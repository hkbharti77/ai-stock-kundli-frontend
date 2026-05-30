"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../../context/LanguageContext";
import LanguageSelector from "../../../components/common/LanguageSelector";
import Spinner from "../../../components/common/Spinner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

interface User {
  id: number;
  email: string;
  full_name: string | null;
  plan: string;
  is_verified: boolean;
  created_at: string;
}

interface BacktestSummary {
  starting_balance: number;
  final_balance: number;
  total_return_pct: number;
  benchmark_return_pct: number;
  cagr_pct: number;
  benchmark_cagr_pct: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  total_trades: number;
  win_rate_pct: number;
}

interface EquityPoint {
  date: string;
  portfolio: number;
  benchmark: number;
}

interface TradeLog {
  date: string;
  ticker: string;
  action: string;
  price: number;
  shares: number;
  value: number;
  profit: number;
}

const POPULAR_TICKERS = [
  { ticker: "NVDA", exchange: "NYSE/NASDAQ", name: "Nvidia Corp", group: "US" },
  { ticker: "AAPL", exchange: "NYSE/NASDAQ", name: "Apple Inc", group: "US" },
  { ticker: "MSFT", exchange: "NYSE/NASDAQ", name: "Microsoft Corp", group: "US" },
  { ticker: "JPM", exchange: "NYSE/NASDAQ", name: "JPMorgan Chase", group: "US" },
  { ticker: "AMZN", exchange: "NYSE/NASDAQ", name: "Amazon.com Inc", group: "US" },
  { ticker: "RELIANCE", exchange: "NSE", name: "Reliance Industries", group: "India" },
  { ticker: "TCS", exchange: "NSE", name: "Tata Consultancy", group: "India" },
  { ticker: "HDFCBANK", exchange: "NSE", name: "HDFC Bank", group: "India" },
  { ticker: "INFY", exchange: "NSE", name: "Infosys", group: "India" }
];

export default function BacktestDashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Form states
  const [tickersInput, setTickersInput] = useState("NVDA, JPM");
  const [startDate, setStartDate] = useState("2025-05-30");
  const [endDate, setEndDate] = useState("2026-05-30");
  const [startingBalance, setStartingBalance] = useState(10000);
  const [strategyType, setStrategyType] = useState("signal_following");

  // Run backtest states
  const [runningBacktest, setRunningBacktest] = useState(false);
  const [backtestError, setBacktestError] = useState<string | null>(null);
  const [summary, setSummary] = useState<BacktestSummary | null>(null);
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([]);
  const [trades, setTrades] = useState<TradeLog[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    setLoadingUser(true);

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
        console.error("Backtest page authentication failure:", err);
        localStorage.removeItem("access_token");
        router.push("/login");
      })
      .finally(() => {
        setLoadingUser(false);
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/");
  };

  const handleAddTicker = (ticker: string) => {
    const currentTickers = tickersInput
      .split(",")
      .map((x) => x.trim().toUpperCase())
      .filter((x) => x.length > 0);
    if (!currentTickers.includes(ticker)) {
      currentTickers.push(ticker);
      setTickersInput(currentTickers.join(", "));
    }
  };

  const handleClearTickers = () => {
    setTickersInput("");
  };

  const handleRunBacktest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunningBacktest(true);
    setBacktestError(null);
    setSummary(null);
    setEquityCurve([]);
    setTrades([]);

    const token = localStorage.getItem("access_token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const tickerList = tickersInput
      .split(",")
      .map((x) => x.trim().toUpperCase())
      .filter((x) => x.length > 0);

    if (tickerList.length === 0) {
      setBacktestError("Please specify at least one ticker to run the simulation.");
      setRunningBacktest(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/v1/backtest/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tickers: tickerList,
          start_date: startDate,
          end_date: endDate,
          starting_balance: startingBalance,
          strategy_type: strategyType
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to execute backtest simulation.");
      }

      const data = await res.json();
      setSummary(data.summary);
      setEquityCurve(data.equity_curve);
      setTrades(data.trades);
    } catch (err: any) {
      console.error(err);
      setBacktestError(err.message || "An unexpected error occurred during backtesting.");
    } finally {
      setRunningBacktest(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="h-8 w-8" color="text-electric-400" label="Verifying access..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noise pb-12">
      {/* ── Ambient Background Glows ─────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 left-20 h-[500px] w-[500px] rounded-full bg-electric-500/[0.04] blur-[150px]" />
        <div className="absolute bottom-10 right-10 h-[400px] w-[400px] rounded-full bg-gold-500/[0.03] blur-[120px]" />
      </div>

      {/* ── Navbar ───────────────────────────────────────── */}
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
            <Link href="/dashboard/backtest" className="text-xs font-semibold text-electric-400 hover:text-electric-300 transition pl-4 border-l border-white/10 hidden md:block">
              📈 Historical Backtester
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

      {/* ── Main Dashboard Container ─────────────────────── */}
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl flex items-center gap-3">
            📈 <span className="gradient-text">Historical Portfolio Backtester</span>
          </h1>
          <p className="mt-2 text-sm text-gray-400 max-w-3xl leading-relaxed">
            Replay complex technical and fundamental advisory signals across global markets. Analyze daily transaction histories, evaluate key portfolio risk profiles, and benchmark performance against simulated equal-weight indexing.
          </p>
        </div>

        {/* ── Configuration & Execution Panel ──────────────── */}
        <div className="grid gap-8 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-1 glass-card p-6 border-white/10 bg-white/5 relative overflow-hidden h-fit">
            <div className="absolute inset-0 bg-gradient-to-br from-electric-500/5 via-transparent to-transparent pointer-events-none" />
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
              ⚙️ Simulation Settings
            </h3>
            <form onSubmit={handleRunBacktest} className="space-y-4">
              {/* Ticker Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Assets Tickers
                  </label>
                  <button
                    type="button"
                    onClick={handleClearTickers}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                  >
                    CLEAR
                  </button>
                </div>
                <input
                  type="text"
                  value={tickersInput}
                  onChange={(e) => setTickersInput(e.target.value)}
                  placeholder="e.g. AAPL, MSFT, RELIANCE"
                  className="input-field py-2 text-sm font-mono"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Separate tickers using commas. Dynamic yfinance lookup applies automatically.
                </p>
              </div>

              {/* Popular tickers clicks */}
              <div>
                <span className="text-[10px] font-bold text-gray-500 block mb-2 uppercase tracking-wide">
                  Quick Add Equities
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {POPULAR_TICKERS.map((pt) => (
                    <button
                      key={pt.ticker}
                      type="button"
                      onClick={() => handleAddTicker(pt.ticker)}
                      className="text-[10px] bg-white/5 hover:bg-electric-500/10 border border-white/10 hover:border-electric-500/30 px-2 py-1 rounded-lg text-gray-300 hover:text-white transition font-mono flex items-center gap-1"
                    >
                      <span>{pt.ticker}</span>
                      <span className="text-[8px] opacity-50">({pt.group})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* Starting Balance */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">
                    Starting capital
                  </label>
                  <span className="text-xs font-semibold text-electric-400 font-mono">
                    ${startingBalance.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="1000000"
                  step="5000"
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(Number(e.target.value))}
                  className="w-full accent-electric-500 bg-white/10 rounded-lg appearance-none h-1.5 cursor-pointer"
                />
              </div>

              {/* Rebalancing Strategy */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                  Advisory Strategy
                </label>
                <select
                  value={strategyType}
                  onChange={(e) => setStrategyType(e.target.value)}
                  className="input-field py-2 text-xs bg-navy-950/80 cursor-pointer"
                >
                  <option value="signal_following">AI Agent Signal-Following Strategy</option>
                  <option value="buy_and_hold">Equal Weight Buy-and-Hold Benchmarking</option>
                </select>
              </div>

              {/* Trigger Button */}
              <button
                type="submit"
                disabled={runningBacktest}
                className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2 group border border-electric-500/20"
              >
                {runningBacktest ? (
                  <>
                    <Spinner size="h-4 w-4" color="text-white" />
                    <span>Running Simulation...</span>
                  </>
                ) : (
                  <>
                    <span>🚀 Launch Simulation</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ── Key Metrics Overview (2 cols) ───────────────── */}
          <div className="lg:col-span-2 flex flex-col justify-between gap-6">
            {backtestError && (
              <div className="glass-card glow-border border-rose-500/20 bg-rose-950/10 p-5 rounded-2xl flex items-start gap-3 h-full">
                <span className="text-rose-400 text-lg">⚠️</span>
                <div>
                  <h4 className="text-sm font-bold text-white">Backtest Simulation Failed</h4>
                  <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">{backtestError}</p>
                </div>
              </div>
            )}

            {!summary && !backtestError && !runningBacktest && (
              <div className="glass-card p-12 text-center flex flex-col items-center justify-center border-white/5 bg-white/[0.02] flex-1 h-full min-h-[300px]">
                <span className="text-4xl mb-4 animate-pulse">⚙️</span>
                <h4 className="text-base font-bold text-white">Simulation Engines Awaiting Config</h4>
                <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
                  Enter stock tickers, choose your trading time window, configure structural capital allocations, and click &quot;Launch Simulation&quot; to compile historical backtest curves.
                </p>
              </div>
            )}

            {runningBacktest && (
              <div className="glass-card p-12 text-center flex flex-col items-center justify-center border-white/5 bg-white/[0.02] flex-1 h-full min-h-[300px]">
                <Spinner size="h-8 w-8" color="text-electric-400" label="Compiling historical price bars, calculating moving averages and replaying agent signals..." />
              </div>
            )}

            {summary && !runningBacktest && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full h-full">
                {/* Final Value */}
                <div className="stat-card border border-white/10 hover:border-electric-500/25 transition">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Ending Capital</span>
                  <span className="text-xl font-black text-white font-mono mt-1">
                    ${summary.final_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`text-[10px] font-bold ${summary.total_return_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {summary.total_return_pct >= 0 ? "▲" : "▼"} {Math.abs(summary.total_return_pct).toFixed(2)}% Return
                  </span>
                </div>

                {/* Benchmark Return */}
                <div className="stat-card border border-white/10 hover:border-electric-500/25 transition">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Index Benchmark</span>
                  <span className="text-xl font-black text-gray-400 font-mono mt-1">
                    ${(summary.starting_balance * (1 + summary.benchmark_return_pct / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`text-[10px] font-bold ${summary.benchmark_return_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {summary.benchmark_return_pct >= 0 ? "▲" : "▼"} {Math.abs(summary.benchmark_return_pct).toFixed(2)}% Bench
                  </span>
                </div>

                {/* CAGR */}
                <div className="stat-card border border-white/10 hover:border-electric-500/25 transition">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">CAGR (Annualized)</span>
                  <span className="text-xl font-black text-emerald-400 font-mono mt-1">
                    {summary.cagr_pct.toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold">
                    Benchmark: {summary.benchmark_cagr_pct.toFixed(2)}%
                  </span>
                </div>

                {/* Sharpe Ratio */}
                <div className="stat-card border border-white/10 hover:border-electric-500/25 transition">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Sharpe Ratio</span>
                  <span className={`text-xl font-black font-mono mt-1 ${summary.sharpe_ratio >= 1.0 ? "text-emerald-400" : summary.sharpe_ratio >= 0.0 ? "text-gold-400" : "text-rose-400"}`}>
                    {summary.sharpe_ratio.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold">
                    Risk-adjusted performance
                  </span>
                </div>

                {/* Max Drawdown */}
                <div className="stat-card border border-white/10 hover:border-electric-500/25 transition">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Max Drawdown</span>
                  <span className="text-xl font-black text-rose-400 font-mono mt-1">
                    -{summary.max_drawdown_pct.toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-gray-500 font-bold">
                    Peak-to-trough risk
                  </span>
                </div>

                {/* Trades & Win Rate */}
                <div className="stat-card border border-white/10 hover:border-electric-500/25 transition">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Trades & Win Rate</span>
                  <span className="text-xl font-black text-white font-mono mt-1">
                    {summary.total_trades} Trades
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold">
                    Win Rate: {summary.win_rate_pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Detailed Analytics Sections ──────────────────── */}
        {summary && !runningBacktest && (
          <div className="space-y-8">
            {/* Chart Area */}
            <div className="glass-card p-6 border-white/10 bg-white/5">
              <h3 className="text-md font-bold text-white mb-6 flex items-center gap-2">
                📈 Historical Equity Curve Comparison
              </h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={equityCurve} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      stroke="rgba(255,255,255,0.4)"
                      style={{ fontSize: "10px" }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.4)"
                      style={{ fontSize: "10px" }}
                      domain={["auto", "auto"]}
                      tickFormatter={(val) => `$${val.toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(10, 17, 32, 0.95)",
                        borderColor: "rgba(255,255,255,0.15)",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#fff"
                      }}
                      formatter={(value: any) => [`$${value.toLocaleString()}`, undefined]}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", color: "#fff" }} />
                    <Line
                      type="monotone"
                      name="Active Portfolio Strategy"
                      dataKey="portfolio"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      name="Equal-Weight Buy-and-Hold"
                      dataKey="benchmark"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Signal Replay Trading Logs */}
            <div className="glass-card p-6 border-white/10 bg-white/5">
              <h3 className="text-md font-bold text-white mb-4 flex items-center justify-between">
                <span>📋 Executed Strategy Trade Log</span>
                <span className="text-xs text-gray-500 font-mono">Total trades: {trades.length}</span>
              </h3>
              
              {trades.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
                  <p className="text-xs text-gray-500">No trading signals were executed during this time window.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-gray-400 font-bold">
                        <th className="p-3">Date</th>
                        <th className="p-3">Asset</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Shares</th>
                        <th className="p-3">Total Value</th>
                        <th className="p-3 text-right">Profit / Loss</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((t, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition font-mono text-gray-300"
                        >
                          <td className="p-3">{t.date}</td>
                          <td className="p-3 font-bold text-white">{t.ticker}</td>
                          <td className="p-3">
                            <span className={t.action === "BUY" ? "badge-green" : "badge-red"}>
                              {t.action}
                            </span>
                          </td>
                          <td className="p-3">${t.price.toFixed(2)}</td>
                          <td className="p-3">{t.shares.toFixed(4)}</td>
                          <td className="p-3">${t.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className={`p-3 text-right font-bold ${t.action === "BUY" ? "text-gray-500" : t.profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {t.action === "BUY" ? "—" : `${t.profit >= 0 ? "+" : ""}$${t.profit.toFixed(2)}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
