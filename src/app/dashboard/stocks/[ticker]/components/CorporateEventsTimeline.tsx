"use client";

import { useEffect, useState } from "react";
import Spinner from "../../../../../components/common/Spinner";

interface CorporateEvent {
  id: number;
  event_type: string;
  title: string;
  description: string;
  event_date: string;
}

interface SocialSignal {
  id: number;
  handle: string;
  content: string;
  sentiment: string;
  sentiment_score: number;
  followers_count: number;
  posted_at: string;
}

interface Props {
  ticker: string;
}

export default function CorporateEventsTimeline({ ticker }: Props) {
  const [events, setEvents] = useState<CorporateEvent[]>([]);
  const [signals, setSignals] = useState<SocialSignal[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const [eventsRes, signalsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/companies/${ticker}/corporate-events`),
        fetch(`http://localhost:8000/api/v1/companies/${ticker}/social-signals`),
      ]);

      if (eventsRes.ok && signalsRes.ok) {
        const eventsJson = await eventsRes.json();
        const signalsJson = await signalsRes.json();
        setEvents(eventsJson.events || []);
        setSignals(signalsJson.signals || []);
      }
    } catch (err) {
      console.warn("Failed to fetch corporate events or social signals:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [ticker]);

  function getEventIcon(type: string) {
    switch (type) {
      case "dividend":
        return "💰";
      case "split":
        return "✂️";
      case "bonus":
        return "🎁";
      case "merger":
        return "🤝";
      case "management_change":
        return "👔";
      default:
        return "📅";
    }
  }

  function getEventColor(type: string) {
    switch (type) {
      case "dividend":
        return "border-emerald-500 text-emerald-400 bg-emerald-500/10";
      case "split":
        return "border-cyan-500 text-cyan-400 bg-cyan-500/10";
      case "bonus":
        return "border-amber-500 text-amber-400 bg-amber-500/10";
      case "merger":
        return "border-indigo-500 text-indigo-400 bg-indigo-500/10";
      case "management_change":
        return "border-violet-500 text-violet-400 bg-violet-500/10";
      default:
        return "border-slate-500 text-slate-400 bg-slate-500/10";
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Spinner size="w-8 h-8" color="text-indigo-400" label="Compiling corporate actions and social matrix..." />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
      {/* ── LEFT COLUMN: BSE/NSE Corporate Action Timeline (7/12 width) ── */}
      <div className="glass-card p-6 lg:col-span-7 flex flex-col gap-5 border border-indigo-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">
            Exchange Filings & Corporate Actions Timeline
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Chronological audit of SEBI-mandated stock splits, dividend ex-dates, and material corporate updates.
          </p>
        </div>

        <div className="relative border-l border-slate-800 ml-3 pl-6 space-y-6 py-2">
          {events.map((ev, idx) => (
            <div key={ev.id} className="relative group">
              {/* Timeline Connector Bulb */}
              <div className={`absolute -left-[37px] top-1 w-6 h-6 rounded-full border flex items-center justify-center text-xs shadow-md transition-all duration-300 group-hover:scale-110 ${getEventColor(ev.event_type)}`}>
                {getEventIcon(ev.event_type)}
              </div>

              {/* Event Card */}
              <div className="glass-card p-4 transition-all duration-300 hover:border-indigo-500/30 hover:bg-white/[0.06] hover:shadow-xl">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {ev.event_type.replace("_", " ")}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {new Date(ev.event_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                
                <h4 className="text-sm font-semibold text-slate-200 mt-2 tracking-wide group-hover:text-white transition-colors duration-200">
                  {ev.title}
                </h4>
                
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {ev.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT COLUMN: Twitter/X Social Sentiment Signal Stream (5/12 width) ── */}
      <div className="glass-card p-6 lg:col-span-5 flex flex-col gap-5 border border-indigo-500/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div>
          <h3 className="text-base font-bold text-white tracking-wide">
            Twitter/X Financial Commentary Signals
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Crawled social commentaries weighted by influencer follower reach indexes.
          </p>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto max-h-[500px] pr-1">
          {signals.map((sig) => {
            const isPos = sig.sentiment === "positive";
            return (
              <div key={sig.id} className="glass-card p-4 flex flex-col gap-3 transition-all duration-300 hover:border-emerald-500/30 hover:bg-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200 hover:text-emerald-400 cursor-pointer">
                      {sig.handle}
                    </span>
                    <span className="text-[9px] text-slate-500 font-semibold bg-slate-800 px-1.5 py-0.5 rounded">
                      {(sig.followers_count / 1000000).toFixed(1)}M Reach
                    </span>
                  </div>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                    isPos
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  }`}>
                    {isPos ? "BULLISH" : "BEARISH"}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{sig.content}"
                </p>

                <div className="flex items-center justify-between text-[9px] text-slate-500 font-semibold">
                  <span>Sentiment Score: {sig.sentiment_score.toFixed(1)}/100</span>
                  <span>{new Date(sig.posted_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
