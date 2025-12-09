// src/lib/api.ts

export type ReportSymbolRow = {
  symbol: string;
  close: number;
  change_24h: number;
  change_3d: number;
  change_7d: number;
  atr_3d: number;
  atr_7d: number;
};

export type LatestReport = {
  generated_at: string;
  symbols: ReportSymbolRow[];
};

export type Signal = {
  symbol: string;
  reasons: string[];
  change_24h: number;
  change_3d: number;
  change_7d: number;
  atr_3d: number;
  atr_7d: number;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://chainsignal.solutions";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    // SSR + lekkie cache, możesz zmienić na "no-store" jak chcesz zawsze świeże
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  return (await res.json()) as T;
}

export async function getLatestReport(): Promise<LatestReport> {
  return fetchJson<LatestReport>("/reports/latest");
}

export async function getSignals(): Promise<Signal[]> {
  const data = await fetchJson<{ count: number; signals: Signal[] }>("/signals");
  return data.signals;
}
