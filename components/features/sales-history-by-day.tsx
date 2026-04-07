import { ClearSalesHistoryButton } from "@/components/features/clear-sales-history-button";
import { SaleSummaryCard } from "@/components/features/sale-summary-card";
import type { RecentSale } from "@/services/transactions";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getDayKey(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDayLabel(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

type SalesHistoryByDayProps = {
  sales: RecentSale[];
  title?: string;
};

export function SalesHistoryByDay({
  sales,
  title = "Historico por dia",
}: SalesHistoryByDayProps) {
  const groupedSales = sales.reduce<Record<string, RecentSale[]>>((accumulator, sale) => {
    const key = getDayKey(sale.created_at);
    accumulator[key] = [...(accumulator[key] ?? []), sale];
    return accumulator;
  }, {});

  const dayEntries = Object.entries(groupedSales).sort(([left], [right]) =>
    right.localeCompare(left),
  );
  const totalAmount = sales.reduce((accumulator, sale) => accumulator + sale.totalAmount, 0);

  return (
    <section className="grid gap-6 rounded-[2rem] border border-white/45 bg-white/60 p-6 shadow-panel-down backdrop-blur-xl">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-zinc-950">{title}</h2>
        </div>

        <div className="flex flex-col items-start gap-4 xl:items-end">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/55 bg-white/75 px-4 py-4 shadow-card-down">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Vendas</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{sales.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/55 bg-white/75 px-4 py-4 shadow-card-down">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total do periodo</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>

          <ClearSalesHistoryButton salesCount={sales.length} />
        </div>
      </div>

      {dayEntries.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-emerald-50/65 px-5 py-10 text-center">
          <p className="text-base font-medium text-zinc-800">
            Nenhuma venda foi registrada ainda.
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Assim que o checkout for concluido, o historico diario aparece aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {dayEntries.map(([dayKey, daySales]) => {
            const dayTotal = daySales.reduce(
              (accumulator, sale) => accumulator + sale.totalAmount,
              0,
            );
            const dayItems = daySales.reduce(
              (accumulator, sale) => accumulator + sale.totalItems,
              0,
            );

            return (
              <section
                key={dayKey}
                className="grid gap-4 rounded-[1.85rem] border border-white/55 bg-white/74 p-5 shadow-card-down"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.22em] text-rose-700">
                      {dayKey}
                    </p>
                    <h3 className="text-2xl font-semibold capitalize text-zinc-950">
                      {formatDayLabel(dayKey)}
                    </h3>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.35rem] border border-white/60 bg-white/80 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        Vendas do dia
                      </p>
                      <p className="mt-2 text-xl font-semibold text-zinc-950">
                        {daySales.length}
                      </p>
                    </div>
                    <div className="rounded-[1.35rem] border border-white/60 bg-white/80 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        Itens vendidos
                      </p>
                      <p className="mt-2 text-xl font-semibold text-zinc-950">{dayItems}</p>
                    </div>
                    <div className="rounded-[1.35rem] border border-white/60 bg-white/80 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        Total recebido
                      </p>
                      <p className="mt-2 text-xl font-semibold text-zinc-950">
                        {formatCurrency(dayTotal)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 2xl:grid-cols-2">
                  {daySales.map((sale) => (
                    <SaleSummaryCard key={sale.id} sale={sale} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
