import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enhanced session persistence settings
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Disable to prevent URL-based session detection issues
    flowType: 'pkce',
    // Extend session duration and improve persistence
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'ktl-stock-auth-token',
    // Debug session events
    debug: process.env.NODE_ENV === 'development',
    // Additional persistence settings
    multiTab: true, // Allow session sharing across tabs
    lock: false // Disable auth lock to prevent session conflicts
  },
  // Add global fetch options for better error handling and UTF-8 support
  global: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json; charset=utf-8'
    }
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      items: {
        Row: {
          id: string;
          sku: string;
          name: string;
          selling_price_euro_cents: number;
          quantity_kind: 'unit' | 'kg';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          selling_price_euro_cents: number;
          quantity_kind: 'unit' | 'kg';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          name?: string;
          selling_price_euro_cents?: number;
          quantity_kind?: 'unit' | 'kg';
          created_at?: string;
          updated_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      stock_by_location: {
        Row: {
          id: string;
          sku: string;
          location_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          location_id: string;
          quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          location_id?: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_trail: {
        Row: {
          id: string;
          timestamp_iso: string;
          type: 'add' | 'deduct' | 'transfer';
          sku: string;
          location_id: string | null;
          from_location_id: string | null;
          to_location_id: string | null;
          quantity: number;
          reason: string | null;
          note: string | null;
          user_id: string | null;
          item_name: string | null;
          location_name: string | null;
          from_location_name: string | null;
          to_location_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          timestamp_iso: string;
          type: 'add' | 'deduct' | 'transfer';
          sku: string;
          location_id?: string | null;
          from_location_id?: string | null;
          to_location_id?: string | null;
          quantity: number;
          reason?: string | null;
          note?: string | null;
          user_id?: string | null;
          item_name?: string | null;
          location_name?: string | null;
          from_location_name?: string | null;
          to_location_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          timestamp_iso?: string;
          type?: 'add' | 'deduct' | 'transfer';
          sku?: string;
          location_id?: string | null;
          from_location_id?: string | null;
          to_location_id?: string | null;
          quantity?: number;
          reason?: string | null;
          note?: string | null;
          user_id?: string | null;
          item_name?: string | null;
          location_name?: string | null;
          from_location_name?: string | null;
          to_location_name?: string | null;
          created_at?: string;
        };
      };
      app_users: {
        Row: {
          id: string;
          username: string;
          role: 'admin' | 'editor' | 'viewer';
          security_question: string | null;
          security_answer: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          role: 'admin' | 'editor' | 'viewer';
          security_question?: string | null;
          security_answer?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          role?: 'admin' | 'editor' | 'viewer';
          security_question?: string | null;
          security_answer?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
