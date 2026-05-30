"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../context/LanguageContext";

interface CompanyResult {
  ticker: string;
  name: string;
  isin: string;
  exchange: string;
  market_cap: number | null;
  sector: string | null;
}

/**
 * Global reusable stock search autocomplete with debounced API lookup.
 * Used across: dashboard nav, stock detail page nav.
 * Contains API call to /api/v1/companies/search (intentional — core functionality of this widget).
 */
export default function SearchAutocomplete() {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setIsOpen(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const token = localStorage.getItem("access_token");
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
          `${apiUrl}/api/v1/companies/search?q=${encodeURIComponent(query)}`,
          { headers }
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error("Error searching companies:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (ticker: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/dashboard/stocks/${ticker}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && results.length > 0) {
      handleSelect(results[0].ticker);
    }
  };

  const formatMarketCap = (mcap: number | null) => {
    if (!mcap) return "";
    // Format to Indian Crore
    const cr = mcap / 10000000;
    if (cr >= 100) {
      return `₹${(cr / 100).toFixed(2)} L Cr`;
    }
    return `₹${cr.toFixed(0)} Cr`;
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md z-30" id="search-autocomplete-container">
      {/* Search Input Box */}
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-navy-900/60 focus-within:border-electric-500/50 focus-within:ring-2 focus-within:ring-electric-500/20 px-3 py-1.5 transition-all duration-300 backdrop-blur-md">
        <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder={t("dashboard.searchPlaceholder") || "Search stocks by ticker or name..."}
          className="w-full bg-transparent py-1 text-sm text-white placeholder-gray-500 outline-none"
          id="autocomplete-input"
        />
        {loading && (
          <svg className="h-4 w-4 animate-spin text-electric-400 shrink-0" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full max-h-[350px] overflow-y-auto rounded-xl border border-white/10 bg-navy-950/90 backdrop-blur-2xl shadow-2xl transition-all duration-200 divide-y divide-white/5 scrollbar-thin scrollbar-track-navy-950 scrollbar-thumb-white/10">
          {results.length > 0 ? (
            results.map((company) => (
              <div
                key={company.ticker}
                onClick={() => handleSelect(company.ticker)}
                className="group flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-electric-500/10 font-mono text-xs font-bold text-electric-400 group-hover:bg-electric-500 group-hover:text-white transition-colors duration-200">
                    {company.ticker}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-electric-400 transition-colors duration-200">
                      {company.name}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <span className="badge-blue px-1.5 py-0.5 text-[10px] scale-90">{company.exchange}</span>
                      {company.sector && <span>• {company.sector}</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {company.market_cap && (
                    <span className="font-mono text-xs text-gray-500">
                      {formatMarketCap(company.market_cap)}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-4 text-center text-sm text-gray-400">
              {query.trim() ? "No stocks match your query" : "Start typing to search stocks..."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
