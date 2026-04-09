"use client";
/* eslint-disable @next/next/no-img-element */

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { deleteProductAction, updateProductAction } from "@/app/actions/products";
import { ProductImageFields } from "@/components/features/product-image-fields";
import { ProductQrLabelDialog } from "@/components/features/product-qr-label-dialog";
import { ProductTypeField } from "@/components/features/product-type-field";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import {
  createAutomaticSku,
  getDetailType,
  getProductDetailEntries,
} from "@/lib/products/catalog";
import {
  initialProductActionState,
  initialProductDeleteActionState,
  type ProductActionState,
  type ProductDeleteActionState,
} from "@/lib/validations/product";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/services/products";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-sm text-rose-600">{errors[0]}</p>;
}

function ProductImagePreview({
  imageUrl,
  name,
  isEditing,
}: {
  imageUrl: string | null;
  name: string;
  isEditing: boolean;
}) {
  const previewContent = (
    <div
      className={cn(
        "overflow-hidden rounded-[1rem] border border-white/60 bg-gradient-to-br from-white/60 to-white/20 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-sm transition-all duration-200",
        isEditing ? "h-28 w-28 sm:h-32 sm:w-32" : "h-12 w-12 sm:h-14 sm:w-14",
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(160deg,_rgba(255,240,245,0.88),_rgba(247,235,255,0.92))] px-2 text-center text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-500 sm:text-[10px]">
          Sem foto
        </div>
      )}
    </div>
  );

  return (
    <ImageLightbox alt={name} imageUrl={imageUrl} triggerClassName="shrink-0">
      {previewContent}
    </ImageLightbox>
  );
}

function ProductIdPreview({
  onRegenerate,
  value,
}: {
  onRegenerate: () => void;
  value: string;
}) {
  return (
    <div className="grid gap-2 text-sm text-zinc-700">
      <span className="font-medium">ID do produto</span>
      <input
        value={value}
        readOnly
        className="h-10 w-full rounded-xl border border-dashed border-rose-200 bg-rose-50/80 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-900 shadow-sm outline-none"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 justify-start rounded-xl px-2 text-xs text-rose-900 hover:bg-rose-100"
        onClick={onRegenerate}
      >
        Prever outro
      </Button>
    </div>
  );
}

