"use client";

import { useState } from "react";

import { SaleReceipt } from "@/components/features/sale-receipt";
import { Button } from "@/components/ui/button";
import type { SaleReceipt as SaleReceiptData } from "@/lib/receipts/types";
import type { RecentSale } from "@/services/transactions";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

type SaleSummaryCardProps = {
  compact?: boolean;
  sale: RecentSale;
};

export function SaleSummaryCard({
  compact = false,
  sale,
}: SaleSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const receipt: SaleReceiptData = {
    createdAt: sale.created_at,
    customerName: sale.customerName,
    discountAmount: Number(sale.discount ?? 0),
    id: sale.id,
    items: sale.items,
    subtotalAmount: sale.subtotalAmount,
    totalAmount: sale.totalAmount,
    totalItems: sale.totalItems,
  };
  const customerLabel = sale.customerName ?? "Sem cliente cadastrado";
  const showDetails = !compact || isExpanded;

  return (
    <article
      className={
        compact
          ? "rounded-[1.5rem] border border-white/55 bg-white/76 px-4 py-3 shadow-card-down"
          : "rounded-[1.75rem] border border-white/55 bg-white/74 p-5 shadow-card-down"
      }
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white">
              Pedido {sale.id.slice(0, 8).toUpperCase()}
            </span>
            {sale.discount ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700">
                Desconto {formatCurrency(Number(sale.discount))}
              </span>
            ) : null}
          </div>
          <p className="text-sm font-medium text-zinc-700">
            {new Date(sale.created_at).toLocaleString("pt-BR")}
          </p>
          <p className="truncate text-sm text-zinc-600">Cliente: {customerLabel}</p>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            {sale.totalItems} unidade(s) em {sale.items.length} item(ns)
          </p>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          <div className="rounded-2xl border border-white/60 bg-emerald-50/75 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total pago</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">
              {formatCurrency(sale.totalAmount)}
            </p>
          </div>

          {compact ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-zinc-200 bg-white/80"
                onClick={() => setIsExpanded((current) => !current)}
              >
                {isExpanded ? "Mostrar menos" : "Mostrar tudo"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-zinc-200 bg-white/80"
                onClick={() => setIsReceiptOpen((current) => !current)}
              >
                {isReceiptOpen ? "Ocultar recibo" : "Mostrar recibo"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {showDetails ? (
        <div className="mt-5 grid gap-5 border-t border-dashed border-zinc-300 pt-5">
          <div className="grid gap-2">
            {sale.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    {item.productName ?? "Produto não encontrado"}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {item.productSku ?? item.productId ?? "Sem ID"} | {item.quantity} x{" "}
                    {formatCurrency(item.priceAtTime)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-zinc-900">
                  {formatCurrency(item.lineTotal)}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/60 bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Subtotal original
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-950">
                {formatCurrency(sale.subtotalAmount)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Desconto aplicado
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-950">
                {formatCurrency(Number(sale.discount ?? 0))}
              </p>
            </div>
          </div>

          {!compact ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-zinc-200 bg-white/80"
                onClick={() => setIsReceiptOpen((current) => !current)}
              >
                {isReceiptOpen ? "Ocultar recibo" : "Mostrar recibo"}
              </Button>
            </div>
          ) : null}

          {!compact && isReceiptOpen ? (
            <div>
              <SaleReceipt
                receipt={receipt}
                title="Recibo desta venda"
                description="Visualize novamente e imprima o comprovante desta venda."
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {compact && isReceiptOpen ? (
        <div className="mt-5 border-t border-dashed border-zinc-300 pt-5">
          <SaleReceipt
            receipt={receipt}
            title="Recibo desta venda"
            description="Visualize novamente e imprima o comprovante desta venda."
          />
        </div>
      ) : null}
    </article>
  );
}
