"use client";

import { useEffect } from "react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "info";
}

export default function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
}: AlertModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
          glow: "bg-emerald-500/[0.08]",
          btnBg: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/20",
          icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        };
      case "error":
        return {
          iconBg: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
          glow: "bg-rose-500/[0.08]",
          btnBg: "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 shadow-rose-500/20",
          icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
        };
      case "info":
      default:
        return {
          iconBg: "bg-electric-500/10 text-electric-400 border border-electric-500/20",
          glow: "bg-electric-500/[0.08]",
          btnBg: "bg-gradient-to-r from-electric-500 to-indigo-500 hover:from-electric-600 hover:to-indigo-600 shadow-electric-500/20",
          icon: (
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-navy-900/80 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 transform scale-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Glow element */}
        <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl ${styles.glow}`} />

        <div className="flex flex-col items-center text-center">
          {/* Glowing Icon Container */}
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${styles.iconBg}`}>
            {styles.icon}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-white tracking-wide mb-2">{title}</h3>

          {/* Message */}
          <p className="text-sm text-gray-400 leading-relaxed mb-6 font-medium whitespace-pre-line">
            {message}
          </p>

          {/* Confirm Button */}
          <button
            onClick={onClose}
            className={`w-full py-2.5 px-4 text-sm font-bold text-white rounded-xl shadow-lg transition duration-200 hover:scale-[1.02] active:scale-[0.98] transform ${styles.btnBg}`}
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  );
}
