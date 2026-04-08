type ProductQrPayloadInput = {
  id: string;
  name: string;
  sku: string;
};

export function buildProductQrValue(product: ProductQrPayloadInput) {
  return JSON.stringify({
    kind: "floratta-product",
    productId: product.id,
    productName: product.name,
    sku: product.sku,
  });
}

export function getProductQrPrintTitle(product: ProductQrPayloadInput) {
  return `${product.name} · ${product.sku}`;
}
