"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * RiskConsentModal
 * ────────────────
 * Full-screen, non-dismissible consent modal shown on every user's first visit.
 * The user MUST tick all three checkboxes and click "I Understand & Accept" before
 * they can access any part of the platform.
 *
 * Acceptance is stored in localStorage so it only shows once per browser session
 * (user must re-accept after clearing storage).
 */

const CONSENT_KEY = "stockkundli_risk_consent_v2";

export default function RiskConsentModal() {
  const [visible, setVisible] = useState(false);
  const [checks, setChecks] = useState({ c1: false, c2: false, c3: false });
  const allChecked = checks.c1 && checks.c2 && checks.c3;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ acceptedAt: new Date().toISOString() }));
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    /* Overlay — blocks all interaction with the page behind it */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md px-4 py-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="consent-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-red-500/20 bg-[#070913] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top red accent bar */}
        <div className="h-1 w-full shrink-0 bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />

        <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
              <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">
                Important Disclosure — Read Before Continuing
              </p>
              <h2 id="consent-title" className="text-xl font-extrabold text-white leading-snug">
                AI Stock Kundli is for <span className="text-red-400">Educational & Research Purposes Only</span>
              </h2>
            </div>
          </div>

          {/* Body */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-3 text-sm text-gray-300 leading-relaxed">
            <p>
              <strong className="text-white">This platform does NOT provide investment advice.</strong> All
              AI-generated scores, consensus ratings, buy/sell signals, technical indicators, and research
              reports are <span className="text-yellow-400 font-semibold">automated mathematical calculations</span> based
              on publicly available historical data. They are strictly for knowledge, learning, and research purposes.
            </p>
            <p>
              AI Stock Kundli is <strong className="text-white">NOT registered</strong> as an Investment Adviser
              with SEBI, SEC, FCA, or any other financial regulatory authority. Nothing on this platform
              constitutes personalized financial advice, a solicitation to buy or sell any security, or a
              SEBI-regulated research analyst report.
            </p>
            <p className="text-orange-300 font-semibold">
              ⚠️ Investing in securities markets involves substantial risk. You may lose part or all of
              your invested capital. Past performance is not indicative of future results. Any investment
              decision you make is entirely your own responsibility and at your own risk.
            </p>
            <p className="text-gray-400 text-xs">
              The creators, developers, and operators of this platform accept no liability whatsoever for
              any financial losses, damages, or adverse outcomes resulting directly or indirectly from
              use of or reliance on information provided by this platform.
            </p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={checks.c1}
                onChange={(e) => setChecks((p) => ({ ...p, c1: e.target.checked }))}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500/20"
              />
              <span className="text-xs text-gray-300 group-hover:text-white transition-colors leading-normal">
                I understand that <strong className="text-white">all AI analysis on this platform is for educational and informational
                purposes only</strong> and does not constitute investment advice or recommendations to buy, sell, or hold any security.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={checks.c2}
                onChange={(e) => setChecks((p) => ({ ...p, c2: e.target.checked }))}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500/20"
              />
              <span className="text-xs text-gray-300 group-hover:text-white transition-colors leading-normal">
                I acknowledge that <strong className="text-white">any investment I make is entirely my own decision and at my own risk</strong>.
                I will not hold AI Stock Kundli, its developers, or affiliates responsible for any financial losses I may incur.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={checks.c3}
                onChange={(e) => setChecks((p) => ({ ...p, c3: e.target.checked }))}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-600 bg-gray-800 text-red-500 focus:ring-red-500/20"
              />
              <span className="text-xs text-gray-300 group-hover:text-white transition-colors leading-normal">
                I have read and agree to the{" "}
                <Link href="/terms" target="_blank" className="text-electric-400 underline hover:text-electric-300">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" target="_blank" className="text-electric-400 underline hover:text-electric-300">Privacy Policy</Link>
                , including the full risk disclosures and limitation of liability clauses.
              </span>
            </label>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button
              onClick={handleAccept}
              disabled={!allChecked}
              className={`w-full sm:w-auto flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all duration-200 ${
                allChecked
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20 cursor-pointer"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }`}
            >
              {allChecked ? "I Understand & Accept — Continue to Platform" : "Please check all boxes to continue"}
            </button>
          </div>

          <p className="text-[10px] text-gray-600 text-center">
            By continuing, you confirm you are using this platform solely for research and educational purposes.
            This consent is stored locally in your browser.
          </p>
        </div>{/* end scrollable content */}
      </div>
    </div>
  );
}
