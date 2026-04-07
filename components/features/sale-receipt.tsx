"use client";

import { Button } from "@/components/ui/button";
import type { SaleReceipt } from "@/lib/receipts/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

type SaleReceiptProps = {
  receipt: SaleReceipt;
};

export function SaleReceipt({ receipt }: SaleReceiptProps) {
  function handlePrintReceipt() {
    const printWindow = window.open("", "_blank", "width=420,height=840");

    if (!printWindow) {
      window.print();
      return;
    }

    const itemsMarkup = receipt.items
      .map(
        (item) => `
          <div class="item">
            <div class="item-row">
              <div>
                <p class="item-name">${escapeHtml(item.productName ?? "Produto")}</p>
                <p class="item-sku">${escapeHtml(item.productSku ?? item.productId ?? "Sem ID")}</p>
              </div>
              <p class="item-total">${escapeHtml(formatCurrency(item.lineTotal))}</p>
            </div>
            <div class="item-meta">
              <span>${escapeHtml(`${item.quantity} x ${formatCurrency(item.priceAtTime)}`)}</span>
              <span>${escapeHtml(`${item.quantity} unidade(s)`)}</span>
            </div>
          </div>
        `,
      )
      .join("");

    const printDocument = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Recibo ${escapeHtml(receipt.id.slice(0, 8).toUpperCase())}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #111827;
              font-family: "Aptos", "Segoe UI", sans-serif;
            }

            body {
              width: 80mm;
            }

            .receipt {
              width: 80mm;
              padding: 12px;
            }

            .header,
            .details,
            .items {
              border-bottom: 1px dashed #d4d4d8;
            }

            .header {
              padding-bottom: 12px;
              text-align: center;
            }

            .logo {
              width: 64px;
              height: 64px;
              margin: 0 auto;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px dashed #d4d4d8;
              border-radius: 16px;
              background: #fafafa;
              color: #71717a;
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 0.2em;
              text-transform: uppercase;
            }

            .store-name {
              margin: 12px 0 4px;
              font-size: 18px;
              font-weight: 700;
              letter-spacing: 0.12em;
              text-transform: uppercase;
            }

            .subtitle {
              margin: 0;
              font-size: 11px;
              letter-spacing: 0.2em;
              text-transform: uppercase;
              color: #71717a;
            }

            .details,
            .items,
            .summary {
              padding: 12px 0;
            }

            .detail-row,
            .summary-row,
            .item-row,
            .item-meta {
              display: flex;
              justify-content: space-between;
              gap: 12px;
            }

            .detail-row,
            .summary-row {
              font-size: 13px;
              margin-bottom: 4px;
            }

            .detail-row:last-child,
            .summary-row:last-child {
              margin-bottom: 0;
            }

            .detail-label,
            .summary-label,
            .item-sku,
            .item-meta {
              color: #71717a;
            }

            .detail-value,
            .summary-value {
              text-align: right;
              font-weight: 600;
            }

            .item {
              margin-bottom: 12px;
            }

            .item:last-child {
              margin-bottom: 0;
            }

            .item-name,
            .item-total {
              margin: 0;
              font-size: 13px;
              font-weight: 600;
            }

            .item-sku {
              margin: 4px 0 0;
              font-size: 10px;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }

            .item-meta {
              margin-top: 4px;
              font-size: 10px;
            }

            .summary-total {
              margin-top: 8px;
              padding-top: 10px;
              border-top: 1px dashed #d4d4d8;
              font-size: 15px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: #111827;
            }
          </style>
        </head>
        <body>
          <main class="receipt">
            <header class="header">
              <div class="logo">Logo</div>
              <h1 class="store-name">Floratta</h1>
              <p class="subtitle">Recibo de venda</p>
            </header>

            <section class="details">
              <div class="detail-row">
                <span class="detail-label">Pedido</span>
                <span class="detail-value">${escapeHtml(receipt.id.slice(0, 8).toUpperCase())}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Data</span>
                <span class="detail-value">${escapeHtml(
                  new Date(receipt.createdAt).toLocaleString("pt-BR"),
                )}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Cliente</span>
                <span class="detail-value">${escapeHtml(
                  receipt.customerName ?? "Consumidor final",
                )}</span>
              </div>
            </section>

            <section class="items">
              ${itemsMarkup}
            </section>

            <section class="summary">
              <div class="summary-row">
                <span class="summary-label">Subtotal</span>
                <span class="summary-value">${escapeHtml(
                  formatCurrency(receipt.subtotalAmount),
                )}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Desconto</span>
                <span class="summary-value">${escapeHtml(
                  formatCurrency(receipt.discountAmount),
                )}</span>
              </div>
              <div class="summary-row summary-total">
                <span>Total</span>
                <span>${escapeHtml(formatCurrency(receipt.totalAmount))}</span>
              </div>
            </section>
          </main>
          <script>
            window.addEventListener("load", () => {
              window.print();
              window.setTimeout(() => window.close(), 200);
            });
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printDocument);
    printWindow.document.close();
  }

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
          onClick={handlePrintReceipt}
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
                    {item.productSku ?? item.productId ?? "Sem ID"}
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
