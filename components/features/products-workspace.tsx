"use client";

import { useDeferredValue, useState } from "react";

import { ProductCatalogCard } from "@/components/features/product-catalog-card";
import { ProductCreateForm } from "@/components/features/product-create-form";
import {
  getProductTypeFromAttributes,
  getProductTypeLabel,
  productTypeDefinitions,
  productTypeValues,
  type ProductType,
} from "@/lib/products/catalog";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/services/products";

type ProductsWorkspaceProps = {
  products: CatalogProduct[];
  title?: string;
  description?: string;
  withCreateForm?: boolean;
};

function getMetadataSearchText(product: CatalogProduct) {
  if (
    !product.variantAttributes ||
    typeof product.variantAttributes !== "object" ||
    Array.isArray(product.variantAttributes)
  ) {
    return "";
  }

  return Object.entries(product.variantAttributes)
    .filter(([key]) => key !== "tipo_produto")
    .map(([key, value]) => `${key} ${String(value)}`)
    .join(" ");
}

export function ProductsWorkspace({
  products,
  title = "Produtos e estoque",
  description = "Cadastre novos itens e mantenha o catalogo organizado com pesquisa rapida e edicao inline.",
  withCreateForm = true,
}: ProductsWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [productType, setProductType] = useState<"todos" | ProductType>("todos");
  const [stockFilter, setStockFilter] = useState<"todos" | "baixo" | "zerado">("todos");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredProducts = products.filter((product) => {
    const detectedType = getProductTypeFromAttributes(product.variantAttributes);
    const quantity = product.inventory?.quantity ?? 0;
    const searchValue = [
      product.name,
      product.sku,
      getProductTypeLabel(detectedType),
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

  const lowStockCount = products.filter((product) => {
    const quantity = product.inventory?.quantity ?? 0;
    return quantity > 0 && quantity <= 5;
  }).length;
  const productsWithoutImage = products.filter((product) => !product.image_url).length;

  return (
    <div className="grid items-start gap-6">
      <header className="flex flex-col gap-6 rounded-[2rem] border border-white/45 bg-white/60 p-4 sm:p-6 shadow-[0_24px_70px_-45px_rgba(90,24,57,0.55)] backdrop-blur-xl xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-zinc-950">{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600">{description}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/55 bg-white/75 px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Cadastrados</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">{products.length}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/55 bg-white/75 px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Estoque baixo</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">{lowStockCount}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/55 bg-white/75 px-4 py-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Sem foto</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-950">{productsWithoutImage}</p>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "grid gap-6",
          withCreateForm && "xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]",
        )}
      >
        {withCreateForm ? (
          <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-[2rem] border border-white/45 bg-white/60 p-4 sm:p-6 shadow-[0_24px_70px_-45px_rgba(90,24,57,0.55)] backdrop-blur-xl">
              <div className="mb-5 space-y-2">
                <h3 className="text-xl font-semibold text-zinc-950">Cadastrar produto</h3>
                <p className="text-sm leading-6 text-zinc-600">
                  Registre novos itens com ID automatico, estoque inicial e metadados guiados.
                </p>
              </div>
              <ProductCreateForm />
            </div>
          </aside>
        ) : null}

        <section className="flex min-w-0 flex-col gap-4 rounded-[2rem] border border-white/45 bg-white/60 p-4 sm:p-6 shadow-[0_24px_70px_-45px_rgba(90,24,57,0.55)] backdrop-blur-xl">
          <div className="grid gap-3 rounded-[1.75rem] border border-white/55 bg-white/75 p-4 shadow-sm md:grid-cols-3 xl:grid-cols-[minmax(0,1.2fr)_180px_180px]">
            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">Buscar no catalogo</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nome, ID do produto, tipo ou metadado"
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
              <span className="font-medium">Estoque</span>
              <select
                value={stockFilter}
                onChange={(event) =>
                  setStockFilter(event.target.value as "todos" | "baixo" | "zerado")
                }
                className="h-11 rounded-2xl border border-white/45 bg-white/80 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              >
                <option value="todos">Todos</option>
                <option value="baixo">Apenas baixo estoque</option>
                <option value="zerado">Apenas zerados</option>
              </select>
            </label>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-rose-200 bg-rose-50/65 px-5 py-10 text-center">
              <p className="text-base font-medium text-zinc-800">
                Nenhum produto corresponde aos filtros atuais.
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Tente buscar por outro termo ou ajustar o filtro de tipo e estoque.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 2xl:grid-cols-2">
              {filteredProducts.map((product) => (
                <ProductCatalogCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
