"use server";

import { createAutomaticSku } from "@/lib/products/catalog";
import { revalidateProductSurfaces } from "@/lib/revalidate-routes";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  initialProductDeleteActionState,
  parseVariantAttributes,
  productCreateSchema,
  productDeleteSchema,
  productUpdateSchema,
  type ProductDeleteActionState,
  type ProductActionState,
} from "@/lib/validations/product";

function getProductFormInput(formData: FormData) {
  return {
    name: formData.get("name"),
    productType: formData.get("productType"),
    basePrice: formData.get("basePrice"),
    quantity: formData.get("quantity"),
    imageUrl: formData.get("imageUrl") ?? "",
    attributesJson: formData.get("attributesJson") ?? "",
  };
}

async function upsertProductMetadata(
  productId: string,
  attributes: Record<string, string | number | boolean | null>,
) {
  const supabase = createAdminClient();
  const { data: metadataRows, error: metadataRowsError } = await supabase
    .from("variant_metadata")
    .select("id")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (metadataRowsError) {
    return {
      error: `Nao foi possivel carregar os metadados atuais: ${metadataRowsError.message}`,
    } as const;
  }

  if (!metadataRows.length) {
    const { error: insertError } = await supabase.from("variant_metadata").insert({
      product_id: productId,
      attributes,
    });

    if (insertError) {
      return {
        error: `Nao foi possivel salvar os metadados: ${insertError.message}`,
      } as const;
    }

    return { error: null } as const;
  }

  const [currentRow, ...staleRows] = metadataRows;

  const { error: updateError } = await supabase
    .from("variant_metadata")
    .update({ attributes })
    .eq("id", currentRow.id);

  if (updateError) {
    return {
      error: `Nao foi possivel atualizar os metadados: ${updateError.message}`,
    } as const;
  }

  if (staleRows.length) {
    await supabase
      .from("variant_metadata")
      .delete()
      .in(
        "id",
        staleRows.map((row) => row.id),
      );
  }

  return { error: null } as const;
}

export async function createProductAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsedInput = productCreateSchema.safeParse(getProductFormInput(formData));

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
      message: `Nao foi possivel criar o produto: ${productErrorMessage ?? "nao foi possivel gerar um ID unico para o produto."}`,
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

  revalidateProductSurfaces();

  return {
    status: "success",
    message: `${createdProduct.name} foi cadastrado com sucesso com o ID ${createdProduct.sku}.`,
  };
}

export async function updateProductAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const parsedInput = productUpdateSchema.safeParse({
    productId: formData.get("productId"),
    ...getProductFormInput(formData),
  });

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

  const { data: product, error: productLookupError } = await supabase
    .from("products")
    .select("id, name, sku")
    .eq("id", parsedInput.data.productId)
    .maybeSingle();

  if (productLookupError || !product) {
    return {
      status: "error",
      message: "O produto nao foi encontrado para atualizacao.",
    };
  }

  const { error: productUpdateError } = await supabase
    .from("products")
    .update({
      name: parsedInput.data.name.trim(),
      base_price: parsedInput.data.basePrice,
      image_url: imageUrl,
    })
    .eq("id", parsedInput.data.productId);

  if (productUpdateError) {
    return {
      status: "error",
      message: `Nao foi possivel atualizar o produto: ${productUpdateError.message}`,
    };
  }

  const { error: inventoryUpdateError } = await supabase
    .from("inventory_levels")
    .update({
      quantity: parsedInput.data.quantity,
    })
    .eq("product_id", parsedInput.data.productId);

  if (inventoryUpdateError) {
    return {
      status: "error",
      message: `O produto foi atualizado, mas o estoque nao pode ser salvo: ${inventoryUpdateError.message}`,
    };
  }

  const metadataResult = await upsertProductMetadata(
    parsedInput.data.productId,
    parsedAttributes.data ?? { tipo_produto: parsedInput.data.productType },
  );

  if (metadataResult.error) {
    return {
      status: "error",
      message: metadataResult.error,
    };
  }

  revalidateProductSurfaces();

  return {
    status: "success",
    message: `${parsedInput.data.name.trim()} foi atualizado com sucesso.`,
  };
}

export async function deleteProductAction(
  prevState: ProductDeleteActionState = initialProductDeleteActionState,
  formData: FormData,
): Promise<ProductDeleteActionState> {
  void prevState;

  const parsedInput = productDeleteSchema.safeParse({
    productId: formData.get("productId"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message:
        parsedInput.error.issues[0]?.message ?? "Produto invalido para exclusao.",
    };
  }

  const supabase = createAdminClient();
  const { data: product, error: productLookupError } = await supabase
    .from("products")
    .select("id, name")
    .eq("id", parsedInput.data.productId)
    .maybeSingle();

  if (productLookupError || !product) {
    return {
      status: "error",
      message: "O produto nao foi encontrado para exclusao.",
    };
  }

  const { count, error: transactionItemsError } = await supabase
    .from("transaction_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", parsedInput.data.productId);

  if (transactionItemsError) {
    return {
      status: "error",
      message: `Nao foi possivel verificar o historico do produto: ${transactionItemsError.message}`,
    };
  }

  if ((count ?? 0) > 0) {
    return {
      status: "error",
      message:
        "Este produto ja foi usado em vendas registradas e nao pode ser excluido sem preservar o historico.",
    };
  }

  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", parsedInput.data.productId);

  if (deleteError) {
    const fallbackMessage =
      deleteError.code === "23503"
        ? "Este produto possui relacoes ativas e nao pode ser excluido agora."
        : deleteError.message;

    return {
      status: "error",
      message: `Nao foi possivel excluir o produto: ${fallbackMessage}`,
    };
  }

  revalidateProductSurfaces();

  return {
    status: "success",
    message: `${product.name} foi excluido com sucesso.`,
  };
}
