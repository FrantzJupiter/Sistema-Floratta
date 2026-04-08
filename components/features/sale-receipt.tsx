"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import type { SaleReceipt as SaleReceiptData } from "@/lib/receipts/types";

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
  description?: string;
  receipt: SaleReceiptData;
  title?: string;
};

export function SaleReceipt({
  description = "Visualize, revise e imprima o comprovante da transação.",
  receipt,
  title = "Recibo da última venda",
}: SaleReceiptProps) {
  const customerName = receipt.customerName?.trim() ?? "";
  const hasCustomerName = customerName.length > 0;

  function handlePrintReceipt() {
    const printWindow = window.open("", "_blank", "width=420,height=840");
    const logoSrc = `${window.location.origin}/logo.svg`;

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

    const customerMarkup = hasCustomerName
      ? `<span class="detail-value">${escapeHtml(customerName)}</span>`
      : `<span class="detail-line-fill" aria-hidden="true"></span>`;

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
              width: 96px;
              height: 50px;
              margin: 0 auto;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .logo img {
              display: block;
              width: 100%;
              height: 100%;
              object-fit: contain;
            }

            .subtitle {
              margin: 10px 0 0;
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

            .signature {
              padding-top: 18px;
              font-size: 12px;
              color: #3f3f46;
            }

            .signature-label {
              display: block;
            }

            .signature-line {
              width: 100%;
              margin-top: 24px;
              border-top: 1px solid #52525b;
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

            .detail-line-fill {
              flex: 1;
              min-width: 120px;
              margin-left: 8px;
              margin-top: 10px;
              border-bottom: 1px solid #52525b;
              align-self: flex-end;
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
              <div class="logo">
                <img src="${escapeHtml(logoSrc)}" alt="Floratta" />
              </div>
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
                ${customerMarkup}
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

            <section class="signature">
              <span class="signature-label">Assinatura do cliente:</span>
              <div class="signature-line"></div>
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
    <section className="grid gap-4 rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/90 to-white/50 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-xl">
      <div className="receipt-print-hide flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-zinc-950">{title}</h3>
          {description ? <p className="text-sm text-zinc-600">{description}</p> : null}
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl border border-white/70 bg-gradient-to-b from-white/80 to-white/30 shadow-[0_4px_12px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md hover:from-white/90 hover:to-white/50 active:scale-[0.98] active:shadow-inner transition-all text-zinc-800"
          onClick={handlePrintReceipt}
        >
          Imprimir recibo
        </Button>
      </div>

      <article className="receipt-thermal-container mx-auto w-full max-w-[360px] rounded-[1.5rem] border border-zinc-200/60 bg-white p-5 text-zinc-950 shadow-[0_2px_14px_rgba(0,0,0,0.04),inset_0_0_20px_rgba(0,0,0,0.02)]">
        <div className="border-b border-dashed border-zinc-300 pb-4 text-center">
          <div className="mx-auto flex h-[50px] w-24 items-center justify-center">
            <Image
              src="/logo.svg"
              alt="Floratta"
              width={214}
              height={113}
              unoptimized
              className="h-full w-full object-contain"
            />
          </div>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
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
          <div className="flex items-end gap-4">
            <span className="shrink-0 text-zinc-500">Cliente</span>
            {hasCustomerName ? (
              <span className="ml-auto text-right font-medium">{customerName}</span>
            ) : (
              <span
                aria-hidden="true"
                className="mt-2 min-w-0 flex-1 border-b border-zinc-400"
              />
            )}
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

        <div className="pt-5 text-sm text-zinc-700">
          <span>Assinatura do cliente:</span>
          <div className="mt-6 w-full border-t border-zinc-400" />
        </div>
      </article>
    </section>
  );
}
