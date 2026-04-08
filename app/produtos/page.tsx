import { connection } from "next/server";

import { ProductsWorkspace } from "@/components/features/products-workspace";
import { listInventoryBalanceSummary } from "@/services/inventory";
import { listCatalogProducts } from "@/services/products";

export const metadata = {
  title: "Produtos",
};

export default async function ProductsPage() {
  await connection();

  const [products, inventoryBalance] = await Promise.all([
    listCatalogProducts(),
    listInventoryBalanceSummary(),
  ]);

  return <ProductsWorkspace inventoryBalance={inventoryBalance} products={products} />;
}
