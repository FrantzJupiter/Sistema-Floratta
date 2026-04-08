"use server";

import { z } from "zod";

import { revalidateSalesSurfaces } from "@/lib/revalidate-routes";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  initialTransactionHistoryActionState,
  type TransactionHistoryActionState,
} from "@/lib/validations/transactions";
import {
  getInventoryMovementWarning,
  recordInventoryMovements,
} from "@/services/inventory";

const transactionIdSchema = z.string().uuid("Venda inválida para cancelamento.");

type InventoryRestoreSnapshot = {
  originalQuantity: number;
  productId: string;
  restoredQuantity: number;
};

async function rollbackInventoryRestore(snapshots: InventoryRestoreSnapshot[]) {
  if (!snapshots.length) {
    return;
  }

  const supabase = createAdminClient();

  await Promise.all(
    snapshots.map((snapshot) =>
      supabase
        .from("inventory_levels")
        .update({ quantity: snapshot.originalQuantity })
        .eq("product_id", snapshot.productId),
    ),
  );
}

export async function cancelSaleAction(
  prevState: TransactionHistoryActionState = initialTransactionHistoryActionState,
  formData: FormData,
): Promise<TransactionHistoryActionState> {
  void prevState;

  const parsedTransactionId = transactionIdSchema.safeParse(
    formData.get("transactionId"),
  );

  if (!parsedTransactionId.success) {
    return {
      status: "error",
      message:
        parsedTransactionId.error.issues[0]?.message ??
        "Não foi possível identificar a venda a cancelar.",
    };
  }

  const transactionId = parsedTransactionId.data;
  const supabase = createAdminClient();

  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .select("id")
    .eq("id", transactionId)
    .maybeSingle();

  if (transactionError) {
    return {
      status: "error",
      message: `Não foi possível localizar a venda: ${transactionError.message}`,
    };
  }

  if (!transaction) {
    return {
      status: "error",
      message: "A venda selecionada já não existe mais.",
    };
  }

  const { data: transactionItems, error: transactionItemsError } = await supabase
    .from("transaction_items")
    .select("product_id, quantity")
    .eq("transaction_id", transactionId);

  if (transactionItemsError) {
    return {
      status: "error",
      message: `Não foi possível carregar os itens da venda: ${transactionItemsError.message}`,
    };
  }

  const groupedQuantities = new Map<string, number>();

  for (const item of transactionItems) {
    if (!item.product_id) {
      continue;
    }

    groupedQuantities.set(
      item.product_id,
      (groupedQuantities.get(item.product_id) ?? 0) + item.quantity,
    );
  }

  const productIds = Array.from(groupedQuantities.keys());

  if (!productIds.length) {
    return {
      status: "error",
      message: "A venda não possui itens válidos para cancelamento.",
    };
  }

  const { data: inventoryRows, error: inventoryError } = await supabase
    .from("inventory_levels")
    .select("product_id, quantity")
    .in("product_id", productIds);

  if (inventoryError) {
    return {
      status: "error",
      message: `Não foi possível carregar o estoque da venda: ${inventoryError.message}`,
    };
  }

  const inventoryByProductId = new Map(
    (inventoryRows ?? []).map((row) => [row.product_id, row.quantity]),
  );

  const restoreSnapshots: InventoryRestoreSnapshot[] = [];

  try {
    for (const productId of productIds) {
      const originalQuantity = inventoryByProductId.get(productId);

      if (typeof originalQuantity !== "number") {
        throw new Error(`O estoque do produto ${productId} não foi encontrado.`);
      }

      restoreSnapshots.push({
        productId,
        originalQuantity,
        restoredQuantity: originalQuantity + (groupedQuantities.get(productId) ?? 0),
      });
    }
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível preparar o cancelamento da venda.",
    };
  }

  const appliedSnapshots: InventoryRestoreSnapshot[] = [];

  try {
    for (const snapshot of restoreSnapshots) {
      const { error: updateError } = await supabase
        .from("inventory_levels")
        .update({ quantity: snapshot.restoredQuantity })
        .eq("product_id", snapshot.productId);

      if (updateError) {
        throw new Error(
          `Não foi possível restaurar o estoque do produto ${snapshot.productId}: ${updateError.message}`,
        );
      }

      appliedSnapshots.push(snapshot);
    }
  } catch (error) {
    await rollbackInventoryRestore(appliedSnapshots);

    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível restaurar o estoque da venda cancelada.",
    };
  }

  const { error: deleteTransactionError } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);

  if (deleteTransactionError) {
    await rollbackInventoryRestore(appliedSnapshots);

    return {
      status: "error",
      message: `Não foi possível cancelar a venda: ${deleteTransactionError.message}`,
    };
  }

  const movementWarning = getInventoryMovementWarning(
    await recordInventoryMovements(
      productIds.map((productId) => ({
        movement_type: "adjustment",
        product_id: productId,
        quantity_delta: groupedQuantities.get(productId) ?? 0,
        transaction_id: null,
      })),
    ),
  );

  revalidateSalesSurfaces();

  return {
    status: "success",
    message: `Venda ${transactionId.slice(0, 8).toUpperCase()} cancelada com sucesso.${
      movementWarning ? ` ${movementWarning}` : ""
    }`,
  };
}

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
