"use client";

import Link from "next/link";
import { useState } from "react";

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState("introduction");

  const sections = [
    { id: "introduction", label: "Introduction" },
    { id: "data-collection", label: "Information We Collect" },
    { id: "data-use", label: "How We Use Information" },
    { id: "data-security", label: "Data Security" },
    { id: "twilio-sms", label: "Twilio SMS & Alerts" },
    { id: "third-party", label: "Third-Party Data & Feeds" },
    { id: "user-rights", label: "Your Rights & Controls" },
    { id: "updates", label: "Policy Updates" },
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
            Privacy Policy
          </h1>
          <p className="text-gray-400 text-sm mt-3">
            Last Updated: June 8, 2026 • AI Stock Kundli Platform Privacy Disclosures
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

            {/* ── Data Protection Summary Banner ── */}
            <div className="p-5 bg-electric-500/[0.04] border border-electric-500/15 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="shrink-0 h-10 w-10 rounded-xl bg-electric-500/10 flex items-center justify-center">
                <svg className="h-5 w-5 text-electric-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-electric-300 uppercase tracking-wider">Your Data, Protected</p>
                <p className="text-sm text-gray-300">
                  We collect only what is necessary to run the platform. We do not sell your data to advertisers or data brokers.
                  All credentials are hashed. All communication is encrypted with TLS 1.3. You can delete your account and all
                  associated data at any time.
                </p>
              </div>
            </div>
            
            {/* Section: Introduction */}
            <section id="introduction" className="scroll-mt-32 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-electric-400">01.</span> Introduction
              </h2>
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  At <strong>AI Stock Kundli</strong>, we are committed to safeguarding your privacy and security. This Privacy Policy details how we collect, process, secure, and share your data when you interact with our platform, search equities, or register for our subscription tiers.
                </p>
                <p>
                  Our primary objective is to provide institutional-grade, data-driven AI consensus and research. In doing so, we collect only the minimum necessary information required to authenticate users, compile intelligence reports, and deliver real-time telemetry alerts.
                </p>
              </div>
            </section>

            {/* Section: Data Collection */}
            <section id="data-collection" className="scroll-mt-32 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-electric-400">02.</span> Information We Collect
              </h2>
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>We collect information in three categories to support the platform:</p>
                <ul className="list-disc list-inside pl-4 space-y-2 text-gray-400">
                  <li>
                    <strong className="text-gray-200">Account Credentials:</strong> User email, name, secure password hashes, and user settings when you register.
                  </li>
                  <li>
                    <strong className="text-gray-200">Alert Subscriptions:</strong> Phone numbers and email addresses specifically provided to configure breakout telemetry via Twilio SMS and SMTP alerts.
                  </li>
                  <li>
                    <strong className="text-gray-200">Search & Research History:</strong> Discovered tickers and search history used to optimize the backend query cache and real-time ingestion pipeline.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section: How We Use Information */}
            <section id="data-use" className="scroll-mt-32 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-electric-400">03.</span> How We Use Information
              </h2>
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>Your data is processed strictly to provide the core platform experience:</p>
                <ul className="list-disc list-inside pl-4 space-y-2 text-gray-400">
                  <li>To run background ingestion and compile multi-agent consensus metrics.</li>
                  <li>To dispatch user-initiated telemetry alerts (RSI breakout, news sentiment shift, or consensus changes).</li>
                  <li>To manage billing, plan tiers (Free, Pro, Advisor), and system-usage limits (e.g. 3 reports per day for Free accounts).</li>
                </ul>
              </div>
            </section>

            {/* Section: Data Security */}
            <section id="data-security" className="scroll-mt-32 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-electric-400">04.</span> Data Security & Integrity
              </h2>
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  All user data, credentials, and API communication are fully encrypted in transit using Transport Layer Security (TLS 1.3) and at rest.
                </p>
                <p>
                  We store no raw password data (only securely hashed keys) and enforce strict access control layers on our PostgreSQL and Redis databases to prevent data leaks or unauthorized queries.
                </p>
              </div>
            </section>

            {/* Section: Twilio SMS & Alerts */}
            <section id="twilio-sms" className="scroll-mt-32 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-electric-400">05.</span> Twilio SMS & Alerts Consent
              </h2>
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  By enabling real-time breakout alerts, you explicitly opt-in to receive automated SMS updates.
                </p>
                <ul className="list-disc list-inside pl-4 space-y-2 text-gray-400">
                  <li>We dispatch SMS alerts exclusively via <strong className="text-gray-200">Twilio</strong> APIs.</li>
                  <li>Carrier rates may apply depending on your service plan.</li>
                  <li>You can toggle or mute notifications at any time in your user settings panel or by deleting active alert rules.</li>
                </ul>
              </div>
            </section>

            {/* Section: Third-Party Data & Feeds */}
            <section id="third-party" className="scroll-mt-32 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-electric-400">06.</span> Third-Party Data & External Feeds
              </h2>
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  We consume public market data and news feeds (Yahoo Finance API) to generate consensus. We do not sell your personal or financial search data to data brokers or advertising agencies.
                </p>
                <p>
                  For global compliance, stocks are mapped dynamically to regional regulatory jurisdictions (e.g. SEBI in India, SEC in the USA, FCA in the United Kingdom).
                </p>
              </div>
            </section>

            {/* Section: User Rights */}
            <section id="user-rights" className="scroll-mt-32 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-electric-400">07.</span> Your Rights & Controls
              </h2>
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  You retain full control over your personal account profile. You have the right to request access to the data we hold, modify your alert settings, or delete your account permanently. Account deletion will instantly purge all stored phone alert records and user watchlist settings.
                </p>
              </div>
            </section>

            {/* Section: Updates */}
            <section id="updates" className="scroll-mt-32 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-electric-400">08.</span> Policy Updates
              </h2>
              <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4 text-gray-300 text-sm leading-relaxed">
                <p>
                  We may periodically update this policy to reflect platform updates, regulatory compliance adjustments, or changes in third-party integrations. Any major update will be notified via our dashboard interface or user alerts.
                </p>
              </div>
            </section>

          </div>

        </div>

      </div>

      {/* ── Mini Footer ────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-gray-500 bg-[#070913]">
        <p>AI Stock Kundli © 2026 • Secure & Transparent AI Research</p>
        <p className="mt-2 text-gray-600">
          For educational use only. Not investment advice.{" "}
          <a href="/terms" className="underline hover:text-gray-400 transition-colors">Terms of Service</a>
          {" "}•{" "}
          <a href="/terms#risk-disclosure" className="underline hover:text-gray-400 transition-colors">Risk Disclosure</a>
        </p>
      </footer>
    </div>
  );
}
