-- ==============================================================================
-- SportXPv2 Production Database Schema (Exported & Synced from Supabase)
-- Phiên bản: v2.1 — Cập nhật ngày 31/10/2026
-- ==============================================================================

CREATE TABLE public.courts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  distance_km numeric DEFAULT 1.8,
  created_at timestamp with time zone DEFAULT now(),
  district text,
  city text DEFAULT 'TP. Hồ Chí Minh'::text,
  area_code text,
  rating numeric DEFAULT 5.0,
  review_count integer DEFAULT 0,
  amenities jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT courts_pkey PRIMARY KEY (id)
);

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  elo_rating integer,
  tier_name text,
  trust_score integer NOT NULL DEFAULT 100,
  win_streak integer NOT NULL DEFAULT 0,
  home_court_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  onboarding_step integer NOT NULL DEFAULT 0,
  public_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  social_visibility text NOT NULL DEFAULT 'public'::text CHECK (social_visibility = ANY (ARRAY['public'::text, 'friends'::text])),
  district text,
  city text DEFAULT 'TP. Hồ Chí Minh'::text,
  area_code text,
  zalo_phone text,
  zalo_link text,
  facebook_link text,
  bio text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_home_court_id_fkey FOREIGN KEY (home_court_id) REFERENCES public.courts(id)
);

CREATE TABLE public.match_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  court_id uuid NOT NULL,
  host_id uuid NOT NULL,
  title text DEFAULT 'Kèo giao lưu 2v2'::text,
  play_time timestamp with time zone NOT NULL,
  max_slots integer NOT NULL DEFAULT 4,
  current_players ARRAY DEFAULT '{}'::uuid[],
  min_elo integer DEFAULT 1000,
  max_elo integer DEFAULT 1600,
  fee_per_person integer DEFAULT 40000,
  status text DEFAULT 'OPEN'::text CHECK (status = ANY (ARRAY['DRAFT'::text, 'OPEN'::text, 'FULL'::text, 'IN_PROGRESS'::text, 'COMPLETED'::text, 'CANCELLED'::text])),
  created_at timestamp with time zone DEFAULT now(),
  room_version smallint NOT NULL DEFAULT 1,
  end_time timestamp with time zone,
  visibility text NOT NULL DEFAULT 'PUBLIC'::text CHECK (visibility = ANY (ARRAY['PUBLIC'::text, 'PRIVATE'::text])),
  host_plays boolean NOT NULL DEFAULT true,
  cancellation_deadline timestamp with time zone,
  schedule_revision integer NOT NULL DEFAULT 1,
  notes text NOT NULL DEFAULT ''::text,
  court_label text NOT NULL DEFAULT ''::text,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  cancellation_reason text,
  room_type text NOT NULL DEFAULT 'PUBLIC_RECRUIT'::text CHECK (room_type = ANY (ARRAY['PUBLIC_RECRUIT'::text, 'PRIVATE_RATED'::text])),
  join_code text,
  is_rated boolean NOT NULL DEFAULT false,
  zalo_group_link text,
  CONSTRAINT match_rooms_pkey PRIMARY KEY (id),
  CONSTRAINT match_rooms_court_id_fkey FOREIGN KEY (court_id) REFERENCES public.courts(id),
  CONSTRAINT match_rooms_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.match_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid,
  court_name text NOT NULL,
  team_a_names text NOT NULL,
  team_b_names text NOT NULL,
  score_text text NOT NULL,
  winner_team text DEFAULT 'A'::text CHECK (winner_team = ANY (ARRAY['A'::text, 'B'::text])),
  elo_change integer NOT NULL DEFAULT 18,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT match_results_pkey PRIMARY KEY (id),
  CONSTRAINT match_results_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.match_rooms(id)
);

CREATE TABLE public.onboarding_responses (
  user_id uuid NOT NULL,
  answers ARRAY NOT NULL DEFAULT '{}'::integer[] CHECK (cardinality(answers) >= 0 AND cardinality(answers) <= 5),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT onboarding_responses_pkey PRIMARY KEY (user_id),
  CONSTRAINT onboarding_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.friendships (
  user_low uuid NOT NULL,
  user_high uuid NOT NULL,
  requested_by uuid NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'cancelled'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT friendships_pkey PRIMARY KEY (user_low, user_high),
  CONSTRAINT friendships_user_low_fkey FOREIGN KEY (user_low) REFERENCES public.profiles(id),
  CONSTRAINT friendships_user_high_fkey FOREIGN KEY (user_high) REFERENCES public.profiles(id),
  CONSTRAINT friendships_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.profiles(id)
);

CREATE TABLE public.user_blocks (
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_blocks_pkey PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT user_blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.profiles(id),
  CONSTRAINT user_blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.social_events (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  actor uuid NOT NULL,
  target uuid NOT NULL,
  action text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT social_events_pkey PRIMARY KEY (id),
  CONSTRAINT social_events_actor_fkey FOREIGN KEY (actor) REFERENCES public.profiles(id),
  CONSTRAINT social_events_target_fkey FOREIGN KEY (target) REFERENCES public.profiles(id)
);

CREATE TABLE public.room_members (
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['HOST'::text, 'PLAYER'::text])),
  status text NOT NULL CHECK (status = ANY (ARRAY['REGISTERED'::text, 'WAITLIST'::text, 'RECONFIRM'::text, 'CANCELLED'::text])),
  is_playing boolean NOT NULL DEFAULT true,
  confirmed_revision integer NOT NULL,
  ever_registered boolean NOT NULL DEFAULT false,
  registered_at timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  cancellation_kind text,
  CONSTRAINT room_members_pkey PRIMARY KEY (room_id, user_id),
  CONSTRAINT room_members_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.match_rooms(id),
  CONSTRAINT room_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.room_commands (
  actor_id uuid NOT NULL,
  request_id uuid NOT NULL,
  action text NOT NULL,
  input_room_id uuid,
  room_id uuid NOT NULL,
  payload jsonb NOT NULL,
  before_state jsonb,
  after_state jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT room_commands_pkey PRIMARY KEY (actor_id, request_id),
  CONSTRAINT room_commands_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id),
  CONSTRAINT room_commands_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.match_rooms(id)
);

