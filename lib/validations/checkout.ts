import { z } from "zod";

import type { SaleReceipt } from "@/lib/receipts/types";

export const checkoutCartItemSchema = z.object({
  productId: z.uuid("Produto inválido no carrinho."),
  quantity: z.coerce
    .number()
    .int("Quantidade inválida no carrinho.")
    .positive("A quantidade deve ser maior que zero.")
    .max(999, "Quantidade acima do permitido para uma única venda."),
});

export const checkoutSchema = z.object({
  customerId: z.union([z.literal(""), z.uuid("Cliente inválido na venda.")]),
  customerName: z
    .string()
    .trim()
    .max(120, "O nome do cliente deve ter no máximo 120 caracteres."),
  discount: z.coerce
    .number()
    .min(0, "O desconto não pode ser negativo.")
    .max(999999.99, "Desconto acima do limite permitido."),
  items: z.array(checkoutCartItemSchema).min(1, "O carrinho está vazio."),
});

export type CheckoutActionState = {
  status: "idle" | "success" | "error";
  message: string;
  receipt?: SaleReceipt;
  transactionId?: string;
  subtotalAmount?: number;
  totalAmount?: number;
};

export const initialCheckoutActionState: CheckoutActionState = {
  status: "idle",
  message: "",
};
