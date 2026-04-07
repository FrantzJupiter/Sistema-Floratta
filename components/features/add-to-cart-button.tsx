"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/stores/cart-store";

type AddToCartButtonProps = {
  product: {
    productId: string;
    name: string;
    sku: string;
    unitPrice: number;
    availableQuantity: number;
    productTypeLabel: string;
  };
};

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const quantityInCart = useCartStore(
    (state) =>
      state.items.find((item) => item.productId === product.productId)?.quantity ?? 0,
  );
  const addItem = useCartStore((state) => state.addItem);

  const isOutOfStock = product.availableQuantity <= 0;
  const reachedLimit = quantityInCart >= product.availableQuantity;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 w-full rounded-xl border-rose-200 bg-rose-50/70 px-2.5 text-xs text-rose-900 hover:bg-rose-100"
      disabled={isOutOfStock || reachedLimit}
      onClick={() => addItem(product)}
    >
      {isOutOfStock
        ? "Sem estoque"
        : reachedLimit
          ? "Limite no carrinho"
          : quantityInCart > 0
            ? `Adicionar mais (${quantityInCart})`
            : "Adicionar ao carrinho"}
    </Button>
  );
}
