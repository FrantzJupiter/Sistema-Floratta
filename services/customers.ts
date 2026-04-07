import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase";

export type RegisteredCustomer = Tables<"customers">;

export async function listCustomers(limit = 200) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name", { ascending: true })
    .limit(limit);

  if (error) {
    if (
      error.code === "42P01" ||
      (error.message.includes("relation") && error.message.includes("customers"))
    ) {
      return [] as RegisteredCustomer[];
    }

    throw new Error(`Falha ao carregar clientes: ${error.message}`);
  }

  return data;
}
