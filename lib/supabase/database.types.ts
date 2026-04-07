export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      inventory_levels: {
        Row: {
          last_updated: string;
          product_id: string;
          quantity: number;
        };
        Insert: {
          last_updated?: string;
          product_id: string;
          quantity: number;
        };
        Update: {
          last_updated?: string;
          product_id?: string;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_levels_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          base_price: number;
          created_at: string;
          id: string;
          image_url: string | null;
          name: string;
          sku: string;
        };
        Insert: {
          base_price: number;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          name: string;
          sku: string;
        };
        Update: {
          base_price?: number;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          name?: string;
          sku?: string;
        };
        Relationships: [];
      };
      transaction_items: {
        Row: {
          id: string;
          price_at_time: number;
          product_id: string | null;
          quantity: number;
          transaction_id: string | null;
        };
        Insert: {
          id?: string;
          price_at_time: number;
          product_id?: string | null;
          quantity: number;
          transaction_id?: string | null;
        };
        Update: {
          id?: string;
          price_at_time?: number;
          product_id?: string | null;
          quantity?: number;
          transaction_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          created_at: string;
          customer_id: string | null;
          customer_name: string | null;
          discount: number | null;
          employee_id: string | null;
          id: string;
          total_amount: number;
        };
        Insert: {
          created_at?: string;
          customer_id?: string | null;
          customer_name?: string | null;
          discount?: number | null;
          employee_id?: string | null;
          id?: string;
          total_amount: number;
        };
        Update: {
          created_at?: string;
          customer_id?: string | null;
          customer_name?: string | null;
          discount?: number | null;
          employee_id?: string | null;
          id?: string;
          total_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      variant_metadata: {
        Row: {
          attributes: Json;
          created_at: string;
          id: string;
          product_id: string | null;
        };
        Insert: {
          attributes: Json;
          created_at?: string;
          id?: string;
          product_id?: string | null;
        };
        Update: {
          attributes?: Json;
          created_at?: string;
          id?: string;
          product_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "variant_metadata_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      process_checkout: {
        Args: {
          p_cart_items: Json;
          p_customer_id?: string | null;
          p_customer_name?: string | null;
          p_discount_amount?: number | null;
          p_employee_id?: string | null;
        };
        Returns: {
          subtotal_amount: number;
          total_amount: number;
          transaction_id: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

type PublicSchema = Database["public"];

export type Tables<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Update"];
