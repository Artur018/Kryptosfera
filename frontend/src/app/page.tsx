// src/app/page.tsx

// src/app/page.tsx

import Link from "next/link";
import {
  getLatestReport,
  getSignals,
  type ReportSymbolRow,
  type Signal,
} from "@/lib/api";

const translations = {
  en: {
    appTitle: "Chainsignal – Daily crypto radar",
    subtitle:
      "Monitoring selected Binance spot pairs and detecting strong 24h / 7D moves with ATR.",
    lastUpdate: "Last update",
    reportSectionTitle: "Market snapshot",
    reportSectionDesc:
      "Key metrics for the monitored symbols: daily / 3D / 7D changes and volatility (ATR).",
    tableHeaders: {
      symbol: "Symbol",
      price: "Price",
      change24h: "24h %",
      change3d: "3D %",
      change7d: "7D %",
      atr3d: "ATR 3D %",
      atr7d: "ATR 7D %",
    },
    signalsSectionTitle: "Signals",
    signalsSectionSubtitle: "24h moves above threshold & volatility filters.",
    noSignals: "No active signals for the current thresholds.",
    signalsCountLabel: "active",
    signalReasonsLabel: "Reasons",
    signalMetricsLabel: "Metrics",
    thresholdsHint: "Default thresholds: |24h| > 8%, ATR 7D > 7%.",
    footerNote:
      "Backend: FastAPI + APScheduler on VPS • Data source: Binance (spot).",
    langLabel: "Language",
    langEN: "EN",
    langPL: "PL",
  },
  pl: {
    appTitle: "Chainsignal – Dzienny radar rynku krypto",
    subtitle:
      "Monitorujemy wybrane pary spot z Binance i wyłapujemy mocne ruchy 24h / 7D wraz z ATR.",
    lastUpdate: "Ostatnia aktualizacja",
    reportSectionTitle: "Przekrój rynku",
    reportSectionDesc:
      "Kluczowe metryki dla monitorowanych symboli: zmiany dzienne / 3-dniowe / 7-dniowe oraz zmienność (ATR).",
    tableHeaders: {
      symbol: "Symbol",
      price: "Kurs",
      change24h: "24h %",
      change3d: "3D %",
      change7d: "7D %",
      atr3d: "ATR 3D %",
      atr7d: "ATR 7D %",
    },
    signalsSectionTitle: "Sygnały",
    signalsSectionSubtitle:
      "Ruchy 24h powyżej progu oraz dodatkowe filtry zmienności.",
    noSignals: "Brak aktywnych sygnałów dla bieżących progów.",
    signalsCountLabel: "aktywne",
    signalReasonsLabel: "Powody",
    signalMetricsLabel: "Metryki",
    thresholdsHint: "Domyślne progi: |24h| > 8%, ATR 7D > 7%.",
    footerNote:
      "Backend: FastAPI + APScheduler na VPS • Źródło danych: Binance (spot).",
    langLabel: "Język",
    langEN: "EN",
    langPL: "PL",
  },
} as const;

type Lang = keyof typeof translations;

type PageProps = {
  searchParams?: { lang?: string };
};

