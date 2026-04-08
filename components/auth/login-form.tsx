"use client";

import { useActionState } from "react";

import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  initialLoginActionState,
  type LoginActionState,
} from "@/lib/validations/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginActionState, FormData>(
    loginAction,
    initialLoginActionState,
  );

  return (
    <form
      action={formAction}
      className="grid gap-5 rounded-[2rem] border border-white/55 bg-white/80 p-5 shadow-panel-down backdrop-blur-xl sm:p-6"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-950">Entrar no Floratta</h1>
        <p className="text-sm leading-6 text-zinc-600">
          Use o e-mail e a senha cadastrados no Supabase Auth para acessar o sistema.
        </p>
      </div>

      <label className="grid gap-2 text-sm text-zinc-700">
        <span className="font-medium">E-mail</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@floratta.com"
          className="h-11 rounded-2xl border border-white/45 bg-white/75 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
        />
        {state.fieldErrors?.email?.length ? (
          <p className="text-xs text-rose-600">{state.fieldErrors.email[0]}</p>
        ) : null}
      </label>

      <label className="grid gap-2 text-sm text-zinc-700">
        <span className="font-medium">Senha</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          className="h-11 rounded-2xl border border-white/45 bg-white/75 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
        />
        {state.fieldErrors?.password?.length ? (
          <p className="text-xs text-rose-600">{state.fieldErrors.password[0]}</p>
        ) : null}
      </label>

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="h-11 rounded-2xl bg-gradient-to-b from-rose-700 to-rose-900 text-white hover:from-rose-600 hover:to-rose-800"
        >
          {pending ? "Entrando..." : "Entrar"}
        </Button>

        <div aria-live="polite" className="min-h-5 text-sm">
          {state.message ? <p className="text-rose-700">{state.message}</p> : null}
        </div>
      </div>
    </form>
  );
}
