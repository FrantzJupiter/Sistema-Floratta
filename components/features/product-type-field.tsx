"use client";

import { ChevronDown } from "lucide-react";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null;
  }

  return <p className="text-sm text-rose-600">{errors[0]}</p>;
}

type ProductTypeFieldProps = {
  errors?: string[];
  name?: string;
  onChange: (value: string) => void;
  typeOptions: string[];
  value: string;
};

const CUSTOM_OPTION_VALUE = "__custom__";

export function ProductTypeField({
  errors,
  name = "detailType",
  onChange,
  typeOptions,
  value,
}: ProductTypeFieldProps) {
  const normalizedOptions = [...new Set(typeOptions.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, "pt-BR", { sensitivity: "base" }),
  );
  const selectedValue =
    value && normalizedOptions.includes(value) ? value : CUSTOM_OPTION_VALUE;

  if (!normalizedOptions.length) {
    return (
      <label className="grid gap-2 text-sm text-zinc-700">
        <span className="font-medium">Tipo</span>
        <input
          name={name}
          value={value}
          placeholder="Digite o tipo do produto"
          onChange={(event) => onChange(event.target.value)}
          className="h-11 rounded-2xl border border-white/45 bg-white/75 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
        />
        <FieldError errors={errors} />
      </label>
    );
  }

  return (
    <div className="grid gap-2 text-sm text-zinc-700">
      <span className="font-medium">Tipo</span>
      <input type="hidden" name={name} value={value} />

      <div className="grid gap-3">
        <div className="relative">
          <select
            value={selectedValue}
            onChange={(event) => {
              const nextValue = event.target.value;

              if (nextValue === CUSTOM_OPTION_VALUE) {
                if (normalizedOptions.includes(value)) {
                  onChange("");
                }

                return;
              }

              onChange(nextValue);
            }}
            className="h-11 w-full appearance-none rounded-2xl border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,246,249,0.82))] px-4 pr-11 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
          >
            <option value={CUSTOM_OPTION_VALUE}>Selecionar ou criar tipo</option>
            {normalizedOptions.map((typeOption) => (
              <option key={typeOption} value={typeOption}>
                {typeOption}
              </option>
            ))}
            <option value={CUSTOM_OPTION_VALUE}>Digitar novo tipo</option>
          </select>

          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-rose-700/80" />
        </div>

        {selectedValue === CUSTOM_OPTION_VALUE ? (
          <input
            value={value}
            placeholder="Digite um novo tipo"
            onChange={(event) => onChange(event.target.value)}
            className="h-11 rounded-2xl border border-rose-200/80 bg-white/80 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
          />
        ) : (
          <div className="rounded-2xl border border-white/55 bg-white/55 px-4 py-2.5 text-xs uppercase tracking-[0.18em] text-zinc-500">
            Tipo selecionado
          </div>
        )}
      </div>

      <FieldError errors={errors} />
    </div>
  );
}
