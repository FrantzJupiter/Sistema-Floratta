import { LogOut } from "lucide-react";

import { signOutAction } from "@/app/actions/auth";

type SessionFooterBarProps = {
  isAdmin?: boolean;
  userEmail: string;
};

export function SessionFooterBar({
  isAdmin = false,
  userEmail,
}: SessionFooterBarProps) {
  return (
    <section className="rounded-[2rem] border border-white/45 bg-white/60 p-4 shadow-panel-down backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-rose-700">
            Sessão atual
          </span>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-zinc-800">{userEmail}</p>
            <span className="rounded-full border border-white/50 bg-white/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-700">
              {isAdmin ? "Administrador" : "Usuário autenticado"}
            </span>
          </div>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-rose-200/80 bg-gradient-to-b from-rose-50/80 to-rose-100/30 px-4 text-sm font-medium text-rose-900 shadow-[0_4px_12px_rgba(225,29,72,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] transition-all hover:from-rose-100/90 hover:to-rose-100/50"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </form>
      </div>
    </section>
  );
}
