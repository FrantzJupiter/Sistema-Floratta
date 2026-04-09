"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type LucideIcon,
  LayoutDashboard,
  Package,
  ReceiptText,
  ShoppingBag,
  Users,
} from "lucide-react";

import { mainNavigationItems, isMainNavigationActive } from "@/lib/navigation/main-navigation";
import { useCartStore } from "@/lib/stores/cart-store";
import { cn } from "@/lib/utils";

const navigationIcons: Record<string, LucideIcon> = {
  "/": LayoutDashboard,
  "/clientes": Users,
  "/historico": ReceiptText,
  "/produtos": Package,
  "/venda": ShoppingBag,
};

export function TopNav() {
  const pathname = usePathname();
  const cartItemsCount = useCartStore((state) =>
    state.items.reduce((accumulator, item) => accumulator + item.quantity, 0),
  );

  if (pathname === "/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 px-4 pt-2.5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/50 bg-white/70 px-4 py-2.5 shadow-panel-down backdrop-blur-xl sm:px-5">
        <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-[4.75rem] items-center justify-center px-1">
              <Image
                src="/logo.svg"
                alt="Floratta"
                width={214}
                height={113}
                unoptimized
                className="h-6.5 w-auto object-contain"
                priority
              />
            </div>
            <div className="flex items-center">
              <p className="text-lg font-semibold leading-none text-zinc-950 sm:text-xl">
                Sistema Floratta
              </p>
            </div>
          </Link>

          <nav className="-mx-1 top-nav-scrollbar overflow-x-auto pb-1.5" data-swipe-nav-ignore>
            <div className="flex min-w-max gap-2 px-1">
              {mainNavigationItems.map((item) => {
                const isActive = isMainNavigationActive(pathname, item.href);
                const Icon = navigationIcons[item.href];

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-2xl border px-3 py-[0.3125rem] text-sm font-medium transition",
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
