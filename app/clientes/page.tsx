import { connection } from "next/server";

import { CustomersWorkspace } from "@/components/features/customers-workspace";
import { PageHeader } from "@/components/layout/page-header";
import { listCustomers } from "@/services/customers";

export const metadata = {
  title: "Clientes",
};

export default async function CustomersPage() {
  await connection();

  const customers = await listCustomers();

  return (
    <>
      <PageHeader
        badge="Carteira"
        title="Clientes da loja"
      />
      <CustomersWorkspace customers={customers} />
    </>
  );
}
