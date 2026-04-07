"use client";

import { useActionState, useDeferredValue, useState } from "react";

import {
  deleteCustomerAction,
  updateCustomerAction,
} from "@/app/actions/customers";
import { CustomerQuickCreateForm } from "@/components/features/customer-quick-create-form";
import { Button } from "@/components/ui/button";
import {
  initialCustomerCreateActionState,
  initialCustomerDeleteActionState,
  type CustomerCreateActionState,
  type CustomerDeleteActionState,
} from "@/lib/validations/customer";
import type { RegisteredCustomer } from "@/services/customers";

type CustomersWorkspaceProps = {
  customers: RegisteredCustomer[];
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
  return [customer.name, customer.cpf ?? "", customer.phone ?? "", customer.address ?? ""]
    .join(" ")
    .toLowerCase();
}

function CustomerCard({ customer }: { customer: RegisteredCustomer }) {
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
    <article className="rounded-[1.75rem] border border-white/55 bg-white/78 p-5 shadow-card-down">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] bg-[linear-gradient(145deg,_rgba(122,31,75,0.92),_rgba(225,131,162,0.88))] text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-lg shadow-rose-200/70">
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
                  CPF: {customer.cpf}
                </span>
              ) : null}
              {customer.phone ? (
                <span className="rounded-full border border-white/60 bg-white/75 px-3 py-1 text-xs text-zinc-600">
                  Tel: {customer.phone}
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
              className="rounded-2xl border-zinc-200 bg-white/80"
              onClick={() => setIsEditing((current) => !current)}
            >
              {isEditing ? "Fechar edicao" : "Editar cliente"}
            </Button>

            <form action={deleteFormAction}>
              <input type="hidden" name="customerId" value={customer.id} />
              <Button
                type="submit"
                variant="outline"
                disabled={deletePending}
                className="rounded-2xl border-rose-200 bg-rose-50/70 text-rose-900 hover:bg-rose-100"
                onClick={(event) => {
                  if (
                    !window.confirm(
                      `Excluir ${customer.name}? O nome impresso nas vendas antigas sera preservado, mas o cadastro sera removido.`,
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                {deletePending ? "Excluindo..." : "Excluir cliente"}
              </Button>
            </form>
          </div>
        </div>

        {isEditing ? (
          <form
            key={updateState.status === "success" ? updateState.message : customer.id}
            action={updateFormAction}
            className="grid gap-4 rounded-[1.5rem] border border-white/55 bg-white/72 p-4 shadow-card-down"
          >
            <input type="hidden" name="customerId" value={customer.id} />

            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">Nome do cliente</span>
              <input
                name="name"
                defaultValue={customer.name}
                className="h-11 rounded-2xl border border-white/45 bg-white/80 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-zinc-700">
                <span className="font-medium">CPF</span>
                <input
                  name="cpf"
                  defaultValue={customer.cpf ?? ""}
                  placeholder="Opcional"
                  className="h-11 rounded-2xl border border-white/45 bg-white/80 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-700">
                <span className="font-medium">Telefone</span>
                <input
                  name="phone"
                  defaultValue={customer.phone ?? ""}
                  placeholder="Opcional"
                  className="h-11 rounded-2xl border border-white/45 bg-white/80 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium">Endereco</span>
              <input
                name="address"
                defaultValue={customer.address ?? ""}
                placeholder="Opcional"
                className="h-11 rounded-2xl border border-white/45 bg-white/80 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
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
                className="rounded-2xl bg-rose-900 px-5 text-white hover:bg-rose-800"
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
        <div className="grid gap-4 rounded-[2rem] border border-white/45 bg-white/60 p-4 sm:p-6 shadow-panel-down backdrop-blur-xl">
          <CustomerQuickCreateForm submitLabel="Salvar cliente" title="Novo cliente" />
        </div>
      </aside>

      <section className="flex min-w-0 flex-col gap-4 rounded-[2rem] border border-white/45 bg-white/60 p-4 sm:p-6 shadow-panel-down backdrop-blur-xl">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-zinc-950">{title}</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.5rem] border border-white/55 bg-white/75 px-4 py-4 shadow-card-down">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Cadastrados</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{customers.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/55 bg-white/75 px-4 py-4 shadow-card-down">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Cadastros</p>
                <select
                  value={recentWindow}
                  onChange={(event) => setRecentWindow(event.target.value as "7d" | "30d")}
                  className="h-7 max-w-20 rounded-lg border border-white/45 bg-white/80 px-2 text-[10px] font-medium text-zinc-700 shadow-sm outline-none transition focus:border-rose-300 focus:ring-3 focus:ring-rose-100"
                >
                  <option value="7d">7 dias</option>
                  <option value="30d">mes</option>
                </select>
              </div>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{recentCustomers}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/55 bg-white/75 p-4 shadow-card-down">
          <label className="grid gap-2 text-sm text-zinc-700">
            <span className="font-medium">Buscar cliente</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Procure por nome, CPF, telefone ou endereco"
              className="h-11 rounded-2xl border border-white/45 bg-white/80 px-4 text-zinc-900 shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
            />
          </label>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-rose-200 bg-rose-50/65 px-5 py-10 text-center">
            <p className="text-base font-medium text-zinc-800">
              Nenhum cliente foi encontrado.
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Cadastre um novo nome ou ajuste a pesquisa para continuar.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 2xl:grid-cols-2">
            {filteredCustomers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
