import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Variaveis de ambiente do Supabase invalidas: ${parsedEnv.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ")}`,
  );
}

const supabasePublishableKey =
  parsedEnv.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  parsedEnv.data.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabasePublishableKey) {
  throw new Error(
    "Defina NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (preferido) ou NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

export const env = {
  supabaseUrl: parsedEnv.data.NEXT_PUBLIC_SUPABASE_URL,
  supabasePublishableKey,
  supabaseServiceRoleKey: parsedEnv.data.SUPABASE_SERVICE_ROLE_KEY ?? null,
};
