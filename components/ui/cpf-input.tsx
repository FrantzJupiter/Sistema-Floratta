"use client";

import { useEffect, useState } from "react";

import { formatCpf, getCpfDigits } from "@/lib/formatters/cpf";
import { cn } from "@/lib/utils";

type CpfInputProps = {
  className?: string;
  defaultValue?: string | null;
  name: string;
  placeholder?: string;
};

export function CpfInput({
  className,
  defaultValue,
  name,
  placeholder = "000.000.000-00",
}: CpfInputProps) {
  const [digits, setDigits] = useState(() => getCpfDigits(defaultValue));

  useEffect(() => {
    setDigits(getCpfDigits(defaultValue));
  }, [defaultValue]);

  return (
    <>
      <input type="hidden" name={name} value={digits} readOnly />
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={14}
        value={formatCpf(digits)}
        placeholder={placeholder}
        onChange={(event) => setDigits(getCpfDigits(event.target.value))}
        className={cn(className)}
      />
    </>
  );
}
