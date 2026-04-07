import Link from "next/link";
import { connection } from "next/server";

import { PageHeader } from "@/components/layout/page-header";
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
      <PageHeader
        badge="Painel central"
        title="Operacao da loja em uma unica tela."
        description="A pagina inicial continua reunindo venda, cadastro de produtos e historico recente, agora com acesso rapido aos modulos dedicados."
        actions={
          <div className="grid gap-3 sm:grid-cols-2">
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
                className="rounded-[1.5rem] border border-white/55 bg-white/75 px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-sm font-semibold text-zinc-950">{shortcut.title}</p>
                <p className="mt-1 text-sm leading-5 text-zinc-600">
                  {shortcut.description}
                </p>
              </Link>
            ))}
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
