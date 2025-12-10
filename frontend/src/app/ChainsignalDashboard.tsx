"use client";

import { useState } from "react";
import type { LatestReport, Signal } from "@/lib/api";

type Lang = "en" | "pl";

interface Props {
  initialReport: LatestReport | null;
  initialSignals: Signal[];
  initialError: string | null;
}

const translations: Record<
  Lang,
  {
    appTitle: string;
    subtitle: string;
    lastUpdate: string;
    tableTitle: string;
    colSymbol: string;
    colPrice: string;
    col24h: string;
    col3d: string;
    col7d: string;
    colAtr3d: string;
    colAtr7d: string;
    signalsTitle: string;
    signalsEmpty: string;
    reasonsLabel: string;
    changeLabel: string;
    errorTitle: string;
    errorBody: string;
  }
> = {
  en: {
    appTitle: "Chainsignal",
    subtitle: "Volatility & momentum overview for your core watchlist.",
    lastUpdate: "Last update",
    tableTitle: "Market overview",
    colSymbol: "Symbol",
    colPrice: "Price",
    col24h: "24h change",
    col3d: "3d change",
    col7d: "7d change",
    colAtr3d: "ATR 3d %",
    colAtr7d: "ATR 7d %",
    signalsTitle: "Signals (24h move > 8% by default)",
    signalsEmpty: "No active signals that match current filters.",
    reasonsLabel: "Reasons",
    changeLabel: "Change / volatility",
    errorTitle: "Failed to fetch data from API.",
    errorBody:
      "Backend is currently unavailable or the request failed. Try again in a moment.",
  },
  pl: {
    appTitle: "Chainsignal",
    subtitle:
      "Przegląd zmienności i momentum dla twojej kluczowej listy obserwowanych.",
    lastUpdate: "Ostatnia aktualizacja",
    tableTitle: "Przegląd rynku",
    colSymbol: "Symbol",
    colPrice: "Cena",
    col24h: "Zmiana 24h",
    col3d: "Zmiana 3 dni",
    col7d: "Zmiana 7 dni",
    colAtr3d: "ATR 3 dni %",
    colAtr7d: "ATR 7 dni %",
    signalsTitle: "Sygnały (domyślnie ruch 24h > 8%)",
    signalsEmpty: "Brak aktywnych sygnałów przy aktualnych filtrach.",
    reasonsLabel: "Powody",
    changeLabel: "Zmiana / zmienność",
    errorTitle: "Błąd pobierania danych z API.",
    errorBody:
      "Backend jest chwilowo niedostępny albo zapytanie się wywaliło. Spróbuj ponownie za chwilę.",
  },
};

function formatGeneratedAt(raw: string | undefined, lang: Lang): string {
  if (!raw) return "-";

  // backend daje np. "2025-12-09-16-00-06"
  const normalized = raw.replace(/-/g, ":");
  const [y, m, d, hh, mm, ss] = normalized.split(":").map(Number);
  const date = new Date(y, m - 1, d, hh, mm, ss || 0);

  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "pl-PL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatPrice(value: number): string {
  if (value >= 1000) return value.toFixed(2);
  if (value >= 1) return value.toFixed(2);
  if (value >= 0.01) return value.toFixed(4);
  return value.toPrecision(4);
}

function mapReason(reason: string, lang: Lang): string {
  if (reason === "big_move_24h") {
    return lang === "en" ? "24h move above threshold" : "ruch 24h powyżej progu";
  }
  // Jak coś nowego wymyślimy w backendzie, to tutaj się doda
  return reason;
}

