"use server";

import { revalidatePath } from "next/cache";

import { createAutomaticSku } from "@/lib/products/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseVariantAttributes,
  productCreateSchema,
  type ProductActionState,
} from "@/lib/validations/product";

export async function createProductAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const rawInput = {
    name: formData.get("name"),
    productType: formData.get("productType"),
    basePrice: formData.get("basePrice"),
    quantity: formData.get("quantity"),
    imageUrl: formData.get("imageUrl") ?? "",
    attributesJson: formData.get("attributesJson") ?? "",
  };

  const parsedInput = productCreateSchema.safeParse(rawInput);

  if (!parsedInput.success) {
    return {
      status: "error",
      message: "Revise os campos destacados antes de salvar.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  const parsedAttributes = parseVariantAttributes(
    parsedInput.data.attributesJson,
    parsedInput.data.productType,
  );

  if (parsedAttributes.error) {
    return {
      status: "error",
      message: parsedAttributes.error,
      fieldErrors: {
        attributesJson: [parsedAttributes.error],
      },
    };
  }

  const supabase = createAdminClient();

  const imageUrl = parsedInput.data.imageUrl || null;
  let createdProduct:
    | {
        id: string;
        name: string;
        sku: string;
      }
    | null = null;
  let productErrorMessage: string | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const generatedSku = createAutomaticSku(parsedInput.data.productType);

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: parsedInput.data.name.trim(),
        sku: generatedSku,
        base_price: parsedInput.data.basePrice,
        image_url: imageUrl,
      })
      .select("id, name, sku")
      .single();

    if (!error && data) {
      createdProduct = data;
      break;
    }

    if (error?.code !== "23505") {
      productErrorMessage = error?.message ?? "erro desconhecido";
      break;
    }
  }

  if (!createdProduct) {
    return {
      status: "error",
      message: `Nao foi possivel criar o produto: ${productErrorMessage ?? "nao foi possivel gerar um SKU unico."}`,
    };
  }

  const cleanupCreatedProduct = async () => {
    await supabase.from("variant_metadata").delete().eq("product_id", createdProduct.id);
    await supabase.from("inventory_levels").delete().eq("product_id", createdProduct.id);
    await supabase.from("products").delete().eq("id", createdProduct.id);
  };

  const { error: inventoryError } = await supabase.from("inventory_levels").insert({
    product_id: createdProduct.id,
    quantity: parsedInput.data.quantity,
  });

  if (inventoryError) {
    await cleanupCreatedProduct();

    return {
      status: "error",
      message: `O produto foi revertido porque o estoque nao pode ser criado: ${inventoryError.message}`,
    };
  }

  if (parsedAttributes.data) {
    const { error: metadataError } = await supabase.from("variant_metadata").insert({
      product_id: createdProduct.id,
      attributes: parsedAttributes.data,
    });

    if (metadataError) {
      await cleanupCreatedProduct();

      return {
        status: "error",
        message: `O produto foi revertido porque os metadados nao puderam ser salvos: ${metadataError.message}`,
      };
    }
  }

  revalidatePath("/");

  return {
    status: "success",
    message: `${createdProduct.name} foi cadastrado com sucesso com o SKU ${createdProduct.sku}.`,
  };
}
