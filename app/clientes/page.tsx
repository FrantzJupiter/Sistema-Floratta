import { connection } from "next/server";

import { CustomersWorkspace } from "@/components/features/customers-workspace";
import { listCustomers } from "@/services/customers";

export const metadata = {
  title: "Clientes",
};

export default async function CustomersPage() {
  await connection();

  const customers = await listCustomers();

  return <CustomersWorkspace customers={customers} />;
}
