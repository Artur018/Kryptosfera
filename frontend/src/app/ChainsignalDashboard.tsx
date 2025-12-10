"use client";

import React, { useEffect, useState } from "react";
import type { LatestReport, ReportSymbolRow, Signal } from "@/lib/api";
import { getLatestReport, getSignals } from "@/lib/api";

type Lang = "en" | "pl";

const translations: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    generatedAt: (date: string) => string;
    reportSectionTitle: string;
    signalsSectionTitle: string;
    noSignals: string;
    change24h: string;
    change3d: string;
    change7d: string;
    atr3d: string;
    atr7d: string;
    symbol: string;
    price: string;
    reasonsLabel: string;
    loading: string;
    error: string;
    langLabel: string;
  }
> = {
  en: {
    title: "Chainsignal",
    subtitle: "Daily crypto volatility & momentum monitor",
    generatedAt: (date) => `Report generated at ${date}`,
    reportSectionTitle: "Market overview",
    signalsSectionTitle: "Signals (> 8% / 24h)",
    noSignals: "No active signals for the selected criteria.",
    change24h: "24h %",
    change3d: "3D %",
    change7d: "7D %",
    atr3d: "ATR(3D) %",
    atr7d: "ATR(7D) %",
    symbol: "Symbol",
    price: "Price",
    reasonsLabel: "Reasons",
    loading: "Loading data…",
    error: "Failed to fetch data from API.",
    langLabel: "Language",
  },
  pl: {
    title: "Chainsignal",
    subtitle: "Dzienny monitoring zmienności i momentum rynku krypto",
    generatedAt: (date) => `Raport wygenerowany: ${date}`,
    reportSectionTitle: "Przegląd rynku",
    signalsSectionTitle: "Sygnały (> 8% / 24h)",
    noSignals: "Brak aktywnych sygnałów dla wybranych kryteriów.",
    change24h: "24h %",
    change3d: "3 dni %",
    change7d: "7 dni %",
    atr3d: "ATR(3D) %",
    atr7d: "ATR(7D) %",
    symbol: "Symbol",
    price: "Cena",
    reasonsLabel: "Powody",
    loading: "Ładowanie danych…",
    error: "Błąd podczas pobierania danych z API.",
    langLabel: "Język",
  },
};

// mapujemy klucze reasons → ładne stringi, per język
const reasonLabels: Record<Lang, Record<string, string>> = {
  en: {
    big_move_24h: "Big 24h move",
    atr_spike: "ATR spike",
  },
  pl: {
    big_move_24h: "Duży ruch w 24h",
    atr_spike: "Wybicie ATR",
  },
};

function formatGeneratedAtHuman(raw: string, lang: Lang): string {
  // backend: "2025-12-09-16-00-06"
  const parts = raw.split("-");
  if (parts.length < 6) {
    return raw;
  }
  const [year, month, day, hour, minute] = parts;
  const base = `${day}.${month}.${year} ${hour}:${minute}`;
  return lang === "pl" ? base : `${year}-${month}-${day} ${hour}:${minute}`;
}

