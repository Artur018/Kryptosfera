"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getLatestReport,
  getSignals,
  type LatestReport,
  type ReportSymbolRow,
  type Signal,
} from "@/lib/api";

type Lang = "en" | "pl";

function resolveLang(sp: URLSearchParams | null): Lang {
  if (!sp) return "en";
  const v = sp.get("lang");
  return v === "pl" || v === "en" ? v : "en";
}

const uiText: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    updatedLabel: string;
    tableTitle: string;
    colSymbol: string;
    colPrice: string;
    col24h: string;
    col3d: string;
    col7d: string;
    colAtr3d: string;
    colAtr7d: string;
    signalsTitle: string;
    signalsBadge: string;
    signalsEmpty: string;
    signalReasonBigMove24h: string;
    errorFetch: string;
    langButtonLabel: (lang: Lang) => string;
  }
> = {
  en: {
    title: "Chainsignal – crypto volatility radar",
    subtitle:
      "Automated daily reports and signals from your curated watchlist. Powered by Chainlogic backend.",
    updatedLabel: "Last update",
    tableTitle: "Market snapshot",
    colSymbol: "Symbol",
    colPrice: "Price",
    col24h: "24h change",
    col3d: "3d change",
    col7d: "7d change",
    colAtr3d: "ATR 3d %",
    colAtr7d: "ATR 7d %",
    signalsTitle: "Signals (> 8% / 24h by default)",
    signalsBadge: "active",
    signalsEmpty: "No active signals for your filters.",
    signalReasonBigMove24h: "Strong 24h move",
    errorFetch: "Failed to fetch data from API.",
    langButtonLabel: (lang) => (lang === "en" ? "PL" : "EN"),
  },
  pl: {
    title: "Chainsignal – radar zmienności rynku krypto",
    subtitle:
      "Automatyczne dzienne raporty i sygnały z Twojej wyselekcjonowanej watchlisty. Backend napędza Chainlogic.",
    updatedLabel: "Ostatnia aktualizacja",
    tableTitle: "Migawka rynku",
    colSymbol: "Symbol",
    colPrice: "Cena",
    col24h: "Zmiana 24h",
    col3d: "Zmiana 3 dni",
    col7d: "Zmiana 7 dni",
    colAtr3d: "ATR 3 dni %",
    colAtr7d: "ATR 7 dni %",
    signalsTitle: "Sygnały (> 8% / 24h domyślnie)",
    signalsBadge: "aktywne",
    signalsEmpty: "Brak aktywnych sygnałów dla wybranych filtrów.",
    signalReasonBigMove24h: "Silny ruch 24h",
    errorFetch: "Nie udało się pobrać danych z API.",
    langButtonLabel: (lang) => (lang === "en" ? "PL" : "EN"),
  },
};

function formatGeneratedAt(raw: string | undefined, lang: Lang): string {
  if (!raw) return lang === "en" ? "Unknown" : "Nieznana";

  const [y, m, d, hh, mm] = raw.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return raw;

  const date = new Date(Date.UTC(y, m - 1, d, hh ?? 0, mm ?? 0));
  const locale = lang === "en" ? "en-GB" : "pl-PL";

  return date.toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  });
}

function formatPercent(v: number): string {
  return `${v.toFixed(2)}%`;
}

function percentClass(v: number): string {
  if (v > 0) return "text-emerald-400";
  if (v < 0) return "text-rose-400";
  return "text-slate-200";
}

