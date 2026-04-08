"use client";
/* eslint-disable @next/next/no-img-element */

import { useDeferredValue, useState } from "react";

import { AddToCartButton } from "@/components/features/add-to-cart-button";
import { CartPanel } from "@/components/features/cart-panel";
import { QrCartScanner } from "@/components/features/qr-cart-scanner";
import {
  getDetailType,
  getProductDetailEntries,
  getRegisteredDetailTypes,
} from "@/lib/products/catalog";
import { useCartStore } from "@/lib/stores/cart-store";
import type { RegisteredCustomer } from "@/services/customers";
import type { CatalogProduct } from "@/services/products";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function ProductThumbnail({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  return (
    <div className="overflow-hidden rounded-[1rem] border border-white/60 bg-white/80 shadow-card-down">
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="h-12 w-12 object-cover sm:h-14 sm:w-14" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center bg-[linear-gradient(160deg,_rgba(255,240,245,0.88),_rgba(247,235,255,0.92))] px-2 text-center text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-500 sm:h-14 sm:w-14 sm:text-[10px]">
          Sem foto
        </div>
      )}
    </div>
  );
}

function getMetadataPreview(product: CatalogProduct) {
  return getProductDetailEntries(product.variantAttributes).slice(0, 3);
}

function getProductSearchText(product: CatalogProduct) {
  const metadataText = getMetadataPreview(product)
    .map(({ key, value }) => `${key} ${String(value)}`)
    .join(" ");
  const productTypeLabel = getDetailType(product.variantAttributes);

  return [product.name, product.sku, productTypeLabel, metadataText].join(" ").toLowerCase();
}

function normalizeCodeValue(value: string) {
  return value.trim().toLowerCase();
}

function extractQrCandidates(decodedText: string) {
  const candidates = new Set<string>();
  const trimmedValue = decodedText.trim();

  if (!trimmedValue) {
    return [];
  }

  candidates.add(trimmedValue);

  try {
    const parsedJson = JSON.parse(trimmedValue) as Record<string, unknown>;

    ["productId", "id", "sku", "code"].forEach((key) => {
      const nextValue = parsedJson[key];

      if (typeof nextValue === "string" && nextValue.trim()) {
        candidates.add(nextValue.trim());
      }
    });
  } catch {
    // Segue com o texto bruto quando não for JSON.
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    const queryCandidates = [
      parsedUrl.searchParams.get("productId"),
      parsedUrl.searchParams.get("id"),
      parsedUrl.searchParams.get("sku"),
      parsedUrl.searchParams.get("code"),
    ];

    queryCandidates.forEach((value) => {
      if (value?.trim()) {
        candidates.add(value.trim());
      }
    });

    const lastSegment = parsedUrl.pathname.split("/").filter(Boolean).at(-1);

    if (lastSegment?.trim()) {
      candidates.add(lastSegment.trim());
    }
  } catch {
    // Segue com o texto bruto quando não for URL.
  }

  return Array.from(candidates);
}

type SalesWorkspaceProps = {
  customers: RegisteredCustomer[];
  products: CatalogProduct[];
  title?: string;
};

