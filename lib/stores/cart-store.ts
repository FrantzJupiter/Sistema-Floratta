import { create } from "zustand";

export type CartItem = {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  availableQuantity: number;
  productTypeLabel: string;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (incomingItem) =>
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.productId === incomingItem.productId,
      );

      if (!existingItem) {
        return {
          items: [
            ...state.items,
            {
              ...incomingItem,
              quantity: incomingItem.availableQuantity > 0 ? 1 : 0,
            },
          ].filter((item) => item.quantity > 0),
        };
      }

      if (existingItem.quantity >= existingItem.availableQuantity) {
        return state;
      }

      return {
        items: state.items.map((item) =>
          item.productId === incomingItem.productId
            ? {
                ...item,
                availableQuantity: incomingItem.availableQuantity,
                quantity: Math.min(item.quantity + 1, incomingItem.availableQuantity),
              }
            : item,
        ),
      };
    }),
  incrementItem: (productId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: Math.min(item.quantity + 1, item.availableQuantity),
            }
          : item,
      ),
    })),
  decrementItem: (productId) =>
    set((state) => ({
      items: state.items
        .map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity: Math.max(item.quantity - 1, 0),
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    })),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    })),
  clearCart: () => set({ items: [] }),
}));
