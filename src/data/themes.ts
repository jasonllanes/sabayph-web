import {
  Mountain, Plane, Gamepad2, Car, Coffee, HeartHandshake, Users,
  Shield, MapPin, Sparkles, CalendarCheck, Star, Globe, Compass,
  Zap, Trophy, Route, Wallet, BookOpen, HandHeart, ShoppingBasket,
  Package, Calculator, Handshake,
} from 'lucide-react';
import type { Category, CategoryDetail, CategoryId, Feature, Theme, ThemeKey, TrustItem } from '@/types';

export const THEMES: Record<ThemeKey, Theme> = {
  heritage: {
    name: 'Heritage',
    bg: '#F1EDE1',
    surface: '#FFFFFF',
    surfaceAlt: '#E9E2D0',
    primary: '#043E81',
    accent: '#C82718',
    highlight: '#EEA64C',
    text: '#06131B',
    textMuted: '#5A5448',
    border: '#D6C09D',
    badge: 'bg-[#043E81] text-[#F1EDE1]',
  },
  // ── Rotary: Forest Green ──────────────────────────────────────────────────
  rotary: {
    name: 'Rotary',
    bg: '#EDF7F0',
    surface: '#FFFFFF',
    surfaceAlt: '#C8EDD4',
    primary: '#1A7A3C',
    accent: '#0F5C2C',
    highlight: '#34A85A',
    text: '#0A2E14',
    textMuted: '#3A6B4A',
    border: '#8ECBA0',
    badge: 'bg-[#1A7A3C] text-[#EDF7F0]',
  },
  travel: {
    name: 'Travel',
    bg: '#E8F2F7',
    surface: '#FFFFFF',
    surfaceAlt: '#CFE3EE',
    primary: '#1C6E94',
    accent: '#C82718',
    highlight: '#EEA64C',
    text: '#043E81',
    textMuted: '#3D6478',
    border: '#9CC3D6',
    badge: 'bg-[#1C6E94] text-[#E8F2F7]',
  },
  hiking: {
    name: 'Hiking',
    bg: '#EBE7D7',
    surface: '#FFFFFF',
    surfaceAlt: '#D9D1B6',
    primary: '#7F3B19',
    accent: '#2E5748',
    highlight: '#EEA64C',
    text: '#3F2414',
    textMuted: '#6B5440',
    border: '#C9B98E',
    badge: 'bg-[#7F3B19] text-[#EBE7D7]',
  },
  // ── Gaming: Deep Violet ───────────────────────────────────────────────────
  gaming: {
    name: 'Gaming',
    bg: '#160D2B',
    surface: '#1E1040',
    surfaceAlt: '#281550',
    primary: '#A855F7',
    accent: '#7C3AED',
    highlight: '#C084FC',
    text: '#F3E8FF',
    textMuted: '#C4B5D8',
    border: '#4C2A7A',
    badge: 'bg-[#A855F7] text-[#160D2B]',
  },
  rideshare: {
    name: 'Ride-share',
    bg: '#F1EDE1',
    surface: '#FFFFFF',
    surfaceAlt: '#E2D7BC',
    primary: '#043E81',
    accent: '#EEA64C',
    highlight: '#C82718',
    text: '#06131B',
    textMuted: '#5A5448',
    border: '#D6C09D',
    badge: 'bg-[#043E81] text-[#F1EDE1]',
  },
  // ── Café: Rich Coffee Brown ───────────────────────────────────────────────
  cafe: {
    name: 'Café',
    bg: '#F5EDE2',
    surface: '#FFFAF5',
    surfaceAlt: '#EDD9C0',
    primary: '#5C3317',
    accent: '#8B4E2D',
    highlight: '#C8763A',
    text: '#2C1609',
    textMuted: '#7A5040',
    border: '#C4956A',
    badge: 'bg-[#5C3317] text-[#F5EDE2]',
  },
  volunteer: {
    name: 'Volunteer',
    bg: '#E8EFE3',
    surface: '#FFFFFF',
    surfaceAlt: '#CADBC0',
    primary: '#2E5748',
    accent: '#C82718',
    highlight: '#EEA64C',
    text: '#1A332A',
    textMuted: '#52685B',
    border: '#A8C19A',
    badge: 'bg-[#2E5748] text-[#E8EFE3]',
  },
  // ── PasaBuy: Vibrant Golden Yellow ───────────────────────────────────────
  pasabuy: {
    name: 'PasaBuy',
    bg: '#FEFCE8',
    surface: '#FFFFFF',
    surfaceAlt: '#FEF9C3',
    primary: '#CA8A04',
    accent: '#92400E',
    highlight: '#EAB308',
    text: '#1C1200',
    textMuted: '#6B5500',
    border: '#FDE68A',
    badge: 'bg-[#CA8A04] text-[#FEFCE8]',
  },
};

