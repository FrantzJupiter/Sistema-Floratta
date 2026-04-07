import Link from "next/link";
import { connection } from "next/server";

import { ProductsWorkspace } from "@/components/features/products-workspace";
import { RecentSales } from "@/components/features/recent-sales";
import { SalesWorkspace } from "@/components/features/sales-workspace";
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
    listRecentSales(4),
    listCustomers(),
  ]);
  const totalUnits = products.reduce(
    (accumulator, product) => accumulator + (product.inventory?.quantity ?? 0),
    0,
  );
  const lowStockCount = products.filter((product) => {
    const quantity = product.inventory?.quantity ?? 0;
    return quantity > 0 && quantity <= 5;
  }).length;
  const grossSales = recentSales.reduce(
    (accumulator, sale) => accumulator + sale.total_amount,
    0,
  );

  return (
    <>
      <section className="flex flex-col gap-5 rounded-[2rem] border border-white/45 bg-white/60 p-4 sm:p-6 shadow-[0_30px_80px_-48px_rgba(90,24,57,0.6)] backdrop-blur-xl">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Painel central
        </h1>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              href: "/venda",
              title: "Venda",
              description: "Busque produtos e monte o carrinho.",
            },
            {
              href: "/produtos",
              title: "Produtos",
              description: "Cadastre, edite e organize o estoque.",
            },
            {
              href: "/clientes",
              title: "Clientes",
              description: "Gerencie cadastros e buscas por nome.",
            },
            {
              href: "/historico",
              title: "Historico",
              description: "Veja as vendas agrupadas por dia.",
            },
          ].map((shortcut) => (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="flex flex-col justify-center rounded-[1.5rem] border border-white/55 bg-white/75 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-base font-semibold text-zinc-950">{shortcut.title}</p>
              <p className="mt-1 text-sm leading-5 text-zinc-600">{shortcut.description}</p>
            </Link>
          ))}
        </div>
      </section>


      <SalesWorkspace
        customers={customers}
        products={products}
        description="Monte uma venda sem sair da home. O modulo dedicado continua disponivel na barra superior."
        title="Venda rapida"
      />

      <ProductsWorkspace
        description="O cadastro e a manutencao do catalogo continuam disponiveis aqui, com uma pagina exclusiva na barra superior."
        products={products}
        title="Produtos e estoque"
      />

      <RecentSales sales={recentSales} />
    </>
  );
}
