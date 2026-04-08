"use server";

import { isAdminEmail } from "@/lib/auth/roles";
import { requireAuthenticatedUser } from "@/lib/auth/user";
import { createAutomaticSku } from "@/lib/products/catalog";
import {
  getProductImageFile,
  removeStoredProductImage,
  uploadProductImage,
  validateProductImageFile,
} from "@/lib/products/images";
import { revalidateProductSurfaces } from "@/lib/revalidate-routes";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildProductDetails,
  initialProductDeleteActionState,
  productCreateSchema,
  productDeleteSchema,
  productUpdateSchema,
  type ProductActionState,
  type ProductDeleteActionState,
} from "@/lib/validations/product";
import {
  getInventoryMovementWarning,
  recordInventoryMovements,
} from "@/services/inventory";

function getProductFormInput(formData: FormData) {
  return {
    name: formData.get("name"),
    detailType: formData.get("detailType") ?? "",
    detailVolume: formData.get("detailVolume") ?? "",
    basePrice: formData.get("basePrice"),
    quantity: formData.get("quantity"),
    imageUrl: formData.get("imageUrl") ?? "",
  };
}

function getImageFieldErrorState(message: string): ProductActionState {
  return {
    status: "error",
    message,
    fieldErrors: {
      imageFile: [message],
      imageCamera: [message],
    },
  };
}

