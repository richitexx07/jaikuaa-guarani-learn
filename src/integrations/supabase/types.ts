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
      ambassador_codes: {
        Row: {
          code: string
          created_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
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
      aula_docentes: {
        Row: {
          created_at: string
          decidido_at: string | null
          decidido_por: string | null
          estado: string
          institucion: string
          nota: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decidido_at?: string | null
          decidido_por?: string | null
          estado?: string
          institucion: string
          nota?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decidido_at?: string | null
          decidido_por?: string | null
          estado?: string
          institucion?: string
          nota?: string
          user_id?: string
        }
        Relationships: []
      }
      aula_miembros: {
        Row: {
          aula_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          aula_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          aula_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aula_miembros_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      aula_tareas: {
        Row: {
          aula_id: string
          created_at: string
          created_by: string
          fecha_limite: string | null
          id: string
          nota: string
          ref: string
          tipo: string
          titulo: string
        }
        Insert: {
          aula_id: string
          created_at?: string
          created_by: string
          fecha_limite?: string | null
          id?: string
          nota?: string
          ref: string
          tipo: string
          titulo: string
        }
        Update: {
          aula_id?: string
          created_at?: string
          created_by?: string
          fecha_limite?: string | null
          id?: string
          nota?: string
          ref?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "aula_tareas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas: {
        Row: {
          activa: boolean
          codigo: string
          created_at: string
          docente_id: string
          id: string
          institucion: string
          nombre: string
        }
        Insert: {
          activa?: boolean
          codigo: string
          created_at?: string
          docente_id: string
          id?: string
          institucion?: string
          nombre: string
        }
        Update: {
          activa?: boolean
          codigo?: string
          created_at?: string
          docente_id?: string
          id?: string
          institucion?: string
          nombre?: string
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
      colaboradores_postulaciones: {
        Row: {
          aportes: string[]
          capacitacion: boolean
          ciudad: string
          comentario: string
          created_at: string
          departamento: string
          email: string | null
          estado: string
          id: string
          institucion: string
          lenguas: string
          nombre: string
          nota_interna: string
          origen: string
          perfil: string
          revisado_por: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          aportes: string[]
          capacitacion?: boolean
          ciudad?: string
          comentario?: string
          created_at?: string
          departamento: string
          email?: string | null
          estado?: string
          id?: string
          institucion?: string
          lenguas?: string
          nombre: string
          nota_interna?: string
          origen?: string
          perfil: string
          revisado_por?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          aportes?: string[]
          capacitacion?: boolean
          ciudad?: string
          comentario?: string
          created_at?: string
          departamento?: string
          email?: string | null
          estado?: string
          id?: string
          institucion?: string
          lenguas?: string
          nombre?: string
          nota_interna?: string
          origen?: string
          perfil?: string
          revisado_por?: string | null
          updated_at?: string
          whatsapp?: string | null
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
      convenios_firmados: {
        Row: {
          adjunto_at: string | null
          adjunto_path: string | null
          adjunto_tipo: string | null
          artesano_id: string | null
          artista_id: string | null
          ci: string
          ciudad: string
          codigo: string
          dispositivo: string
          email: string
          estado: string
          firmado_at: string
          huella: string
          id: string
          ip: string
          nombre: string
          nota: string
          obras: Json
          permisos: string[]
          programa: string
          revisado_at: string | null
          revisado_por: string | null
          roles: string[]
          updated_at: string
          user_id: string | null
          version: string
          whatsapp: string
        }
        Insert: {
          adjunto_at?: string | null
          adjunto_path?: string | null
          adjunto_tipo?: string | null
          artesano_id?: string | null
          artista_id?: string | null
          ci: string
          ciudad?: string
          codigo: string
          dispositivo?: string
          email: string
          estado?: string
          firmado_at?: string
          huella: string
          id?: string
          ip?: string
          nombre: string
          nota?: string
          obras: Json
          permisos: string[]
          programa: string
          revisado_at?: string | null
          revisado_por?: string | null
          roles: string[]
          updated_at?: string
          user_id?: string | null
          version: string
          whatsapp: string
        }
        Update: {
          adjunto_at?: string | null
          adjunto_path?: string | null
          adjunto_tipo?: string | null
          artesano_id?: string | null
          artista_id?: string | null
          ci?: string
          ciudad?: string
          codigo?: string
          dispositivo?: string
          email?: string
          estado?: string
          firmado_at?: string
          huella?: string
          id?: string
          ip?: string
          nombre?: string
          nota?: string
          obras?: Json
          permisos?: string[]
          programa?: string
          revisado_at?: string | null
          revisado_por?: string | null
          roles?: string[]
          updated_at?: string
          user_id?: string | null
          version?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "convenios_firmados_artesano_id_fkey"
            columns: ["artesano_id"]
            isOneToOne: false
            referencedRelation: "tembiapo_artesanos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convenios_firmados_artista_id_fkey"
            columns: ["artista_id"]
            isOneToOne: false
            referencedRelation: "purahei_artistas"
            referencedColumns: ["id"]
          },
        ]
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
          significados: Json
          significados_propuestos: Json
          significados_revision: Json
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
          significados?: Json
          significados_propuestos?: Json
          significados_revision?: Json
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
          significados?: Json
          significados_propuestos?: Json
          significados_revision?: Json
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
          contacto: string | null
          created_at: string
          faq_id: string | null
          id: string
          resultado: string
          ruta: string
          texto: string
        }
        Insert: {
          contacto?: string | null
          created_at?: string
          faq_id?: string | null
          id?: string
          resultado: string
          ruta?: string
          texto: string
        }
        Update: {
          contacto?: string | null
          created_at?: string
          faq_id?: string | null
          id?: string
          resultado?: string
          ruta?: string
          texto?: string
        }
        Relationships: []
      }
      juego_textos: {
        Row: {
          campo: string
          clave: string
          escrito_por: string | null
          escrito_por_nombre: string | null
          id: string
          juego: string
          texto: string
          updated_at: string
        }
        Insert: {
          campo: string
          clave: string
          escrito_por?: string | null
          escrito_por_nombre?: string | null
          id?: string
          juego: string
          texto: string
          updated_at?: string
        }
        Update: {
          campo?: string
          clave?: string
          escrito_por?: string | null
          escrito_por_nombre?: string | null
          id?: string
          juego?: string
          texto?: string
          updated_at?: string
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
      libro_accesos: {
        Row: {
          created_at: string
          id: string
          libro_id: string
          nota: string
          otorgado_por: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          libro_id: string
          nota?: string
          otorgado_por?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          libro_id?: string
          nota?: string
          otorgado_por?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "libro_accesos_libro_id_fkey"
            columns: ["libro_id"]
            isOneToOne: false
            referencedRelation: "libros"
            referencedColumns: ["id"]
          },
        ]
      }
      libro_paginas: {
        Row: {
          audio_path: string | null
          created_at: string
          id: string
          imagen_path: string | null
          libro_id: string
          n: number
          texto: string
        }
        Insert: {
          audio_path?: string | null
          created_at?: string
          id?: string
          imagen_path?: string | null
          libro_id: string
          n: number
          texto?: string
        }
        Update: {
          audio_path?: string | null
          created_at?: string
          id?: string
          imagen_path?: string | null
          libro_id?: string
          n?: number
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "libro_paginas_libro_id_fkey"
            columns: ["libro_id"]
            isOneToOne: false
            referencedRelation: "libros"
            referencedColumns: ["id"]
          },
        ]
      }
      libros: {
        Row: {
          autor: string
          creado_por: string | null
          created_at: string
          descripcion: string
          id: string
          portada_path: string | null
          precio_gs: number | null
          publicado: boolean
          titulo: string
          updated_at: string
        }
        Insert: {
          autor?: string
          creado_por?: string | null
          created_at?: string
          descripcion?: string
          id?: string
          portada_path?: string | null
          precio_gs?: number | null
          publicado?: boolean
          titulo: string
          updated_at?: string
        }
        Update: {
          autor?: string
          creado_por?: string | null
          created_at?: string
          descripcion?: string
          id?: string
          portada_path?: string | null
          precio_gs?: number | null
          publicado?: boolean
          titulo?: string
          updated_at?: string
        }
        Relationships: []
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
      mostrador_frases: {
        Row: {
          audio_by: string | null
          audio_path: string | null
          created_at: string
          es: string
          gn: string | null
          gn_at: string | null
          gn_by: string | null
          id: string
          orden: number
          rubro: string
          situacion: string
          status: string
          tipo: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          audio_by?: string | null
          audio_path?: string | null
          created_at?: string
          es: string
          gn?: string | null
          gn_at?: string | null
          gn_by?: string | null
          id?: string
          orden?: number
          rubro: string
          situacion: string
          status?: string
          tipo?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          audio_by?: string | null
          audio_path?: string | null
          created_at?: string
          es?: string
          gn?: string | null
          gn_at?: string | null
          gn_by?: string | null
          id?: string
          orden?: number
          rubro?: string
          situacion?: string
          status?: string
          tipo?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
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
      pagos: {
        Row: {
          created_at: string
          descripcion: string
          estado: string
          hash_pedido: string | null
          id: string
          modo: string
          monto_gs: number
          pagado_at: string | null
          ref_id: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descripcion?: string
          estado?: string
          hash_pedido?: string | null
          id?: string
          modo?: string
          monto_gs: number
          pagado_at?: string | null
          ref_id: string
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          estado?: string
          hash_pedido?: string | null
          id?: string
          modo?: string
          monto_gs?: number
          pagado_at?: string | null
          ref_id?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      practice_answers: {
        Row: {
          answered_at: string
          correct: boolean
          created_at: string
          gn: string
          id: string
          source: string
          source_ref: string | null
          user_id: string
        }
        Insert: {
          answered_at: string
          correct: boolean
          created_at?: string
          gn: string
          id: string
          source: string
          source_ref?: string | null
          user_id: string
        }
        Update: {
          answered_at?: string
          correct?: boolean
          created_at?: string
          gn?: string
          id?: string
          source?: string
          source_ref?: string | null
          user_id?: string
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
      purahei_artistas: {
        Row: {
          bio: string
          ciudad: string
          contacto: string
          creado_por: string | null
          created_at: string
          enlaces: Json
          foto_path: string | null
          id: string
          nombre: string
          permiso_imagen: boolean
          publicado: boolean
          slug: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          bio?: string
          ciudad?: string
          contacto?: string
          creado_por?: string | null
          created_at?: string
          enlaces?: Json
          foto_path?: string | null
          id?: string
          nombre: string
          permiso_imagen?: boolean
          publicado?: boolean
          slug: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          bio?: string
          ciudad?: string
          contacto?: string
          creado_por?: string | null
          created_at?: string
          enlaces?: Json
          foto_path?: string | null
          id?: string
          nombre?: string
          permiso_imagen?: boolean
          publicado?: boolean
          slug?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      purahei_obras: {
        Row: {
          anio: number | null
          artista_id: string
          audio_path: string | null
          autor: string
          cargado_por: string | null
          created_at: string
          descripcion: string
          estilo: string
          glosario: Json
          id: string
          interprete: string
          karaoke: Json | null
          permiso_autor: boolean
          permiso_interprete: boolean
          permiso_productor: boolean
          productor: string
          publicado: boolean
          revisado_at: string | null
          revisado_por: string | null
          titulo: string
          updated_at: string
          versos: Json
        }
        Insert: {
          anio?: number | null
          artista_id: string
          audio_path?: string | null
          autor?: string
          cargado_por?: string | null
          created_at?: string
          descripcion?: string
          estilo?: string
          glosario?: Json
          id?: string
          interprete?: string
          karaoke?: Json | null
          permiso_autor?: boolean
          permiso_interprete?: boolean
          permiso_productor?: boolean
          productor?: string
          publicado?: boolean
          revisado_at?: string | null
          revisado_por?: string | null
          titulo: string
          updated_at?: string
          versos?: Json
        }
        Update: {
          anio?: number | null
          artista_id?: string
          audio_path?: string | null
          autor?: string
          cargado_por?: string | null
          created_at?: string
          descripcion?: string
          estilo?: string
          glosario?: Json
          id?: string
          interprete?: string
          karaoke?: Json | null
          permiso_autor?: boolean
          permiso_interprete?: boolean
          permiso_productor?: boolean
          productor?: string
          publicado?: boolean
          revisado_at?: string | null
          revisado_por?: string | null
          titulo?: string
          updated_at?: string
          versos?: Json
        }
        Relationships: [
          {
            foreignKeyName: "purahei_obras_artista_id_fkey"
            columns: ["artista_id"]
            isOneToOne: false
            referencedRelation: "purahei_artistas"
            referencedColumns: ["id"]
          },
        ]
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
      referrals: {
        Row: {
          activated_at: string | null
          created_at: string
          referred_user_id: string
          referrer_id: string
          xp_awarded: number
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          referred_user_id: string
          referrer_id: string
          xp_awarded?: number
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          referred_user_id?: string
          referrer_id?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      reto_resultados: {
        Row: {
          created_at: string
          nombre: string | null
          puntaje: number
          reto_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          nombre?: string | null
          puntaje: number
          reto_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          nombre?: string | null
          puntaje?: number
          reto_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reto_resultados_reto_id_fkey"
            columns: ["reto_id"]
            isOneToOne: false
            referencedRelation: "retos"
            referencedColumns: ["id"]
          },
        ]
      }
      retos: {
        Row: {
          creado_por: string | null
          creado_por_nombre: string | null
          created_at: string
          extra: string | null
          id: string
          juego: string
          menos_es_mejor: boolean
          semilla: number
          total: number
          unidad: string | null
        }
        Insert: {
          creado_por?: string | null
          creado_por_nombre?: string | null
          created_at?: string
          extra?: string | null
          id: string
          juego: string
          menos_es_mejor?: boolean
          semilla: number
          total?: number
          unidad?: string | null
        }
        Update: {
          creado_por?: string | null
          creado_por_nombre?: string | null
          created_at?: string
          extra?: string | null
          id?: string
          juego?: string
          menos_es_mejor?: boolean
          semilla?: number
          total?: number
          unidad?: string | null
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
      staff_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          full_name: string
          id: string
          institution: string
          kind: string
          note: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          full_name: string
          id?: string
          institution?: string
          kind: string
          note?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          full_name?: string
          id?: string
          institution?: string
          kind?: string
          note?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      tembiapo_artesanos: {
        Row: {
          bio: string
          ciudad: string
          comunidad: string
          consentimiento_comunidad: boolean
          contacto: string
          creado_por: string | null
          created_at: string
          departamento: string
          foto_path: string | null
          id: string
          maestro_ipa: boolean
          nombre: string
          oficio: string
          permiso_imagen: boolean
          publicado: boolean
          ruta_id: string | null
          slug: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          bio?: string
          ciudad?: string
          comunidad?: string
          consentimiento_comunidad?: boolean
          contacto?: string
          creado_por?: string | null
          created_at?: string
          departamento?: string
          foto_path?: string | null
          id?: string
          maestro_ipa?: boolean
          nombre: string
          oficio: string
          permiso_imagen?: boolean
          publicado?: boolean
          ruta_id?: string | null
          slug: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          bio?: string
          ciudad?: string
          comunidad?: string
          consentimiento_comunidad?: boolean
          contacto?: string
          creado_por?: string | null
          created_at?: string
          departamento?: string
          foto_path?: string | null
          id?: string
          maestro_ipa?: boolean
          nombre?: string
          oficio?: string
          permiso_imagen?: boolean
          publicado?: boolean
          ruta_id?: string | null
          slug?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tembiapo_artesanos_ruta_id_fkey"
            columns: ["ruta_id"]
            isOneToOne: false
            referencedRelation: "tembiapo_rutas"
            referencedColumns: ["id"]
          },
        ]
      }
      tembiapo_glosario: {
        Row: {
          artesano_id: string | null
          audio_path: string | null
          cargado_por: string | null
          created_at: string
          id: string
          oficio: string
          publicado: boolean
          revisado_at: string | null
          revisado_por: string | null
          significado: string
          termino: string
          updated_at: string
        }
        Insert: {
          artesano_id?: string | null
          audio_path?: string | null
          cargado_por?: string | null
          created_at?: string
          id?: string
          oficio: string
          publicado?: boolean
          revisado_at?: string | null
          revisado_por?: string | null
          significado?: string
          termino: string
          updated_at?: string
        }
        Update: {
          artesano_id?: string | null
          audio_path?: string | null
          cargado_por?: string | null
          created_at?: string
          id?: string
          oficio?: string
          publicado?: boolean
          revisado_at?: string | null
          revisado_por?: string | null
          significado?: string
          termino?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tembiapo_glosario_artesano_id_fkey"
            columns: ["artesano_id"]
            isOneToOne: false
            referencedRelation: "tembiapo_artesanos"
            referencedColumns: ["id"]
          },
        ]
      }
      tembiapo_piezas: {
        Row: {
          artesano_id: string
          created_at: string
          descripcion: string
          fotos: Json
          id: string
          materiales: string
          medidas: string
          orden: number
          publicado: boolean
          tecnica: string
          tiempo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          artesano_id: string
          created_at?: string
          descripcion?: string
          fotos?: Json
          id?: string
          materiales?: string
          medidas?: string
          orden?: number
          publicado?: boolean
          tecnica?: string
          tiempo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          artesano_id?: string
          created_at?: string
          descripcion?: string
          fotos?: Json
          id?: string
          materiales?: string
          medidas?: string
          orden?: number
          publicado?: boolean
          tecnica?: string
          tiempo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tembiapo_piezas_artesano_id_fkey"
            columns: ["artesano_id"]
            isOneToOne: false
            referencedRelation: "tembiapo_artesanos"
            referencedColumns: ["id"]
          },
        ]
      }
      tembiapo_rutas: {
        Row: {
          auspiciante: string
          auspiciante_url: string | null
          created_at: string
          descripcion: string
          foto_path: string | null
          id: string
          lugares: Json
          nombre: string
          orden: number
          publicado: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          auspiciante?: string
          auspiciante_url?: string | null
          created_at?: string
          descripcion?: string
          foto_path?: string | null
          id?: string
          lugares?: Json
          nombre: string
          orden?: number
          publicado?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          auspiciante?: string
          auspiciante_url?: string | null
          created_at?: string
          descripcion?: string
          foto_path?: string | null
          id?: string
          lugares?: Json
          nombre?: string
          orden?: number
          publicado?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      textos_traducidos: {
        Row: {
          aprobado: string
          es: string
          juego: string
          lang: string
          revisado_at: string
          revisado_por: string | null
        }
        Insert: {
          aprobado: string
          es: string
          juego: string
          lang: string
          revisado_at?: string
          revisado_por?: string | null
        }
        Update: {
          aprobado?: string
          es?: string
          juego?: string
          lang?: string
          revisado_at?: string
          revisado_por?: string | null
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
      claim_referral: {
        Args: { _code: string; _user_id: string }
        Returns: string
      }
      consume_ai_quota: {
        Args: { _feature: string; _limit: number; _user_id: string }
        Returns: boolean
      }
      consume_rate_limit: {
        Args: { _key: string; _limit: number; _window_seconds: number }
        Returns: boolean
      }
      get_ambassador_code: { Args: { _user_id: string }; Returns: string }
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
      my_ambassador_summary: {
        Args: { _user_id: string }
        Returns: {
          ambassador_xp: number
          invited: number
          started: number
        }[]
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
