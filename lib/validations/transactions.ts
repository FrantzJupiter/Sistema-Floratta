export type TransactionHistoryActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialTransactionHistoryActionState: TransactionHistoryActionState = {
  status: "idle",
  message: "",
};
