export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";
export type BookingType = "rsvp" | "external" | "contact" | "none";
export type EventCategory = "majlis" | "lecture" | "quran" | "youth" | "eid" | "community" | "other";

export interface Center {
  id: string;
  name: string;
  suburb: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  youtube_channel_id: string | null;
  youtube_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  color_hex: string | null;
  bank_name: string | null;
  bsb: string | null;
  account_number: string | null;
  account_name: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  created_at: string;
}

export interface Program {
  id: string;
  center_id: string;
  title: string;
  description: string | null;
  date: string | null;
  time: string | null;
  poster_image_url: string | null;
  youtube_stream_url: string | null;
  is_live: boolean;
  booking_type: BookingType;
  booking_url: string | null;
  capacity: number | null;
  category: EventCategory;
  created_at: string;
}

export interface RSVP {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  attendees: number;
  created_at: string;
}

export interface CenterRole {
  id: string;
  user_id: string;
  center_id: string;
  role: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  center_id: string;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      centers: {
        Row: Center;
        Insert: {
          id?: string;
          name: string;
          suburb?: string | null;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          logo_url?: string | null;
          youtube_channel_id?: string | null;
          youtube_url?: string | null;
          instagram_url?: string | null;
          facebook_url?: string | null;
          color_hex?: string | null;
          bank_name?: string | null;
          bsb?: string | null;
          account_number?: string | null;
          account_name?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string;
          trial_ends_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          suburb?: string | null;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          logo_url?: string | null;
          youtube_channel_id?: string | null;
          youtube_url?: string | null;
          instagram_url?: string | null;
          facebook_url?: string | null;
          color_hex?: string | null;
          bank_name?: string | null;
          bsb?: string | null;
          account_number?: string | null;
          account_name?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string;
          trial_ends_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: Program;
        Insert: {
          id?: string;
          center_id: string;
          title: string;
          description?: string | null;
          date?: string | null;
          time?: string | null;
          poster_image_url?: string | null;
          youtube_stream_url?: string | null;
          is_live?: boolean;
          booking_type?: string;
          booking_url?: string | null;
          capacity?: number | null;
          category?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          center_id?: string;
          title?: string;
          description?: string | null;
          date?: string | null;
          time?: string | null;
          poster_image_url?: string | null;
          youtube_stream_url?: string | null;
          is_live?: boolean;
          booking_type?: string;
          booking_url?: string | null;
          capacity?: number | null;
          category?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_center_id_fkey";
            columns: ["center_id"];
            isOneToOne: false;
            referencedRelation: "centers";
            referencedColumns: ["id"];
          }
        ];
      };
      rsvps: {
        Row: RSVP;
        Insert: {
          id?: string;
          event_id: string;
          name: string;
          email?: string | null;
          attendees?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          name?: string;
          email?: string | null;
          attendees?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      center_roles: {
        Row: CenterRole;
        Insert: {
          id?: string;
          user_id: string;
          center_id: string;
          role?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          center_id?: string;
          role?: string;
        };
        Relationships: [];
      };
      user_favorites: {
        Row: UserFavorite;
        Insert: {
          id?: string;
          user_id: string;
          center_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          center_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
