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
      clinical_documents: {
        Row: {
          clinician_id: string
          compliance: Json | null
          content: string
          created_at: string
          encounter_id: string | null
          id: string
          patient_id: string
          recipe_type: string | null
          signed_at: string | null
          signed_by: string | null
          status: string
          title: string | null
          type: string
        }
        Insert: {
          clinician_id: string
          compliance?: Json | null
          content?: string
          created_at?: string
          encounter_id?: string | null
          id?: string
          patient_id: string
          recipe_type?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          title?: string | null
          type: string
        }
        Update: {
          clinician_id?: string
          compliance?: Json | null
          content?: string
          created_at?: string
          encounter_id?: string | null
          id?: string
          patient_id?: string
          recipe_type?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          title?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_documents_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinicians: {
        Row: {
          clinic_address: string | null
          clinics: Json | null
          cpf: string | null
          created_at: string
          crm: string
          email: string | null
          id: string
          name: string
          specialty: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          clinic_address?: string | null
          clinics?: Json | null
          cpf?: string | null
          created_at?: string
          crm?: string
          email?: string | null
          id?: string
          name: string
          specialty?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          clinic_address?: string | null
          clinics?: Json | null
          cpf?: string | null
          created_at?: string
          crm?: string
          email?: string | null
          id?: string
          name?: string
          specialty?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      encounters: {
        Row: {
          chief_complaint: string | null
          clinician_id: string
          created_at: string
          duration_sec: number
          ended_at: string | null
          id: string
          location: string | null
          patient_id: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          chief_complaint?: string | null
          clinician_id: string
          created_at?: string
          duration_sec?: number
          ended_at?: string | null
          id?: string
          location?: string | null
          patient_id: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          chief_complaint?: string | null
          clinician_id?: string
          created_at?: string
          duration_sec?: number
          ended_at?: string | null
          id?: string
          location?: string | null
          patient_id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "encounters_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encounters_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      evolution_photos: {
        Row: {
          created_at: string
          date: string
          encounter_id: string | null
          id: string
          image_path: string
          label: string
          notes: string | null
          patient_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          date?: string
          encounter_id?: string | null
          id?: string
          image_path: string
          label?: string
          notes?: string | null
          patient_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          encounter_id?: string | null
          id?: string
          image_path?: string
          label?: string
          notes?: string | null
          patient_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evolution_photos_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          created_at: string
          encounter_id: string
          id: string
          sections: Json
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          encounter_id: string
          id?: string
          sections?: Json
          template_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          encounter_id?: string
          id?: string
          sections?: Json
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          created_at: string
          date: string
          id: string
          name: string
          patient_id: string
          storage_path: string | null
          type: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          name: string
          patient_id: string
          storage_path?: string | null
          type: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          name?: string
          patient_id?: string
          storage_path?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address_line: string | null
          archived: boolean | null
          birth_date: string | null
          cep: string | null
          children: string[] | null
          clinician_id: string
          cpf: string | null
          created_at: string
          diagnoses: string[] | null
          drug_allergies: string[] | null
          email: string | null
          id: string
          name: string
          notes: string | null
          pet_name: string | null
          phone: string | null
          referral_source: string | null
          rg: string | null
          sex: string | null
          updated_at: string
        }
        Insert: {
          address_line?: string | null
          archived?: boolean | null
          birth_date?: string | null
          cep?: string | null
          children?: string[] | null
          clinician_id: string
          cpf?: string | null
          created_at?: string
          diagnoses?: string[] | null
          drug_allergies?: string[] | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          pet_name?: string | null
          phone?: string | null
          referral_source?: string | null
          rg?: string | null
          sex?: string | null
          updated_at?: string
        }
        Update: {
          address_line?: string | null
          archived?: boolean | null
          birth_date?: string | null
          cep?: string | null
          children?: string[] | null
          clinician_id?: string
          cpf?: string | null
          created_at?: string
          diagnoses?: string[] | null
          drug_allergies?: string[] | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          pet_name?: string | null
          phone?: string | null
          referral_source?: string | null
          rg?: string | null
          sex?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          clinician_id: string
          content: string
          created_at: string
          encounter_id: string | null
          id: string
          medications: Json
          patient_id: string | null
          signed: boolean
          type: string
        }
        Insert: {
          clinician_id: string
          content?: string
          created_at?: string
          encounter_id?: string | null
          id?: string
          medications?: Json
          patient_id?: string | null
          signed?: boolean
          type?: string
        }
        Update: {
          clinician_id?: string
          content?: string
          created_at?: string
          encounter_id?: string | null
          id?: string
          medications?: Json
          patient_id?: string | null
          signed?: boolean
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_events: {
        Row: {
          clinician_id: string
          created_at: string
          date: string
          encounter_id: string | null
          end_time: string | null
          id: string
          notes: string | null
          patient_id: string
          start_time: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          clinician_id: string
          created_at?: string
          date: string
          encounter_id?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          start_time: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          clinician_id?: string
          created_at?: string
          date?: string
          encounter_id?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          start_time?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_events_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_events_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      time_blocks: {
        Row: {
          clinician_id: string
          created_at: string
          date: string
          end_time: string
          id: string
          reason: string
          recurrence: string
          start_time: string
        }
        Insert: {
          clinician_id: string
          created_at?: string
          date: string
          end_time: string
          id?: string
          reason?: string
          recurrence?: string
          start_time: string
        }
        Update: {
          clinician_id?: string
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          reason?: string
          recurrence?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_blocks_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "clinicians"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          content: Json
          created_at: string
          encounter_id: string
          id: string
          source: string
        }
        Insert: {
          content?: Json
          created_at?: string
          encounter_id: string
          id?: string
          source?: string
        }
        Update: {
          content?: Json
          created_at?: string
          encounter_id?: string
          id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
