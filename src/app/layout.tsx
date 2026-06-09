import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../context/LanguageContext";
import { BrandingProvider } from "../context/BrandingContext";
import RiskConsentModal from "../components/common/RiskConsentModal";

export const metadata: Metadata = {
  title: "AI Stock Kundli — Research & Education Tool",
  description:
    "AI-powered stock research and education platform for NSE/BSE stocks. FOR EDUCATIONAL USE ONLY — Not investment advice. All analysis is for informational purposes. Invest at your own risk.",
  keywords: [
    "stock research",
    "stock education",
    "NSE",
    "BSE",
    "Indian stocks",
    "AI research tool",
    "stock kundli",
    "not investment advice",
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
            {/* ── Risk Consent Modal: fires on first visit, must be accepted ── */}
            <RiskConsentModal />
            {children}
          </BrandingProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

