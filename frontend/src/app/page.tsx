// src/app/page.tsx
import ChainsignalDashboard from "./ChainsignalDashboard";
import { getLatestReport, getSignals, type LatestReport, type Signal } from "@/lib/api";

// Optional: ISR co 60s
export const revalidate = 60;

export default async function Page() {
  let report: LatestReport | null = null;
  let signals: Signal[] = [];
  let error: string | null = null;

  try {
    const [r, s] = await Promise.all([getLatestReport(), getSignals()]);
    report = r;
    signals = s;
  } catch (e) {
    console.error("Failed to fetch data from API:", e);
    error = "Failed to fetch data from API.";
  }

  return (
    <ChainsignalDashboard
      initialReport={report}
      initialSignals={signals}
      initialError={error}
    />
  );
}