CREATE TABLE public.room_notices (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  room_id uuid NOT NULL,
  kind text NOT NULL,
  revision integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  read_at timestamp with time zone,
  CONSTRAINT room_notices_pkey PRIMARY KEY (id),
  CONSTRAINT room_notices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT room_notices_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.match_rooms(id)
);

CREATE TABLE public.room_member_events (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  room_id uuid NOT NULL,
  user_id uuid NOT NULL,
  actor_id uuid,
  revision integer NOT NULL,
  before_state jsonb,
  after_state jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT clock_timestamp(),
  CONSTRAINT room_member_events_pkey PRIMARY KEY (id),
  CONSTRAINT room_member_events_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.match_rooms(id)
);

CREATE TABLE public.tournaments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  host_id uuid,
  court_id uuid,
  title text NOT NULL,
  venue_name text NOT NULL,
  address text NOT NULL,
  format text NOT NULL DEFAULT 'doubles'::text CHECK (format = ANY (ARRAY['singles'::text, 'doubles'::text, 'mixed'::text])),
  banner_url text,
  min_tier text,
  max_tier text,
  entry_fee numeric NOT NULL DEFAULT 0,
  prize_pool numeric NOT NULL DEFAULT 0,
  max_slots integer NOT NULL DEFAULT 16,
  current_slots integer NOT NULL DEFAULT 0,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  status text NOT NULL DEFAULT 'registering'::text CHECK (status = ANY (ARRAY['draft'::text, 'registering'::text, 'ongoing'::text, 'completed'::text, 'canceled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tournaments_pkey PRIMARY KEY (id),
  CONSTRAINT tournaments_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.profiles(id),
  CONSTRAINT tournaments_court_id_fkey FOREIGN KEY (court_id) REFERENCES public.courts(id)
);

CREATE TABLE public.tournament_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  user_id uuid NOT NULL,
  partner_id uuid,
  status text NOT NULL DEFAULT 'registered'::text CHECK (status = ANY (ARRAY['registered'::text, 'paid'::text, 'confirmed'::text, 'checked_in'::text, 'eliminated'::text, 'champion'::text, 'runner_up'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tournament_participants_pkey PRIMARY KEY (id),
  CONSTRAINT tournament_participants_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id),
  CONSTRAINT tournament_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT tournament_participants_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.session_matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  match_type text NOT NULL DEFAULT 'doubles'::text CHECK (match_type = ANY (ARRAY['singles'::text, 'doubles'::text])),
  team_a_player_ids ARRAY NOT NULL,
  team_b_player_ids ARRAY NOT NULL,
  scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  winner_team text CHECK (winner_team = ANY (ARRAY['A'::text, 'B'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['draft'::text, 'pending'::text, 'confirmed'::text, 'disputed'::text, 'void'::text])),
  confirmations ARRAY NOT NULL DEFAULT '{}'::uuid[],
  k_factor integer NOT NULL DEFAULT 16,
  elo_delta integer DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT session_matches_pkey PRIMARY KEY (id),
  CONSTRAINT session_matches_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.match_rooms(id),
  CONSTRAINT session_matches_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  court_id uuid,
  room_id uuid,
  post_type text NOT NULL DEFAULT 'general'::text CHECK (post_type = ANY (ARRAY['general'::text, 'match_recap'::text, 'court_review'::text])),
  content text NOT NULL,
  media_urls ARRAY DEFAULT '{}'::text[],
  rating integer CHECK (rating >= 1 AND rating <= 5),
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id),
  CONSTRAINT posts_court_id_fkey FOREIGN KEY (court_id) REFERENCES public.courts(id),
  CONSTRAINT posts_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.match_rooms(id)
);

CREATE TABLE public.post_likes (
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_likes_pkey PRIMARY KEY (post_id, user_id),
  CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.post_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_comments_pkey PRIMARY KEY (id),
  CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT post_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
