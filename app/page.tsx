import { connection } from "next/server";

import { SessionFooterBar } from "@/components/auth/session-footer-bar";
import { ProductsWorkspace } from "@/components/features/products-workspace";
import { RecentSales } from "@/components/features/recent-sales";
import { SalesWorkspace } from "@/components/features/sales-workspace";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/user";
import { createAutomaticSku } from "@/lib/products/catalog";
import { listCustomers } from "@/services/customers";
import { listInventoryBalanceSummary } from "@/services/inventory";
import { listCatalogProducts } from "@/services/products";
import { listRecentSales } from "@/services/transactions";

export default async function Home() {
  await connection();
  const initialProductSkuPreview = createAutomaticSku("");

  const [products, recentSales, customers, inventoryBalance, user, userRole] = await Promise.all([
    listCatalogProducts(),
    listRecentSales(4),
    listCustomers(),
    listInventoryBalanceSummary(),
    getCurrentUser(),
    getCurrentUserRole(),
  ]);

  return (
    <>
      <SalesWorkspace
        customers={customers}
        isAdmin={userRole === "admin"}
        products={products}
        title="Adicionar produtos ao carrinho"
      />

      <ProductsWorkspace
        collapseCatalogByDefault
        collapseCreateFormByDefault
        initialProductSkuPreview={initialProductSkuPreview}
        inventoryBalance={inventoryBalance}
        isAdmin={userRole === "admin"}
        products={products}
        title="Produtos e estoque"
      />

      <RecentSales collapseByDefault sales={recentSales} />

      {user?.email ? (
        <SessionFooterBar isAdmin={userRole === "admin"} userEmail={user.email} />
      ) : null}
    </>
  );
}
