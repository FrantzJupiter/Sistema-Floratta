"use client";

import { useActionState } from "react";

import { clearSalesHistoryAction } from "@/app/actions/transactions";
import { Button } from "@/components/ui/button";
import {
  initialTransactionHistoryActionState,
  type TransactionHistoryActionState,
} from "@/lib/validations/transactions";

type ClearSalesHistoryButtonProps = {
  salesCount: number;
};

export function ClearSalesHistoryButton({
  salesCount,
}: ClearSalesHistoryButtonProps) {
  const [state, formAction, pending] = useActionState<TransactionHistoryActionState, FormData>(
    clearSalesHistoryAction,
    initialTransactionHistoryActionState,
  );

  return (
    <div className="flex flex-col items-start gap-3 sm:items-end">
      <form action={formAction}>
        <Button
          type="submit"
          variant="outline"
          disabled={pending || salesCount === 0}
          className="rounded-2xl border-rose-200 bg-rose-50/70 text-rose-900 hover:bg-rose-100"
          onClick={(event) => {
            if (
              !window.confirm(
                "Limpar todo o histórico de vendas? Essa ação remove os registros de vendas e não pode ser desfeita.",
              )
            ) {
              event.preventDefault();
            }
          }}
        >
          {pending ? "Limpando histórico..." : "Limpar histórico"}
        </Button>
      </form>

      <div aria-live="polite" className="min-h-5 text-xs">
        {state.message ? (
          <p className={state.status === "success" ? "text-emerald-700" : "text-rose-600"}>
            {state.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
