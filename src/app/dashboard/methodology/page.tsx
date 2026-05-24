"use client";

import Link from "next/link";
import { useTranslation } from "../../../context/LanguageContext";
import LanguageSelector from "../../../components/LanguageSelector";

export default function MethodologyPage() {
  const { t, language } = useTranslation();
  const isHindi = language === "hi";

  // Data for the 7-agent consensus engine
  const agents = [
    {
      id: "fundamental",
      weight: "25%",
      color: "border-emerald-500/20 bg-emerald-500/[0.01] text-emerald-400",
      titleEn: "Fundamental Analyst",
      titleHi: "बुनियादी विश्लेषक (Fundamental)",
      descEn: "Calculates balance sheet leverage, capital allocations, ROCE consistency, operating cash flows, PAT margins, and profitability trends.",
      descHi: "बैलेंस शीट लीवरेज, पूंजी आवंटन, ROCE निरंतरता, ऑपरेटिंग कैश फ्लो, PAT मार्जिन और लाभप्रदता रुझानों की गणना करता है।"
    },
    {
      id: "risk",
      weight: "20%",
      color: "border-rose-500/20 bg-rose-500/[0.01] text-rose-400",
      titleEn: "Risk Analyst",
      titleHi: "जोखिम विश्लेषक (Risk)",
      descEn: "Assesses corporate governance standards, promoter pledge ratios, audit qualifications, and regulatory litigation red flags.",
      descHi: "कॉर्पोरेट प्रशासन मानकों, प्रमोटर गिरवी अनुपात, ऑडिट योग्यताओं और विनियामक मुकदमेबाजी के रेड फ्लैग का आकलन करता है।"
    },
    {
      id: "technical",
      weight: "15%",
      color: "border-indigo-500/20 bg-indigo-500/[0.01] text-indigo-400",
      titleEn: "Technical Analyst",
      titleHi: "तकनीकी विश्लेषक (Technical)",
      descEn: "Evaluates historical price candles, moving average breakouts (EMA/SMA), support/resistance clusters, and RSI recoveries.",
      descHi: "ऐतिहासिक मूल्य कैंडल, मूविंग एवरेज ब्रेकआउट (EMA/SMA), समर्थन/प्रतिरोध समूहों और RSI रिकवरी का मूल्यांकन करता है।"
    },
    {
      id: "news",
      weight: "15%",
      color: "border-purple-500/20 bg-purple-500/[0.01] text-purple-400",
      titleEn: "News & Media Analyst",
      titleHi: "समाचार विश्लेषक (News)",
      descEn: "Scrapes and classifies financial media releases in real-time, mapping narrative impact to public market sentiment.",
      descHi: "वास्तविक समय में वित्तीय मीडिया रिलीज को स्क्रैप और वर्गीकृत करता है, जिससे जनभावना पर पड़ने वाले प्रभाव का आकलन किया जा सके।"
    },
    {
      id: "valuation",
      weight: "10%",
      color: "border-blue-500/20 bg-blue-500/[0.01] text-blue-400",
      titleEn: "Valuation Analyst",
      titleHi: "मूल्यांकन विश्लेषक (Valuation)",
      descEn: "Calculates discount rates, intrinsic margin of safety, Discounted Cash Flow (DCF) outcomes, and relative P/E ratios.",
      descHi: "डिस्काउंट दरों, आंतरिक सुरक्षा मार्जिन, डिस्काउंटेड कैश फ्लो (DCF) परिणामों और सापेक्ष P/E अनुपातों की गणना करता है।"
    },
    {
      id: "macro",
      weight: "10%",
      color: "border-amber-500/20 bg-amber-500/[0.01] text-amber-400",
      titleEn: "Macro Environment Analyst",
      titleHi: "मैक्रो विश्लेषक (Macro)",
      descEn: "Monitors currency volatility, domestic interest rate updates, inflation trends, and macro industrial policies.",
      descHi: "मुद्रा अस्थिरता, घरेलू ब्याज दर अपडेट, मुद्रास्फीति के रुझान और मैक्रो औद्योगिक नीतियों पर नजर रखता है।"
    },
    {
      id: "sector",
      weight: "5%",
      color: "border-cyan-500/20 bg-cyan-500/[0.01] text-cyan-400",
      titleEn: "Sector Benchmark Analyst",
      titleHi: "सेक्टर विश्लेषक (Sector)",
      descEn: "Compares financial performance, revenue growth, and multiple spreads directly against close industry competitors.",
      descHi: "वित्तीय प्रदर्शन, राजस्व वृद्धि और मल्टीपल स्प्रेड की सीधे तौर पर करीबी उद्योग प्रतिस्पर्धियों से तुलना करता है।"
    }
  ];

  return (
    <div className="min-h-screen bg-[#070913] bg-gradient-to-b from-[#090d23] to-[#04060d] text-white relative font-sans">
      {/* Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 left-20 h-[450px] w-[450px] rounded-full bg-indigo-500/[0.04] blur-[130px]" />
        <div className="absolute bottom-10 right-10 h-[350px] w-[350px] rounded-full bg-emerald-500/[0.03] blur-[110px]" />
      </div>

      {/* Top Navigation */}
      <nav className="relative z-20 border-b border-white/5 bg-[#070913]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-electric-500 shadow-md shadow-indigo-500/20">
                <span className="text-sm font-black text-white">K</span>
              </div>
              <span className="text-base font-extrabold text-white tracking-tight">
                {isHindi ? "एआई स्टॉक कुंडली" : "AI Stock Kundli"}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Link href="/dashboard" className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition duration-300">
              {isHindi ? "डैशबोर्ड" : "Dashboard"}
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="relative z-10 mx-auto max-w-4xl px-6 py-12 space-y-10">
        
        {/* Header Hero */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-indigo-400">
            <span>{isHindi ? "प्लेटफ़ॉर्म दस्तावेज़ीकरण" : "Platform Documentation"}</span>
            <span>•</span>
            <span>{isHindi ? "एआई सर्वसम्मति इंजन" : "AI Consensus Engine"}</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-100 to-indigo-300 bg-clip-text text-transparent">
            {isHindi ? "एआई कुंडली स्कोरिंग प्रणाली" : "AI Stock Kundli Scoring Methodology"}
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
            {isHindi 
              ? "एआई स्टॉक कुंडली वित्तीय और जनभावना डेटा के अरबों बिंदुओं को संसाधित करती है, और एक भारित सर्वसम्मति मॉडल के माध्यम से एक सटीक निवेश निर्णय प्रदान करती है।"
              : "The AI Stock Kundli processes billions of datapoints across fundamental health, technical momentum, and live news sentiment, combining them through a weighted mathematical consensus framework."
            }
          </p>
        </div>

        {/* Section 1: Weight Grid */}
        <section className="glass-card p-8 space-y-6 border-white/5 bg-white/[0.01] rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/[0.02] blur-3xl pointer-events-none" />
          
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            {isHindi ? "1. सात-एजेंट भारित कंसेंसस ढांचा" : "1. Seven-Agent Weighted Consensus Framework"}
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            {isHindi
              ? "हमारा सिस्टम सात स्वतंत्र, डोमेन-विशिष्ट एआई विश्लेषक एजेंट चलाता है। इनके भारित औसत से अंतिम कुंडली स्कोर प्राप्त होता है, जो दीर्घकालिक वित्तीय मूल्य और वास्तविक समय के बाजार ट्रिगर्स को संतुलित करता है।"
              : "Our system runs seven independent, domain-specialized AI analyst agents. The final Kundli Score is computed via a normalized weighted average of their outputs, balancing long-term value factors with real-time momentum."
            }
          </p>

          <div className="grid gap-4 md:grid-cols-2 pt-2">
            {agents.map((agent) => (
              <div key={agent.id} className={`rounded-xl border p-4 space-y-2 hover:scale-[1.01] transition-all duration-300 ${agent.color}`}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white">{isHindi ? agent.titleHi : agent.titleEn}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 border border-white/5">{agent.weight}</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {isHindi ? agent.descHi : agent.descEn}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-navy-950/80 border border-white/5 p-4 flex flex-col items-center justify-center gap-2 text-center font-mono text-xs font-semibold tracking-wide text-indigo-300">
            <div className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">{isHindi ? "कुंडली गणितीय समीकरण" : "Consensus Score Math"}</div>
            <div className="text-sm text-white font-extrabold">
              Score = [ (F × 0.25) + (R × 0.20) + (T × 0.15) + (N × 0.15) + (M × 0.10) + (V × 0.10) + (S × 0.05) ] / ∑ W
            </div>
            <div className="text-[10px] text-gray-500 font-sans italic mt-1">
              {isHindi ? "* ∑ W = केवल सक्रिय और उपलब्ध एआई एजेंटों के कुल भार का योग (सिस्टम विफलता पर पेनल्टी रहित सामान्यीकरण)" : "* ∑ W represents the sum of weights of only active, available agents (Dynamic Normalization)."}
            </div>
          </div>
        </section>

        {/* Section 2: Thresholds */}
        <section className="glass-card p-8 space-y-6 border-white/5 bg-white/[0.01] rounded-2xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {isHindi ? "2. रेटिंग सिग्नल और निर्णय सीमा" : "2. Rating Verdict Signals & Threshold Tiers"}
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            {isHindi
              ? "कुंडली स्कोर और समग्र एआई आत्मविश्वास (Confidence) के आधार पर विशिष्ट रेटिंग आवंटित की जाती है। उच्च रेटिंग के लिए एआई के उच्च आत्मविश्वास का होना अनिवार्य है।"
              : "Verdicts are mapped based on the aggregate score and consensus confidence level. Highly conviction ratings require both high scoring outputs and high analytical confidence."
            }
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-gray-500 font-bold uppercase tracking-wider text-[9px]">
                  <th className="pb-3 pr-4">{isHindi ? "संयुक्त स्कोर" : "Combined Score"}</th>
                  <th className="pb-3 px-4">{isHindi ? "न्यूनतम आत्मविश्वास" : "Min. Confidence"}</th>
                  <th className="pb-3 px-4">{isHindi ? "रेटिंग निर्णय" : "Verdict Signal"}</th>
                  <th className="pb-3 pl-4 text-right">{isHindi ? "संकेतक" : "Indicator"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                <tr className="hover:bg-white/[0.005]">
                  <td className="py-3 pr-4 font-extrabold text-white">≥ 80</td>
                  <td className="py-3 px-4 text-gray-300">≥ 70%</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">{isHindi ? "मजबूत खरीद (Strong Buy)" : "Strong Buy Signal"}</td>
                  <td className="py-3 pl-4 text-right text-base">🟢</td>
                </tr>
                <tr className="hover:bg-white/[0.005]">
                  <td className="py-3 pr-4 font-extrabold text-white">65 – 79</td>
                  <td className="py-3 px-4 text-gray-300">≥ 60%</td>
                  <td className="py-3 px-4 font-bold text-blue-400">{isHindi ? "खरीद (Buy)" : "Buy Signal"}</td>
                  <td className="py-3 pl-4 text-right text-base">🔵</td>
                </tr>
                <tr className="hover:bg-white/[0.005]">
                  <td className="py-3 pr-4 font-extrabold text-white">45 – 64</td>
                  <td className="py-3 px-4 text-gray-500">{isHindi ? "कोई भी" : "Any"}</td>
                  <td className="py-3 px-4 font-bold text-yellow-400">{isHindi ? "तटस्थ / नजर रखें (Neutral)" : "Neutral / Watch"}</td>
                  <td className="py-3 pl-4 text-right text-base">🟡</td>
                </tr>
                <tr className="hover:bg-white/[0.005]">
                  <td className="py-3 pr-4 font-extrabold text-white">30 – 44</td>
                  <td className="py-3 px-4 text-gray-500">{isHindi ? "कोई भी" : "Any"}</td>
                  <td className="py-3 px-4 font-bold text-orange-400">{isHindi ? "सावधानी (Caution)" : "Caution"}</td>
                  <td className="py-3 pl-4 text-right text-base">🟠</td>
                </tr>
                <tr className="hover:bg-white/[0.005]">
                  <td className="py-3 pr-4 font-extrabold text-white">&lt; 30</td>
                  <td className="py-3 px-4 text-gray-500">{isHindi ? "कोई भी" : "Any"}</td>
                  <td className="py-3 px-4 font-bold text-rose-400">{isHindi ? "बचें (Avoid)" : "Avoid Signal"}</td>
                  <td className="py-3 pl-4 text-right text-base">🔴</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Penalties and Normalization */}
        <section className="glass-card p-8 space-y-6 border-white/5 bg-white/[0.01] rounded-2xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            {isHindi ? "3. डेटा पूर्णता और आत्मविश्वास प्रकटीकरण" : "3. Data Completeness & Confidence Disclosures"}
          </h2>
          <p className="text-xs text-gray-300 leading-relaxed">
            {isHindi
              ? "यदि कोई डेटा पाइपलाइन अस्थाई रूप से अनुपलब्ध है (उदा. समाचार पाइपलाइन रुकावट), तो सिस्टम निम्न पेनल्टी सुधार मॉडल लागू करता है:"
              : "If a specific agent's ingestion pipeline is temporarily incomplete, the mathematical engine applies self-healing normalization math:"
            }
          </p>
          <ul className="list-disc pl-5 text-xs text-gray-400 space-y-2 leading-relaxed">
            <li>
              <strong className="text-white">{isHindi ? "गतिशील सामान्यीकरण:" : "Dynamic Normalization:"}</strong>{" "}
              {isHindi
                ? "हम अनुपलब्ध एजेंट के भार को हटाकर केवल सक्रिय एजेंटों के अनुपात में कुंडली स्कोर का पुनर्मूल्यांकन करते हैं। इससे डेटा अनुपलब्ध होने पर स्कोर गलत तरीके से शून्य (0) नहीं होता।"
                : "Missing agents have their weight removed from the denominator and scores are re-proportioned, preventing missing pipelines from unfairly dragging down a stock's grade."
              }
            </li>
            <li>
              <strong className="text-white">{isHindi ? "आत्मविश्वास पेनल्टी संशोधन:" : "Confidence Scaling Penalty:"}</strong>{" "}
              {isHindi
                ? "कुल डेटा पूर्णता अनुपात के आधार पर समग्र आत्मविश्वास स्कोर आनुपातिक रूप से कम हो जाता है। उच्च विश्वास रेटिंग के लिए 100% डेटा पूर्णता की आवश्यकता होती है।"
                : "The maximum achievable overall confidence is scaled down proportionally to the missing agent weights. Perfect completeness is required for maximum rating conviction."
              }
            </li>
            <li>
              <strong className="text-white">{isHindi ? "स्व-सक्रिय पृष्ठभूमि पुनरुद्धार:" : "Background Auto-Healing:"}</strong>{" "}
              {isHindi
                ? "कमी होने पर, सिस्टम पृष्ठभूमि में डेटा संवर्धन और अंतर्ग्रहण कार्यों को स्वचालित रूप से कतारबद्ध करता है ताकि कुछ ही मिनटों में पूर्णता स्तर को फिर से 100% पर लाया जा सके।"
                : "Background jobs are automatically dispatched to re-ingest missing inputs and restore metrics back to 100% within minutes."
              }
            </li>
          </ul>
        </section>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center pt-4 border-t border-white/5">
          <Link href="/dashboard" className="text-xs text-indigo-400 font-semibold flex items-center gap-1.5 hover:underline">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {isHindi ? "डैशबोर्ड पर वापस जाएं" : "Back to Dashboard"}
          </Link>
          <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">
            {isHindi ? "एआई कुंडली कंसोर्टियम • सर्वाधिकार सुरक्षित © 2026" : "AI Stock Kundli Consortium • Copyright © 2026"}
          </span>
        </div>
      </main>
    </div>
  );
}
