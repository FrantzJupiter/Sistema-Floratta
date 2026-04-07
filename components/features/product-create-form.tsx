"use client";

import { useActionState, useState } from "react";

import { createProductAction } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import {
  createAutomaticSku,
  defaultProductType,
  getProductTypeDefinition,
  productTypeDefinitions,
  productTypeValues,
  type ProductType,
} from "@/lib/products/catalog";
import {
  initialProductActionState,
  type ProductActionState,
} from "@/lib/validations/product";

function FieldError({
  errors,
}: {
  errors?: string[];
}) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-sm text-rose-600">{errors[0]}</p>;
}

function FormField({
  label,
  name,
  type = "text",
  placeholder,
  step,
  min,
  defaultValue,
  errors,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  step?: string;
  min?: string;
  defaultValue?: string;
  errors?: string[];
}) {
  return (
    <label className="grid gap-2 text-sm text-zinc-700">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        min={min}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 rounded-2xl border border-white/45 bg-white/75 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
      />
      <FieldError errors={errors} />
    </label>
  );
}

type ProductCreateFormFieldsProps = {
  state: ProductActionState;
  formAction: (payload: FormData) => void;
  pending: boolean;
};

function ProductCreateFormFields({
  state,
  formAction,
  pending,
}: ProductCreateFormFieldsProps) {
  const [productType, setProductType] = useState<ProductType>(defaultProductType);
  const [skuPreview, setSkuPreview] = useState(() => createAutomaticSku(defaultProductType));
  const [metadataValues, setMetadataValues] = useState<Record<string, string>>({});

  const productTypeDefinition = getProductTypeDefinition(productType);

  function handleProductTypeChange(nextType: ProductType) {
    setProductType(nextType);
    setMetadataValues({});
    setSkuPreview(createAutomaticSku(nextType));
  }

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

  return (
    <form action={formAction} className="grid gap-5">
      <input type="hidden" name="productType" value={productType} />
      <input type="hidden" name="attributesJson" value={attributesJson} />

      <div className="grid gap-2 text-sm text-zinc-700">
        <label htmlFor="productType" className="font-medium">
          Tipo de produto
        </label>
        <select
          id="productType"
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
        <p className="text-xs leading-5 text-zinc-500">
          {productTypeDefinition.description}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Nome do produto"
          name="name"
          placeholder="Ex.: Perfume Floratta Blue"
          errors={state.fieldErrors?.name}
        />
        <div className="grid gap-2 text-sm text-zinc-700">
          <span className="font-medium">SKU automatica</span>
          <div className="flex gap-2">
            <input
              value={skuPreview}
              readOnly
              className="h-11 flex-1 rounded-2xl border border-dashed border-rose-200 bg-rose-50/80 px-4 font-medium text-rose-900 shadow-sm outline-none"
            />
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl"
              onClick={() => setSkuPreview(createAutomaticSku(productType))}
            >
              Gerar outra
            </Button>
          </div>
          <p className="text-xs leading-5 text-zinc-500">
            Id do produto.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Preco base"
          name="basePrice"
          type="number"
          min="0"
          step="0.01"
          placeholder="129.90"
          errors={state.fieldErrors?.basePrice}
        />
        <FormField
          label="Quantidade inicial"
          name="quantity"
          type="number"
          min="0"
          step="1"
          placeholder="12"
          defaultValue="0"
          errors={state.fieldErrors?.quantity}
        />
      </div>

      <FormField
        label="URL da imagem"
        name="imageUrl"
        type="url"
        placeholder="https://..."
        errors={state.fieldErrors?.imageUrl}
      />

      <section className="grid gap-4 rounded-[1.5rem] border border-white/50 bg-white/50 p-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-zinc-900">Metadados guiados</h3>
          <p className="text-xs leading-5 text-zinc-500">
            Selecione o tipo e preencha os campos sugeridos. O sistema monta os
            metadados sozinho e salva no formato flexivel do banco.
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
            <p
              className={
                state.status === "success" ? "text-emerald-700" : "text-rose-600"
              }
            >
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
          {pending ? "Salvando..." : "Cadastrar produto"}
        </Button>
      </div>
    </form>
  );
}

export function ProductCreateForm() {
  const [state, formAction, pending] = useActionState<ProductActionState, FormData>(
    createProductAction,
    initialProductActionState,
  );

  return (
    <ProductCreateFormFields
      key={state.status === "success" ? state.message : "product-create-form"}
      state={state}
      formAction={formAction}
      pending={pending}
    />
  );
}
