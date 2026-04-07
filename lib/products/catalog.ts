export const productTypeValues = [
  "perfumaria",
  "semijoias",
  "decoracao",
  "presentes",
  "outros",
] as const;

export type ProductType = (typeof productTypeValues)[number];

type ProductMetadataField = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  placeholder?: string;
  required?: boolean;
  options?: string[];
};

type ProductTypeDefinition = {
  label: string;
  description: string;
  skuPrefix: string;
  fields: ProductMetadataField[];
};

export const productTypeDefinitions: Record<ProductType, ProductTypeDefinition> = {
  perfumaria: {
    label: "Perfumaria",
    description: "Perfumes, body splashes e kits com foco em fragrancia e volume.",
    skuPrefix: "PERF",
    fields: [
      {
        key: "fragrancia",
        label: "Fragrancia",
        type: "text",
        placeholder: "Floral adocicada",
        required: true,
      },
      {
        key: "volume_ml",
        label: "Volume (ml)",
        type: "number",
        placeholder: "75",
        required: true,
      },
      {
        key: "familia_olfativa",
        label: "Familia olfativa",
        type: "select",
        options: ["Floral", "Amadeirada", "Citrica", "Oriental", "Frutada"],
      },
    ],
  },
  semijoias: {
    label: "Semijoias",
    description: "Pecas com material, banho e acabamento como atributos principais.",
    skuPrefix: "SEMI",
    fields: [
      {
        key: "material",
        label: "Material base",
        type: "text",
        placeholder: "Liga metalica",
        required: true,
      },
      {
        key: "banho",
        label: "Banho",
        type: "select",
        options: ["Ouro", "Prata", "Rose"],
        required: true,
      },
      {
        key: "pedraria",
        label: "Pedraria",
        type: "text",
        placeholder: "Zirconia cristal",
      },
    ],
  },
  decoracao: {
    label: "Decoracao",
    description: "Itens decorativos com ambiente sugerido, material e dimensoes.",
    skuPrefix: "DECO",
    fields: [
      {
        key: "material",
        label: "Material",
        type: "text",
        placeholder: "Ceramica",
        required: true,
      },
      {
        key: "ambiente",
        label: "Ambiente sugerido",
        type: "select",
        options: ["Sala", "Quarto", "Escritorio", "Cozinha", "Festa"],
        required: true,
      },
      {
        key: "dimensoes",
        label: "Dimensoes",
        type: "text",
        placeholder: "20x15cm",
      },
    ],
  },
  presentes: {
    label: "Presentes",
    description: "Itens presenteaveis com ocasiao, publico e tema.",
    skuPrefix: "GIFT",
    fields: [
      {
        key: "ocasiao",
        label: "Ocasiao",
        type: "select",
        options: ["Aniversario", "Namorados", "Natal", "Cha de bebe", "Sem data"],
        required: true,
      },
      {
        key: "publico_alvo",
        label: "Publico alvo",
        type: "select",
        options: ["Infantil", "Adulto", "Unissex"],
        required: true,
      },
      {
        key: "tema",
        label: "Tema",
        type: "text",
        placeholder: "Romantico",
      },
    ],
  },
  outros: {
    label: "Outros",
    description: "Categoria livre para itens fora dos grupos principais da loja.",
    skuPrefix: "ITEM",
    fields: [
      {
        key: "descricao_base",
        label: "Descricao tecnica",
        type: "text",
        placeholder: "Item versatil para uso geral",
        required: true,
      },
      {
        key: "destaque",
        label: "Destaque",
        type: "text",
        placeholder: "Lancamento, sazonal, colecao limitada...",
      },
    ],
  },
};

export const defaultProductType: ProductType = "perfumaria";

export function getProductTypeDefinition(productType: ProductType) {
  return productTypeDefinitions[productType];
}

export function getProductTypeLabel(productType: string | null | undefined) {
  if (!productType || !(productType in productTypeDefinitions)) {
    return "Tipo nao informado";
  }

  return productTypeDefinitions[productType as ProductType].label;
}

export function getMetadataLabel(
  productType: string | null | undefined,
  key: string,
) {
  if (productType && productType in productTypeDefinitions) {
    const field = productTypeDefinitions[productType as ProductType].fields.find(
      (item) => item.key === key,
    );

    if (field) {
      return field.label;
    }
  }

  return key.replaceAll("_", " ");
}

export function createAutomaticSku(productType: ProductType) {
  const prefix = productTypeDefinitions[productType].skuPrefix;
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `${prefix}-${datePart}-${randomPart}`;
}

export function getProductTypeFromAttributes(attributes: unknown) {
  if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) {
    return null;
  }

  const candidate = (attributes as Record<string, unknown>).tipo_produto;

  if (typeof candidate !== "string" || !(candidate in productTypeDefinitions)) {
    return null;
  }

  return candidate as ProductType;
}
