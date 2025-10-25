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
      agent_appointments: {
        Row: {
          agent_id: string
          conversation_id: string | null
          created_at: string
          customer_id: string
          customer_notes: string | null
          id: string
          scheduled_date: string
          service_description: string | null
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
          scheduled_date: string
          service_description?: string | null
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
          scheduled_date?: string
          service_description?: string | null
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
          created_at: string
          customer_id: string
          id: string
          last_message_at: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          customer_id: string
          id?: string
          last_message_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          last_message_at?: string
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
          id: string
          last_login_at: string | null
          name: string
          password_hash: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          email: string
          id?: string
          last_login_at?: string | null
          name: string
          password_hash: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          email?: string
          id?: string
          last_login_at?: string | null
          name?: string
          password_hash?: string
          phone?: string | null
          updated_at?: string
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
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
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
      ai_agents: {
        Row: {
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
          chatbot_id: string
          created_at: string
          id: string
          last_message_at: string
          session_id: string
          started_at: string
          status: string
          visitor_email: string | null
          visitor_name: string | null
          visitor_phone: string | null
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          session_id: string
          started_at?: string
          status?: string
          visitor_email?: string | null
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
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
      chatbot_customers: {
        Row: {
          chatbot_id: string
          created_at: string
          email: string | null
          id: string
          last_login_at: string | null
          name: string
          password_hash: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          chatbot_id: string
          created_at?: string
          email?: string | null
          id?: string
          last_login_at?: string | null
          name: string
          password_hash?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          chatbot_id?: string
          created_at?: string
          email?: string | null
          id?: string
          last_login_at?: string | null
          name?: string
          password_hash?: string | null
          phone?: string | null
          updated_at?: string
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
      chatbots: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
          whatsapp_connection_id: string | null
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
          whatsapp_connection_id?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
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
          location: string
          open_as_popup: boolean
          order_index: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          location: string
          open_as_popup?: boolean
          order_index?: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string
          open_as_popup?: boolean
          order_index?: number
          slug?: string
          title?: string
          updated_at?: string
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
          text_color?: string | null
          theme?: string | null
          total_clicks?: number | null
          updated_at?: string
          user_id?: string
          username?: string
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
          created_at: string
          description: string | null
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean
          name: string
          order_index: number
          plan_type: Database["public"]["Enums"]["plan_type"]
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days: number
          features?: Json | null
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          plan_type: Database["public"]["Enums"]["plan_type"]
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          plan_type?: Database["public"]["Enums"]["plan_type"]
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
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
      plan_type: "free_trial" | "chatbot" | "ai_agent"
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
      plan_type: ["free_trial", "chatbot", "ai_agent"],
      subscription_status: ["active", "expired", "cancelled"],
    },
  },
} as const
