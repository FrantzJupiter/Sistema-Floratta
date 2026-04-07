"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ReceiptText,
  ShoppingBag,
  Users,
} from "lucide-react";

import { useCartStore } from "@/lib/stores/cart-store";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/",
    label: "Inicio",
    icon: LayoutDashboard,
  },
  {
    href: "/venda",
    label: "Venda",
    icon: ShoppingBag,
  },
  {
    href: "/produtos",
    label: "Produtos",
    icon: Package,
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: Users,
  },
  {
    href: "/historico",
    label: "Historico",
    icon: ReceiptText,
  },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const cartItemsCount = useCartStore((state) =>
    state.items.reduce((accumulator, item) => accumulator + item.quantity, 0),
  );

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/50 bg-white/70 px-4 py-4 shadow-panel-down backdrop-blur-xl sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,_rgba(122,31,75,0.92),_rgba(225,131,162,0.88))] text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-lg shadow-rose-200/70">
              FL
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-950">Sistema Floratta</p>
              <p className="text-xs uppercase tracking-[0.22em] text-rose-700">
                Varejo, estoque e recibos
              </p>
            </div>
          </Link>

          <nav className="-mx-1 overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2 px-1">
              {navigationItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition",
                      isActive
                        ? "border-rose-200 bg-rose-100/85 text-rose-900 shadow-sm"
                        : "border-white/40 bg-white/65 text-zinc-600 hover:border-rose-100 hover:bg-white hover:text-zinc-950",
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                    {item.href === "/venda" && cartItemsCount > 0 ? (
                      <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                        {cartItemsCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
