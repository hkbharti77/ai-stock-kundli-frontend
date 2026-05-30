"use client";

interface SpinnerProps {
  /** Tailwind size class, e.g. "h-8 w-8". Defaults to "h-8 w-8". */
  size?: string;
  /** Tailwind color class, e.g. "text-electric-400". Defaults to "text-electric-400". */
  color?: string;
  /** Optional label rendered below the spinner */
  label?: string;
}

/**
 * Global reusable loading spinner.
 * Extracted from duplicated inline SVG spinners across dashboard, stock detail, and portfolio pages.
 */
export default function Spinner({
  size = "h-8 w-8",
  color = "text-electric-400",
  label,
}: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        className={`animate-spin ${size} ${color}`}
        viewBox="0 0 24 24"
        aria-label="Loading"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {label && <span className="text-gray-400 text-sm">{label}</span>}
    </div>
  );
}