export function ChainsignalDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const lang: Lang = useMemo(
    () => resolveLang(searchParams),
    [searchParams],
  );
  const t = uiText[lang];
  const otherLang: Lang = lang === "en" ? "pl" : "en";

  const [report, setReport] = useState<LatestReport | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Ładowanie danych z API (client-side)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setError(null);
        const [r, s] = await Promise.all([
          getLatestReport(),
          getSignals(),
        ]);
        if (cancelled) return;
        setReport(r);
        setSignals(s);
      } catch (e) {
        if (cancelled) return;
        setError(t.errorFetch);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [lang, t.errorFetch]);

  const handleToggleLang = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("lang", otherLang);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-50">
            {t.title}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right text-xs text-slate-400">
            <span className="uppercase tracking-wide text-[10px] text-slate-500">
              {t.updatedLabel}
            </span>
            <span className="font-mono text-[11px] text-slate-200">
              {formatGeneratedAt(report?.generated_at, lang)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleToggleLang}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200 hover:bg-slate-800"
          >
            {t.langButtonLabel(lang)}
          </button>
        </div>
      </header>

      {/* BŁĄD */}
      {error && (
        <div className="rounded-md border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}

      {/* TABELA RAPORTU */}
      {report && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-slate-200">
              {t.tableTitle}
            </h2>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
              {report.symbols.length} pairs
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-1 text-xs">
              <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-1 text-left">{t.colSymbol}</th>
                  <th className="px-2 py-1 text-right">{t.colPrice}</th>
                  <th className="px-2 py-1 text-right">{t.col24h}</th>
                  <th className="px-2 py-1 text-right">{t.col3d}</th>
                  <th className="px-2 py-1 text-right">{t.col7d}</th>
                  <th className="px-2 py-1 text-right">{t.colAtr3d}</th>
                  <th className="px-2 py-1 text-right">{t.colAtr7d}</th>
                </tr>
              </thead>
              <tbody>
                {report.symbols.map((row: ReportSymbolRow) => (
                  <tr
                    key={row.symbol}
                    className="rounded-md bg-slate-900/60 align-middle"
                  >
                    <td className="px-2 py-1.5 font-mono text-[11px] text-slate-100">
                      {row.symbol}
                    </td>
                    <td className="px-2 py-1.5 text-right text-slate-100">
                      {row.close.toFixed(4)}
                    </td>
                    <td
                      className={`px-2 py-1.5 text-right ${percentClass(
                        row.change_24h,
                      )}`}
                    >
                      {formatPercent(row.change_24h)}
                    </td>
                    <td
                      className={`px-2 py-1.5 text-right ${percentClass(
                        row.change_3d,
                      )}`}
                    >
                      {formatPercent(row.change_3d)}
                    </td>
                    <td
                      className={`px-2 py-1.5 text-right ${percentClass(
                        row.change_7d,
                      )}`}
                    >
                      {formatPercent(row.change_7d)}
                    </td>
                    <td className="px-2 py-1.5 text-right text-slate-200">
                      {formatPercent(row.atr_3d)}
                    </td>
                    <td className="px-2 py-1.5 text-right text-slate-200">
                      {formatPercent(row.atr_7d)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SYGNAŁY */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-slate-200">
            {t.signalsTitle}
          </h2>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
            {signals.length} {t.signalsBadge}
          </span>
        </div>

        {signals.length === 0 ? (
          <p className="text-sm text-slate-400">{t.signalsEmpty}</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {signals.map((s: Signal) => (
              <article
                key={s.symbol}
                className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-100">
                    {s.symbol}
                  </span>
                  <span
                    className={`text-xs font-semibold ${percentClass(
                      s.change_24h,
                    )}`}
                  >
                    {formatPercent(s.change_24h)} / 24h
                  </span>
                </div>
                <div className="mb-1 flex gap-2 text-[11px] text-slate-300">
                  <span>{formatPercent(s.change_3d)} / 3d</span>
                  <span>{formatPercent(s.change_7d)} / 7d</span>
                </div>
                <div className="mb-2 flex gap-2 text-[11px] text-slate-400">
                  <span>ATR 3d: {formatPercent(s.atr_3d)}</span>
                  <span>ATR 7d: {formatPercent(s.atr_7d)}</span>
                </div>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {s.reasons.includes("big_move_24h") && (
                    <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-emerald-300">
                      {t.signalReasonBigMove24h}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