// backend zwraca "2025-12-09-16-00-06"
function formatGeneratedAt(raw: string, lang: Lang): string {
  const parts = raw.split("-");
  if (parts.length < 5) return raw;

  const [yearStr, monthStr, dayStr, hourStr, minuteStr] = parts;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  const pad = (n: number) => String(n).padStart(2, "0");

  if (lang === "pl") {
    // 09.12.2025 17:00
    return `${pad(day)}.${pad(month)}.${year} ${pad(hour)}:${pad(minute)}`;
  }
  // 2025-12-09 17:00
  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function formatPrice(value: number): string {
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(2);
  return value.toPrecision(3);
}

function changeColorClass(value: number): string {
  if (value > 8) return "text-emerald-400";
  if (value < -8) return "text-rose-400";
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-rose-300";
  return "text-slate-200";
}

export default async function HomePage({ searchParams }: PageProps) {
  const langParam = searchParams?.lang;
  const lang: Lang = langParam === "pl" || langParam === "en" ? langParam : "pl";
  const t = translations[lang];

  const [report, signals] = await Promise.all([
    getLatestReport(),
    getSignals(),
  ]);

  const generatedAt = formatGeneratedAt(report.generated_at, lang);
  const symbols = report.symbols;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col items-start justify-between gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
              {t.appTitle}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              {t.subtitle}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {t.lastUpdate}:{" "}
              <span className="font-mono text-slate-200">{generatedAt}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{t.langLabel}</span>
            <div className="inline-flex overflow-hidden rounded-full border border-slate-700 bg-slate-900">
              <Link
                href="?lang=en"
                className={`px-3 py-1 text-xs font-medium ${
                  lang === "en"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {t.langEN}
              </Link>
              <Link
                href="?lang=pl"
                className={`px-3 py-1 text-xs font-medium ${
                  lang === "pl"
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {t.langPL}
              </Link>
            </div>
          </div>
        </header>

        {/* Main grid */}
        <section className="grid gap-6 lg:grid-cols-[2fr,1.2fr]">
          {/* Report table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-lg shadow-slate-950/40">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  {t.reportSectionTitle}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {t.reportSectionDesc}
                </p>
              </div>
              <div className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-mono text-slate-300">
                {symbols.length} symbols
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-900/80">
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2 text-left">{t.tableHeaders.symbol}</th>
                    <th className="px-3 py-2 text-right">{t.tableHeaders.price}</th>
                    <th className="px-3 py-2 text-right">{t.tableHeaders.change24h}</th>
                    <th className="px-3 py-2 text-right">{t.tableHeaders.change3d}</th>
                    <th className="px-3 py-2 text-right">{t.tableHeaders.change7d}</th>
                    <th className="px-3 py-2 text-right">{t.tableHeaders.atr3d}</th>
                    <th className="px-3 py-2 text-right">{t.tableHeaders.atr7d}</th>
                  </tr>
                </thead>
                <tbody>
                  {symbols.map((row: ReportSymbolRow) => (
                    <tr
                      key={row.symbol}
                      className="border-b border-slate-900/80 hover:bg-slate-900/60"
                    >
                      <td className="px-3 py-2 text-left text-[11px] font-semibold text-slate-100">
                        {row.symbol}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-slate-200">
                        {formatPrice(row.close)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono text-[11px] ${changeColorClass(
                          row.change_24h,
                        )}`}
                      >
                        {formatPercent(row.change_24h)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono text-[11px] ${changeColorClass(
                          row.change_3d,
                        )}`}
                      >
                        {formatPercent(row.change_3d)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono text-[11px] ${changeColorClass(
                          row.change_7d,
                        )}`}
                      >
                        {formatPercent(row.change_7d)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-slate-300">
                        {formatPercent(row.atr_3d)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-[11px] text-slate-300">
                        {formatPercent(row.atr_7d)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signals */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-lg shadow-slate-950/40">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">
                    {t.signalsSectionTitle}
                  </h2>
                  <p className="mt-1 text-xs text-slate-400">
                    {t.signalsSectionSubtitle}
                  </p>
                </div>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                  {signals.length} {t.signalsCountLabel}
                </span>
              </div>

              <p className="mb-3 text-[10px] text-slate-500">{t.thresholdsHint}</p>

              {signals.length === 0 ? (
                <p className="text-xs text-slate-400">{t.noSignals}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {signals.map((s: Signal) => (
                    <div
                      key={s.symbol + s.change_24h + s.change_7d}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-6 items-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-900">
                            {s.symbol}
                          </span>
                          <span
                            className={`text-xs font-mono ${changeColorClass(
                              s.change_24h,
                            )}`}
                          >
                            {formatPercent(s.change_24h)} / 24h
                          </span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wide text-slate-500">
                          {t.signalReasonsLabel}
                        </span>
                      </div>

                      <div className="mb-1 text-[11px] text-slate-300">
                        {s.reasons && s.reasons.length > 0
                          ? s.reasons.join(", ")
                          : "-"}
                      </div>

                      <div className="mt-1 text-[10px] text-slate-500">
                        {t.signalMetricsLabel}:{" "}
                        <span className="font-mono text-slate-300">
                          3D {formatPercent(s.change_3d)}, 7D{" "}
                          {formatPercent(s.change_7d)}, ATR 7D{" "}
                          {formatPercent(s.atr_7d)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-500">{t.footerNote}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
