import { z } from "zod";

import { getCpfDigits } from "@/lib/formatters/cpf";
import { getPhoneDigits } from "@/lib/formatters/phone";

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe ao menos 2 caracteres para o nome do cliente.")
    .max(120, "O nome do cliente deve ter no máximo 120 caracteres."),
  cpf: z
    .string()
    .trim()
    .max(18, "O CPF deve ter no máximo 18 caracteres.")
    .refine((value) => !value || getCpfDigits(value).length === 11, "Informe um CPF válido.")
    .optional()
    .default(""),
  address: z
    .string()
    .trim()
    .max(255, "O endereço deve ter no máximo 255 caracteres.")
    .optional()
    .default(""),
  phone: z
    .string()
    .trim()
    .max(30, "O telefone deve ter no máximo 30 caracteres.")
    .refine(
      (value) => !value || getPhoneDigits(value).length === 11,
      "Informe um telefone válido.",
    )
    .optional()
    .default(""),
});

export const customerUpdateSchema = customerSchema.extend({
  customerId: z.uuid("Cliente inválido para atualização."),
});

export const customerDeleteSchema = z.object({
  customerId: z.uuid("Cliente inválido para exclusão."),
});

export type CustomerCreateActionState = {
  status: "idle" | "success" | "error";
  message: string;
  customerId?: string;
  customerName?: string;
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
