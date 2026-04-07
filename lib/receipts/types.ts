export type SaleReceiptItem = {
  id: string;
  lineTotal: number;
  priceAtTime: number;
  productId: string | null;
  productName: string | null;
  productSku: string | null;
  quantity: number;
};

export type SaleReceipt = {
  createdAt: string;
  customerName: string | null;
  discountAmount: number;
  id: string;
  items: SaleReceiptItem[];
  subtotalAmount: number;
  totalAmount: number;
  totalItems: number;
};
