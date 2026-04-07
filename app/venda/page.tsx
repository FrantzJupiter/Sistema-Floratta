import { connection } from "next/server";

import { PageHeader } from "@/components/layout/page-header";
import { SalesWorkspace } from "@/components/features/sales-workspace";
import { listCustomers } from "@/services/customers";
import { listCatalogProducts } from "@/services/products";

export const metadata = {
  title: "Venda",
};

export default async function SalesPage() {
  await connection();

  const [products, customers] = await Promise.all([
    listCatalogProducts(),
    listCustomers(),
  ]);

  return (
    <>
      <PageHeader
        badge="Checkout"
        title="Venda e carrinho"
        description="Procure produtos com foco em operacao, adicione ao carrinho e conclua a compra com recibo imediato."
      />
      <SalesWorkspace customers={customers} products={products} />
    </>
  );
}
