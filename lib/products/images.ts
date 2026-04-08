import type { SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

const PRODUCT_IMAGE_BUCKET = "product-images";
const MAX_PRODUCT_IMAGE_SIZE_BYTES = 900 * 1024;

type AdminSupabaseClient = SupabaseClient<Database>;

function isNonEmptyFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function sanitizePathSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function getFileExtension(file: File) {
  const normalizedName = file.name.toLowerCase();
  const nameExtension = normalizedName.includes(".")
    ? normalizedName.split(".").pop()
    : null;

  if (nameExtension && /^[a-z0-9]+$/.test(nameExtension)) {
    return nameExtension;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  if (file.type === "image/heic") {
    return "heic";
  }

  if (file.type === "image/heif") {
    return "heif";
  }

  return "jpg";
}

async function ensureProductImageBucket(supabase: AdminSupabaseClient) {
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    return {
      error: `Não foi possível carregar os buckets de imagem: ${bucketsError.message}`,
    } as const;
  }

  if (buckets.some((bucket) => bucket.name === PRODUCT_IMAGE_BUCKET)) {
    return { error: null } as const;
  }

  const { error: createBucketError } = await supabase.storage.createBucket(
    PRODUCT_IMAGE_BUCKET,
    {
      public: true,
      fileSizeLimit: MAX_PRODUCT_IMAGE_SIZE_BYTES,
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
      ],
    },
  );

  if (createBucketError) {
    return {
      error: `Não foi possível preparar o bucket de imagens: ${createBucketError.message}`,
    } as const;
  }

  return { error: null } as const;
}

export function getProductImageFile(formData: FormData) {
  const cameraImage = formData.get("imageCamera");
  const uploadedImage = formData.get("imageFile");

  if (isNonEmptyFile(cameraImage)) {
    return cameraImage;
  }

  if (isNonEmptyFile(uploadedImage)) {
    return uploadedImage;
  }

  return null;
}

export function validateProductImageFile(file: File | null) {
  if (!file) {
    return { error: null } as const;
  }

  if (!file.type.startsWith("image/")) {
    return {
      error: "Escolha um arquivo de imagem valido para o produto.",
    } as const;
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
    return {
      error: "A imagem precisa ficar abaixo de 900 KB.",
    } as const;
  }

  return { error: null } as const;
}

export async function uploadProductImage(params: {
  supabase: AdminSupabaseClient;
  file: File;
  productId: string;
  productName: string;
  sku: string;
}) {
  const bucketResult = await ensureProductImageBucket(params.supabase);

  if (bucketResult.error) {
    return { error: bucketResult.error, publicUrl: null, storagePath: null } as const;
  }

  const safeSku = sanitizePathSegment(params.sku) || "produto";
  const safeName = sanitizePathSegment(params.productName) || "imagem";
  const fileExtension = getFileExtension(params.file);
  const storagePath = `${params.productId}/${safeSku}-${safeName}-${crypto.randomUUID()}.${fileExtension}`;

  const fileBytes = new Uint8Array(await params.file.arrayBuffer());

  const { error: uploadError } = await params.supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(storagePath, fileBytes, {
      contentType: params.file.type || "image/jpeg",
      upsert: false,
      cacheControl: "3600",
    });

  if (uploadError) {
    return {
      error: `Não foi possível enviar a imagem do produto: ${uploadError.message}`,
      publicUrl: null,
      storagePath: null,
    } as const;
  }

  const {
    data: { publicUrl },
  } = params.supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(storagePath);

  return {
    error: null,
    publicUrl,
    storagePath,
  } as const;
}

export function getProductImageStoragePath(imageUrl: string | null) {
  if (!imageUrl) {
    return null;
  }

  const publicPrefix = `${env.supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;

  if (!imageUrl.startsWith(publicPrefix)) {
    return null;
  }

  return decodeURIComponent(imageUrl.slice(publicPrefix.length));
}

export async function removeStoredProductImage(
  supabase: AdminSupabaseClient,
  imageUrl: string | null,
) {
  const storagePath = getProductImageStoragePath(imageUrl);

  if (!storagePath) {
    return;
  }

  await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([storagePath]);
}
