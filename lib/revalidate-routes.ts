import { revalidatePath } from "next/cache";

function revalidatePaths(paths: readonly string[]) {
  paths.forEach((path) => revalidatePath(path));
}

export function revalidateProductSurfaces() {
  revalidatePaths(["/", "/produtos", "/venda", "/historico"]);
}

export function revalidateCustomerSurfaces() {
  revalidatePaths(["/", "/clientes", "/venda"]);
}

export function revalidateSalesSurfaces() {
  revalidatePaths(["/", "/venda", "/produtos", "/historico"]);
}
