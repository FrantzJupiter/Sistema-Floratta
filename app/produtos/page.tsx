import { connection } from "next/server";

import { ProductsWorkspace } from "@/components/features/products-workspace";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { listInventoryBalanceSummary } from "@/services/inventory";
import { listCatalogProducts } from "@/services/products";

export const metadata = {
  title: "Produtos",
};

export default async function ProductsPage() {
  await connection();

  const [products, inventoryBalance, userRole] = await Promise.all([
    listCatalogProducts(),
    listInventoryBalanceSummary(),
    getCurrentUserRole(),
  ]);

  return (
    <ProductsWorkspace
      inventoryBalance={inventoryBalance}
      isAdmin={userRole === "admin"}
      products={products}
    />
  );
}
