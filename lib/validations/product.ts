import { z } from "zod";

import {
  getProductTypeDefinition,
  productTypeValues,
  type ProductType,
} from "@/lib/products/catalog";

const productAttributesSchema = z.record(
  z.string().min(1),
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

export const productCreateSchema = z.object({
  name: z.string().trim().min(3, "Informe um nome com pelo menos 3 caracteres.").max(255),
  productType: z.enum(productTypeValues, {
    message: "Selecione um tipo de produto valido.",
  }),
  basePrice: z.coerce
    .number()
    .positive("O preco precisa ser maior que zero.")
    .max(999999.99, "Preco muito alto para o cadastro inicial."),
  quantity: z.coerce
    .number()
    .int("A quantidade deve ser um numero inteiro.")
    .min(0, "A quantidade nao pode ser negativa.")
    .max(999999, "Quantidade muito alta para o cadastro inicial."),
  imageUrl: z.union([z.literal(""), z.string().trim().url("Informe uma URL valida.")]),
  attributesJson: z.string().trim().optional().default(""),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export type ProductActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialProductActionState: ProductActionState = {
  status: "idle",
  message: "",
};

export function parseVariantAttributes(input: string, productType: ProductType) {
  if (!input.trim()) {
    return {
      data: { tipo_produto: productType },
      error: null,
    } as const;
  }

  try {
    const parsed = JSON.parse(input);
    const validated = productAttributesSchema.safeParse(parsed);

    if (!validated.success) {
      return {
        data: null,
        error:
          "Os metadados devem ser um JSON simples, como {\"fragrancia\":\"doce\",\"volume\":\"50ml\"}.",
      } as const;
    }

    const definition = getProductTypeDefinition(productType);
    const normalizedAttributes: Record<string, string | number | boolean | null> = {
      tipo_produto: productType,
    };

    for (const field of definition.fields) {
      const rawValue = validated.data[field.key];

      const isEmpty =
        rawValue === undefined ||
        rawValue === null ||
        (typeof rawValue === "string" && !rawValue.trim());

      if (field.required && isEmpty) {
        return {
          data: null,
          error: `Preencha o campo "${field.label}" para continuar.`,
        } as const;
      }

      if (isEmpty) {
        continue;
      }

      if (field.type === "number") {
        const numericValue =
          typeof rawValue === "number" ? rawValue : Number(String(rawValue));

        if (!Number.isFinite(numericValue)) {
          return {
            data: null,
            error: `O campo "${field.label}" precisa ser numerico.`,
          } as const;
        }

        normalizedAttributes[field.key] = numericValue;
        continue;
      }

      normalizedAttributes[field.key] = String(rawValue).trim();
    }

    return { data: normalizedAttributes, error: null } as const;
  } catch {
    return {
      data: null,
      error:
        "Nao foi possivel ler os metadados. Verifique se o JSON esta bem formado.",
      } as const;
  }
}
