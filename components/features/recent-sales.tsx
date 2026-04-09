"use client";

import { useState } from "react";

import Link from "next/link";

import { SaleSummaryCard } from "@/components/features/sale-summary-card";
import { SectionToggleButton } from "@/components/ui/section-toggle-button";
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
    <section className="rounded-[2rem] border border-white/45 bg-white/60 p-4 shadow-panel-down backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          {collapseByDefault ? (
            <>
              <button
                type="button"
                aria-expanded={isOpen}
                className="min-w-0 flex-1 cursor-pointer text-left"
                onClick={() => setIsOpen((current) => !current)}
              >
                <h2 className="text-2xl font-semibold text-zinc-950">Vendas recentes</h2>
              </button>
              <SectionToggleButton
                ariaLabel="Abrir vendas recentes"
                isOpen={isOpen}
                onClick={() => setIsOpen((current) => !current)}
              />
            </>
          ) : (
            <div>
              <h2 className="text-2xl font-semibold text-zinc-950">Vendas recentes</h2>
            </div>
          )}
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
