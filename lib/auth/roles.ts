import { getCurrentUser } from "@/lib/auth/user";

const ADMIN_EMAILS = new Set([
  "luisfrantzjr@gmail.com",
  "rayanemlest@gmail.com",
]);

export type AppRole = "admin" | "user";

export function isAdminEmail(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return false;
  }

  return ADMIN_EMAILS.has(normalizedEmail);
}

export async function getCurrentUserRole(): Promise<AppRole> {
  const user = await getCurrentUser();

  return isAdminEmail(user?.email) ? "admin" : "user";
}
