"use client";

import { useActionState, useMemo, useState } from "react";

import { createProductAction } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import { createAutomaticSku } from "@/lib/products/catalog";
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
  list,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  step?: string;
  min?: string;
  defaultValue?: string;
  errors?: string[];
  list?: string;
}) {
  return (
    <label className="grid gap-2 text-sm text-zinc-700">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        min={min}
        list={list}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 rounded-2xl border border-white/45 bg-white/75 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
      />
      <FieldError errors={errors} />
    </label>
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
        Gerar outro
      </Button>
    </div>
  );
}

type ProductCreateFormFieldsProps = {
  state: ProductActionState;
  formAction: (payload: FormData) => void;
  pending: boolean;
  typeOptions: string[];
};

function ProductCreateFormFields({
  state,
  formAction,
  pending,
  typeOptions,
}: ProductCreateFormFieldsProps) {
  const [detailType, setDetailType] = useState("");
  const [skuPreview, setSkuPreview] = useState(() => createAutomaticSku(""));
  const typeListId = useMemo(() => "product-detail-type-options", []);

  function handleDetailTypeChange(nextType: string) {
    setDetailType(nextType);
    setSkuPreview(createAutomaticSku(nextType));
  }

  return (
    <form action={formAction} className="grid gap-5">
      {typeOptions.length ? (
        <datalist id={typeListId}>
          {typeOptions.map((typeOption) => (
            <option key={typeOption} value={typeOption} />
          ))}
        </datalist>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <FormField
          label="Nome do produto"
          name="name"
          placeholder="Ex.: Perfume Floratta Blue"
          errors={state.fieldErrors?.name}
        />
        <ProductIdPreview
          onRegenerate={() => setSkuPreview(createAutomaticSku(detailType))}
          value={skuPreview}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px]">
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
          <h3 className="text-sm font-semibold text-zinc-900">Detalhes do produto</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-zinc-700">
            <span className="font-medium">Tipo</span>
            <input
              name="detailType"
              list={typeOptions.length ? typeListId : undefined}
              value={detailType}
              placeholder="Selecione ou digite um novo tipo"
              onChange={(event) => handleDetailTypeChange(event.target.value)}
              className="h-11 rounded-2xl border border-white/45 bg-white/75 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            />
            <FieldError errors={state.fieldErrors?.detailType} />
          </label>

          <FormField
            label="Volume"
            name="detailVolume"
            placeholder="Ex.: 100 ml"
            errors={state.fieldErrors?.detailVolume}
          />
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

type ProductCreateFormProps = {
  typeOptions?: string[];
};

export function ProductCreateForm({ typeOptions = [] }: ProductCreateFormProps) {
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
      typeOptions={typeOptions}
    />
  );
}