export const CATEGORIES: Category[] = [
  // PasaBuy is first — the flagship feature
  { id: 'pasabuy',   name: 'PasaBuy',    tagline: 'Earn by buying for others',   Icon: ShoppingBasket,  status: 'live', image: 'https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/pasabuy.png' },
  { id: 'rotary',    name: 'Rotary',     tagline: 'Service above self',           Icon: HeartHandshake,  status: 'live', image: 'https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/rotary.png' },
  { id: 'gaming',    name: 'Gaming',     tagline: 'Squad up, laro tayo',          Icon: Gamepad2,        status: 'live', image: 'https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/gaming.png' },
  { id: 'cafe',      name: 'Café',       tagline: 'Kape catch-ups',               Icon: Coffee,          status: 'live', image: 'https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/coffee.png' },
  { id: 'travel',    name: 'Travel',     tagline: 'Find your kasama',             Icon: Plane,           status: 'soon', image: null },
  { id: 'hiking',    name: 'Hiking',     tagline: 'Akyat together',               Icon: Mountain,        status: 'soon', image: null },
  { id: 'rideshare', name: 'Ride-share', tagline: 'Split the sakay',              Icon: Car,             status: 'soon', image: null },
  { id: 'volunteer', name: 'Volunteer',  tagline: 'Tulong, sabay-sabay',          Icon: Users,           status: 'soon', image: null },
];

