"use client";

import { useActionState, useEffect } from "react";

import { checkoutAction } from "@/app/actions/checkout";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart-store";
import {
  initialCheckoutActionState,
  type CheckoutActionState,
} from "@/lib/validations/checkout";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function CartPanel() {
  const items = useCartStore((state) => state.items);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const [state, formAction, pending] = useActionState<CheckoutActionState, FormData>(
    checkoutAction,
    initialCheckoutActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      clearCart();
    }
  }, [clearCart, state.status]);

  const subtotal = items.reduce(
    (accumulator, item) => accumulator + item.unitPrice * item.quantity,
    0,
  );

  return (
    <section className="rounded-[2rem] border border-white/45 bg-white/68 p-6 shadow-[0_24px_70px_-45px_rgba(90,24,57,0.55)] backdrop-blur-xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">Carrinho e checkout</h2>
          <p className="text-sm leading-6 text-zinc-600">
            Monte a venda, aplique desconto e registre a transacao no estoque.
          </p>
        </div>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-rose-700">
          {items.length} item(ns)
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-rose-200 bg-rose-50/65 px-5 py-10 text-center">
          <p className="text-base font-medium text-zinc-800">Nenhum item no carrinho.</p>
          <p className="mt-2 text-sm text-zinc-600">
            Use os botoes do catalogo para montar a venda.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-3">
            {items.map((item) => (
              <article
                key={item.productId}
                className="rounded-[1.5rem] border border-white/55 bg-white/75 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap gap-2">
                      <p className="text-sm font-semibold text-zinc-950">{item.name}</p>
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-rose-700">
                        {item.productTypeLabel}
                      </span>
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {item.sku}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {formatCurrency(item.unitPrice)} por unidade
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <p className="text-lg font-semibold text-zinc-950">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className="rounded-xl"
                        onClick={() => decrementItem(item.productId)}
                      >
                        -
                      </Button>
                      <span className="min-w-8 text-center text-sm font-medium text-zinc-800">
                        {item.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className="rounded-xl"
                        disabled={item.quantity >= item.availableQuantity}
                        onClick={() => incrementItem(item.productId)}
                      >
                        +
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-zinc-500 hover:text-rose-700"
                        onClick={() => removeItem(item.productId)}
                      >
                        Remover
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Maximo disponivel agora: {item.availableQuantity}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <form action={formAction} className="grid gap-4 rounded-[1.75rem] border border-white/55 bg-white/78 p-5 shadow-sm">
            <input
              type="hidden"
              name="cartPayload"
              value={JSON.stringify(
                items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                })),
              )}
            />

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
              <label className="grid gap-2 text-sm text-zinc-700">
                <span className="font-medium">Desconto da venda</span>
                <input
                  name="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                  className="h-11 rounded-2xl border border-white/45 bg-white/75 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                />
              </label>

              <div className="rounded-2xl border border-white/60 bg-rose-50/75 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Subtotal atual</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">
                  {formatCurrency(subtotal)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div aria-live="polite" className="min-h-6 text-sm">
                {state.message ? (
                  <p
                    className={
                      state.status === "success" ? "text-emerald-700" : "text-rose-600"
                    }
                  >
                    {state.message}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl text-zinc-600 hover:text-zinc-900"
                  onClick={() => clearCart()}
                >
                  Limpar carrinho
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={pending}
                  className="rounded-2xl bg-emerald-700 px-5 text-white hover:bg-emerald-600"
                >
                  {pending ? "Registrando venda..." : "Finalizar venda"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
