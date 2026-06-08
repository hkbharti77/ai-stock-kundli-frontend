"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Aesthetic Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/[0.08] rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/[0.08] rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-electric-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Grid overlay for a high-tech developer look */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="relative z-10 text-center max-w-lg mx-auto space-y-8 px-4">
        {/* Animated Radial Indicator / Tech Radar */}
        <div className="flex justify-center">
          <div className="relative h-44 w-44 flex items-center justify-center">
            {/* Pulsing Outer Ring */}
            <div className="absolute inset-0 rounded-full border border-rose-500/25 animate-ping opacity-75" style={{ animationDuration: "3s" }} />
            {/* Rotating Radar Line */}
            <div className="absolute inset-2 rounded-full border border-dashed border-indigo-500/30 animate-spin" style={{ animationDuration: "20s" }} />
            {/* Inner Glass Orb */}
            <div className="absolute inset-6 rounded-full bg-navy-900/80 border border-white/10 backdrop-blur-md shadow-2xl flex items-center justify-center">
              <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400 font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                404
              </span>
            </div>
          </div>
        </div>

        {/* Text Copy */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-wider">
            Market Route Not Found
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
            The stock ticker or page you are looking for might have been delisted, renamed, or has drifted out of our index universe.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition duration-200 cursor-pointer"
          >
            ← Go Back
          </button>
          
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-electric-500 hover:from-indigo-600 hover:to-electric-600 text-white font-bold text-xs uppercase tracking-widest transition duration-200 shadow-lg shadow-indigo-500/20 text-center cursor-pointer"
          >
            Return to Dashboard
          </Link>
        </div>

        {/* Decorative Quote / Legal-style touch */}
        <div className="pt-8 text-[10px] text-gray-600 uppercase tracking-widest border-t border-white/5 font-semibold">
          AI Investment Engine • Session Active
        </div>
      </div>
    </div>
  );
}
