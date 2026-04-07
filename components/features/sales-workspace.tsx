"use client";
/* eslint-disable @next/next/no-img-element */

import { useDeferredValue, useState } from "react";

import { AddToCartButton } from "@/components/features/add-to-cart-button";
import { CartPanel } from "@/components/features/cart-panel";
import {
  getProductTypeFromAttributes,
  getProductTypeLabel,
  productTypeDefinitions,
  productTypeValues,
  type ProductType,
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

function getMetadataPreview(product: CatalogProduct) {
  if (
    !product.variantAttributes ||
    typeof product.variantAttributes !== "object" ||
    Array.isArray(product.variantAttributes)
  ) {
    return [];
  }

  return Object.entries(product.variantAttributes)
    .filter(([key]) => key !== "tipo_produto")
    .slice(0, 3);
}

function getProductSearchText(product: CatalogProduct) {
  const metadataText = getMetadataPreview(product)
    .map(([key, value]) => `${key} ${String(value)}`)
    .join(" ");
  const productTypeLabel = getProductTypeLabel(
    getProductTypeFromAttributes(product.variantAttributes),
  );

  return [product.name, product.sku, productTypeLabel, metadataText].join(" ").toLowerCase();
}

type SalesWorkspaceProps = {
  customers: RegisteredCustomer[];
  products: CatalogProduct[];
  title?: string;
  description?: string;
};

export function SalesWorkspace({
  customers,
  products,
  title = "Buscar no estoque",
}: SalesWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [productType, setProductType] = useState<"todos" | ProductType>("todos");
  const [availability, setAvailability] = useState<"todos" | "disponiveis" | "zerados">(
    "disponiveis",
  );
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const cartUnits = useCartStore((state) =>
    state.items.reduce((accumulator, item) => accumulator + item.quantity, 0),
  );

  const filteredProducts = products.filter((product) => {
    const detectedType = getProductTypeFromAttributes(product.variantAttributes);
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

  const availableProducts = products.filter((product) => (product.inventory?.quantity ?? 0) > 0)
    .length;
  const totalStockUnits = products.reduce(
    (accumulator, product) => accumulator + (product.inventory?.quantity ?? 0),
    0,
  );

  return (
    <div className="flex flex-col gap-8">
      <aside className="min-w-0 w-full">
        <CartPanel customers={customers} />
      </aside>

      <section className="flex min-w-0 flex-col gap-6 rounded-[2rem] border border-white/45 bg-white/60 p-4 sm:p-6 shadow-[0_24px_70px_-45px_rgba(90,24,57,0.55)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-zinc-950">{title}</h2>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="sticky top-24 z-10 grid gap-3 rounded-[1.75rem] border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur-xl md:grid-cols-3 xl:grid-cols-[minmax(0,1.2fr)_180px_180px]">
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
                onChange={(event) =>
                  setProductType(event.target.value as "todos" | ProductType)
                }
                className="h-11 rounded-2xl border border-white/45 bg-white/80 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              >
                <option value="todos">Todos os tipos</option>
                {productTypeValues.map((type) => (
                  <option key={type} value={type}>
                    {productTypeDefinitions[type].label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">Exibicao</span>
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
                Ajuste os filtros ou cadastre novos itens na area de produtos.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredProducts.map((product) => {
                const quantity = product.inventory?.quantity ?? 0;
                const productTypeLabel = getProductTypeLabel(
                  getProductTypeFromAttributes(product.variantAttributes),
                );
                const metadataPreview = getMetadataPreview(product);

                return (
                  <article
                    key={product.id}
                    className="rounded-[1.75rem] border border-white/55 bg-white/78 p-5 shadow-sm"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/85 shadow-sm">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="px-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                            Sem foto
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full border border-zinc-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                                ID {product.sku}
                              </span>
                              <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-rose-700">
                                {productTypeLabel}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-950">
                              {product.name}
                            </h3>
                          </div>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
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

                        <div className="flex flex-col gap-2 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-lg font-semibold text-zinc-950">
                            {formatCurrency(product.base_price)}
                          </p>
                          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                            Ultima atualizacao{" "}
                            {product.inventory?.last_updated
                              ? new Date(product.inventory.last_updated).toLocaleDateString(
                                  "pt-BR",
                                )
                              : "sem registro"}
                          </p>
                        </div>

                        {metadataPreview.length ? (
                          <div className="flex flex-wrap gap-2">
                            {metadataPreview.map(([key, value]) => (
                              <span
                                key={key}
                                className="rounded-full border border-white/65 bg-white/80 px-3 py-1 text-xs text-zinc-600"
                              >
                                {key.replaceAll("_", " ")}: {String(value)}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-5">
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
          )}
        </div>
      </section>
    </div>
  );
}
