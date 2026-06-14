import type { LucideIcon } from 'lucide-react';

export type AppView = 'landing' | 'login' | 'signup' | 'verify' | 'profile-setup' | 'splash' | 'onboarding' | 'app';

export type ThemeKey =
  | 'heritage'
  | 'rotary'
  | 'pasabuy'
  | 'travel'
  | 'hiking'
  | 'gaming'
  | 'rideshare'
  | 'cafe'
  | 'volunteer'
  | 'sports';

export type CategoryId = Exclude<ThemeKey, 'heritage'>;

export interface Theme {
  name: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  accent: string;
  highlight: string;
  text: string;
  textMuted: string;
  border: string;
  badge: string;
}

export interface Category {
  id: CategoryId;
  name: string;
  tagline: string;
  Icon: LucideIcon;
  status: 'live' | 'soon';
  image: string | null;
}

export interface CategoryHighlight {
  Icon: LucideIcon;
  label: string;
}

export interface CategoryStat {
  value: string;
  label: string;
}

export interface CategoryDetail {
  description: string;
  highlights: CategoryHighlight[];
  stats: CategoryStat[];
}

export interface Feature {
  Icon: LucideIcon;
  title: string;
  body: string;
}

export interface TrustItem {
  title: string;
  body: string;
}

export interface UserInfo {
  email: string;
  name: string;
  avatarUrl?: string;
  gender?: string | null;
}

export interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  description: string;
}

export interface OtherSocial {
  id: string;
  label: string;
  url: string;
}

export interface PasaBuyItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  brand: string;
  max_price: number | null;
  substitute: boolean;
}

export interface Room {
  id: string;
  created_at: string;
  user_id: string;
  host_name: string;
  name: string;
  description: string | null;
  category: string;
  max_members: number;
  member_count: number;
  next_event: string | null;
  status: 'live' | 'soon' | 'confirmed' | 'completed' | 'cancelled';
  join_code: string;
  is_private: boolean;
  password: string | null;
  event_date: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_name: string | null;
  itinerary: ItineraryItem[];
  other_socials: OtherSocial[];
  // Gaming
  game_name: string | null;
  game_id: string | null;
  // PasaBuy v2
  items: PasaBuyItem[];
  goods_budget: number | null;
  service_fee_mode: 'fixed' | 'negotiable' | 'distance_based' | null;
  service_fee_amount: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  dropoff_name: string | null;
  needed_by: string | null;
  overage_rule: 'hard_cap' | 'allow_over' | 'reimburse' | null;
  approval_mode: 'auto' | 'manual' | null;
}

export interface BookingRating {
  id: string;
  room_id: string;
  rater_id: string | null;
  ratee_id: string | null;
  overall_score: number;
  communication_score: number | null;
  timeliness_score: number | null;
  reliability_score: number | null;
  comment: string | null;
  created_at: string;
}

export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export interface Connection {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string | null;
  reported_user_id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
  reporter_name?: string | null;
  reported_name?: string | null;
  reported_avatar?: string | null;
}

export interface IdSubmission {
  id: string;
  user_id: string;
  id_type: string;
  id_front_url: string;
  id_back_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
}

export interface DiscoverProfile {
  id: string;
  display_name: string | null;
  age_range: string | null;
  location: string | null;
  bio: string | null;
  gender: string | null;
  profile_tags: string[] | null;
  kasama_rating: number | null;
  rating_count: number;
  is_online: boolean;
  profile_completed: boolean;
  contact_phone: string | null;
  home_lat: number | null;
  rooms_joined: number;
  avatar_url: string | null;
  id_verified: boolean;
}

export type NotificationType = 'new_message' | 'join_request' | 'accepted' | 'gc_established';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  age_range: string | null;
  location: string | null;
  bio: string | null;
  gender: string | null;
  profile_completed: boolean;
  privacy_level: string;
  show_in_discover: boolean;
  home_lat: number | null;
  home_lng: number | null;
  kasama_rating: number | null;
  rating_count: number;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  contact_phone: string | null;
  profile_tags: string[] | null;
  is_online: boolean;
  onboarding_completed: boolean;
  kasama_tag: string | null;
  avatar_url: string | null;
  id_type: string | null;
  id_last4: string | null;
  id_verified: boolean;
  updated_at: string;
}
