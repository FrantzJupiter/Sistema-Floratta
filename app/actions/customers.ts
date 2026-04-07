"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidateCustomerSurfaces } from "@/lib/revalidate-routes";
import {
  customerDeleteSchema,
  customerSchema,
  customerUpdateSchema,
  initialCustomerCreateActionState,
  initialCustomerDeleteActionState,
  type CustomerCreateActionState,
  type CustomerDeleteActionState,
} from "@/lib/validations/customer";

function mapCustomerError(error: { code?: string; message: string }) {
  if (
    error.code === "42P01" ||
    (error.message.includes("relation") && error.message.includes("customers"))
  ) {
    return "A estrutura de clientes ainda nao foi instalada no Supabase. Rode o arquivo docs/supabase-customers-receipt.sql no SQL Editor.";
  }

  if (
    error.code === "42703" ||
    error.message.includes("schema cache") ||
    error.message.includes("column")
  ) {
    return "Os novos campos de cliente ainda nao foram instalados no Supabase. Rode o arquivo docs/supabase-customers-contact.sql no SQL Editor.";
  }

  return error.message || "Nao foi possivel cadastrar o cliente.";
}

function getCustomerFormInput(formData: FormData) {
  return {
    name: formData.get("name"),
    cpf: formData.get("cpf") ?? "",
    address: formData.get("address") ?? "",
    phone: formData.get("phone") ?? "",
  };
}

function toNullableString(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

export async function createCustomerAction(
  prevState: CustomerCreateActionState = initialCustomerCreateActionState,
  formData: FormData,
): Promise<CustomerCreateActionState> {
  void prevState;

  const parsedCustomer = customerSchema.safeParse(getCustomerFormInput(formData));

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
      cpf: toNullableString(parsedCustomer.data.cpf),
      address: toNullableString(parsedCustomer.data.address),
      phone: toNullableString(parsedCustomer.data.phone),
    })
    .select("id, name")
    .single();

  if (error || !data) {
    return {
      status: "error",
      message: error ? mapCustomerError(error) : "Nao foi possivel cadastrar o cliente.",
    };
  }

  revalidateCustomerSurfaces();

  return {
    status: "success",
    message: `Cliente ${data.name} cadastrado com sucesso.`,
    customerId: data.id,
  };
}

export async function updateCustomerAction(
  prevState: CustomerCreateActionState = initialCustomerCreateActionState,
  formData: FormData,
): Promise<CustomerCreateActionState> {
  void prevState;

  const parsedCustomer = customerUpdateSchema.safeParse({
    customerId: formData.get("customerId"),
    ...getCustomerFormInput(formData),
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
    .update({
      name: parsedCustomer.data.name,
      cpf: toNullableString(parsedCustomer.data.cpf),
      address: toNullableString(parsedCustomer.data.address),
      phone: toNullableString(parsedCustomer.data.phone),
    })
    .eq("id", parsedCustomer.data.customerId)
    .select("id, name")
    .maybeSingle();

  if (error || !data) {
    return {
      status: "error",
      message: error ? mapCustomerError(error) : "Cliente nao encontrado para atualizacao.",
    };
  }

  revalidateCustomerSurfaces();

  return {
    status: "success",
    message: `Cliente ${data.name} atualizado com sucesso.`,
    customerId: data.id,
  };
}

export async function deleteCustomerAction(
  prevState: CustomerDeleteActionState = initialCustomerDeleteActionState,
  formData: FormData,
): Promise<CustomerDeleteActionState> {
  void prevState;

  const parsedCustomer = customerDeleteSchema.safeParse({
    customerId: formData.get("customerId"),
  });

  if (!parsedCustomer.success) {
    return {
      status: "error",
      message: parsedCustomer.error.issues[0]?.message ?? "Cliente invalido para exclusao.",
    };
  }

  const supabase = createAdminClient();
  const { data: customer, error: lookupError } = await supabase
    .from("customers")
    .select("id, name")
    .eq("id", parsedCustomer.data.customerId)
    .maybeSingle();

  if (lookupError || !customer) {
    return {
      status: "error",
      message: lookupError ? mapCustomerError(lookupError) : "Cliente nao encontrado.",
    };
  }

  const { error: deleteError } = await supabase
    .from("customers")
    .delete()
    .eq("id", parsedCustomer.data.customerId);

  if (deleteError) {
    return {
      status: "error",
      message: `Nao foi possivel excluir o cliente: ${mapCustomerError(deleteError)}`,
    };
  }

  revalidateCustomerSurfaces();

  return {
    status: "success",
    message: `${customer.name} foi excluido com sucesso.`,
  };
}
