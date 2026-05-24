"use client";

import { useState, useRef, useEffect } from "react";

export interface TechnicalBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma_20: number | null;
  sma_50: number | null;
  ema_20: number | null;
  ema_50: number | null;
  vwap: number | null;
  rsi: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_hist: number | null;
  bb_upper: number | null;
  bb_middle: number | null;
  bb_lower: number | null;
  atr: number | null;
  obv: number | null;
  volume_spike: boolean;
  relative_strength: number | null;
}

export interface TechnicalIndicatorsWrapper {
  ticker: string;
  support_levels: number[];
  resistance_levels: number[];
  stop_loss_zone: number[];
  data: TechnicalBar[];
  count: number;
}

interface TechnicalVisualizerProps {
  indicators: TechnicalIndicatorsWrapper;
}

export default function TechnicalVisualizer({ indicators }: TechnicalVisualizerProps) {
  const bars = indicators.data || [];
  
  // Toggles for Overlays
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(false);
  const [showEMA20, setShowEMA20] = useState(false);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showVWAP, setShowVWAP] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showLevels, setShowLevels] = useState(true);
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  
  // Toggle for Bottom Indicator Pane
  const [bottomIndicator, setBottomIndicator] = useState<"rsi" | "macd">("rsi");

  // Interaction State
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(800);
  
  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      if (containerRef.current) {
        setChartWidth(Math.max(containerRef.current.clientWidth, 400));
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (bars.length === 0) {
    return (
      <div className="glass-card p-6 h-80 flex items-center justify-center text-sm text-gray-500">
        No technical historical data available.
      </div>
    );
  }

  // Dimensions
  const totalWidth = chartWidth;
  const mainHeight = 300;
  const bottomHeight = 100;
  const gap = 20;
  const totalHeight = mainHeight + bottomHeight + gap;
  
  const paddingLeft = 55;
  const paddingRight = 55;
  const paddingTop = 20;
  const paddingBottom = 20;
  
  const plotWidth = totalWidth - paddingLeft - paddingRight;
  const mainPlotHeight = mainHeight - paddingTop - paddingBottom;
  const bottomPlotHeight = bottomHeight - 10 - 20; // some padding inside bottom panel

  // Price Bounds
  const prices = bars.flatMap(b => [b.open, b.high, b.low, b.close]);
  
  // Include indicator bounds if Bollinger is enabled
  const bbu = showBollinger ? bars.map(b => b.bb_upper || 0).filter(v => v > 0) : [];
  const bbl = showBollinger ? bars.map(b => b.bb_lower || 0).filter(v => v > 0) : [];
  const mas = [
    ...(showSMA20 ? bars.map(b => b.sma_20 || 0).filter(v => v > 0) : []),
    ...(showSMA50 ? bars.map(b => b.sma_50 || 0).filter(v => v > 0) : []),
    ...(showEMA20 ? bars.map(b => b.ema_20 || 0).filter(v => v > 0) : []),
    ...(showEMA50 ? bars.map(b => b.ema_50 || 0).filter(v => v > 0) : []),
    ...(showVWAP ? bars.map(b => b.vwap || 0).filter(v => v > 0) : []),
  ];
  
  const allPriceBounds = [...prices, ...bbu, ...bbl, ...mas, ...indicators.support_levels, ...indicators.resistance_levels];
  const maxPrice = Math.max(...allPriceBounds) * 1.02;
  const minPrice = Math.min(...allPriceBounds) * 0.98;
  const priceRange = maxPrice - minPrice;

  // Volume Bounds
  const maxVolume = Math.max(...bars.map(b => b.volume), 1);

  // RSI Bounds
  const minRsi = 0;
  const maxRsi = 100;
  const rsiRange = 100;

  // MACD Bounds
  const macdValues = bars.flatMap(b => [b.macd || 0, b.macd_signal || 0, b.macd_hist || 0]);
  const maxMacd = Math.max(...macdValues, 0.1) * 1.1;
  const minMacd = Math.min(...macdValues, -0.1) * 1.1;
  const macdRange = maxMacd - minMacd;

  // Column spacing
  const colWidth = plotWidth / bars.length;

  // Map Price to Y coordinate
  const priceToY = (price: number) => {
    return paddingTop + mainPlotHeight - ((price - minPrice) / priceRange) * mainPlotHeight;
  };

  // Map Volume to Height
  const volToHeight = (vol: number) => {
    return (vol / maxVolume) * (mainPlotHeight * 0.2); // caps volume bars at 20% of main plot
  };

  // Map RSI to Y coordinate
  const rsiToY = (rsiVal: number) => {
    const bottomPlotStart = mainHeight + gap + 10;
    return bottomPlotStart + bottomPlotHeight - (rsiVal / rsiRange) * bottomPlotHeight;
  };

  // Map MACD to Y coordinate
  const macdToY = (macdVal: number) => {
    const bottomPlotStart = mainHeight + gap + 10;
    return bottomPlotStart + bottomPlotHeight - ((macdVal - minMacd) / macdRange) * bottomPlotHeight;
  };

  // SVG hover interactions
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const relativeX = (mouseX / rect.width) * totalWidth;
    
    const idx = Math.floor((relativeX - paddingLeft) / colWidth);
    if (idx >= 0 && idx < bars.length) {
      setHoveredIdx(idx);
    } else {
      setHoveredIdx(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  // Hovered item details
  const activeBar = hoveredIdx !== null ? bars[hoveredIdx] : bars[bars.length - 1];

  // Helper to generate svg polyline points for indicators
  const getIndicatorPoints = (key: keyof TechnicalBar) => {
    return bars
      .map((b, idx) => {
        const val = b[key];
        if (val === null || val === undefined || typeof val !== "number") return null;
        const x = paddingLeft + idx * colWidth + colWidth / 2;
        const y = priceToY(val);
        return `${x},${y}`;
      })
      .filter(p => p !== null)
      .join(" ");
  };

  // Generate paths for bottom pane
  const rsiPoints = bars
    .map((b, idx) => {
      const val = b.rsi;
      if (val === null) return null;
      const x = paddingLeft + idx * colWidth + colWidth / 2;
      const y = rsiToY(val);
      return `${x},${y}`;
    })
    .filter(p => p !== null)
    .join(" ");

  const macdLinePoints = bars
    .map((b, idx) => {
      const val = b.macd;
      if (val === null) return null;
      const x = paddingLeft + idx * colWidth + colWidth / 2;
      const y = macdToY(val);
      return `${x},${y}`;
    })
    .filter(p => p !== null)
    .join(" ");

  const macdSignalPoints = bars
    .map((b, idx) => {
      const val = b.macd_signal;
      if (val === null) return null;
      const x = paddingLeft + idx * colWidth + colWidth / 2;
      const y = macdToY(val);
      return `${x},${y}`;
    })
    .filter(p => p !== null)
    .join(" ");

  // Price Line path (if line chart is selected)
  const priceLinePoints = bars
    .map((b, idx) => {
      const x = paddingLeft + idx * colWidth + colWidth / 2;
      const y = priceToY(b.close);
      return `${x},${y}`;
    })
    .join(" ");

  // Bollinger Area Path
  const getBollingerAreaPath = () => {
    if (bars.length === 0) return "";
    const upperPts: string[] = [];
    const lowerPts: string[] = [];
    
    bars.forEach((b, idx) => {
      const x = paddingLeft + idx * colWidth + colWidth / 2;
      if (b.bb_upper !== null && b.bb_lower !== null) {
        upperPts.push(`${x},${priceToY(b.bb_upper)}`);
        lowerPts.unshift(`${x},${priceToY(b.bb_lower)}`);
      }
    });

    if (upperPts.length === 0) return "";
    return `M ${upperPts.join(" L ")} L ${lowerPts.join(" L ")} Z`;
  };

  const formatVolume = (vol: number) => {
    if (vol >= 10000000) return `${(vol / 10000000).toFixed(2)} Cr`;
    if (vol >= 100000) return `${(vol / 100000).toFixed(2)} L`;
    return vol.toLocaleString("en-IN");
  };

  return (
    <div ref={containerRef} className="glass-card p-6 space-y-6">
      {/* Top Header & Overlay Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-md font-bold text-white uppercase tracking-wide">
              {indicators.ticker} Live Technical Chart
            </h3>
            <span className="badge-purple font-mono text-[10px] py-0 px-2">High Fidelity Indicators</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Toggle indicators, bands, volume spikes, and support/resistance zones below.
          </p>
        </div>

        {/* Chart Options Selector */}
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setChartType("candle")}
            className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition ${
              chartType === "candle" ? "bg-electric-500 text-white" : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            Candles
          </button>
          <button
            onClick={() => setChartType("line")}
            className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition ${
              chartType === "line" ? "bg-electric-500 text-white" : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            Line
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-1 self-center" />

          <button
            onClick={() => setBottomIndicator("rsi")}
            className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition ${
              bottomIndicator === "rsi" ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            RSI
          </button>
          <button
            onClick={() => setBottomIndicator("macd")}
            className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider transition ${
              bottomIndicator === "macd" ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            MACD
          </button>
        </div>
      </div>

      {/* Real-time Indicator Checklist Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs bg-white/[0.02] p-3 rounded-lg border border-white/5">
        <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition">
          <input
            type="checkbox"
            checked={showSMA20}
            onChange={(e) => setShowSMA20(e.target.checked)}
            className="accent-electric-500 rounded"
          />
          <span className="font-mono text-electric-400 font-bold">SMA 20</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition">
          <input
            type="checkbox"
            checked={showSMA50}
            onChange={(e) => setShowSMA50(e.target.checked)}
            className="accent-emerald-500 rounded"
          />
          <span className="font-mono text-emerald-400 font-bold">SMA 50</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition">
          <input
            type="checkbox"
            checked={showEMA20}
            onChange={(e) => setShowEMA20(e.target.checked)}
            className="accent-rose-500 rounded"
          />
          <span className="font-mono text-rose-400 font-bold">EMA 20</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition">
          <input
            type="checkbox"
            checked={showEMA50}
            onChange={(e) => setShowEMA50(e.target.checked)}
            className="accent-amber-500 rounded"
          />
          <span className="font-mono text-amber-400 font-bold">EMA 50</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition">
          <input
            type="checkbox"
            checked={showVWAP}
            onChange={(e) => setShowVWAP(e.target.checked)}
            className="accent-sky-400 rounded"
          />
          <span className="font-mono text-sky-400 font-bold">VWAP</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition">
          <input
            type="checkbox"
            checked={showBollinger}
            onChange={(e) => setShowBollinger(e.target.checked)}
            className="accent-indigo-400 rounded"
          />
          <span className="font-mono text-indigo-400 font-bold">Bollinger</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition">
          <input
            type="checkbox"
            checked={showLevels}
            onChange={(e) => setShowLevels(e.target.checked)}
            className="accent-gold-500 rounded"
          />
          <span className="font-mono text-gold-400 font-bold">S/R Levels</span>
        </label>
      </div>

      {/* Floating Interactive HUD Display */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 bg-navy-950/80 p-4 rounded-xl border border-white/10 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 p-2 font-mono text-[9px] text-gray-600 tracking-widest uppercase">HUD Metric Engine</div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 font-semibold uppercase font-mono">Date</span>
          <span className="text-xs font-extrabold text-white font-mono mt-0.5">
            {new Date(activeBar.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 font-semibold uppercase font-mono">Open / High</span>
          <span className="text-xs font-bold text-gray-300 font-mono mt-0.5">
            ₹{activeBar.open.toFixed(2)} / <span className="text-emerald-400">₹{activeBar.high.toFixed(2)}</span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 font-semibold uppercase font-mono">Low / Close</span>
          <span className="text-xs font-bold text-gray-300 font-mono mt-0.5">
            <span className="text-rose-400">₹{activeBar.low.toFixed(2)}</span> / ₹{activeBar.close.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 font-semibold uppercase font-mono">Volume</span>
          <span className={`text-xs font-bold font-mono mt-0.5 ${activeBar.volume_spike ? "text-amber-400 flex items-center gap-1" : "text-gray-300"}`}>
            {formatVolume(activeBar.volume)}
            {activeBar.volume_spike && (
              <span className="badge-amber py-0 text-[8px] scale-90 origin-left">Spike</span>
            )}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 font-semibold uppercase font-mono">RSI (14)</span>
          <span className={`text-xs font-extrabold font-mono mt-0.5 ${
            activeBar.rsi !== null && activeBar.rsi !== undefined
              ? activeBar.rsi >= 70 
                ? "text-rose-400" 
                : activeBar.rsi <= 30 
                  ? "text-emerald-400" 
                  : "text-purple-400"
              : "text-gray-500"
          }`}>
            {activeBar.rsi !== null && activeBar.rsi !== undefined ? activeBar.rsi.toFixed(2) : "—"}
            {activeBar.rsi !== null && activeBar.rsi !== undefined && activeBar.rsi >= 70 && " (Overbought)"}
            {activeBar.rsi !== null && activeBar.rsi !== undefined && activeBar.rsi <= 30 && " (Oversold)"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 font-semibold uppercase font-mono">Relative Strength (vs Nifty)</span>
          <span className={`text-xs font-extrabold font-mono mt-0.5 ${
            activeBar.relative_strength !== null && activeBar.relative_strength !== undefined
              ? activeBar.relative_strength > 1
                ? "text-emerald-400"
                : "text-rose-400"
              : "text-gray-500"
          }`}>
            {activeBar.relative_strength !== null && activeBar.relative_strength !== undefined ? activeBar.relative_strength.toFixed(3) : "—"}
            {activeBar.relative_strength !== null && activeBar.relative_strength !== undefined && (activeBar.relative_strength > 1 ? " (Outperforming)" : " (Underperforming)")}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="w-full h-auto select-none overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines (Main Plot) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = priceToY(minPrice + priceRange * ratio);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={totalWidth - paddingRight}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="0.75"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-gray-500 font-mono text-[9px] font-semibold"
                >
                  ₹{(minPrice + priceRange * ratio).toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* S/R Horizontal Level Lines (If toggled) */}
          {showLevels && indicators.support_levels.map((level, idx) => {
            const y = priceToY(level);
            return (
              <g key={`sup-${idx}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={totalWidth - paddingRight}
                  y2={y}
                  stroke="#10b981"
                  strokeWidth="1.25"
                  strokeDasharray="5 3"
                  className="opacity-70"
                />
                <text
                  x={totalWidth - paddingRight + 5}
                  y={y - 2}
                  textAnchor="start"
                  className="fill-emerald-400 font-mono text-[8px] font-bold"
                >
                  SUP ₹{level.toFixed(1)}
                </text>
              </g>
            );
          })}
          {showLevels && indicators.resistance_levels.map((level, idx) => {
            const y = priceToY(level);
            return (
              <g key={`res-${idx}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={totalWidth - paddingRight}
                  y2={y}
                  stroke="#f43f5e"
                  strokeWidth="1.25"
                  strokeDasharray="5 3"
                  className="opacity-70"
                />
                <text
                  x={totalWidth - paddingRight + 5}
                  y={y - 2}
                  textAnchor="start"
                  className="fill-rose-400 font-mono text-[8px] font-bold"
                >
                  RES ₹{level.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Bollinger Bands Shaded Area */}
          {showBollinger && (
            <path
              d={getBollingerAreaPath()}
              fill="rgba(99, 102, 241, 0.04)"
              stroke="none"
            />
          )}

          {/* Volume bars (rendered in background of main plot) */}
          {bars.map((b, idx) => {
            const h = volToHeight(b.volume);
            const w = colWidth * 0.6;
            const x = paddingLeft + idx * colWidth + (colWidth - w) / 2;
            const y = paddingTop + mainPlotHeight - h;
            const isSpike = b.volume_spike;
            const isGreen = b.close >= b.open;

            return (
              <rect
                key={`vol-${idx}`}
                x={x}
                y={y}
                width={w}
                height={Math.max(h, 1)}
                fill={isSpike ? "rgba(245, 158, 11, 0.3)" : isGreen ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)"}
                stroke={isSpike ? "rgba(245, 158, 11, 0.6)" : isGreen ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)"}
                strokeWidth="0.5"
              />
            );
          })}

          {/* Bollinger Bands Lines */}
          {showBollinger && (
            <>
              <polyline
                points={getIndicatorPoints("bb_upper")}
                fill="none"
                stroke="rgba(99, 102, 241, 0.6)"
                strokeWidth="1.25"
                strokeDasharray="2 2"
              />
              <polyline
                points={getIndicatorPoints("bb_middle")}
                fill="none"
                stroke="rgba(99, 102, 241, 0.4)"
                strokeWidth="1"
              />
              <polyline
                points={getIndicatorPoints("bb_lower")}
                fill="none"
                stroke="rgba(99, 102, 241, 0.6)"
                strokeWidth="1.25"
                strokeDasharray="2 2"
              />
            </>
          )}

          {/* Moving Averages lines */}
          {showSMA20 && (
            <polyline
              points={getIndicatorPoints("sma_20")}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
              filter="url(#glow)"
            />
          )}
          {showSMA50 && (
            <polyline
              points={getIndicatorPoints("sma_50")}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              filter="url(#glow)"
            />
          )}
          {showEMA20 && (
            <polyline
              points={getIndicatorPoints("ema_20")}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2"
              filter="url(#glow)"
            />
          )}
          {showEMA50 && (
            <polyline
              points={getIndicatorPoints("ema_50")}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              filter="url(#glow)"
            />
          )}
          {showVWAP && (
            <polyline
              points={getIndicatorPoints("vwap")}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="3 2"
            />
          )}

          {/* Price Candles or Line Path */}
          {chartType === "line" ? (
            <polyline
              points={priceLinePoints}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
          ) : (
            bars.map((b, idx) => {
              const x = paddingLeft + idx * colWidth + colWidth / 2;
              const openY = priceToY(b.open);
              const closeY = priceToY(b.close);
              const highY = priceToY(b.high);
              const lowY = priceToY(b.low);
              
              const isGreen = b.close >= b.open;
              const candleColor = isGreen ? "#10b981" : "#f43f5e";
              
              const bodyW = Math.max(colWidth * 0.7, 3);
              const bodyH = Math.max(Math.abs(closeY - openY), 1.5);
              const bodyY = Math.min(openY, closeY);

              return (
                <g key={`candle-${idx}`}>
                  {/* Shadow Line */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={candleColor}
                    strokeWidth="1.5"
                  />
                  {/* Body Rect */}
                  <rect
                    x={x - bodyW / 2}
                    y={bodyY}
                    width={bodyW}
                    height={bodyH}
                    fill={candleColor}
                    stroke={candleColor}
                    strokeWidth="0.5"
                    rx={1}
                  />
                </g>
              );
            })
          )}

          {/* ================= BOTTOM INDICATOR PANE ================= */}
          {/* Divider */}
          <line
            x1={paddingLeft}
            y1={mainHeight + gap / 2}
            x2={totalWidth - paddingRight}
            y2={mainHeight + gap / 2}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />

          {bottomIndicator === "rsi" ? (
            // RSI PANE
            <>
              {/* RSI Grid / Overbought-Oversold zones */}
              {[30, 50, 70].map((rsiLevel) => {
                const y = rsiToY(rsiLevel);
                return (
                  <g key={`rsi-${rsiLevel}`}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={totalWidth - paddingRight}
                      y2={y}
                      stroke={rsiLevel === 50 ? "rgba(255,255,255,0.05)" : "rgba(139, 92, 246, 0.25)"}
                      strokeWidth="1"
                      strokeDasharray={rsiLevel !== 50 ? "4 4" : "0"}
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-gray-500 font-mono text-[8px] font-bold"
                    >
                      {rsiLevel}
                    </text>
                  </g>
                );
              })}

              {/* Shaded Oversold / Overbought Area between 30 and 70 */}
              <rect
                x={paddingLeft}
                y={rsiToY(70)}
                width={plotWidth}
                height={rsiToY(30) - rsiToY(70)}
                fill="rgba(139, 92, 246, 0.02)"
              />

              {/* RSI Line */}
              {rsiPoints && (
                <polyline
                  points={rsiPoints}
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="1.75"
                />
              )}
            </>
          ) : (
            // MACD PANE
            <>
              {/* MACD Zero Line */}
              <line
                x1={paddingLeft}
                y1={macdToY(0)}
                x2={totalWidth - paddingRight}
                y2={macdToY(0)}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1"
              />

              {/* MACD Labels */}
              {[minMacd, 0, maxMacd].map((mVal, mIdx) => {
                const y = macdToY(mVal);
                return (
                  <text
                    key={`mlabel-${mIdx}`}
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-gray-500 font-mono text-[8px] font-bold"
                  >
                    {mVal.toFixed(2)}
                  </text>
                );
              })}

              {/* MACD Histogram Bars */}
              {bars.map((b, idx) => {
                if (b.macd_hist === null) return null;
                const x = paddingLeft + idx * colWidth + (colWidth - colWidth * 0.6) / 2;
                const zeroY = macdToY(0);
                const histY = macdToY(b.macd_hist);
                
                const isGreen = b.macd_hist >= 0;
                const barH = Math.abs(histY - zeroY);
                const barY = isGreen ? histY : zeroY;

                return (
                  <rect
                    key={`hist-${idx}`}
                    x={x}
                    y={barY}
                    width={colWidth * 0.6}
                    height={Math.max(barH, 1)}
                    fill={isGreen ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)"}
                    stroke={isGreen ? "rgba(16, 185, 129, 0.6)" : "rgba(244, 63, 94, 0.6)"}
                    strokeWidth="0.5"
                  />
                );
              })}

              {/* MACD Line */}
              {macdLinePoints && (
                <polyline
                  points={macdLinePoints}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                />
              )}

              {/* Signal Line */}
              {macdSignalPoints && (
                <polyline
                  points={macdSignalPoints}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="1.25"
                />
              )}
            </>
          )}

          {/* Interaction Tracker Line & Overlay */}
          {hoveredIdx !== null && (
            <>
              {/* Vertical Crosshair Line */}
              <line
                x1={paddingLeft + hoveredIdx * colWidth + colWidth / 2}
                y1={paddingTop}
                x2={paddingLeft + hoveredIdx * colWidth + colWidth / 2}
                y2={totalHeight - 10}
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Highlight Dot on Price close */}
              <circle
                cx={paddingLeft + hoveredIdx * colWidth + colWidth / 2}
                cy={priceToY(activeBar.close)}
                r="4.5"
                fill="#ffffff"
                stroke="#6366f1"
                strokeWidth="2"
              />
            </>
          )}

          {/* Time axis labels */}
          {bars.filter((_, i) => i % Math.max(Math.floor(bars.length / 8), 1) === 0).map((b, idx) => {
            const i = bars.indexOf(b);
            const x = paddingLeft + i * colWidth + colWidth / 2;
            return (
              <text
                key={`lbl-${idx}`}
                x={x}
                y={totalHeight - 4}
                textAnchor="middle"
                className="fill-gray-400 font-mono text-[9px] font-bold"
              >
                {new Date(b.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
