"use client";

import { useState } from "react";

export interface FinancialStatement {
  period_end: string;
  period_type: string;
  revenue: number | null;
  ebitda: number | null;
  pat: number | null;
  eps: number | null;
  debt_equity: number | null;
  roce: number | null;
  roe: number | null;
  operating_cash_flow: number | null;
  free_cash_flow: number | null;
}

export interface FinancialsWrapper {
  ticker: string;
  annual: FinancialStatement[];
  quarterly: FinancialStatement[];
}

interface FinancialVisualizerProps {
  financials: FinancialsWrapper;
}

export default function FinancialVisualizer({ financials }: FinancialVisualizerProps) {
  const [financialPeriod, setFinancialPeriod] = useState<"annual" | "quarterly">("annual");
  const [financialChartView, setFinancialChartView] = useState<"revenue_margins" | "capital_returns">("revenue_margins");
  const [hoveredFinancial, setHoveredFinancial] = useState<FinancialStatement | null>(null);
  const [hoveredFinancialIndex, setHoveredFinancialIndex] = useState<number | null>(null);

  const formatNumber = (num: number | null) => {
    if (num === null) return "—";
    return num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  const statementList = financials[financialPeriod] || [];

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-md font-semibold text-white">Clean Multi-Period Financial Columns</h3>
          <p className="text-xs text-gray-500">Extracted from Screener.in recursive table parser</p>
        </div>
        <div className="flex rounded-lg border border-white/10 bg-white/5 p-1 shrink-0">
          <button
            onClick={() => setFinancialPeriod("annual")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              financialPeriod === "annual" ? "bg-electric-500 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Annual (10-Yr)
          </button>
          <button
            onClick={() => setFinancialPeriod("quarterly")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              financialPeriod === "quarterly" ? "bg-electric-500 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            Quarterly (Recent)
          </button>
        </div>
      </div>

      {/* 10-Year Interactive Financial Charts Visualizer */}
      {statementList.length > 0 && (
        <div className="glass-card p-5 border-white/5 bg-white/[0.01] relative overflow-hidden">
          {/* View selector and title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-3">
            <div>
              <h4 className="text-sm font-semibold text-white">10-Year Trend Visualizer</h4>
              <p className="text-[11px] text-gray-500">Interactive financial performance multi-metrics charting</p>
            </div>
            <div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
              <button
                onClick={() => {
                  setFinancialChartView("revenue_margins");
                  setHoveredFinancial(null);
                  setHoveredFinancialIndex(null);
                }}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-300 ${
                  financialChartView === "revenue_margins"
                    ? "bg-gradient-to-br from-electric-500 to-electric-600 text-white shadow-md shadow-electric-500/10"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Revenue & EBITDA Margins
              </button>
              <button
                onClick={() => {
                  setFinancialChartView("capital_returns");
                  setHoveredFinancial(null);
                  setHoveredFinancialIndex(null);
                }}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all duration-300 ${
                  financialChartView === "capital_returns"
                    ? "bg-gradient-to-br from-electric-500 to-electric-600 text-white shadow-md shadow-electric-500/10"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Capital Returns (ROE/ROCE)
              </button>
            </div>
          </div>

          {/* Chart Area */}
          <div className="relative">
            {/* SVG Canvas */}
            {(() => {
              const width = 800;
              const height = 280;
              const paddingTop = 30;
              const paddingBottom = 40;
              const paddingLeft = 55;
              const paddingRight = 55;
              
              const chartWidth = width - paddingLeft - paddingRight;
              const chartHeight = height - paddingTop - paddingBottom;
              
              // Extract metrics
              const revenues = statementList.map(s => s.revenue || 0);
              const roes = statementList.map(s => s.roe || 0);
              const roces = statementList.map(s => s.roce || 0);
              
              // Calculate EBITDA Margins
              const margins = statementList.map(s => {
                if (s.revenue && s.ebitda) {
                  return (s.ebitda / s.revenue) * 100;
                }
                return 0;
              });

              const maxRev = Math.max(...revenues, 1);
              const minRev = Math.min(...revenues, 0);
              const revRange = maxRev - minRev;

              // Margin and Returns bounds
              const percentList = financialChartView === "revenue_margins" ? margins : [...roes, ...roces];
              const maxPercent = Math.max(...percentList, 15);
              const minPercent = Math.min(...percentList, 0);
              const percentRange = maxPercent - minPercent;

              const colWidth = chartWidth / statementList.length;

              // Calculate points for line path
              const linePoints = statementList.map((stmt, idx) => {
                const x = paddingLeft + (idx * colWidth) + (colWidth / 2);
                let pctVal = 0;
                if (financialChartView === "revenue_margins") {
                  pctVal = stmt.revenue && stmt.ebitda ? (stmt.ebitda / stmt.revenue) * 100 : 0;
                } else {
                  pctVal = stmt.roe || 0;
                }
                const y = paddingTop + chartHeight - ((pctVal - minPercent) / (percentRange || 1)) * chartHeight;
                return { x, y, value: pctVal, year: stmt.period_end };
              });

              // Calculate points for secondary line path (ROCE in returns view)
              const secondaryLinePoints = statementList.map((stmt, idx) => {
                const x = paddingLeft + (idx * colWidth) + (colWidth / 2);
                const pctVal = stmt.roce || 0;
                const y = paddingTop + chartHeight - ((pctVal - minPercent) / (percentRange || 1)) * chartHeight;
                return { x, y, value: pctVal, year: stmt.period_end };
              });

              // Construct line paths
              const makeLinePath = (pts: typeof linePoints) => {
                if (pts.length < 2) return "";
                return pts.reduce((path, pt, idx) => {
                  return idx === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
                }, "");
              };

              const path1 = makeLinePath(linePoints);
              const path2 = financialChartView === "capital_returns" ? makeLinePath(secondaryLinePoints) : "";

              // Handle Move interaction
              const onMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const relativeX = (mouseX / rect.width) * width;
                
                const hIdx = Math.floor((relativeX - paddingLeft) / colWidth);
                if (hIdx >= 0 && hIdx < statementList.length) {
                  setHoveredFinancialIndex(hIdx);
                  setHoveredFinancial(statementList[hIdx]);
                }
              };

              const onMouseLeave = () => {
                setHoveredFinancial(null);
                setHoveredFinancialIndex(null);
              };

              return (
                <div className="w-full relative">
                  {/* SVG */}
                  <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto cursor-crosshair overflow-visible"
                    onMouseMove={onMouseMove}
                    onMouseLeave={onMouseLeave}
                  >
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
                      </linearGradient>
                      <linearGradient id="barHoverGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.75" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
                      </linearGradient>
                      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Y-Axis Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, gridIdx) => {
                      const y = paddingTop + chartHeight * (1 - ratio);
                      return (
                        <g key={gridIdx} className="opacity-40">
                          <line
                            x1={paddingLeft}
                            y1={y}
                            x2={width - paddingRight}
                            y2={y}
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          {/* Left Y Labels (Revenue) */}
                          {financialChartView === "revenue_margins" && (
                            <text
                              x={paddingLeft - 10}
                              y={y + 4}
                              textAnchor="end"
                              className="fill-gray-500 font-mono text-[9px] font-bold"
                            >
                              {formatNumber(minRev + revRange * ratio)}
                            </text>
                          )}
                          {/* Right Y Labels (Percent) */}
                          <text
                            x={width - paddingRight + 10}
                            y={y + 4}
                            textAnchor="start"
                            className="fill-gray-500 font-mono text-[9px] font-bold"
                          >
                            {`${(minPercent + percentRange * ratio).toFixed(0)}%`}
                          </text>
                        </g>
                      );
                    })}

                    {/* Columns / Bars for Revenue (only in revenue view) */}
                    {financialChartView === "revenue_margins" && statementList.map((stmt, idx) => {
                      const revVal = stmt.revenue || 0;
                      const barHeight = ((revVal - minRev) / (revRange || 1)) * chartHeight;
                      const barX = paddingLeft + (idx * colWidth) + (colWidth * 0.15);
                      const barY = paddingTop + chartHeight - barHeight;
                      const barW = colWidth * 0.7;
                      
                      const isHovered = hoveredFinancialIndex === idx;

                      return (
                        <rect
                          key={idx}
                          x={barX}
                          y={barY}
                          width={barW}
                          height={Math.max(barHeight, 2)}
                          rx={4}
                          ry={4}
                          fill={isHovered ? "url(#barHoverGrad)" : "url(#barGrad)"}
                          stroke="#6366f1"
                          strokeWidth={isHovered ? 1.5 : 0.75}
                          className="transition-all duration-300"
                        />
                      );
                    })}

                    {/* Line Charts */}
                    {/* Path 1: Margin % (Revenue view) or ROE (Returns view) */}
                    {path1 && (
                      <path
                        d={path1}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#neonGlow)"
                      />
                    )}

                    {/* Path 2: ROCE % (Returns view only) */}
                    {path2 && (
                      <path
                        d={path2}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#neonGlow)"
                      />
                    )}

                    {/* Interaction Dots and Crosshair */}
                    {hoveredFinancialIndex !== null && (
                      <>
                        {/* Vertical tracker line */}
                        <line
                          x1={paddingLeft + (hoveredFinancialIndex * colWidth) + (colWidth / 2)}
                          y1={paddingTop}
                          x2={paddingLeft + (hoveredFinancialIndex * colWidth) + (colWidth / 2)}
                          y2={paddingTop + chartHeight}
                          stroke="rgba(99, 102, 241, 0.4)"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />

                        {/* Line 1 dot */}
                        {linePoints[hoveredFinancialIndex] && (
                          <circle
                            cx={linePoints[hoveredFinancialIndex].x}
                            cy={linePoints[hoveredFinancialIndex].y}
                            r={5}
                            fill="#10b981"
                            stroke="#ffffff"
                            strokeWidth={1.5}
                            className="animate-pulse"
                          />
                        )}

                        {/* Line 2 dot (only in returns view) */}
                        {financialChartView === "capital_returns" && secondaryLinePoints[hoveredFinancialIndex] && (
                          <circle
                            cx={secondaryLinePoints[hoveredFinancialIndex].x}
                            cy={secondaryLinePoints[hoveredFinancialIndex].y}
                            r={5}
                            fill="#6366f1"
                            stroke="#ffffff"
                            strokeWidth={1.5}
                            className="animate-pulse"
                          />
                        )}
                      </>
                    )}

                    {/* X Axis Years */}
                    {statementList.map((stmt, idx) => {
                      const x = paddingLeft + (idx * colWidth) + (colWidth / 2);
                      return (
                        <text
                          key={idx}
                          x={x}
                          y={height - paddingBottom + 20}
                          textAnchor="middle"
                          className="fill-gray-400 font-mono text-[9px] font-bold"
                        >
                          {new Date(stmt.period_end).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "2-digit"
                          })}
                        </text>
                      );
                    })}
                  </svg>

                  {/* Floating Tooltip Card */}
                  {hoveredFinancial && hoveredFinancialIndex !== null && (
                    <div
                      className="absolute z-20 pointer-events-none glass-card p-3.5 border-electric-500/30 bg-navy-950/95 text-[11px] rounded-lg shadow-xl shadow-black/40 min-w-[210px] transition-all duration-200"
                      style={{
                        left: `${Math.min(Math.max((hoveredFinancialIndex / statementList.length) * 100 - 10, 5), 70)}%`,
                        top: "12%",
                      }}
                    >
                      <p className="font-extrabold text-white border-b border-white/10 pb-1 mb-2 font-mono flex items-center justify-between">
                        <span>
                          {new Date(hoveredFinancial.period_end).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                        <span className="badge-blue text-[9px] font-semibold py-0">FY END</span>
                      </p>

                      {financialChartView === "revenue_margins" ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">Revenue:</span>
                            <span className="font-bold text-white font-mono">₹{formatNumber(hoveredFinancial.revenue)} Cr</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">EBITDA:</span>
                            <span className="font-bold text-electric-400 font-mono">₹{formatNumber(hoveredFinancial.ebitda)} Cr</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-emerald-400 font-medium">EBITDA Margin:</span>
                            <span className="font-bold text-emerald-400 font-mono">
                              {hoveredFinancial.revenue && hoveredFinancial.ebitda
                                ? `${((hoveredFinancial.ebitda / hoveredFinancial.revenue) * 100).toFixed(1)}%`
                                : "—"}
                            </span>
                          </div>
                          {/* YoY calculation if not first */}
                          {hoveredFinancialIndex > 0 && statementList[hoveredFinancialIndex - 1]?.revenue && (
                            <div className="flex justify-between items-center border-t border-white/5 pt-1.5 mt-1.5">
                              <span className="text-gray-500 text-[10px]">YoY Revenue Growth:</span>
                              {(() => {
                                const prevRev = statementList[hoveredFinancialIndex - 1].revenue || 1;
                                const currRev = hoveredFinancial.revenue || 0;
                                const growth = ((currRev - prevRev) / prevRev) * 100;
                                return (
                                  <span className={`font-semibold font-mono text-[10px] ${growth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                    {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-emerald-400 font-medium">ROE (%):</span>
                            <span className="font-bold text-emerald-400 font-mono">
                              {hoveredFinancial.roe ? `${hoveredFinancial.roe.toFixed(2)}%` : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-electric-400 font-medium">ROCE (%):</span>
                            <span className="font-bold text-electric-400 font-mono">
                              {hoveredFinancial.roce ? `${hoveredFinancial.roce.toFixed(2)}%` : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t border-white/5 pt-1.5 mt-1.5">
                            <span className="text-gray-400 font-medium">Debt / Equity:</span>
                            <span className="font-bold text-gold-400 font-mono">
                              {hoveredFinancial.debt_equity !== null ? hoveredFinancial.debt_equity.toFixed(2) : "0.00"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Financials Table */}
      {statementList.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-gray-400 uppercase font-mono">
                <th className="py-3 pr-4 font-semibold">Metrics (₹ Cr)</th>
                {statementList.map((stmt, idx) => (
                  <th key={idx} className="py-3 px-4 text-right font-semibold">
                    {new Date(stmt.period_end).toLocaleDateString("en-IN", {
                      month: "short",
                      year: "numeric"
                    })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="py-3.5 pr-4 text-gray-300 font-sans font-medium text-sm">Revenue</td>
                {statementList.map((stmt, idx) => (
                  <td key={idx} className="py-3.5 px-4 text-right font-bold text-white">
                    {formatNumber(stmt.revenue)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="py-3.5 pr-4 text-gray-300 font-sans font-medium text-sm">EBITDA</td>
                {statementList.map((stmt, idx) => (
                  <td key={idx} className="py-3.5 px-4 text-right text-gray-300">
                    {formatNumber(stmt.ebitda)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="py-3.5 pr-4 text-gray-300 font-sans font-medium text-sm">PAT (Net Profit)</td>
                {statementList.map((stmt, idx) => (
                  <td key={idx} className="py-3.5 px-4 text-right text-gray-300">
                    {formatNumber(stmt.pat)}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="py-3.5 pr-4 text-gray-300 font-sans font-medium text-sm">EPS (₹)</td>
                {statementList.map((stmt, idx) => (
                  <td key={idx} className="py-3.5 px-4 text-right text-gray-400">
                    {stmt.eps ? stmt.eps.toFixed(2) : "—"}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="py-3.5 pr-4 text-gray-300 font-sans font-medium text-sm">ROE (%)</td>
                {statementList.map((stmt, idx) => (
                  <td key={idx} className="py-3.5 px-4 text-right text-gray-400">
                    {stmt.roe ? `${stmt.roe.toFixed(2)}%` : "—"}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="py-3.5 pr-4 text-gray-300 font-sans font-medium text-sm">ROCE (%)</td>
                {statementList.map((stmt, idx) => (
                  <td key={idx} className="py-3.5 px-4 text-right text-gray-400">
                    {stmt.roce ? `${stmt.roce.toFixed(2)}%` : "—"}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="py-3.5 pr-4 text-gray-300 font-sans font-medium text-sm">Debt/Equity</td>
                {statementList.map((stmt, idx) => (
                  <td key={idx} className="py-3.5 px-4 text-right text-gray-400">
                    {stmt.debt_equity ? stmt.debt_equity.toFixed(2) : "0.00"}
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-white/[0.01] transition-colors">
                <td className="py-3.5 pr-4 text-gray-300 font-sans font-medium text-sm">Operating Cash Flow</td>
                {statementList.map((stmt, idx) => (
                  <td key={idx} className="py-3.5 px-4 text-right text-gray-300">
                    {formatNumber(stmt.operating_cash_flow)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-60 flex items-center justify-center text-sm text-gray-500">
          No financial data found in local database scraper for this stock.
        </div>
      )}
    </div>
  );
}
