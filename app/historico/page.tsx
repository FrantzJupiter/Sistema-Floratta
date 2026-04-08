import { connection } from "next/server";

import { SalesHistoryByDay } from "@/components/features/sales-history-by-day";
import { getCurrentUserRole } from "@/lib/auth/roles";
import { listSalesHistory } from "@/services/transactions";

export const metadata = {
  title: "Histórico",
};

export default async function SalesHistoryPage() {
  await connection();

  const [sales, userRole] = await Promise.all([
    listSalesHistory(),
    getCurrentUserRole(),
  ]);

  return <SalesHistoryByDay isAdmin={userRole === "admin"} sales={sales} />;
}
