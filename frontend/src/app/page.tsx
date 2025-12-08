// src/app/page.tsx
import {
  getLatestReport,
  getSignals,
  type ReportRow,
  type Signal,
} from "@/lib/api";

export default async function HomePage() {
  const [report, signals] = await Promise.all([
    getLatestReport(),
    getSignals(),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Chainsignal – status rynku krypto
          </h1>
          <p className="text-sm text-slate-400">
            Ostatni raport:{" "}
            <span className="font-mono">
              {report.generated_at ?? "brak danych"}
            </span>
          </p>
        </header>

        {/* Tabela raportu */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Podsumowanie rynku</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="px-4 py-2 text-left">Symbol</th>
                  <th className="px-4 py-2 text-right">Cena</th>
                  <th className="px-4 py-2 text-right">24h %</th>
                  <th className="px-4 py-2 text-right">3D %</th>
                  <th className="px-4 py-2 text-right">7D %</th>
                  <th className="px-4 py-2 text-right">ATR 3D %</th>
                  <th className="px-4 py-2 text-right">ATR 7D %</th>
                </tr>
              </thead>
              <tbody>
                {report.symbols.map((row: ReportRow) => (
                  <tr
                    key={row.symbol}
                    className="border-t border-slate-800/70 hover:bg-slate-900/60 transition-colors"
                  >
                    <td className="px-4 py-2 font-medium">{row.symbol}</td>
                    <td className="px-4 py-2 text-right font-mono">
                      {row.close.toFixed(2)}
                    </td>
                    <td
                      className={
                        "px-4 py-2 text-right font-mono " +
                        (row.change_24h > 0
                          ? "text-emerald-400"
                          : row.change_24h < 0
                          ? "text-red-400"
                          : "text-slate-200")
                      }
                    >
                      {row.change_24h.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {row.change_3d.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {row.change_7d.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {row.atr_3d.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {row.atr_7d.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sygnały */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Sygnały z rynku
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {signals.count}
            </span>
          </h2>

          {signals.count === 0 ? (
            <p className="text-sm text-slate-400">
              Brak aktywnych sygnałów według aktualnych progów.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {signals.signals.map((s: Signal) => (
                <div
                  key={s.symbol}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{s.symbol}</h3>
                    <div className="flex gap-1">
                      {s.reasons.map((r: string) => (
                        <span
                          key={r}
                          className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-300">
                    <div>
                      <dt className="text-slate-500">24h</dt>
                      <dd
                        className={
                          s.change_24h > 0
                            ? "text-emerald-400"
                            : s.change_24h < 0
                            ? "text-red-400"
                            : ""
                        }
                      >
                        {s.change_24h.toFixed(2)}%
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">7D</dt>
                      <dd>{s.change_7d.toFixed(2)}%</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">ATR 3D</dt>
                      <dd>{s.atr_3d.toFixed(2)}%</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">ATR 7D</dt>
                      <dd>{s.atr_7d.toFixed(2)}%</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
