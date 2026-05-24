"use client";

import { useEffect, useState } from "react";

interface TickerItem {
  id: number;
  ticker: string;
  company_name: string;
  title: string;
  source: string;
  published_at: string;
  impact_score: number;
  sentiment: string;
  risk_flags: string[];
}

export default function NewsTickerWidget() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchTicker() {
    try {
      const res = await fetch("http://localhost:8000/api/v1/companies/news/ticker");
      if (res.ok) {
        const json = await res.json();
        setItems(json.items || []);
      }
    } catch (err) {
      console.warn("Failed to fetch live news ticker items:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTicker();
    const interval = setInterval(fetchTicker, 45000); // 45 seconds refresh
    return () => clearInterval(interval);
  }, []);

  if (loading || items.length === 0) {
    return (
      <div className="glass-card px-4 py-2 flex items-center justify-between text-[11px] text-slate-500 font-semibold tracking-wider uppercase select-none min-h-[36px]">
        <span>⚡ Real-Time NSE/BSE & Social Ingestion Queue...</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
          <span>CONNECTED</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card relative overflow-hidden px-4 py-2.5 flex items-center gap-4 select-none min-h-[44px] shadow-lg border border-indigo-500/10">
      {/* Label Badge */}
      <div className="flex items-center gap-2 border-r border-slate-800 pr-4 shrink-0">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        <span className="text-[10px] font-extrabold text-white tracking-widest uppercase">LIVE ANALYTICAL FEED:</span>
      </div>

      {/* Marquee Wrapper */}
      <div className="relative flex-1 overflow-hidden h-5">
        <div className="flex gap-16 absolute whitespace-nowrap animate-marquee hover:[animation-play-state:paused] cursor-pointer">
          {items.map((item) => {
            const isSevere = item.impact_score >= 9;
            const isPositive = item.sentiment === "positive";
            
            let sentimentStyle = "text-slate-300";
            if (isSevere) {
              sentimentStyle = "text-rose-400 font-bold";
            } else if (isPositive) {
              sentimentStyle = "text-emerald-400 font-semibold";
            }

            return (
              <div key={item.id} className="inline-flex items-center gap-3 text-xs">
                {/* Risk Flag Alert tag */}
                {isSevere ? (
                  <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[9px] font-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(244,63,94,0.15)] animate-pulse shrink-0">
                    CRITICAL ALERT
                  </span>
                ) : item.impact_score >= 7 ? (
                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0">
                    CATALYST
                  </span>
                ) : (
                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0">
                    {item.ticker}
                  </span>
                )}

                <span className={sentimentStyle}>
                  {item.title}
                </span>

                <span className="text-[10px] text-slate-500 font-medium">
                  ({item.source} • {new Date(item.published_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })})
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connection Glow */}
      <div className="shrink-0 pl-2 flex items-center gap-1.5 text-[9px] text-indigo-400 font-extrabold tracking-widest uppercase">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
        <span>STREAMING</span>
      </div>
    </div>
  );
}