export const CATEGORY_DETAILS: Record<CategoryId, CategoryDetail> = {
  pasabuy: {
    description: 'The simplest way to earn extra income — just buy something for someone nearby. Students, out-of-work citizens, or anyone who needs a flexible sideline can sign up as a buyer. No capital, no schedule. Just pick up an order, deliver it, and earn.',
    highlights: [
      { Icon: Handshake,      label: 'Anyone can earn — students, citizens, anyone in need' },
      { Icon: ShoppingBasket, label: 'Groceries, gadgets, food, pasalubong — any item' },
      { Icon: Calculator,     label: 'Set your own fee — negotiate or fixed rate' },
    ],
    stats: [
      { value: 'Live',  label: 'Now open' },
      { value: '₱50+',  label: 'Earn per errand' },
      { value: 'Flex',  label: 'Any time, any day' },
    ],
  },
  rotary: {
    description: 'Coordinate Rotary Club service projects, fundraisers, and chapter meetings — all in one trusted space. Track attendance, manage RSVPs, and keep your chapter active and engaged.',
    highlights: [
      { Icon: CalendarCheck, label: 'Chapter meetings & RSVP management' },
      { Icon: HandHeart,     label: 'Service project tracking & reports' },
      { Icon: Star,          label: 'Member recognition & badges' },
    ],
    stats: [
      { value: '12+',  label: 'Active chapters' },
      { value: '48',   label: 'Service projects' },
      { value: '340+', label: 'Members' },
    ],
  },
  travel: {
    description: 'Find verified travel kasama for trips across the Philippines. From Siargao to Sagada, never travel alone again. Set your pace, share costs, and make memories with trusted companions.',
    highlights: [
      { Icon: Globe,   label: 'Verified travel companions' },
      { Icon: Compass, label: 'Trip itinerary & route sharing' },
      { Icon: MapPin,  label: 'Local guide connections' },
    ],
    stats: [
      { value: '80+',  label: 'Destinations' },
      { value: '15',   label: 'Trip types' },
      { value: 'Soon', label: 'Go live' },
    ],
  },
  hiking: {
    description: 'Connect with experienced hikers and mountaineers. Skill-level filters, gear checklists, and safety check-ins make every summit a shared achievement.',
    highlights: [
      { Icon: Mountain, label: 'Trail difficulty ratings & skill filters' },
      { Icon: Shield,   label: 'Safety check-ins & emergency contacts' },
      { Icon: BookOpen, label: 'Gear checklists & trail guides' },
    ],
    stats: [
      { value: '50+',  label: 'Trails listed' },
      { value: '3',    label: 'Skill levels' },
      { value: 'Soon', label: 'Go live' },
    ],
  },
  gaming: {
    description: 'Host tournaments, find squads, and organize LAN nights across Mindanao. Bracket tools, team balancing, and prize tracking — all for the love of the game.',
    highlights: [
      { Icon: Zap,      label: 'Squad finder & team balancing' },
      { Icon: Trophy,   label: 'Tournament brackets & prize tracking' },
      { Icon: Gamepad2, label: 'LAN night & event organizer' },
    ],
    stats: [
      { value: '10+',  label: 'Game titles' },
      { value: '5v5',  label: 'Max team size' },
      { value: 'Live', label: 'Now open' },
    ],
  },
  rideshare: {
    description: 'Split rides, fuel costs, and routes with verified locals heading the same way. Smarter and safer than hailing a stranger — because everyone on SabayPH is vouched for.',
    highlights: [
      { Icon: Route,  label: 'Smart route & stop matching' },
      { Icon: Wallet, label: 'Automatic fuel cost splitting' },
      { Icon: Shield, label: 'Verified riders & drivers only' },
    ],
    stats: [
      { value: '4',    label: 'Seats max' },
      { value: '↓50%', label: 'Avg cost saved' },
      { value: 'Soon', label: 'Go live' },
    ],
  },
  cafe: {
    description: 'Discover curated café meet-ups across the Philippines. Book a seat, find your creative or professional community, and enjoy exclusive partner discounts with your SabayPH badge.',
    highlights: [
      { Icon: Coffee, label: 'Curated café partner network' },
      { Icon: Users,  label: 'Interest-based meet-up rooms' },
      { Icon: Star,   label: 'Exclusive member discounts' },
    ],
    stats: [
      { value: '20+',  label: 'Partner cafés' },
      { value: '↓15%', label: 'Member discount' },
      { value: 'Live', label: 'Now open' },
    ],
  },
  volunteer: {
    description: 'Join community service drives, donation runs, and barangay initiatives organized by trusted NGOs and civic groups. Show up. Make an impact. Earn your kasama reputation.',
    highlights: [
      { Icon: HandHeart,     label: 'Verified NGO & civic partnerships' },
      { Icon: CalendarCheck, label: 'Barangay & community drives' },
      { Icon: Star,          label: 'Impact reports & recognition' },
    ],
    stats: [
      { value: '8+',   label: 'NGO partners' },
      { value: '30+',  label: 'Drives planned' },
      { value: 'Soon', label: 'Go live' },
    ],
  },
};

export const FEATURES: Feature[] = [
  { Icon: Users,          title: 'Rooms, not feeds',  body: 'Every plan lives in its own room. Group chat, itinerary, attendance — all in one place.' },
  { Icon: Shield,         title: 'Verified members',  body: "ID checks and reputation history mean you always know who you're going with." },
  { Icon: MapPin,         title: 'Route matching',    body: 'Find people heading the same way and split the sakay automatically.' },
  { Icon: HeartHandshake, title: 'Organizer tools',   body: 'Waitlists, approval filters, recurring schedules — built for the people who run things.' },
  { Icon: Sparkles,       title: 'Trusted badges',    body: 'Earn reputation marks for showing up, hosting well, and being a good kasama.' },
  { Icon: Coffee,         title: 'Local perks',       body: 'Partner cafés, vans, and resorts give SabayPH members exclusive discounts.' },
];

export const TRUST_ITEMS: TrustItem[] = [
  { title: 'Verified identity',           body: 'Government ID checks and selfie verification for every host.' },
  { title: 'Reputation that follows you', body: 'Reviews and attendance history travel with your profile across all rooms.' },
  { title: 'Organizer-led approval',      body: 'Hosts choose who joins. Filter by age, verification level, or experience.' },
  { title: 'Reportable, accountable',     body: 'In-app reporting with real moderators — not bots — reviewing every case.' },
];
