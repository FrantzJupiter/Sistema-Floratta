"use client";

import { useDeferredValue, useState } from "react";

import { ProductCatalogCard } from "@/components/features/product-catalog-card";
import { ProductCreateForm } from "@/components/features/product-create-form";
import {
  getDetailType,
  getProductDetailEntries,
  getRegisteredDetailTypes,
} from "@/lib/products/catalog";
import { cn } from "@/lib/utils";
import type { InventoryBalanceSummary } from "@/services/inventory";
import type { CatalogProduct } from "@/services/products";

type ProductsWorkspaceProps = {
  inventoryBalance: InventoryBalanceSummary;
  products: CatalogProduct[];
  title?: string;
  withCreateForm?: boolean;
};

function getMetadataSearchText(product: CatalogProduct) {
  return getProductDetailEntries(product.variantAttributes)
    .map(({ key, value }) => `${key} ${String(value)}`)
    .join(" ");
}

export function ProductsWorkspace({
  inventoryBalance,
  products,
  title = "Produtos e estoque",
  withCreateForm = true,
}: ProductsWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [productType, setProductType] = useState("todos");
  const [stockFilter, setStockFilter] = useState<"todos" | "baixo" | "zerado">("todos");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const typeOptions = getRegisteredDetailTypes(products);

  const filteredProducts = products.filter((product) => {
    const detectedType = getDetailType(product.variantAttributes);
    const quantity = product.inventory?.quantity ?? 0;
    const searchValue = [
      product.name,
      product.sku,
      detectedType ?? "",
      getMetadataSearchText(product),
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = !normalizedQuery || searchValue.includes(normalizedQuery);
    const matchesType = productType === "todos" || detectedType === productType;
    const matchesStock =
      stockFilter === "todos"
        ? true
        : stockFilter === "baixo"
          ? quantity > 0 && quantity <= 5
          : quantity === 0;

    return matchesQuery && matchesType && matchesStock;
  });

  const stockBalanceLabel =
    inventoryBalance.netChange > 0
      ? `+${inventoryBalance.netChange}`
      : String(inventoryBalance.netChange);
  const stockBalanceTone =
    inventoryBalance.netChange > 0
      ? "text-emerald-700"
      : inventoryBalance.netChange < 0
        ? "text-rose-700"
        : "text-zinc-950";

  return (
    <div className="flex flex-col gap-8">
      {withCreateForm ? (
        <aside className="min-w-0 w-full">
          <div className="rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/60 to-white/20 p-4 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-2xl">
            <div className="mb-5 space-y-2">
              <h3 className="text-xl font-semibold text-zinc-950">Cadastrar produto</h3>
            </div>
            <ProductCreateForm typeOptions={typeOptions} />
          </div>
        </aside>
      ) : null}

      <section className="flex min-w-0 flex-col gap-6 rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/60 to-white/20 p-4 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-2xl">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-zinc-950">{title}</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/70 to-white/30 px-4 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Cadastrados</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{products.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/70 to-white/30 px-4 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Balanço últimas 24h
              </p>
              <p className={cn("mt-2 text-2xl font-semibold", stockBalanceTone)}>
                {stockBalanceLabel}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {inventoryBalance.setupRequired
                  ? "Ative o histórico"
                  : `(+${inventoryBalance.positiveChange} / -${inventoryBalance.negativeChange})`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 rounded-[1.75rem] border border-white/60 bg-gradient-to-br from-white/80 to-white/40 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl md:grid-cols-3 xl:grid-cols-[minmax(0,1.2fr)_180px_180px]">
            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">Buscar no catálogo</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nome, ID do produto, tipo ou detalhe"
                className="h-11 rounded-2xl border border-white/50 bg-white/40 px-4 text-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md outline-none transition-all focus:bg-white/60 focus:border-rose-300 focus:ring-4 focus:ring-rose-200/50 hover:bg-white/50"
              />
            </label>

            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">Tipo</span>
              <select
                value={productType}
                onChange={(event) => setProductType(event.target.value)}
                className="h-11 rounded-2xl border border-white/50 bg-white/40 px-4 text-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md outline-none transition-all focus:bg-white/60 focus:border-rose-300 focus:ring-4 focus:ring-rose-200/50 hover:bg-white/50"
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
              <span className="font-medium">Estoque</span>
              <select
                value={stockFilter}
                onChange={(event) =>
                  setStockFilter(event.target.value as "todos" | "baixo" | "zerado")
                }
                className="h-11 rounded-2xl border border-white/50 bg-white/40 px-4 text-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md outline-none transition-all focus:bg-white/60 focus:border-rose-300 focus:ring-4 focus:ring-rose-200/50 hover:bg-white/50"
              >
                <option value="todos">Todos</option>
                <option value="baixo">Apenas baixo estoque</option>
                <option value="zerado">Apenas zerados</option>
              </select>
            </label>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-rose-300/50 bg-gradient-to-b from-rose-50/50 to-transparent backdrop-blur-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] px-5 py-10 text-center">
              <p className="text-base font-medium text-zinc-800">
                Nenhum produto corresponde aos filtros atuais.
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Tente buscar por outro termo ou ajustar o filtro de tipo e estoque.
              </p>
            </div>
          ) : (
            <div className="max-h-[68vh] overflow-y-auto pr-1 sm:pr-2">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {filteredProducts.map((product) => (
                  <ProductCatalogCard
                    key={product.id}
                    product={product}
                    typeOptions={typeOptions}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
