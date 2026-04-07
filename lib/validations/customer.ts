import { z } from "zod";

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe ao menos 2 caracteres para o nome do cliente.")
    .max(120, "O nome do cliente deve ter no maximo 120 caracteres."),
  cpf: z
    .string()
    .trim()
    .max(18, "O CPF deve ter no maximo 18 caracteres.")
    .refine(
      (value) => !value || /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(value),
      "Informe um CPF valido.",
    )
    .optional()
    .default(""),
  address: z
    .string()
    .trim()
    .max(255, "O endereco deve ter no maximo 255 caracteres.")
    .optional()
    .default(""),
  phone: z
    .string()
    .trim()
    .max(30, "O telefone deve ter no maximo 30 caracteres.")
    .optional()
    .default(""),
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
