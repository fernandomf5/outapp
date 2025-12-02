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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          app_installs: number | null
          brand_recall: number | null
          budget: number
          campaign_type: string | null
          catalog_sales: number | null
          clicks: number
          client_id: string | null
          conversions: number
          cost_per_follower: number | null
          cost_per_message: number | null
          cpa_by_product: number | null
          cpi: number | null
          cpl: number | null
          cpm: number | null
          cpv: number | null
          created_at: string
          custom_conversions: number | null
          end_date: string | null
          engagement_cost: number | null
          engagement_count: number | null
          followers_gained: number | null
          frequency: number | null
          id: string
          impressions: number
          leads_generated: number | null
          messages_count: number | null
          name: string
          platform: string
          product_cost: number | null
          qualified_reach: number | null
          reach: number | null
          recovery_rate: number | null
          response_rate: number | null
          retention_rate: number | null
          revenue: number | null
          roas_by_category: number | null
          spent: number
          start_date: string
          status: string
          updated_at: string
          user_id: string
          video_views: number | null
          video_watch_time: number | null
        }
        Insert: {
          app_installs?: number | null
          brand_recall?: number | null
          budget: number
          campaign_type?: string | null
          catalog_sales?: number | null
          clicks?: number
          client_id?: string | null
          conversions?: number
          cost_per_follower?: number | null
          cost_per_message?: number | null
          cpa_by_product?: number | null
          cpi?: number | null
          cpl?: number | null
          cpm?: number | null
          cpv?: number | null
          created_at?: string
          custom_conversions?: number | null
          end_date?: string | null
          engagement_cost?: number | null
          engagement_count?: number | null
          followers_gained?: number | null
          frequency?: number | null
          id?: string
          impressions?: number
          leads_generated?: number | null
          messages_count?: number | null
          name: string
          platform: string
          product_cost?: number | null
          qualified_reach?: number | null
          reach?: number | null
          recovery_rate?: number | null
          response_rate?: number | null
          retention_rate?: number | null
          revenue?: number | null
          roas_by_category?: number | null
          spent?: number
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
          video_views?: number | null
          video_watch_time?: number | null
        }
        Update: {
          app_installs?: number | null
          brand_recall?: number | null
          budget?: number
          campaign_type?: string | null
          catalog_sales?: number | null
          clicks?: number
          client_id?: string | null
          conversions?: number
          cost_per_follower?: number | null
          cost_per_message?: number | null
          cpa_by_product?: number | null
          cpi?: number | null
          cpl?: number | null
          cpm?: number | null
          cpv?: number | null
          created_at?: string
          custom_conversions?: number | null
          end_date?: string | null
          engagement_cost?: number | null
          engagement_count?: number | null
          followers_gained?: number | null
          frequency?: number | null
          id?: string
          impressions?: number
          leads_generated?: number | null
          messages_count?: number | null
          name?: string
          platform?: string
          product_cost?: number | null
          qualified_reach?: number | null
          reach?: number | null
          recovery_rate?: number | null
          response_rate?: number | null
          retention_rate?: number | null
          revenue?: number | null
          roas_by_category?: number | null
          spent?: number
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
          video_views?: number | null
          video_watch_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "ad_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_clients: {
        Row: {
          cashbox: number
          client_type: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cashbox?: number
          client_type?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cashbox?: number
          client_type?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ad_spy_config: {
        Row: {
          created_at: string
          google_api_key: string | null
          id: string
          is_active: boolean | null
          meta_access_token: string | null
          tiktok_api_key: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          google_api_key?: string | null
          id?: string
          is_active?: boolean | null
          meta_access_token?: string | null
          tiktok_api_key?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          google_api_key?: string | null
          id?: string
          is_active?: boolean | null
          meta_access_token?: string | null
          tiktok_api_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      admin_message_reads: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "admin_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_messages: {
        Row: {
          content_html: string | null
          created_at: string
          id: string
          image_url: string | null
          is_read: boolean
          message: string
          sent_to_all: boolean
          title: string
          user_id: string | null
        }
        Insert: {
          content_html?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean
          message: string
          sent_to_all?: boolean
          title: string
          user_id?: string | null
        }
        Update: {
          content_html?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean
          message?: string
          sent_to_all?: boolean
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          ip_address: string | null
          referrer: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          referrer?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          referrer?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          affiliate_id: string
          amount: number
          commission_amount: number
          created_at: string
          id: string
          order_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          commission_amount: number
          created_at?: string
          id?: string
          order_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          commission_amount?: number
          created_at?: string
          id?: string
          order_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_programs: {
        Row: {
          commission_percentage: number
          cookie_duration_days: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_percentage?: number
          cookie_duration_days?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_percentage?: number
          cookie_duration_days?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          affiliate_code: string
          created_at: string
          custom_domain: string | null
          id: string
          program_id: string
          status: string
          total_clicks: number
          total_commission: number
          total_conversions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_code: string
          created_at?: string
          custom_domain?: string | null
          id?: string
          program_id: string
          status?: string
          total_clicks?: number
          total_commission?: number
          total_conversions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_code?: string
          created_at?: string
          custom_domain?: string | null
          id?: string
          program_id?: string
          status?: string
          total_clicks?: number
          total_commission?: number
          total_conversions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "affiliate_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_access_requests: {
        Row: {
          access_duration_days: number | null
          agent_id: string
          customer_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          access_duration_days?: number | null
          agent_id: string
          customer_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          access_duration_days?: number | null
          agent_id?: string
          customer_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_access_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_access_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "agent_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_appointments: {
        Row: {
          agent_id: string
          conversation_id: string | null
          created_at: string
          customer_id: string
          customer_notes: string | null
          id: string
          proposed_date: string | null
          response_type: string | null
          scheduled_date: string
          service_description: string | null
          service_id: string | null
          service_name: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          conversation_id?: string | null
          created_at?: string
          customer_id: string
          customer_notes?: string | null
          id?: string
          proposed_date?: string | null
          response_type?: string | null
          scheduled_date: string
          service_description?: string | null
          service_id?: string | null
          service_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          conversation_id?: string | null
          created_at?: string
          customer_id?: string
          customer_notes?: string | null
          id?: string
          proposed_date?: string | null
          response_type?: string | null
          scheduled_date?: string
          service_description?: string | null
          service_id?: string | null
          service_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_appointments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_appointments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "agent_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "agent_services"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_auto_messages: {
        Row: {
          agent_id: string
          created_at: string
          delay_hours: number | null
          id: string
          is_active: boolean
          message_content: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          delay_hours?: number | null
          id?: string
          is_active?: boolean
          message_content: string
          trigger_type: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          delay_hours?: number | null
          id?: string
          is_active?: boolean
          message_content?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_auto_messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_conversations: {
        Row: {
          agent_id: string
          ai_enabled: boolean
          created_at: string
          customer_id: string
          id: string
          last_message_at: string
          last_read_by_owner_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          ai_enabled?: boolean
          created_at?: string
          customer_id: string
          id?: string
          last_message_at?: string
          last_read_by_owner_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          ai_enabled?: boolean
          created_at?: string
          customer_id?: string
          id?: string
          last_message_at?: string
          last_read_by_owner_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "agent_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_customers: {
        Row: {
          agent_id: string
          created_at: string
          email: string
          email_verified: boolean
          id: string
          last_login_at: string | null
          name: string
          password_hash: string | null
          phone: string | null
          updated_at: string
          verification_token: string | null
          verification_token_expires_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          email: string
          email_verified?: boolean
          id?: string
          last_login_at?: string | null
          name: string
          password_hash?: string | null
          phone?: string | null
          updated_at?: string
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          email?: string
          email_verified?: boolean
          id?: string
          last_login_at?: string | null
          name?: string
          password_hash?: string | null
          phone?: string | null
          updated_at?: string
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_customers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          role: string
          sender_name: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          role: string
          sender_name?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          role?: string
          sender_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_notifications: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          notification_type: string
          reference_id: string | null
          title: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          notification_type: string
          reference_id?: string | null
          title: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          reference_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_notifications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_orders: {
        Row: {
          agent_id: string
          conversation_id: string | null
          created_at: string
          customer_id: string
          customer_notes: string | null
          delivery_address: string | null
          id: string
          items: Json
          order_number: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          conversation_id?: string | null
          created_at?: string
          customer_id: string
          customer_notes?: string | null
          delivery_address?: string | null
          id?: string
          items?: Json
          order_number: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          conversation_id?: string | null
          created_at?: string
          customer_id?: string
          customer_notes?: string | null
          delivery_address?: string | null
          id?: string
          items?: Json
          order_number?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_orders_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_orders_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "agent_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_password_resets: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          token: string
          used: boolean
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "agent_password_resets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "agent_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_payments: {
        Row: {
          agent_id: string
          amount: number
          created_at: string
          customer_id: string
          id: string
          order_id: string | null
          payment_date: string | null
          payment_method: string | null
          status: string
        }
        Insert: {
          agent_id: string
          amount: number
          created_at?: string
          customer_id: string
          id?: string
          order_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
        }
        Update: {
          agent_id?: string
          amount?: number
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_payments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "agent_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "agent_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_products: {
        Row: {
          agent_id: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          price: number
          stock_quantity: number | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          price: number
          stock_quantity?: number | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          price?: number
          stock_quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_products_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_reviews: {
        Row: {
          agent_id: string
          appointment_id: string | null
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          order_id: string | null
          rating: number
        }
        Insert: {
          agent_id: string
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          order_id?: string | null
          rating: number
        }
        Update: {
          agent_id?: string
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_reviews_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "agent_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "agent_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "agent_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_schedule: {
        Row: {
          agent_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_schedule_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_schedule_blocks: {
        Row: {
          agent_id: string
          created_at: string
          end_date: string
          id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_schedule_blocks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_services: {
        Row: {
          agent_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_services_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          access_type: string
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          niche: string
          training_data: Json
          updated_at: string
          user_id: string
          whatsapp_connection_id: string | null
        }
        Insert: {
          access_type?: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          niche: string
          training_data?: Json
          updated_at?: string
          user_id: string
          whatsapp_connection_id?: string | null
        }
        Update: {
          access_type?: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          niche?: string
          training_data?: Json
          updated_at?: string
          user_id?: string
          whatsapp_connection_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_whatsapp_connection_id_fkey"
            columns: ["whatsapp_connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string
          category: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_published: boolean
          order_index: number
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_name?: string
          category?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_name?: string
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean
          order_index?: number
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      blog_settings: {
        Row: {
          banner_top_link: string | null
          banner_top_url: string | null
          created_at: string
          footer_content: string | null
          footer_menu: Json | null
          header_menu: Json | null
          id: string
          logo_url: string | null
          promotional_banners: Json | null
          site_description: string | null
          site_name: string
          social_links: Json | null
          updated_at: string
        }
        Insert: {
          banner_top_link?: string | null
          banner_top_url?: string | null
          created_at?: string
          footer_content?: string | null
          footer_menu?: Json | null
          header_menu?: Json | null
          id?: string
          logo_url?: string | null
          promotional_banners?: Json | null
          site_description?: string | null
          site_name?: string
          social_links?: Json | null
          updated_at?: string
        }
        Update: {
          banner_top_link?: string | null
          banner_top_url?: string | null
          created_at?: string
          footer_content?: string | null
          footer_menu?: Json | null
          header_menu?: Json | null
          id?: string
          logo_url?: string | null
          promotional_banners?: Json | null
          site_description?: string | null
          site_name?: string
          social_links?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      briefing_responses: {
        Row: {
          briefing_id: string
          created_at: string
          id: string
          responses: Json
          visitor_email: string | null
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: {
          briefing_id: string
          created_at?: string
          id?: string
          responses?: Json
          visitor_email?: string | null
          visitor_name: string
          visitor_phone?: string | null
        }
        Update: {
          briefing_id?: string
          created_at?: string
          id?: string
          responses?: Json
          visitor_email?: string | null
          visitor_name?: string
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "briefing_responses_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "briefings"
            referencedColumns: ["id"]
          },
        ]
      }
      briefings: {
        Row: {
          created_at: string
          description: string | null
          fields: Json
          id: string
          is_active: boolean
          is_blocked: boolean
          logo_url: string | null
          primary_color: string | null
          responses_count: number
          secondary_color: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean
          is_blocked?: boolean
          logo_url?: string | null
          primary_color?: string | null
          responses_count?: number
          secondary_color?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean
          is_blocked?: boolean
          logo_url?: string | null
          primary_color?: string | null
          responses_count?: number
          secondary_color?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      button_link_clicks: {
        Row: {
          ai_agent_id: string | null
          button_text: string
          button_url: string
          chatbot_id: string | null
          conversation_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          node_id: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          ai_agent_id?: string | null
          button_text: string
          button_url: string
          chatbot_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          node_id?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          ai_agent_id?: string | null
          button_text?: string
          button_url?: string
          chatbot_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          node_id?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "button_link_clicks_ai_agent_id_fkey"
            columns: ["ai_agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "button_link_clicks_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_access_requests: {
        Row: {
          chatbot_id: string
          customer_id: string
          id: string
          notes: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          chatbot_id: string
          customer_id: string
          id?: string
          notes?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          chatbot_id?: string
          customer_id?: string
          id?: string
          notes?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_access_requests_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_access_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "chatbot_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_appointments: {
        Row: {
          chatbot_id: string
          created_at: string
          customer_id: string
          date: string
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          customer_id: string
          date: string
          id?: string
          notes?: string | null
          status?: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          customer_id?: string
          date?: string
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_appointments_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "chatbot_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_automations: {
        Row: {
          chatbot_id: string
          created_at: string
          delay_minutes: number | null
          id: string
          is_active: boolean
          message: string
          trigger_type: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          delay_minutes?: number | null
          id?: string
          is_active?: boolean
          message: string
          trigger_type: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          delay_minutes?: number | null
          id?: string
          is_active?: boolean
          message?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_automations_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_conversations: {
        Row: {
          ai_enabled: boolean
          chatbot_id: string
          created_at: string
          id: string
          last_message_at: string
          last_read_by_owner_at: string | null
          session_id: string
          started_at: string
          status: string
          visitor_email: string | null
          visitor_name: string | null
          visitor_phone: string | null
        }
        Insert: {
          ai_enabled?: boolean
          chatbot_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          last_read_by_owner_at?: string | null
          session_id: string
          started_at?: string
          status?: string
          visitor_email?: string | null
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Update: {
          ai_enabled?: boolean
          chatbot_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          last_read_by_owner_at?: string | null
          session_id?: string
          started_at?: string
          status?: string
          visitor_email?: string | null
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_conversations_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_customer_verification_codes: {
        Row: {
          code: string
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          customer_id: string
          expires_at: string
          id?: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_customer_verification_codes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "chatbot_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_customers: {
        Row: {
          chatbot_id: string
          created_at: string
          email: string | null
          email_verified: boolean
          id: string
          last_login_at: string | null
          name: string
          password_hash: string | null
          phone: string | null
          updated_at: string
          verification_token: string | null
          verification_token_expires_at: string | null
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          email?: string | null
          email_verified?: boolean
          id?: string
          last_login_at?: string | null
          name: string
          password_hash?: string | null
          phone?: string | null
          updated_at?: string
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          email?: string | null
          email_verified?: boolean
          id?: string
          last_login_at?: string | null
          name?: string
          password_hash?: string | null
          phone?: string | null
          updated_at?: string
          verification_token?: string | null
          verification_token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_customers_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_flows: {
        Row: {
          buttons: Json | null
          chatbot_id: string
          created_at: string | null
          id: string
          is_start: boolean | null
          keywords: string[] | null
          message: string
          name: string
          order_index: number | null
          updated_at: string | null
        }
        Insert: {
          buttons?: Json | null
          chatbot_id: string
          created_at?: string | null
          id?: string
          is_start?: boolean | null
          keywords?: string[] | null
          message: string
          name: string
          order_index?: number | null
          updated_at?: string | null
        }
        Update: {
          buttons?: Json | null
          chatbot_id?: string
          created_at?: string | null
          id?: string
          is_start?: boolean | null
          keywords?: string[] | null
          message?: string
          name?: string
          order_index?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_flows_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          node_id: string | null
          role: string
          sender_name: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          node_id?: string | null
          role: string
          sender_name?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          node_id?: string | null
          role?: string
          sender_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chatbot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_notifications: {
        Row: {
          chatbot_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_notifications_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "chatbot_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "chatbot_products"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_orders: {
        Row: {
          chatbot_id: string
          created_at: string
          customer_id: string
          id: string
          payment_method: string | null
          status: string
          total: number
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          customer_id: string
          id?: string
          payment_method?: string | null
          status?: string
          total: number
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          payment_method?: string | null
          status?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_orders_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "chatbot_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_password_resets: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          token: string
          used: boolean
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_password_resets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "chatbot_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_products: {
        Row: {
          chatbot_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          type: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          type: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_products_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_reviews: {
        Row: {
          chatbot_id: string
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          rating: number
        }
        Insert: {
          chatbot_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          rating: number
        }
        Update: {
          chatbot_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_reviews_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chatbot_reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "chatbot_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_schedules: {
        Row: {
          chatbot_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          start_time: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_schedules_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_services: {
        Row: {
          chatbot_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_services_chatbot_id_fkey"
            columns: ["chatbot_id"]
            isOneToOne: false
            referencedRelation: "chatbots"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbots: {
        Row: {
          access_type: string
          auto_reply_message: string | null
          config: Json
          created_at: string
          description: string | null
          enable_auto_reply: boolean | null
          enable_queue: boolean | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
          whatsapp_connection_id: string | null
        }
        Insert: {
          access_type?: string
          auto_reply_message?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          enable_auto_reply?: boolean | null
          enable_queue?: boolean | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
          whatsapp_connection_id?: string | null
        }
        Update: {
          access_type?: string
          auto_reply_message?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          enable_auto_reply?: boolean | null
          enable_queue?: boolean | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
          whatsapp_connection_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbots_whatsapp_connection_id_fkey"
            columns: ["whatsapp_connection_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      cloned_page_analytics: {
        Row: {
          browser: string | null
          clicks_count: number | null
          conversion_type: string | null
          converted: boolean | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: string | null
          os: string | null
          page_id: string
          referrer: string | null
          scroll_depth: number | null
          session_id: string | null
          time_on_page: number | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string | null
        }
        Insert: {
          browser?: string | null
          clicks_count?: number | null
          conversion_type?: string | null
          converted?: boolean | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          page_id: string
          referrer?: string | null
          scroll_depth?: number | null
          session_id?: string | null
          time_on_page?: number | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Update: {
          browser?: string | null
          clicks_count?: number | null
          conversion_type?: string | null
          converted?: boolean | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          os?: string | null
          page_id?: string
          referrer?: string | null
          scroll_depth?: number | null
          session_id?: string | null
          time_on_page?: number | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cloned_page_analytics_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cloned_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cloned_page_clicks: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          page_id: string | null
          referrer: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          page_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          page_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cloned_page_clicks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cloned_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cloned_page_leads: {
        Row: {
          created_at: string
          custom_fields: Json | null
          email: string | null
          id: string
          ip_address: string | null
          name: string | null
          notes: string | null
          page_id: string
          phone: string | null
          referrer: string | null
          status: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          id?: string
          ip_address?: string | null
          name?: string | null
          notes?: string | null
          page_id: string
          phone?: string | null
          referrer?: string | null
          status?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          id?: string
          ip_address?: string | null
          name?: string | null
          notes?: string | null
          page_id?: string
          phone?: string | null
          referrer?: string | null
          status?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cloned_page_leads_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cloned_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cloned_page_variants: {
        Row: {
          conversion_rate: number | null
          conversions: number | null
          created_at: string
          custom_settings: Json | null
          id: string
          is_active: boolean | null
          is_winner: boolean | null
          page_content_changes: Json | null
          page_id: string
          traffic_percentage: number
          updated_at: string
          variant_letter: string
          variant_name: string
          views: number | null
        }
        Insert: {
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string
          custom_settings?: Json | null
          id?: string
          is_active?: boolean | null
          is_winner?: boolean | null
          page_content_changes?: Json | null
          page_id: string
          traffic_percentage?: number
          updated_at?: string
          variant_letter: string
          variant_name: string
          views?: number | null
        }
        Update: {
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string
          custom_settings?: Json | null
          id?: string
          is_active?: boolean | null
          is_winner?: boolean | null
          page_content_changes?: Json | null
          page_id?: string
          traffic_percentage?: number
          updated_at?: string
          variant_letter?: string
          variant_name?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cloned_page_variants_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cloned_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cloned_pages: {
        Row: {
          clicks: number | null
          cloned_url: string
          created_at: string
          custom_domain: string | null
          custom_footer_code: string | null
          custom_header_code: string | null
          custom_settings: Json | null
          id: string
          is_active: boolean
          original_url: string
          page_content: string | null
          slug: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          clicks?: number | null
          cloned_url: string
          created_at?: string
          custom_domain?: string | null
          custom_footer_code?: string | null
          custom_header_code?: string | null
          custom_settings?: Json | null
          id?: string
          is_active?: boolean
          original_url: string
          page_content?: string | null
          slug?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          clicks?: number | null
          cloned_url?: string
          created_at?: string
          custom_domain?: string | null
          custom_footer_code?: string | null
          custom_header_code?: string | null
          custom_settings?: Json | null
          id?: string
          is_active?: boolean
          original_url?: string
          page_content?: string | null
          slug?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_form_submissions: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      contact_interactions: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          notes: string | null
          type: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          notes?: string | null
          type: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          last_contact_at: string | null
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          source: string | null
          status: string
          tags: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contact_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          source?: string | null
          status?: string
          tags?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contact_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          source?: string | null
          status?: string
          tags?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversion_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_name: string
          id: string
          pixel_id: string
          user_id: string
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_name: string
          id?: string
          pixel_id: string
          user_id: string
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_name?: string
          id?: string
          pixel_id?: string
          user_id?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_pixel_id_fkey"
            columns: ["pixel_id"]
            isOneToOne: false
            referencedRelation: "tracking_pixels"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          is_active: boolean
          is_verified: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean
          order_index: number
          show_in_menu: boolean | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          show_in_menu?: boolean | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          show_in_menu?: boolean | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          last_contact_at: string | null
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          postal_code: string | null
          state: string | null
          status: string
          tags: string[] | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contact_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contact_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      digital_products: {
        Row: {
          category: string
          cover_image_url: string | null
          created_at: string
          description: string
          id: string
          is_published: boolean
          name: string
          pdf_url: string | null
          price: number
          sales_count: number
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          category: string
          cover_image_url?: string | null
          created_at?: string
          description: string
          id?: string
          is_published?: boolean
          name: string
          pdf_url?: string | null
          price: number
          sales_count?: number
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          name?: string
          pdf_url?: string | null
          price?: number
          sales_count?: number
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: []
      }
      feature_overrides: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          is_blocked: boolean
          message: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          is_blocked?: boolean
          message?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          is_blocked?: boolean
          message?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      features: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          key: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_businesses: {
        Row: {
          business_type: string
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          order_index: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_type?: string
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          order_index?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_type?: string
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          order_index?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          business_id: string | null
          color: string | null
          created_at: string
          id: string
          name: string
          order_index: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name: string
          order_index?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          order_index?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "financial_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          business_id: string | null
          business_name: string | null
          business_type: string | null
          category: string
          created_at: string
          date: string | null
          description: string
          due_date: string | null
          id: string
          is_recurring: boolean | null
          month: string | null
          monthly_status: Json | null
          order_index: number | null
          payment_method: string
          reminder_enabled: boolean | null
          status: string
          status_history: Json | null
          type: string
          user_id: string
          year: number | null
        }
        Insert: {
          amount: number
          business_id?: string | null
          business_name?: string | null
          business_type?: string | null
          category: string
          created_at?: string
          date?: string | null
          description: string
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          month?: string | null
          monthly_status?: Json | null
          order_index?: number | null
          payment_method: string
          reminder_enabled?: boolean | null
          status?: string
          status_history?: Json | null
          type: string
          user_id: string
          year?: number | null
        }
        Update: {
          amount?: number
          business_id?: string | null
          business_name?: string | null
          business_type?: string | null
          category?: string
          created_at?: string
          date?: string | null
          description?: string
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          month?: string | null
          monthly_status?: Json | null
          order_index?: number | null
          payment_method?: string
          reminder_enabled?: boolean | null
          status?: string
          status_history?: Json | null
          type?: string
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "financial_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      floating_buttons: {
        Row: {
          created_at: string
          generated_code: string | null
          id: string
          main_button_color: string
          main_button_icon: string
          main_button_text: string
          name: string
          position: string
          sub_buttons: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_code?: string | null
          id?: string
          main_button_color?: string
          main_button_icon?: string
          main_button_text?: string
          name: string
          position?: string
          sub_buttons?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_code?: string | null
          id?: string
          main_button_color?: string
          main_button_icon?: string
          main_button_text?: string
          name?: string
          position?: string
          sub_buttons?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      funnels: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      link_bio_clicks: {
        Row: {
          bio_id: string | null
          clicked_at: string
          country: string | null
          device_type: string | null
          id: string
          link_id: string | null
          referrer: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          bio_id?: string | null
          clicked_at?: string
          country?: string | null
          device_type?: string | null
          id?: string
          link_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          bio_id?: string | null
          clicked_at?: string
          country?: string | null
          device_type?: string | null
          id?: string
          link_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_bio_clicks_bio_id_fkey"
            columns: ["bio_id"]
            isOneToOne: false
            referencedRelation: "link_bios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_bio_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "link_bio_links"
            referencedColumns: ["id"]
          },
        ]
      }
      link_bio_links: {
        Row: {
          bio_id: string
          clicks: number | null
          created_at: string
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          position: number
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          bio_id: string
          clicks?: number | null
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          position?: number
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          bio_id?: string
          clicks?: number | null
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          position?: number
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_bio_links_bio_id_fkey"
            columns: ["bio_id"]
            isOneToOne: false
            referencedRelation: "link_bios"
            referencedColumns: ["id"]
          },
        ]
      }
      link_bios: {
        Row: {
          avatar_url: string | null
          background_color: string | null
          background_image: string | null
          background_overlay_color: string | null
          background_overlay_opacity: number | null
          bio: string | null
          border_animation: string | null
          border_color: string | null
          border_radius: number | null
          border_style: string | null
          border_width: number | null
          button_color: string | null
          button_spacing: number | null
          button_text_color: string | null
          created_at: string
          custom_css: string | null
          custom_domain: string | null
          display_name: string | null
          gradient_color1: string | null
          gradient_color2: string | null
          hover_animation: string | null
          id: string
          is_active: boolean | null
          music_autoplay: boolean | null
          music_url: string | null
          text_color: string | null
          theme: string | null
          total_clicks: number | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          background_color?: string | null
          background_image?: string | null
          background_overlay_color?: string | null
          background_overlay_opacity?: number | null
          bio?: string | null
          border_animation?: string | null
          border_color?: string | null
          border_radius?: number | null
          border_style?: string | null
          border_width?: number | null
          button_color?: string | null
          button_spacing?: number | null
          button_text_color?: string | null
          created_at?: string
          custom_css?: string | null
          custom_domain?: string | null
          display_name?: string | null
          gradient_color1?: string | null
          gradient_color2?: string | null
          hover_animation?: string | null
          id?: string
          is_active?: boolean | null
          music_autoplay?: boolean | null
          music_url?: string | null
          text_color?: string | null
          theme?: string | null
          total_clicks?: number | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          background_color?: string | null
          background_image?: string | null
          background_overlay_color?: string | null
          background_overlay_opacity?: number | null
          bio?: string | null
          border_animation?: string | null
          border_color?: string | null
          border_radius?: number | null
          border_style?: string | null
          border_width?: number | null
          button_color?: string | null
          button_spacing?: number | null
          button_text_color?: string | null
          created_at?: string
          custom_css?: string | null
          custom_domain?: string | null
          display_name?: string | null
          gradient_color1?: string | null
          gradient_color2?: string | null
          hover_animation?: string | null
          id?: string
          is_active?: boolean | null
          music_autoplay?: boolean | null
          music_url?: string | null
          text_color?: string | null
          theme?: string | null
          total_clicks?: number | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      members_area_access_requests: {
        Row: {
          access_code: string | null
          area_id: string
          email: string
          id: string
          notes: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          access_code?: string | null
          area_id: string
          email: string
          id?: string
          notes?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          access_code?: string | null
          area_id?: string
          email?: string
          id?: string
          notes?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_area_access_requests_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "members_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      members_area_enrollments: {
        Row: {
          access_request_id: string | null
          area_id: string
          created_at: string
          enrolled_at: string
          id: string
          purchased_products: Json | null
          status: string
          updated_at: string
          user_email: string
          user_name: string | null
        }
        Insert: {
          access_request_id?: string | null
          area_id: string
          created_at?: string
          enrolled_at?: string
          id?: string
          purchased_products?: Json | null
          status?: string
          updated_at?: string
          user_email: string
          user_name?: string | null
        }
        Update: {
          access_request_id?: string | null
          area_id?: string
          created_at?: string
          enrolled_at?: string
          id?: string
          purchased_products?: Json | null
          status?: string
          updated_at?: string
          user_email?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_area_enrollments_access_request_id_fkey"
            columns: ["access_request_id"]
            isOneToOne: false
            referencedRelation: "members_area_access_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_area_enrollments_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "members_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      members_area_module_contents: {
        Row: {
          content_data: string | null
          content_type: string
          created_at: string
          document_url: string | null
          duration: string | null
          id: string
          is_active: boolean
          module_id: string
          order_index: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content_data?: string | null
          content_type: string
          created_at?: string
          document_url?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean
          module_id: string
          order_index?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content_data?: string | null
          content_type?: string
          created_at?: string
          document_url?: string | null
          duration?: string | null
          id?: string
          is_active?: boolean
          module_id?: string
          order_index?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_area_module_contents_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "members_area_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      members_area_modules: {
        Row: {
          category: string | null
          content_data: string | null
          content_type: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_locked: boolean | null
          members_area_id: string
          order_index: number
          required_product_id: string | null
          thumbnail_url: string | null
          title: string
          unlock_after_days: number | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category?: string | null
          content_data?: string | null
          content_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_locked?: boolean | null
          members_area_id: string
          order_index?: number
          required_product_id?: string | null
          thumbnail_url?: string | null
          title: string
          unlock_after_days?: number | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string | null
          content_data?: string | null
          content_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_locked?: boolean | null
          members_area_id?: string
          order_index?: number
          required_product_id?: string | null
          thumbnail_url?: string | null
          title?: string
          unlock_after_days?: number | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_area_modules_members_area_id_fkey"
            columns: ["members_area_id"]
            isOneToOne: false
            referencedRelation: "members_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      members_area_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          module_id: string
          progress_percentage: number | null
          subscription_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          module_id: string
          progress_percentage?: number | null
          subscription_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          module_id?: string
          progress_percentage?: number | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_area_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "members_area_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_area_progress_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "members_area_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      members_area_subscriptions: {
        Row: {
          created_at: string | null
          enrolled_at: string | null
          expires_at: string | null
          id: string
          members_area_id: string
          payment_status: string | null
          product_id: string | null
          status: string
          updated_at: string | null
          user_email: string
          user_name: string | null
        }
        Insert: {
          created_at?: string | null
          enrolled_at?: string | null
          expires_at?: string | null
          id?: string
          members_area_id: string
          payment_status?: string | null
          product_id?: string | null
          status?: string
          updated_at?: string | null
          user_email: string
          user_name?: string | null
        }
        Update: {
          created_at?: string | null
          enrolled_at?: string | null
          expires_at?: string | null
          id?: string
          members_area_id?: string
          payment_status?: string | null
          product_id?: string | null
          status?: string
          updated_at?: string | null
          user_email?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_area_subscriptions_members_area_id_fkey"
            columns: ["members_area_id"]
            isOneToOne: false
            referencedRelation: "members_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      members_areas: {
        Row: {
          access_rules: Json | null
          area_type: string
          banner_url: string | null
          created_at: string | null
          custom_domain: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          primary_color: string | null
          products: Json | null
          require_approval: boolean | null
          requires_approval: boolean | null
          secondary_color: string | null
          settings: Json | null
          slug: string | null
          theme_mode: string | null
          updated_at: string | null
          user_id: string
          welcome_message: string | null
        }
        Insert: {
          access_rules?: Json | null
          area_type?: string
          banner_url?: string | null
          created_at?: string | null
          custom_domain?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          products?: Json | null
          require_approval?: boolean | null
          requires_approval?: boolean | null
          secondary_color?: string | null
          settings?: Json | null
          slug?: string | null
          theme_mode?: string | null
          updated_at?: string | null
          user_id: string
          welcome_message?: string | null
        }
        Update: {
          access_rules?: Json | null
          area_type?: string
          banner_url?: string | null
          created_at?: string | null
          custom_domain?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          products?: Json | null
          require_approval?: boolean | null
          requires_approval?: boolean | null
          secondary_color?: string | null
          settings?: Json | null
          slug?: string | null
          theme_mode?: string | null
          updated_at?: string | null
          user_id?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      members_certificates: {
        Row: {
          certificate_code: string
          created_at: string | null
          id: string
          issued_at: string | null
          members_area_id: string
          user_email: string
          user_name: string
        }
        Insert: {
          certificate_code: string
          created_at?: string | null
          id?: string
          issued_at?: string | null
          members_area_id: string
          user_email: string
          user_name: string
        }
        Update: {
          certificate_code?: string
          created_at?: string | null
          id?: string
          issued_at?: string | null
          members_area_id?: string
          user_email?: string
          user_name?: string
        }
        Relationships: []
      }
      members_client_documents: {
        Row: {
          created_at: string | null
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          members_area_id: string
          title: string
          uploaded_by: string
          user_email: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          members_area_id: string
          title: string
          uploaded_by: string
          user_email: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          members_area_id?: string
          title?: string
          uploaded_by?: string
          user_email?: string
        }
        Relationships: []
      }
      members_community_comments: {
        Row: {
          author_email: string
          author_name: string
          content: string
          created_at: string | null
          id: string
          post_id: string
        }
        Insert: {
          author_email: string
          author_name: string
          content: string
          created_at?: string | null
          id?: string
          post_id: string
        }
        Update: {
          author_email?: string
          author_name?: string
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "members_community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      members_community_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_email: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_email: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "members_community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      members_community_posts: {
        Row: {
          author_email: string
          author_name: string
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_pinned: boolean | null
          likes_count: number | null
          members_area_id: string
          updated_at: string | null
        }
        Insert: {
          author_email: string
          author_name: string
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          likes_count?: number | null
          members_area_id: string
          updated_at?: string | null
        }
        Update: {
          author_email?: string
          author_name?: string
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          likes_count?: number | null
          members_area_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      members_contents: {
        Row: {
          content_text: string | null
          content_type: string
          content_url: string | null
          created_at: string | null
          id: string
          is_free: boolean | null
          module_id: string
          order_index: number
          title: string
          updated_at: string | null
        }
        Insert: {
          content_text?: string | null
          content_type: string
          content_url?: string | null
          created_at?: string | null
          id?: string
          is_free?: boolean | null
          module_id: string
          order_index?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string | null
          id?: string
          is_free?: boolean | null
          module_id?: string
          order_index?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_contents_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "members_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      members_course_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          last_watched_at: string | null
          members_area_id: string
          module_id: string
          progress_percentage: number | null
          user_email: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_watched_at?: string | null
          members_area_id: string
          module_id: string
          progress_percentage?: number | null
          user_email: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_watched_at?: string | null
          members_area_id?: string
          module_id?: string
          progress_percentage?: number | null
          user_email?: string
        }
        Relationships: []
      }
      members_digital_downloads: {
        Row: {
          created_at: string | null
          download_count: number | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          last_downloaded_at: string | null
          members_area_id: string
          product_id: string
          user_email: string
          version: string | null
        }
        Insert: {
          created_at?: string | null
          download_count?: number | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          last_downloaded_at?: string | null
          members_area_id: string
          product_id: string
          user_email: string
          version?: string | null
        }
        Update: {
          created_at?: string | null
          download_count?: number | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          last_downloaded_at?: string | null
          members_area_id?: string
          product_id?: string
          user_email?: string
          version?: string | null
        }
        Relationships: []
      }
      members_modules: {
        Row: {
          area_id: string
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          order_index: number
          title: string
          updated_at: string | null
        }
        Insert: {
          area_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          area_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_modules_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "members_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      members_product_licenses: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          license_key: string
          members_area_id: string
          product_id: string
          user_email: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          license_key: string
          members_area_id: string
          product_id: string
          user_email: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          license_key?: string
          members_area_id?: string
          product_id?: string
          user_email?: string
        }
        Relationships: []
      }
      members_support_tickets: {
        Row: {
          created_at: string | null
          description: string
          id: string
          members_area_id: string
          priority: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_email: string
          user_name: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          members_area_id: string
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_email: string
          user_name: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          members_area_id?: string
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_email?: string
          user_name?: string
        }
        Relationships: []
      }
      members_ticket_messages: {
        Row: {
          created_at: string | null
          id: string
          is_staff: boolean | null
          message: string
          sender_email: string
          sender_name: string
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_staff?: boolean | null
          message: string
          sender_email: string
          sender_name: string
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_staff?: boolean | null
          message?: string
          sender_email?: string
          sender_name?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "members_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      mind_maps: {
        Row: {
          created_at: string
          description: string | null
          edges: Json
          id: string
          name: string
          nodes: Json
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          edges?: Json
          id?: string
          name: string
          nodes?: Json
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          edges?: Json
          id?: string
          name?: string
          nodes?: Json
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_integrations: {
        Row: {
          api_key: string | null
          api_secret: string | null
          config: Json | null
          created_at: string
          id: string
          is_active: boolean
          platform: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_key?: string | null
          api_secret?: string | null
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          platform: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_key?: string | null
          api_secret?: string | null
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          platform?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          id: string
          metadata: Json | null
          plan_id: string | null
          platform: string
          status: string
          subscription_id: string | null
          transaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string | null
          platform: string
          status?: string
          subscription_id?: string | null
          transaction_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          metadata?: Json | null
          plan_id?: string | null
          platform?: string
          status?: string
          subscription_id?: string | null
          transaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          created_at: string
          feature_id: string
          id: string
          plan_id: string
        }
        Insert: {
          created_at?: string
          feature_id: string
          id?: string
          plan_id: string
        }
        Update: {
          created_at?: string
          feature_id?: string
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          countdown_enabled: boolean | null
          countdown_ends_at: string | null
          created_at: string
          description: string | null
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean
          is_visible: boolean | null
          limited_offer_banner: string | null
          name: string
          order_index: number
          plan_type: Database["public"]["Enums"]["plan_type"]
          price: number
          updated_at: string
        }
        Insert: {
          countdown_enabled?: boolean | null
          countdown_ends_at?: string | null
          created_at?: string
          description?: string | null
          duration_days: number
          features?: Json | null
          id?: string
          is_active?: boolean
          is_visible?: boolean | null
          limited_offer_banner?: string | null
          name: string
          order_index?: number
          plan_type: Database["public"]["Enums"]["plan_type"]
          price: number
          updated_at?: string
        }
        Update: {
          countdown_enabled?: boolean | null
          countdown_ends_at?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          is_visible?: boolean | null
          limited_offer_banner?: string | null
          name?: string
          order_index?: number
          plan_type?: Database["public"]["Enums"]["plan_type"]
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      popups: {
        Row: {
          background_color: string | null
          background_image: string | null
          background_video: string | null
          button_color: string | null
          button_link: string | null
          button_text: string
          clicks: number
          content: string
          created_at: string
          delay_seconds: number | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          position: string
          scroll_percentage: number | null
          text_color: string | null
          title: string
          trigger_type: string
          updated_at: string
          user_id: string
          video_url: string | null
          views: number
        }
        Insert: {
          background_color?: string | null
          background_image?: string | null
          background_video?: string | null
          button_color?: string | null
          button_link?: string | null
          button_text: string
          clicks?: number
          content: string
          created_at?: string
          delay_seconds?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          position?: string
          scroll_percentage?: number | null
          text_color?: string | null
          title: string
          trigger_type: string
          updated_at?: string
          user_id: string
          video_url?: string | null
          views?: number
        }
        Update: {
          background_color?: string | null
          background_image?: string | null
          background_video?: string | null
          button_color?: string | null
          button_link?: string | null
          button_text?: string
          clicks?: number
          content?: string
          created_at?: string
          delay_seconds?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          position?: string
          scroll_percentage?: number | null
          text_color?: string | null
          title?: string
          trigger_type?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
          views?: number
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          images: string[] | null
          is_featured: boolean | null
          project_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_featured?: boolean | null
          project_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_featured?: boolean | null
          project_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          blocked: boolean
          created_at: string
          email: string
          email_verified: boolean
          full_name: string
          id: string
          is_banned: boolean | null
          password_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          blocked?: boolean
          created_at?: string
          email: string
          email_verified?: boolean
          full_name: string
          id?: string
          is_banned?: boolean | null
          password_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          blocked?: boolean
          created_at?: string
          email?: string
          email_verified?: boolean
          full_name?: string
          id?: string
          is_banned?: boolean | null
          password_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quick_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          is_completed: boolean
          reminder_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_completed?: boolean
          reminder_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          reminder_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          answers: Json
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
          quiz_id: string
          score: number
          whatsapp: string | null
        }
        Insert: {
          answers: Json
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          quiz_id: string
          score: number
          whatsapp?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          quiz_id?: string
          score?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          collect_data: boolean | null
          collect_email: boolean | null
          collect_name: boolean | null
          collect_phone: boolean | null
          collect_whatsapp: boolean | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          offer_button_link: string | null
          offer_button_text: string | null
          offer_description: string | null
          offer_title: string | null
          questions: Json
          redirect_url: string | null
          responses_count: number
          show_offer: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          collect_data?: boolean | null
          collect_email?: boolean | null
          collect_name?: boolean | null
          collect_phone?: boolean | null
          collect_whatsapp?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          offer_button_link?: string | null
          offer_button_text?: string | null
          offer_description?: string | null
          offer_title?: string | null
          questions?: Json
          redirect_url?: string | null
          responses_count?: number
          show_offer?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          collect_data?: boolean | null
          collect_email?: boolean | null
          collect_name?: boolean | null
          collect_phone?: boolean | null
          collect_whatsapp?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          offer_button_link?: string | null
          offer_button_text?: string | null
          offer_description?: string | null
          offer_title?: string | null
          questions?: Json
          redirect_url?: string | null
          responses_count?: number
          show_offer?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_calculations: {
        Row: {
          created_at: string
          expression: string
          id: string
          name: string
          result: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expression: string
          id?: string
          name: string
          result: string
          user_id: string
        }
        Update: {
          created_at?: string
          expression?: string
          id?: string
          name?: string
          result?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string | null
          description: string
          display_order: number | null
          icon: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          display_order?: number | null
          icon?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      short_links: {
        Row: {
          clicks: number
          created_at: string
          custom_name: string | null
          id: string
          is_active: boolean
          original_url: string
          short_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clicks?: number
          created_at?: string
          custom_name?: string | null
          id?: string
          is_active?: boolean
          original_url: string
          short_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clicks?: number
          created_at?: string
          custom_name?: string | null
          id?: string
          is_active?: boolean
          original_url?: string
          short_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      simple_members_areas: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          password: string
          primary_color: string | null
          secondary_color: string | null
          sections: Json | null
          slug: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          password: string
          primary_color?: string | null
          secondary_color?: string | null
          sections?: Json | null
          slug: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          password?: string
          primary_color?: string | null
          secondary_color?: string | null
          sections?: Json | null
          slug?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          plan_id: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          plan_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          plan_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      task_blocks: {
        Row: {
          client_id: string | null
          color: string
          created_at: string
          id: string
          name: string
          order_index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          color?: string
          created_at?: string
          id?: string
          name: string
          order_index?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          color?: string
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_blocks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      task_categories: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_categories_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          block_id: string | null
          category: string | null
          client_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          request_date: string | null
          status: string
          task_order: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          block_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          request_date?: string | null
          status?: string
          task_order?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          block_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          request_date?: string | null
          status?: string
          task_order?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "task_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string
          email: string
          id: string
          joined_date: string
          name: string
          phone: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department: string
          email: string
          id?: string
          joined_date?: string
          name: string
          phone?: string | null
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string
          email?: string
          id?: string
          joined_date?: string
          name?: string
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          agent_name: string | null
          attachments: Json | null
          created_at: string
          id: string
          is_admin: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          agent_name?: string | null
          attachments?: Json | null
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          agent_name?: string | null
          attachments?: Json | null
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ticket_notifications_ticket"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          category: string | null
          created_at: string
          description: string
          id: string
          priority: string
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      tracking_pixels: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          pixel_id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          pixel_id: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          pixel_id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tutorial_videos: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration: number | null
          id: string
          is_published: boolean
          order_index: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_published?: boolean
          order_index?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_published?: boolean
          order_index?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      user_2fa_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          user_id: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      user_2fa_settings: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          is_active: boolean
          is_verified: boolean
          updated_at: string
          user_id: string
          verification_code: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          updated_at?: string
          user_id: string
          verification_code?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          updated_at?: string
          user_id?: string
          verification_code?: string | null
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
      user_trusted_devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          device_name: string | null
          expires_at: string
          id: string
          last_used_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          device_name?: string | null
          expires_at: string
          id?: string
          last_used_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          device_name?: string | null
          expires_at?: string
          id?: string
          last_used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_verification_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          user_id: string
          verified: boolean
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      voucher_features: {
        Row: {
          created_at: string
          feature_id: string
          id: string
          voucher_id: string
        }
        Insert: {
          created_at?: string
          feature_id: string
          id?: string
          voucher_id: string
        }
        Update: {
          created_at?: string
          feature_id?: string
          id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_features_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_redemptions: {
        Row: {
          id: string
          redeemed_at: string
          user_id: string
          voucher_id: string
        }
        Insert: {
          id?: string
          redeemed_at?: string
          user_id: string
          voucher_id: string
        }
        Update: {
          id?: string
          redeemed_at?: string
          user_id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_redemptions_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          duration_days: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          plan_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          plan_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      websites: {
        Row: {
          created_at: string
          custom_domain: string | null
          description: string | null
          footer: Json | null
          header: Json | null
          id: string
          is_published: boolean
          products: Json | null
          sections: Json | null
          settings: Json | null
          site_type: string | null
          slug: string
          template: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          footer?: Json | null
          header?: Json | null
          id?: string
          is_published?: boolean
          products?: Json | null
          sections?: Json | null
          settings?: Json | null
          site_type?: string | null
          slug: string
          template?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          footer?: Json | null
          header?: Json | null
          id?: string
          is_published?: boolean
          products?: Json | null
          sections?: Json | null
          settings?: Json | null
          site_type?: string | null
          slug?: string
          template?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_connections: {
        Row: {
          connected_at: string | null
          created_at: string
          id: string
          is_connected: boolean
          name: string
          phone_number: string | null
          qr_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_at?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean
          name: string
          phone_number?: string | null
          qr_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_at?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean
          name?: string
          phone_number?: string | null
          qr_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_access_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      plan_type:
        | "free_trial"
        | "chatbot"
        | "ai_agent"
        | "free"
        | "monthly"
        | "annual"
        | "lifetime"
      subscription_status: "active" | "expired" | "cancelled"
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
      app_role: ["admin", "user"],
      plan_type: [
        "free_trial",
        "chatbot",
        "ai_agent",
        "free",
        "monthly",
        "annual",
        "lifetime",
      ],
      subscription_status: ["active", "expired", "cancelled"],
    },
  },
} as const
