export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      clubs: {
        Row: {
          created_at: string | null;
          description: string;
          id: string;
          logo_url: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          id?: string;
          logo_url: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          id?: string;
          logo_url?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      community_post_likes: {
        Row: {
          created_at: string | null;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_post_likes_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_post_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      community_posts: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          image_url: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          image_url: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          image_url?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      content_categories: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      content_posts: {
        Row: {
          author_id: string;
          category_id: string;
          content: string;
          created_at: string | null;
          id: string;
          image_url: string;
          published_at: string;
          status: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          author_id: string;
          category_id: string;
          content: string;
          created_at?: string | null;
          id?: string;
          image_url: string;
          published_at: string;
          status?: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          author_id?: string;
          category_id?: string;
          content?: string;
          created_at?: string | null;
          id?: string;
          image_url?: string;
          published_at?: string;
          status?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "content_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_posts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "content_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      court_checkins: {
        Row: {
          court_id: string;
          created_at: string | null;
          id: string;
          timeout_at: string | null;
          user_id: string;
        };
        Insert: {
          court_id: string;
          created_at?: string | null;
          id?: string;
          timeout_at?: string | null;
          user_id: string;
        };
        Update: {
          court_id?: string;
          created_at?: string | null;
          id?: string;
          timeout_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "court_checkins_court_id_fkey";
            columns: ["court_id"];
            isOneToOne: false;
            referencedRelation: "courts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "court_checkins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      court_favorites: {
        Row: {
          court_id: string;
          created_at: string | null;
          id: string;
          user_id: string | null;
        };
        Insert: {
          court_id: string;
          created_at?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          court_id?: string;
          created_at?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "court_favorites_court_id_fkey";
            columns: ["court_id"];
            isOneToOne: false;
            referencedRelation: "courts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "court_favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      court_images: {
        Row: {
          court_id: string;
          created_at: string | null;
          id: string;
          image_url: string;
          media_type: string;
          user_id: string | null;
        };
        Insert: {
          court_id: string;
          created_at?: string | null;
          id?: string;
          image_url: string;
          media_type?: string;
          user_id?: string | null;
        };
        Update: {
          court_id?: string;
          created_at?: string | null;
          id?: string;
          image_url?: string;
          media_type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "court_images_court_id_fkey";
            columns: ["court_id"];
            isOneToOne: false;
            referencedRelation: "courts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "court_images_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      court_proposal_images: {
        Row: {
          created_at: string | null;
          id: string;
          image_url: string;
          media_type: string;
          proposal_id: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          image_url: string;
          media_type?: string;
          proposal_id: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          image_url?: string;
          media_type?: string;
          proposal_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "court_proposal_images_proposal_id_fkey";
            columns: ["proposal_id"];
            isOneToOne: false;
            referencedRelation: "court_proposals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "court_proposal_images_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      court_proposals: {
        Row: {
          created_at: string | null;
          description: string;
          hoops_count: number;
          id: string;
          latitude: number;
          longitude: number;
          name: string;
          status: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          hoops_count: number;
          id?: string;
          latitude: number;
          longitude: number;
          name: string;
          status?: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          hoops_count?: number;
          id?: string;
          latitude?: number;
          longitude?: number;
          name?: string;
          status?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "court_proposals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      court_report_images: {
        Row: {
          created_at: string | null;
          id: string;
          image_order: number;
          image_url: string;
          report_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          image_order?: number;
          image_url: string;
          report_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          image_order?: number;
          image_url?: string;
          report_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "court_report_images_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "court_reports";
            referencedColumns: ["id"];
          },
        ];
      };
      court_reports: {
        Row: {
          category: string;
          court_id: string;
          created_at: string | null;
          description: string;
          id: string;
          image_url: string;
          municipality_id: string;
          status: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          category: string;
          court_id: string;
          created_at?: string | null;
          description: string;
          id?: string;
          image_url: string;
          municipality_id: string;
          status?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          category?: string;
          court_id?: string;
          created_at?: string | null;
          description?: string;
          id?: string;
          image_url?: string;
          municipality_id?: string;
          status?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "court_reports_court_id_fkey";
            columns: ["court_id"];
            isOneToOne: false;
            referencedRelation: "courts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "court_reports_municipality_id_fkey";
            columns: ["municipality_id"];
            isOneToOne: false;
            referencedRelation: "municipalities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "court_reports_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      court_reviews: {
        Row: {
          comment: string;
          court_id: string;
          created_at: string | null;
          id: string;
          rating: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          comment: string;
          court_id: string;
          created_at?: string | null;
          id?: string;
          rating: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          comment?: string;
          court_id?: string;
          created_at?: string | null;
          id?: string;
          rating?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "court_reviews_court_id_fkey";
            columns: ["court_id"];
            isOneToOne: false;
            referencedRelation: "courts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "court_reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      courts: {
        Row: {
          created_at: string | null;
          has_lightning: boolean;
          hoops_count: number;
          id: string;
          is_accessible: boolean;
          latitude: number;
          longitude: number;
          municipality_id: string | null;
          name: string;
          status: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          has_lightning?: boolean;
          hoops_count: number;
          id?: string;
          is_accessible?: boolean;
          latitude: number;
          longitude: number;
          municipality_id?: string | null;
          name: string;
          status?: string;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          has_lightning?: boolean;
          hoops_count?: number;
          id?: string;
          is_accessible?: boolean;
          latitude?: number;
          longitude?: number;
          municipality_id?: string | null;
          name?: string;
          status?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "courts_municipality_id_fkey";
            columns: ["municipality_id"];
            isOneToOne: false;
            referencedRelation: "municipalities";
            referencedColumns: ["id"];
          },
        ];
      };
      event_images: {
        Row: {
          created_at: string | null;
          event_id: string;
          id: string;
          image_url: string;
        };
        Insert: {
          created_at?: string | null;
          event_id: string;
          id?: string;
          image_url: string;
        };
        Update: {
          created_at?: string | null;
          event_id?: string;
          id?: string;
          image_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_images_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_participants: {
        Row: {
          category: string;
          created_at: string | null;
          event_id: string;
          id: string;
          user_id: string;
        };
        Insert: {
          category?: string;
          created_at?: string | null;
          event_id: string;
          id?: string;
          user_id: string;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          event_id?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_team_players: {
        Row: {
          created_at: string;
          event_team_id: string;
          id: string;
          player_name: string | null;
        };
        Insert: {
          created_at?: string;
          event_team_id: string;
          id?: string;
          player_name?: string | null;
        };
        Update: {
          created_at?: string;
          event_team_id?: string;
          id?: string;
          player_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "event_team_players_event_team_id_fkey";
            columns: ["event_team_id"];
            isOneToOne: false;
            referencedRelation: "event_teams";
            referencedColumns: ["id"];
          },
        ];
      };
      event_teams: {
        Row: {
          category: string;
          created_at: string;
          created_by: string;
          event_id: string;
          id: string;
          team_name: string;
        };
        Insert: {
          category?: string;
          created_at?: string;
          created_by: string;
          event_id: string;
          id?: string;
          team_name: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          created_by?: string;
          event_id?: string;
          id?: string;
          team_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_teams_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_teams_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          age_group: string;
          category: string;
          court_id: string;
          created_at: string | null;
          created_by: string;
          description: string;
          event_date: string;
          event_time: string;
          id: string;
          location: string;
          max_teams: number;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          age_group?: string;
          category?: string;
          court_id: string;
          created_at?: string | null;
          created_by: string;
          description?: string;
          event_date: string;
          event_time: string;
          id?: string;
          location?: string;
          max_teams: number;
          name?: string;
          updated_at?: string | null;
        };
        Update: {
          age_group?: string;
          category?: string;
          court_id?: string;
          created_at?: string | null;
          created_by?: string;
          description?: string;
          event_date?: string;
          event_time?: string;
          id?: string;
          location?: string;
          max_teams?: number;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      external_club_mapping: {
        Row: {
          club_name: string;
          external_club_id: string;
          season: string | null;
          source: string;
          verified: boolean;
        };
        Insert: {
          club_name: string;
          external_club_id: string;
          season?: string | null;
          source: string;
          verified?: boolean;
        };
        Update: {
          club_name?: string;
          external_club_id?: string;
          season?: string | null;
          source?: string;
          verified?: boolean;
        };
        Relationships: [];
      };
      external_team_import: {
        Row: {
          age_group: string | null;
          club_name: string | null;
          created_at: string;
          external_club_id: string | null;
          external_league_id: string | null;
          external_team_id: string | null;
          gender: string | null;
          id: string;
          league_name: string | null;
          season: string | null;
          source: string;
          team_name: string | null;
          verified: boolean;
        };
        Insert: {
          age_group?: string | null;
          club_name?: string | null;
          created_at?: string;
          external_club_id?: string | null;
          external_league_id?: string | null;
          external_team_id?: string | null;
          gender?: string | null;
          id?: string;
          league_name?: string | null;
          season?: string | null;
          source: string;
          team_name?: string | null;
          verified?: boolean;
        };
        Update: {
          age_group?: string | null;
          club_name?: string | null;
          created_at?: string;
          external_club_id?: string | null;
          external_league_id?: string | null;
          external_team_id?: string | null;
          gender?: string | null;
          id?: string;
          league_name?: string | null;
          season?: string | null;
          source?: string;
          team_name?: string | null;
          verified?: boolean;
        };
        Relationships: [];
      };
      games: {
        Row: {
          away_score: number | null;
          away_team_id: string;
          cancelled: boolean;
          created_at: string | null;
          external_match_day: number | null;
          external_match_id: number | null;
          external_source: string | null;
          external_synced_at: string | null;
          game_date: string;
          game_time: string | null;
          home_score: number | null;
          home_team_id: string;
          id: string;
          league_id: string;
          result_confirmed: boolean;
          updated_at: string | null;
        };
        Insert: {
          away_score?: number | null;
          away_team_id: string;
          cancelled?: boolean;
          created_at?: string | null;
          external_match_day?: number | null;
          external_match_id?: number | null;
          external_source?: string | null;
          external_synced_at?: string | null;
          game_date: string;
          game_time?: string | null;
          home_score?: number | null;
          home_team_id: string;
          id?: string;
          league_id: string;
          result_confirmed?: boolean;
          updated_at?: string | null;
        };
        Update: {
          away_score?: number | null;
          away_team_id?: string;
          cancelled?: boolean;
          created_at?: string | null;
          external_match_day?: number | null;
          external_match_id?: number | null;
          external_source?: string | null;
          external_synced_at?: string | null;
          game_date?: string;
          game_time?: string | null;
          home_score?: number | null;
          home_team_id?: string;
          id?: string;
          league_id?: string;
          result_confirmed?: boolean;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "games_away_team_id_fkey";
            columns: ["away_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_home_team_id_fkey";
            columns: ["home_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
        ];
      };
      leagues: {
        Row: {
          age_group: string | null;
          created_at: string | null;
          division: string | null;
          external_liga_id: number | null;
          external_season_id: number | null;
          external_source: string | null;
          external_synced_at: string | null;
          id: string;
          name: string;
          season: string | null;
        };
        Insert: {
          age_group?: string | null;
          created_at?: string | null;
          division?: string | null;
          external_liga_id?: number | null;
          external_season_id?: number | null;
          external_source?: string | null;
          external_synced_at?: string | null;
          id?: string;
          name: string;
          season?: string | null;
        };
        Update: {
          age_group?: string | null;
          created_at?: string | null;
          division?: string | null;
          external_liga_id?: number | null;
          external_season_id?: number | null;
          external_source?: string | null;
          external_synced_at?: string | null;
          id?: string;
          name?: string;
          season?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          read_at: string;
          receiver_id: string;
          sender_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          read_at: string;
          receiver_id: string;
          sender_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          read_at?: string;
          receiver_id?: string;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      municipalities: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      municipality_users: {
        Row: {
          created_at: string | null;
          id: string;
          municipality_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          municipality_id?: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          municipality_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "municipality_users_municipality_id_fkey";
            columns: ["municipality_id"];
            isOneToOne: false;
            referencedRelation: "municipalities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "municipality_users_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      ommunity_comments: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          post_id: string;
          updatedat: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          post_id: string;
          updatedat?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          post_id?: string;
          updatedat?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ommunity_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ommunity_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      players: {
        Row: {
          created_at: string | null;
          first_name: string | null;
          id: string;
          jersey_number: number | null;
          last_name: string | null;
          team_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          first_name?: string | null;
          id?: string;
          jersey_number?: number | null;
          last_name?: string | null;
          team_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          first_name?: string | null;
          id?: string;
          jersey_number?: number | null;
          last_name?: string | null;
          team_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string;
          basketball_position: string;
          bio: string;
          birth_date: string | null;
          club_id: string | null;
          created_at: string;
          display_name: string;
          email: string | null;
          fiba_3x3_url: string | null;
          first_name: string | null;
          id: string;
          instagram_url: string | null;
          last_name: string | null;
          location: string | null;
          team_id: string | null;
          tiktok_url: string | null;
          username: string;
          youtube_url: string | null;
        };
        Insert: {
          avatar_url: string;
          basketball_position: string;
          bio: string;
          birth_date?: string | null;
          club_id?: string | null;
          created_at?: string;
          display_name: string;
          email?: string | null;
          fiba_3x3_url?: string | null;
          first_name?: string | null;
          id: string;
          instagram_url?: string | null;
          last_name?: string | null;
          location?: string | null;
          team_id?: string | null;
          tiktok_url?: string | null;
          username: string;
          youtube_url?: string | null;
        };
        Update: {
          avatar_url?: string;
          basketball_position?: string;
          bio?: string;
          birth_date?: string | null;
          club_id?: string | null;
          created_at?: string;
          display_name?: string;
          email?: string | null;
          fiba_3x3_url?: string | null;
          first_name?: string | null;
          id?: string;
          instagram_url?: string | null;
          last_name?: string | null;
          location?: string | null;
          team_id?: string | null;
          tiktok_url?: string | null;
          username?: string;
          youtube_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      standings: {
        Row: {
          created_at: string | null;
          games_played: number;
          id: string;
          league_id: string;
          losses: number;
          points: number;
          position: number;
          team_id: string | null;
          updated_at: string | null;
          wins: number;
        };
        Insert: {
          created_at?: string | null;
          games_played?: number;
          id?: string;
          league_id: string;
          losses?: number;
          points?: number;
          position: number;
          team_id?: string | null;
          updated_at?: string | null;
          wins?: number;
        };
        Update: {
          created_at?: string | null;
          games_played?: number;
          id?: string;
          league_id?: string;
          losses?: number;
          points?: number;
          position?: number;
          team_id?: string | null;
          updated_at?: string | null;
          wins?: number;
        };
        Relationships: [
          {
            foreignKeyName: "standings_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "standings_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          age_group: string;
          club_id: string | null;
          created_at: string | null;
          external_permanent_team_id: number | null;
          external_season_team_id: number | null;
          external_source: string | null;
          external_synced_at: string | null;
          external_team_competition_id: number | null;
          id: string;
          league_id: string;
          name: string;
          updated_at: string | null;
          website_url: string | null;
        };
        Insert: {
          age_group: string;
          club_id?: string | null;
          created_at?: string | null;
          external_permanent_team_id?: number | null;
          external_season_team_id?: number | null;
          external_source?: string | null;
          external_synced_at?: string | null;
          external_team_competition_id?: number | null;
          id?: string;
          league_id?: string;
          name: string;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Update: {
          age_group?: string;
          club_id?: string | null;
          created_at?: string | null;
          external_permanent_team_id?: number | null;
          external_season_team_id?: number | null;
          external_source?: string | null;
          external_synced_at?: string | null;
          external_team_competition_id?: number | null;
          id?: string;
          league_id?: string;
          name?: string;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "teams_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_league_schedule: {
        Args: { p_league_id: string; p_start_date?: string };
        Returns: undefined;
      };
      get_my_club_id: { Args: never; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
