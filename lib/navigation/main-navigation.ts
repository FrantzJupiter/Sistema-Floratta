export const mainNavigationItems = [
  {
    href: "/",
    label: "Início",
  },
  {
    href: "/venda",
    label: "Venda",
  },
  {
    href: "/produtos",
    label: "Produtos",
  },
  {
    href: "/clientes",
    label: "Clientes",
  },
  {
    href: "/historico",
    label: "Histórico",
  },
] as const;

export function isMainNavigationActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findMainNavigationIndex(pathname: string) {
  return mainNavigationItems.findIndex((item) => isMainNavigationActive(pathname, item.href));
}
