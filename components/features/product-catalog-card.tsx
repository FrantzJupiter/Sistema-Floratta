"use client";
/* eslint-disable @next/next/no-img-element */

import { useActionState, useState } from "react";

import { deleteProductAction, updateProductAction } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import {
  createAutomaticSku,
  defaultProductType,
  getMetadataLabel,
  getProductTypeDefinition,
  getProductTypeFromAttributes,
  getProductTypeLabel,
  productTypeDefinitions,
  productTypeValues,
  type ProductType,
} from "@/lib/products/catalog";
import type { Json } from "@/lib/supabase";
import {
  initialProductActionState,
  initialProductDeleteActionState,
  type ProductActionState,
  type ProductDeleteActionState,
} from "@/lib/validations/product";
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

function renderAttributes(attributes: Json | null) {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return null;
  }

  const productType = getProductTypeFromAttributes(attributes);
  const entries = Object.entries(attributes).filter(([key]) => key !== "tipo_produto");

  if (!entries.length) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <span
          key={key}
          className="rounded-full border border-white/60 bg-white/75 px-3 py-1 text-xs text-zinc-600"
        >
          {getMetadataLabel(productType, key)}: {String(value)}
        </span>
      ))}
    </div>
  );
}

function getInitialMetadataValues(attributes: Json | null) {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return {} as Record<string, string>;
  }

  return Object.entries(attributes).reduce<Record<string, string>>((accumulator, [key, value]) => {
    if (key === "tipo_produto" || value === null || value === undefined) {
      return accumulator;
    }

    accumulator[key] = String(value);
    return accumulator;
  }, {});
}

function ProductIdPreview({
  actionLabel,
  helperText,
  onRegenerate,
  value,
}: {
  actionLabel: string;
  helperText?: string;
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
        {actionLabel}
      </Button>
      {helperText ? <p className="text-xs leading-5 text-zinc-500">{helperText}</p> : null}
    </div>
  );
}

