import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth/user";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
