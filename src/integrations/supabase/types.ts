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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      favorite_songs: {
        Row: {
          channel_title: string | null
          created_at: string
          duration: string | null
          id: string
          song_title: string
          thumbnail_url: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          channel_title?: string | null
          created_at?: string
          duration?: string | null
          id?: string
          song_title: string
          thumbnail_url?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          channel_title?: string | null
          created_at?: string
          duration?: string | null
          id?: string
          song_title?: string
          thumbnail_url?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      performance_likes: {
        Row: {
          created_at: string
          id: string
          liker_id: string
          request_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liker_id: string
          request_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liker_id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_likes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "song_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          card_code: string
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          card_code?: string
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          card_code?: string
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      song_requests: {
        Row: {
          channel_title: string | null
          created_at: string
          duration: string | null
          id: string
          position: number
          singer_name: string
          song_title: string
          status: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string | null
          video_id: string
        }
        Insert: {
          channel_title?: string | null
          created_at?: string
          duration?: string | null
          id?: string
          position?: number
          singer_name: string
          song_title: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string | null
          video_id: string
        }
        Update: {
          channel_title?: string | null
          created_at?: string
          duration?: string | null
          id?: string
          position?: number
          singer_name?: string
          song_title?: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string | null
          video_id?: string
        }
        Relationships: []
      }
      stage_control: {
        Row: {
          external: boolean
          id: boolean
          paused: boolean
          restart_revision: number
          revision: number
          updated_at: string
          volume: number
        }
        Insert: {
          external?: boolean
          id?: boolean
          paused?: boolean
          restart_revision?: number
          revision?: number
          updated_at?: string
          volume?: number
        }
        Update: {
          external?: boolean
          id?: boolean
          paused?: boolean
          restart_revision?: number
          revision?: number
          updated_at?: string
          volume?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dj_complete_current: { Args: { p_id: string }; Returns: Json }
      dj_reorder: { Args: { p_ids: string[] }; Returns: Json }
      dj_set_status: { Args: { p_id: string; p_status: string }; Returns: Json }
      dj_stage_command: {
        Args: { p_command: string; p_volume?: number }
        Returns: Json
      }
      leaderboard: {
        Args: { p_period: string }
        Returns: {
          card_code: string
          display_name: string
          likes: number
          performances: number
          singer_id: string
        }[]
      }
      like_counts: {
        Args: { p_ids: string[] }
        Returns: {
          likes: number
          request_id: string
        }[]
      }
      my_singer_stats: {
        Args: never
        Returns: {
          likes: number
          performances: number
          requests: number
        }[]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
