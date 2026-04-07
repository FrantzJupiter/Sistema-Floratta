import { connection } from "next/server";

import { ProductsWorkspace } from "@/components/features/products-workspace";
import { listCatalogProducts } from "@/services/products";

export const metadata = {
  title: "Produtos",
};

export default async function ProductsPage() {
  await connection();

  const products = await listCatalogProducts();

  return <ProductsWorkspace products={products} />;
}
