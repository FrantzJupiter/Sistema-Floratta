"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  initialLoginActionState,
  loginSchema,
  type LoginActionState,
} from "@/lib/validations/auth";

function mapLoginError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("email not confirmed")
  ) {
    return "E-mail ou senha inválidos.";
  }

  if (normalizedMessage.includes("rate limit")) {
    return "Muitas tentativas de acesso. Aguarde alguns instantes e tente novamente.";
  }

  return "Não foi possível entrar agora. Tente novamente.";
}

export async function loginAction(
  _prevState: LoginActionState = initialLoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  void _prevState;

  const parsedLogin = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsedLogin.success) {
    return {
      status: "error",
      message: "Revise os dados de acesso antes de continuar.",
      fieldErrors: parsedLogin.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsedLogin.data.email,
    password: parsedLogin.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: mapLoginError(error.message),
    };
  }

  redirect("/");
}

export async function signOutAction() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}
