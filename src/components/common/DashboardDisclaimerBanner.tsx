"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * DashboardDisclaimerBanner
 * ─────────────────────────
 * Persistent footer disclaimer shown at the bottom of every dashboard page.
 * Moved from sticky top to footer so it doesn't interrupt workflow.
 * Dismissal is remembered in localStorage so it doesn't reappear every session.
 */
export default function DashboardDisclaimerBanner() {
  const [dismissed, setDismissed] = useState(true); // start hidden until we read storage

  useEffect(() => {
    const stored = localStorage.getItem("disclaimer_dismissed");
    setDismissed(stored === "true");
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("disclaimer_dismissed", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="w-full border-t border-amber-500/15 bg-amber-950/40 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
          <svg className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-[10px] text-amber-300/80 leading-relaxed">
            <strong className="text-amber-200">FOR EDUCATIONAL & RESEARCH USE ONLY.</strong>{" "}
            AI-generated scores and signals are <strong className="text-amber-200">NOT investment advice</strong>. Not registered with SEBI, SEC, or any regulator.
            All investments carry risk — <strong className="text-amber-200">you may lose money</strong>.{" "}
            <Link href="/terms#risk-disclosure" className="underline hover:text-white transition-colors">Full risk disclosure →</Link>
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-amber-500/70 hover:text-amber-300 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors whitespace-nowrap"
          aria-label="Dismiss disclaimer"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Got it
        </button>
      </div>
    </div>
  );
}
