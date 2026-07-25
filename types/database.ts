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
  MaterialPullStatus,
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
          is_active: boolean
          avatar_initials: string | null
          avatar_url: string | null
          notification_preferences: Json
          material_pull_capabilities: Json
          is_station_account: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          full_name?: string | null
          role?: string
          is_active?: boolean
          avatar_initials?: string | null
          avatar_url?: string | null
          notification_preferences?: Json
          material_pull_capabilities?: Json
          is_station_account?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          full_name?: string | null
          role?: string
          is_active?: boolean
          avatar_initials?: string | null
          avatar_url?: string | null
          notification_preferences?: Json
          material_pull_capabilities?: Json
          is_station_account?: boolean
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
          qb_customer_url: string | null
          qb_customer_id: string | null
          qb_status_note: string | null
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
          qb_customer_url?: string | null
          qb_customer_id?: string | null
          qb_status_note?: string | null
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
          qb_customer_url?: string | null
          qb_customer_id?: string | null
          qb_status_note?: string | null
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
          qb_url: string | null
          qb_external_id: string | null
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
          qb_url?: string | null
          qb_external_id?: string | null
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
          qb_url?: string | null
          qb_external_id?: string | null
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
      job_assignees: {
        Row: {
          job_id: string
          profile_id: string
          assigned_at: string
          assigned_by: string | null
        }
        Insert: {
          job_id: string
          profile_id: string
          assigned_at?: string
          assigned_by?: string | null
        }
        Update: {
          job_id?: string
          profile_id?: string
          assigned_at?: string
          assigned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_assignees_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_assignees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      report_views: {
        Row: {
          id: string
          profile_id: string
          organization_id: string
          name: string
          filters: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          organization_id: string
          name: string
          filters?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          organization_id?: string
          name?: string
          filters?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_views_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      material_pull_requests: {
        Row: {
          id: string
          organization_id: string
          job_id: string | null
          job_number: string
          material: string
          quantity: number
          unit: string
          needed_by: string | null
          location: string | null
          notes: string | null
          priority: string
          reason_code: string
          source_job_number: string | null
          status: MaterialPullStatus
          requested_by: string
          approved_by: string | null
          pulled_by: string | null
          batch_id: string | null
          pull_notes: string | null
          pull_checklist: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          job_id?: string | null
          job_number: string
          material: string
          quantity: number
          unit?: string
          needed_by?: string | null
          location?: string | null
          notes?: string | null
          priority?: string
          reason_code?: string
          source_job_number?: string | null
          status?: MaterialPullStatus
          requested_by: string
          approved_by?: string | null
          pulled_by?: string | null
          batch_id?: string | null
          pull_notes?: string | null
          pull_checklist?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          job_id?: string | null
          job_number?: string
          material?: string
          quantity?: number
          unit?: string
          needed_by?: string | null
          location?: string | null
          notes?: string | null
          priority?: string
          reason_code?: string
          source_job_number?: string | null
          status?: MaterialPullStatus
          requested_by?: string
          approved_by?: string | null
          pulled_by?: string | null
          batch_id?: string | null
          pull_notes?: string | null
          pull_checklist?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_pull_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_pull_requests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_pull_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          id: string
          organization_id: string
          profile_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          profile_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          profile_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          user_agent?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_generations: {
        Row: {
          id: string
          organization_id: string
          job_id: string
          po_number: string
          version: number
          customer: string | null
          order_date: string | null
          rev_number: string | null
          structure_numbers: string | null
          catalog_ids: string | null
          document_id: string | null
          generated_by: string | null
          generated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          job_id: string
          po_number: string
          version: number
          customer?: string | null
          order_date?: string | null
          rev_number?: string | null
          structure_numbers?: string | null
          catalog_ids?: string | null
          document_id?: string | null
          generated_by?: string | null
          generated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          job_id?: string
          po_number?: string
          version?: number
          customer?: string | null
          order_date?: string | null
          rev_number?: string | null
          structure_numbers?: string | null
          catalog_ids?: string | null
          document_id?: string | null
          generated_by?: string | null
          generated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_generations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_generations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_generations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      travelers: {
        Row: {
          id: string
          organization_id: string
          job_id: string
          po_number: string
          customer: string | null
          order_date: string | null
          rev_number: string | null
          qb_sales_order: string | null
          ship_date: string | null
          source_document_id: string | null
          version: number
          status: "draft" | "active" | "superseded"
          imported_by: string | null
          imported_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          job_id: string
          po_number: string
          customer?: string | null
          order_date?: string | null
          rev_number?: string | null
          qb_sales_order?: string | null
          ship_date?: string | null
          source_document_id?: string | null
          version: number
          status?: "draft" | "active" | "superseded"
          imported_by?: string | null
          imported_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          job_id?: string
          po_number?: string
          customer?: string | null
          order_date?: string | null
          rev_number?: string | null
          qb_sales_order?: string | null
          ship_date?: string | null
          source_document_id?: string | null
          version?: number
          status?: "draft" | "active" | "superseded"
          imported_by?: string | null
          imported_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travelers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travelers_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travelers_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_lines: {
        Row: {
          id: string
          organization_id: string
          traveler_id: string
          job_id: string
          line_number: string | null
          quantity: number
          catalog_id: string
          description: string | null
          structure_number: string | null
          line_item_id: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          traveler_id: string
          job_id: string
          line_number?: string | null
          quantity?: number
          catalog_id: string
          description?: string | null
          structure_number?: string | null
          line_item_id?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          traveler_id?: string
          job_id?: string
          line_number?: string | null
          quantity?: number
          catalog_id?: string
          description?: string | null
          structure_number?: string | null
          line_item_id?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_lines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_lines_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "travelers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_lines_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_lines_line_item_id_fkey"
            columns: ["line_item_id"]
            isOneToOne: false
            referencedRelation: "line_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_floor_pins: {
        Row: {
          profile_id: string
          organization_id: string
          pin_hash: string
          updated_at: string
        }
        Insert: {
          profile_id: string
          organization_id: string
          pin_hash: string
          updated_at?: string
        }
        Update: {
          profile_id?: string
          organization_id?: string
          pin_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_floor_pins_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_signoffs: {
        Row: {
          id: string
          organization_id: string
          job_id: string
          line_item_id: string
          task_id: string
          traveler_line_id: string | null
          signed_by: string
          session_profile_id: string
          reason_codes: string[]
          note: string | null
          signed_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          job_id: string
          line_item_id: string
          task_id: string
          traveler_line_id?: string | null
          signed_by: string
          session_profile_id: string
          reason_codes?: string[]
          note?: string | null
          signed_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          job_id?: string
          line_item_id?: string
          task_id?: string
          traveler_line_id?: string | null
          signed_by?: string
          session_profile_id?: string
          reason_codes?: string[]
          note?: string | null
          signed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_signoffs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_signoffs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_signoffs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_section_access: {
        Row: {
          organization_id: string
          section_key: string
          role: string
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          section_key: string
          role: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          organization_id?: string
          section_key?: string
          role?: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_section_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          id: string
          organization_id: string
          account_id: string
          full_name: string
          role_title: string | null
          email: string | null
          phone: string | null
          preferred_channel: string | null
          personal_notes: string | null
          relationship_owner_id: string | null
          last_contact_at: string | null
          next_touch_at: string | null
          next_touch_owner_id: string | null
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          account_id: string
          full_name: string
          role_title?: string | null
          email?: string | null
          phone?: string | null
          preferred_channel?: string | null
          personal_notes?: string | null
          relationship_owner_id?: string | null
          last_contact_at?: string | null
          next_touch_at?: string | null
          next_touch_owner_id?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          account_id?: string
          full_name?: string
          role_title?: string | null
          email?: string | null
          phone?: string | null
          preferred_channel?: string | null
          personal_notes?: string | null
          relationship_owner_id?: string | null
          last_contact_at?: string | null
          next_touch_at?: string | null
          next_touch_owner_id?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          id: string
          organization_id: string
          account_id: string | null
          contact_id: string | null
          job_id: string | null
          kind: string
          body: string
          occurred_at: string
          created_by: string | null
          metadata: Json
          external_source: string | null
          external_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          account_id?: string | null
          contact_id?: string | null
          job_id?: string | null
          kind?: string
          body: string
          occurred_at?: string
          created_by?: string | null
          metadata?: Json
          external_source?: string | null
          external_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          account_id?: string | null
          contact_id?: string | null
          job_id?: string | null
          kind?: string
          body?: string
          occurred_at?: string
          created_by?: string | null
          metadata?: Json
          external_source?: string | null
          external_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          id: string
          organization_id: string
          title: string
          body: string | null
          due_at: string | null
          completed_at: string | null
          owner_id: string
          created_by: string | null
          account_id: string | null
          contact_id: string | null
          opportunity_id: string | null
          job_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          body?: string | null
          due_at?: string | null
          completed_at?: string | null
          owner_id: string
          created_by?: string | null
          account_id?: string | null
          contact_id?: string | null
          opportunity_id?: string | null
          job_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          body?: string | null
          due_at?: string | null
          completed_at?: string | null
          owner_id?: string
          created_by?: string | null
          account_id?: string | null
          contact_id?: string | null
          opportunity_id?: string | null
          job_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_oauth_tokens: {
        Row: {
          id: string
          profile_id: string
          organization_id: string
          email: string
          encrypted_refresh_token: string
          scopes: string[]
          token_expiry: string | null
          last_gmail_sync_at: string | null
          last_calendar_sync_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          organization_id: string
          email: string
          encrypted_refresh_token: string
          scopes?: string[]
          token_expiry?: string | null
          last_gmail_sync_at?: string | null
          last_calendar_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          organization_id?: string
          email?: string
          encrypted_refresh_token?: string
          scopes?: string[]
          token_expiry?: string | null
          last_gmail_sync_at?: string | null
          last_calendar_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_oauth_tokens_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_oauth_tokens_organization_id_fkey"
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
