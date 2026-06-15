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
          is_welcome_message: boolean
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
          is_welcome_message?: boolean
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
          is_welcome_message?: boolean
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
      agenda_events: {
        Row: {
          all_day: boolean | null
          color: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          reminder_minutes: number | null
          reminder_shown: boolean | null
          start_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          reminder_minutes?: number | null
          reminder_shown?: boolean | null
          start_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          reminder_minutes?: number | null
          reminder_shown?: boolean | null
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      agent_chat_flows: {
        Row: {
          agent_id: string
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_chat_flows_agent_id_fkey"
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
          business_id: string | null
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
          business_id?: string | null
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
          business_id?: string | null
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
          {
            foreignKeyName: "agent_customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_knowledge_base: {
        Row: {
          agent_id: string
          content: string
          content_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          content: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          content?: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_knowledge_base_agent_id_fkey"
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
          attendant_name: string | null
          attendant_status: string
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
          attendant_name?: string | null
          attendant_status?: string
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
          attendant_name?: string | null
          attendant_status?: string
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
      aprova_job_clients: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          name: string
          password_hash: string
          primary_color: string | null
          secondary_color: string | null
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          access_token?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name: string
          password_hash: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string
          password_hash?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      aprova_job_comments: {
        Row: {
          client_id: string | null
          content: string
          created_at: string | null
          id: string
          is_from_client: boolean | null
          job_id: string
        }
        Insert: {
          client_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_from_client?: boolean | null
          job_id: string
        }
        Update: {
          client_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_from_client?: boolean | null
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aprova_job_comments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "aprova_job_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aprova_job_comments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "aprova_job_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      aprova_job_jobs: {
        Row: {
          approved_at: string | null
          client_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          media_urls: Json | null
          rejection_notes: string | null
          revision_notes: string | null
          status: Database["public"]["Enums"]["job_approval_status"] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          client_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          media_urls?: Json | null
          rejection_notes?: string | null
          revision_notes?: string | null
          status?: Database["public"]["Enums"]["job_approval_status"] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          client_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          media_urls?: Json | null
          rejection_notes?: string | null
          revision_notes?: string | null
          status?: Database["public"]["Enums"]["job_approval_status"] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aprova_job_jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "aprova_job_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      aprova_job_notifications: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          job_id: string | null
          message: string
          title: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          job_id?: string | null
          message: string
          title: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          job_id?: string | null
          message?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aprova_job_notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "aprova_job_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aprova_job_notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "aprova_job_jobs"
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
          background_color: string | null
          created_at: string
          description: string | null
          destination_email: string | null
          destination_whatsapp: string | null
          field_background_color: string | null
          fields: Json
          id: string
          is_active: boolean
          is_blocked: boolean
          logo_url: string | null
          primary_color: string | null
          responses_count: number
          secondary_color: string | null
          section_background_color: string | null
          step_labels: Json | null
          text_color: string | null
          title: string
          updated_at: string
          use_steps: boolean | null
          user_id: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          description?: string | null
          destination_email?: string | null
          destination_whatsapp?: string | null
          field_background_color?: string | null
          fields?: Json
          id?: string
          is_active?: boolean
          is_blocked?: boolean
          logo_url?: string | null
          primary_color?: string | null
          responses_count?: number
          secondary_color?: string | null
          section_background_color?: string | null
          step_labels?: Json | null
          text_color?: string | null
          title: string
          updated_at?: string
          use_steps?: boolean | null
          user_id: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          description?: string | null
          destination_email?: string | null
          destination_whatsapp?: string | null
          field_background_color?: string | null
          fields?: Json
          id?: string
          is_active?: boolean
          is_blocked?: boolean
          logo_url?: string | null
          primary_color?: string | null
          responses_count?: number
          secondary_color?: string | null
          section_background_color?: string | null
          step_labels?: Json | null
          text_color?: string | null
          title?: string
          updated_at?: string
          use_steps?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      builder_pages: {
        Row: {
          created_at: string
          elements: Json
          id: string
          is_published: boolean
          name: string
          published_at: string | null
          settings: Json
          slug: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          created_at?: string
          elements?: Json
          id?: string
          is_published?: boolean
          name: string
          published_at?: string | null
          settings?: Json
          slug: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          created_at?: string
          elements?: Json
          id?: string
          is_published?: boolean
          name?: string
          published_at?: string | null
          settings?: Json
          slug?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: []
      }
      businesses: {
        Row: {
          address: string | null
          category: string | null
          city: string | null
          cnpj: string | null
          company_name: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          registration_category_id: string | null
          settings: Json | null
          state: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          registration_category_id?: string | null
          settings?: Json | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          registration_category_id?: string | null
          settings?: Json | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_registration_category_id_fkey"
            columns: ["registration_category_id"]
            isOneToOne: false
            referencedRelation: "registration_categories"
            referencedColumns: ["id"]
          },
        ]
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
      catalog_banners: {
        Row: {
          catalog_id: string
          created_at: string
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          order_index: number | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          catalog_id: string
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          order_index?: number | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          catalog_id?: string
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          order_index?: number | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_banners_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "catalogs"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_customers: {
        Row: {
          address: string | null
          catalog_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          orders_count: number | null
          phone: string | null
          total_spent: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          catalog_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          orders_count?: number | null
          phone?: string | null
          total_spent?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          catalog_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          orders_count?: number | null
          phone?: string | null
          total_spent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_customers_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "catalogs"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_orders: {
        Row: {
          catalog_id: string
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          items: Json
          notes: string | null
          order_number: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          catalog_id: string
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          catalog_id?: string
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_orders_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "catalogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "catalog_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogs: {
        Row: {
          background_color: string | null
          category_order: string[] | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          footer_code: string | null
          group_by_category: boolean | null
          head_code: string | null
          id: string
          is_active: boolean | null
          layout_style: string | null
          logo_url: string | null
          name: string
          primary_color: string | null
          selected_product_ids: string[] | null
          selected_service_ids: string[] | null
          show_all_items: boolean | null
          show_description: boolean | null
          show_prices: boolean | null
          show_stock: boolean | null
          slug: string
          store_closed_message: string | null
          store_open: boolean | null
          text_color: string | null
          updated_at: string | null
          user_id: string
          views_count: number | null
          whatsapp_number: string | null
        }
        Insert: {
          background_color?: string | null
          category_order?: string[] | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          footer_code?: string | null
          group_by_category?: boolean | null
          head_code?: string | null
          id?: string
          is_active?: boolean | null
          layout_style?: string | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          selected_product_ids?: string[] | null
          selected_service_ids?: string[] | null
          show_all_items?: boolean | null
          show_description?: boolean | null
          show_prices?: boolean | null
          show_stock?: boolean | null
          slug: string
          store_closed_message?: string | null
          store_open?: boolean | null
          text_color?: string | null
          updated_at?: string | null
          user_id: string
          views_count?: number | null
          whatsapp_number?: string | null
        }
        Update: {
          background_color?: string | null
          category_order?: string[] | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          footer_code?: string | null
          group_by_category?: boolean | null
          head_code?: string | null
          id?: string
          is_active?: boolean | null
          layout_style?: string | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          selected_product_ids?: string[] | null
          selected_service_ids?: string[] | null
          show_all_items?: boolean | null
          show_description?: boolean | null
          show_prices?: boolean | null
          show_stock?: boolean | null
          slug?: string
          store_closed_message?: string | null
          store_open?: boolean | null
          text_color?: string | null
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
          whatsapp_number?: string | null
        }
        Relationships: []
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
          business_id: string | null
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
          business_id?: string | null
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
          business_id?: string | null
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
            foreignKeyName: "chatbot_customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
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
      checkout_additional_items: {
        Row: {
          checkout_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          item_type: string
          name: string
          price: number
          product_id: string | null
          sort_order: number | null
        }
        Insert: {
          checkout_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          item_type?: string
          name: string
          price: number
          product_id?: string | null
          sort_order?: number | null
        }
        Update: {
          checkout_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          item_type?: string
          name?: string
          price?: number
          product_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_additional_items_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_orders: {
        Row: {
          additional_items: Json | null
          amount: number
          checkout_id: string
          created_at: string
          customer_cpf: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          metadata: Json | null
          payment_id: string | null
          payment_method: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_items?: Json | null
          amount: number
          checkout_id: string
          created_at?: string
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_items?: Json | null
          amount?: number
          checkout_id?: string
          created_at?: string
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          metadata?: Json | null
          payment_id?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_orders_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
        ]
      }
      checkouts: {
        Row: {
          background_color: string | null
          banner_url: string | null
          created_at: string
          custom_settings: Json | null
          description: string | null
          downsell_checkout_url: string | null
          downsell_description: string | null
          downsell_image_url: string | null
          downsell_price: number | null
          downsell_product_id: string | null
          downsell_title: string | null
          fake_feedbacks: Json | null
          footer_code: string | null
          footer_color: string | null
          footer_text: string | null
          head_code: string | null
          id: string
          integration_id: string | null
          integration_type: string | null
          is_active: boolean
          item_description: string | null
          item_image_url: string | null
          item_name: string
          logo_url: string | null
          mp_access_token: string | null
          mp_public_key: string | null
          name: string
          price: number
          primary_color: string | null
          product_type: string | null
          redirect_url: string | null
          show_fake_feedback: boolean | null
          show_order_details: boolean | null
          slug: string
          success_message: string | null
          text_color: string | null
          thank_you_button_text: string | null
          thank_you_button_url: string | null
          thank_you_download_url: string | null
          thank_you_image_url: string | null
          thank_you_message: string | null
          thank_you_title: string | null
          total_revenue: number | null
          total_sales: number | null
          updated_at: string
          upsell_checkout_url: string | null
          upsell_description: string | null
          upsell_image_url: string | null
          upsell_price: number | null
          upsell_product_id: string | null
          upsell_title: string | null
          user_id: string
        }
        Insert: {
          background_color?: string | null
          banner_url?: string | null
          created_at?: string
          custom_settings?: Json | null
          description?: string | null
          downsell_checkout_url?: string | null
          downsell_description?: string | null
          downsell_image_url?: string | null
          downsell_price?: number | null
          downsell_product_id?: string | null
          downsell_title?: string | null
          fake_feedbacks?: Json | null
          footer_code?: string | null
          footer_color?: string | null
          footer_text?: string | null
          head_code?: string | null
          id?: string
          integration_id?: string | null
          integration_type?: string | null
          is_active?: boolean
          item_description?: string | null
          item_image_url?: string | null
          item_name: string
          logo_url?: string | null
          mp_access_token?: string | null
          mp_public_key?: string | null
          name: string
          price?: number
          primary_color?: string | null
          product_type?: string | null
          redirect_url?: string | null
          show_fake_feedback?: boolean | null
          show_order_details?: boolean | null
          slug: string
          success_message?: string | null
          text_color?: string | null
          thank_you_button_text?: string | null
          thank_you_button_url?: string | null
          thank_you_download_url?: string | null
          thank_you_image_url?: string | null
          thank_you_message?: string | null
          thank_you_title?: string | null
          total_revenue?: number | null
          total_sales?: number | null
          updated_at?: string
          upsell_checkout_url?: string | null
          upsell_description?: string | null
          upsell_image_url?: string | null
          upsell_price?: number | null
          upsell_product_id?: string | null
          upsell_title?: string | null
          user_id: string
        }
        Update: {
          background_color?: string | null
          banner_url?: string | null
          created_at?: string
          custom_settings?: Json | null
          description?: string | null
          downsell_checkout_url?: string | null
          downsell_description?: string | null
          downsell_image_url?: string | null
          downsell_price?: number | null
          downsell_product_id?: string | null
          downsell_title?: string | null
          fake_feedbacks?: Json | null
          footer_code?: string | null
          footer_color?: string | null
          footer_text?: string | null
          head_code?: string | null
          id?: string
          integration_id?: string | null
          integration_type?: string | null
          is_active?: boolean
          item_description?: string | null
          item_image_url?: string | null
          item_name?: string
          logo_url?: string | null
          mp_access_token?: string | null
          mp_public_key?: string | null
          name?: string
          price?: number
          primary_color?: string | null
          product_type?: string | null
          redirect_url?: string | null
          show_fake_feedback?: boolean | null
          show_order_details?: boolean | null
          slug?: string
          success_message?: string | null
          text_color?: string | null
          thank_you_button_text?: string | null
          thank_you_button_url?: string | null
          thank_you_download_url?: string | null
          thank_you_image_url?: string | null
          thank_you_message?: string | null
          thank_you_title?: string | null
          total_revenue?: number | null
          total_sales?: number | null
          updated_at?: string
          upsell_checkout_url?: string | null
          upsell_description?: string | null
          upsell_image_url?: string | null
          upsell_price?: number | null
          upsell_product_id?: string | null
          upsell_title?: string | null
          user_id?: string
        }
        Relationships: []
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
      commercial_proposals: {
        Row: {
          accepted_at: string | null
          auto_carousel: boolean | null
          client_accepted_at: string | null
          client_accepted_name: string | null
          client_address: string | null
          client_cnpj: string | null
          client_company: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          client_signature_url: string | null
          company_address: string | null
          company_cnpj: string | null
          company_description: string | null
          company_email: string | null
          company_logo_url: string | null
          company_name: string | null
          company_phone: string | null
          conditions: string | null
          created_at: string
          id: string
          introduction: string | null
          introduction_image_url: string | null
          introduction_images: Json | null
          is_private: boolean | null
          pricing: Json | null
          primary_color: string | null
          private_token: string | null
          rejected_at: string | null
          rejection_reason: string | null
          sent_at: string | null
          services: Json | null
          services_images: Json | null
          slug: string | null
          status: string
          timeline: Json | null
          timeline_image_url: string | null
          title: string
          updated_at: string
          user_id: string
          valid_until: string | null
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          auto_carousel?: boolean | null
          client_accepted_at?: string | null
          client_accepted_name?: string | null
          client_address?: string | null
          client_cnpj?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          client_signature_url?: string | null
          company_address?: string | null
          company_cnpj?: string | null
          company_description?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          conditions?: string | null
          created_at?: string
          id?: string
          introduction?: string | null
          introduction_image_url?: string | null
          introduction_images?: Json | null
          is_private?: boolean | null
          pricing?: Json | null
          primary_color?: string | null
          private_token?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          services?: Json | null
          services_images?: Json | null
          slug?: string | null
          status?: string
          timeline?: Json | null
          timeline_image_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          auto_carousel?: boolean | null
          client_accepted_at?: string | null
          client_accepted_name?: string | null
          client_address?: string | null
          client_cnpj?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          client_signature_url?: string | null
          company_address?: string | null
          company_cnpj?: string | null
          company_description?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          conditions?: string | null
          created_at?: string
          id?: string
          introduction?: string | null
          introduction_image_url?: string | null
          introduction_images?: Json | null
          is_private?: boolean | null
          pricing?: Json | null
          primary_color?: string | null
          private_token?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          sent_at?: string | null
          services?: Json | null
          services_images?: Json | null
          slug?: string | null
          status?: string
          timeline?: Json | null
          timeline_image_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          valid_until?: string | null
          viewed_at?: string | null
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
          address: string | null
          avatar_url: string | null
          business_id: string | null
          company: string | null
          contact_person: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          last_contact_at: string | null
          market_area: string | null
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          registration_category_id: string | null
          source: string | null
          status: string
          tags: Json | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          business_id?: string | null
          company?: string | null
          contact_person?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          last_contact_at?: string | null
          market_area?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          registration_category_id?: string | null
          source?: string | null
          status?: string
          tags?: Json | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          business_id?: string | null
          company?: string | null
          contact_person?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          last_contact_at?: string | null
          market_area?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          registration_category_id?: string | null
          source?: string | null
          status?: string
          tags?: Json | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_registration_category_id_fkey"
            columns: ["registration_category_id"]
            isOneToOne: false
            referencedRelation: "registration_categories"
            referencedColumns: ["id"]
          },
        ]
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
      coupon_usages: {
        Row: {
          coupon_id: string
          discount_amount: number
          discounted_price: number
          id: string
          original_price: number
          plan_id: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          discount_amount: number
          discounted_price: number
          id?: string
          original_price: number
          plan_id?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          discount_amount?: number
          discounted_price?: number
          id?: string
          original_price?: number
          plan_id?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usages_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "discount_coupons"
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
      custom_financial_entries: {
        Row: {
          amount: number
          created_at: string
          description: string
          due_date: string
          entry_type: string
          id: string
          is_recurring: boolean | null
          notes: string | null
          payment_date: string | null
          record_id: string
          recurring_period: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          due_date: string
          entry_type: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_date?: string | null
          record_id: string
          recurring_period?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          due_date?: string
          entry_type?: string
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment_date?: string | null
          record_id?: string
          recurring_period?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_financial_entries_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "custom_financial_records"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_financial_field_values: {
        Row: {
          created_at: string
          field_id: string
          id: string
          record_id: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          field_id: string
          id?: string
          record_id: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          field_id?: string
          id?: string
          record_id?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_financial_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_financial_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_financial_field_values_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "custom_financial_records"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_financial_fields: {
        Row: {
          created_at: string
          field_type: string
          id: string
          is_required: boolean | null
          label: string
          options: Json | null
          order_index: number | null
          structure_id: string
        }
        Insert: {
          created_at?: string
          field_type: string
          id?: string
          is_required?: boolean | null
          label: string
          options?: Json | null
          order_index?: number | null
          structure_id: string
        }
        Update: {
          created_at?: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          label?: string
          options?: Json | null
          order_index?: number | null
          structure_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_financial_fields_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "custom_financial_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_financial_records: {
        Row: {
          created_at: string
          id: string
          name: string
          structure_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          structure_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          structure_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_financial_records_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "custom_financial_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_financial_structures: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
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
      customer_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_contracts: {
        Row: {
          contact_id: string | null
          contract_date: string
          created_at: string
          customer_id: string | null
          description: string | null
          file_name: string | null
          file_url: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          contract_date?: string
          created_at?: string
          customer_id?: string | null
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          contract_date?: string
          created_at?: string
          customer_id?: string | null
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_contracts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_payments_history: {
        Row: {
          amount: number
          contact_id: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          contact_id?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          contact_id?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_payments_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_payments_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_purchases_history: {
        Row: {
          contact_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          notes: string | null
          product_id: string | null
          product_name: string
          purchase_date: string
          quantity: number
          total_price: number | null
          unit_price: number | null
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name: string
          purchase_date?: string
          quantity?: number
          total_price?: number | null
          unit_price?: number | null
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          product_name?: string
          purchase_date?: string
          quantity?: number
          total_price?: number | null
          unit_price?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_purchases_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_purchases_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_purchases_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_services_history: {
        Row: {
          contact_id: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          notes: string | null
          price: number | null
          service_date: string
          service_id: string | null
          service_name: string
          status: string | null
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          price?: number | null
          service_date?: string
          service_id?: string | null
          service_name: string
          status?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          price?: number | null
          service_date?: string
          service_id?: string | null
          service_name?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_services_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_services_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_services_history_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "user_services"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          business_id: string | null
          category_id: string | null
          city: string | null
          company: string | null
          country: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          last_contact_at: string | null
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          postal_code: string | null
          registration_category_id: string | null
          state: string | null
          status: string
          tags: string[] | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          business_id?: string | null
          category_id?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          last_contact_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          postal_code?: string | null
          registration_category_id?: string | null
          state?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string | null
          category_id?: string | null
          city?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          last_contact_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          postal_code?: string | null
          registration_category_id?: string | null
          state?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "customer_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_registration_category_id_fkey"
            columns: ["registration_category_id"]
            isOneToOne: false
            referencedRelation: "registration_categories"
            referencedColumns: ["id"]
          },
        ]
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
      discount_coupons: {
        Row: {
          applicable_plans: string[] | null
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          max_uses_per_user: number | null
          min_purchase_amount: number | null
          updated_at: string
          uses_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_plans?: string[] | null
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_purchase_amount?: number | null
          updated_at?: string
          uses_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_plans?: string[] | null
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_purchase_amount?: number | null
          updated_at?: string
          uses_count?: number
          valid_from?: string | null
          valid_until?: string | null
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
      financial_bank_accounts: {
        Row: {
          account_number: string | null
          account_type: string
          agency: string | null
          bank_name: string
          business_id: string | null
          created_at: string
          current_balance: number
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          account_type: string
          agency?: string | null
          bank_name: string
          business_id?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          account_type?: string
          agency?: string | null
          bank_name?: string
          business_id?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_bank_accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "financial_businesses"
            referencedColumns: ["id"]
          },
        ]
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
      financial_cashbox: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          initial_balance: number
          month: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          initial_balance?: number
          month: string
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          initial_balance?: number
          month?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_cashbox_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "financial_businesses"
            referencedColumns: ["id"]
          },
        ]
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
      financial_debtor_payments: {
        Row: {
          amount: number
          created_at: string
          debtor_id: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          debtor_id: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          debtor_id?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_debtor_payments_debtor_id_fkey"
            columns: ["debtor_id"]
            isOneToOne: false
            referencedRelation: "financial_debtors"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_debtors: {
        Row: {
          amount: number
          business_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          business_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          business_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_debtors_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "financial_businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_reports: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          name: string
          period_end: string | null
          period_start: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          name: string
          period_end?: string | null
          period_start?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          name?: string
          period_end?: string | null
          period_start?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          bank_account_id: string | null
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
          bank_account_id?: string | null
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
          bank_account_id?: string | null
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
            foreignKeyName: "financial_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "financial_bank_accounts"
            referencedColumns: ["id"]
          },
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
          button_style: string | null
          created_at: string
          dialog_subtitle: string | null
          dialog_title: string | null
          generated_code: string | null
          id: string
          main_button_color: string
          main_button_icon: string
          main_button_text: string
          name: string
          position: string
          secondary_color: string | null
          sub_buttons: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          button_style?: string | null
          created_at?: string
          dialog_subtitle?: string | null
          dialog_title?: string | null
          generated_code?: string | null
          id?: string
          main_button_color?: string
          main_button_icon?: string
          main_button_text?: string
          name: string
          position?: string
          secondary_color?: string | null
          sub_buttons?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          button_style?: string | null
          created_at?: string
          dialog_subtitle?: string | null
          dialog_title?: string | null
          generated_code?: string | null
          id?: string
          main_button_color?: string
          main_button_icon?: string
          main_button_text?: string
          name?: string
          position?: string
          secondary_color?: string | null
          sub_buttons?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      funnel_lead_history: {
        Row: {
          created_at: string
          from_stage_id: string | null
          id: string
          lead_id: string
          notes: string | null
          to_stage_id: string
        }
        Insert: {
          created_at?: string
          from_stage_id?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          to_stage_id: string
        }
        Update: {
          created_at?: string
          from_stage_id?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          to_stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_lead_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_lead_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "funnel_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_lead_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_leads: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          expected_close_date: string | null
          funnel_id: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          priority: string | null
          stage_id: string
          tags: string[] | null
          updated_at: string
          value: number | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          expected_close_date?: string | null
          funnel_id: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          priority?: string | null
          stage_id: string
          tags?: string[] | null
          updated_at?: string
          value?: number | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          expected_close_date?: string | null
          funnel_id?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          priority?: string | null
          stage_id?: string
          tags?: string[] | null
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_leads_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "sales_funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_stages: {
        Row: {
          color: string | null
          created_at: string
          funnel_id: string
          id: string
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          funnel_id: string
          id?: string
          name: string
          order_index?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          funnel_id?: string
          id?: string
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_stages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "sales_funnels"
            referencedColumns: ["id"]
          },
        ]
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
      invoice_recurring_plans: {
        Row: {
          amount: number
          auto_send_email: boolean | null
          business_id: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          is_active: boolean
          next_invoice_date: string
          payment_method: string | null
          pix_key: string | null
          pix_key_type: string | null
          plan_name: string
          recipient_email: string | null
          recurrence_type: string
          reminder_days_before: number | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          auto_send_email?: boolean | null
          business_id?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          next_invoice_date?: string
          payment_method?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          plan_name: string
          recipient_email?: string | null
          recurrence_type?: string
          reminder_days_before?: number | null
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          auto_send_email?: boolean | null
          business_id?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          next_invoice_date?: string
          payment_method?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          plan_name?: string
          recipient_email?: string | null
          recurrence_type?: string
          reminder_days_before?: number | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_recurring_plans_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_recurring_plans_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          business_id: string | null
          client_address: string | null
          client_document: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          company_address: string | null
          company_document: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string
          customer_id: string | null
          discount_amount: number
          due_date: string
          id: string
          invoice_number: string
          invoice_title: string
          items: Json
          last_reminder_sent_at: string | null
          logo_url: string | null
          mercadopago_checkout_url: string | null
          mercadopago_payment_id: string | null
          mercadopago_preference_id: string | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          pix_key: string | null
          pix_key_type: string | null
          primary_color: string | null
          public_token: string
          recurring_plan_id: string | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          status: string
          subtotal: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          client_address?: string | null
          client_document?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_address?: string | null
          company_document?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          due_date?: string
          id?: string
          invoice_number: string
          invoice_title?: string
          items?: Json
          last_reminder_sent_at?: string | null
          logo_url?: string | null
          mercadopago_checkout_url?: string | null
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          primary_color?: string | null
          public_token?: string
          recurring_plan_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          client_address?: string | null
          client_document?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_address?: string | null
          company_document?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          due_date?: string
          id?: string
          invoice_number?: string
          invoice_title?: string
          items?: Json
          last_reminder_sent_at?: string | null
          logo_url?: string | null
          mercadopago_checkout_url?: string | null
          mercadopago_payment_id?: string | null
          mercadopago_preference_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          primary_color?: string | null
          public_token?: string
          recurring_plan_id?: string | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_recurring_plan_id_fkey"
            columns: ["recurring_plan_id"]
            isOneToOne: false
            referencedRelation: "invoice_recurring_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_category_assignments: {
        Row: {
          category_id: string
          created_at: string
          id: string
          lead_id: string
          lead_source: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          lead_id: string
          lead_source: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          lead_source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_category_assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "lead_categories"
            referencedColumns: ["id"]
          },
        ]
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
          social_links: Json | null
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
          social_links?: Json | null
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
          social_links?: Json | null
          text_color?: string | null
          theme?: string | null
          total_clicks?: number | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      manual_dispatcher_lists: {
        Row: {
          created_at: string
          id: string
          leads: Json
          message: string | null
          name: string
          sent_count: number
          total_leads: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          leads?: Json
          message?: string | null
          name: string
          sent_count?: number
          total_leads?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          leads?: Json
          message?: string | null
          name?: string
          sent_count?: number
          total_leads?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      manual_dispatcher_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      members_area_access_codes: {
        Row: {
          access_code: string
          checkout_order_id: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          members_area_id: string
          user_id: string
        }
        Insert: {
          access_code: string
          checkout_order_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          members_area_id: string
          user_id: string
        }
        Update: {
          access_code?: string
          checkout_order_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          members_area_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_area_access_codes_checkout_order_id_fkey"
            columns: ["checkout_order_id"]
            isOneToOne: false
            referencedRelation: "checkout_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_area_access_codes_members_area_id_fkey"
            columns: ["members_area_id"]
            isOneToOne: false
            referencedRelation: "simple_members_areas"
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
      organization_table_cells: {
        Row: {
          column_id: string
          created_at: string
          id: string
          is_bold: boolean | null
          row_id: string
          text_color: string | null
          updated_at: string
          value: string | null
        }
        Insert: {
          column_id: string
          created_at?: string
          id?: string
          is_bold?: boolean | null
          row_id: string
          text_color?: string | null
          updated_at?: string
          value?: string | null
        }
        Update: {
          column_id?: string
          created_at?: string
          id?: string
          is_bold?: boolean | null
          row_id?: string
          text_color?: string | null
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_table_cells_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "organization_table_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_table_cells_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "organization_table_rows"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_table_columns: {
        Row: {
          created_at: string
          header_text_color: string | null
          id: string
          name: string
          options: Json | null
          order_index: number
          table_id: string
          type: string
        }
        Insert: {
          created_at?: string
          header_text_color?: string | null
          id?: string
          name: string
          options?: Json | null
          order_index?: number
          table_id: string
          type?: string
        }
        Update: {
          created_at?: string
          header_text_color?: string | null
          id?: string
          name?: string
          options?: Json | null
          order_index?: number
          table_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_table_columns_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "organization_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_table_rows: {
        Row: {
          border_color: string | null
          created_at: string
          id: string
          is_bold: boolean | null
          order_index: number | null
          row_background_color: string | null
          row_text_color: string | null
          table_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          border_color?: string | null
          created_at?: string
          id?: string
          is_bold?: boolean | null
          order_index?: number | null
          row_background_color?: string | null
          row_text_color?: string | null
          table_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          border_color?: string | null
          created_at?: string
          id?: string
          is_bold?: boolean | null
          order_index?: number | null
          row_background_color?: string | null
          row_text_color?: string | null
          table_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_table_rows_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "organization_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_tables: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
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
          client_name: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          images: string[] | null
          is_featured: boolean | null
          is_scrollable_screenshot: boolean | null
          portfolio_id: string | null
          project_url: string | null
          scroll_image_url: string | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          category: string
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_featured?: boolean | null
          is_scrollable_screenshot?: boolean | null
          portfolio_id?: string | null
          project_url?: string | null
          scroll_image_url?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string
          client_name?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_featured?: boolean | null
          is_scrollable_screenshot?: boolean | null
          portfolio_id?: string | null
          project_url?: string | null
          scroll_image_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          background_color: string | null
          button_bg_color: string | null
          button_text_color: string | null
          button1_bg_color: string | null
          button1_enabled: boolean | null
          button1_label: string | null
          button1_shadow: boolean | null
          button1_text_color: string | null
          button1_url: string | null
          button2_bg_color: string | null
          button2_enabled: boolean | null
          button2_label: string | null
          button2_shadow: boolean | null
          button2_text_color: string | null
          button2_url: string | null
          card_background_color: string | null
          card_text_color: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          description_color: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          logo_url: string | null
          name: string
          niche: string
          overlay_color: string | null
          overlay_opacity: number | null
          primary_color: string | null
          secondary_color: string | null
          slug: string | null
          title_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          background_color?: string | null
          button_bg_color?: string | null
          button_text_color?: string | null
          button1_bg_color?: string | null
          button1_enabled?: boolean | null
          button1_label?: string | null
          button1_shadow?: boolean | null
          button1_text_color?: string | null
          button1_url?: string | null
          button2_bg_color?: string | null
          button2_enabled?: boolean | null
          button2_label?: string | null
          button2_shadow?: boolean | null
          button2_text_color?: string | null
          button2_url?: string | null
          card_background_color?: string | null
          card_text_color?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          description_color?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          logo_url?: string | null
          name: string
          niche?: string
          overlay_color?: string | null
          overlay_opacity?: number | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string | null
          title_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          background_color?: string | null
          button_bg_color?: string | null
          button_text_color?: string | null
          button1_bg_color?: string | null
          button1_enabled?: boolean | null
          button1_label?: string | null
          button1_shadow?: boolean | null
          button1_text_color?: string | null
          button1_url?: string | null
          button2_bg_color?: string | null
          button2_enabled?: boolean | null
          button2_label?: string | null
          button2_shadow?: boolean | null
          button2_text_color?: string | null
          button2_url?: string | null
          card_background_color?: string | null
          card_text_color?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          description_color?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          logo_url?: string | null
          name?: string
          niche?: string
          overlay_color?: string | null
          overlay_opacity?: number | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string | null
          title_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          access_duration_days: number | null
          affiliate_url: string | null
          barcode: string | null
          business_id: string | null
          category: string | null
          category_id: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          description_html: string | null
          dimensions_cm: Json | null
          download_limit: number | null
          download_url: string | null
          gallery_urls: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          metadata: Json | null
          min_stock_alert: number | null
          name: string
          price: number
          product_type: string
          sku: string | null
          stock_quantity: number | null
          tags: string[] | null
          unit: string | null
          updated_at: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          access_duration_days?: number | null
          affiliate_url?: string | null
          barcode?: string | null
          business_id?: string | null
          category?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          description_html?: string | null
          dimensions_cm?: Json | null
          download_limit?: number | null
          download_url?: string | null
          gallery_urls?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          min_stock_alert?: number | null
          name: string
          price?: number
          product_type?: string
          sku?: string | null
          stock_quantity?: number | null
          tags?: string[] | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          access_duration_days?: number | null
          affiliate_url?: string | null
          barcode?: string | null
          business_id?: string | null
          category?: string | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          description_html?: string | null
          dimensions_cm?: Json | null
          download_limit?: number | null
          download_url?: string | null
          gallery_urls?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          metadata?: Json | null
          min_stock_alert?: number | null
          name?: string
          price?: number
          product_type?: string
          sku?: string | null
          stock_quantity?: number | null
          tags?: string[] | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
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
          phone: string | null
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
          phone?: string | null
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
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
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
          primary_color: string | null
          questions: Json
          redirect_url: string | null
          responses_count: number
          secondary_color: string | null
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
          primary_color?: string | null
          questions?: Json
          redirect_url?: string | null
          responses_count?: number
          secondary_color?: string | null
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
          primary_color?: string | null
          questions?: Json
          redirect_url?: string | null
          responses_count?: number
          secondary_color?: string | null
          show_offer?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receipt_templates: {
        Row: {
          business_id: string | null
          company_address: string | null
          company_document: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string
          id: string
          issuer_signer_name: string | null
          logo_url: string | null
          name: string
          notes_template: string | null
          primary_color: string | null
          receipt_title: string | null
          terms_text: string | null
          updated_at: string
          user_id: string
          warranty_text: string | null
        }
        Insert: {
          business_id?: string | null
          company_address?: string | null
          company_document?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          id?: string
          issuer_signer_name?: string | null
          logo_url?: string | null
          name: string
          notes_template?: string | null
          primary_color?: string | null
          receipt_title?: string | null
          terms_text?: string | null
          updated_at?: string
          user_id: string
          warranty_text?: string | null
        }
        Update: {
          business_id?: string | null
          company_address?: string | null
          company_document?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          id?: string
          issuer_signer_name?: string | null
          logo_url?: string | null
          name?: string
          notes_template?: string | null
          primary_color?: string | null
          receipt_title?: string | null
          terms_text?: string | null
          updated_at?: string
          user_id?: string
          warranty_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          logo_url: string | null
          name: string
          system_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          logo_url?: string | null
          name: string
          system_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          system_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routine_completions: {
        Row: {
          completed_at: string
          completion_date: string
          id: string
          objective_id: string | null
          routine_item_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          completion_date: string
          id?: string
          objective_id?: string | null
          routine_item_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          completion_date?: string
          id?: string
          objective_id?: string | null
          routine_item_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_completions_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "routine_objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_completions_routine_item_id_fkey"
            columns: ["routine_item_id"]
            isOneToOne: false
            referencedRelation: "routine_items"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_items: {
        Row: {
          color: string | null
          completed_at: string | null
          created_at: string
          day_of_week: number
          description: string | null
          end_time: string | null
          id: string
          is_completed: boolean | null
          is_recurring: boolean | null
          order_index: number | null
          reminder_minutes: number | null
          routine_id: string | null
          start_time: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          completed_at?: string | null
          created_at?: string
          day_of_week: number
          description?: string | null
          end_time?: string | null
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          order_index?: number | null
          reminder_minutes?: number | null
          routine_id?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          completed_at?: string | null
          created_at?: string
          day_of_week?: number
          description?: string | null
          end_time?: string | null
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          order_index?: number | null
          reminder_minutes?: number | null
          routine_id?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_items_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_objectives: {
        Row: {
          color: string | null
          completed_at: string | null
          created_at: string
          current_value: number | null
          day_of_week: number | null
          description: string | null
          id: string
          is_completed: boolean | null
          objective_type: string
          routine_id: string | null
          target_value: number | null
          title: string
          updated_at: string
          user_id: string
          week_start: string | null
        }
        Insert: {
          color?: string | null
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          day_of_week?: number | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          objective_type?: string
          routine_id?: string | null
          target_value?: number | null
          title: string
          updated_at?: string
          user_id: string
          week_start?: string | null
        }
        Update: {
          color?: string | null
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          day_of_week?: number | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          objective_type?: string
          routine_id?: string | null
          target_value?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          week_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_objectives_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_templates: {
        Row: {
          created_at: string
          id: string
          items: Json
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routines: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_funnels: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
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
      saved_qr_codes: {
        Row: {
          bg_color: string | null
          border_color: string | null
          border_width: number | null
          business_name: string | null
          content: string
          corner_radius: number | null
          created_at: string
          fg_color: string | null
          id: string
          logo_size: number | null
          logo_url: string | null
          name: string
          padding: number | null
          show_border: boolean | null
          show_logo: boolean | null
          show_social_media: boolean | null
          size: number | null
          social_media: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bg_color?: string | null
          border_color?: string | null
          border_width?: number | null
          business_name?: string | null
          content: string
          corner_radius?: number | null
          created_at?: string
          fg_color?: string | null
          id?: string
          logo_size?: number | null
          logo_url?: string | null
          name: string
          padding?: number | null
          show_border?: boolean | null
          show_logo?: boolean | null
          show_social_media?: boolean | null
          size?: number | null
          social_media?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bg_color?: string | null
          border_color?: string | null
          border_width?: number | null
          business_name?: string | null
          content?: string
          corner_radius?: number | null
          created_at?: string
          fg_color?: string | null
          id?: string
          logo_size?: number | null
          logo_url?: string | null
          name?: string
          padding?: number | null
          show_border?: boolean | null
          show_logo?: boolean | null
          show_social_media?: boolean | null
          size?: number | null
          social_media?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_receipts: {
        Row: {
          client_name: string | null
          created_at: string
          id: string
          receipt_data: Json
          receipt_number: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          id?: string
          receipt_data: Json
          receipt_number: string
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          id?: string
          receipt_data?: Json
          receipt_number?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_scripts: {
        Row: {
          business_id: string | null
          category_id: string | null
          content: string
          created_at: string | null
          id: string
          is_favorite: boolean | null
          sort_order: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          use_count: number | null
          user_id: string
        }
        Insert: {
          business_id?: string | null
          category_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          sort_order?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          use_count?: number | null
          user_id: string
        }
        Update: {
          business_id?: string | null
          category_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          sort_order?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          use_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_scripts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_scripts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "script_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      script_categories: {
        Row: {
          business_id: string | null
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id?: string | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string | null
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "script_categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_history: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          new_status: Database["public"]["Enums"]["service_order_status"]
          notes: string | null
          order_id: string
          previous_status:
            | Database["public"]["Enums"]["service_order_status"]
            | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["service_order_status"]
          notes?: string | null
          order_id: string
          previous_status?:
            | Database["public"]["Enums"]["service_order_status"]
            | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["service_order_status"]
          notes?: string | null
          order_id?: string
          previous_status?:
            | Database["public"]["Enums"]["service_order_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "service_order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_requests: {
        Row: {
          additional_notes: string | null
          client_document: string | null
          client_email: string | null
          client_name: string
          client_phone: string
          client_user_id: string | null
          created_at: string
          equipment_brand: string
          equipment_model: string
          equipment_serial: string | null
          equipment_type: string
          id: string
          reported_defect: string
          status: string
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          client_document?: string | null
          client_email?: string | null
          client_name: string
          client_phone: string
          client_user_id?: string | null
          created_at?: string
          equipment_brand: string
          equipment_model: string
          equipment_serial?: string | null
          equipment_type: string
          id?: string
          reported_defect: string
          status?: string
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          client_document?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string
          client_user_id?: string | null
          created_at?: string
          equipment_brand?: string
          equipment_model?: string
          equipment_serial?: string | null
          equipment_type?: string
          id?: string
          reported_defect?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          client_document: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          client_user_id: string | null
          completed_at: string | null
          created_at: string
          delivered_at: string | null
          equipment_accessories: string | null
          equipment_brand: string
          equipment_color: string | null
          equipment_model: string
          equipment_photos: string[] | null
          equipment_serial: string | null
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          estimated_completion: string | null
          id: string
          internal_notes: string | null
          labor_cost: number | null
          order_number: string
          parts_cost: number | null
          parts_used: string | null
          priority: string | null
          received_at: string
          reported_defect: string
          service_description: string | null
          status: Database["public"]["Enums"]["service_order_status"]
          technical_diagnosis: string | null
          total_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_document?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          client_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          equipment_accessories?: string | null
          equipment_brand: string
          equipment_color?: string | null
          equipment_model: string
          equipment_photos?: string[] | null
          equipment_serial?: string | null
          equipment_type?: Database["public"]["Enums"]["equipment_type"]
          estimated_completion?: string | null
          id?: string
          internal_notes?: string | null
          labor_cost?: number | null
          order_number: string
          parts_cost?: number | null
          parts_used?: string | null
          priority?: string | null
          received_at?: string
          reported_defect: string
          service_description?: string | null
          status?: Database["public"]["Enums"]["service_order_status"]
          technical_diagnosis?: string | null
          total_cost?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_document?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          client_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          equipment_accessories?: string | null
          equipment_brand?: string
          equipment_color?: string | null
          equipment_model?: string
          equipment_photos?: string[] | null
          equipment_serial?: string | null
          equipment_type?: Database["public"]["Enums"]["equipment_type"]
          estimated_completion?: string | null
          id?: string
          internal_notes?: string | null
          labor_cost?: number | null
          order_number?: string
          parts_cost?: number | null
          parts_used?: string | null
          priority?: string | null
          received_at?: string
          reported_defect?: string
          service_description?: string | null
          status?: Database["public"]["Enums"]["service_order_status"]
          technical_diagnosis?: string | null
          total_cost?: number | null
          updated_at?: string
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
          accent_color: string | null
          access_type: string
          area_type: string
          background_color: string | null
          business_id: string | null
          card_background_color: string | null
          card_text_color: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          description: string | null
          header_background_color: string | null
          id: string
          is_active: boolean | null
          login_background_color: string | null
          login_text_color: string | null
          logo_url: string | null
          name: string
          password: string
          primary_color: string | null
          secondary_color: string | null
          sections: Json | null
          slug: string
          text_color: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          access_type?: string
          area_type?: string
          background_color?: string | null
          business_id?: string | null
          card_background_color?: string | null
          card_text_color?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          description?: string | null
          header_background_color?: string | null
          id?: string
          is_active?: boolean | null
          login_background_color?: string | null
          login_text_color?: string | null
          logo_url?: string | null
          name: string
          password: string
          primary_color?: string | null
          secondary_color?: string | null
          sections?: Json | null
          slug: string
          text_color?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accent_color?: string | null
          access_type?: string
          area_type?: string
          background_color?: string | null
          business_id?: string | null
          card_background_color?: string | null
          card_text_color?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          description?: string | null
          header_background_color?: string | null
          id?: string
          is_active?: boolean | null
          login_background_color?: string | null
          login_text_color?: string | null
          logo_url?: string | null
          name?: string
          password?: string
          primary_color?: string | null
          secondary_color?: string | null
          sections?: Json | null
          slug?: string
          text_color?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simple_members_areas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simple_members_areas_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
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
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          new_quantity: number
          notes: string | null
          previous_quantity: number
          product_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          total_cost: number | null
          unit_cost: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          new_quantity: number
          notes?: string | null
          previous_quantity: number
          product_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          total_cost?: number | null
          unit_cost?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          payment_id: string | null
          payment_method: string | null
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
          payment_id?: string | null
          payment_method?: string | null
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
          payment_id?: string | null
          payment_method?: string | null
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
      supplier_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          invoice_number: string | null
          notes: string | null
          payment_status: string
          supplier_id: string
          transaction_date: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_status?: string
          supplier_id: string
          transaction_date?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_status?: string
          supplier_id?: string
          transaction_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          bank_info: string | null
          category: string | null
          city: string | null
          cnpj_cpf: string | null
          company_name: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          state: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          bank_info?: string | null
          category?: string | null
          city?: string | null
          cnpj_cpf?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          bank_info?: string | null
          category?: string | null
          city?: string | null
          cnpj_cpf?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      task_blocks: {
        Row: {
          business_id: string | null
          client_id: string | null
          color: string
          created_at: string
          id: string
          logo_url: string | null
          name: string
          order_index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          client_id?: string | null
          color?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          order_index?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          client_id?: string | null
          color?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          order_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_blocks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_blocks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      task_business_links: {
        Row: {
          business_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_business_links_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
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
      task_client_links: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_client_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived: boolean
          archived_at: string | null
          block_id: string | null
          business_id: string | null
          category: string | null
          checklist: Json
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
          archived?: boolean
          archived_at?: string | null
          block_id?: string | null
          business_id?: string | null
          category?: string | null
          checklist?: Json
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
          archived?: boolean
          archived_at?: string | null
          block_id?: string | null
          business_id?: string | null
          category?: string | null
          checklist?: Json
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
            foreignKeyName: "tasks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by_user_id: string | null
          admin_user_id: string
          created_at: string
          expires_at: string
          id: string
          invitation_token: string
          invited_email: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          admin_user_id: string
          created_at?: string
          expires_at: string
          id?: string
          invitation_token: string
          invited_email: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          admin_user_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_email?: string
          status?: string
        }
        Relationships: []
      }
      team_member_permissions: {
        Row: {
          action: Database["public"]["Enums"]["permission_action"]
          created_at: string
          id: string
          is_allowed: boolean
          module_key: string
          restrictions: Json | null
          team_member_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["permission_action"]
          created_at?: string
          id?: string
          is_allowed?: boolean
          module_key: string
          restrictions?: Json | null
          team_member_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["permission_action"]
          created_at?: string
          id?: string
          is_allowed?: boolean
          module_key?: string
          restrictions?: Json | null
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_permissions_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          revoked_at: string | null
          team_member_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          revoked_at?: string | null
          team_member_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
          team_member_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_sessions_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
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
          invitation_id: string | null
          joined_date: string
          linked_user_id: string | null
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          registration_category_id: string | null
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
          invitation_id?: string | null
          joined_date?: string
          linked_user_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          registration_category_id?: string | null
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
          invitation_id?: string | null
          joined_date?: string
          linked_user_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          registration_category_id?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_registration_category_id_fkey"
            columns: ["registration_category_id"]
            isOneToOne: false
            referencedRelation: "registration_categories"
            referencedColumns: ["id"]
          },
        ]
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
          feature_key: string | null
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
          feature_key?: string | null
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
          feature_key?: string | null
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
      user_services: {
        Row: {
          business_id: string | null
          category: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          description_html: string | null
          duration_minutes: number | null
          gallery_urls: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          max_capacity: number | null
          metadata: Json | null
          name: string
          price: number
          price_type: string | null
          requires_scheduling: boolean | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          description_html?: string | null
          duration_minutes?: number | null
          gallery_urls?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_capacity?: number | null
          metadata?: Json | null
          name: string
          price?: number
          price_type?: string | null
          requires_scheduling?: boolean | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          description_html?: string | null
          duration_minutes?: number | null
          gallery_urls?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_capacity?: number | null
          metadata?: Json | null
          name?: string
          price?: number
          price_type?: string | null
          requires_scheduling?: boolean | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
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
          is_expired_trial: boolean | null
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
          is_expired_trial?: boolean | null
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
          is_expired_trial?: boolean | null
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
      whatsapp_instances: {
        Row: {
          agent_id: string | null
          created_at: string | null
          id: string
          instance_key: string | null
          instance_name: string
          phone_number: string | null
          qr_code: string | null
          qr_code_expires_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          id?: string
          instance_key?: string | null
          instance_name: string
          phone_number?: string | null
          qr_code?: string | null
          qr_code_expires_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          id?: string
          instance_key?: string | null
          instance_name?: string
          phone_number?: string | null
          qr_code?: string | null
          qr_code_expires_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          ai_response: string | null
          content: string | null
          conversation_id: string | null
          created_at: string | null
          direction: string | null
          from_number: string
          id: string
          instance_id: string
          media_analysis: string | null
          media_transcription: string | null
          media_url: string | null
          message_type: string | null
          status: string | null
          to_number: string | null
          transferred_to_human: boolean | null
          whatsapp_message_id: string | null
        }
        Insert: {
          ai_response?: string | null
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          direction?: string | null
          from_number: string
          id?: string
          instance_id: string
          media_analysis?: string | null
          media_transcription?: string | null
          media_url?: string | null
          message_type?: string | null
          status?: string | null
          to_number?: string | null
          transferred_to_human?: boolean | null
          whatsapp_message_id?: string | null
        }
        Update: {
          ai_response?: string | null
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          direction?: string | null
          from_number?: string
          id?: string
          instance_id?: string
          media_analysis?: string | null
          media_transcription?: string | null
          media_url?: string | null
          message_type?: string | null
          status?: string | null
          to_number?: string | null
          transferred_to_human?: boolean | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "agent_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_access_code: { Args: never; Returns: string }
      generate_checkout_access_code: { Args: never; Returns: string }
      get_team_member_restrictions: {
        Args: { _module_key: string; _team_member_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      team_member_can: {
        Args: {
          p_admin_user_id: string
          p_module_key: string
          p_required_action: Database["public"]["Enums"]["permission_action"]
          p_resource_id: string
        }
        Returns: boolean
      }
      team_member_has_permission: {
        Args: {
          _action: Database["public"]["Enums"]["permission_action"]
          _module_key: string
          _team_member_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      equipment_type:
        | "computador"
        | "notebook"
        | "smartphone"
        | "tablet"
        | "impressora"
        | "outro"
      job_approval_status: "pending" | "approved" | "revision" | "rejected"
      permission_action: "create" | "read" | "update" | "delete"
      plan_type:
        | "free_trial"
        | "chatbot"
        | "ai_agent"
        | "free"
        | "monthly"
        | "annual"
        | "lifetime"
      service_order_status:
        | "recebido"
        | "em_analise"
        | "aguardando_aprovacao"
        | "em_manutencao"
        | "aguardando_peca"
        | "concluido"
        | "entregue"
        | "cancelado"
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
      equipment_type: [
        "computador",
        "notebook",
        "smartphone",
        "tablet",
        "impressora",
        "outro",
      ],
      job_approval_status: ["pending", "approved", "revision", "rejected"],
      permission_action: ["create", "read", "update", "delete"],
      plan_type: [
        "free_trial",
        "chatbot",
        "ai_agent",
        "free",
        "monthly",
        "annual",
        "lifetime",
      ],
      service_order_status: [
        "recebido",
        "em_analise",
        "aguardando_aprovacao",
        "em_manutencao",
        "aguardando_peca",
        "concluido",
        "entregue",
        "cancelado",
      ],
      subscription_status: ["active", "expired", "cancelled"],
    },
  },
} as const
