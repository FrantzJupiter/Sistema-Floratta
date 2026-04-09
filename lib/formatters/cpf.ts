export function getCpfDigits(value?: string | null) {
  return (value ?? "").replace(/\D/g, "").slice(0, 11);
}

export function formatCpf(value?: string | null) {
  const digits = getCpfDigits(value);

  if (!digits) {
    return "";
  }

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function buildCpfSearchText(value?: string | null) {
  const digits = getCpfDigits(value);
  const formatted = formatCpf(digits);

  return [value ?? "", digits, formatted].filter(Boolean).join(" ");
}