async function upsertProductMetadata(
  productId: string,
  attributes: Record<string, string | number | boolean | null> | null,
) {
  const supabase = createAdminClient();
  const { data: metadataRows, error: metadataRowsError } = await supabase
    .from("variant_metadata")
    .select("id")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (metadataRowsError) {
    return {
      error: `Não foi possível carregar os detalhes atuais: ${metadataRowsError.message}`,
    } as const;
  }

  if (!attributes || !Object.keys(attributes).length) {
    if (metadataRows.length) {
      const { error: deleteError } = await supabase
        .from("variant_metadata")
        .delete()
        .in(
          "id",
          metadataRows.map((row) => row.id),
        );

      if (deleteError) {
        return {
          error: `Não foi possível limpar os detalhes atuais: ${deleteError.message}`,
        } as const;
      }
    }

    return { error: null } as const;
  }

  if (!metadataRows.length) {
    const { error: insertError } = await supabase.from("variant_metadata").insert({
      product_id: productId,
      attributes,
    });

    if (insertError) {
      return {
        error: `Não foi possível salvar os detalhes: ${insertError.message}`,
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
      error: `Não foi possível atualizar os detalhes: ${updateError.message}`,
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
  const user = await requireAuthenticatedUser();

  if (!isAdminEmail(user.email)) {
    return {
      status: "error",
      message: "Apenas administradores podem cadastrar produtos.",
    };
  }

  const parsedInput = productCreateSchema.safeParse(getProductFormInput(formData));

  if (!parsedInput.success) {
    return {
      status: "error",
      message: "Revise os campos destacados antes de salvar.",
      fieldErrors: parsedInput.error.flatten().fieldErrors,
    };
  }

  const productImageFile = getProductImageFile(formData);
  const imageValidationResult = validateProductImageFile(productImageFile);

  if (imageValidationResult.error) {
    return getImageFieldErrorState(imageValidationResult.error);
  }

  const parsedDetails = buildProductDetails({
    detailType: parsedInput.data.detailType,
    detailVolume: parsedInput.data.detailVolume,
  });

  if (parsedDetails.error) {
    return {
      status: "error",
      message: parsedDetails.error,
    };
  }

  const supabase = createAdminClient();

  const imageUrl = productImageFile ? null : parsedInput.data.imageUrl || null;
  let createdProduct:
    | {
        id: string;
        name: string;
        sku: string;
      }
    | null = null;
  let productErrorMessage: string | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const generatedSku = createAutomaticSku(parsedInput.data.detailType);

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
      message: `Não foi possível criar o produto: ${productErrorMessage ?? "não foi possível gerar um ID único para o produto."}`,
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
      message: `O produto foi revertido porque o estoque não pode ser criado: ${inventoryError.message}`,
    };
  }

  if (parsedDetails.data) {
    const { error: metadataError } = await supabase.from("variant_metadata").insert({
      product_id: createdProduct.id,
      attributes: parsedDetails.data,
    });

    if (metadataError) {
      await cleanupCreatedProduct();

      return {
        status: "error",
        message: `O produto foi revertido porque os detalhes não puderam ser salvos: ${metadataError.message}`,
      };
    }
  }

  if (productImageFile) {
    const uploadResult = await uploadProductImage({
      supabase,
      file: productImageFile,
      productId: createdProduct.id,
      productName: createdProduct.name,
      sku: createdProduct.sku,
    });

    if (uploadResult.error || !uploadResult.publicUrl) {
      await cleanupCreatedProduct();

      return getImageFieldErrorState(
        uploadResult.error ?? "Não foi possível enviar a imagem do produto.",
      );
    }

    const { error: imageUpdateError } = await supabase
      .from("products")
      .update({
        image_url: uploadResult.publicUrl,
      })
      .eq("id", createdProduct.id);

    if (imageUpdateError) {
      await removeStoredProductImage(supabase, uploadResult.publicUrl);
      await cleanupCreatedProduct();

      return getImageFieldErrorState(
        `A imagem foi enviada, mas não pode ser vinculada ao produto: ${imageUpdateError.message}`,
      );
    }
  }

  const movementWarning = getInventoryMovementWarning(
    await recordInventoryMovements([
      {
        movement_type: "initial",
        product_id: createdProduct.id,
        quantity_delta: parsedInput.data.quantity,
        transaction_id: null,
      },
    ]),
  );

  revalidateProductSurfaces();

  return {
    status: "success",
    message: `${createdProduct.name} foi cadastrado com sucesso com o ID ${createdProduct.sku}.${movementWarning ? ` ${movementWarning}` : ""}`,
  };
}

export async function updateProductAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const user = await requireAuthenticatedUser();

  if (!isAdminEmail(user.email)) {
    return {
      status: "error",
      message: "Apenas administradores podem editar produtos.",
    };
  }

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

  const productImageFile = getProductImageFile(formData);
  const imageValidationResult = validateProductImageFile(productImageFile);

  if (imageValidationResult.error) {
    return getImageFieldErrorState(imageValidationResult.error);
  }

  const parsedDetails = buildProductDetails({
    detailType: parsedInput.data.detailType,
    detailVolume: parsedInput.data.detailVolume,
  });

  if (parsedDetails.error) {
    return {
      status: "error",
      message: parsedDetails.error,
    };
  }

  const supabase = createAdminClient();

  const [
    { data: product, error: productLookupError },
    { data: inventoryRow, error: inventoryLookupError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, image_url, name, sku")
      .eq("id", parsedInput.data.productId)
      .maybeSingle(),
    supabase
      .from("inventory_levels")
      .select("quantity")
      .eq("product_id", parsedInput.data.productId)
      .maybeSingle(),
  ]);

  if (productLookupError || !product) {
    return {
      status: "error",
      message: "O produto não foi encontrado para atualização.",
    };
  }

  if (inventoryLookupError) {
    return {
      status: "error",
      message: `Não foi possível carregar o estoque atual: ${inventoryLookupError.message}`,
    };
  }

  const previousQuantity = inventoryRow?.quantity ?? 0;
  let finalImageUrl = parsedInput.data.imageUrl || null;
  let uploadedImageUrl: string | null = null;

  if (productImageFile) {
    const uploadResult = await uploadProductImage({
      supabase,
      file: productImageFile,
      productId: product.id,
      productName: parsedInput.data.name.trim(),
      sku: product.sku,
    });

    if (uploadResult.error || !uploadResult.publicUrl) {
      return getImageFieldErrorState(
        uploadResult.error ?? "Não foi possível enviar a nova imagem do produto.",
      );
    }

    uploadedImageUrl = uploadResult.publicUrl;
    finalImageUrl = uploadResult.publicUrl;
  }

  const { error: productUpdateError } = await supabase
    .from("products")
    .update({
      name: parsedInput.data.name.trim(),
      base_price: parsedInput.data.basePrice,
      image_url: finalImageUrl,
    })
    .eq("id", parsedInput.data.productId);

  if (productUpdateError) {
    if (uploadedImageUrl) {
      await removeStoredProductImage(supabase, uploadedImageUrl);
    }

    return {
      status: "error",
      message: `Não foi possível atualizar o produto: ${productUpdateError.message}`,
    };
  }

  const inventoryMutation =
    inventoryRow === null
      ? supabase.from("inventory_levels").insert({
          product_id: parsedInput.data.productId,
          quantity: parsedInput.data.quantity,
        })
      : supabase
          .from("inventory_levels")
          .update({
            quantity: parsedInput.data.quantity,
          })
          .eq("product_id", parsedInput.data.productId);

  const { error: inventoryUpdateError } = await inventoryMutation;

  if (inventoryUpdateError) {
    return {
      status: "error",
      message: `O produto foi atualizado, mas o estoque não pode ser salvo: ${inventoryUpdateError.message}`,
    };
  }

  const metadataResult = await upsertProductMetadata(
    parsedInput.data.productId,
    parsedDetails.data,
  );

  if (metadataResult.error) {
    return {
      status: "error",
      message: metadataResult.error,
    };
  }

  if (product.image_url !== finalImageUrl) {
    await removeStoredProductImage(supabase, product.image_url);
  }

  const quantityDelta = parsedInput.data.quantity - previousQuantity;
  const movementWarning = getInventoryMovementWarning(
    await recordInventoryMovements([
      {
        movement_type: "adjustment",
        product_id: parsedInput.data.productId,
        quantity_delta: quantityDelta,
        transaction_id: null,
      },
    ]),
  );

  revalidateProductSurfaces();

  return {
    status: "success",
    message: `${parsedInput.data.name.trim()} foi atualizado com sucesso.${movementWarning ? ` ${movementWarning}` : ""}`,
  };
}

