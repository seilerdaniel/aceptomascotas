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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      advertisements: {
        Row: {
          advertiser_name: string
          alt_text: string
          created_at: string
          ends_at: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          sort_order: number
          starts_at: string | null
        }
        Insert: {
          advertiser_name: string
          alt_text: string
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          starts_at?: string | null
        }
        Update: {
          advertiser_name?: string
          alt_text?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          starts_at?: string | null
        }
        Relationships: []
      }
      admin_action_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_table: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_services: {
        Row: {
          address: string | null
          banner_url: string | null
          category: Database["public"]["Enums"]["service_category"]
          city: string
          created_at: string
          description: string | null
          email: string | null
          facebook: string | null
          id: string
          images: string[] | null
          instagram: string | null
          is_24h: boolean | null
          is_active: boolean | null
          is_approved: boolean | null
          is_verified: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          neighborhood: string | null
          opening_hours: Json | null
          phone: string | null
          updated_at: string
          user_id: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          category: Database["public"]["Enums"]["service_category"]
          city: string
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          images?: string[] | null
          instagram?: string | null
          is_24h?: boolean | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_verified?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          opening_hours?: Json | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          category?: Database["public"]["Enums"]["service_category"]
          city?: string
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          id?: string
          images?: string[] | null
          instagram?: string | null
          is_24h?: boolean | null
          is_active?: boolean | null
          is_approved?: boolean | null
          is_verified?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          opening_hours?: Json | null
          phone?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      pets: {
        Row: {
          age_years: number | null
          breed: string | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          is_lost: boolean
          lost_latitude: number | null
          lost_longitude: number | null
          lost_since: string | null
          name: string
          qr_code: string | null
          species: string
          updated_at: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          age_years?: number | null
          breed?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_lost?: boolean
          lost_latitude?: number | null
          lost_longitude?: number | null
          lost_since?: string | null
          name: string
          qr_code?: string | null
          species: string
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          age_years?: number | null
          breed?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_lost?: boolean
          lost_latitude?: number | null
          lost_longitude?: number | null
          lost_since?: string | null
          name?: string
          qr_code?: string | null
          species?: string
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alternative_phone: string | null
          avatar_url: string | null
          banner_url: string | null
          created_at: string
          full_name: string | null
          has_whatsapp: boolean | null
          id: string
          is_verified: boolean
          phone: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          alternative_phone?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          full_name?: string | null
          has_whatsapp?: boolean | null
          id?: string
          is_verified?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          alternative_phone?: string | null
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          full_name?: string | null
          has_whatsapp?: boolean | null
          id?: string
          is_verified?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          owner_avatar_url: string | null
          owner_is_agency: boolean
          owner_is_verified: boolean
          pet_types: Database["public"]["Enums"]["pet_type"][]
          price: number
          property_is_verified: boolean
          property_type: Database["public"]["Enums"]["property_type"]
          requirements: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          owner_avatar_url?: string | null
          owner_is_agency?: boolean
          owner_is_verified?: boolean
          pet_types?: Database["public"]["Enums"]["pet_type"][]
          price: number
          property_is_verified?: boolean
          property_type: Database["public"]["Enums"]["property_type"]
          requirements?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          owner_avatar_url?: string | null
          owner_is_agency?: boolean
          owner_is_verified?: boolean
          pet_types?: Database["public"]["Enums"]["pet_type"][]
          price?: number
          property_is_verified?: boolean
          property_type?: Database["public"]["Enums"]["property_type"]
          requirements?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      property_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          property_id: string
          reason: string
          reporter_email: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          property_id: string
          reason: string
          reporter_email?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          property_id?: string
          reason?: string
          reporter_email?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties_public"
            referencedColumns: ["id"]
          },
        ]
      }
      service_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          rating: number
          service_id: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          rating: number
          service_id: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          rating?: number
          service_id?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "pet_services"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      properties_public: {
        Row: {
          address: string | null
          agency_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string | null
          images: string[] | null
          is_active: boolean | null
          latitude: number | null
          location: string | null
          longitude: number | null
          owner_avatar_url: string | null
          owner_is_verified: boolean | null
          pet_types: Database["public"]["Enums"]["pet_type"][] | null
          price: number | null
          property_is_verified: boolean | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          requirements: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          agency_id?: never
          contact_email?: never
          contact_name?: string | null
          contact_phone?: never
          created_at?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          owner_avatar_url?: string | null
          owner_is_verified?: boolean | null
          pet_types?: Database["public"]["Enums"]["pet_type"][] | null
          price?: number | null
          property_is_verified?: boolean | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          requirements?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: never
        }
        Update: {
          address?: string | null
          agency_id?: never
          contact_email?: never
          contact_name?: string | null
          contact_phone?: never
          created_at?: string | null
          description?: string | null
          id?: string | null
          images?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          owner_avatar_url?: string | null
          owner_is_verified?: boolean | null
          pet_types?: Database["public"]["Enums"]["pet_type"][] | null
          price?: number | null
          property_is_verified?: boolean | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          requirements?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: never
        }
        Relationships: []
      }
      service_ratings: {
        Row: {
          average_rating: number | null
          review_count: number | null
          service_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "pet_services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      delete_user: { Args: never; Returns: undefined }
      generate_pet_qr_code: { Args: { pet_id_input: string }; Returns: string }
      generate_short_code: { Args: never; Returns: string }
      get_agency_properties: {
        Args: { agency_user_id: string }
        Returns: {
          address: string | null
          agency_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          id: string | null
          images: string[] | null
          is_active: boolean | null
          latitude: number | null
          location: string | null
          longitude: number | null
          owner_avatar_url: string | null
          owner_is_verified: boolean | null
          pet_types: Database["public"]["Enums"]["pet_type"][] | null
          price: number | null
          property_is_verified: boolean | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          requirements: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "properties_public"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_agency_public_profile: {
        Args: { agency_user_id: string }
        Returns: {
          avatar_url: string
          banner_url: string
          full_name: string
          is_verified: boolean
        }[]
      }
      get_lost_pets: {
        Args: never
        Returns: {
          breed: string
          images: string[]
          lost_latitude: number
          lost_longitude: number
          lost_since: string
          name: string
          qr_code: string
          species: string
        }[]
      }
      get_pet_by_qr_code: {
        Args: { code: string }
        Returns: {
          owner_alternative_phone: string
          owner_has_whatsapp: boolean
          owner_phone: string
          pet_breed: string
          pet_description: string
          pet_images: string[]
          pet_name: string
          pet_species: string
        }[]
      }
      get_platform_stats: {
        Args: never
        Returns: {
          properties_count: number
          searchers_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      pet_type: "perro" | "gato" | "aves" | "peces" | "otros"
      property_type: "departamento" | "casa" | "ph" | "loft" | "monoambiente"
      service_category:
        | "veterinaria"
        | "veterinaria_24h"
        | "seguro"
        | "guarderia"
        | "adiestrador"
        | "paseador"
        | "mudanza"
        | "ong_refugio"
        | "peluqueria"
        | "tienda"
      user_type: "buscador" | "propietario" | "agencia" | "proveedor"
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
      app_role: ["admin", "moderator", "user"],
      pet_type: ["perro", "gato", "aves", "peces", "otros"],
      property_type: ["departamento", "casa", "ph", "loft", "monoambiente"],
      service_category: [
        "veterinaria",
        "veterinaria_24h",
        "seguro",
        "guarderia",
        "adiestrador",
        "paseador",
        "mudanza",
        "ong_refugio",
        "peluqueria",
        "tienda",
      ],
      user_type: ["buscador", "propietario", "agencia", "proveedor"],
    },
  },
} as const
