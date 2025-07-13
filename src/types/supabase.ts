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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'student' | 'administrator' | 'accountant'
          department: string | null
          student_id: string | null
          admin_email: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'student' | 'administrator' | 'accountant'
          department?: string | null
          student_id?: string | null
          admin_email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'student' | 'administrator' | 'accountant'
          department?: string | null
          student_id?: string | null
          admin_email?: string | null
          created_at?: string
        }
      }
      bank_connections: {
        Row: {
          id: string
          user_id: string
          plaid_access_token: string
          plaid_item_id: string
          institution_name: string | null
          last_synced: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plaid_access_token: string
          plaid_item_id: string
          institution_name?: string | null
          last_synced?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plaid_access_token?: string
          plaid_item_id?: string
          institution_name?: string | null
          last_synced?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          plaid_transaction_id: string
          bank_connection_id: string | null
          amount: number
          date: string
          description: string | null
          merchant_name: string | null
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plaid_transaction_id: string
          bank_connection_id?: string | null
          amount: number
          date: string
          description?: string | null
          merchant_name?: string | null
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plaid_transaction_id?: string
          bank_connection_id?: string | null
          amount?: number
          date?: string
          description?: string | null
          merchant_name?: string | null
          category?: string | null
          created_at?: string
        }
      }
      reimbursement_requests: {
        Row: {
          id: string
          user_id: string
          status: 'draft' | 'submitted'
          total_amount: number
          notes: string | null
          created_at: string
          submitted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'draft' | 'submitted'
          total_amount?: number
          notes?: string | null
          created_at?: string
          submitted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'draft' | 'submitted'
          total_amount?: number
          notes?: string | null
          created_at?: string
          submitted_at?: string | null
        }
      }
      reimbursement_items: {
        Row: {
          id: string
          request_id: string
          transaction_id: string | null
          amount: number
          category: string
          description: string | null
          date: string
          is_manual_entry: boolean
        }
        Insert: {
          id?: string
          request_id: string
          transaction_id?: string | null
          amount: number
          category: string
          description?: string | null
          date: string
          is_manual_entry?: boolean
        }
        Update: {
          id?: string
          request_id?: string
          transaction_id?: string | null
          amount?: number
          category?: string
          description?: string | null
          date?: string
          is_manual_entry?: boolean
        }
      }
      allowances: {
        Row: {
          id: string
          user_id: string
          academic_year: string
          total_amount: number
          used_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          academic_year: string
          total_amount: number
          used_amount?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          academic_year?: string
          total_amount?: number
          used_amount?: number
          created_at?: string
        }
      }
      educational_content: {
        Row: {
          id: string
          title: string
          slug: string
          content: string
          category: 'tips' | 'tax' | 'budgeting' | 'savings' | 'investing'
          tags: string[] | null
          featured: boolean
          view_count: number
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content: string
          category: 'tips' | 'tax' | 'budgeting' | 'savings' | 'investing'
          tags?: string[] | null
          featured?: boolean
          view_count?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: string
          category?: 'tips' | 'tax' | 'budgeting' | 'savings' | 'investing'
          tags?: string[] | null
          featured?: boolean
          view_count?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      content_interactions: {
        Row: {
          id: string
          user_id: string
          content_id: string
          interaction_type: 'view' | 'like' | 'bookmark'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_id: string
          interaction_type: 'view' | 'like' | 'bookmark'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_id?: string
          interaction_type?: 'view' | 'like' | 'bookmark'
          created_at?: string
        }
      }
      weekly_tips: {
        Row: {
          id: string
          content: string
          week_start: string
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          week_start: string
          created_at?: string
        }
        Update: {
          id?: string
          content?: string
          week_start?: string
          created_at?: string
        }
      }
      budget_templates: {
        Row: {
          id: string
          title: string
          description: string | null
          template_data: Json
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          template_data: Json
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          template_data?: Json
          is_default?: boolean
          created_at?: string
        }
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
  }
} 