import { createAdminClient } from "@/lib/supabase/admin";
import type { SaleReceipt, SaleReceiptItem } from "@/lib/receipts/types";
import type { Tables } from "@/lib/supabase";

export type RecentSaleItem = SaleReceiptItem;

export type RecentSale = Tables<"transactions"> &
  Pick<SaleReceipt, "customerName" | "items" | "subtotalAmount" | "totalAmount" | "totalItems">;

function buildItemsByTransactionId(
  transactionItems: Tables<"transaction_items">[],
  productLookup: Map<string, Pick<Tables<"products">, "id" | "name" | "sku">>,
) {
  const itemsByTransactionId = new Map<string, RecentSaleItem[]>();

  transactionItems.forEach((item) => {
    if (!item.transaction_id) {
      return;
    }

    const product = item.product_id ? productLookup.get(item.product_id) : null;
    const enrichedItem: RecentSaleItem = {
      id: item.id,
      lineTotal: Number(item.price_at_time) * item.quantity,
      priceAtTime: Number(item.price_at_time),
      productId: item.product_id,
      productName: product?.name ?? null,
      productSku: product?.sku ?? null,
      quantity: item.quantity,
    };

    const existingItems = itemsByTransactionId.get(item.transaction_id) ?? [];
    existingItems.push(enrichedItem);
    itemsByTransactionId.set(item.transaction_id, existingItems);
  });

  return itemsByTransactionId;
}

async function loadProductsLookup(productIds: string[]) {
  const supabase = createAdminClient();
  const productLookup = new Map<
    string,
    Pick<Tables<"products">, "id" | "name" | "sku">
  >();

  if (!productIds.length) {
    return productLookup;
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, sku")
    .in("id", productIds);

  if (productsError) {
    throw new Error(
      `Falha ao carregar produtos das vendas: ${productsError.message}`,
    );
  }

  products.forEach((product) => {
    productLookup.set(product.id, product);
  });

  return productLookup;
}

export async function listRecentSales(limit = 6) {
  const supabase = createAdminClient();

  const { data: transactions, error: transactionsError } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (transactionsError) {
    throw new Error(`Falha ao carregar vendas: ${transactionsError.message}`);
  }

  if (!transactions.length) {
    return [] as RecentSale[];
  }

  const transactionIds = transactions.map((transaction) => transaction.id);

  const { data: transactionItems, error: transactionItemsError } = await supabase
    .from("transaction_items")
    .select("*")
    .in("transaction_id", transactionIds);

  if (transactionItemsError) {
    throw new Error(
      `Falha ao carregar itens das vendas: ${transactionItemsError.message}`,
    );
  }

  const productIds = Array.from(
    new Set(
      transactionItems
        .map((item) => item.product_id)
        .filter((productId): productId is string => typeof productId === "string"),
    ),
  );

  const productLookup = await loadProductsLookup(productIds);
  const itemsByTransactionId = buildItemsByTransactionId(transactionItems, productLookup);

  return transactions.map<RecentSale>((transaction) => {
    const items = itemsByTransactionId.get(transaction.id) ?? [];
    const subtotalAmount = items.reduce(
      (accumulator, item) => accumulator + item.lineTotal,
      0,
    );
    const totalItems = items.reduce(
      (accumulator, item) => accumulator + item.quantity,
      0,
    );

    return {
      ...transaction,
      customerName: transaction.customer_name ?? null,
      items,
      subtotalAmount,
      totalAmount: Number(transaction.total_amount),
      totalItems,
    };
  });
}

export async function listSalesHistory(limit = 90) {
  return listRecentSales(limit);
}

export async function getSaleReceipt(transactionId: string) {
  const supabase = createAdminClient();

  const { data: transaction, error: transactionError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", transactionId)
    .maybeSingle();

  if (transactionError) {
    throw new Error(`Falha ao carregar a venda: ${transactionError.message}`);
  }

  if (!transaction) {
    throw new Error("A venda concluida nao foi encontrada no banco.");
  }

  const { data: transactionItems, error: transactionItemsError } = await supabase
    .from("transaction_items")
    .select("*")
    .eq("transaction_id", transactionId);

  if (transactionItemsError) {
    throw new Error(
      `Falha ao carregar os itens da venda: ${transactionItemsError.message}`,
    );
  }

  const productIds = Array.from(
    new Set(
      transactionItems
        .map((item) => item.product_id)
        .filter((productId): productId is string => typeof productId === "string"),
    ),
  );

  const productLookup = await loadProductsLookup(productIds);
  const items = buildItemsByTransactionId(transactionItems, productLookup).get(transactionId) ?? [];
  const subtotalAmount = items.reduce(
    (accumulator, item) => accumulator + item.lineTotal,
    0,
  );
  const totalItems = items.reduce(
    (accumulator, item) => accumulator + item.quantity,
    0,
  );

  return {
    createdAt: transaction.created_at,
    customerName: transaction.customer_name ?? null,
    discountAmount: Number(transaction.discount ?? 0),
    id: transaction.id,
    items,
    subtotalAmount,
    totalAmount: Number(transaction.total_amount),
    totalItems,
  } satisfies SaleReceipt;
}
