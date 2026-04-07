import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, Tables } from "@/lib/supabase";

export type CatalogProduct = Tables<"products"> & {
  inventory: Tables<"inventory_levels"> | null;
  variantAttributes: Json | null;
};

export async function listCatalogProducts() {
  const supabase = createAdminClient();

  const [productsResult, inventoryResult, metadataResult] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("inventory_levels").select("*"),
    supabase.from("variant_metadata").select("product_id, attributes, created_at"),
  ]);

  if (productsResult.error) {
    throw new Error(`Falha ao carregar produtos: ${productsResult.error.message}`);
  }

  if (inventoryResult.error) {
    throw new Error(`Falha ao carregar estoque: ${inventoryResult.error.message}`);
  }

  if (metadataResult.error) {
    throw new Error(
      `Falha ao carregar detalhes dos produtos: ${metadataResult.error.message}`,
    );
  }

  const inventoryByProductId = new Map(
    inventoryResult.data.map((inventory) => [inventory.product_id, inventory]),
  );

  const metadataByProductId = new Map<string, Json>();

  metadataResult.data
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .forEach((metadata) => {
      if (metadata.product_id && !metadataByProductId.has(metadata.product_id)) {
        metadataByProductId.set(metadata.product_id, metadata.attributes);
      }
    });

  return productsResult.data.map<CatalogProduct>((product) => ({
    ...product,
    inventory: inventoryByProductId.get(product.id) ?? null,
    variantAttributes: metadataByProductId.get(product.id) ?? null,
  }));
}
