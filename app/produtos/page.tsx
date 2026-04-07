import { connection } from "next/server";

import { ProductsWorkspace } from "@/components/features/products-workspace";
import { PageHeader } from "@/components/layout/page-header";
import { listCatalogProducts } from "@/services/products";

export const metadata = {
  title: "Produtos",
};

export default async function ProductsPage() {
  await connection();

  const products = await listCatalogProducts();

  return (
    <>
      <PageHeader
        badge="Catalogo"
        title="Produtos e estoque"
        description="Cadastre novos itens, refine os metadados e mantenha o inventario visualmente organizado."
      />
      <ProductsWorkspace products={products} />
    </>
  );
}