export async function deleteProductAction(
  prevState: ProductDeleteActionState = initialProductDeleteActionState,
  formData: FormData,
): Promise<ProductDeleteActionState> {
  void prevState;
  const user = await requireAuthenticatedUser();

  if (!isAdminEmail(user.email)) {
    return {
      status: "error",
      message: "Apenas administradores podem excluir produtos.",
    };
  }

  const parsedInput = productDeleteSchema.safeParse({
    productId: formData.get("productId"),
  });

  if (!parsedInput.success) {
    return {
      status: "error",
      message: parsedInput.error.issues[0]?.message ?? "Produto inválido para exclusão.",
    };
  }

  const supabase = createAdminClient();
  const { data: product, error: productLookupError } = await supabase
    .from("products")
    .select("id, image_url, name")
    .eq("id", parsedInput.data.productId)
    .maybeSingle();

  if (productLookupError || !product) {
    return {
      status: "error",
      message: "O produto não foi encontrado para exclusão.",
    };
  }

  const { count, error: transactionItemsError } = await supabase
    .from("transaction_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", parsedInput.data.productId);

  if (transactionItemsError) {
    return {
      status: "error",
      message: `Não foi possível verificar o histórico do produto: ${transactionItemsError.message}`,
    };
  }

  if ((count ?? 0) > 0) {
    return {
      status: "error",
      message:
        "Este produto já foi usado em vendas registradas e não pode ser excluído sem preservar o histórico.",
    };
  }

  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("id", parsedInput.data.productId);

  if (deleteError) {
    const fallbackMessage =
      deleteError.code === "23503"
        ? "Este produto possui relações ativas e não pode ser excluído agora."
        : deleteError.message;

    return {
      status: "error",
      message: `Não foi possível excluir o produto: ${fallbackMessage}`,
    };
  }

  await removeStoredProductImage(supabase, product.image_url);

  revalidateProductSurfaces();

  return {
    status: "success",
    message: `${product.name} foi excluído com sucesso.`,
  };
}
