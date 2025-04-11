export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cost_center_approvers: {
        Row: {
          approval_limit: number
          cost_center: string
          created_at: string
          id: string
          user_email: string
          user_id: string
          user_name: string
        }
        Insert: {
          approval_limit: number
          cost_center: string
          created_at?: string
          id: string
          user_email: string
          user_id: string
          user_name: string
        }
        Update: {
          approval_limit?: number
          cost_center?: string
          created_at?: string
          id?: string
          user_email?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      goods_receipt_items: {
        Row: {
          created_at: string
          description: string
          id: string
          line_item_id: string
          notes: string | null
          quantity_ordered: number
          quantity_received: number
          receipt_id: string
          status: string
        }
        Insert: {
          created_at?: string
          description: string
          id: string
          line_item_id: string
          notes?: string | null
          quantity_ordered: number
          quantity_received: number
          receipt_id: string
          status: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          line_item_id?: string
          notes?: string | null
          quantity_ordered?: number
          quantity_received?: number
          receipt_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipts: {
        Row: {
          carrier: string | null
          created_at: string
          date_received: string
          delivery_note: string | null
          id: string
          po_id: string
          po_number: string
          receipt_number: string
          receiver_id: string
          receiver_name: string
          status: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          date_received?: string
          delivery_note?: string | null
          id: string
          po_id: string
          po_number: string
          receipt_number: string
          receiver_id: string
          receiver_name: string
          status: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          date_received?: string
          delivery_note?: string | null
          id?: string
          po_id?: string
          po_number?: string
          receipt_number?: string
          receiver_id?: string
          receiver_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipts_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      line_items: {
        Row: {
          category: string
          delivery_date: string | null
          description: string
          id: string
          notes: string | null
          po_id: string | null
          pr_id: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          category: string
          delivery_date?: string | null
          description: string
          id: string
          notes?: string | null
          po_id?: string | null
          pr_id?: string | null
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          category?: string
          delivery_date?: string | null
          description?: string
          id?: string
          notes?: string | null
          po_id?: string | null
          pr_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "line_items_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      pr_approvers: {
        Row: {
          approver_email: string
          approver_id: string
          approver_name: string
          comment: string | null
          created_at: string
          date: string | null
          id: string
          pr_id: string | null
          status: string
        }
        Insert: {
          approver_email: string
          approver_id: string
          approver_name: string
          comment?: string | null
          created_at?: string
          date?: string | null
          id: string
          pr_id?: string | null
          status?: string
        }
        Update: {
          approver_email?: string
          approver_id?: string
          approver_name?: string
          comment?: string | null
          created_at?: string
          date?: string | null
          id?: string
          pr_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pr_approvers_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          billing_address: string
          created_at: string
          currency: string
          date_created: string
          id: string
          po_number: string
          pr_id: string | null
          required_date: string
          shipping_address: string
          status: string
          total_amount: number
          vendor_id: string
          version: number
        }
        Insert: {
          billing_address: string
          created_at?: string
          currency: string
          date_created?: string
          id: string
          po_number: string
          pr_id?: string | null
          required_date: string
          shipping_address: string
          status: string
          total_amount: number
          vendor_id: string
          version?: number
        }
        Update: {
          billing_address?: string
          created_at?: string
          currency?: string
          date_created?: string
          id?: string
          po_number?: string
          pr_id?: string | null
          required_date?: string
          shipping_address?: string
          status?: string
          total_amount?: number
          vendor_id?: string
          version?: number
        }
        Relationships: []
      }
      purchase_requisitions: {
        Row: {
          budget_code: string
          cost_center: string
          created_at: string
          date_created: string
          date_needed: string
          department: string
          id: string
          justification: string
          requester_email: string
          requester_id: string
          requester_name: string
          status: string
          total_amount: number
          version: number
        }
        Insert: {
          budget_code: string
          cost_center: string
          created_at?: string
          date_created?: string
          date_needed: string
          department: string
          id: string
          justification: string
          requester_email: string
          requester_id: string
          requester_name: string
          status: string
          total_amount: number
          version?: number
        }
        Update: {
          budget_code?: string
          cost_center?: string
          created_at?: string
          date_created?: string
          date_needed?: string
          department?: string
          id?: string
          justification?: string
          requester_email?: string
          requester_id?: string
          requester_name?: string
          status?: string
          total_amount?: number
          version?: number
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          id: string
          name: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          id: string
          name: string
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string
          category: string[]
          contact_person: string
          created_at: string
          email: string
          id: string
          name: string
          payment_terms: string
          phone: string
          status: string
          tax_id: string
          updated_at: string
        }
        Insert: {
          address: string
          category: string[]
          contact_person: string
          created_at?: string
          email: string
          id: string
          name: string
          payment_terms: string
          phone: string
          status?: string
          tax_id: string
          updated_at?: string
        }
        Update: {
          address?: string
          category?: string[]
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          payment_terms?: string
          phone?: string
          status?: string
          tax_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
