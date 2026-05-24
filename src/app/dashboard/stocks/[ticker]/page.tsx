import { Metadata } from "next";
import StockDetailsClient from "./StockDetailsClient";

interface Props {
  params: {
    ticker: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ticker = params.ticker.toUpperCase();
  return {
    title: `${ticker} AI Kundli & Stock Analysis — Enterprise Investment Intelligence`,
    description: `Get real-time, multi-agent AI research report, fundamental thesis, technical signals, and news sentiment score for ${ticker}. Make data-driven investment decisions.`,
    keywords: [ticker, `${ticker} share price`, `${ticker} fundamental analysis`, `${ticker} kundli`, "stock analysis"],
  };
}

export default function Page() {
  return <StockDetailsClient />;
}
