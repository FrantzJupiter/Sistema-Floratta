import { connection } from "next/server";

import { CustomersWorkspace } from "@/components/features/customers-workspace";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { listCustomers } from "@/services/customers";

export const metadata = {
  title: "Clientes",
};

export default async function CustomersPage() {
  await connection();

  const [customers, userRole] = await Promise.all([
    listCustomers(),
    getCurrentUserRole(),
  ]);

  return <CustomersWorkspace customers={customers} isAdmin={userRole === "admin"} />;
}
