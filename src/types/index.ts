import type { LucideIcon } from 'lucide-react';

export type AppView = 'landing' | 'login' | 'signup' | 'verify' | 'splash' | 'onboarding' | 'app';

export type ThemeKey =
  | 'heritage'
  | 'rotary'
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

export interface Profile {
  id: string;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  updated_at: string;
}
