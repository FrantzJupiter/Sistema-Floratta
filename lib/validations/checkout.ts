import { z } from "zod";

export const checkoutCartItemSchema = z.object({
  productId: z.uuid("Produto invalido no carrinho."),
  quantity: z.coerce
    .number()
    .int("Quantidade invalida no carrinho.")
    .positive("A quantidade deve ser maior que zero.")
    .max(999, "Quantidade acima do permitido para uma unica venda."),
});

export const checkoutSchema = z.object({
  discount: z.coerce
    .number()
    .min(0, "O desconto nao pode ser negativo.")
    .max(999999.99, "Desconto acima do limite permitido."),
  items: z.array(checkoutCartItemSchema).min(1, "O carrinho esta vazio."),
});

export type CheckoutActionState = {
  status: "idle" | "success" | "error";
  message: string;
  transactionId?: string;
  subtotalAmount?: number;
  totalAmount?: number;
};

export const initialCheckoutActionState: CheckoutActionState = {
  status: "idle",
  message: "",
};
