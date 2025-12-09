// src/app/page.tsx
import { Suspense } from "react";
import { ChainsignalDashboard } from "./ChainsignalDashboard";

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <Suspense
          fallback={
            <div className="text-sm text-slate-400">
              Loading Chainsignal dashboard...
            </div>
          }
        >
          <ChainsignalDashboard />
        </Suspense>
      </div>
    </main>
  );
}
