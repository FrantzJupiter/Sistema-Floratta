import { connection } from "next/server";

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
      <SalesWorkspace customers={customers} products={products} />
    </>
  );
}
