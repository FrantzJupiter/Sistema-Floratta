import { connection } from "next/server";

import { SalesHistoryByDay } from "@/components/features/sales-history-by-day";
import { listSalesHistory } from "@/services/transactions";

export const metadata = {
  title: "Histórico",
};

export default async function SalesHistoryPage() {
  await connection();

  const sales = await listSalesHistory();

  return <SalesHistoryByDay sales={sales} />;
}
