import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/lib/supabase";

export type InventoryBalanceSummary = {
  netChange: number;
  positiveChange: number;
  negativeChange: number;
  setupRequired: boolean;
};

export type InventoryMovementType = "adjustment" | "initial" | "sale";

type InventoryMovementEntry = Pick<
  TablesInsert<"inventory_movements">,
  "movement_type" | "product_id" | "quantity_delta" | "transaction_id"
>;

type InventoryMovementResult = {
  error: string | null;
  setupRequired: boolean;
};

function isInventoryMovementsMissingError(error: {
  code?: string | null;
  message: string;
}) {
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.message.includes("inventory_movements") ||
    error.message.includes("schema cache")
  );
}

function getInitialInventoryBalanceSummary(): InventoryBalanceSummary {
  return {
    netChange: 0,
    positiveChange: 0,
    negativeChange: 0,
    setupRequired: false,
  };
}

export function getInventoryMovementWarning(result: InventoryMovementResult) {
  if (result.error) {
    return `O balanço do estoque não foi registrado: ${result.error}`;
  }

  if (result.setupRequired) {
    return "O histórico de balanço ainda não foi instalado no Supabase.";
  }

  return null;
}

export async function listInventoryBalanceSummary(hours = 24) {
  const supabase = createAdminClient();
  const threshold = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const emptySummary = getInitialInventoryBalanceSummary();

  const { data, error } = await supabase
    .from("inventory_movements")
    .select("quantity_delta")
    .gte("created_at", threshold);

  if (error) {
    if (isInventoryMovementsMissingError(error)) {
      return {
        ...emptySummary,
        setupRequired: true,
      } satisfies InventoryBalanceSummary;
    }

    throw new Error(`Falha ao carregar o balanço de estoque: ${error.message}`);
  }

  return (data ?? []).reduce<InventoryBalanceSummary>((summary, movement) => {
    const delta = movement.quantity_delta;

    if (delta > 0) {
      summary.positiveChange += delta;
    } else if (delta < 0) {
      summary.negativeChange += Math.abs(delta);
    }

    summary.netChange += delta;
    return summary;
  }, emptySummary);
}

export async function recordInventoryMovements(entries: InventoryMovementEntry[]) {
  const validEntries = entries.filter((entry) => entry.quantity_delta !== 0);

  if (!validEntries.length) {
    return {
      error: null,
      setupRequired: false,
    } satisfies InventoryMovementResult;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("inventory_movements").insert(validEntries);

  if (!error) {
    return {
      error: null,
      setupRequired: false,
    } satisfies InventoryMovementResult;
  }

  if (isInventoryMovementsMissingError(error)) {
    return {
      error: null,
      setupRequired: true,
    } satisfies InventoryMovementResult;
  }

  return {
    error: error.message,
    setupRequired: false,
  } satisfies InventoryMovementResult;
}
