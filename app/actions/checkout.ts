"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSaleReceipt } from "@/services/transactions";
import {
  checkoutSchema,
  initialCheckoutActionState,
  type CheckoutActionState,
} from "@/lib/validations/checkout";

function mapCheckoutRpcError(error: { code?: string; message: string }) {
  if (
    error.code === "PGRST202" ||
    error.message.includes("Could not find the function public.process_checkout")
  ) {
    return "A funcao atomica de checkout com clientes ainda nao foi instalada no Supabase. Rode o arquivo docs/supabase-customers-receipt.sql no SQL Editor.";
  }

  return error.message || "Nao foi possivel registrar a venda.";
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
      message: "Nao foi possivel ler os itens do carrinho.",
    };
  }

  let parsedPayload: unknown;

  try {
    parsedPayload = JSON.parse(cartPayload);
  } catch {
    return {
      status: "error",
      message: "O carrinho foi enviado em um formato invalido.",
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
  const rpcCartItems = parsedCheckout.data.items.map((item) => ({
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

  revalidatePath("/");

  return {
    status: "success",
    message: `Venda concluida com sucesso. Pedido ${checkoutResult.transaction_id.slice(0, 8).toUpperCase()}.`,
    receipt,
    transactionId: checkoutResult.transaction_id,
    subtotalAmount: Number(checkoutResult.subtotal_amount),
    totalAmount: Number(checkoutResult.total_amount),
  };
}
