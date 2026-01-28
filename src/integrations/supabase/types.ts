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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          user_id?: string | null
        }
        Relationships: []
      }
      complaints: {
        Row: {
          amount_lost: number | null
          currency: string | null
          current_status: string | null
          description: string
          id: string
          incident_date: string | null
          reporter_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: Database["public"]["Enums"]["severity_level"]
          status: Database["public"]["Enums"]["complaint_status"]
          submitted_at: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount_lost?: number | null
          currency?: string | null
          current_status?: string | null
          description: string
          id?: string
          incident_date?: string | null
          reporter_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity: Database["public"]["Enums"]["severity_level"]
          status?: Database["public"]["Enums"]["complaint_status"]
          submitted_at?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount_lost?: number | null
          currency?: string | null
          current_status?: string | null
          description?: string
          id?: string
          incident_date?: string | null
          reporter_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: Database["public"]["Enums"]["severity_level"]
          status?: Database["public"]["Enums"]["complaint_status"]
          submitted_at?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles_moderation_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          complaint_id: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          uploaded_at: string
        }
        Insert: {
          complaint_id: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          uploaded_at?: string
        }
        Update: {
          complaint_id?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email_verified: boolean | null
          id: string
          phone_number: string | null
          phone_verified: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email_verified?: boolean | null
          id?: string
          phone_number?: string | null
          phone_verified?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email_verified?: boolean | null
          id?: string
          phone_number?: string | null
          phone_verified?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          bank_accounts: Json | null
          created_at: string
          created_by: string | null
          email_addresses: string[] | null
          first_complaint_date: string | null
          highest_severity: Database["public"]["Enums"]["severity_level"] | null
          id: string
          is_public: boolean | null
          name: string
          phone_numbers: string[] | null
          social_handles: Json | null
          updated_at: string
          verified_complaint_count: number | null
        }
        Insert: {
          bank_accounts?: Json | null
          created_at?: string
          created_by?: string | null
          email_addresses?: string[] | null
          first_complaint_date?: string | null
          highest_severity?:
            | Database["public"]["Enums"]["severity_level"]
            | null
          id?: string
          is_public?: boolean | null
          name: string
          phone_numbers?: string[] | null
          social_handles?: Json | null
          updated_at?: string
          verified_complaint_count?: number | null
        }
        Update: {
          bank_accounts?: Json | null
          created_at?: string
          created_by?: string | null
          email_addresses?: string[] | null
          first_complaint_date?: string | null
          highest_severity?:
            | Database["public"]["Enums"]["severity_level"]
            | null
          id?: string
          is_public?: boolean | null
          name?: string
          phone_numbers?: string[] | null
          social_handles?: Json | null
          updated_at?: string
          verified_complaint_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      profiles_moderation_view: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vendors_public_view: {
        Row: {
          created_at: string | null
          email_addresses: string[] | null
          first_complaint_date: string | null
          highest_severity: Database["public"]["Enums"]["severity_level"] | null
          id: string | null
          is_public: boolean | null
          name: string | null
          phone_numbers: string[] | null
          social_handles: Json | null
          updated_at: string | null
          verified_complaint_count: number | null
        }
        Insert: {
          created_at?: string | null
          email_addresses?: string[] | null
          first_complaint_date?: string | null
          highest_severity?:
            | Database["public"]["Enums"]["severity_level"]
            | null
          id?: string | null
          is_public?: boolean | null
          name?: string | null
          phone_numbers?: string[] | null
          social_handles?: Json | null
          updated_at?: string | null
          verified_complaint_count?: number | null
        }
        Update: {
          created_at?: string | null
          email_addresses?: string[] | null
          first_complaint_date?: string | null
          highest_severity?:
            | Database["public"]["Enums"]["severity_level"]
            | null
          id?: string | null
          is_public?: boolean | null
          name?: string | null
          phone_numbers?: string[] | null
          social_handles?: Json | null
          updated_at?: string | null
          verified_complaint_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_access_evidence_file: {
        Args: { _file_path: string }
        Returns: boolean
      }
      get_current_profile_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_moderator_or_admin: { Args: never; Returns: boolean }
      is_reporter_of_complaint: {
        Args: { _complaint_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "moderator" | "admin"
      complaint_status:
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "needs_evidence"
      severity_level: "critical" | "risky" | "unreliable"
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
    Enums: {
      app_role: ["user", "moderator", "admin"],
      complaint_status: [
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "needs_evidence",
      ],
      severity_level: ["critical", "risky", "unreliable"],
    },
  },
} as const
