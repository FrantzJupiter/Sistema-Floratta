"use client";

import { useActionState } from "react";

import { createCustomerAction } from "@/app/actions/customers";
import { Button } from "@/components/ui/button";
import {
  initialCustomerCreateActionState,
  type CustomerCreateActionState,
} from "@/lib/validations/customer";

function CustomerQuickCreateFormFields({
  formAction,
  pending,
  state,
}: {
  formAction: (payload: FormData) => void;
  pending: boolean;
  state: CustomerCreateActionState;
}) {
  return (
    <form
      key={state.status === "success" ? state.message : "customer-quick-create-form"}
      action={formAction}
      className="grid gap-3 rounded-[1.5rem] border border-white/55 bg-white/72 p-4 shadow-sm"
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-zinc-950">Cadastro rapido de cliente</h3>
        <p className="text-xs leading-5 text-zinc-600">
          Salve um cliente pelo nome para reutilizar nas proximas vendas.
        </p>
      </div>

      <label className="grid gap-2 text-sm text-zinc-700">
        <span className="font-medium">Nome do cliente</span>
        <input
          name="name"
          type="text"
          placeholder="Ex.: Maria Flor"
          className="h-11 rounded-2xl border border-white/45 bg-white/75 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
        />
      </label>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="min-h-5 text-xs">
          {state.message ? (
            <p className={state.status === "success" ? "text-emerald-700" : "text-rose-600"}>
              {state.message}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          variant="outline"
          disabled={pending}
          className="rounded-2xl border-rose-200 bg-rose-50/70 text-rose-900 hover:bg-rose-100"
        >
          {pending ? "Salvando cliente..." : "Cadastrar cliente"}
        </Button>
      </div>
    </form>
  );
}

export function CustomerQuickCreateForm() {
  const [state, formAction, pending] = useActionState<CustomerCreateActionState, FormData>(
    createCustomerAction,
    initialCustomerCreateActionState,
  );

  return (
    <CustomerQuickCreateFormFields
      formAction={formAction}
      pending={pending}
      state={state}
    />
  );
}
