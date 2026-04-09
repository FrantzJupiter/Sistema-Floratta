"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getDigitsFromCurrencyValue(value: string) {
  return value.replace(/\D/g, "");
}

function getDigitsFromDefaultValue(value?: number | string | null) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const normalizedValue =
    typeof value === "number" ? value : Number(String(value).replace(",", "."));

  if (!Number.isFinite(normalizedValue) || normalizedValue < 0) {
    return "";
  }

  return Math.round(normalizedValue * 100).toString();
}

function getNumberFromDigits(digits: string) {
  return Number(digits || "0") / 100;
}

function getFormValueFromDigits(digits: string) {
  if (!digits) {
    return "";
  }

  return getNumberFromDigits(digits).toFixed(2);
}

type CurrencyInputProps = {
  className?: string;
  defaultValue?: number | string | null;
  name: string;
  placeholder?: string;
};

export function CurrencyInput({
  className,
  defaultValue,
  name,
  placeholder = "R$ 0,00",
}: CurrencyInputProps) {
  const [digits, setDigits] = useState(() => getDigitsFromDefaultValue(defaultValue));

  useEffect(() => {
    setDigits(getDigitsFromDefaultValue(defaultValue));
  }, [defaultValue]);

  return (
    <>
      <input type="hidden" name={name} value={getFormValueFromDigits(digits)} readOnly />
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={digits ? currencyFormatter.format(getNumberFromDigits(digits)) : ""}
        placeholder={placeholder}
        onChange={(event) => setDigits(getDigitsFromCurrencyValue(event.target.value))}
        className={cn(className)}
      />
    </>
  );
}
