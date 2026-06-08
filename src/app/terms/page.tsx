"use client";

import Link from "next/link";
import { useState } from "react";

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("regulatory-disclaimer");

  const sections = [
    { id: "regulatory-disclaimer", label: "Regulatory Disclaimer" },
    { id: "platform-license", label: "Platform Usage & License" },
    { id: "subscriptions", label: "Subscriptions & Billing" },
    { id: "sms-alerts", label: "Twilio SMS & Alerts" },
    { id: "risk-disclosure", label: "Market Risk Disclosure" },
    { id: "limitation-liability", label: "Limitation of Liability" },
    { id: "indemnification", label: "Indemnification" },
    { id: "termination", label: "Account Termination" },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] bg-grid-white/[0.02] text-white">
      {/* ── Fixed Premium Header ────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full h-[72px] bg-[#070913]/80 border-b border-white/5 backdrop-blur-xl flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-3">
          <img src="/favicon.ico" alt="Logo" className="h-8 w-8 object-contain rounded" />
          <span className="text-lg font-bold text-white tracking-tight">Stock Kundli</span>
          <span className="badge-blue text-[10px] px-1.5 py-0.5 rounded bg-electric-500/10 border border-electric-500/20 text-electric-400 font-medium">AI</span>
        </div>
        <Link 
          href="/"
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </header>

      {/* ── Content Layout ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-24">
        
        {/* Title Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-gray-400 text-sm mt-3">
            Last Updated: June 8, 2026 • AI Stock Kundli Terms & Disclaimers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Left Navigation Sidebar (Sticky) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-32 space-y-1 bg-white/[0.01] border border-white/5 p-4 rounded-xl backdrop-blur-md">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-3">Sections</p>
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeSection === sec.id
                      ? "bg-electric-500/10 text-electric-400 border-l-2 border-electric-500 pl-2"
                      : "text-gray-400 hover:bg-white/[0.02] hover:text-gray-200 pl-3"
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Detailed Documentation */}
          <div className="lg:col-span-3 space-y-12">
            
            {/* Section: Regulatory Disclaimer */}
            <section id="regulatory-disclaimer" className="scroll-mt-32 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-electric-400">01.</span> Regulatory & Advisory Disclaimer
              </h2>
              <div className="p-6 bg-red-950/20 border border-red-500/10 rounded-2xl space-y-4 text-gray-300 text-sm leading-relaxed">
                <p className="font-semibold text-red-400">
                  CRITICAL DISCLOSURE FOR ALL USERS:
                </p>
                <p>
                  AI Stock Kundli (the "Platform") is an automated algorithmic research and analytics tool powered by multi-agent Large Language Models (LLMs) and standard mathematical technical indicators. 
                </p>
                <p>
                  The Platform is <span className="underline">NOT</span> registered as an investment advisor with the <strong className="text-white">Securities and Exchange Board of India (SEBI)</strong>, the <strong className="text-white">U.S. Securities and Exchange Commission (SEC)</strong>, the <strong className="text-white">Financial Conduct Authority (FCA)</strong>, or any other global financial regulator. 
                </p>
                <p>
                  All generated consensus ratings, buy/sell indicators, risk flags, and technical breakout scores are mathematical, automated calculations based on historical data. They do not constitute personalized financial advice, investment recommendations, or an endorsement to buy, sell, or hold any security.
                </p>
              </div>
            </section>

            {/* Section: Platform License */}
            <section id="platform-license" className="scroll-mt-32 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-electric-400">02.</span> Platform Usage & License
              </h2>
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  We grant you a limited, non-exclusive, non-transferable, and revocable license to access the Platform for personal, educational, or professional research purposes.
                </p>
                <p>You agree not to:</p>
                <ul className="list-disc list-inside pl-4 space-y-2 text-gray-400">
                  <li>Incorporate bots, spiders, scrapers, or other automated scripts to scrape our AI intelligence data.</li>
                  <li>Evade, bypass, or attempt to tamper with our API rate limiters or registration thresholds.</li>
                  <li>Resell, redistribute, or white-label any generated report without written approval from AI Stock Kundli.</li>
                </ul>
              </div>
            </section>

            {/* Section: Subscriptions */}
            <section id="subscriptions" className="scroll-mt-32 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-electric-400">03.</span> Subscriptions, Limits & Billing
              </h2>
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  We offer a combination of Free trial access and premium subscription plans (Pro, Advisor).
                </p>
                <ul className="list-disc list-inside pl-4 space-y-2 text-gray-400">
                  <li><strong className="text-gray-200">Free Tier:</strong> Limited to 3 stock analysis reports per calendar day. Shared indicators and delayed data applies.</li>
                  <li><strong className="text-gray-200">Premium Tiers:</strong> Subscriptions are billed on a recurring monthly or annual schedule. Cancellations take effect at the end of the current billing cycle.</li>
                  <li><strong className="text-gray-200">No Refund Policy:</strong> Except as required by law, all subscription fees are non-refundable.</li>
                </ul>
              </div>
            </section>

            {/* Section: SMS Alerts */}
            <section id="sms-alerts" className="scroll-mt-32 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-electric-400">04.</span> Twilio SMS & Telegram Alerts
              </h2>
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  If you opt-in to configure real-time breakout or sentiment notifications, you agree to receive automated messages on the provided mobile number.
                </p>
                <p>
                  You acknowledge that SMS transmission relies on telecommunication carriers and Twilio API routing. AI Stock Kundli does not guarantee instantaneous delivery or compensate for delayed, lost, or carrier-blocked messages.
                </p>
              </div>
            </section>

            {/* Section: Risk Disclosure */}
            <section id="risk-disclosure" className="scroll-mt-32 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-electric-400">05.</span> Financial & Market Risk Disclosure
              </h2>
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  Trading in financial markets—including equities, derivatives, commodities, and foreign exchange—carries a high level of risk and may result in the loss of all invested capital.
                </p>
                <p>
                  Historical performance, backtest ratios, and AI consensus scores are simulated metrics and do not guarantee future profitability. You are solely responsible for executing trades, analyzing risk parameters, and conducting independent verification.
                </p>
              </div>
            </section>

            {/* Section: Limitation of Liability */}
            <section id="limitation-liability" className="scroll-mt-32 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-electric-400">06.</span> Limitation of Liability
              </h2>
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  In no event shall AI Stock Kundli, its developers, founders, affiliates, or data suppliers be liable for any financial losses, lost profits, or direct/indirect damages arising from the use of the platform, inaccurate stock data, delayed indicators, or reliance on AI reports.
                </p>
              </div>
            </section>

            {/* Section: Indemnification */}
            <section id="indemnification" className="scroll-mt-32 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-electric-400">07.</span> Indemnification
              </h2>
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  You agree to indemnify, defend, and hold harmless AI Stock Kundli and its team members from and against any claims, damages, liabilities, costs, or losses arising out of your violation of these terms or misuse of platform resources.
                </p>
              </div>
            </section>

            {/* Section: Termination */}
            <section id="termination" className="scroll-mt-32 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-electric-400">08.</span> Account Termination
              </h2>
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  We reserve the right to suspend or terminate your account immediately, without prior notice, if you engage in fraudulent behavior, abuse platform request rates, or violate these Terms of Service.
                </p>
              </div>
            </section>

          </div>

        </div>

      </div>

      {/* ── Mini Footer ────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-gray-500 bg-[#070913]">
        <p>AI Stock Kundli © 2026 • Secure & Transparent AI Research</p>
      </footer>
    </div>
  );
}
