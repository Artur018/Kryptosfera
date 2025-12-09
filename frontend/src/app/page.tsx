// src/app/page.tsx

import {
  getLatestReport,
  getSignals,
  type ReportSymbolRow,
  type Signal,
} from "@/lib/api";

type HomePageProps = {
  searchParams?: {
    lang?: string;
  };
};

const TRANSLATIONS = {
  en: {
    subtitle: "Daily crypto market scan powered by Chainsignal & Kryptosfera.",
    generatedAt: "Generated at",
    latestReport: "Latest market snapshot",
    tableSymbol: "Symbol",
    tablePrice: "Price",
    tableChange24h: "24h",
    tableChange3d: "3d",
    tableChange7d: "7d",
    tableAtr3d: "ATR 3d",
    tableAtr7d: "ATR 7d",
    signalsTitle: "Signals",
    signalsEmpty: "No active signals for the configured thresholds.",
    signalsBadge: "24h move",
    languageLabel: "Language",
    signalReason24h: "24h move above threshold",
    signalGeneric: "Volatility / momentum signal",
  },
  pl: {
    subtitle: "Dzienny skan rynku krypto od Chainsignal & Kryptosfera.",
    generatedAt: "Raport wygenerowany",
    latestReport: "Ostatni snapshot rynku",
    tableSymbol: "Symbol",
    tablePrice: "Cena",
    tableChange24h: "24h",
    tableChange3d: "3 dni",
    tableChange7d: "7 dni",
    tableAtr3d: "ATR 3 dni",
    tableAtr7d: "ATR 7 dni",
    signalsTitle: "Sygnały",
    signalsEmpty: "Brak aktywnych sygnałów dla ustawionych progów.",
    signalsBadge: "Ruch 24h",
    languageLabel: "Język",
    signalReason24h: "Ruch 24h powyżej progu",
    signalGeneric: "Sygnał zmienności / momentum",
  },
} as const;

function formatGeneratedAt(raw: string, lang: "pl" | "en"): string {
  // backend: "2025-12-09-16-00-06"
  const [datePart, timePart] = raw.split("-");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split("-").slice(0, 2).map(Number);

  const d = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (lang === "pl") {
    return d.toLocaleString("pl-PL", {
      timeZone: "Europe/Warsaw",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return d.toLocaleString("en-US", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPercent(value: number): string {
  const fixed = value.toFixed(2);
  return (value > 0 ? "+" : "") + fixed + "%";
}

function formatNumber(value: number): string {
  if (value >= 1000) {
    return value.toLocaleString("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  }
  return value.toFixed(2);
}

function classifyChange(value: number): "up" | "down" | "flat" {
  if (value > 1) return "up";
  if (value < -1) return "down";
  return "flat";
}

function ChangePill({ value }: { value: number }) {
  const variant = classifyChange(value);
  const base =
    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-mono";
  if (variant === "up") {
    return (
      <span className={base + " bg-emerald-900/40 text-emerald-300"}>
        ↑ {formatPercent(value)}
      </span>
    );
  }
  if (variant === "down") {
    return (
      <span className={base + " bg-rose-900/40 text-rose-300"}>
        ↓ {formatPercent(value)}
      </span>
    );
  }
  return (
    <span className={base + " bg-slate-800 text-slate-300"}>
      → {formatPercent(value)}
    </span>
  );
}

type SignalWithLabel = Signal & { label: string };

export default async function HomePage({ searchParams }: HomePageProps) {
  const lang: "pl" | "en" =
    searchParams?.lang === "pl" || searchParams?.lang === "en"
      ? (searchParams.lang as "pl" | "en")
      : "pl";

  const t = TRANSLATIONS[lang];

  const [report, signalsRaw] = await Promise.all([
    getLatestReport(),
    getSignals(),
  ]);

  const rows: ReportSymbolRow[] = report.symbols;

  const signals: SignalWithLabel[] = signalsRaw.map((s) => ({
    ...s,
    label:
      s.reasons.length === 1 && s.reasons[0] === "big_move_24h"
        ? t.signalReason24h
        : t.signalGeneric,
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        {/* HEADER */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
              Chainsignal
            </h1>
            <p className="mt-1 text-sm text-slate-400">{t.subtitle}</p>
          </div>

          {/* PRZEŁĄCZNIK JĘZYKA – via URL, nie eventy JS */}
          <nav className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 p-1 text-xs shadow-md shadow-black/40 ring-1 ring-slate-700/60">
            <span className="px-2 text-slate-400">{t.languageLabel}</span>
            <a
              href="/?lang=en"
              className={
                "rounded-full px-3 py-1 font-medium transition " +
                (lang === "en"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-300 hover:bg-slate-800")
              }
            >
              EN
            </a>
            <a
              href="/?lang=pl"
              className={
                "rounded-full px-3 py-1 font-medium transition " +
                (lang === "pl"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-300 hover:bg-slate-800")
              }
            >
              PL
            </a>
          </nav>
        </header>

        {/* INFO O RAPORCIE */}
        <section className="grid gap-4 md:grid-cols-[2fr,1.2fr]">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-black/40">
            <h2 className="text-sm font-semibold tracking-wide text-slate-300">
              {t.latestReport}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {t.generatedAt}:{" "}
              <span className="font-mono text-slate-200">
                {formatGeneratedAt(report.generated_at, lang)}
              </span>
            </p>

            <div className="mt-4 overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950/40">
              <table className="min-w-full border-collapse text-xs">
                <thead className="bg-slate-900/80 text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">
                      {t.tableSymbol}
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      {t.tablePrice}
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      {t.tableChange24h}
                    </th>
                    <th className="px-3 py-2 text-right font-medium hidden sm:table-cell">
                      {t.tableChange3d}
                    </th>
                    <th className="px-3 py-2 text-right font-medium hidden sm:table-cell">
                      {t.tableChange7d}
                    </th>
                    <th className="px-3 py-2 text-right font-medium hidden md:table-cell">
                      {t.tableAtr3d}
                    </th>
                    <th className="px-3 py-2 text-right font-medium hidden md:table-cell">
                      {t.tableAtr7d}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.symbol}
                      className="border-t border-slate-800/70 hover:bg-slate-900/60"
                    >
                      <td className="px-3 py-1.5 text-left font-mono text-[11px] text-slate-100">
                        {row.symbol}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-[11px] text-slate-100">
                        {formatNumber(row.close)}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <ChangePill value={row.change_24h} />
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-[11px] text-slate-300 hidden sm:table-cell">
                        {formatPercent(row.change_3d)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-[11px] text-slate-300 hidden sm:table-cell">
                        {formatPercent(row.change_7d)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-[11px] text-slate-400 hidden md:table-cell">
                        {row.atr_3d.toFixed(2)}%
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-[11px] text-slate-400 hidden md:table-cell">
                        {row.atr_7d.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SYGNAŁY */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold tracking-wide text-slate-300">
                {t.signalsTitle}
              </h2>
              <span className="rounded-full bg-slate-950/70 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                {signals.length}
              </span>
            </div>

            {signals.length === 0 ? (
              <p className="text-xs text-slate-500">{t.signalsEmpty}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {signals.map((s) => (
                  <li
                    key={s.symbol}
                    className="rounded-lg border border-slate-800/80 bg-slate-950/40 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-100">
                          {s.symbol}
                        </span>
                        <span className="rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] font-mono text-amber-200">
                          {t.signalsBadge}
                        </span>
                      </div>
                      <ChangePill value={s.change_24h} />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {s.label}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
