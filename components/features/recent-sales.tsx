"use client";

import { useState } from "react";

import Link from "next/link";

import { SaleSummaryCard } from "@/components/features/sale-summary-card";
import type { RecentSale } from "@/services/transactions";

type RecentSalesProps = {
  collapseByDefault?: boolean;
  sales: RecentSale[];
};

export function RecentSales({
  collapseByDefault = false,
  sales,
}: RecentSalesProps) {
  const [isOpen, setIsOpen] = useState(!collapseByDefault);

  return (
    <section className="rounded-[2rem] border border-white/45 bg-white/60 p-6 shadow-panel-down backdrop-blur-xl">
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-950">Vendas recentes</h2>
          </div>

          {collapseByDefault ? (
            <button
              type="button"
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-rose-200/80 bg-gradient-to-b from-rose-50/80 to-rose-100/30 px-5 text-sm font-medium text-rose-900 shadow-[0_4px_12px_rgba(225,29,72,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] transition-all hover:from-rose-100/90 hover:to-rose-100/50 lg:w-auto lg:min-w-[164px]"
              onClick={() => setIsOpen((current) => !current)}
            >
              {isOpen ? "Fechar vendas" : "Abrir vendas"}
            </button>
          ) : null}
        </div>

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
      </div>

      {!isOpen ? null : sales.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-emerald-50/65 px-5 py-10 text-center">
          <p className="text-base font-medium text-zinc-800">
            Nenhuma venda foi registrada ainda.
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Assim que o checkout for concluído, o histórico aparece aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {sales.map((sale) => (
            <SaleSummaryCard key={sale.id} sale={sale} compact />
          ))}
        </div>
      )}
    </section>
  );
}
