"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Spinner from "../../components/common/Spinner";

/* ═══════════════════════════════════════════════════════════
   AI Stock Kundli — Forgot / Reset Password Page

   3-step flow:
     Step 1 → Enter registered email → send OTP
     Step 2 → Enter 6-digit OTP from email
     Step 3 → Enter & confirm new password
   ═══════════════════════════════════════════════════════════ */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Step = 1 | 2 | 3 | 4; // 4 = success

/* ── Shared background + wrapper ──────────────────────────────
   Defined OUTSIDE ForgotPasswordPage so it is never recreated
   on re-renders. If it were inside the component, React would
   treat it as a new component type on every keystroke and
   unmount / remount the subtree — losing input focus after
   each character typed.
──────────────────────────────────────────────────────────── */
function Wrapper({
  step,
  children,
}: {
  step: Step;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-amber-500/[0.05] blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-indigo-600/[0.06] blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <img src="/favicon.ico" alt="Stock Kundli Logo" className="h-12 w-12 rounded-xl shadow-lg" />
            <span className="text-2xl font-bold text-white">Reset Password</span>
          </Link>
          <p className="mt-3 text-sm text-gray-400">AI Stock Kundli — Secure Account Recovery</p>
        </div>

        {/* Progress steps */}
        {step !== 4 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    step > s
                      ? "bg-emerald-500 text-white"
                      : step === s
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30"
                      : "bg-white/5 text-gray-500 border border-white/10"
                  }`}
                >
                  {step > s ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s
                  )}
                </div>
                {s < 3 && (
                  <div
                    className={`h-px w-8 transition-all duration-300 ${
                      step > s ? "bg-emerald-500" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ─── OTP Helpers ──────────────────────────────────────────
  const otpString = otp.join("");
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    // Auto-advance
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      document.getElementById("otp-5")?.focus();
    }
  };

  // ─── Start resend cooldown ─────────────────────────────────
  const startCooldown = (seconds = 60) => {
    setResendCooldown(seconds);
    const t = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ─── Step 1: Send OTP ──────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Failed to send reset code.");
      }
      setStep(2);
      startCooldown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otpString.length !== 6) { setError("Please enter the complete 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: otpString }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Invalid or expired code.");
      }
      setStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend OTP ────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError("");
    try {
      await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setOtp(["", "", "", "", "", ""]);
      startCooldown(60);
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // ─── Step 3: Reset Password ────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: otpString, new_password: newPassword }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Failed to reset password.");
      }
      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Password strength ──────────────────────────────────────
  const passwordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (!pwd) return { label: "", color: "bg-white/10", width: "w-0" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const levels = [
      { label: "Weak", color: "bg-rose-500", width: "w-1/4" },
      { label: "Fair", color: "bg-amber-500", width: "w-2/4" },
      { label: "Good", color: "bg-sky-400", width: "w-3/4" },
      { label: "Strong", color: "bg-emerald-500", width: "w-full" },
    ];
    return levels[score - 1] || levels[0];
  };
  const strength = passwordStrength(newPassword);

  // ─── Step 1: Email Input ───────────────────────────────────
  if (step === 1) return (
    <Wrapper step={step}>
      <div className="glass-card glow-border p-8">
        <h2 className="text-lg font-bold text-white mb-1">Forgot your password?</h2>
        <p className="text-sm text-gray-400 mb-6">Enter your registered email address and we'll send a 6-digit reset code.</p>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSendOtp} className="space-y-5">
          <div>
            <label htmlFor="reset-email" className="mb-2 block text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Email Address
            </label>
            <input
              id="reset-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            id="send-reset-otp-btn"
            className="btn-primary w-full text-base flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <><Spinner size="h-4 w-4" color="text-white" /> Sending code...</> : "📧 Send Reset Code"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-gray-500 hover:text-white transition">
            ← Back to Login
          </Link>
        </div>
      </div>
    </Wrapper>
  );

  // ─── Step 2: OTP Verification ──────────────────────────────
  if (step === 2) return (
    <Wrapper step={step}>
      <div className="glass-card glow-border p-8">
        <h2 className="text-lg font-bold text-white mb-1">Enter reset code</h2>
        <p className="text-sm text-gray-400 mb-2">
          We sent a 6-digit code to <span className="text-amber-400 font-semibold">{email}</span>
        </p>
        <p className="text-xs text-gray-500 mb-6">Check your inbox (and spam folder). The code expires in 5 minutes.</p>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-6">
          {/* OTP Boxes */}
          <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className={`h-12 w-11 rounded-xl border text-center text-xl font-black text-white bg-white/[0.03] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/60 ${
                  digit ? "border-amber-500/60 bg-amber-500/10" : "border-white/10"
                }`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otpString.length !== 6}
            id="verify-reset-otp-btn"
            className="btn-primary w-full text-base flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <><Spinner size="h-4 w-4" color="text-white" /> Verifying...</> : "✅ Verify Code"}
          </button>
        </form>

        {/* Resend */}
        <div className="mt-5 text-center text-sm text-gray-500">
          Didn't receive it?{" "}
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
            className="font-semibold text-amber-400 hover:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resending ? "Sending..." : "Resend code"}
          </button>
        </div>

        <div className="mt-3 text-center">
          <button onClick={() => { setStep(1); setOtp(["","","","","",""]); setError(""); }} className="text-xs text-gray-600 hover:text-gray-400 transition">
            ← Change email
          </button>
        </div>
      </div>
    </Wrapper>
  );

  // ─── Step 3: New Password ──────────────────────────────────
  if (step === 3) return (
    <Wrapper>
      <div className="glass-card glow-border p-8">
        <h2 className="text-lg font-bold text-white mb-1">Set new password</h2>
        <p className="text-sm text-gray-400 mb-6">Choose a strong password for your account.</p>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-5">
          {/* New Password */}
          <div>
            <label htmlFor="new-password" className="mb-2 block text-xs font-semibold text-gray-300 uppercase tracking-wide">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPwd ? "text" : "password"}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPwd(!showNewPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                tabIndex={-1}
              >
                {showNewPwd ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Strength bar */}
            {newPassword && (
              <div className="mt-2">
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${strength.color} ${strength.width}`} />
                </div>
                <p className={`text-[10px] font-semibold mt-1 ${
                  strength.label === "Strong" ? "text-emerald-400" :
                  strength.label === "Good" ? "text-sky-400" :
                  strength.label === "Fair" ? "text-amber-400" : "text-rose-400"
                }`}>{strength.label}</p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-xs font-semibold text-gray-300 uppercase tracking-wide">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPwd ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`input-field pr-10 transition ${
                  confirmPassword && confirmPassword !== newPassword ? "border-rose-500/40 focus:border-rose-500" : ""
                }`}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
                tabIndex={-1}
              >
                {showConfirmPwd ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="text-[10px] text-rose-400 mt-1.5">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            id="reset-password-btn"
            className="btn-primary w-full text-base flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <><Spinner size="h-4 w-4" color="text-white" /> Resetting...</> : "🔐 Reset Password"}
          </button>
        </form>
      </div>
    </Wrapper>
  );

  // ─── Step 4: Success ───────────────────────────────────────
  return (
    <Wrapper>
      <div className="glass-card p-10 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Password Reset!</h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-xs mx-auto">
          Your password has been updated successfully. You can now log in with your new credentials.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="btn-primary px-8 text-base"
          id="goto-login-after-reset"
        >
          Go to Login →
        </button>
      </div>
    </Wrapper>
  );
}
