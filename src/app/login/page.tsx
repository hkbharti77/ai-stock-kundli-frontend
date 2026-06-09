"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../context/LanguageContext";
import LanguageSelector from "../../components/common/LanguageSelector";
import Spinner from "../../components/common/Spinner";
import { useAuth } from "../../context/AuthContext";

/* ═══════════════════════════════════════════════════════════
   AI Stock Kundli — Login Page
   ═══════════════════════════════════════════════════════════ */

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading: authLoading, login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If user already has a valid token, skip login and go straight to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form.email, form.password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* Dynamic Floating Language Switcher */}
      <div className="absolute top-6 right-6 z-30">
        <LanguageSelector />
      </div>

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-electric-500/[0.07] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-gold-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <img src="/favicon.ico" alt="Stock Kundli Logo" className="h-12 w-12 rounded-xl shadow-lg" />
            <span className="text-2xl font-bold text-white">Stock Kundli</span>
          </Link>
          <p className="mt-3 text-gray-400">{t("login.welcomeBack")}</p>
        </div>

        {/* Form Card */}
        <div className="glass-card glow-border p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
                {t("login.email")}
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  {t("login.password")}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-base"
              id="login-submit"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size="h-4 w-4" color="text-white" />
                  {t("login.loggingIn")}
                </span>
              ) : (
                t("login.logInBtn")
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {t("login.dontHaveAccount")}{" "}
            <Link href="/signup" className="font-medium text-electric-400 hover:text-electric-300 transition-colors">
              {t("login.signUpFree")}
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-6 text-center text-xs text-gray-600">
          {t("login.termsText")}
        </p>
      </div>
    </div>
  );
}
