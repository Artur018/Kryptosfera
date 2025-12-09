
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getLatestReport,
  getSignals,
  type ReportSymbolRow,
  type Signal,
} from "@/lib/api";

type Lang = "pl" | "en";

type LatestReportResponse = {
  generated_at: string;
  symbols: ReportSymbolRow[];
};

const translations: Record<
  Lang,
  {
    title: string;
    subtitle: string;
    languageLabel: string;

    lastSnapshot: string;
    generatedAt: string;

    table: {
      symbol: string;
      price: string;
      change24h: string;
      change3d: string;
      change7d: string;
      atr3d: string;
      atr7d: string;
    };

    signalsTitle: string;
    signalsSubtitle: string;
    signalsNone: string;
    loading: string;
    error: string;
  }
> = {
  pl: {
    title: "Chainsignal",
    subtitle: "Dzienny skan rynku kryptowalut.",
    languageLabel: "Język",

    lastSnapshot: "Ostatni snapshot rynku",
    generatedAt: "Raport wygenerowany",

    table: {
      symbol: "Symbol",
      price: "Cena",
      change24h: "24h",
      change3d: "3 dni",
      change7d: "7 dni",
      atr3d: "ATR 3 dni",
      atr7d: "ATR 7 dni",
    },

    signalsTitle: "Sygnały",
    signalsSubtitle: "⚡ Sygnały (> 8% / 24h domyślnie)",
    signalsNone: "Brak aktywnych sygnałów dla ustawionych progów.",
    loading: "Ładowanie danych z backendu...",
    error: "Nie udało się pobrać danych z API.",
  },

  en: {
    title: "Chainsignal",
    subtitle: "Daily crypto market scan.",
    languageLabel: "Language",

    lastSnapshot: "Last market snapshot",
    generatedAt: "Report generated",

    table: {
      symbol: "Symbol",
      price: "Price",
      change24h: "24h",
      change3d: "3 days",
      change7d: "7 days",
      atr3d: "ATR 3 days",
      atr7d: "ATR 7 days",
    },

    signalsTitle: "Signals",
    signalsSubtitle: "⚡ Signals (> 8% / 24h by default)",
    signalsNone: "No active signals for current thresholds.",
    loading: "Loading data from backend...",
    error: "Failed to fetch data from API.",
  },
};

function formatGeneratedAt(raw: string, lang: Lang): string {
  const parts = raw.split("-");
  if (parts.length !== 6) return raw;

  const [year, month, day, hour, minute, second] = parts.map((v) =>
    Number(v),
  );
  if ([year, month, day, hour, minute, second].some((n) => Number.isNaN(n))) {
    return raw;
  }

  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const locale = lang === "pl" ? "pl-PL" : "en-US";

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatPrice(value: number, lang: Lang): string {
  const locale = lang === "pl" ? "pl-PL" : "en-US";
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  };
  return value.toLocaleString(locale, options);
}

