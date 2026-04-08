"use client";

import { useMemo, useRef, useState } from "react";

import { Printer, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";
import {
  buildProductQrValue,
  getProductQrPrintTitle,
} from "@/lib/products/qr";

type ProductQrLabelDialogProps = {
  product: {
    id: string;
    name: string;
    sku: string;
  };
};

export function ProductQrLabelDialog({
  product,
}: ProductQrLabelDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const qrRef = useRef<SVGSVGElement | null>(null);
  const qrValue = useMemo(() => buildProductQrValue(product), [product]);

  function handlePrint() {
    const qrMarkup = qrRef.current?.outerHTML;

    if (!qrMarkup) {
      return;
    }

    const printWindow = window.open("", "_blank", "width=420,height=640");

    if (!printWindow) {
      return;
    }

    const printTitle = getProductQrPrintTitle(product);
    const escapedName = product.name
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
    const escapedSku = product.sku
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${printTitle}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 8mm;
            }

            * {
              box-sizing: border-box;
            }

            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #18181b;
              font-family: "Aptos", "Segoe UI", sans-serif;
            }

            body {
              display: flex;
              justify-content: center;
              padding: 12px;
            }

            .label {
              width: min(100%, 280px);
              border: 1px solid #e4e4e7;
              border-radius: 20px;
              padding: 20px 16px;
              text-align: center;
            }

            .brand {
              font-size: 10px;
              letter-spacing: 0.28em;
              text-transform: uppercase;
              color: #71717a;
            }

            .name {
              margin: 12px 0 0;
              font-size: 16px;
              font-weight: 700;
              line-height: 1.25;
            }

            .sku {
              margin: 8px 0 0;
              font-size: 11px;
              letter-spacing: 0.16em;
              text-transform: uppercase;
              color: #71717a;
            }

            .qr {
              display: flex;
              justify-content: center;
              margin: 18px 0;
            }

            .note {
              margin: 0;
              font-size: 11px;
              line-height: 1.45;
              color: #52525b;
            }

            svg {
              width: 184px;
              height: 184px;
            }
          </style>
        </head>
        <body>
          <main class="label">
            <p class="brand">Floratta</p>
            <p class="name">${escapedName}</p>
            <p class="sku">${escapedSku}</p>
            <div class="qr">${qrMarkup}</div>
            <p class="note">Escaneie este código para adicionar o produto ao carrinho.</p>
          </main>
          <script>
            window.addEventListener("load", () => {
              window.print();
              window.setTimeout(() => window.close(), 220);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 rounded-xl border-zinc-200 bg-white/80 px-2.5 text-xs"
        onClick={() => setIsOpen(true)}
      >
        <QrCode className="size-3.5" />
        QR
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/72 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-[rgba(28,18,22,0.94)] p-4 text-white shadow-2xl sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">QR do produto</h3>
                <p className="text-sm text-white/70">
                  Imprima ou escaneie para adicionar este item ao carrinho.
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-xl text-white hover:bg-white/10 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="mt-4 rounded-[1.75rem] border border-white/12 bg-white p-5 text-zinc-950 shadow-card-down">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">
                  Floratta
                </p>
                <h4 className="mt-3 text-lg font-semibold leading-tight">
                  {product.name}
                </h4>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                  {product.sku}
                </p>
              </div>

              <div className="mt-5 flex justify-center">
                <QRCodeSVG
                  ref={qrRef}
                  bgColor="#ffffff"
                  fgColor="#111827"
                  level="M"
                  marginSize={2}
                  size={196}
                  title={`QR do produto ${product.name}`}
                  value={qrValue}
                />
              </div>

              <p className="mt-4 text-center text-xs text-zinc-500">
                Ao escanear com o celular, o produto entra automaticamente no carrinho.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                className="rounded-2xl bg-emerald-700 text-white hover:bg-emerald-600"
                onClick={handlePrint}
              >
                <Printer className="size-4" />
                Imprimir etiqueta
              </Button>

              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-white/15 bg-white/10 text-white hover:bg-white/15"
                onClick={() => setIsOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
