"use client";

import { useEffect, useState } from "react";
import Spinner from "../../../../../components/common/Spinner";

interface AlertRule {
  id: number;
  ticker: string;
  company_name: string;
  trigger_type: string;
  threshold_value: number | null;
  delivery_channel: string;
  is_active: boolean;
  quiet_hours_enabled: boolean;
  is_muted: boolean;
}

interface AlertLog {
  id: number;
  ticker: string;
  title: string;
  message: string;
  severity: string;
  channel: string;
  delivered_at: string;
}

interface Props {
  ticker: string;
}

export default function AlertTriggerPanel({ ticker }: Props) {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [logs, setLogs] = useState<AlertLog[]>([]);
  const [activeTab, setActiveTab] = useState<"rules" | "history">("rules");
  const [loading, setLoading] = useState(true);

  // Form States
  const [triggerType, setTriggerType] = useState("price_movement");
  const [threshold, setThreshold] = useState("");
  const [channel, setChannel] = useState("both");
  const [quietHours, setQuietHours] = useState(true);
  const [messageToast, setMessageToast] = useState<{ text: string; type: "success" | "alert" } | null>(null);

  // Fetch configured rules and history
  async function fetchRulesAndLogs() {
    try {
      const [rulesRes, logsRes] = await Promise.all([
        fetch("http://localhost:8000/api/v1/alerts/rules?user_id=1"),
        fetch(`http://localhost:8000/api/v1/alerts/history?user_id=1&ticker=${ticker}`)
      ]);
      if (rulesRes.ok && logsRes.ok) {
        const rulesJson = await rulesRes.ok ? await rulesRes.json() : { rules: [] };
        const logsJson = await logsRes.ok ? await logsRes.json() : { alerts: [] };
        setRules(rulesJson.rules || []);
        setLogs(logsJson.alerts || []);
      }
    } catch (err) {
      console.warn("Failed to fetch alert configuration states:", err);
    } finally {
      setLoading(false);
    }
  }

  // Connect WebSocket for real-time notifications
  useEffect(() => {
    fetchRulesAndLogs();

    const ws = new WebSocket("ws://localhost:8000/api/v1/alerts/ws/1");
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === "alert_triggered") {
          // Trigger a beautiful visual alert toast!
          setMessageToast({
            text: `🔔 REAL-TIME PUSH: ${payload.title} - ${payload.message}`,
            type: "alert",
          });
          
          // Flash clean toast out in 6 seconds
          setTimeout(() => setMessageToast(null), 6000);

          // Append to log history dynamically!
          setLogs((prev) => [
            {
              id: Date.now(),
              ticker: payload.ticker,
              title: payload.title,
              message: payload.message,
              severity: payload.severity,
              channel: "push",
              delivered_at: payload.timestamp
            },
            ...prev
          ]);
        }
      } catch (err) {
        console.warn("WebSocket parse error:", err);
      }
    };

    ws.onclose = () => {
      console.log("Push alerts WebSocket closed.");
    };

    return () => {
      ws.close();
    };
  }, [ticker]);

  // Create alert rule
  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/api/v1/alerts/rules?user_id=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: ticker,
          trigger_type: triggerType,
          threshold_value: threshold ? parseFloat(threshold) : null,
          delivery_channel: channel,
          quiet_hours_enabled: quietHours
        })
      });
      if (res.ok) {
        setMessageToast({ text: "🚀 Alert Trigger Configured Successfully!", type: "success" });
        setTimeout(() => setMessageToast(null), 4000);
        setThreshold("");
        fetchRulesAndLogs();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Toggle active status or mute status
  async function handleToggleRule(ruleId: number, active: boolean) {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/alerts/rules/${ruleId}?user_id=1`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: active })
      });
      if (res.ok) {
        fetchRulesAndLogs();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Mute rule for 24 hours
  async function handleMuteRule(ruleId: number, mute: boolean) {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/alerts/rules/${ruleId}?user_id=1`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mute_duration_hours: mute ? 24 : 0 })
      });
      if (res.ok) {
        fetchRulesAndLogs();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Delete rule
  async function handleDeleteRule(ruleId: number) {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/alerts/rules/${ruleId}?user_id=1`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchRulesAndLogs();
      }
    } catch (err) {
      console.error(err);
    }
  }

  function getSeverityColor(sev: string) {
    switch (sev) {
      case "critical":
        return "bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse";
      case "high":
        return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
      case "medium":
        return "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30";
      default:
        return "bg-slate-500/15 text-slate-400 border border-slate-500/30";
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Spinner size="w-8 h-8" color="text-indigo-400" label="Syncing user trigger rules..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 relative">
      {/* ── REAL-TIME GLASS PUSH TOAST OVERLAY ── */}
      {messageToast && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 max-w-md animate-bounce ${
          messageToast.type === "alert"
            ? "border-rose-500/40 bg-rose-950/70 text-rose-200 shadow-rose-500/10"
            : "border-emerald-500/40 bg-emerald-950/70 text-emerald-200 shadow-emerald-500/10"
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">🔔</span>
            <span className="text-xs font-bold tracking-wide leading-relaxed">{messageToast.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Rule Builder & Rules Config List (7/12 width) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Rule Builder Panel */}
          <div className="glass-card p-6 border border-indigo-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
            
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Configure Real-Time AI Alert Trigger</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Add an automated trigger rule for #{ticker}. Our engine processes thresholds and dispatches push & email instantly.
              </p>
            </div>

            <form onSubmit={handleCreateRule} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Trigger Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Trigger Condition</label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="price_movement">Intraday Price Movement (%)</option>
                    <option value="volume_spike">Volume average spike (x Avg)</option>
                    <option value="news_event">Material News alerts (Immediate)</option>
                    <option value="sentiment_shift">Sentiment shift (Points change)</option>
                    <option value="technical_breakout">Technical breakout signals</option>
                    <option value="signal_change">Kundli score upgrades/downgrades</option>
                  </select>
                </div>

                {/* Threshold */}
                {["price_movement", "volume_spike", "sentiment_shift"].includes(triggerType) && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Trigger Threshold</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder={triggerType === "price_movement" ? "e.g. 5.0 (for ±5% shift)" : triggerType === "volume_spike" ? "e.g. 2.0 (for 2x volume)" : "e.g. 20 (points shift)"}
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 placeholder-slate-600"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Channels */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Dispatch Channels</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="both">In-App Push & AWS SES Email</option>
                    <option value="push">In-App Push (WebSocket) Only</option>
                    <option value="email">AWS SES Email Only</option>
                  </select>
                </div>

                {/* Quiet Hours toggle */}
                <div className="flex items-center justify-between border border-white/10 rounded-xl bg-slate-900/30 px-4 py-2.5 mt-5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-300">Fatigue Quiet Hours</span>
                    <span className="text-[9px] text-slate-500 mt-0.5">Suppress notifications (11PM-7AM)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={quietHours}
                    onChange={(e) => setQuietHours(e.target.checked)}
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-primary text-xs py-3 mt-4"
              >
                🔔 Configure Alert Rules Engine
              </button>
            </form>
          </div>

          {/* Configured Rules Lists */}
          <div className="glass-card p-6 border border-indigo-500/10">
            <h3 className="text-base font-bold text-white tracking-wide">Active Stock Rule Presets</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Rules active for #{ticker}. You can mute, edit, or delete them instantly.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              {rules.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 font-semibold italic uppercase">No alert rules configured for this ticker yet.</div>
              ) : (
                rules.map((rule) => (
                  <div key={rule.id} className={`glass-card p-4 flex items-center justify-between gap-4 border transition-all duration-300 ${rule.is_active ? "border-indigo-500/20 bg-white/5" : "border-slate-800 bg-slate-900/30 opacity-60"}`}>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase">
                          {rule.trigger_type.replace("_", " ")}
                        </span>
                        {rule.threshold_value !== null && (
                          <span className="bg-indigo-500/10 text-indigo-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                            Threshold: {rule.threshold_value}
                          </span>
                        )}
                        {rule.is_muted && (
                          <span className="bg-amber-500/10 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                            MUTED
                          </span>
                        )}
                      </div>
                      
                      <span className="text-[10px] text-slate-500">
                        Dispatch: <span className="text-indigo-400 font-bold uppercase">{rule.delivery_channel}</span> • Quiet Hours: <span className={rule.quiet_hours_enabled ? "text-emerald-400 font-semibold" : "text-slate-500"}>{rule.quiet_hours_enabled ? "ON" : "OFF"}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Active Toggle */}
                      <button
                        onClick={() => handleToggleRule(rule.id, !rule.is_active)}
                        className={`text-[9px] font-extrabold tracking-wider px-2 py-1.5 rounded transition-all duration-200 border ${
                          rule.is_active
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                        }`}
                      >
                        {rule.is_active ? "PAUSE" : "RESUME"}
                      </button>

                      {/* Mute toggle */}
                      <button
                        onClick={() => handleMuteRule(rule.id, !rule.is_muted)}
                        className={`text-[9px] font-extrabold tracking-wider px-2 py-1.5 rounded transition-all duration-200 border ${
                          rule.is_muted
                            ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                        }`}
                      >
                        {rule.is_muted ? "UNMUTE" : "MUTE 24H"}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-[9px] font-extrabold tracking-wider px-2 py-1.5 rounded bg-slate-900 text-slate-400 border border-slate-800 hover:bg-rose-950 hover:text-rose-400 hover:border-rose-500/30 transition-all duration-200"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Delivered Alerts Trigger History Feed (5/12 width) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card p-6 border border-indigo-500/10 relative overflow-hidden flex flex-col gap-5 min-h-[500px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Triggered Notifications Logs</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Audit history of all triggers dispatched by our live engine.
              </p>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[550px] pr-1">
              {logs.length === 0 ? (
                <div className="text-center py-20 text-xs text-slate-500 font-semibold italic uppercase">No alert logs registered for this stock.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="glass-card p-4 flex flex-col gap-3 transition-all duration-300 hover:border-indigo-500/30 hover:bg-white/[0.06]">
                    <div className="flex items-center justify-between gap-4">
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${getSeverityColor(log.severity)}`}>
                        {log.severity.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase bg-slate-800 px-1.5 py-0.5 rounded">
                        {log.channel}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200 mt-1 tracking-wide leading-relaxed">
                      {log.title}
                    </h4>

                    <p className="text-[11px] text-slate-400 leading-relaxed italic">
                      "{log.message}"
                    </p>

                    <div className="text-[9px] text-slate-500 text-right font-medium">
                      {new Date(log.delivered_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