function formatChange(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

type ChangeClass = "up" | "down" | "flat";

function classifyChange24h(change: number): ChangeClass {
  if (change > 0.5) return "up";
  if (change < -0.5) return "down";
  return "flat";
}

const changeClassStyles: Record<ChangeClass, string> = {
  up: "text-emerald-400",
  down: "text-red-400",
  flat: "text-slate-200",
};

const changeArrow: Record<ChangeClass, string> = {
  up: "↑",
  down: "↓",
  flat: "→",
};

/**
 * Wewnętrzny komponent faktycznie korzystający z useSearchParams.
 * Będzie owinięty w <Suspense>, żeby Next 16 się nie pluł.
 */
function HomePageInner() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang");
  const lang: Lang = langParam === "en" ? "en" : "pl";
  const t = translations[lang];

  const [report, setReport] = useState<LatestReportResponse | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [r, s] = await Promise.all([getLatestReport(), getSignals()]);

        if (cancelled) return;
        setReport(r);
        setSignals(s);
      } catch {
        if (cancelled) return;
        setError("api-error");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
        {/* HEADER */}
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t.title}
            </h1>
            <p className="mt-1 text-sm text-slate-300">{t.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="uppercase tracking-wide text-slate-400">
              {t.languageLabel}
            </span>

            <Link
              href="/?lang=en"
              className={`rounded-full px-2 py-1 text-[11px] font-mono ${
                lang === "en"
                  ? "bg-slate-50 text-slate-900"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              EN
            </Link>
            <Link
              href="/?lang=pl"
              className={`rounded-full px-2 py-1 text-[11px] font-mono ${
                lang === "pl"
                  ? "bg-slate-50 text-slate-900"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              PL
            </Link>
          </div>
        </header>

        {/* STANY ŁADOWANIA / BŁĘDU */}
        {loading && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
            {t.loading}
          </section>
        )}

        {!loading && error && (
          <section className="rounded-2xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
            {t.error}
          </section>
        )}

        {!loading && !error && report && (
          <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
            {/* SNAPSHOT */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-lg shadow-slate-950/40">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-medium text-slate-200">
                    {t.lastSnapshot}
                  </h2>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {t.generatedAt}:{" "}
                    <span className="font-mono text-slate-200">
                      {formatGeneratedAt(report.generated_at, lang)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-900/70 text-[11px] uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-3 py-2 font-medium">
                        {t.table.symbol}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {t.table.price}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {t.table.change24h}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {t.table.change3d}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {t.table.change7d}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {t.table.atr3d}
                      </th>
                      <th className="px-3 py-2 font-medium">
                        {t.table.atr7d}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {report.symbols.map((row: ReportSymbolRow) => {
                      const classification = classifyChange24h(
                        row.change_24h,
                      );
                      const arrow = changeArrow[classification];
                      const cls = changeClassStyles[classification];

                      return (
                        <tr
                          key={row.symbol}
                          className="hover:bg-slate-900/70"
                        >
                          <td className="px-3 py-2 text-[11px] font-semibold tracking-wide text-slate-100">
                            {row.symbol}
                          </td>
                          <td className="px-3 py-2 text-[11px] font-mono text-slate-200">
                            {formatPrice(row.close, lang)}
                          </td>
                          <td className="px-3 py-2 text-[11px] font-mono">
                            <span className={cls}>
                              {arrow} {formatChange(row.change_24h)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[11px] font-mono text-slate-200">
                            {formatChange(row.change_3d)}
                          </td>
                          <td className="px-3 py-2 text-[11px] font-mono text-slate-200">
                            {formatChange(row.change_7d)}
                          </td>
                          <td className="px-3 py-2 text-[11px] font-mono text-slate-300">
                            {row.atr_3d.toFixed(2)}%
                          </td>
                          <td className="px-3 py-2 text-[11px] font-mono text-slate-300">
                            {row.atr_7d.toFixed(2)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SYGNAŁY */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-lg shadow-slate-950/40">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-medium text-slate-200">
                    {t.signalsTitle}
                  </h2>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {t.signalsSubtitle}
                  </p>
                </div>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-200">
                  {signals.length}
                </span>
              </div>

              <div className="mt-2 flex-1 space-y-2">
                {signals.length === 0 ? (
                  <p className="text-[11px] text-slate-400">
                    {t.signalsNone}
                  </p>
                ) : (
                  signals.map((s: Signal) => (
                    <div
                      key={s.symbol + s.reasons.join(",")}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-wide text-slate-50">
                          {s.symbol}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400">
                          {formatChange(s.change_24h)}
                        </span>
                      </div>
                      <div className="mb-1 flex gap-2 text-[10px] text-slate-300">
                        <span>
                          3d:{" "}
                          <span className="font-mono">
                            {formatChange(s.change_3d)}
                          </span>
                        </span>
                        <span>
                          7d:{" "}
                          <span className="font-mono">
                            {formatChange(s.change_7d)}
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 text-[9px] text-slate-300">
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 font-mono">
                          ATR3d {s.atr_3d.toFixed(2)}%
                        </span>
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 font-mono">
                          ATR7d {s.atr_7d.toFixed(2)}%
                        </span>
                        {s.reasons.map((reason) => (
                          <span
                            key={reason}
                            className="rounded-full bg-emerald-900/40 px-2 py-0.5 font-mono text-emerald-300"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

/**
 * Zewnętrzny komponent strony – opakowuje inner w Suspense,
 * żeby Next 16 przestał marudzić przy buildzie.
 */
export default function HomePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 text-slate-50">
          <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-slate-300">
            Ładowanie...
          </div>
        </main>
      }
    >
      <HomePageInner />
    </Suspense>
  );
}
