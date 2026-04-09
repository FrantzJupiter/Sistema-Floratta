"use client";

import { useActionState, useState, type FormEvent } from "react";

import { createProductAction } from "@/app/actions/products";
import { ProductImageFields } from "@/components/features/product-image-fields";
import { ProductTypeField } from "@/components/features/product-type-field";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
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

type ProductCreateFormFieldsProps = {
  state: ProductActionState;
  formAction: (payload: FormData) => void;
  initialSkuPreview: string;
  pending: boolean;
  typeOptions: string[];
};

function ProductCreateFormFields({
  state,
  formAction,
  initialSkuPreview,
  pending,
  typeOptions,
}: ProductCreateFormFieldsProps) {
  const [detailType, setDetailType] = useState("");
  const [skuPreview, setSkuPreview] = useState(initialSkuPreview);
  const [isImageProcessing, setIsImageProcessing] = useState(false);

  function handleDetailTypeChange(nextType: string) {
    setDetailType(nextType);
    setSkuPreview(createAutomaticSku(nextType));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isImageProcessing) {
      event.preventDefault();
    }
  }

  return (
    <form action={formAction} className="grid gap-5" onSubmit={handleSubmit}>
      <section className="grid gap-4 rounded-[1.5rem] border border-white/50 bg-white/50 p-4">
        <FormField
          label="Nome do produto"
          name="name"
          placeholder="Ex.: Essência de baunilha"
          errors={state.fieldErrors?.name}
        />

        <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-3 md:grid-cols-[168px_88px_148px] md:items-end md:gap-x-6">
          <label className="grid gap-1.5 text-xs text-zinc-700">
            <span className="font-medium">Preço base</span>
            <CurrencyInput
              name="basePrice"
              placeholder="R$ 0,00"
              className="h-10 rounded-xl border border-white/45 bg-white/75 px-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            />
            <FieldError errors={state.fieldErrors?.basePrice} />
          </label>

          <label className="grid gap-1.5 text-xs text-zinc-700">
            <span className="font-medium">Qtd. inicial</span>
            <input
              name="quantity"
              type="number"
              min="0"
              step="1"
              placeholder="12"
              defaultValue="0"
              className="h-10 rounded-xl border border-white/45 bg-white/75 px-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            />
            <FieldError errors={state.fieldErrors?.quantity} />
          </label>

          <label className="col-span-2 grid min-w-0 gap-1.5 text-xs text-zinc-700 md:col-span-1">
            <span className="font-medium">ID do produto</span>
            <button
              type="button"
              className="h-10 w-full rounded-xl border border-dashed border-rose-200 bg-rose-50/80 px-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-900 shadow-sm outline-none transition hover:border-rose-300 hover:bg-rose-100/80 focus-visible:border-rose-300 focus-visible:ring-4 focus-visible:ring-rose-100"
              onClick={() => setSkuPreview(createAutomaticSku(detailType))}
            >
              {skuPreview}
            </button>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ProductTypeField
            errors={state.fieldErrors?.detailType}
            onChange={handleDetailTypeChange}
            typeOptions={typeOptions}
            value={detailType}
          />

          <FormField
            label="Volume"
            name="detailVolume"
            placeholder="Ex.: 100 ml"
            errors={state.fieldErrors?.detailVolume}
          />
        </div>
      </section>

      <ProductImageFields
        imageFileErrors={state.fieldErrors?.imageFile}
        imageCameraErrors={state.fieldErrors?.imageCamera}
        onProcessingChange={setIsImageProcessing}
        showImageUrlField={false}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="min-h-6 text-sm">
          {isImageProcessing ? (
            <p className="text-zinc-600">Otimizando imagem para upload...</p>
          ) : state.message ? (
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
          disabled={pending || isImageProcessing}
          className="rounded-2xl bg-rose-900 px-5 text-white hover:bg-rose-800"
        >
          {isImageProcessing
            ? "Otimizando imagem..."
            : pending
              ? "Salvando..."
              : "Cadastrar produto"}
        </Button>
      </div>
    </form>
  );
}

type ProductCreateFormProps = {
  initialSkuPreview: string;
  typeOptions?: string[];
};

export function ProductCreateForm({
  initialSkuPreview,
  typeOptions = [],
}: ProductCreateFormProps) {
  const [state, formAction, pending] = useActionState<ProductActionState, FormData>(
    createProductAction,
    initialProductActionState,
  );

  return (
    <ProductCreateFormFields
      key={state.status === "success" ? state.message : "product-create-form"}
      state={state}
      formAction={formAction}
      initialSkuPreview={initialSkuPreview}
      pending={pending}
      typeOptions={typeOptions}
    />
  );
}
