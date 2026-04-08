"use server";

import { revalidateSalesSurfaces } from "@/lib/revalidate-routes";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  initialTransactionHistoryActionState,
  type TransactionHistoryActionState,
} from "@/lib/validations/transactions";

export async function clearSalesHistoryAction(
  prevState: TransactionHistoryActionState = initialTransactionHistoryActionState,
): Promise<TransactionHistoryActionState> {
  void prevState;

  const supabase = createAdminClient();

  const { count, error: countError } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return {
      status: "error",
      message: `Não foi possível verificar o histórico: ${countError.message}`,
    };
  }

  if (!count) {
    return {
      status: "error",
      message: "Não existem vendas registradas para limpar.",
    };
  }

  const { error: deleteError } = await supabase
    .from("transactions")
    .delete()
    .not("id", "is", null);

  if (deleteError) {
    return {
      status: "error",
      message: `Não foi possível limpar o histórico de vendas: ${deleteError.message}`,
    };
  }

  revalidateSalesSurfaces();

  return {
    status: "success",
    message: `Histórico de ${count} venda(s) limpo com sucesso.`,
  };
}
