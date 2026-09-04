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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_feed_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          category: string
          contact: string | null
          created_at: string
          creator_id: string
          description: string
          id: string
          leader_name: string | null
          logo_url: string | null
          name: string
          short_description: string | null
          slug: string
          status: Database["public"]["Enums"]["community_status"]
          telegram_bot_key: string
          updated_at: string
        }
        Insert: {
          category: string
          contact?: string | null
          created_at?: string
          creator_id: string
          description: string
          id?: string
          leader_name?: string | null
          logo_url?: string | null
          name: string
          short_description?: string | null
          slug: string
          status?: Database["public"]["Enums"]["community_status"]
          telegram_bot_key?: string
          updated_at?: string
        }
        Update: {
          category?: string
          contact?: string | null
          created_at?: string
          creator_id?: string
          description?: string
          id?: string
          leader_name?: string | null
          logo_url?: string | null
          name?: string
          short_description?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["community_status"]
          telegram_bot_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      club_telegram_connections: {
        Row: {
          community_id: string
          created_at: string
          telegram_chat_id: string
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          telegram_chat_id: string
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          telegram_chat_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_telegram_connections_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: true
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      club_telegram_integrations: {
        Row: {
          community_id: string
          created_at: string
          group_url: string
          public_username: string | null
          updated_at: string
        }
        Insert: {
          community_id: string
          created_at?: string
          group_url: string
          public_username?: string | null
          updated_at?: string
        }
        Update: {
          community_id?: string
          created_at?: string
          group_url?: string
          public_username?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_telegram_integrations_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: true
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          joined_at: string
          profile_id: string
          role: Database["public"]["Enums"]["community_member_role"]
        }
        Insert: {
          community_id: string
          joined_at?: string
          profile_id: string
          role?: Database["public"]["Enums"]["community_member_role"]
        }
        Update: {
          community_id?: string
          joined_at?: string
          profile_id?: string
          role?: Database["public"]["Enums"]["community_member_role"]
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          direct_user_high: string
          direct_user_low: string
          id: string
          kind: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          direct_user_high: string
          direct_user_low: string
          id?: string
          kind?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          direct_user_high?: string
          direct_user_low?: string
          id?: string
          kind?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_direct_user_high_fkey"
            columns: ["direct_user_high"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_direct_user_low_fkey"
            columns: ["direct_user_low"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          created_at: string
          event_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_saves: {
        Row: {
          created_at: string
          event_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_saves_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_saves_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number
          category: string
          created_at: string
          description: string
          ends_at: string
          id: string
          location: string
          organizer_id: string
          slug: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          capacity: number
          category: string
          created_at?: string
          description: string
          ends_at: string
          id?: string
          location: string
          organizer_id: string
          slug: string
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          category?: string
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          location?: string
          organizer_id?: string
          slug?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          recipient_id: string
          sender_id?: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          dedupe_key: string
          entity_id: string
          entity_type: string
          id: string
          payload: Json
          read_at: string | null
          recipient_id: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          dedupe_key: string
          entity_id: string
          entity_type: string
          id?: string
          payload?: Json
          read_at?: string | null
          recipient_id: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          dedupe_key?: string
          entity_id?: string
          entity_type?: string
          id?: string
          payload?: Json
          read_at?: string | null
          recipient_id?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_bookmarks: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_feed_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "post_feed_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          community_id: string | null
          content: string
          created_at: string
          id: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          author_id: string
          community_id?: string | null
          content: string
          created_at?: string
          id?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          author_id?: string
          community_id?: string | null
          content?: string
          created_at?: string
          id?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_interests: {
        Row: {
          interest_id: string
          profile_id: string
        }
        Insert: {
          interest_id: string
          profile_id: string
        }
        Update: {
          interest_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_interests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_skills: {
        Row: {
          profile_id: string
          skill_id: string
        }
        Insert: {
          profile_id: string
          skill_id: string
        }
        Update: {
          profile_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          academic_year: number
          available_for_projects: boolean
          avatar_url: string | null
          bio: string
          created_at: string
          full_name: string
          id: string
          onboarding_completed: boolean
          open_to_collaboration: boolean
          profile_visibility: string
          program_id: string | null
          updated_at: string
          username: string
        }
        Insert: {
          academic_year: number
          available_for_projects?: boolean
          avatar_url?: string | null
          bio?: string
          created_at?: string
          full_name: string
          id: string
          onboarding_completed?: boolean
          open_to_collaboration?: boolean
          profile_visibility?: string
          program_id?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          academic_year?: number
          available_for_projects?: boolean
          avatar_url?: string | null
          bio?: string
          created_at?: string
          full_name?: string
          id?: string
          onboarding_completed?: boolean
          open_to_collaboration?: boolean
          profile_visibility?: string
          program_id?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      project_applications: {
        Row: {
          applicant_id: string
          created_at: string
          id: string
          message: string
          project_id: string
          project_role_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          id?: string
          message: string
          project_id: string
          project_role_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          id?: string
          message?: string
          project_id?: string
          project_role_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_applications_project_role_id_project_id_fkey"
            columns: ["project_role_id", "project_id"]
            isOneToOne: false
            referencedRelation: "project_roles"
            referencedColumns: ["id", "project_id"]
          },
        ]
      }
      project_members: {
        Row: {
          can_edit: boolean
          joined_at: string
          profile_id: string
          project_id: string
          role_title: string
        }
        Insert: {
          can_edit?: boolean
          joined_at?: string
          profile_id: string
          project_id: string
          role_title: string
        }
        Update: {
          can_edit?: boolean
          joined_at?: string
          profile_id?: string
          project_id?: string
          role_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_roles: {
        Row: {
          created_at: string
          id: string
          is_open: boolean
          project_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_open?: boolean
          project_id: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_open?: boolean
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_saves: {
        Row: {
          created_at: string
          profile_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_saves_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_saves_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_technologies: {
        Row: {
          name: string
          project_id: string
        }
        Insert: {
          name: string
          project_id: string
        }
        Update: {
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_technologies_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string
          created_at: string
          creator_id: string
          description: string
          id: string
          name: string
          slug: string
          status: Database["public"]["Enums"]["project_status"]
          tagline: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          creator_id: string
          description: string
          id?: string
          name: string
          slug: string
          status?: Database["public"]["Enums"]["project_status"]
          tagline: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          creator_id?: string
          description?: string
          id?: string
          name?: string
          slug?: string
          status?: Database["public"]["Enums"]["project_status"]
          tagline?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_saves: {
        Row: {
          created_at: string
          resource_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          resource_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_saves_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resource_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_saves_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          author_id: string
          category: string
          created_at: string
          description: string
          external_url: string | null
          id: string
          storage_object_path: string | null
          tags: string[]
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at: string
        }
        Insert: {
          author_id: string
          category: string
          created_at?: string
          description: string
          external_url?: string | null
          id?: string
          storage_object_path?: string | null
          tags?: string[]
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string
          created_at?: string
          description?: string
          external_url?: string | null
          id?: string
          storage_object_path?: string | null
          tags?: string[]
          title?: string
          type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_clubs: {
        Row: {
          category: string | null
          contact: string | null
          created_at: string | null
          description: string | null
          id: string | null
          leader_name: string | null
          logo_url: string | null
          name: string | null
          short_description: string | null
          slug: string | null
          status: Database["public"]["Enums"]["community_status"] | null
          telegram_bot_key: string | null
          telegram_configured: boolean | null
          telegram_group_url: string | null
          telegram_public_username: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      post_feed_items: {
        Row: {
          author_avatar_url: string | null
          author_full_name: string | null
          author_id: string | null
          author_username: string | null
          bookmarked_by_current_user: boolean | null
          comment_count: number | null
          community_id: string | null
          community_name: string | null
          community_slug: string | null
          content: string | null
          created_at: string | null
          id: string | null
          like_count: number | null
          liked_by_current_user: boolean | null
          tags: string[] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_items: {
        Row: {
          author_avatar_url: string | null
          author_full_name: string | null
          author_id: string | null
          author_username: string | null
          category: string | null
          created_at: string | null
          description: string | null
          external_url: string | null
          id: string | null
          save_count: number | null
          saved_by_current_user: boolean | null
          storage_object_path: string | null
          tags: string[] | null
          title: string | null
          type: Database["public"]["Enums"]["resource_type"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_university_club: {
        Args: {
          club_category: string
          club_contact: string | null
          club_description: string
          club_leader_name: string
          club_logo_url: string | null
          club_name: string
          club_short_description: string
          club_slug: string
          club_status: Database["public"]["Enums"]["community_status"]
          telegram_chat_id: string | null
          telegram_group_url: string | null
          telegram_public_username: string | null
        }
        Returns: string
      }
      create_project: {
        Args: {
          project_category: string
          project_description: string
          project_name: string
          project_slug: string
          project_status: Database["public"]["Enums"]["project_status"]
          project_tagline: string
          roles_needed: string[]
          technologies: string[]
        }
        Returns: string
      }
      get_my_unread_message_count: { Args: never; Returns: number }
      get_or_create_direct_conversation: {
        Args: { other_profile_id: string }
        Returns: string
      }
      list_my_conversations: {
        Args: never
        Returns: {
          conversation_id: string
          last_message_body: string
          last_message_created_at: string
          last_message_id: string
          last_message_sender_id: string
          other_avatar_url: string
          other_full_name: string
          other_profile_id: string
          other_username: string
          unread_count: number
          updated_at: string
        }[]
      }
      mark_conversation_read: {
        Args: { target_conversation_id: string }
        Returns: string
      }
      save_my_profile: {
        Args: {
          interest_ids: string[]
          profile_academic_year: number
          profile_available_for_projects: boolean
          profile_bio: string
          profile_full_name: string
          profile_onboarding_completed: boolean
          profile_open_to_collaboration: boolean
          profile_program_id: string
          profile_username: string
          profile_visibility: string
          skill_ids: string[]
        }
        Returns: Database["public"]["Tables"]["profiles"]["Row"]
      }
      send_message: {
        Args: { message_body: string; target_conversation_id: string }
        Returns: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          recipient_id: string
          sender_id: string
        }
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_university_club: {
        Args: {
          club_category: string
          club_contact: string | null
          club_description: string
          club_id: string
          club_leader_name: string
          club_logo_url: string | null
          club_name: string
          club_short_description: string
          club_slug: string
          club_status: Database["public"]["Enums"]["community_status"]
          telegram_chat_id: string | null
          telegram_group_url: string | null
          telegram_public_username: string | null
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "student" | "community_moderator" | "admin"
      application_status: "pending" | "accepted" | "rejected" | "withdrawn"
      community_member_role: "owner" | "moderator" | "member"
      community_status: "forming" | "active"
      notification_type:
        | "new_follower"
        | "post_comment"
        | "post_like"
        | "project_application"
        | "project_application_accepted"
        | "project_application_rejected"
      project_status: "idea" | "building" | "launched" | "completed"
      resource_type: "guide" | "notes" | "repository" | "link" | "document"
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
      app_role: ["student", "community_moderator", "admin"],
      application_status: ["pending", "accepted", "rejected", "withdrawn"],
      community_member_role: ["owner", "moderator", "member"],
      community_status: ["forming", "active"],
      notification_type: [
        "new_follower",
        "post_comment",
        "post_like",
        "project_application",
        "project_application_accepted",
        "project_application_rejected",
      ],
      project_status: ["idea", "building", "launched", "completed"],
      resource_type: ["guide", "notes", "repository", "link", "document"],
    },
  },
} as const
