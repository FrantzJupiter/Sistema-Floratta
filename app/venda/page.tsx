import { connection } from "next/server";

import { SalesWorkspace } from "@/components/features/sales-workspace";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { listCustomers } from "@/services/customers";
import { listCatalogProducts } from "@/services/products";

export const metadata = {
  title: "Venda",
};

export default async function SalesPage() {
  await connection();

  const [products, customers, userRole] = await Promise.all([
    listCatalogProducts(),
    listCustomers(),
    getCurrentUserRole(),
  ]);

  return (
    <>
      <SalesWorkspace
        customers={customers}
        isAdmin={userRole === "admin"}
        products={products}
      />
    </>
  );
}