export function SalesWorkspace({
  customers,
  products,
  title = "Adicionar produtos ao carrinho",
}: SalesWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [productType, setProductType] = useState("todos");
  const [availability, setAvailability] = useState<"todos" | "disponiveis" | "zerados">(
    "disponiveis",
  );
  const [qrFeedback, setQrFeedback] = useState<{
    status: "error" | "success";
    text: string;
  } | null>(null);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const typeOptions = getRegisteredDetailTypes(products);
  const addItem = useCartStore((state) => state.addItem);

  const filteredProducts = products.filter((product) => {
    const detectedType = getDetailType(product.variantAttributes);
    const quantity = product.inventory?.quantity ?? 0;
    const matchesQuery =
      !normalizedQuery || getProductSearchText(product).includes(normalizedQuery);
    const matchesType = productType === "todos" || detectedType === productType;
    const matchesAvailability =
      availability === "todos"
        ? true
        : availability === "disponiveis"
          ? quantity > 0
          : quantity === 0;

    return matchesQuery && matchesType && matchesAvailability;
  });

  function handleQrDetected(decodedText: string) {
    const candidates = extractQrCandidates(decodedText);
    const normalizedCandidates = candidates.map(normalizeCodeValue);
    const matchedProduct = products.find((product) => {
      const normalizedSku = normalizeCodeValue(product.sku);
      const normalizedId = normalizeCodeValue(product.id);

      return normalizedCandidates.some(
        (candidate) => candidate === normalizedSku || candidate === normalizedId,
      );
    });

    setProductType("todos");
    setAvailability("todos");

    if (!matchedProduct) {
      setQuery(candidates[0] ?? decodedText.trim());
      setQrFeedback({
        status: "error",
        text: "Código lido, mas nenhum produto correspondente foi encontrado.",
      });
      return;
    }

    setQuery(matchedProduct.sku);

    const quantity = matchedProduct.inventory?.quantity ?? 0;

    if (quantity <= 0) {
      setQrFeedback({
        status: "error",
        text: `${matchedProduct.name} foi encontrado, mas está sem estoque.`,
      });
      return;
    }

    const cartItems = useCartStore.getState().items;
    const quantityInCart =
      cartItems.find((item) => item.productId === matchedProduct.id)?.quantity ?? 0;

    if (quantityInCart >= quantity) {
      setQrFeedback({
        status: "error",
        text: `${matchedProduct.name} já atingiu o limite disponível no carrinho.`,
      });
      return;
    }

    addItem({
      availableQuantity: quantity,
      name: matchedProduct.name,
      productId: matchedProduct.id,
      productTypeLabel: getDetailType(matchedProduct.variantAttributes) ?? "Sem tipo",
      sku: matchedProduct.sku,
      unitPrice: matchedProduct.base_price,
    });

    setQrFeedback({
      status: "success",
      text: `${matchedProduct.name} foi adicionado ao carrinho via QR Code.`,
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <aside className="min-w-0 w-full">
        <CartPanel customers={customers} />
      </aside>

      <section className="flex min-w-0 flex-col gap-6 rounded-[2rem] border border-white/45 bg-white/60 p-4 sm:p-6 shadow-panel-down backdrop-blur-xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-zinc-950">{title}</h2>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 rounded-[1.75rem] border border-white/60 bg-white/80 p-4 shadow-card-down backdrop-blur-xl md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_180px_180px_180px]">
            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">Buscar produtos</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ex.: perfume, brinco, GIFT-2026..."
                className="h-11 rounded-2xl border border-white/45 bg-white/80 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
            </label>

            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">Tipo</span>
              <select
                value={productType}
                onChange={(event) => setProductType(event.target.value)}
                className="h-11 rounded-2xl border border-white/45 bg-white/80 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              >
                <option value="todos">Todos os tipos</option>
                {typeOptions.map((typeOption) => (
                  <option key={typeOption} value={typeOption}>
                    {typeOption}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">Exibição</span>
              <select
                value={availability}
                onChange={(event) =>
                  setAvailability(
                    event.target.value as "todos" | "disponiveis" | "zerados",
                  )
                }
                className="h-11 rounded-2xl border border-white/45 bg-white/80 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              >
                <option value="disponiveis">Somente com estoque</option>
                <option value="todos">Todos os produtos</option>
                <option value="zerados">Somente zerados</option>
              </select>
            </label>

            <QrCartScanner
              onDetected={handleQrDetected}
              onError={(message) =>
                setQrFeedback({
                  status: "error",
                  text: message,
                })
              }
            />
          </div>

          {qrFeedback ? (
            <div
              aria-live="polite"
              className={`rounded-2xl border px-4 py-3 text-sm shadow-card-down ${
                qrFeedback.status === "success"
                  ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
                  : "border-rose-200 bg-rose-50/80 text-rose-700"
              }`}
            >
              {qrFeedback.text}
            </div>
          ) : null}

          {filteredProducts.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-rose-200 bg-rose-50/65 px-5 py-10 text-center">
              <p className="text-base font-medium text-zinc-800">
                Nenhum produto foi encontrado para esta busca.
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Ajuste os filtros ou cadastre novos itens na área de produtos.
              </p>
            </div>
          ) : (
            <div className="max-h-[68vh] overflow-y-auto pr-1 sm:pr-2">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {filteredProducts.map((product) => {
                  const quantity = product.inventory?.quantity ?? 0;
                  const productTypeLabel = getDetailType(product.variantAttributes) ?? "Sem tipo";

                  return (
                    <article
                      key={product.id}
                      className="rounded-[1.5rem] border border-white/55 bg-white/78 p-3 sm:p-3.5 shadow-card-down"
                    >
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_156px] md:items-center">
                        <div className="flex min-w-0 items-center gap-3">
                          <ProductThumbnail imageUrl={product.image_url} name={product.name} />

                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-rose-700">
                                {productTypeLabel}
                              </span>

                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  quantity === 0
                                    ? "bg-rose-100 text-rose-700"
                                    : quantity <= 5
                                      ? "bg-amber-100 text-amber-700"
                                      : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {quantity} em estoque
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                              <h3 className="truncate text-sm font-semibold text-zinc-950 sm:text-base">
                                {product.name}
                              </h3>
                              <p className="shrink-0 text-base font-semibold text-zinc-950 sm:text-lg">
                                {formatCurrency(product.base_price)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="md:w-[156px]">
                          <AddToCartButton
                            product={{
                              productId: product.id,
                              name: product.name,
                              sku: product.sku,
                              unitPrice: product.base_price,
                              availableQuantity: quantity,
                              productTypeLabel,
                            }}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