export default function ChainsignalDashboard({
  initialReport,
  initialSignals,
  initialError,
}: Props) {
  const [lang, setLang] = useState<Lang>("en");
  const t = translations[lang];

  const generatedAt = formatGeneratedAt(initialReport?.generated_at, lang);
  const rows = initialReport?.symbols ?? [];
  const signals = initialSignals ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        {/* Top bar: logo + lang switch */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
              {t.appTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-400">{t.subtitle}</p>
            <p className="mt-1 text-xs text-slate-500">
              {t.lastUpdate}:{" "}
              <span className="font-mono text-slate-200">{generatedAt}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full bg-slate-900/70 p-1 text-xs">
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`rounded-full px-3 py-1 transition ${
                lang === "en"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-300 hover:text-slate-50"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("pl")}
              className={`rounded-full px-3 py-1 transition ${
                lang === "pl"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-300 hover:text-slate-50"
              }`}
            >
              PL
            </button>
          </div>
        </header>

        {/* Error box if API padło */}
        {initialError && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            <div className="font-semibold">{t.errorTitle}</div>
            <div className="mt-1 text-red-200">{t.errorBody}</div>
          </div>
        )}

        {/* Main grid */}
        <main className="grid gap-6 md:grid-cols-[2fr,1.2fr]">
          {/* Market overview table */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-lg shadow-slate-950/40 backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-slate-200">
                {t.tableTitle}
              </h2>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                {rows.length} symbols
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-1 text-left text-xs sm:text-sm">
                <thead className="text-[10px] uppercase tracking-wide text-slate-400 sm:text-xs">
                  <tr>
                    <th className="px-2 py-1">{t.colSymbol}</th>
                    <th className="px-2 py-1 text-right">{t.colPrice}</th>
                    <th className="px-2 py-1 text-right">{t.col24h}</th>
                    <th className="px-2 py-1 text-right">{t.col3d}</th>
                    <th className="px-2 py-1 text-right">{t.col7d}</th>
                    <th className="px-2 py-1 text-right">{t.colAtr3d}</th>
                    <th className="px-2 py-1 text-right">{t.colAtr7d}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const isUp = row.change_24h > 0;
                    const isDown = row.change_24h < 0;

                    return (
                      <tr
                        key={row.symbol}
                        className="rounded-lg bg-slate-900/60 align-middle"
                      >
                        <td className="px-2 py-2 text-[11px] font-semibold uppercase text-slate-100 sm:text-xs">
                          {row.symbol}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-[11px] text-slate-100 sm:text-xs">
                          {formatPrice(row.close)}
                        </td>
                        <td
                          className={`px-2 py-2 text-right font-mono text-[11px] sm:text-xs ${
                            isUp
                              ? "text-emerald-400"
                              : isDown
                              ? "text-red-400"
                              : "text-slate-200"
                          }`}
                        >
                          {formatPercent(row.change_24h)}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-[11px] text-slate-200 sm:text-xs">
                          {formatPercent(row.change_3d)}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-[11px] text-slate-200 sm:text-xs">
                          {formatPercent(row.change_7d)}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-[11px] text-slate-300 sm:text-xs">
                          {formatPercent(row.atr_3d)}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-[11px] text-slate-300 sm:text-xs">
                          {formatPercent(row.atr_7d)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Signals */}
          <section className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-lg shadow-slate-950/40 backdrop-blur">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-slate-200">
                {t.signalsTitle}
              </h2>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                {signals.length} active
              </span>
            </div>

            {signals.length === 0 ? (
              <p className="text-xs text-slate-400">{t.signalsEmpty}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {signals.map((s) => {
                  const isUp = s.change_24h > 0;
                  const isDown = s.change_24h < 0;

                  return (
                    <div
                      key={s.symbol + s.change_24h}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-50">
                            {s.symbol}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {t.changeLabel}: {formatPercent(s.change_24h)}
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                            isUp
                              ? "bg-emerald-500/15 text-emerald-300"
                              : isDown
                              ? "bg-red-500/15 text-red-300"
                              : "bg-slate-700/40 text-slate-200"
                          }`}
                        >
                          24h {formatPercent(s.change_24h)}
                        </span>
                      </div>

                      <div className="mb-1 flex gap-2 text-[10px] text-slate-300">
                        <span className="font-semibold text-slate-400">
                          {t.reasonsLabel}:
                        </span>
                        <span>
                          {s.reasons.map((r) => mapReason(r, lang)).join(", ")}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                        <span>
                          3d:{" "}
                          <span className="font-mono text-slate-200">
                            {formatPercent(s.change_3d)}
                          </span>
                        </span>
                        <span>
                          7d:{" "}
                          <span className="font-mono text-slate-200">
                            {formatPercent(s.change_7d)}
                          </span>
                        </span>
                        <span>
                          ATR 3d:{" "}
                          <span className="font-mono text-slate-200">
                            {formatPercent(s.atr_3d)}
                          </span>
                        </span>
                        <span>
                          ATR 7d:{" "}
                          <span className="font-mono text-slate-200">
                            {formatPercent(s.atr_7d)}
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
