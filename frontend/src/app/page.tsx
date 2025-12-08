// src/app/page.tsx

import {
  getLatestReport,
  getSignals,
  type ReportSymbolRow,
  type Signal,
} from "@/lib/api";

function formatGeneratedAt(raw: string): string {
  // backend daje "2025-12-08-20-29-54"
  const iso = raw.replace(
    /^(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})$/,
    "$1-$2-$3T$4:$5:$6"
  );
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }
  return date.toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" });
}

function classForChange(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-rose-400";
  return "text-slate-300";
}

export default async function HomePage() {
  const [report, signals] = await Promise.all([
    getLatestReport(),
    getSignals(),
  ]);

  const generatedAt = formatGeneratedAt(report.generated_at);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        {/* Topbar */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-50">
              Chainsignal dashboard
            </h1>
            <p className="text-xs text-slate-400">
              Dzienny raport rynku + sygnały z&nbsp;Kryptosfery
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-[11px] text-slate-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span>API: {process.env.NEXT_PUBLIC_API_BASE_URL ?? "default"}</span>
          </div>
        </header>

        {/* Info o ostatniej aktualizacji */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs text-slate-300">
          <span className="font-mono text-slate-400">Ostatnia aktualizacja:&nbsp;</span>
          <span>{generatedAt}</span>
        </section>

        {/* Główna siatka */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Raport dzienny */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-black/40">
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-medium text-slate-100">
                📊 Raport dzienny (Binance)
              </h2>
              <span className="text-[11px] text-slate-400">
                {report.symbols.length} par w&nbsp;monitoringu
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-xs">
                <thead>
                  <tr className="bg-slate-900/80">
                    <th className="sticky left-0 z-10 bg-slate-900/80 px-3 py-2 text-left font-medium text-slate-300">
                      Symbol
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-slate-300">
                      Close
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-slate-300">
                      24h %
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-slate-300">
                      3D %
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-slate-300">
                      7D %
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-slate-300">
                      ATR 3D
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-slate-300">
                      ATR 7D
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {report.symbols.map((row: ReportSymbolRow) => (
                    <tr
                      key={row.symbol}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="sticky left-0 z-0 bg-slate-900/60 px-3 py-2 text-sm font-medium text-slate-100">
                        {row.symbol}
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-slate-200">
                        {row.close.toLocaleString("en-US", {
                          maximumFractionDigits: row.close < 1 ? 6 : 2,
                        })}
                      </td>
                      <td
                        className={
                          "px-3 py-2 text-right text-sm " +
                          classForChange(row.change_24h)
                        }
                      >
                        {row.change_24h.toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-slate-300">
                        {row.change_3d.toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-slate-300">
                        {row.change_7d.toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-right text-[11px] text-slate-400">
                        {row.atr_3d.toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 text-right text-[11px] text-slate-400">
                        {row.atr_7d.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sygnały */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-black/40">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-slate-100">
                ⚡ Sygnały (24h domyślnie {" > "} 8%)
              </h2>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                {signals.length} aktywne
              </span>
            </div>

            {signals.length === 0 && (
              <p className="text-xs text-slate-400">
                Brak sygnałów spełniających kryteria. Rynek udaje, że jest
                spokojny.
              </p>
            )}

            <ul className="space-y-2">
              {signals.map((s: Signal) => (
                <li
                  key={s.symbol}
                  className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-100">
                      {s.symbol}
                    </span>
                    <span
                      className={
                        "text-xs font-mono " + classForChange(s.change_24h)
                      }
                    >
                      {s.change_24h > 0 ? "+" : ""}
                      {s.change_24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="mb-1 flex items-center gap-3 text-[11px] text-slate-400">
                    <span>3D: {s.change_3d.toFixed(2)}%</span>
                    <span>7D: {s.change_7d.toFixed(2)}%</span>
                    <span className="text-slate-500">
                      ATR7D: {s.atr_7d.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {s.reasons.map((r) => (
                      <span
                        key={r}
                        className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
