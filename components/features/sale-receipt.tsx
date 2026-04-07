"use client";

import { Button } from "@/components/ui/button";
import type { SaleReceipt } from "@/lib/receipts/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

type SaleReceiptProps = {
  receipt: SaleReceipt;
};

export function SaleReceipt({ receipt }: SaleReceiptProps) {
  return (
    <section className="grid gap-4 rounded-[2rem] border border-zinc-200 bg-white p-5 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.45)]">
      <div className="receipt-print-hide flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-zinc-950">Recibo da ultima venda</h3>
          <p className="text-sm text-zinc-600">
            Visualize, revise e imprima o comprovante da transacao.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl border-zinc-200"
          onClick={() => window.print()}
        >
          Imprimir recibo
        </Button>
      </div>

      <article className="receipt-thermal-container mx-auto w-full max-w-[360px] rounded-[1.5rem] border border-zinc-200 bg-white p-5 text-zinc-950">
        <div className="border-b border-dashed border-zinc-300 pb-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
            Logo
          </div>
          <h4 className="mt-3 text-lg font-semibold uppercase tracking-[0.16em]">
            Floratta
          </h4>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
            Recibo de venda
          </p>
        </div>

        <div className="grid gap-1 border-b border-dashed border-zinc-300 py-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Pedido</span>
            <span className="font-medium">{receipt.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Data</span>
            <span className="text-right font-medium">
              {new Date(receipt.createdAt).toLocaleString("pt-BR")}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-500">Cliente</span>
            <span className="text-right font-medium">
              {receipt.customerName ?? "Consumidor final"}
            </span>
          </div>
        </div>

        <div className="grid gap-3 border-b border-dashed border-zinc-300 py-4">
          {receipt.items.map((item) => (
            <div key={item.id} className="grid gap-1 text-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{item.productName ?? "Produto"}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                    {item.productSku ?? item.productId ?? "Sem SKU"}
                  </p>
                </div>
                <p className="font-semibold">{formatCurrency(item.lineTotal)}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {item.quantity} x {formatCurrency(item.priceAtTime)}
                </span>
                <span>{item.quantity} unidade(s)</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-2 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Subtotal</span>
            <span className="font-medium">{formatCurrency(receipt.subtotalAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">Desconto</span>
            <span className="font-medium">{formatCurrency(receipt.discountAmount)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-dashed border-zinc-300 pt-3 text-base">
            <span className="font-semibold uppercase tracking-[0.14em]">Total</span>
            <span className="font-semibold">{formatCurrency(receipt.totalAmount)}</span>
          </div>
        </div>
      </article>
    </section>
  );
}
