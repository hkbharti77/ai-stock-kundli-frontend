"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Spinner from "../../../components/common/Spinner";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  GraduationCap,
  Target,
  Clock,
  Pencil,
  X,
  Save,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Crown,
  Zap,
  BadgeCheck,
  ChevronRight,
  BarChart3,
  Building2,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   AI Stock Kundli — My Profile Page  (2026 Design Refresh)
   ═══════════════════════════════════════════════════════════ */

interface UserProfile {
  id: number;
  email: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  dob: string | null;
  pan: string | null;
  risk_appetite: string | null;
  experience: string | null;
  goal: string | null;
  horizon: string | null;
  disclaimer_accepted: boolean;
  plan: string;
  role: string;
  is_verified: boolean;
  otp_verified: boolean;
  created_at: string;
}

interface EditForm {
  full_name: string;
  phone: string;
  city: string;
  dob: string;
  pan: string;
  risk_appetite: string;
  experience: string;
  goal: string;
  horizon: string;
  disclaimer_accepted: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const RISK_OPTIONS = ["Conservative", "Moderate", "Aggressive", "Very Aggressive"];
const EXPERIENCE_OPTIONS = [
  "Beginner (< 1 yr)",
  "Intermediate (1–3 yrs)",
  "Experienced (3–7 yrs)",
  "Expert (7+ yrs)",
];
const GOAL_OPTIONS = [
  "Wealth Creation",
  "Regular Income",
  "Capital Preservation",
  "Short-Term Gains",
  "Retirement Planning",
];
const HORIZON_OPTIONS = [
  "Short-term (< 1 yr)",
  "Medium-term (1–3 yrs)",
  "Long-term (3–7 yrs)",
  "Very Long-term (7+ yrs)",
];

/* ── Plan config ───────────────────────────────────────── */
function getPlanConfig(plan: string) {
  const p = plan?.toLowerCase();
  if (p === "advisor")
    return {
      gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      icon: <Crown size={11} />,
      label: "Advisor",
      glow: "shadow-emerald-500/20",
    };
  if (p === "pro")
    return {
      gradient: "from-violet-500/20 via-indigo-500/10 to-transparent",
      border: "border-violet-500/30",
      text: "text-violet-400",
      bg: "bg-violet-500/10",
      icon: <Zap size={11} />,
      label: "Pro",
      glow: "shadow-violet-500/20",
    };
  if (p === "starter")
    return {
      gradient: "from-electric-500/20 via-blue-500/10 to-transparent",
      border: "border-electric-500/30",
      text: "text-electric-400",
      bg: "bg-electric-500/10",
      icon: <Sparkles size={11} />,
      label: "Starter",
      glow: "shadow-electric-500/20",
    };
  if (p === "admin" || p === "enterprise")
    return {
      gradient: "from-rose-500/20 via-pink-500/10 to-transparent",
      border: "border-rose-500/30",
      text: "text-rose-400",
      bg: "bg-rose-500/10",
      icon: <Building2 size={11} />,
      label: p === "admin" ? "Admin" : "Enterprise",
      glow: "shadow-rose-500/20",
    };
  return {
    gradient: "from-white/5 to-transparent",
    border: "border-white/10",
    text: "text-gray-400",
    bg: "bg-white/5",
    icon: <User size={11} />,
    label: "Free",
    glow: "shadow-white/5",
  };
}

/* ── Initials helper ───────────────────────────────────── */
function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

/* ── Info Row component ────────────────────────────────── */
function InfoRow({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value?: string | null;
  icon: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="group flex items-center gap-4 py-3.5 border-b border-white/[0.04] last:border-0 transition-colors duration-200 hover:bg-white/[0.02] -mx-6 px-6 rounded-lg">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] text-gray-500 group-hover:text-gray-300 group-hover:border-white/10 transition-all duration-200">
        {icon}
      </div>
      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p
          className={`text-sm font-medium truncate transition-colors duration-200 ${
            value
              ? "text-gray-200 group-hover:text-white"
              : "text-gray-600 italic text-xs"
          } ${mono ? "font-mono tracking-wider" : ""}`}
        >
          {value || "Not set"}
        </p>
      </div>
    </div>
  );
}

