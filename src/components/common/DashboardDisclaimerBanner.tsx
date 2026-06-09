"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * DashboardDisclaimerBanner
 * ─────────────────────────
 * Persistent sticky warning banner shown at the top of every dashboard page.
 * Can be minimized per session (not permanently dismissed), so users always
 * see it when they open a new browser tab or refresh.
 */
export default function DashboardDisclaimerBanner() {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <div className="sticky top-0 z-40 w-full">
        <button
          onClick={() => setMinimized(false)}
          className="w-full flex items-center justify-center gap-2 py-1 bg-amber-600/80 hover:bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest transition-colors backdrop-blur-sm"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          ⚠️ Research Tool Only — Not Investment Advice — Click to expand disclaimer
        </button>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-amber-950/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
          <svg className="h-4 w-4 shrink-0 text-amber-400 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-[11px] text-amber-200 leading-relaxed">
            <strong className="text-amber-100">FOR EDUCATIONAL & RESEARCH USE ONLY.</strong>{" "}
            AI-generated scores, signals, and reports are{" "}
            <strong className="text-amber-100">NOT investment advice</strong>. This platform is not registered with SEBI, SEC, or any regulator.
            All investments carry risk — <strong className="text-amber-100">you may lose money</strong>. Invest only what you can afford to lose.{" "}
            <Link href="/terms#risk-disclosure" className="underline hover:text-white transition-colors">Read full risk disclosure →</Link>
          </p>
        </div>
        <button
          onClick={() => setMinimized(true)}
          className="shrink-0 text-amber-400 hover:text-amber-200 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors ml-2"
          aria-label="Minimize disclaimer"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          Minimise
        </button>
      </div>
    </div>
  );
}
