import Link from "next/link";

import { ClearSalesHistoryButton } from "@/components/features/clear-sales-history-button";
import { SaleSummaryCard } from "@/components/features/sale-summary-card";
import type { RecentSale } from "@/services/transactions";

type RecentSalesProps = {
  sales: RecentSale[];
};

export function RecentSales({ sales }: RecentSalesProps) {
  return (
    <section className="rounded-[2rem] border border-white/45 bg-white/60 p-6 shadow-panel-down backdrop-blur-xl">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">Vendas recentes</h2>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
              {sales.length} venda(s)
            </span>
            <Link
              href="/historico"
              className="rounded-full border border-white/50 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-600 transition hover:text-zinc-950"
            >
              Ver por dia
            </Link>
          </div>
          <ClearSalesHistoryButton salesCount={sales.length} />
        </div>
      </div>

      {sales.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-emerald-50/65 px-5 py-10 text-center">
          <p className="text-base font-medium text-zinc-800">
            Nenhuma venda foi registrada ainda.
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Assim que o checkout for concluído, o histórico aparece aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {sales.map((sale) => (
            <SaleSummaryCard key={sale.id} sale={sale} />
          ))}
        </div>
      )}
    </section>
  );
}
