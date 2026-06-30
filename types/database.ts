/**
 * Supabase Database schema types.
 * Keep in sync with supabase/migrations/*.sql
 */

import type {
  ChangeOrderStatus,
  ChangeOrderType,
  DocumentType,
  JobStatus,
  JobTemplateType,
  LineItemWipStatus,
  OppStage,
  Priority,
  TaskCategory,
} from "./enums"

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          full_name: string | null
          role: string
          avatar_initials: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          full_name?: string | null
          role?: string
          avatar_initials?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          full_name?: string | null
          role?: string
          avatar_initials?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          id: string
          organization_id: string
          name: string
          short_name: string
          contact: string | null
          email: string | null
          phone: string | null
          city: string | null
          state: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          short_name: string
          contact?: string | null
          email?: string | null
          phone?: string | null
          city?: string | null
          state?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          short_name?: string
          contact?: string | null
          email?: string | null
          phone?: string | null
          city?: string | null
          state?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          id: string
          organization_id: string
          account_id: string | null
          title: string
          value: number
          stage: OppStage
          probability: number
          close_date: string | null
          assignee: string | null
          assignee_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          account_id?: string | null
          title: string
          value?: number
          stage?: OppStage
          probability?: number
          close_date?: string | null
          assignee?: string | null
          assignee_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          account_id?: string | null
          title?: string
          value?: number
          stage?: OppStage
          probability?: number
          close_date?: string | null
          assignee?: string | null
          assignee_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          id: string
          organization_id: string
          account_id: string | null
          opportunity_id: string | null
          job_number: string
          po_number: string
          description: string
          status: JobStatus
          priority: Priority
          delivery_date: string | null
          start_date: string | null
          tonnage: number | null
          value: number
          mark_numbers: string[]
          assignees: string[]
          progress: number
          notes: string | null
          google_drive_folder_id: string | null
          job_template: JobTemplateType | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          account_id?: string | null
          opportunity_id?: string | null
          job_number: string
          po_number: string
          description: string
          status?: JobStatus
          priority?: Priority
          delivery_date?: string | null
          start_date?: string | null
          tonnage?: number | null
          value?: number
          mark_numbers?: string[]
          assignees?: string[]
          progress?: number
          notes?: string | null
          google_drive_folder_id?: string | null
          job_template?: JobTemplateType | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          account_id?: string | null
          opportunity_id?: string | null
          job_number?: string
          po_number?: string
          description?: string
          status?: JobStatus
          priority?: Priority
          delivery_date?: string | null
          start_date?: string | null
          tonnage?: number | null
          value?: number
          mark_numbers?: string[]
          assignees?: string[]
          progress?: number
          notes?: string | null
          google_drive_folder_id?: string | null
          job_template?: JobTemplateType | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      line_items: {
        Row: {
          id: string
          organization_id: string
          job_id: string
          title: string
          description: string | null
          quantity: number
          line_item_number: string | null
          wip_status: LineItemWipStatus
          sort_order: number
          delivery_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          job_id: string
          title: string
          description?: string | null
          quantity?: number
          line_item_number?: string | null
          wip_status?: LineItemWipStatus
          sort_order?: number
          delivery_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          job_id?: string
          title?: string
          description?: string | null
          quantity?: number
          line_item_number?: string | null
          wip_status?: LineItemWipStatus
          sort_order?: number
          delivery_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "line_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          id: string
          organization_id: string
          job_id: string
          line_item_id: string
          title: string
          completed: boolean
          assignee: string | null
          assignee_id: string | null
          due_date: string | null
          category: TaskCategory
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          job_id: string
          line_item_id: string
          title: string
          completed?: boolean
          assignee?: string | null
          assignee_id?: string | null
          due_date?: string | null
          category?: TaskCategory
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          job_id?: string
          line_item_id?: string
          title?: string
          completed?: boolean
          assignee?: string | null
          assignee_id?: string | null
          due_date?: string | null
          category?: TaskCategory
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          id: string
          organization_id: string
          job_id: string
          line_item_id: string | null
          name: string
          type: DocumentType
          mime_type: string | null
          size_bytes: number | null
          google_drive_file_id: string | null
          google_drive_folder_id: string | null
          storage_path: string | null
          web_view_link: string | null
          preview_enabled: boolean
          uploaded_by: string | null
          uploaded_by_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          job_id: string
          line_item_id?: string | null
          name: string
          type: DocumentType
          mime_type?: string | null
          size_bytes?: number | null
          google_drive_file_id?: string | null
          google_drive_folder_id?: string | null
          storage_path?: string | null
          web_view_link?: string | null
          preview_enabled?: boolean
          uploaded_by?: string | null
          uploaded_by_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          job_id?: string
          line_item_id?: string | null
          name?: string
          type?: DocumentType
          mime_type?: string | null
          size_bytes?: number | null
          google_drive_file_id?: string | null
          google_drive_folder_id?: string | null
          storage_path?: string | null
          web_view_link?: string | null
          preview_enabled?: boolean
          uploaded_by?: string | null
          uploaded_by_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      change_orders: {
        Row: {
          id: string
          organization_id: string
          job_id: string
          type: ChangeOrderType
          description: string
          impact: string | null
          status: ChangeOrderStatus
          occurred_on: string
          value: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          job_id: string
          type: ChangeOrderType
          description: string
          impact?: string | null
          status?: ChangeOrderStatus
          occurred_on?: string
          value?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          job_id?: string
          type?: ChangeOrderType
          description?: string
          impact?: string | null
          status?: ChangeOrderStatus
          occurred_on?: string
          value?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          id: string
          organization_id: string
          job_id: string
          user_id: string | null
          user_name: string
          user_avatar: string | null
          action: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          job_id: string
          user_id?: string | null
          user_name: string
          user_avatar?: string | null
          action: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          job_id?: string
          user_id?: string | null
          user_name?: string
          user_avatar?: string | null
          action?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      current_organization_id: {
        Args: Record<string, never>
        Returns: string
      }
      provision_user_profile: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