function ProductEditForm({
  formAction,
  pending,
  product,
  state,
  typeOptions,
}: {
  formAction: (payload: FormData) => void;
  pending: boolean;
  product: CatalogProduct;
  state: ProductActionState;
  typeOptions: string[];
}) {
  const [detailType, setDetailType] = useState(getDetailType(product.variantAttributes) ?? "");
  const [detailVolume, setDetailVolume] = useState(
    getProductDetailEntries(product.variantAttributes).find((entry) => entry.key === "volume")
      ?.value ?? "",
  );
  const [skuPreview, setSkuPreview] = useState(product.sku);
  const [isImageProcessing, setIsImageProcessing] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isImageProcessing) {
      event.preventDefault();
    }
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="mt-4 grid gap-4 rounded-[1.5rem] border border-white/40 bg-black/5 p-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.03)] backdrop-blur-sm"
    >
      <input type="hidden" name="productId" value={product.id} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <label className="grid gap-2 text-sm text-zinc-700">
          <span className="font-medium">Nome do produto</span>
          <input
            name="name"
            defaultValue={product.name}
            className="h-11 rounded-2xl border border-white/50 bg-white/40 px-4 text-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md outline-none transition-all hover:bg-white/50 focus:border-rose-300 focus:bg-white/60 focus:ring-4 focus:ring-rose-200/50"
          />
          <FieldError errors={state.fieldErrors?.name} />
        </label>

        <ProductIdPreview
          onRegenerate={() => setSkuPreview(createAutomaticSku(detailType))}
          value={skuPreview}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px]">
        <label className="grid gap-2 text-sm text-zinc-700">
          <span className="font-medium">Preço base</span>
          <CurrencyInput
            name="basePrice"
            defaultValue={String(product.base_price)}
            className="h-11 rounded-2xl border border-white/50 bg-white/40 px-4 text-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md outline-none transition-all hover:bg-white/50 focus:border-rose-300 focus:bg-white/60 focus:ring-4 focus:ring-rose-200/50"
          />
          <FieldError errors={state.fieldErrors?.basePrice} />
        </label>

        <label className="grid gap-2 text-sm text-zinc-700">
          <span className="font-medium">Quantidade em estoque</span>
          <input
            name="quantity"
            type="number"
            min="0"
            step="1"
            defaultValue={String(product.inventory?.quantity ?? 0)}
            className="h-11 rounded-2xl border border-white/50 bg-white/40 px-4 text-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md outline-none transition-all hover:bg-white/50 focus:border-rose-300 focus:bg-white/60 focus:ring-4 focus:ring-rose-200/50"
          />
          <FieldError errors={state.fieldErrors?.quantity} />
        </label>
      </div>

      <ProductImageFields
        defaultImageUrl={product.image_url}
        imageUrlErrors={state.fieldErrors?.imageUrl}
        imageFileErrors={state.fieldErrors?.imageFile}
        imageCameraErrors={state.fieldErrors?.imageCamera}
        onProcessingChange={setIsImageProcessing}
      />

      <section className="grid gap-4 rounded-[1.5rem] border border-white/50 bg-white/30 p-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)] backdrop-blur-md">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-zinc-900">Detalhes</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ProductTypeField
            errors={state.fieldErrors?.detailType}
            onChange={(nextType) => {
              setDetailType(nextType);
              setSkuPreview(createAutomaticSku(nextType));
            }}
            typeOptions={typeOptions}
            value={detailType}
          />

          <label className="grid gap-2 text-sm text-zinc-700">
            <span className="font-medium">Volume</span>
            <input
              name="detailVolume"
              value={detailVolume}
              placeholder="Ex.: 100 ml"
              onChange={(event) => setDetailVolume(event.target.value)}
              className="h-11 rounded-2xl border border-white/50 bg-white/40 px-4 text-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md outline-none transition-all hover:bg-white/50 focus:border-rose-300 focus:bg-white/60 focus:ring-4 focus:ring-rose-200/50"
            />
            <FieldError errors={state.fieldErrors?.detailVolume} />
          </label>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="min-h-6 text-sm">
          {isImageProcessing ? (
            <p className="text-zinc-600">Otimizando imagem para upload...</p>
          ) : state.message ? (
            <p className={state.status === "success" ? "text-emerald-700" : "text-rose-600"}>
              {state.message}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={pending || isImageProcessing}
          className="rounded-2xl border border-rose-800/80 bg-gradient-to-b from-rose-700 to-rose-950 px-5 text-white shadow-[0_4px_12px_rgba(159,18,57,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all hover:from-rose-600 hover:to-rose-900 active:scale-[0.98] active:shadow-inner"
        >
          {isImageProcessing
            ? "Otimizando imagem..."
            : pending
              ? "Salvando..."
              : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

export function ProductCatalogCard({
  isAdmin = false,
  product,
  typeOptions = [],
}: {
  isAdmin?: boolean;
  product: CatalogProduct;
  typeOptions?: string[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const detailType = getDetailType(product.variantAttributes);
  const quantity = product.inventory?.quantity ?? 0;
  const stockTone =
    quantity === 0
      ? "bg-rose-100 text-rose-700"
      : quantity <= 5
        ? "bg-amber-100 text-amber-700"
        : "bg-emerald-100 text-emerald-700";

  const [updateState, updateFormAction, updatePending] = useActionState<ProductActionState, FormData>(
    updateProductAction,
    initialProductActionState,
  );
  const [deleteState, deleteFormAction, deletePending] = useActionState<
    ProductDeleteActionState,
    FormData
  >(deleteProductAction, initialProductDeleteActionState);
  const previousUpdatePendingRef = useRef(false);

  useEffect(() => {
    if (
      previousUpdatePendingRef.current &&
      !updatePending &&
      updateState.status === "success"
    ) {
      const closeEditorFrame = requestAnimationFrame(() => {
        setIsEditing(false);
      });

      previousUpdatePendingRef.current = updatePending;

      return () => cancelAnimationFrame(closeEditorFrame);
    }

    previousUpdatePendingRef.current = updatePending;
  }, [updatePending, updateState.status]);

  return (
    <article
      className={cn(
        "rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/80 to-white/30 p-3 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-md transition hover:-translate-y-0.5 sm:p-3.5",
        isEditing && "md:col-span-2",
      )}
    >
      <div className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <ProductImagePreview
              imageUrl={product.image_url}
              name={product.name}
              isEditing={isEditing}
            />

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-rose-700">
                  {detailType ?? "Sem tipo"}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${stockTone}`}>
                  {quantity} em estoque
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <h3 className="truncate text-sm font-semibold text-zinc-950 sm:text-base">
                  {product.name}
                </h3>
                <p className="shrink-0 text-base font-semibold text-zinc-950 sm:text-lg">
                  {formatCurrency(product.base_price)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
            <ProductQrLabelDialog
              product={{
                id: product.id,
                name: product.name,
                sku: product.sku,
              }}
            />

            {isAdmin ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-xl border border-white/70 bg-gradient-to-b from-white/80 to-white/30 px-2.5 text-xs text-zinc-800 shadow-[0_4px_12px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md transition-all hover:from-white/90 hover:to-white/50 active:scale-[0.98] active:shadow-inner"
                  onClick={() => setIsEditing((current) => !current)}
                >
                  {isEditing ? "Fechar edição" : "Editar"}
                </Button>

                <form action={deleteFormAction}>
                  <input type="hidden" name="productId" value={product.id} />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={deletePending}
                    className="h-8 rounded-xl border border-rose-200/80 bg-gradient-to-b from-rose-50/80 to-rose-100/30 px-2.5 text-xs text-rose-900 shadow-[0_4px_12px_rgba(225,29,72,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md transition-all hover:from-rose-100/90 hover:to-rose-100/50 active:scale-[0.98] active:shadow-inner"
                    onClick={(event) => {
                      if (!window.confirm(`Excluir ${product.name}? Esta ação não pode ser desfeita.`)) {
                        event.preventDefault();
                      }
                    }}
                  >
                    {deletePending ? "Excluindo..." : "Excluir produto"}
                  </Button>
                </form>
              </>
            ) : null}
          </div>
        </div>

        {(updateState.message && !isEditing) || deleteState.message ? (
          <div className="min-h-5 text-xs" aria-live="polite">
            {updateState.message && !isEditing ? (
              <p className={updateState.status === "success" ? "text-emerald-700" : "text-rose-600"}>
                {updateState.message}
              </p>
            ) : null}
            {deleteState.message ? (
              <p className={deleteState.status === "success" ? "text-emerald-700" : "text-rose-600"}>
                {deleteState.message}
              </p>
            ) : null}
          </div>
        ) : null}

        {isEditing && isAdmin ? (
          <ProductEditForm
            key={updateState.status === "success" ? updateState.message : product.id}
            formAction={updateFormAction}
            pending={updatePending}
            product={product}
            state={updateState}
            typeOptions={typeOptions}
          />
        ) : null}
      </div>
    </article>
  );
}
