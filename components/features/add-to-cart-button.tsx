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
      className="h-8 w-full rounded-xl border border-rose-200/80 bg-gradient-to-b from-rose-50/80 to-rose-100/30 px-2.5 text-xs text-rose-900 shadow-[0_4px_12px_rgba(225,29,72,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-md hover:from-rose-100/90 hover:to-rose-100/50 active:scale-[0.98] active:shadow-inner transition-all disabled:opacity-50 disabled:pointer-events-none"
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
