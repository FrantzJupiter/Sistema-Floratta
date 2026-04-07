"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  customerSchema,
  initialCustomerCreateActionState,
  type CustomerCreateActionState,
} from "@/lib/validations/customer";

function mapCustomerError(error: { code?: string; message: string }) {
  if (
    error.code === "42P01" ||
    (error.message.includes("relation") && error.message.includes("customers"))
  ) {
    return "A estrutura de clientes ainda nao foi instalada no Supabase. Rode o arquivo docs/supabase-customers-receipt.sql no SQL Editor.";
  }

  return error.message || "Nao foi possivel cadastrar o cliente.";
}

export async function createCustomerAction(
  prevState: CustomerCreateActionState = initialCustomerCreateActionState,
  formData: FormData,
): Promise<CustomerCreateActionState> {
  void prevState;

  const parsedCustomer = customerSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsedCustomer.success) {
    return {
      status: "error",
      message: parsedCustomer.error.issues[0]?.message ?? "Revise os dados do cliente.",
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: parsedCustomer.data.name,
    })
    .select("id, name")
    .single();

  if (error || !data) {
    return {
      status: "error",
      message: error ? mapCustomerError(error) : "Nao foi possivel cadastrar o cliente.",
    };
  }

  revalidatePath("/");

  return {
    status: "success",
    message: `Cliente ${data.name} cadastrado com sucesso.`,
    customerId: data.id,
  };
}
