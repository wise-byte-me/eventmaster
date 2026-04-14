export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// Flexible row type for Supabase tables
type TableRow = Record<string, any>;

export interface Database {
  public: {
    Tables: {
      customers: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      events: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      people: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      event_people: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      credentials: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      cards: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      sessions: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      planner_items: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      tap_logs: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      audit_logs: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      mycard_claims: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      session_entitlements: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      card_assignments: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      fulfillment_orders: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      integrations: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      onboarding_states: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      subscriptions: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      payment_references: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      access_policies: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      event_rooms: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      customer_users: { Row: TableRow; Insert: TableRow; Update: TableRow; };
      users: { Row: TableRow; Insert: TableRow; Update: TableRow; };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Convenience types — named for use across the app
export interface Customer { id: string; name: string; slug: string; primary_contact_name?: string; primary_contact_email?: string; billing_email?: string; brand_logo_url?: string; brand_primary_color?: string; plan_name?: string; plan_status?: string; default_timezone?: string; ghl_connection_id?: string; stripe_customer_id?: string; created_at: string; updated_at: string; }
export interface Event { id: string; customer_id?: string; name: string; slug: string; event_type?: string; description?: string; venue_name?: string; address_1?: string; city?: string; state?: string; postal_code?: string; country?: string; timezone: string; start_at: string; end_at: string; registration_open_at?: string; registration_close_at?: string; payment_mode: string; planner_enabled: boolean; sessions_enabled: boolean; expo_enabled: boolean; mycard_enabled: boolean; wallet_enabled: boolean; qr_enabled: boolean; nfc_enabled: boolean; created_by?: string; created_at: string; updated_at: string; }
export interface Person { id: string; first_name: string; last_name?: string; email: string; phone?: string; company?: string; title?: string; city?: string; state?: string; country?: string; notes?: string; source?: string; created_at: string; updated_at: string; }
export interface EventPerson { id: string; event_id: string; person_id: string; attendee_type: string; registration_status: string; approval_status?: string; checkin_status: string; credential_status: string; payment_status: string; payment_reference_id?: string; linked_mycard_status?: string; created_at: string; updated_at: string; }
export interface Credential { id: string; event_id: string; event_person_id: string; issuer: string; role_label?: string; badge_type?: string; status: string; valid_from?: string; valid_until?: string; version: number; signature?: string; created_at: string; updated_at: string; }
export interface Card { id: string; customer_id?: string; event_id?: string; card_uid: string; batch_id?: string; card_type: string; card_material: string; print_status: string; encode_status: string; shipment_status: string; assignment_status: string; status: string; created_at: string; updated_at: string; }
export interface Session { id: string; event_id: string; room_id?: string; title: string; description?: string; start_at: string; end_at: string; capacity?: number; status: string; upgrade_enabled: boolean; upgrade_external_url?: string; required_access_policy_id?: string; created_at: string; updated_at: string; }
export interface PlannerItem { id: string; event_id: string; planner_type: string; title: string; description?: string; starts_at: string; ends_at: string; room_id?: string; owner_user_id?: string; priority?: string; status: string; created_at: string; updated_at: string; }
export interface TapLog { id: string; event_id?: string; credential_id?: string; card_id?: string; event_person_id?: string; tap_source: string; tap_location?: string; tap_type: string; decision: string; message?: string; occurred_at: string; created_at: string; }
export interface AuditLog { id: string; customer_id?: string; event_id?: string; actor_user_id?: string; entity_type: string; entity_id: string; action: string; before_json?: Json; after_json?: Json; created_at: string; }
