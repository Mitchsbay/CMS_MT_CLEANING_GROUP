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
          role: 'admin' | 'staff' | 'client'
          status: 'active' | 'inactive'
          full_name: string
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'admin' | 'staff' | 'client'
          status?: 'active' | 'inactive'
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'staff' | 'client'
          status?: 'active' | 'inactive'
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          contact_email: string
          contact_phone: string | null
          address: string | null
          notes: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_email: string
          contact_phone?: string | null
          address?: string | null
          notes?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_email?: string
          contact_phone?: string | null
          address?: string | null
          notes?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sites: {
        Row: {
          id: string
          name: string
          address: string
          latitude: number
          longitude: number
          client_id: string | null
          instructions: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          latitude: number
          longitude: number
          client_id?: string | null
          instructions?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          latitude?: number
          longitude?: number
          client_id?: string | null
          instructions?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      task_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          site_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          site_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          site_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          site_id: string
          assigned_to: string | null
          scheduled_date: string
          scheduled_start_time: string | null
          scheduled_end_time: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          site_id: string
          assigned_to?: string | null
          scheduled_date: string
          scheduled_start_time?: string | null
          scheduled_end_time?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          assigned_to?: string | null
          scheduled_date?: string
          scheduled_start_time?: string | null
          scheduled_end_time?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_tasks: {
        Row: {
          id: string
          job_id: string
          task_template_id: string | null
          task_name: string
          task_description: string | null
          completed: boolean
          notes: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          task_template_id?: string | null
          task_name: string
          task_description?: string | null
          completed?: boolean
          notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          task_template_id?: string | null
          task_name?: string
          task_description?: string | null
          completed?: boolean
          notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      check_ins: {
        Row: {
          id: string
          job_id: string
          user_id: string
          check_in_time: string
          check_in_latitude: number
          check_in_longitude: number
          check_in_verified: boolean
          check_out_time: string | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          check_out_verified: boolean
          signature_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          user_id: string
          check_in_time?: string
          check_in_latitude: number
          check_in_longitude: number
          check_in_verified?: boolean
          check_out_time?: string | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_verified?: boolean
          signature_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          user_id?: string
          check_in_time?: string
          check_in_latitude?: number
          check_in_longitude?: number
          check_in_verified?: boolean
          check_out_time?: string | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_verified?: boolean
          signature_url?: string | null
          created_at?: string
        }
      }
      task_photos: {
        Row: {
          id: string
          job_task_id: string
          photo_url: string
          photo_type: 'before' | 'after'
          uploaded_by: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          job_task_id: string
          photo_url: string
          photo_type: 'before' | 'after'
          uploaded_by: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          job_task_id?: string
          photo_url?: string
          photo_type?: 'before' | 'after'
          uploaded_by?: string
          uploaded_at?: string
        }
      }
      incidents: {
        Row: {
          id: string
          job_id: string | null
          reported_by: string
          title: string
          description: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          photos: string[] | null
          resolution_notes: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id?: string | null
          reported_by: string
          title: string
          description: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          photos?: string[] | null
          resolution_notes?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string | null
          reported_by?: string
          title?: string
          description?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          photos?: string[] | null
          resolution_notes?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          name: string
          serial_number: string | null
          purchase_date: string | null
          location: string | null
          status: 'operational' | 'maintenance' | 'retired' | 'lost'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          serial_number?: string | null
          purchase_date?: string | null
          location?: string | null
          status?: 'operational' | 'maintenance' | 'retired' | 'lost'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          serial_number?: string | null
          purchase_date?: string | null
          location?: string | null
          status?: 'operational' | 'maintenance' | 'retired' | 'lost'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      asset_maintenance: {
        Row: {
          id: string
          asset_id: string
          maintenance_type: string
          performed_date: string
          performed_by: string | null
          next_due_date: string | null
          certificate_url: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          asset_id: string
          maintenance_type: string
          performed_date: string
          performed_by?: string | null
          next_due_date?: string | null
          certificate_url?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          asset_id?: string
          maintenance_type?: string
          performed_date?: string
          performed_by?: string | null
          next_due_date?: string | null
          certificate_url?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          table_name?: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
      settings: {
        Row: {
          key: string
          value: Json
          description: string | null
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          description?: string | null
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          description?: string | null
          updated_by?: string | null
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'warning' | 'success' | 'error'
          read: boolean
          related_job_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'warning' | 'success' | 'error'
          read?: boolean
          related_job_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'warning' | 'success' | 'error'
          read?: boolean
          related_job_id?: string | null
          created_at?: string
        }
      }
    }
  }
}
