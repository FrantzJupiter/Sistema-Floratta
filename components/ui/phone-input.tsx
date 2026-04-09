"use client";

import { useEffect, useState } from "react";

import { formatPhone, getPhoneDigits } from "@/lib/formatters/phone";
import { cn } from "@/lib/utils";

type PhoneInputProps = {
  className?: string;
  defaultValue?: string | null;
  name: string;
  placeholder?: string;
};

export function PhoneInput({
  className,
  defaultValue,
  name,
  placeholder = "(00) 0 0000-0000",
}: PhoneInputProps) {
  const [digits, setDigits] = useState(() => getPhoneDigits(defaultValue));

  useEffect(() => {
    setDigits(getPhoneDigits(defaultValue));
  }, [defaultValue]);

  return (
    <>
      <input type="hidden" name={name} value={digits} readOnly />
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={16}
        value={formatPhone(digits)}
        placeholder={placeholder}
        onChange={(event) => setDigits(getPhoneDigits(event.target.value))}
        className={cn(className)}
      />
    </>
  );
}
