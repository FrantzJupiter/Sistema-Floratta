export function getPhoneDigits(value?: string | null) {
  return (value ?? "").replace(/\D/g, "").slice(0, 11);
}

export function formatPhone(value?: string | null) {
  const digits = getPhoneDigits(value);

  if (!digits) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const areaCode = digits.slice(0, 2);
  const firstDigit = digits.slice(2, 3);

  if (digits.length <= 3) {
    return `(${areaCode}) ${firstDigit}`;
  }

  const middleBlock = digits.slice(3, 7);

  if (digits.length <= 7) {
    return `(${areaCode}) ${firstDigit} ${middleBlock}`;
  }

  const lastBlock = digits.slice(7, 11);

  return `(${areaCode}) ${firstDigit} ${middleBlock}-${lastBlock}`;
}

export function buildPhoneSearchText(value?: string | null) {
  const digits = getPhoneDigits(value);
  const formatted = formatPhone(digits);

  return [value ?? "", digits, formatted].filter(Boolean).join(" ");
}
