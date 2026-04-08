"use client";

import { useActionState, useEffect, useEffectEvent, useMemo, useState } from "react";

import { checkoutAction } from "@/app/actions/checkout";
import { cancelSaleAction } from "@/app/actions/transactions";
import { CustomerQuickCreateForm } from "@/components/features/customer-quick-create-form";
import { SaleReceipt } from "@/components/features/sale-receipt";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart-store";
import {
  initialCheckoutActionState,
  type CheckoutActionState,
} from "@/lib/validations/checkout";
import { initialTransactionHistoryActionState } from "@/lib/validations/transactions";
import type { RegisteredCustomer } from "@/services/customers";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

type CartPanelProps = {
  customers: RegisteredCustomer[];
  isAdmin?: boolean;
};

function CartCheckoutContent({
  customers,
  decrementItem,
  formAction,
  incrementItem,
  items,
  pending,
  removeItem,
  state,
}: {
  customers: RegisteredCustomer[];
  decrementItem: (productId: string) => void;
  formAction: (payload: FormData) => void;
  incrementItem: (productId: string) => void;
  items: ReturnType<typeof useCartStore.getState>["items"];
  pending: boolean;
  removeItem: (productId: string) => void;
  state: CheckoutActionState;
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerOption, setNewCustomerOption] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const clearCart = useCartStore((storeState) => storeState.clearCart);
  const subtotal = items.reduce(
    (accumulator, item) => accumulator + item.unitPrice * item.quantity,
    0,
  );

  const customerOptions = useMemo(() => {
    if (
      newCustomerOption &&
      !customers.some((customer) => customer.id === newCustomerOption.id)
    ) {
      return [newCustomerOption, ...customers];
    }

    return customers;
  }, [customers, newCustomerOption]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        {items.map((item) => (
          <article
            key={item.productId}
            className="rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/70 to-white/30 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-md"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap gap-2">
                  <p className="truncate text-sm font-semibold text-zinc-950">{item.name}</p>
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

              <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
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
                  Máximo disponível agora: {item.availableQuantity}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-4 rounded-[1.75rem] border border-white/40 bg-black/5 p-4 sm:p-5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.03)] backdrop-blur-sm">
        <div className="rounded-[1.35rem] border border-white/60 bg-gradient-to-br from-white/80 to-white/40 px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-md">
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-900">Cliente da venda</p>
            <Button
              type="button"
              variant="outline"
              className="mt-2 rounded-2xl border border-rose-200/80 bg-gradient-to-b from-rose-50/80 to-rose-100/30 text-rose-900 shadow-[0_4px_12px_rgba(225,29,72,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md hover:from-rose-100/90 hover:to-rose-100/50 active:scale-[0.98] active:shadow-inner transition-all"
              onClick={() => setIsCreatingCustomer((current) => !current)}
            >
              {isCreatingCustomer ? "Fechar cadastro" : "Cadastrar novo cliente"}
            </Button>
          </div>
        </div>

        {isCreatingCustomer ? (
          <CustomerQuickCreateForm
            className="border-white/60 bg-white/82"
            submitLabel="Salvar cliente"
            title="Novo cliente"
            onSuccess={({ customerId, customerName }) => {
              if (customerId && customerName) {
                setSelectedCustomerId(customerId);
                setNewCustomerOption({
                  id: customerId,
                  name: customerName,
                });
              }

              setIsCreatingCustomer(false);
            }}
          />
        ) : null}

        <form action={formAction} className="grid gap-4">
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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">Cliente cadastrado</span>
              <div className="relative">
                <select
                  name="customerId"
                  value={selectedCustomerId}
                  onChange={(event) => setSelectedCustomerId(event.target.value)}
                  className="h-11 w-full appearance-none rounded-2xl border border-white/70 bg-gradient-to-b from-white/80 to-white/30 px-4 pr-11 text-sm font-medium text-zinc-800 shadow-[0_4px_12px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md outline-none transition-all hover:from-white/90 hover:to-white/50 focus:border-rose-300 focus:ring-4 focus:ring-rose-200/50"
                >
                  <option value="">Sem cliente cadastrado</option>
                  {customerOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                </svg>
              </div>
            </label>

            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">Nome do cliente no recibo</span>
              <input
                name="customerName"
                type="text"
                disabled={selectedCustomerId.length > 0}
                placeholder={
                  selectedCustomerId.length > 0
                    ? "Usando o cliente selecionado acima"
                    : "Opcional para consumidor final"
                }
                className="h-11 rounded-2xl border border-white/50 bg-white/40 px-4 text-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md outline-none transition-all focus:bg-white/60 focus:border-rose-300 focus:ring-4 focus:ring-rose-200/50 hover:bg-white/50 disabled:cursor-not-allowed disabled:bg-zinc-100/50 disabled:text-zinc-500"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">Desconto da venda</span>
              <input
                name="discount"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
                className="h-11 rounded-2xl border border-white/50 bg-white/40 px-4 text-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md outline-none transition-all focus:bg-white/60 focus:border-rose-300 focus:ring-4 focus:ring-rose-200/50 hover:bg-white/50"
              />
            </label>

            <div className="rounded-2xl border border-rose-200/60 bg-gradient-to-br from-rose-50/80 to-rose-100/30 p-4 shadow-[inset_0_2px_8px_rgba(225,29,72,0.04)] backdrop-blur-sm">
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
                  className={state.status === "success" ? "text-emerald-700" : "text-rose-600"}
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
                className="rounded-2xl bg-gradient-to-b from-emerald-600 to-emerald-800 border border-emerald-700/80 px-5 text-white shadow-[0_4px_12px_rgba(4,120,87,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:from-emerald-500 hover:to-emerald-700 active:scale-[0.98] active:shadow-inner transition-all"
              >
                {pending ? "Registrando venda..." : "Finalizar venda"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CartPanel({ customers, isAdmin = false }: CartPanelProps) {
  const items = useCartStore((state) => state.items);
  const incrementItem = useCartStore((state) => state.incrementItem);
  const decrementItem = useCartStore((state) => state.decrementItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const [dismissedReceiptId, setDismissedReceiptId] = useState<string | null>(null);
  const [cancelTargetReceiptId, setCancelTargetReceiptId] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState<CheckoutActionState, FormData>(
    checkoutAction,
    initialCheckoutActionState,
  );
  const [cancelState, cancelFormAction, cancelPending] = useActionState(
    cancelSaleAction,
    initialTransactionHistoryActionState,
  );
  const latestReceipt = state.receipt ?? null;
  const dismissLatestReceipt = useEffectEvent((receiptId: string) => {
    setDismissedReceiptId(receiptId);
  });

  useEffect(() => {
    if (state.status === "success") {
      clearCart();
    }
  }, [clearCart, state.status]);

  useEffect(() => {
    if (items.length > 0 && latestReceipt && dismissedReceiptId !== latestReceipt.id) {
      dismissLatestReceipt(latestReceipt.id);
    }
  }, [dismissedReceiptId, items.length, latestReceipt]);

  const activeReceipt =
    latestReceipt &&
    dismissedReceiptId !== latestReceipt.id &&
    !(cancelState.status === "success" && cancelTargetReceiptId === latestReceipt.id)
      ? latestReceipt
      : null;

  return (
    <section className="grid gap-4 rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/60 to-white/20 p-4 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-2xl">
      <div className="mb-1 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">Carrinho e checkout</h2>
        </div>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-rose-700">
          {items.length} item(ns)
        </span>
      </div>

      {!activeReceipt && items.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-rose-300/50 bg-gradient-to-b from-rose-50/50 to-transparent backdrop-blur-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] px-5 py-10 text-center">
          <p className="text-base font-medium text-zinc-800">Nenhum item no carrinho.</p>
          <p className="mt-2 text-sm text-zinc-600">
            Use os botões do catálogo para montar a venda.
          </p>
        </div>
      ) : null}

      {!activeReceipt && items.length > 0 ? (
        <CartCheckoutContent
          key={state.status === "success" ? state.transactionId ?? state.message : "active-cart"}
          customers={customers}
          decrementItem={decrementItem}
          formAction={formAction}
          incrementItem={incrementItem}
          items={items}
          pending={pending}
          removeItem={removeItem}
          state={state}
        />
      ) : null}

      {!activeReceipt && cancelState.message ? (
        <div aria-live="polite" className="min-h-6 text-sm">
          <p className={cancelState.status === "success" ? "text-emerald-700" : "text-rose-600"}>
            {cancelState.message}
          </p>
        </div>
      ) : null}

      {activeReceipt ? (
        <div className="grid gap-4">
          <SaleReceipt receipt={activeReceipt} />

          <div className={isAdmin ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"}>
            <Button
              type="button"
              size="lg"
              disabled={cancelPending}
              className="rounded-2xl bg-gradient-to-b from-emerald-600 to-emerald-800 border border-emerald-700/80 text-white shadow-[0_4px_12px_rgba(4,120,87,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:from-emerald-500 hover:to-emerald-700 active:scale-[0.98] active:shadow-inner transition-all"
              onClick={() => {
                if (activeReceipt) {
                  setDismissedReceiptId(activeReceipt.id);
                }
              }}
            >
              Nova venda
            </Button>

            {isAdmin ? <form action={cancelFormAction}>
              <input type="hidden" name="transactionId" value={activeReceipt.id} />
              <Button
                type="submit"
                size="lg"
                variant="outline"
                disabled={cancelPending}
                className="w-full rounded-2xl border border-rose-200/80 bg-gradient-to-b from-rose-50/80 to-rose-100/30 text-rose-900 shadow-[0_4px_12px_rgba(225,29,72,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md hover:from-rose-100/90 hover:to-rose-100/50 active:scale-[0.98] active:shadow-inner transition-all"
                onClick={(event) => {
                  if (
                    !window.confirm(
                      "Cancelar a última venda exibida? O estoque será devolvido e o lançamento será removido.",
                    )
                  ) {
                    event.preventDefault();
                    return;
                  }

                  setCancelTargetReceiptId(activeReceipt.id);
                }}
              >
                {cancelPending ? "Cancelando venda..." : "Cancelar última venda"}
              </Button>
            </form> : null}
          </div>

          {cancelState.status === "error" ? (
            <div aria-live="polite" className="min-h-6 text-sm">
              <p className="text-rose-600">{cancelState.message}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