/* ── Stat Tile ──────────────────────────────────────────── */
function InvestorTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-500 group-hover:text-gray-300 transition-colors duration-200">
          {icon}
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">
          {label}
        </p>
      </div>
      <p
        className={`text-sm font-semibold leading-tight ${
          value ? "text-white" : "text-gray-600 italic text-xs font-normal"
        }`}
      >
        {value || "Not configured"}
      </p>
    </div>
  );
}

/* ── Styled Input ───────────────────────────────────────── */
function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-400 tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<EditForm>({
    full_name: "",
    phone: "",
    city: "",
    dob: "",
    pan: "",
    risk_appetite: "",
    experience: "",
    goal: "",
    horizon: "",
    disclaimer_accepted: false,
  });

  /* ── Fetch ──────────────────────────────────────────────── */
  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to load profile");
      const data: UserProfile = await res.json();
      setProfile(data);
      setForm({
        full_name: data.full_name || "",
        phone: data.phone || "",
        city: data.city || "",
        dob: data.dob || "",
        pan: data.pan || "",
        risk_appetite: data.risk_appetite || "",
        experience: data.experience || "",
        goal: data.goal || "",
        horizon: data.horizon || "",
        disclaimer_accepted: data.disclaimer_accepted,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* ── Save ───────────────────────────────────────────────── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    const token = localStorage.getItem("access_token");
    try {
      const payload: Record<string, any> = {};
      (Object.keys(form) as (keyof EditForm)[]).forEach((k) => {
        const v = form[k];
        if (v !== "" && v !== null) payload[k] = v;
        else if (k === "disclaimer_accepted") payload[k] = v;
      });
      const res = await fetch(`${API_URL}/api/v1/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Update failed");
      }
      const updated: UserProfile = await res.json();
      setProfile(updated);
      setEditing(false);
      setSuccess("Profile updated successfully");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading ────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-electric-500/20 to-violet-500/20 border border-electric-500/20 flex items-center justify-center">
              <Spinner size="h-5 w-5" color="text-electric-400" />
            </div>
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertCircle size={20} className="text-rose-400" />
          </div>
          <p className="text-sm text-rose-400 font-medium">{error || "Could not load profile."}</p>
        </div>
      </div>
    );
  }

  const planCfg = getPlanConfig(profile.plan);
  const initials = getInitials(profile.full_name, profile.email);
  const isVerified = profile.is_verified || profile.otp_verified;

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="relative min-h-screen">

      {/* ── Ambient background glows ──────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-electric-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Page Header ──────────────────────────────────── */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-5 w-5 rounded-md bg-electric-500/10 flex items-center justify-center">
                <User size={11} className="text-electric-400" />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Account</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">My Profile</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your identity, investor profile and security settings
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-amber-500/20 text-amber-400/80 bg-amber-500/[0.06] hover:bg-amber-500/[0.12] hover:border-amber-500/35 hover:text-amber-300 transition-all duration-200"
            >
              <KeyRound size={12} />
              Reset Password
            </Link>
            {!editing && (
              <button
                onClick={() => {
                  setEditing(true);
                  setError("");
                  setSuccess("");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] hover:border-white/[0.15] text-gray-300 hover:text-white transition-all duration-200"
              >
                <Pencil size={12} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ── Toast Notifications ──────────────────────────── */}
        {success && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400 text-sm font-medium animate-fade-in">
            <CheckCircle2 size={15} className="shrink-0" />
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/[0.08] border border-rose-500/20 text-rose-400 text-sm font-medium">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ════════════════════════════════════════════════
              LEFT COLUMN
              ════════════════════════════════════════════════ */}
          <div className="lg:col-span-1 space-y-4">

            {/* ── Avatar / Identity Card ────────────────── */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-xl">
              {/* gradient top band */}
              <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${planCfg.gradient} opacity-60`} />

              <div className="relative p-6 text-center">
                {/* Avatar ring */}
                <div className="mx-auto relative w-fit mb-4">
                  <div className={`absolute inset-0 rounded-2xl blur-md opacity-40 bg-gradient-to-br from-electric-500 to-violet-600 scale-110`} />
                  <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-electric-500 to-violet-600 text-xl font-black text-white shadow-xl">
                    {initials}
                  </div>
                  {/* Verified badge overlay */}
                  {isVerified && (
                    <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-emerald-500 border-2 border-[#080E1A] flex items-center justify-center">
                      <BadgeCheck size={13} className="text-white" strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                <h2 className="text-base font-bold text-white truncate">
                  {profile.full_name || "—"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{profile.email}</p>

                {/* Plan + Role badges */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${planCfg.bg} ${planCfg.text} ${planCfg.border} shadow-sm ${planCfg.glow}`}
                  >
                    {planCfg.icon}
                    {planCfg.label} Plan
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/[0.04] text-gray-400 border border-white/[0.08]">
                    {profile.role}
                  </span>
                </div>

                {/* Member since */}
                <p className="mt-4 text-[11px] text-gray-600 font-medium">
                  Member since{" "}
                  <span className="text-gray-400">
                    {new Date(profile.created_at).toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </p>
              </div>
            </div>

            {/* ── Account Status Card ───────────────────── */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5 shadow-lg">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">
                Account Status
              </p>
              <div className="space-y-1">
                {/* Email verified */}
                <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${isVerified ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                      {isVerified
                        ? <ShieldCheck size={13} className="text-emerald-400" />
                        : <ShieldAlert size={13} className="text-rose-400" />
                      }
                    </div>
                    <span className="text-xs text-gray-400">Email Verified</span>
                  </div>
                  <span className={`text-[11px] font-bold ${isVerified ? "text-emerald-400" : "text-rose-400"}`}>
                    {isVerified ? "Verified" : "Pending"}
                  </span>
                </div>

                {/* Disclaimer */}
                <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${profile.disclaimer_accepted ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
                      {profile.disclaimer_accepted
                        ? <CheckCircle2 size={13} className="text-emerald-400" />
                        : <AlertCircle size={13} className="text-amber-400" />
                      }
                    </div>
                    <span className="text-xs text-gray-400">SEBI Disclaimer</span>
                  </div>
                  <span className={`text-[11px] font-bold ${profile.disclaimer_accepted ? "text-emerald-400" : "text-amber-400"}`}>
                    {profile.disclaimer_accepted ? "Accepted" : "Pending"}
                  </span>
                </div>

                {/* Plan */}
                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-electric-500/10">
                      <BarChart3 size={13} className="text-electric-400" />
                    </div>
                    <span className="text-xs text-gray-400">Current Plan</span>
                  </div>
                  <span className={`text-[11px] font-bold capitalize ${planCfg.text}`}>
                    {planCfg.label}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Quick Action ──────────────────────────── */}
            <Link
              href="/dashboard"
              className="group flex items-center justify-between w-full px-4 py-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-electric-500/10 flex items-center justify-center">
                  <TrendingUp size={14} className="text-electric-400" />
                </div>
                <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-200 transition-colors">
                  Back to Dashboard
                </span>
              </div>
              <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all duration-200" />
            </Link>
          </div>

          {/* ════════════════════════════════════════════════
              RIGHT COLUMN
              ════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-4">

            {editing ? (
              /* ════════════════════════════════════════════
                 EDIT FORM
                 ════════════════════════════════════════════ */
              <form onSubmit={handleSave} className="space-y-4">

                {/* Personal Info */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 shadow-lg">
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="h-8 w-8 rounded-xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-center">
                      <User size={14} className="text-electric-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Personal Information</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">Your identity and contact details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Full Name">
                      <input
                        type="text"
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        className="input-field text-sm"
                        placeholder="Your full legal name"
                      />
                    </FormField>
                    <FormField label="Phone Number">
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="input-field text-sm"
                        placeholder="+91 98765 43210"
                      />
                    </FormField>
                    <FormField label="City">
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="input-field text-sm"
                        placeholder="Mumbai, Delhi, Bangalore…"
                      />
                    </FormField>
                    <FormField label="Date of Birth">
                      <input
                        type="date"
                        value={form.dob}
                        onChange={(e) => setForm({ ...form, dob: e.target.value })}
                        className="input-field text-sm"
                      />
                    </FormField>
                    <FormField label="PAN Number">
                      <input
                        type="text"
                        value={form.pan}
                        onChange={(e) =>
                          setForm({ ...form, pan: e.target.value.toUpperCase() })
                        }
                        className="input-field text-sm font-mono tracking-widest"
                        placeholder="ABCDE1234F"
                        maxLength={10}
                      />
                    </FormField>
                  </div>
                </div>

                {/* Investor Profile */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 shadow-lg">
                  <div className="flex items-center gap-2.5 mb-6">
                    <div className="h-8 w-8 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                      <BarChart3 size={14} className="text-gold-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Investor Profile</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">Your investment preferences and risk parameters</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Risk Appetite">
                      <select
                        value={form.risk_appetite}
                        onChange={(e) => setForm({ ...form, risk_appetite: e.target.value })}
                        className="input-field text-sm"
                      >
                        <option value="">Select risk level…</option>
                        {RISK_OPTIONS.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Experience Level">
                      <select
                        value={form.experience}
                        onChange={(e) => setForm({ ...form, experience: e.target.value })}
                        className="input-field text-sm"
                      >
                        <option value="">Select experience…</option>
                        {EXPERIENCE_OPTIONS.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Investment Goal">
                      <select
                        value={form.goal}
                        onChange={(e) => setForm({ ...form, goal: e.target.value })}
                        className="input-field text-sm"
                      >
                        <option value="">Select goal…</option>
                        {GOAL_OPTIONS.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Investment Horizon">
                      <select
                        value={form.horizon}
                        onChange={(e) => setForm({ ...form, horizon: e.target.value })}
                        className="input-field text-sm"
                      >
                        <option value="">Select horizon…</option>
                        {HORIZON_OPTIONS.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </FormField>
                  </div>

                  {/* Disclaimer toggle */}
                  <label className="mt-5 flex items-start gap-3 cursor-pointer select-none group">
                    <div className="relative shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={form.disclaimer_accepted}
                        onChange={(e) =>
                          setForm({ ...form, disclaimer_accepted: e.target.checked })
                        }
                        className="sr-only"
                      />
                      <div
                        className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all duration-200 ${
                          form.disclaimer_accepted
                            ? "bg-electric-500 border-electric-500 shadow-lg shadow-electric-500/30"
                            : "bg-white/[0.04] border-white/[0.15] group-hover:border-white/30"
                        }`}
                      >
                        {form.disclaimer_accepted && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors">
                      I accept the{" "}
                      <span className="text-electric-400 font-medium">SEBI disclaimer</span>{" "}
                      — this platform provides AI-driven research insights for informational
                      purposes only, not personalised investment advice.
                    </span>
                  </label>
                </div>

                {/* Action Row */}
                <div className="flex items-center gap-3 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setError("");
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-white/[0.08] text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200"
                  >
                    <X size={13} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-electric-500 to-violet-600 text-white shadow-lg shadow-electric-500/20 hover:shadow-electric-500/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200"
                  >
                    {saving ? (
                      <>
                        <Spinner size="h-3.5 w-3.5" color="text-white" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save size={13} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* ════════════════════════════════════════════
                 VIEW MODE
                 ════════════════════════════════════════════ */
              <>
                {/* Personal Info */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-center">
                        <User size={14} className="text-electric-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Personal Information</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">Identity & contact details</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setEditing(true); setError(""); setSuccess(""); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-500 hover:text-gray-200 border border-transparent hover:border-white/10 hover:bg-white/[0.04] transition-all duration-200"
                    >
                      <Pencil size={10} />
                      Edit
                    </button>
                  </div>

                  <div className="-mx-0">
                    <InfoRow
                      icon={<Mail size={14} />}
                      label="Email Address"
                      value={profile.email}
                    />
                    <InfoRow
                      icon={<Phone size={14} />}
                      label="Phone Number"
                      value={profile.phone}
                    />
                    <InfoRow
                      icon={<MapPin size={14} />}
                      label="City"
                      value={profile.city}
                    />
                    <InfoRow
                      icon={<Calendar size={14} />}
                      label="Date of Birth"
                      value={profile.dob}
                    />
                    <InfoRow
                      icon={<CreditCard size={14} />}
                      label="PAN Number"
                      value={
                        profile.pan
                          ? `${profile.pan.substring(0, 3)}••••${profile.pan.slice(-1)}`
                          : null
                      }
                      mono
                    />
                  </div>
                </div>

                {/* Investor Profile */}
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                        <BarChart3 size={14} className="text-gold-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Investor Profile</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">Your investment DNA</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setEditing(true); setError(""); setSuccess(""); }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-gray-500 hover:text-gray-200 border border-transparent hover:border-white/10 hover:bg-white/[0.04] transition-all duration-200"
                    >
                      <Pencil size={10} />
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <InvestorTile
                      icon={<Zap size={13} />}
                      label="Risk Appetite"
                      value={profile.risk_appetite}
                    />
                    <InvestorTile
                      icon={<GraduationCap size={13} />}
                      label="Experience"
                      value={profile.experience}
                    />
                    <InvestorTile
                      icon={<Target size={13} />}
                      label="Investment Goal"
                      value={profile.goal}
                    />
                    <InvestorTile
                      icon={<Clock size={13} />}
                      label="Time Horizon"
                      value={profile.horizon}
                    />
                  </div>

                  {/* Profile completeness */}
                  {(() => {
                    const fields = [
                      profile.full_name,
                      profile.phone,
                      profile.city,
                      profile.dob,
                      profile.pan,
                      profile.risk_appetite,
                      profile.experience,
                      profile.goal,
                      profile.horizon,
                    ];
                    const filled = fields.filter(Boolean).length;
                    const pct = Math.round((filled / fields.length) * 100);
                    return (
                      <div className="mt-5 pt-4 border-t border-white/[0.04]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] text-gray-500 font-medium">Profile completeness</span>
                          <span className={`text-[11px] font-bold ${pct === 100 ? "text-emerald-400" : pct >= 60 ? "text-gold-400" : "text-rose-400"}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              pct === 100
                                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                : pct >= 60
                                ? "bg-gradient-to-r from-gold-500 to-amber-400"
                                : "bg-gradient-to-r from-rose-500 to-pink-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {pct < 100 && (
                          <p className="text-[11px] text-gray-600 mt-2">
                            Complete your profile to unlock personalised AI research insights.
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* SEBI Compliance Banner */}
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-5 shadow-lg flex items-start gap-4">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-electric-500/[0.08] border border-electric-500/[0.15] flex items-center justify-center mt-0.5">
                    <ShieldCheck size={16} className="text-electric-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-300">SEBI Research Analyst Compliance</p>
                    <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                      AI Stock Kundli provides AI-driven market research for informational purposes only.
                      Nothing on this platform constitutes personalised investment advice.
                      Disclaimer status:{" "}
                      <span className={profile.disclaimer_accepted ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                        {profile.disclaimer_accepted ? "Accepted ✓" : "Pending"}
                      </span>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
