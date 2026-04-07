import type { RecentSale } from "@/services/transactions";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

type RecentSalesProps = {
  sales: RecentSale[];
};

export function RecentSales({ sales }: RecentSalesProps) {
  return (
    <section className="rounded-[2rem] border border-white/45 bg-white/60 p-6 shadow-[0_24px_70px_-45px_rgba(90,24,57,0.55)] backdrop-blur-xl">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">Vendas recentes</h2>
          <p className="text-sm leading-6 text-zinc-600">
            Historico imediato do caixa com totais, descontos e itens vendidos.
          </p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
          {sales.length} venda(s)
        </span>
      </div>

      {sales.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-emerald-50/65 px-5 py-10 text-center">
          <p className="text-base font-medium text-zinc-800">
            Nenhuma venda foi registrada ainda.
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Assim que o checkout for concluido, o historico aparece aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {sales.map((sale) => (
            <article
              key={sale.id}
              className="rounded-[1.75rem] border border-white/55 bg-white/74 p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white">
                      Pedido {sale.id.slice(0, 8).toUpperCase()}
                    </span>
                    {sale.discount ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-amber-700">
                        Desconto {formatCurrency(Number(sale.discount))}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium text-zinc-700">
                    {new Date(sale.created_at).toLocaleString("pt-BR")}
                  </p>
                  <p className="text-sm text-zinc-600">
                    Cliente: {sale.customerName ?? "Consumidor final"}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    {sale.totalItems} unidade(s) em {sale.items.length} item(ns)
                  </p>
                </div>

                <div className="rounded-2xl border border-white/60 bg-emerald-50/75 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total pago</p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-950">
                    {formatCurrency(sale.total_amount)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-2">
                {sale.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-1 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {item.productName ?? "Produto nao encontrado"}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                        {item.productSku ?? item.productId ?? "Sem SKU"} | {item.quantity} x{" "}
                        {formatCurrency(item.priceAtTime)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatCurrency(item.lineTotal)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/60 bg-white/75 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Subtotal original
                  </p>
                  <p className="mt-2 text-lg font-semibold text-zinc-950">
                    {formatCurrency(sale.subtotalAmount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/75 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Desconto aplicado
                  </p>
                  <p className="mt-2 text-lg font-semibold text-zinc-950">
                    {formatCurrency(Number(sale.discount ?? 0))}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
