"use client";

import { useActionState, useDeferredValue, useState } from "react";

import {
  deleteCustomerAction,
  updateCustomerAction,
} from "@/app/actions/customers";
import { CustomerQuickCreateForm } from "@/components/features/customer-quick-create-form";
import { Button } from "@/components/ui/button";
import { CpfInput } from "@/components/ui/cpf-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { buildCpfSearchText, formatCpf } from "@/lib/formatters/cpf";
import { buildPhoneSearchText, formatPhone } from "@/lib/formatters/phone";
import {
  initialCustomerCreateActionState,
  initialCustomerDeleteActionState,
  type CustomerCreateActionState,
  type CustomerDeleteActionState,
} from "@/lib/validations/customer";
import type { RegisteredCustomer } from "@/services/customers";

type CustomersWorkspaceProps = {
  customers: RegisteredCustomer[];
  isAdmin?: boolean;
  title?: string;
};

function getCustomerInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getCustomerSearchText(customer: RegisteredCustomer) {
  return [
    customer.name,
    buildCpfSearchText(customer.cpf),
    buildPhoneSearchText(customer.phone),
    customer.address ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function CustomerCard({
  customer,
  isAdmin,
}: {
  customer: RegisteredCustomer;
  isAdmin: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [updateState, updateFormAction, updatePending] = useActionState<
    CustomerCreateActionState,
    FormData
  >(updateCustomerAction, initialCustomerCreateActionState);
  const [deleteState, deleteFormAction, deletePending] = useActionState<
    CustomerDeleteActionState,
    FormData
  >(deleteCustomerAction, initialCustomerDeleteActionState);

  return (
    <article className="rounded-[1.75rem] border border-white/60 bg-gradient-to-br from-white/80 to-white/30 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(145deg,_rgba(122,31,75,0.92),_rgba(225,131,162,0.88))] text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_4px_12px_rgba(225,29,72,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)]">
            {getCustomerInitials(customer.name)}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-xl font-semibold text-zinc-950">{customer.name}</h3>
            <p className="text-sm text-zinc-600">
              Cadastrado em {new Date(customer.created_at).toLocaleString("pt-BR")}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {customer.cpf ? (
                <span className="rounded-full border border-white/60 bg-white/75 px-3 py-1 text-xs text-zinc-600">
                  CPF: {formatCpf(customer.cpf)}
                </span>
              ) : null}
              {customer.phone ? (
                <span className="rounded-full border border-white/60 bg-white/75 px-3 py-1 text-xs text-zinc-600">
                  Tel: {formatPhone(customer.phone)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {customer.address ? (
          <p className="text-sm leading-6 text-zinc-600">{customer.address}</p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-6 text-sm" aria-live="polite">
            {deleteState.message ? (
              <p className={deleteState.status === "success" ? "text-emerald-700" : "text-rose-600"}>
                {deleteState.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl border border-white/70 bg-gradient-to-b from-white/80 to-white/30 text-zinc-800 shadow-[0_4px_12px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md transition-all hover:from-white/90 hover:to-white/50 active:scale-[0.98] active:shadow-inner"
              onClick={() => setIsEditing((current) => !current)}
            >
              {isEditing ? "Fechar edição" : "Editar cliente"}
            </Button>

            {isAdmin ? (
              <form action={deleteFormAction}>
                <input type="hidden" name="customerId" value={customer.id} />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={deletePending}
                  className="rounded-2xl border border-rose-200/80 bg-gradient-to-b from-rose-50/80 to-rose-100/30 text-rose-900 shadow-[0_4px_12px_rgba(225,29,72,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md transition-all hover:from-rose-100/90 hover:to-rose-100/50 active:scale-[0.98] active:shadow-inner"
                  onClick={(event) => {
                    if (
                      !window.confirm(
                        `Excluir ${customer.name}? O nome impresso nas vendas antigas será preservado, mas o cadastro será removido.`,
                      )
                    ) {
                      event.preventDefault();
                    }
                  }}
                >
                  {deletePending ? "Excluindo..." : "Excluir cliente"}
                </Button>
              </form>
            ) : null}
          </div>
        </div>

        {isEditing ? (
          <form
            key={updateState.status === "success" ? updateState.message : customer.id}
            action={updateFormAction}
            className="grid gap-4 rounded-[1.5rem] border border-white/40 bg-black/5 p-4 shadow-[inset_0_2px_10px_rgba(0,0,0,0.03)] backdrop-blur-sm"
          >
            <input type="hidden" name="customerId" value={customer.id} />

            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">Nome do cliente</span>
              <input
                name="name"
                defaultValue={customer.name}
                className="h-11 rounded-2xl border border-white/50 bg-white/40 px-4 text-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md outline-none transition-all hover:bg-white/50 focus:border-rose-300 focus:bg-white/60 focus:ring-4 focus:ring-rose-200/50"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-zinc-700">
                <span className="font-medium">CPF</span>
                <CpfInput
                  name="cpf"
                  defaultValue={customer.cpf ?? ""}
                  placeholder="000.000.000-00"
                  className="h-11 rounded-2xl border border-white/50 bg-white/40 px-4 text-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md outline-none transition-all hover:bg-white/50 focus:border-rose-300 focus:bg-white/60 focus:ring-4 focus:ring-rose-200/50"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-700">
                <span className="font-medium">Telefone</span>
                <PhoneInput
                  name="phone"
                  defaultValue={customer.phone ?? ""}
                  placeholder="(00) 0 0000-0000"
                  className="h-11 rounded-2xl border border-white/50 bg-white/40 px-4 text-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md outline-none transition-all hover:bg-white/50 focus:border-rose-300 focus:bg-white/60 focus:ring-4 focus:ring-rose-200/50"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">Endereço</span>
              <input
                name="address"
                defaultValue={customer.address ?? ""}
                placeholder="Opcional"
                className="h-11 rounded-2xl border border-white/50 bg-white/40 px-4 text-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md outline-none transition-all hover:bg-white/50 focus:border-rose-300 focus:bg-white/60 focus:ring-4 focus:ring-rose-200/50"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div aria-live="polite" className="min-h-6 text-sm">
                {updateState.message ? (
                  <p
                    className={
                      updateState.status === "success" ? "text-emerald-700" : "text-rose-600"
                    }
                  >
                    {updateState.message}
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                disabled={updatePending}
                className="rounded-2xl border border-rose-800/80 bg-gradient-to-b from-rose-700 to-rose-950 px-5 text-white shadow-[0_4px_12px_rgba(159,18,57,0.3),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-all hover:from-rose-600 hover:to-rose-900 active:scale-[0.98] active:shadow-inner"
              >
                {updatePending ? "Salvando..." : "Salvar cliente"}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </article>
  );
}

export function CustomersWorkspace({
  customers,
  isAdmin = false,
  title = "Clientes",
}: CustomersWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [currentTime] = useState(() => Date.now());
  const [recentWindow, setRecentWindow] = useState<"7d" | "30d">("7d");
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredCustomers = customers.filter((customer) =>
    getCustomerSearchText(customer).includes(normalizedQuery),
  );
  const recentCustomers = customers.filter((customer) => {
    const createdAt = new Date(customer.created_at).getTime();
    const windowInDays = recentWindow === "7d" ? 7 : 30;
    const threshold = currentTime - windowInDays * 24 * 60 * 60 * 1000;
    return createdAt >= threshold;
  }).length;

  return (
    <div className="grid items-start gap-6">
      <aside className="min-w-0">
        <div className="grid gap-4 rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/60 to-white/20 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-2xl sm:p-6">
          <CustomerQuickCreateForm submitLabel="Salvar cliente" title="Novo cliente" />
        </div>
      </aside>

      <section className="flex min-w-0 flex-col gap-4 rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/60 to-white/20 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-2xl sm:p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-950">{title}</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/70 to-white/30 px-4 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Cadastrados</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{customers.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/70 to-white/30 px-4 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-md">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Cadastros</p>
                <div className="relative">
                  <select
                    value={recentWindow}
                    onChange={(event) => setRecentWindow(event.target.value as "7d" | "30d")}
                    className="h-7 w-full appearance-none rounded-xl border border-white/70 bg-gradient-to-b from-white/80 to-white/30 pl-2.5 pr-7 text-[10px] font-medium text-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md outline-none transition-all hover:from-white/90 hover:to-white/50 focus:border-rose-300 focus:ring-3 focus:ring-rose-200/50"
                  >
                    <option value="7d">7 dias</option>
                    <option value="30d">mês</option>
                  </select>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-zinc-500"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{recentCustomers}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/60 bg-gradient-to-br from-white/80 to-white/40 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-md">
          <label className="grid gap-2 text-sm text-zinc-700">
            <span className="font-medium">Buscar cliente</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Procure por nome, CPF, telefone ou endereço"
              className="h-11 rounded-2xl border border-white/50 bg-white/40 px-4 text-zinc-900 shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] backdrop-blur-md outline-none transition-all hover:bg-white/50 focus:border-rose-300 focus:bg-white/60 focus:ring-4 focus:ring-rose-200/50"
            />
          </label>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-rose-300/50 bg-gradient-to-b from-rose-50/50 to-transparent px-5 py-10 text-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] backdrop-blur-sm">
            <p className="text-base font-medium text-zinc-800">Nenhum cliente foi encontrado.</p>
            <p className="mt-2 text-sm text-zinc-600">
              Cadastre um novo nome ou ajuste a pesquisa para continuar.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 2xl:grid-cols-2">
            {filteredCustomers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} isAdmin={isAdmin} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
