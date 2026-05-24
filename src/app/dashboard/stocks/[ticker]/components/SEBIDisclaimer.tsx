"use client";

import React from "react";

export default function SEBIDisclaimer() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-rose-500/10 bg-rose-500/[0.02] p-5 backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.02] to-transparent pointer-events-none" />
      
      <div className="relative z-10 space-y-3">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-widest">
          <svg className="h-4 w-4 shrink-0 animate-pulse text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          SEBI Compliance & Disclosure Notice
        </div>
        
        <p className="text-[11px] text-gray-400 leading-relaxed text-justify">
          Investment in securities market are subject to market risks. Read all the related documents carefully before investing. 
          Registration granted by SEBI, membership of BASL and certification from NISM in no way guarantee performance of the intermediary 
          or provide any assurance of returns to investors. The AI-generated scores, signals, ratings, and analyses presented here 
          are for educational and informational purposes only and do not constitute professional financial advice, Buy/Sell recommendations, 
          or research analyst reports under SEBI regulations. 
        </p>

        <div className="pt-2 flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-gray-500 font-semibold uppercase tracking-wider border-t border-white/5">
          <span>AI Kundli Engine v1.0.4</span>
          <span>•</span>
          <span>Intermediary Code: PR-2026-X</span>
          <span>•</span>
          <span>Consensus Signal Model v2.4</span>
        </div>
      </div>
    </div>
  );
}
