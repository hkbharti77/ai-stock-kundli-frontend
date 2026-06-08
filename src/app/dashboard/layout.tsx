"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/common/Header";
import Spinner from "../../components/common/Spinner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">
        <Spinner size="h-8 w-8" color="text-electric-400" label="Verifying session..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-white">
      {/* Centralized persistent header */}
      <Header />
      
      {/* Content wrapper with top padding to offset the fixed header */}
      <div className="flex-1 pt-[72px] relative z-10">
        {children}
      </div>
    </div>
  );
}
