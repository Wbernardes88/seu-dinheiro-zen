export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      budget_limits: {
        Row: {
          budget: number
          category: string
          category_id: string | null
          couple_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          budget: number
          category: string
          category_id?: string | null
          couple_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          budget?: number
          category?: string
          category_id?: string | null
          couple_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_limits_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_limits_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          couple_id: string
          created_at: string
          icon: string
          id: string
          name: string
          type: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          icon?: string
          id?: string
          name: string
          type: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          icon?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_weeks: {
        Row: {
          amount: number
          completed: boolean
          completed_at: string | null
          couple_id: string
          id: string
          week: number
        }
        Insert: {
          amount: number
          completed?: boolean
          completed_at?: string | null
          couple_id: string
          id?: string
          week: number
        }
        Update: {
          amount?: number
          completed?: boolean
          completed_at?: string | null
          couple_id?: string
          id?: string
          week?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenge_weeks_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_invites: {
        Row: {
          couple_id: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          invite_code: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          couple_id: string
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          invite_code?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          couple_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          invite_code?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_invites_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_members: {
        Row: {
          couple_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          couple_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          couple_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_members_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      couples: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      credit_cards: {
        Row: {
          brand: string
          closing_day: number
          color: string
          couple_id: string
          created_at: string
          credit_limit: number
          due_day: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          brand?: string
          closing_day?: number
          color?: string
          couple_id: string
          created_at?: string
          credit_limit?: number
          due_day?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          brand?: string
          closing_day?: number
          color?: string
          couple_id?: string
          created_at?: string
          credit_limit?: number
          due_day?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          nickname: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          nickname?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          nickname?: string
          updated_at?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          couple_id: string
          created_at: string
          current: number
          deadline: string | null
          icon: string
          id: string
          name: string
          responsible: string
          target: number
          updated_at: string
        }
        Insert: {
          couple_id: string
          created_at?: string
          current?: number
          deadline?: string | null
          icon?: string
          id?: string
          name: string
          responsible?: string
          target: number
          updated_at?: string
        }
        Update: {
          couple_id?: string
          created_at?: string
          current?: number
          deadline?: string | null
          icon?: string
          id?: string
          name?: string
          responsible?: string
          target?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_goals_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          couple_id: string
          created_at: string
          credit_card_id: string | null
          date: string
          description: string
          id: string
          installment_group_id: string | null
          installment_number: number | null
          is_fixed: boolean
          is_recurring: boolean
          payment_method: string
          total_installments: number | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          couple_id: string
          created_at?: string
          credit_card_id?: string | null
          date?: string
          description?: string
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          is_fixed?: boolean
          is_recurring?: boolean
          payment_method?: string
          total_installments?: number | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          couple_id?: string
          created_at?: string
          credit_card_id?: string | null
          date?: string
          description?: string
          id?: string
          installment_group_id?: string | null
          installment_number?: number | null
          is_fixed?: boolean
          is_recurring?: boolean
          payment_method?: string
          total_installments?: number | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_create_couple: { Args: { p_user_id: string }; Returns: string }
      get_user_couple_id: { Args: never; Returns: string }
      reset_challenge_weeks: {
        Args: { p_couple_id: string }
        Returns: undefined
      }
      toggle_challenge_week: {
        Args: { p_couple_id: string; p_week: number }
        Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
