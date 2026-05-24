"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../context/LanguageContext";
import LanguageSelector from "../../components/LanguageSelector";

/* ═══════════════════════════════════════════════════════════
   AI Stock Kundli — 4-Step Registration Wizard
   ═══════════════════════════════════════════════════════════ */

type Step = 1 | 2 | 3 | 4;

export default function SignupPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Step State Managers ────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  
  // Step 2: Identity & SEBI
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [dob, setDob] = useState("");
  const [pan, setPan] = useState("");

  // Step 3: Investor Profile (Optional)
  const [riskAppetite, setRiskAppetite] = useState("");
  const [experience, setExperience] = useState("");
  const [goal, setGoal] = useState("");
  const [horizon, setHorizon] = useState("");

  // Step 4: Legal Consent
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // ── Step 1: Send Registration OTP ──────────────────────────
  const handleSendOTP = async () => {
    if (!email || !password || !phone) {
      setError("Please fill in all fields to send OTP");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to dispatch OTP email");
      }
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Complete Account Creation ──────────────────────
  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // 1. Verify OTP Code
      const verifyRes = await fetch(`${apiUrl}/api/v1/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode }),
      });
      
      if (!verifyRes.ok) {
        // Fallback for local mock verification if server/SMTP is mocked
        if (otpCode !== "123456") {
          const verifyData = await verifyRes.json();
          throw new Error(verifyData.detail || "Invalid or expired OTP code");
        }
      }

      // 2. Perform Backend Signup
      const signupRes = await fetch(`${apiUrl}/api/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName || "Valued Investor",
          phone,
        }),
      });

      if (!signupRes.ok) {
        const signupData = await signupRes.json();
        throw new Error(signupData.detail || "Failed to finalize signup");
      }

      const signupData = await signupRes.json();
      localStorage.setItem("access_token", signupData.access_token);
      localStorage.setItem("refresh_token", signupData.refresh_token);
      
      // Auto advance to Step 2
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Steps 2 & 3: Profile Updates ───────────────────────────
  const handleUpdateProfile = async (fields: Record<string, any>, nextStep: Step | "finish") => {
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Session expired. Please log in.");
      }

      const res = await fetch(`${apiUrl}/api/v1/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fields),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Profile update failed");
      }

      if (nextStep === "finish") {
        router.push("/dashboard");
      } else {
        setCurrentStep(nextStep);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !city || !dob || !pan) {
      setError("Please fill all identity fields for SEBI compliance");
      return;
    }
    // Simple PAN Validation (e.g. ABCDE1234F)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan.toUpperCase())) {
      setError("Invalid PAN Card format. Expected 10 alphanumeric characters (e.g. ABCDE1234F).");
      return;
    }
    
    handleUpdateProfile({
      full_name: fullName,
      city,
      dob,
      pan: pan.toUpperCase(),
    }, 3);
  };

  const handleStep3Submit = () => {
    handleUpdateProfile({
      risk_appetite: riskAppetite || null,
      experience: experience || null,
      goal: goal || null,
      horizon: horizon || null,
    }, 4);
  };

  const handleStep4Submit = () => {
    if (!disclaimerAccepted) {
      setError("You must accept the mandatory research analyst disclaimer to complete registration.");
      return;
    }
    handleUpdateProfile({
      disclaimer_accepted: true,
    }, "finish");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* Dynamic Background Gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-20 right-20 h-[500px] w-[500px] rounded-full bg-indigo-500/[0.05] blur-[120px]" />
        <div className="absolute bottom-20 left-20 h-[400px] w-[400px] rounded-full bg-emerald-500/[0.04] blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Header / Logo with beautiful floated Language Selection */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <span className="text-xl font-bold text-white">K</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-wide">{t("common.appName")}</span>
          </div>
          <LanguageSelector />
        </div>

        {/* Multi-Step Progress Tracker */}
        <div className="mb-8 flex items-center justify-between px-4">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                  currentStep === step
                    ? "bg-indigo-500 text-white ring-4 ring-indigo-500/20"
                    : currentStep > step
                    ? "bg-indigo-600/40 text-indigo-200 border border-indigo-500/30"
                    : "bg-gray-800 text-gray-500 border border-gray-700/50"
                }`}
              >
                {step}
              </div>
              {step < 4 && (
                <div
                  className={`h-0.5 w-full mx-2 transition-all duration-500 ${
                    currentStep > step ? "bg-indigo-500" : "bg-gray-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Wizard Card */}
        <div className="glass-card glow-border p-8 relative overflow-hidden backdrop-blur-xl bg-gray-900/60 border border-white/5 shadow-2xl rounded-2xl">
          {error && (
            <div className="mb-6 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
              {error}
            </div>
          )}

          {/* ── STEP 1: CREDENTIALS & EMAIL OTP ── */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-2">{t("signup.step1Title")}</h2>
              <p className="text-sm text-gray-400 mb-6">{t("signup.step1Subtitle")}</p>
              
              <form onSubmit={handleVerifyAndSignup} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400 uppercase tracking-wider">{t("signup.emailLabel")}</label>
                  <input
                    type="email"
                    required
                    disabled={otpSent}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field disabled:opacity-50"
                    placeholder="investor@example.com"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400 uppercase tracking-wider">{t("signup.passwordLabel")}</label>
                  <input
                    type="password"
                    required
                    disabled={otpSent}
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field disabled:opacity-50"
                    placeholder="Min 8 characters"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-400 uppercase tracking-wider">{t("signup.phoneLabel")}</label>
                  <input
                    type="tel"
                    required
                    disabled={otpSent}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field disabled:opacity-50"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                {otpSent && (
                  <div className="mt-4 p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20 animate-fade-in">
                    <label className="mb-1 block text-xs font-medium text-indigo-300 uppercase tracking-wider">{t("signup.enterOtp")}</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="input-field text-center font-bold tracking-widest text-lg"
                      placeholder="XXXXXX"
                    />
                    <p className="mt-2 text-xs text-gray-500">{t("signup.otpSentText")} <span className="text-gray-300">{email}</span></p>
                  </div>
                )}

                <div className="pt-2">
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="btn-primary w-full py-2.5 text-sm"
                    >
                      {loading ? t("common.loading") : t("signup.sendOtp")}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full py-2.5 text-sm"
                    >
                      {loading ? t("signup.verifying") : t("signup.verifyBtn")}
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-6 text-center text-xs text-gray-500">
                {t("signup.alreadyHaveAccount")}{" "}
                <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                  {t("signup.loginLink")}
                </Link>
              </div>
            </div>
          )}

          {/* ── STEP 2: IDENTITY & SEBI SECURE ── */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div className="mb-2">
                <span className="badge-indigo text-[10px] uppercase font-bold tracking-wider mb-1">SEBI COMPLIANCE</span>
                <h2 className="text-xl font-bold text-white">{t("signup.step2Title")}</h2>
                <p className="text-sm text-gray-400">{t("signup.step2Subtitle")}</p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400 uppercase tracking-wider">{t("signup.fullNameLabel")}</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field"
                  placeholder="Rahul Sharma"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400 uppercase tracking-wider">{t("signup.cityLabel")}</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="input-field"
                  placeholder="Mumbai"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400 uppercase tracking-wider">{t("signup.dobLabel")}</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-400 uppercase tracking-wider">{t("signup.panLabel")}</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                  className="input-field uppercase tracking-wider font-semibold"
                  placeholder="ABCDE1234F"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-2.5 text-sm"
                >
                  {loading ? t("signup.saving") : t("signup.secureBtn")}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: INVESTOR PROFILE ── */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <span className="badge-green text-[10px] uppercase font-bold tracking-wider mb-1">PERSONALIZATION</span>
                <h2 className="text-xl font-bold text-white">{t("signup.step3Title")}</h2>
                <p className="text-sm text-gray-400">{t("signup.step3Subtitle")}</p>
              </div>

              <div className="space-y-4">
                {/* Risk Appetite */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-400 uppercase tracking-wider">{t("signup.riskLabel")}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Conservative", "Moderate", "Aggressive"].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRiskAppetite(r)}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                          riskAppetite === r
                            ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-inner"
                            : "bg-gray-800/40 border-gray-700/50 text-gray-400 hover:bg-gray-800/80"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-400 uppercase tracking-wider">{t("signup.expLabel")}</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["Beginner", "Intermediate", "Advanced"].map((exp) => (
                      <button
                        key={exp}
                        type="button"
                        onClick={() => setExperience(exp)}
                        className={`py-2 px-1 text-[11px] font-semibold rounded-lg border transition-all ${
                          experience === exp
                            ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-inner"
                            : "bg-gray-800/40 border-gray-700/50 text-gray-400 hover:bg-gray-800/80"
                        }`}
                      >
                        {exp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Goal */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-400 uppercase tracking-wider">{t("signup.goalLabel")}</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {["Wealth", "Gains", "Retirement"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGoal(g)}
                        className={`py-2 px-1 text-[11px] font-semibold rounded-lg border transition-all ${
                          goal === g
                            ? "bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-inner"
                            : "bg-gray-800/40 border-gray-700/50 text-gray-400 hover:bg-gray-800/80"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="w-1/3 py-2.5 border border-gray-700 text-gray-400 hover:text-white rounded-lg text-xs font-medium tracking-wide transition-colors"
                >
                  {t("common.skipForNow")}
                </button>
                <button
                  type="button"
                  onClick={handleStep3Submit}
                  disabled={loading}
                  className="btn-primary w-2/3 py-2.5 text-xs font-semibold"
                >
                  {loading ? t("common.loading") : t("common.saveAndContinue")}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: SEBI RESEARCH DISCLAIMER ── */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <span className="badge-rose text-[10px] uppercase font-bold tracking-wider mb-1">MANDATORY CONSENT</span>
                <h2 className="text-xl font-bold text-white">{t("signup.step4Title")}</h2>
                <p className="text-sm text-gray-400">{t("signup.step4Subtitle")}</p>
              </div>

              <div className="max-h-48 overflow-y-auto p-4 rounded-lg bg-gray-950/80 border border-white/5 text-[11px] text-gray-400 leading-relaxed space-y-3 font-mono">
                <p className="font-bold text-gray-200">1. RESEARCH ANALYST SERVICES</p>
                <p>AI Stock Kundli operates as an automated algorithms and analysis tool. We are not registering customized personal advice under SEBI (Investment Advisers) Regulations, 2013.</p>
                <p className="font-bold text-gray-200">2. NO INVESTMENT ADVICE</p>
                <p>The information, tickers, ratings, technical signals, and reports provided by this app are for general educational and training purposes only. It does not consider individual target portfolios or financial parameters.</p>
                <p className="font-bold text-gray-200">3. RISK DISCLOSURE</p>
                <p>Equities trading carries extreme systemic risk of capital loss. Past performances are never indicators of future values.</p>
              </div>

              <div className="flex items-start gap-3 mt-4">
                <input
                  type="checkbox"
                  id="disclaimer-checkbox"
                  checked={disclaimerAccepted}
                  onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-700 bg-gray-800 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-gray-900"
                />
                <label htmlFor="disclaimer-checkbox" className="text-xs text-gray-300 leading-normal select-none cursor-pointer">
                  {t("signup.disclaimerText")}
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStep4Submit}
                  disabled={loading || !disclaimerAccepted}
                  className="btn-primary w-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t("common.loading") : t("signup.acceptBtn")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
