"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface Branding {
  brand_name: string;
  logo_url: string;
  brand_color: string;
  brand_color_secondary: string;
}

interface BrandingContextType {
  branding: Branding;
  loading: boolean;
  refreshBranding: (tenantId?: number) => Promise<void>;
}

const defaultBranding: Branding = {
  brand_name: "AI Stock Kundli",
  logo_url: "/logo.png",
  brand_color: "#3b82f6",
  brand_color_secondary: "#14b8a6",
};

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  loading: true,
  refreshBranding: async () => {},
});

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<Branding>(defaultBranding);
  const [loading, setLoading] = useState(true);

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const applyColors = (primary: string, secondary: string) => {
    if (typeof window !== "undefined") {
      document.documentElement.style.setProperty("--brand-color", primary);
      document.documentElement.style.setProperty("--brand-color-secondary", secondary);
    }
  };

  const refreshBranding = async (tenantId?: number) => {
    setLoading(true);
    try {
      let data: Branding | null = null;
      
      if (tenantId) {
        const res = await fetch(`${getApiUrl()}/api/v1/admin/tenants/${tenantId}/branding`);
        if (res.ok) {
          data = await res.json();
        }
      } else if (typeof window !== "undefined") {
        const domain = window.location.hostname;
        const res = await fetch(`${getApiUrl()}/api/v1/admin/branding/by-domain?domain=${encodeURIComponent(domain)}`);
        if (res.ok) {
          data = await res.json();
        }
      }

      if (data) {
        setBranding({
          brand_name: data.brand_name || defaultBranding.brand_name,
          logo_url: data.logo_url || defaultBranding.logo_url,
          brand_color: data.brand_color || defaultBranding.brand_color,
          brand_color_secondary: data.brand_color_secondary || defaultBranding.brand_color_secondary,
        });
        applyColors(data.brand_color || "#3b82f6", data.brand_color_secondary || "#14b8a6");
      } else {
        setBranding(defaultBranding);
        applyColors(defaultBranding.brand_color, defaultBranding.brand_color_secondary);
      }
    } catch (err) {
      console.error("Failed to load tenant branding context:", err);
      setBranding(defaultBranding);
      applyColors(defaultBranding.brand_color, defaultBranding.brand_color_secondary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("access_token");
    if (!token) {
      refreshBranding();
      return;
    }

    // Try to fetch current user's profile to get tenant_id context
    fetch(`${getApiUrl()}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((user) => {
        if (user && user.tenant_id) {
          refreshBranding(user.tenant_id);
        } else {
          refreshBranding();
        }
      })
      .catch(() => {
        refreshBranding();
      });
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
