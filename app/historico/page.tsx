import { connection } from "next/server";

import { SalesHistoryByDay } from "@/components/features/sales-history-by-day";
import { PageHeader } from "@/components/layout/page-header";
import { listSalesHistory } from "@/services/transactions";

export const metadata = {
  title: "Historico",
};

export default async function SalesHistoryPage() {
  await connection();

  const sales = await listSalesHistory();

  return (
    <>
      <PageHeader
        badge="Caixa"
        title="Historico por dia"
        description="Veja as vendas agrupadas por data para acompanhar movimento, descontos e itens vendidos com mais contexto."
      />
      <SalesHistoryByDay sales={sales} />
    </>
  );
}
