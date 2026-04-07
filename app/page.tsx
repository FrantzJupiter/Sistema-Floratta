import { connection } from "next/server";

import { AddToCartButton } from "@/components/features/add-to-cart-button";
import { CartPanel } from "@/components/features/cart-panel";
import { ProductCatalogCard } from "@/components/features/product-catalog-card";
import { ProductCreateForm } from "@/components/features/product-create-form";
import { RecentSales } from "@/components/features/recent-sales";
import {
  getProductTypeFromAttributes,
  getProductTypeLabel,
} from "@/lib/products/catalog";
import { listCustomers } from "@/services/customers";
import { listCatalogProducts } from "@/services/products";
import { listRecentSales } from "@/services/transactions";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function Home() {
  await connection();

  const [products, recentSales, customers] = await Promise.all([
    listCatalogProducts(),
    listRecentSales(),
    listCustomers(),
  ]);
  const totalUnits = products.reduce(
    (accumulator, product) => accumulator + (product.inventory?.quantity ?? 0),
    0,
  );
  const lowStockCount = products.filter(
    (product) => (product.inventory?.quantity ?? 0) > 0 && (product.inventory?.quantity ?? 0) <= 5,
  ).length;
  const grossSales = recentSales.reduce(
    (accumulator, sale) => accumulator + sale.total_amount,
    0,
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,185,204,0.42),_transparent_34%),linear-gradient(160deg,_#fffaf6_0%,_#f6efe9_44%,_#f2e7f0_100%)] px-4 py-6 text-zinc-900 sm:px-6 lg:px-8">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/45 bg-white/55 p-6 shadow-[0_30px_80px_-48px_rgba(90,24,57,0.6)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-rose-700">
                Sistema Floratta
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
                Catalogo e estoque em tempo real para o caixa da loja.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-zinc-600 sm:text-base">
                Esta primeira entrega ja conecta o app ao Supabase com leitura de produtos,
                controle de estoque e cadastro validado por Server Actions.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-[1.6rem] border border-white/55 bg-white/70 px-4 py-4 shadow-sm backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Produtos</p>
                <p className="mt-2 text-3xl font-semibold text-zinc-950">{products.length}</p>
              </div>
              <div className="rounded-[1.6rem] border border-white/55 bg-white/70 px-4 py-4 shadow-sm backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Unidades</p>
                <p className="mt-2 text-3xl font-semibold text-zinc-950">{totalUnits}</p>
              </div>
              <div className="rounded-[1.6rem] border border-white/55 bg-white/70 px-4 py-4 shadow-sm backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Estoque baixo</p>
                <p className="mt-2 text-3xl font-semibold text-zinc-950">{lowStockCount}</p>
              </div>
              <div className="rounded-[1.6rem] border border-white/55 bg-white/70 px-4 py-4 shadow-sm backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Vendas recentes</p>
                <p className="mt-2 text-3xl font-semibold text-zinc-950">
                  {formatCurrency(grossSales)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-white/45 bg-white/60 p-6 shadow-[0_24px_70px_-45px_rgba(90,24,57,0.55)] backdrop-blur-xl">
            <div className="mb-5 space-y-2">
              <h2 className="text-2xl font-semibold text-zinc-950">Cadastrar produto</h2>
              <p className="text-sm leading-6 text-zinc-600">
                Cadastre itens da loja com preco base, estoque inicial e metadados
                flexiveis para perfumaria, presentes e semijoias.
              </p>
            </div>
            <ProductCreateForm />
          </aside>

          <div className="grid gap-6">
            <CartPanel customers={customers} />

            <section className="rounded-[2rem] border border-white/45 bg-white/60 p-6 shadow-[0_24px_70px_-45px_rgba(90,24,57,0.55)] backdrop-blur-xl">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-zinc-950">Catalogo atual</h2>
                  <p className="text-sm leading-6 text-zinc-600">
                    Dados vindos do Supabase em tempo de requisicao para acompanhar o estoque real.
                  </p>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-rose-200 bg-rose-50/65 px-5 py-10 text-center">
                  <p className="text-base font-medium text-zinc-800">
                    Ainda nao existem produtos cadastrados.
                  </p>
                  <p className="mt-2 text-sm text-zinc-600">
                    Use o formulario ao lado para inserir o primeiro item do catalogo.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {products.map((product) => (
                    <div key={product.id} className="grid gap-4">
                      <ProductCatalogCard product={product} />
                      <AddToCartButton
                        product={{
                          productId: product.id,
                          name: product.name,
                          sku: product.sku,
                          unitPrice: product.base_price,
                          availableQuantity: product.inventory?.quantity ?? 0,
                          productTypeLabel: getProductTypeLabel(
                            getProductTypeFromAttributes(product.variantAttributes),
                          ),
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>

        <RecentSales sales={recentSales} />
      </main>
    </div>
  );
}
