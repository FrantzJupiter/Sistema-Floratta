"use client";
/* eslint-disable @next/next/no-img-element */

import { useDeferredValue, useState } from "react";

import { AddToCartButton } from "@/components/features/add-to-cart-button";
import { CartPanel } from "@/components/features/cart-panel";
import {
  getDetailType,
  getRegisteredDetailTypes,
  getProductDetailEntries,
} from "@/lib/products/catalog";
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
    <div className="overflow-hidden rounded-[1.1rem] border border-white/60 bg-white/80 shadow-card-down">
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="h-14 w-14 object-cover sm:h-16 sm:w-16" />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center bg-[linear-gradient(160deg,_rgba(255,240,245,0.88),_rgba(247,235,255,0.92))] px-2 text-center text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-500 sm:h-16 sm:w-16 sm:text-[10px]">
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

type SalesWorkspaceProps = {
  customers: RegisteredCustomer[];
  products: CatalogProduct[];
  title?: string;
};

export function SalesWorkspace({
  customers,
  products,
  title = "Buscar no estoque",
}: SalesWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [productType, setProductType] = useState("todos");
  const [availability, setAvailability] = useState<"todos" | "disponiveis" | "zerados">(
    "disponiveis",
  );
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const typeOptions = getRegisteredDetailTypes(products);

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
          <div className="grid gap-3 rounded-[1.75rem] border border-white/60 bg-white/80 p-4 shadow-card-down backdrop-blur-xl md:grid-cols-3 xl:grid-cols-[minmax(0,1.2fr)_180px_180px]">
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
          </div>

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
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filteredProducts.map((product) => {
                  const quantity = product.inventory?.quantity ?? 0;
                  const productTypeLabel = getDetailType(product.variantAttributes) ?? "Sem tipo";

                  return (
                    <article
                      key={product.id}
                      className="rounded-[1.25rem] border border-white/55 bg-white/78 p-3 shadow-card-down"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-3">
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

                            <div className="space-y-1.5">
                              <h3 className="line-clamp-2 text-sm font-semibold text-zinc-950 sm:text-base">
                                {product.name}
                              </h3>
                              <p className="text-lg font-semibold text-zinc-950 sm:text-xl">
                                {formatCurrency(product.base_price)}
                              </p>
                            </div>
                          </div>
                        </div>

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
