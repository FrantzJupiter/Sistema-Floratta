"use server";

import { revalidateSalesSurfaces } from "@/lib/revalidate-routes";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkoutSchema,
  initialCheckoutActionState,
  type CheckoutActionState,
} from "@/lib/validations/checkout";
import {
  getInventoryMovementWarning,
  recordInventoryMovements,
} from "@/services/inventory";
import { getSaleReceipt } from "@/services/transactions";

function mapCheckoutRpcError(error: { code?: string; message: string }) {
  if (
    error.code === "PGRST202" ||
    error.message.includes("Could not find the function public.process_checkout")
  ) {
    return "A função atômica de checkout com clientes ainda não foi instalada no Supabase. Rode o arquivo docs/supabase-customers-receipt.sql no SQL Editor.";
  }

  return error.message || "Não foi possível registrar a venda.";
}

function normalizeCheckoutItems(
  items: {
    productId: string;
    quantity: number;
  }[],
) {
  const itemsByProductId = new Map<string, number>();

  items.forEach((item) => {
    itemsByProductId.set(
      item.productId,
      (itemsByProductId.get(item.productId) ?? 0) + item.quantity,
    );
  });

  return Array.from(itemsByProductId.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

export async function checkoutAction(
  prevState: CheckoutActionState = initialCheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  void prevState;

  const cartPayload = formData.get("cartPayload");

  if (typeof cartPayload !== "string") {
    return {
      status: "error",
      message: "Não foi possível ler os itens do carrinho.",
    };
  }

  let parsedPayload: unknown;

  try {
    parsedPayload = JSON.parse(cartPayload);
  } catch {
    return {
      status: "error",
      message: "O carrinho foi enviado em um formato inválido.",
    };
  }

  const parsedCheckout = checkoutSchema.safeParse({
    customerId: formData.get("customerId") ?? "",
    customerName: formData.get("customerName") ?? "",
    discount: formData.get("discount") ?? 0,
    items: parsedPayload,
  });

  if (!parsedCheckout.success) {
    return {
      status: "error",
      message: parsedCheckout.error.issues[0]?.message ?? "Revise os dados do checkout.",
    };
  }

  const supabase = createAdminClient();
  const normalizedItems = normalizeCheckoutItems(parsedCheckout.data.items);
  const rpcCartItems = normalizedItems.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
  }));

  const { data, error } = await supabase.rpc("process_checkout", {
    p_cart_items: rpcCartItems,
    p_customer_id: parsedCheckout.data.customerId || null,
    p_customer_name: parsedCheckout.data.customerName || null,
    p_discount_amount: parsedCheckout.data.discount,
    p_employee_id: null,
  });

  if (error) {
    return {
      status: "error",
      message: mapCheckoutRpcError(error),
    };
  }

  const checkoutResult = data[0];

  if (!checkoutResult) {
    return {
      status: "error",
      message: "O checkout foi processado, mas a resposta do banco veio vazia.",
    };
  }

  const receipt = await getSaleReceipt(checkoutResult.transaction_id);
  const movementWarning = getInventoryMovementWarning(
    await recordInventoryMovements(
      normalizedItems.map((item) => ({
        movement_type: "sale",
        product_id: item.productId,
        quantity_delta: -item.quantity,
        transaction_id: checkoutResult.transaction_id,
      })),
    ),
  );

  revalidateSalesSurfaces();

  return {
    status: "success",
    message: `Venda concluída com sucesso. Pedido ${checkoutResult.transaction_id
      .slice(0, 8)
      .toUpperCase()}.${movementWarning ? ` ${movementWarning}` : ""}`,
    receipt,
    transactionId: checkoutResult.transaction_id,
    subtotalAmount: Number(checkoutResult.subtotal_amount),
    totalAmount: Number(checkoutResult.total_amount),
  };
}
