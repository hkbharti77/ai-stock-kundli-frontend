"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

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
  const { user, loading: authLoading } = useAuth();
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
    // If auth is still loading, wait for it
    if (authLoading) {
      return;
    }

    // If user is not logged in, use default branding
    if (!user) {
      refreshBranding();
      return;
    }

    // If user is logged in, fetch their tenant context
    refreshBranding(user.id);
  }, [user, authLoading]);

  return (
    <BrandingContext.Provider value={{ branding, loading, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
