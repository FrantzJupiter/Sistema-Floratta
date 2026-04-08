import { z } from "zod";

const productDetailsSchema = z.record(
  z.string().min(1),
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

export const productCreateSchema = z.object({
  name: z.string().trim().min(3, "Informe um nome com pelo menos 3 caracteres.").max(255),
  detailType: z
    .string()
    .trim()
    .max(60, "O tipo deve ter no máximo 60 caracteres.")
    .optional()
    .default(""),
  detailVolume: z
    .string()
    .trim()
    .max(40, "O volume deve ter no máximo 40 caracteres.")
    .optional()
    .default(""),
  basePrice: z.coerce
    .number()
    .positive("O preço precisa ser maior que zero.")
    .max(999999.99, "Preço muito alto para o cadastro inicial."),
  quantity: z.coerce
    .number()
    .int("A quantidade deve ser um número inteiro.")
    .min(0, "A quantidade não pode ser negativa.")
    .max(999999, "Quantidade muito alta para o cadastro inicial."),
  imageUrl: z.union([z.literal(""), z.string().trim().url("Informe uma URL válida.")]),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = productCreateSchema.extend({
  productId: z.uuid("Produto inválido para atualização."),
});

export const productDeleteSchema = z.object({
  productId: z.uuid("Produto inválido para exclusão."),
});

export type ProductActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export type ProductDeleteActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialProductActionState: ProductActionState = {
  status: "idle",
  message: "",
};

export const initialProductDeleteActionState: ProductDeleteActionState = {
  status: "idle",
  message: "",
};

export function buildProductDetails(input: {
  detailType?: string | null;
  detailVolume?: string | null;
}) {
  const details: Record<string, string> = {};
  const detailType = input.detailType?.trim();
  const detailVolume = input.detailVolume?.trim();

  if (detailType) {
    details.tipo = detailType;
  }

  if (detailVolume) {
    details.volume = detailVolume;
  }

  const validated = productDetailsSchema.safeParse(details);

  if (!validated.success) {
    return {
      data: null,
      error: "Não foi possível salvar os detalhes do produto.",
    } as const;
  }

  return {
    data: Object.keys(validated.data).length ? validated.data : null,
    error: null,
  } as const;
}
