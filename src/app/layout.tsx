import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../context/LanguageContext";
import { BrandingProvider } from "../context/BrandingContext";

export const metadata: Metadata = {
  title: "AI Stock Kundli — Enterprise Investment Intelligence",
  description:
    "AI-powered investment intelligence platform analyzing NSE/BSE stocks with multi-agent AI. Get explainable, data-driven insights for smarter investment decisions.",
  keywords: [
    "stock analysis",
    "AI investing",
    "NSE",
    "BSE",
    "Indian stocks",
    "investment intelligence",
    "stock kundli",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-noise min-h-screen antialiased">
        <LanguageProvider>
          <BrandingProvider>
            {children}
          </BrandingProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