export default function ChainsignalDashboard() {
  const [lang, setLang] = useState<Lang>("en");
  const t = translations[lang];

  const [report, setReport] = useState<LatestReport | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const [latestReport, activeSignals] = await Promise.all([
          getLatestReport(),
          getSignals(),
        ]);

        if (cancelled) return;

        setReport(latestReport);
        // NIE filtrujemy już tu dodatkowo, backend i tak robi swoje
        setSignals(activeSignals);
      } catch (err) {
        console.error("Error while fetching API data:", err);
        if (!cancelled) {
          setErrorMsg("api_error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLangChange = (newLang: Lang) => {
    setLang(newLang);
  };

  const formattedGeneratedAt =
    report?.generated_at != null
      ? formatGeneratedAtHuman(report.generated_at, lang)
      : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
        {/* Header */}
        <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
              {t.title}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              {t.subtitle}
            </p>
            {formattedGeneratedAt && (
              <p className="mt-1 text-xs font-mono text-slate-400">
                {t.generatedAt(formattedGeneratedAt)}
              </p>
            )}
          </div>

          {/* Language switch */}
          <div className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-200">
            <span className="mr-1 text-slate-400">{t.langLabel}:</span>
            <button
              type="button"
              onClick={() => handleLangChange("en")}
              className={`rounded-full px-2 py-0.5 ${
                lang === "en"
                  ? "bg-emerald-500 text-slate-900"
                  : "bg-transparent text-slate-300 hover:bg-slate-800"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLangChange("pl")}
              className={`rounded-full px-2 py-0.5 ${
                lang === "pl"
                  ? "bg-emerald-500 text-slate-900"
                  : "bg-transparent text-slate-300 hover:bg-slate-800"
              }`}
            >
              PL
            </button>
          </div>
        </header>

        {/* Error / loading */}
        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
            {t.loading}
          </div>
        )}
        {!loading && errorMsg && (
          <div className="rounded-xl border border-red-700/60 bg-red-900/40 px-4 py-3 text-sm text-red-100">
            {t.error}
          </div>
        )}

        {!loading && !errorMsg && report && (
          <section className="grid gap-6 md:grid-cols-3">
            {/* Market overview table */}
            <div className="md:col-span-2">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-slate-200">
                  {t.reportSectionTitle}
                </h2>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  {report.symbols.length} assets
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="bg-slate-900/80 text-slate-300">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">
                        {t.symbol}
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        {t.price}
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        {t.change24h}
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        {t.change3d}
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        {t.change7d}
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        {t.atr3d}
                      </th>
                      <th className="px-3 py-2 text-right font-medium">
                        {t.atr7d}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.symbols.map((row: ReportSymbolRow) => {
                      const isPositive = row.change_24h >= 0;
                      const changeClass = isPositive
                        ? "text-emerald-400"
                        : "text-rose-400";

                      return (
                        <tr
                          key={row.symbol}
                          className="border-t border-slate-800/70 hover:bg-slate-900"
                        >
                          <td className="px-3 py-2 font-mono text-[11px] text-slate-100">
                            {row.symbol}
                          </td>
                          <td className="px-3 py-2 text-right text-[11px] text-slate-100">
                            {row.close.toFixed(2)}
                          </td>
                          <td
                            className={`px-3 py-2 text-right text-[11px] ${changeClass}`}
                          >
                            {row.change_24h.toFixed(2)}%
                          </td>
                          <td className="px-3 py-2 text-right text-[11px] text-slate-200">
                            {row.change_3d.toFixed(2)}%
                          </td>
                          <td className="px-3 py-2 text-right text-[11px] text-slate-200">
                            {row.change_7d.toFixed(2)}%
                          </td>
                          <td className="px-3 py-2 text-right text-[11px] text-slate-300">
                            {row.atr_3d.toFixed(2)}%
                          </td>
                          <td className="px-3 py-2 text-right text-[11px] text-slate-300">
                            {row.atr_7d.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signals */}
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-slate-200">
                  {t.signalsSectionTitle}
                </h2>
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  {signals.length} active
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {signals.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-xs text-slate-300">
                    {t.noSignals}
                  </div>
                ) : (
                  signals.map((s) => {
                    const isPositive = s.change_24h >= 0;
                    const changeClass = isPositive
                      ? "text-emerald-400"
                      : "text-rose-400";

                    return (
                      <article
                        key={s.symbol}
                        className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-xs"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-mono text-[11px] text-slate-50">
                            {s.symbol}
                          </span>
                          <span
                            className={`font-mono text-[11px] ${changeClass}`}
                          >
                            {s.change_24h.toFixed(2)}%
                          </span>
                        </div>

                        <div className="mb-1 flex gap-2 text-[11px] text-slate-300">
                          <span>{t.change3d}:</span>
                          <span
                            className={
                              s.change_3d >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }
                          >
                            {s.change_3d.toFixed(2)}%
                          </span>
                        </div>
                        <div className="mb-1 flex gap-2 text-[11px] text-slate-300">
                          <span>{t.change7d}:</span>
                          <span
                            className={
                              s.change_7d >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }
                          >
                            {s.change_7d.toFixed(2)}%
                          </span>
                        </div>

                        <div className="mb-2 flex gap-2 text-[11px] text-slate-400">
                          <span>{t.atr3d}:</span>
                          <span>{s.atr_3d.toFixed(2)}%</span>
                          <span>{t.atr7d}:</span>
                          <span>{s.atr_7d.toFixed(2)}%</span>
                        </div>

                        {s.reasons.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[10px] uppercase tracking-wide text-slate-500">
                              {t.reasonsLabel}:
                            </span>
                            {s.reasons.map((reason) => (
                              <span
                                key={reason}
                                className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200"
                              >
                                {reasonLabels[lang][reason] ?? reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
