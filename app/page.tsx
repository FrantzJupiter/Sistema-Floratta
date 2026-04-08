import Link from "next/link";
import { connection } from "next/server";

import { ProductsWorkspace } from "@/components/features/products-workspace";
import { RecentSales } from "@/components/features/recent-sales";
import { SalesWorkspace } from "@/components/features/sales-workspace";
import { listCustomers } from "@/services/customers";
import { listInventoryBalanceSummary } from "@/services/inventory";
import { listCatalogProducts } from "@/services/products";
import { listRecentSales } from "@/services/transactions";

export default async function Home() {
  await connection();

  const [products, recentSales, customers, inventoryBalance] = await Promise.all([
    listCatalogProducts(),
    listRecentSales(4),
    listCustomers(),
    listInventoryBalanceSummary(),
  ]);

  return (
    <>
      <section className="lg:hidden">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          {[
            {
              href: "/venda",
              title: "Venda",
            },
            {
              href: "/produtos",
              title: "Produtos",
            },
            {
              href: "/clientes",
              title: "Clientes",
            },
            {
              href: "/historico",
              title: "Histórico",
            },
          ].map((shortcut) => (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="flex min-h-14 items-center justify-center rounded-[1rem] border border-white/55 bg-white/75 px-2 py-1.5 text-center shadow-card-down transition hover:-translate-y-0.5 sm:min-h-24 sm:rounded-[1.5rem] sm:p-4"
            >
              <p className="text-[11px] leading-tight font-semibold text-zinc-950 sm:text-base">
                {shortcut.title}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <SalesWorkspace
        customers={customers}
        products={products}
        title="Adicionar produtos ao carrinho"
      />

      <ProductsWorkspace
        collapseCatalogByDefault
        collapseCreateFormByDefault
        inventoryBalance={inventoryBalance}
        products={products}
        title="Produtos e estoque"
      />

      <RecentSales collapseByDefault sales={recentSales} />
    </>
  );
}
