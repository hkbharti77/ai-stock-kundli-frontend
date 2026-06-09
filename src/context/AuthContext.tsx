"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  full_name: string | null;
  plan: string;
  role?: string;
  is_verified: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Token refresh attempt timeout (5 minutes before actual expiry)
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Get tokens from localStorage
  const getTokens = () => {
    if (typeof window === "undefined") return null;
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  };

  // Parse JWT to get expiry time
  const getTokenExpiry = (token: string): number | null => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  };

  // Check if token needs refresh
  const needsRefresh = (token: string): boolean => {
    const expiry = getTokenExpiry(token);
    if (!expiry) return true;
    const now = Date.now();
    return now >= expiry - REFRESH_THRESHOLD_MS;
  };

  // Refresh access token using refresh token
  const refreshAccessToken = async (): Promise<string | null> => {
    const tokens = getTokens();
    if (!tokens) return null;

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: tokens.refreshToken }),
      });

      if (!res.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      return data.access_token;
    } catch (err) {
      console.error("Failed to refresh token:", err);
      // If refresh fails, logout user
      logout();
      return null;
    }
  };

  // Fetch user profile using token
  const fetchUserProfile = async (token: string): Promise<User | null> => {
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const data = await res.json();
      return {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        plan: data.plan || "free",
        role: data.role,
        is_verified: data.otp_verified || false,
        created_at: data.created_at,
      };
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
      return null;
    }
  };

  // Auto-refresh token if needed
  useEffect(() => {
    const tokens = getTokens();
    if (!tokens) {
      setLoading(false);
      return;
    }

    // Check if access token needs refresh
    if (needsRefresh(tokens.accessToken)) {
      console.log("Access token needs refresh, attempting...");
      refreshAccessToken().then((newToken) => {
        if (newToken) {
          fetchUserProfile(newToken).then((userData) => {
            setUser(userData);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      });
    } else {
      // Token is still valid, fetch user profile
      fetchUserProfile(tokens.accessToken).then((userData) => {
        setUser(userData);
        setLoading(false);
      });
    }

    // Set up automatic refresh timer
    const expiry = getTokenExpiry(tokens.accessToken);
    if (expiry) {
      const timeUntilRefresh = expiry - Date.now() - REFRESH_THRESHOLD_MS;
      if (timeUntilRefresh > 0 && timeUntilRefresh < 3600000) { // Max 1 hour
        const timer = setTimeout(() => {
          refreshAccessToken().then((newToken) => {
            if (newToken) {
              fetchUserProfile(newToken).then((userData) => {
                setUser(userData);
              });
            }
          });
        }, timeUntilRefresh);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Login failed");
      }

      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      // Fetch and set user profile
      const userData = await fetchUserProfile(data.access_token);
      setUser(userData);
      router.replace("/dashboard");
    } catch (err: any) {
      console.error("Login failed:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
