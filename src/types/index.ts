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
  | 'volunteer';

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
  status: 'live' | 'soon';
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
}

export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';

export interface Connection {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
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
  updated_at: string;
}
