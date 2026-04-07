import { z } from "zod";

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe ao menos 2 caracteres para o nome do cliente.")
    .max(120, "O nome do cliente deve ter no maximo 120 caracteres."),
});

export const customerUpdateSchema = customerSchema.extend({
  customerId: z.uuid("Cliente invalido para atualizacao."),
});

export const customerDeleteSchema = z.object({
  customerId: z.uuid("Cliente invalido para exclusao."),
});

export type CustomerCreateActionState = {
  status: "idle" | "success" | "error";
  message: string;
  customerId?: string;
};

export type CustomerDeleteActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialCustomerCreateActionState: CustomerCreateActionState = {
  status: "idle",
  message: "",
};

export const initialCustomerDeleteActionState: CustomerDeleteActionState = {
  status: "idle",
  message: "",
};
