import { connection } from "next/server";

import { ProductsWorkspace } from "@/components/features/products-workspace";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { createAutomaticSku } from "@/lib/products/catalog";
import { listInventoryBalanceSummary } from "@/services/inventory";
import { listCatalogProducts } from "@/services/products";

export const metadata = {
  title: "Produtos",
};

export default async function ProductsPage() {
  await connection();
  const initialProductSkuPreview = createAutomaticSku("");

  const [products, inventoryBalance, userRole] = await Promise.all([
    listCatalogProducts(),
    listInventoryBalanceSummary(),
    getCurrentUserRole(),
  ]);

  return (
    <ProductsWorkspace
      initialProductSkuPreview={initialProductSkuPreview}
      inventoryBalance={inventoryBalance}
      isAdmin={userRole === "admin"}
      products={products}
    />
  );
}
