"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Spinner from "../../../components/common/Spinner";

/* ═══════════════════════════════════════════════════════════
   AI Stock Kundli — My Profile Page
   Get profile • Edit profile • Change password shortcut
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
const EXPERIENCE_OPTIONS = ["Beginner (< 1 yr)", "Intermediate (1–3 yrs)", "Experienced (3–7 yrs)", "Expert (7+ yrs)"];
const GOAL_OPTIONS = ["Wealth Creation", "Regular Income", "Capital Preservation", "Short-Term Gains", "Retirement Planning"];
const HORIZON_OPTIONS = ["Short-term (< 1 yr)", "Medium-term (1–3 yrs)", "Long-term (3–7 yrs)", "Very Long-term (7+ yrs)"];

function getPlanBadge(plan: string) {
  const p = plan?.toLowerCase();
  if (p === "advisor") return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
  if (p === "pro") return "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30";
  if (p === "admin" || p === "enterprise") return "bg-rose-500/15 text-rose-400 border border-rose-500/30";
  return "bg-white/5 text-gray-400 border border-white/10";
}

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

function InfoRow({ label, value, icon }: { label: string; value?: string | null; icon: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <span className="text-base mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">{label}</p>
        <p className={`text-sm font-medium truncate ${value ? "text-white" : "text-gray-600 italic"}`}>
          {value || "Not set"}
        </p>
      </div>
    </div>
  );
}

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

  // ─── Fetch Profile ────────────────────────────────────────────
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

  // ─── Save Profile ──────────────────────────────────────────────
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
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="h-8 w-8" color="text-indigo-400" label="Loading your profile..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-rose-400 text-sm">
        {error || "Could not load profile."}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* ── Page Header ───────────────────────────────────── */}
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Profile</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your account details and investor preferences</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/forgot-password"
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition"
          >
            🔐 Reset Password
          </Link>
          {!editing && (
            <button
              onClick={() => { setEditing(true); setError(""); setSuccess(""); }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-900/30"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ── Toast Messages ─────────────────────────────────── */}
      {success && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium animate-fade-in">
          <span>✅</span> {success}
        </div>
      )}
      {error && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Avatar Card ──────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Avatar */}
          <div className="glass-card p-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-black text-white shadow-xl shadow-indigo-900/40 mb-4">
              {getInitials(profile.full_name, profile.email)}
            </div>
            <h2 className="text-lg font-bold text-white truncate">{profile.full_name || "—"}</h2>
            <p className="text-xs text-gray-400 mt-1 truncate">{profile.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${getPlanBadge(profile.plan)}`}>
                {profile.plan} PLAN
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 text-gray-400 border border-white/10">
                {profile.role}
              </span>
            </div>
          </div>

          {/* Account Status */}
          <div className="glass-card p-5 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">Account Status</p>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-xs text-gray-400">Email Verified</span>
              <span className={`text-xs font-bold ${profile.is_verified || profile.otp_verified ? "text-emerald-400" : "text-rose-400"}`}>
                {profile.is_verified || profile.otp_verified ? "✓ Verified" : "✗ Pending"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-xs text-gray-400">Disclaimer</span>
              <span className={`text-xs font-bold ${profile.disclaimer_accepted ? "text-emerald-400" : "text-amber-400"}`}>
                {profile.disclaimer_accepted ? "✓ Accepted" : "Pending"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-gray-400">Member Since</span>
              <span className="text-xs font-bold text-gray-300">
                {new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* ── Right: Info / Edit Panel ───────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {editing ? (
            /* ── Edit Form ────────────────────────────────────── */
            <form onSubmit={handleSave} className="space-y-4">
              {/* Personal Info */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/20 text-indigo-400 text-xs">👤</span>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="input-field"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="input-field"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">City</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="input-field"
                      placeholder="Mumbai, Delhi..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Date of Birth</label>
                    <input
                      type="date"
                      value={form.dob}
                      onChange={(e) => setForm({ ...form, dob: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">PAN Number</label>
                    <input
                      type="text"
                      value={form.pan}
                      onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                      className="input-field font-mono tracking-widest"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              {/* Investor Profile */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-400 text-xs">📊</span>
                  Investor Profile
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Risk Appetite</label>
                    <select
                      value={form.risk_appetite}
                      onChange={(e) => setForm({ ...form, risk_appetite: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select...</option>
                      {RISK_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Experience Level</label>
                    <select
                      value={form.experience}
                      onChange={(e) => setForm({ ...form, experience: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select...</option>
                      {EXPERIENCE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Investment Goal</label>
                    <select
                      value={form.goal}
                      onChange={(e) => setForm({ ...form, goal: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select...</option>
                      {GOAL_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Investment Horizon</label>
                    <select
                      value={form.horizon}
                      onChange={(e) => setForm({ ...form, horizon: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select...</option>
                      {HORIZON_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                {/* Disclaimer toggle */}
                <label className="mt-4 flex items-start gap-3 cursor-pointer select-none group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={form.disclaimer_accepted}
                      onChange={(e) => setForm({ ...form, disclaimer_accepted: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`h-5 w-5 rounded flex items-center justify-center border transition ${form.disclaimer_accepted ? "bg-indigo-600 border-indigo-500" : "bg-white/5 border-white/20 group-hover:border-white/40"}`}>
                      {form.disclaimer_accepted && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 leading-relaxed">
                    I accept the SEBI disclaimer — this platform provides research-driven insights for informational purposes only, not personalised investment advice.
                  </span>
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setEditing(false); setError(""); }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-white/10 text-gray-400 hover:text-white hover:border-white/25 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-900/30 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <><Spinner size="h-3.5 w-3.5" color="text-white" /> Saving...</> : "💾 Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            /* ── View Mode ────────────────────────────────────── */
            <>
              {/* Personal Info Card */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/20 text-indigo-400 text-xs">👤</span>
                  Personal Information
                </h3>
                <InfoRow icon="📧" label="Email Address" value={profile.email} />
                <InfoRow icon="📱" label="Phone Number" value={profile.phone} />
                <InfoRow icon="🏙️" label="City" value={profile.city} />
                <InfoRow icon="🎂" label="Date of Birth" value={profile.dob} />
                <InfoRow icon="🪪" label="PAN Number" value={profile.pan ? `${profile.pan.substring(0, 3)}****${profile.pan.slice(-1)}` : null} />
              </div>

              {/* Investor Profile Card */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-400 text-xs">📊</span>
                  Investor Profile
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: "⚡", label: "Risk Appetite", value: profile.risk_appetite },
                    { icon: "🎓", label: "Experience", value: profile.experience },
                    { icon: "🎯", label: "Investment Goal", value: profile.goal },
                    { icon: "🕐", label: "Horizon", value: profile.horizon },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="rounded-xl bg-white/[0.025] border border-white/5 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{icon} {label}</p>
                      <p className={`text-sm font-semibold ${value ? "text-white" : "text-gray-600 italic text-xs"}`}>
                        {value || "Not set"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
