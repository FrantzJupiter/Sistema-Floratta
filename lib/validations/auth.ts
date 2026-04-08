import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe o e-mail de acesso.")
    .email("Informe um e-mail válido."),
  password: z
    .string()
    .min(1, "Informe a senha de acesso.")
    .min(6, "A senha deve ter ao menos 6 caracteres."),
});

export type LoginActionState = {
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
  status: "error" | "idle";
};

export const initialLoginActionState: LoginActionState = {
  status: "idle",
};