function ProductEditForm({
  formAction,
  pending,
  product,
  state,
}: {
  formAction: (payload: FormData) => void;
  pending: boolean;
  product: CatalogProduct;
  state: ProductActionState;
}) {
  const initialProductType =
    getProductTypeFromAttributes(product.variantAttributes) ?? defaultProductType;
  const [productType, setProductType] = useState<ProductType>(initialProductType);
  const [metadataValues, setMetadataValues] = useState<Record<string, string>>(
    getInitialMetadataValues(product.variantAttributes),
  );
  const [skuPreview, setSkuPreview] = useState(product.sku);

  const productTypeDefinition = getProductTypeDefinition(productType);
  const attributesJson = JSON.stringify(
    productTypeDefinition.fields.reduce<Record<string, string | number>>((accumulator, field) => {
      const rawValue = metadataValues[field.key]?.trim();

      if (!rawValue) {
        return accumulator;
      }

      accumulator[field.key] =
        field.type === "number" && !Number.isNaN(Number(rawValue))
          ? Number(rawValue)
          : rawValue;

      return accumulator;
    }, {}),
  );

  function handleProductTypeChange(nextType: ProductType) {
    setProductType(nextType);
    setMetadataValues({});
    setSkuPreview(createAutomaticSku(nextType));
  }

  return (
    <form action={formAction} className="mt-5 grid gap-4 rounded-[1.5rem] border border-white/55 bg-white/78 p-4 shadow-sm">
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="productType" value={productType} />
      <input type="hidden" name="attributesJson" value={attributesJson} />

      <div className="grid gap-2 text-sm text-zinc-700">
        <label htmlFor={`product-type-${product.id}`} className="font-medium">
          Tipo de produto
        </label>
        <select
          id={`product-type-${product.id}`}
          value={productType}
          onChange={(event) => handleProductTypeChange(event.target.value as ProductType)}
          className="h-11 rounded-2xl border border-white/45 bg-white/75 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
        >
          {productTypeValues.map((type) => (
            <option key={type} value={type}>
              {productTypeDefinitions[type].label}
            </option>
          ))}
        </select>
        <FieldError errors={state.fieldErrors?.productType} />
        <p className="text-xs leading-5 text-zinc-500">{productTypeDefinition.description}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <label className="grid gap-2 text-sm text-zinc-700">
          <span className="font-medium">Nome do produto</span>
          <input
            name="name"
            defaultValue={product.name}
            className="h-11 rounded-2xl border border-white/45 bg-white/75 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
          />
          <FieldError errors={state.fieldErrors?.name} />
        </label>

        <ProductIdPreview
          actionLabel="Prever outro"
          helperText="O ID atual nao muda na edicao. O preview serve so para referencia."
          onRegenerate={() => setSkuPreview(createAutomaticSku(productType))}
          value={skuPreview}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px]">
        <label className="grid gap-2 text-sm text-zinc-700">
          <span className="font-medium">Preco base</span>
          <input
            name="basePrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={String(product.base_price)}
            className="h-11 rounded-2xl border border-white/45 bg-white/75 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
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
            className="h-11 rounded-2xl border border-white/45 bg-white/75 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
          />
          <FieldError errors={state.fieldErrors?.quantity} />
        </label>
      </div>

      <label className="grid gap-2 text-sm text-zinc-700">
        <span className="font-medium">URL da imagem</span>
        <input
          name="imageUrl"
          type="url"
          defaultValue={product.image_url ?? ""}
          placeholder="https://..."
          className="h-11 rounded-2xl border border-white/45 bg-white/75 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
        />
        <FieldError errors={state.fieldErrors?.imageUrl} />
      </label>

      <section className="grid gap-4 rounded-[1.5rem] border border-white/50 bg-white/50 p-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-zinc-900">Metadados</h3>
          <p className="text-xs leading-5 text-zinc-500">
            Atualize os atributos tecnicos do item para manter o catalogo consistente.
          </p>
          <FieldError errors={state.fieldErrors?.attributesJson} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {productTypeDefinition.fields.map((field) => (
            <label key={field.key} className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">
                {field.label}
                {field.required ? " *" : ""}
              </span>

              {field.type === "select" ? (
                <select
                  value={metadataValues[field.key] ?? ""}
                  onChange={(event) =>
                    setMetadataValues((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  className="h-11 rounded-2xl border border-white/45 bg-white/75 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                >
                  <option value="">Selecione...</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  value={metadataValues[field.key] ?? ""}
                  min={field.type === "number" ? "0" : undefined}
                  step={field.type === "number" ? "1" : undefined}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    setMetadataValues((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  className="h-11 rounded-2xl border border-white/45 bg-white/75 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                />
              )}
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="min-h-6 text-sm">
          {state.message ? (
            <p className={state.status === "success" ? "text-emerald-700" : "text-rose-600"}>
              {state.message}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="rounded-2xl bg-rose-900 px-5 text-white hover:bg-rose-800"
        >
          {pending ? "Salvando..." : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}

export function ProductCatalogCard({ product }: { product: CatalogProduct }) {
  const [isEditing, setIsEditing] = useState(false);
  const productType = getProductTypeFromAttributes(product.variantAttributes);
  const productTypeLabel = getProductTypeLabel(productType);
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

  return (
    <article className="rounded-[1.75rem] border border-white/55 bg-white/72 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-[1.5rem] border border-white/60 bg-white/80 shadow-sm">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full min-h-[120px] w-full object-cover"
              />
            ) : (
              <div className="flex min-h-[120px] items-center justify-center bg-[linear-gradient(160deg,_rgba(255,240,245,0.88),_rgba(247,235,255,0.92))] px-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                Sem foto
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-zinc-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                    ID {product.sku}
                  </span>
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-rose-700">
                    {productTypeLabel}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-zinc-950">{product.name}</h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${stockTone}`}>
                {quantity} em estoque
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/60 bg-white/75 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Preco base</p>
                <p className="mt-2 text-2xl font-semibold text-zinc-950">
                  {formatCurrency(product.base_price)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/75 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Ultima atualizacao
                </p>
                <p className="mt-2 text-sm font-medium text-zinc-700">
                  {product.inventory?.last_updated
                    ? new Date(product.inventory.last_updated).toLocaleString("pt-BR")
                    : "Sem movimentacao"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {renderAttributes(product.variantAttributes)}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6 text-sm" aria-live="polite">
            {deleteState.message ? (
              <p className={deleteState.status === "success" ? "text-emerald-700" : "text-rose-600"}>
                {deleteState.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border-zinc-200 bg-white/80"
              onClick={() => setIsEditing((current) => !current)}
            >
              {isEditing ? "Fechar edicao" : "Editar produto"}
            </Button>

            <form action={deleteFormAction}>
              <input type="hidden" name="productId" value={product.id} />
              <Button
                type="submit"
                variant="outline"
                disabled={deletePending}
                className="rounded-2xl border-rose-200 bg-rose-50/70 text-rose-900 hover:bg-rose-100"
                onClick={(event) => {
                  if (!window.confirm(`Excluir ${product.name}? Esta acao nao pode ser desfeita.`)) {
                    event.preventDefault();
                  }
                }}
              >
                {deletePending ? "Excluindo..." : "Excluir produto"}
              </Button>
            </form>
          </div>
        </div>

        {isEditing ? (
          <ProductEditForm
            key={updateState.status === "success" ? updateState.message : product.id}
            formAction={updateFormAction}
            pending={updatePending}
            product={product}
            state={updateState}
          />
        ) : null}
      </div>
    </article>
  );
}
