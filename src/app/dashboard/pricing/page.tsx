"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Zap, Shield, Crown } from 'lucide-react';
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Basic access for casual investors getting started.",
    icon: <Shield className="w-8 h-8 text-blue-400" />,
    features: [
      { name: "Live Stock Prices", included: true },
      { name: "Basic Company Info", included: true },
      { name: "Full AI Kundli Report", included: false },
      { name: "Stock Screener Access", included: false },
      { name: "Real-time Alerts", included: false },
    ],
    buttonText: "Current Plan",
    buttonVariant: "outline",
    action: "free"
  },
  {
    name: "Standard",
    price: "₹299",
    period: "per month",
    description: "Core analysis and partial AI insights for regular traders.",
    icon: <Zap className="w-8 h-8 text-indigo-400" />,
    features: [
      { name: "Live Stock Prices", included: true },
      { name: "Basic Company Info", included: true },
      { name: "Basic AI Kundli Summary", included: true },
      { name: "Stock Screener Access", included: false },
      { name: "Real-time Alerts", included: false },
    ],
    buttonText: "Upgrade to Standard",
    buttonVariant: "primary",
    action: "standard"
  },
  {
    name: "Pro",
    price: "₹799",
    period: "per month",
    description: "Full platform access for serious investors and professionals.",
    icon: <Crown className="w-8 h-8 text-amber-400" />,
    features: [
      { name: "Live Stock Prices", included: true },
      { name: "Basic Company Info", included: true },
      { name: "Full AI Kundli Report (7 Agents)", included: true },
      { name: "Stock Screener Access", included: true },
      { name: "Real-time Alerts", included: true },
    ],
    buttonText: "Upgrade to Pro",
    buttonVariant: "premium",
    action: "pro"
  }
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;
        const res = await fetch(`${API_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUser();
    
    // Dynamic Razorpay script loading
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);
  
  const handleCheckout = async (planName: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      
      const isTrial = planName.includes("_trial");
      const endpoint = isTrial ? "/api/v1/subscriptions/trial" : "/api/v1/subscriptions/checkout";
      const bodyPayload = isTrial ? undefined : JSON.stringify({ plan: planName });

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: bodyPayload
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Checkout failed");
      }
      const order = await res.json();

      if (order.sandbox) {
        // Simulation upgrade for sandbox testing
        const upgradeRes = await fetch(`${API_URL}/api/v1/subscriptions/sandbox-upgrade`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ plan: planName })
        });
        if (upgradeRes.ok) {
          window.location.href = "/dashboard";
        }
      } else {
        const options = {
          key: order.key,
          amount: order.amount,
          currency: order.currency,
          name: "AI Stock Kundli",
          description: `${planName.toUpperCase()} Subscription`,
          order_id: order.id,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch(`${API_URL}/api/v1/subscriptions/verify`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  plan: planName
                })
              });
              if (verifyRes.ok) {
                window.location.href = "/dashboard";
              } else {
                setError("Payment verification failed. Please contact support.");
              }
            } catch (err) {
              setError("Payment verification failed.");
            }
          },
          prefill: {
            email: user?.email || "",
            contact: user?.phone || ""
          },
          theme: { color: "#6366f1" }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          setError(response.error.description || "Payment failed");
        });
        rzp.open();
      }
    } catch (err: any) {
      setError(err.message || "Failed to upgrade. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrial = handleCheckout;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-12 font-sans overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 mb-4"
          >
            Unlock the Full Power of AI
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Choose the plan that fits your trading journey. Try our Pro features for 2 days for just ₹10.
          </motion.p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-center mb-8 max-w-2xl mx-auto backdrop-blur-md">
            {error}
          </div>
        )}

        {(!user || user?.can_use_trial !== false) && (
          <div className="flex flex-col items-center mb-12 gap-6">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ delay: 0.2 }}
             className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6 max-w-3xl w-full backdrop-blur-md"
           >
             <div className="flex-1">
               <h3 className="text-xl font-bold text-amber-400 flex items-center gap-2 mb-2">
                 <Crown className="w-5 h-5" />
                 Pro Trial Offer
               </h3>
               <p className="text-gray-300">Experience the full 7-agent AI Kundli report and premium tools for 2 days.</p>
             </div>
             <div className="flex items-center gap-4">
               <div className="text-2xl font-bold text-white">₹10 <span className="text-sm font-normal text-gray-400">/ 2 days</span></div>
               <button 
                 onClick={() => handleTrial('pro_trial')}
                 disabled={loading}
                 className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50"
               >
                 {loading ? "Processing..." : "Start Pro Trial"}
               </button>
             </div>
           </motion.div>

           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6 max-w-3xl w-full backdrop-blur-md"
           >
             <div className="flex-1">
               <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-2 mb-2">
                 <Zap className="w-5 h-5" />
                 Standard Trial Offer
               </h3>
               <p className="text-gray-300">Try our core analysis and partial AI insights for 2 days.</p>
             </div>
             <div className="flex items-center gap-4">
               <div className="text-2xl font-bold text-white">₹10 <span className="text-sm font-normal text-gray-400">/ 2 days</span></div>
               <button 
                 onClick={() => handleTrial('standard_trial')}
                 disabled={loading}
                 className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50"
               >
                 {loading ? "Processing..." : "Start Standard Trial"}
               </button>
             </div>
           </motion.div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (idx * 0.1) }}
              className={`relative p-8 rounded-3xl backdrop-blur-xl border flex flex-col ${
                plan.name === 'Pro' 
                  ? 'bg-gradient-to-b from-[#1A1A2E] to-[#0A0A0A] border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)]' 
                  : 'bg-[#121212]/80 border-white/10'
              }`}
            >
              {plan.name === 'Pro' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-xs font-bold tracking-wider uppercase shadow-lg">
                  Recommended
                </div>
              )}
              
              <div className="mb-6">
                {plan.icon}
                <h2 className="text-2xl font-bold mt-4 mb-2">{plan.name}</h2>
                <p className="text-gray-400 text-sm min-h-[40px]">{plan.description}</p>
              </div>
              
              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-400 text-sm">/{plan.period}</span>
              </div>
              
              <div className="flex-1 space-y-4 mb-8">
                {plan.features.map((feat) => (
                  <div key={feat.name} className="flex items-start gap-3">
                    {feat.included ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                    )}
                    <span className={feat.included ? "text-gray-300" : "text-gray-600"}>
                      {feat.name}
                    </span>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => handleCheckout(plan.action)}
                disabled={
                  loading || 
                  (() => {
                    const levels: Record<string, number> = { free: 0, standard: 1, pro: 2, advisor: 3 };
                    const userLevel = levels[user?.plan || 'free'] || 0;
                    const planLevel = levels[plan.action] || 0;
                    return userLevel >= planLevel;
                  })()
                }
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  plan.buttonVariant === 'primary'
                    ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                    : plan.buttonVariant === 'premium'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {(() => {
                  if (loading) return "Processing...";
                  const levels: Record<string, number> = { free: 0, standard: 1, pro: 2, advisor: 3 };
                  const userLevel = levels[user?.plan || 'free'] || 0;
                  const planLevel = levels[plan.action] || 0;
                  
                  if (userLevel === planLevel) return "Current Plan";
                  if (userLevel > planLevel) return "Included in Plan";
                  return plan.buttonText;
                })()}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
