type ProductDetailsRecord = Record<string, unknown>;

const legacyProductTypeLabels: Record<string, string> = {
  perfumaria: "Perfumaria",
  semijoias: "Semijoias",
  decoracao: "Decoracao",
  presentes: "Presentes",
  outros: "Outros",
};

const detailLabels: Record<string, string> = {
  tipo: "Tipo",
  tipo_produto: "Tipo",
  volume: "Volume",
  volume_ml: "Volume",
};

function asProductDetails(attributes: unknown): ProductDetailsRecord | null {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return null;
  }

  return attributes as ProductDetailsRecord;
}

function normalizeString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function buildSkuPrefix(detailType?: string | null) {
  const normalizedType =
    detailType
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase() ?? "";

  return normalizedType.slice(0, 4) || "ITEM";
}

function formatLegacyType(value: string) {
  return (
    legacyProductTypeLabels[value] ??
    value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

export function createAutomaticSku(detailType?: string | null) {
  const prefix = buildSkuPrefix(detailType);
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `${prefix}-${datePart}-${randomPart}`;
}

export function getDetailType(attributes: unknown) {
  const details = asProductDetails(attributes);

  if (!details) {
    return null;
  }

  const directType = normalizeString(details.tipo);

  if (directType) {
    return directType;
  }

  const legacyType = normalizeString(details.tipo_produto);

  if (legacyType) {
    return formatLegacyType(legacyType);
  }

  return null;
}

export function getDetailVolume(attributes: unknown) {
  const details = asProductDetails(attributes);

  if (!details) {
    return null;
  }

  const directVolume = normalizeString(details.volume);

  if (directVolume) {
    return directVolume;
  }

  const legacyVolume = details.volume_ml;

  if (typeof legacyVolume === "number" && Number.isFinite(legacyVolume)) {
    return `${legacyVolume} ml`;
  }

  if (typeof legacyVolume === "string" && legacyVolume.trim()) {
    return `${legacyVolume.trim()} ml`;
  }

  return null;
}

export function getDetailLabel(key: string) {
  return detailLabels[key] ?? key.replaceAll("_", " ");
}

export function getProductDetailEntries(attributes: unknown) {
  const entries: Array<{ key: string; label: string; value: string }> = [];
  const detailType = getDetailType(attributes);
  const detailVolume = getDetailVolume(attributes);

  if (detailType) {
    entries.push({
      key: "tipo",
      label: getDetailLabel("tipo"),
      value: detailType,
    });
  }

  if (detailVolume) {
    entries.push({
      key: "volume",
      label: getDetailLabel("volume"),
      value: detailVolume,
    });
  }

  return entries;
}

export function getRegisteredDetailTypes(
  products: Array<{ variantAttributes: unknown }>,
) {
  return Array.from(
    new Set(
      products
        .map((product) => getDetailType(product.variantAttributes))
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right, "pt-BR"));
}
