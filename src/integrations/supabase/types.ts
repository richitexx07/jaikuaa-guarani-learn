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
      ai_usage: {
        Row: {
          count: number
          day: string
          feature: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          day: string
          feature: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          day?: string
          feature?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          code: string
          created_at: string
          full_name: string
          issued_at: string
          lessons: number
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          full_name: string
          issued_at: string
          lessons: number
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          full_name?: string
          issued_at?: string
          lessons?: number
          user_id?: string
        }
        Relationships: []
      }
      content_proposals: {
        Row: {
          es: string
          gn: string
          history: Json
          id: string
          kind: string
          notes: string
          proposed_at: string
          proposed_by: string
          published_word_id: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: string
          status: string
          target_word_id: string | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_note: string | null
        }
        Insert: {
          es: string
          gn: string
          history?: Json
          id?: string
          kind: string
          notes?: string
          proposed_at?: string
          proposed_by: string
          published_word_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          target_word_id?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_note?: string | null
        }
        Update: {
          es?: string
          gn?: string
          history?: Json
          id?: string
          kind?: string
          notes?: string
          proposed_at?: string
          proposed_by?: string
          published_word_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string
          status?: string
          target_word_id?: string | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_proposals_published_word_id_fkey"
            columns: ["published_word_id"]
            isOneToOne: false
            referencedRelation: "corpus_words"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_proposals_target_word_id_fkey"
            columns: ["target_word_id"]
            isOneToOne: false
            referencedRelation: "corpus_words"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          created_at: string
          estado: string
          id: string
          lugar: string
          mensaje: string
          reported_by: string
          revisado_at: string | null
          revisado_por: string | null
          tipo: string
          word_es: string
          word_gn: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          lugar: string
          mensaje: string
          reported_by: string
          revisado_at?: string | null
          revisado_por?: string | null
          tipo: string
          word_es?: string
          word_gn: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          lugar?: string
          mensaje?: string
          reported_by?: string
          revisado_at?: string | null
          revisado_por?: string | null
          tipo?: string
          word_es?: string
          word_gn?: string
        }
        Relationships: []
      }
      content_reviewers: {
        Row: {
          added_by: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      corpus_sentence_words: {
        Row: {
          created_at: string
          id: string
          position: number
          sentence_id: string
          token: string
          word_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          position: number
          sentence_id: string
          token: string
          word_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          sentence_id?: string
          token?: string
          word_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corpus_sentence_words_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "corpus_sentences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corpus_sentence_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "corpus_words"
            referencedColumns: ["id"]
          },
        ]
      }
      corpus_sentences: {
        Row: {
          created_at: string
          es: string
          gn: string
          id: string
          level_id: string | null
          notes: string
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          es: string
          gn: string
          id?: string
          level_id?: string | null
          notes?: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          es?: string
          gn?: string
          id?: string
          level_id?: string | null
          notes?: string
          status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corpus_sentences_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "mec_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      corpus_word_changes: {
        Row: {
          changed_by: string
          changes: Json
          created_at: string
          id: string
          word_id: string
        }
        Insert: {
          changed_by: string
          changes: Json
          created_at?: string
          id?: string
          word_id: string
        }
        Update: {
          changed_by?: string
          changes?: Json
          created_at?: string
          id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "corpus_word_changes_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "corpus_words"
            referencedColumns: ["id"]
          },
        ]
      }
      corpus_word_levels: {
        Row: {
          created_at: string
          id: string
          level_id: string
          unit: string
          word_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level_id: string
          unit?: string
          word_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level_id?: string
          unit?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "corpus_word_levels_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "mec_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corpus_word_levels_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "corpus_words"
            referencedColumns: ["id"]
          },
        ]
      }
      corpus_words: {
        Row: {
          audio_slug: string
          category: string | null
          created_at: string
          es: string
          gn: string
          has_audio: boolean
          id: string
          notes: string
          status: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          audio_slug: string
          category?: string | null
          created_at?: string
          es: string
          gn: string
          has_audio?: boolean
          id?: string
          notes?: string
          status?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          audio_slug?: string
          category?: string | null
          created_at?: string
          es?: string
          gn?: string
          has_audio?: boolean
          id?: string
          notes?: string
          status?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corpus_words_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          active: boolean
          code: string
          cohort: string
          created_at: string
          expires_at: string | null
          id: string
          max_uses: number
          uses: number
        }
        Insert: {
          active?: boolean
          code: string
          cohort?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number
          uses?: number
        }
        Update: {
          active?: boolean
          code?: string
          cohort?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number
          uses?: number
        }
        Relationships: []
      }
      invite_redemptions: {
        Row: {
          code_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          code_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          code_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invite_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "invite_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      jai_consultas: {
        Row: {
          created_at: string
          faq_id: string | null
          id: string
          resultado: string
          ruta: string
          texto: string
        }
        Insert: {
          created_at?: string
          faq_id?: string | null
          id?: string
          resultado: string
          ruta?: string
          texto: string
        }
        Update: {
          created_at?: string
          faq_id?: string | null
          id?: string
          resultado?: string
          ruta?: string
          texto?: string
        }
        Relationships: []
      }
      lesson_words: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          position: number
          word_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          position?: number
          word_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          position?: number
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_words_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "corpus_words"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          capacity_code: string | null
          created_at: string
          id: string
          level_id: string | null
          sort_order: number
          status: string
          theme: string
          title: string
          updated_at: string
        }
        Insert: {
          capacity_code?: string | null
          created_at?: string
          id?: string
          level_id?: string | null
          sort_order: number
          status?: string
          theme?: string
          title: string
          updated_at?: string
        }
        Update: {
          capacity_code?: string | null
          created_at?: string
          id?: string
          level_id?: string | null
          sort_order?: number
          status?: string
          theme?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_capacity_code_fkey"
            columns: ["capacity_code"]
            isOneToOne: false
            referencedRelation: "mec_capacities"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "lessons_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "mec_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      mec_capacities: {
        Row: {
          axis: string
          capacity_gn: string
          code: string
          contents_es: string
          created_at: string
          level_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          axis: string
          capacity_gn: string
          code: string
          contents_es: string
          created_at?: string
          level_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          axis?: string
          capacity_gn?: string
          code?: string
          contents_es?: string
          created_at?: string
          level_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mec_capacities_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "mec_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      mec_levels: {
        Row: {
          created_at: string
          id: string
          label: string
          sort_order: number
          stage: string
          units: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          label: string
          sort_order?: number
          stage: string
          units?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          stage?: string
          units?: Json
          updated_at?: string
        }
        Relationships: []
      }
      noticias: {
        Row: {
          cargada_por: string
          categoria: string
          created_at: string
          emoji: string
          estado: string
          fecha_nota: string
          fuente: string
          id: string
          resumen: string
          revisada_at: string | null
          revisada_por: string | null
          titulo: string
          url: string
        }
        Insert: {
          cargada_por?: string
          categoria?: string
          created_at?: string
          emoji?: string
          estado?: string
          fecha_nota: string
          fuente: string
          id?: string
          resumen: string
          revisada_at?: string | null
          revisada_por?: string | null
          titulo: string
          url: string
        }
        Update: {
          cargada_por?: string
          categoria?: string
          created_at?: string
          emoji?: string
          estado?: string
          fecha_nota?: string
          fuente?: string
          id?: string
          resumen?: string
          revisada_at?: string | null
          revisada_por?: string | null
          titulo?: string
          url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cohort: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          cohort?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          cohort?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          bucket_key: string
          count: number
          window_start: string
        }
        Insert: {
          bucket_key: string
          count?: number
          window_start: string
        }
        Update: {
          bucket_key?: string
          count?: number
          window_start?: string
        }
        Relationships: []
      }
      sponsor_impressions: {
        Row: {
          created_at: string
          id: string
          slot: string
          sponsor_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          slot: string
          sponsor_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          slot?: string
          sponsor_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trivia_categories: {
        Row: {
          created_at: string
          emoji: string
          id: string
          sort_order: number
          subtitle: string
          title: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id: string
          sort_order?: number
          subtitle: string
          title: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          sort_order?: number
          subtitle?: string
          title?: string
        }
        Relationships: []
      }
      trivia_question_awards: {
        Row: {
          answered_correctly: boolean
          awarded_date: string
          created_at: string
          question_id: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          answered_correctly?: boolean
          awarded_date?: string
          created_at?: string
          question_id: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          answered_correctly?: boolean
          awarded_date?: string
          created_at?: string
          question_id?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "trivia_question_awards_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "trivia_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      trivia_questions: {
        Row: {
          category_id: string
          correct_index: number
          created_at: string
          explanation: string
          id: string
          options: Json
          question: string
          sort_order: number
        }
        Insert: {
          category_id: string
          correct_index: number
          created_at?: string
          explanation?: string
          id?: string
          options: Json
          question: string
          sort_order?: number
        }
        Update: {
          category_id?: string
          correct_index?: number
          created_at?: string
          explanation?: string
          id?: string
          options?: Json
          question?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "trivia_questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "trivia_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      trivia_sessions: {
        Row: {
          abandoned_at: string | null
          best_streak: number
          category_id: string
          completed_at: string | null
          correct_count: number
          created_at: string
          current_idx: number
          current_streak: number
          id: string
          is_practice: boolean
          question_ids: string[]
          question_started_at: string | null
          updated_at: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          abandoned_at?: string | null
          best_streak?: number
          category_id: string
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          current_idx?: number
          current_streak?: number
          id?: string
          is_practice?: boolean
          question_ids: string[]
          question_started_at?: string | null
          updated_at?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          abandoned_at?: string | null
          best_streak?: number
          category_id?: string
          completed_at?: string | null
          correct_count?: number
          created_at?: string
          current_idx?: number
          current_streak?: number
          id?: string
          is_practice?: boolean
          question_ids?: string[]
          question_started_at?: string | null
          updated_at?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "trivia_sessions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "trivia_categories"
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
          role: Database["public"]["Enums"]["app_role"]
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
      user_stats: {
        Row: {
          badges: Json
          created_at: string
          current_streak: number
          last_active_date: string | null
          longest_streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          badges?: Json
          created_at?: string
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          badges?: Json
          created_at?: string
          current_streak?: number
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json
          question_id: string | null
          session_id: string | null
          source: string
          source_ref: string | null
          sync_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json
          question_id?: string | null
          session_id?: string | null
          source: string
          source_ref?: string | null
          sync_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json
          question_id?: string | null
          session_id?: string | null
          source?: string
          source_ref?: string | null
          sync_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_transactions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "trivia_questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_ai_quota: {
        Args: { _feature: string; _limit: number; _user_id: string }
        Returns: boolean
      }
      consume_rate_limit: {
        Args: { _key: string; _limit: number; _window_seconds: number }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      migrate_local_progress: {
        Args: {
          _badges: Json
          _last_date: string
          _lessons: number
          _streak: number
          _user_id: string
          _xp: number
        }
        Returns: boolean
      }
      record_activity: {
        Args: {
          _amount: number
          _metadata: Json
          _perfect: boolean
          _source: string
          _source_ref: string
          _sync_id: string
          _user_id: string
        }
        Returns: Json
      }
      redeem_invite: {
        Args: { _code: string; _user_id: string }
        Returns: string
      }
      sponsor_impressions_report: {
        Args: { _days: number }
        Returns: {
          impressions: number
          slot: string
          sponsor_name: string
          unique_users: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
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
    Enums: {
      app_role: ["admin", "editor", "user"],
    },
  },
} as const
