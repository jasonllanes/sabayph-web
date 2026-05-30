import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Mountain,
  Plane,
  Gamepad2,
  Car,
  Coffee,
  HeartHandshake,
  Shield,
  Users,
  MapPin,
  Sparkles,
  ArrowRight,
  Menu,
  Check,
  X,
  CalendarCheck,
  Star,
  Globe,
  Compass,
  Zap,
  Trophy,
  Route,
  Wallet,
  BookOpen,
  HandHeart,
} from 'lucide-react';

// ---------- THEME DEFINITIONS ----------
const THEMES = {
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
  rotary: {
    name: 'Rotary',
    bg: '#F4ECDF',
    surface: '#FFFFFF',
    surfaceAlt: '#E9DCC0',
    primary: '#9F5E0F',
    accent: '#C82718',
    highlight: '#EEA64C',
    text: '#3F2414',
    textMuted: '#6B5440',
    border: '#D6C09D',
    badge: 'bg-[#9F5E0F] text-[#F4ECDF]',
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
  gaming: {
    name: 'Gaming',
    bg: '#0E1B26',
    surface: '#142536',
    surfaceAlt: '#1B3045',
    primary: '#EEA64C',
    accent: '#C82718',
    highlight: '#EEA64C',
    text: '#F1EDE1',
    textMuted: '#9DB0C2',
    border: '#2A405A',
    badge: 'bg-[#EEA64C] text-[#0E1B26]',
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
  cafe: {
    name: 'Café',
    bg: '#F3E9D8',
    surface: '#FFFAF0',
    surfaceAlt: '#E0CFA8',
    primary: '#7F3B19',
    accent: '#9F5E0F',
    highlight: '#EEA64C',
    text: '#3F2414',
    textMuted: '#6B5440',
    border: '#D6C09D',
    badge: 'bg-[#7F3B19] text-[#F3E9D8]',
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
};

// ---------- CATEGORIES ----------
const CATEGORIES = [
  { id: 'rotary',    name: 'Rotary',     tagline: 'Service above self',    Icon: HeartHandshake, status: 'live', image: '/rotary.png' },
  { id: 'travel',    name: 'Travel',     tagline: 'Find your kasama',      Icon: Plane,          status: 'soon', image: null },
  { id: 'hiking',    name: 'Hiking',     tagline: 'Akyat together',        Icon: Mountain,       status: 'soon', image: null },
  { id: 'gaming',    name: 'Gaming',     tagline: 'Squad up, laro tayo',   Icon: Gamepad2,       status: 'soon', image: null },
  { id: 'rideshare', name: 'Ride-share', tagline: 'Split the sakay',       Icon: Car,            status: 'soon', image: null },
  { id: 'cafe',      name: 'Café',       tagline: 'Kape catch-ups',        Icon: Coffee,         status: 'soon', image: null },
  { id: 'volunteer', name: 'Volunteer',  tagline: 'Tulong, sabay-sabay',   Icon: Users,          status: 'soon', image: null },
];

// ---------- CATEGORY DETAILS ----------
const CATEGORY_DETAILS = {
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
      { Icon: Globe,    label: 'Verified travel companions' },
      { Icon: Compass,  label: 'Trip itinerary & route sharing' },
      { Icon: MapPin,   label: 'Local guide connections' },
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
      { Icon: Zap,     label: 'Squad finder & team balancing' },
      { Icon: Trophy,  label: 'Tournament brackets & prize tracking' },
      { Icon: Gamepad2,label: 'LAN night & event organizer' },
    ],
    stats: [
      { value: '10+',  label: 'Game titles' },
      { value: '5v5',  label: 'Max team size' },
      { value: 'Soon', label: 'Go live' },
    ],
  },
  rideshare: {
    description: 'Split rides, fuel costs, and routes with verified locals heading the same way. Smarter and safer than hailing a stranger — because everyone on SabayPH is vouched for.',
    highlights: [
      { Icon: Route,   label: 'Smart route & stop matching' },
      { Icon: Wallet,  label: 'Automatic fuel cost splitting' },
      { Icon: Shield,  label: 'Verified riders & drivers only' },
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
      { Icon: Coffee,   label: 'Curated café partner network' },
      { Icon: Users,    label: 'Interest-based meet-up rooms' },
      { Icon: Star,     label: 'Exclusive member discounts' },
    ],
    stats: [
      { value: '20+',  label: 'Partner cafés' },
      { value: '↓15%', label: 'Member discount' },
      { value: 'Soon', label: 'Go live' },
    ],
  },
  volunteer: {
    description: 'Join community service drives, donation runs, and barangay initiatives organized by trusted NGOs and civic groups. Show up. Make an impact. Earn your kasama reputation.',
    highlights: [
      { Icon: HandHeart,    label: 'Verified NGO & civic partnerships' },
      { Icon: CalendarCheck,label: 'Barangay & community drives' },
      { Icon: Star,         label: 'Impact reports & recognition' },
    ],
    stats: [
      { value: '8+',   label: 'NGO partners' },
      { value: '30+',  label: 'Drives planned' },
      { value: 'Soon', label: 'Go live' },
    ],
  },
};

// ---------- PIXEL DECORATIONS ----------
const PixelHeart = ({ color = 'currentColor', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 12" fill="none" aria-hidden="true">
    <rect x="1" y="2" width="2" height="2" fill={color} />
    <rect x="3" y="2" width="2" height="2" fill={color} />
    <rect x="9" y="2" width="2" height="2" fill={color} />
    <rect x="11" y="2" width="2" height="2" fill={color} />
    <rect x="1" y="4" width="12" height="2" fill={color} />
    <rect x="3" y="6" width="8" height="2" fill={color} />
    <rect x="5" y="8" width="4" height="2" fill={color} />
    <rect x="6" y="10" width="2" height="2" fill={color} />
  </svg>
);

const PixelPlus = ({ color = 'currentColor', size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <rect x="4" y="0" width="2" height="10" fill={color} />
    <rect x="0" y="4" width="10" height="2" fill={color} />
  </svg>
);


// ---------- DATA ----------
const FEATURES = [
  { Icon: Users, title: 'Rooms, not feeds', body: 'Every plan lives in its own room. Group chat, itinerary, attendance — all in one place.' },
  { Icon: Shield, title: 'Verified members', body: 'ID checks and reputation history mean you always know who you\'re going with.' },
  { Icon: MapPin, title: 'Route matching', body: 'Find people heading the same way and split the sakay automatically.' },
  { Icon: HeartHandshake, title: 'Organizer tools', body: 'Waitlists, approval filters, recurring schedules — built for the people who run things.' },
  { Icon: Sparkles, title: 'Trusted badges', body: 'Earn reputation marks for showing up, hosting well, and being a good kasama.' },
  { Icon: Coffee, title: 'Local perks', body: 'Partner cafés, vans, and resorts give SabayPH members exclusive discounts.' },
];

const TRUST_ITEMS = [
  { title: 'Verified identity', body: 'Government ID checks and selfie verification for every host.' },
  { title: 'Reputation that follows you', body: 'Reviews and attendance history travel with your profile across all rooms.' },
  { title: 'Organizer-led approval', body: 'Hosts choose who joins. Filter by age, verification level, or experience.' },
  { title: 'Reportable, accountable', body: 'In-app reporting with real moderators — not bots — reviewing every case.' },
];


// ---------- MAIN COMPONENT ----------
export default function SabayPHLanding() {
  const [activeCategory, setActiveCategory] = useState('heritage');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = THEMES[activeCategory];

  // Keep a stale ref of the last selected category so the panel content
  // stays visible while the close animation runs.
  const lastCategoryRef = useRef(null);
  const panelRef = useRef(null);
  const currentCategory = CATEGORIES.find((c) => c.id === activeCategory);
  if (currentCategory) lastCategoryRef.current = currentCategory;
  const displayCategory = currentCategory ?? lastCategoryRef.current;

  const panelOpen = activeCategory !== 'heritage';

  useEffect(() => {
    document.documentElement.style.transition = 'background-color 600ms ease';
    document.documentElement.style.backgroundColor = theme.bg;
  }, [theme.bg]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  const toggleCategory = (id) => {
    const isOpening = activeCategory !== id;
    setActiveCategory((prev) => (prev === id ? 'heritage' : id));
    if (isOpening) {
      // After the panel starts expanding, scroll it into view (helps mobile)
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
    }
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: theme.bg,
        color: theme.text,
        fontFamily: '"DM Sans", system-ui, sans-serif',
        transition: 'background-color 600ms ease, color 600ms ease',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Bricolage+Grotesque:wght@500;700;800&family=VT323&display=swap');
        .font-display { font-family: 'Bricolage Grotesque', serif; letter-spacing: -0.02em; }
        .font-pixel { font-family: 'VT323', monospace; letter-spacing: 0.02em; }
        @keyframes float-soft { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .float-soft { animation: float-soft 4s ease-in-out infinite; }
        @keyframes fade-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-rise { animation: fade-rise 700ms ease-out both; }
      `}</style>

      {/* ============ NAVIGATION ============ */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{
          background: `${theme.bg}E6`,
          borderBottom: `1px solid ${theme.border}`,
          transition: 'all 600ms ease',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SabayPH mascot" className="h-10 w-10 object-contain" />
            <span className="font-display text-xl font-bold" style={{ color: theme.text }}>
              Sabay<span style={{ color: theme.accent }}>PH</span>
            </span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#categories" className="text-sm font-medium hover:opacity-70" style={{ color: theme.text }}>Categories</a>
            <a href="#features" className="text-sm font-medium hover:opacity-70" style={{ color: theme.text }}>Features</a>
            <a href="#trust" className="text-sm font-medium hover:opacity-70" style={{ color: theme.text }}>Trust & Safety</a>
            <a href="#waitlist" className="text-sm font-medium hover:opacity-70" style={{ color: theme.text }}>Waitlist</a>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="hidden rounded-full font-medium md:inline-flex"
              style={{ background: theme.primary, color: theme.bg, border: 'none' }}
              onClick={() => scrollTo('waitlist')}
            >
              Join early
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <button
              className="md:hidden p-1"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen
                ? <X style={{ color: theme.text }} />
                : <Menu style={{ color: theme.text }} />
              }
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div
            className="md:hidden px-6 pb-4 flex flex-col gap-4"
            style={{ borderTop: `1px solid ${theme.border}`, background: `${theme.bg}F5` }}
          >
            {['categories', 'features', 'trust', 'waitlist'].map((id) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-left text-sm font-medium capitalize hover:opacity-70"
                style={{ color: theme.text }}
              >
                {id === 'trust' ? 'Trust & Safety' : id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
            <Button
              className="rounded-full font-medium w-fit"
              style={{ background: theme.primary, color: theme.bg, border: 'none' }}
              onClick={() => scrollTo('waitlist')}
            >
              Join early <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </nav>

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden px-6 pb-20 pt-16 lg:px-12 lg:pt-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div className="fade-rise">
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium"
              style={{ background: theme.surfaceAlt, color: theme.text }}
            >
              <PixelHeart color={theme.accent} size={12} />
              <span className="font-pixel text-base">PROUDLY MADE IN THE PHILIPPINES</span>
            </div>
            <h1
              className="font-display text-5xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl"
              style={{ color: theme.text }}
            >
              Wherever you go,<br />
              <span style={{ color: theme.primary }}>someone&apos;s</span>{' '}
              <span style={{ color: theme.accent }}>always</span><br />
              by your side.
            </h1>
            <p
              className="mt-6 max-w-xl text-lg leading-relaxed"
              style={{ color: theme.textMuted }}
            >
              SabayPH is the trusted way to find your kasama for real-world adventures —
              from Rotary service projects to mountain climbs to weekend ride-shares.
              No more going alone.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                className="rounded-full px-7 py-6 text-base font-medium"
                style={{ background: theme.primary, color: theme.bg, border: 'none' }}
                onClick={() => scrollTo('waitlist')}
              >
                Join the waitlist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-7 py-6 text-base font-medium"
                style={{
                  borderColor: theme.text,
                  color: theme.text,
                  background: 'transparent',
                }}
                onClick={() => scrollTo('categories')}
              >
                Explore categories
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm" style={{ color: theme.textMuted }}>
              <div className="flex items-center gap-2">
                <Shield size={16} style={{ color: theme.primary }} />
                <span>Verified members</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} style={{ color: theme.primary }} />
                <span>Launching in Mindanao</span>
              </div>
            </div>
          </div>

          {/* Hero mascot card — uses real logo */}
          <div className="fade-rise relative" style={{ animationDelay: '150ms' }}>
            <div
              className="float-soft relative aspect-square overflow-hidden rounded-3xl"
              style={{
                background: theme.surface,
                border: `3px solid ${theme.text}`,
                boxShadow: `8px 8px 0 ${theme.text}`,
              }}
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                }}
              />
              <img
                src="/logo.png"
                alt="SabayPH mascot"
                className="absolute inset-0 h-full w-full object-contain p-8"
              />
              <div className="absolute right-4 top-4">
                <PixelHeart color={theme.accent} size={20} />
              </div>
              <div className="absolute bottom-4 left-4">
                <PixelPlus color={theme.highlight} size={14} />
              </div>
            </div>
            <div
              className="absolute -bottom-4 -right-4 rounded-full px-4 py-2 font-pixel text-lg shadow-lg"
              style={{ background: theme.accent, color: '#F1EDE1' }}
            >
              SABAY!
            </div>
          </div>
        </div>
      </section>

      {/* ============ CATEGORY TOGGLE ============ */}
      <section id="categories" className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-pixel text-base uppercase tracking-wide" style={{ color: theme.accent }}>
                Pick your vibe
              </p>
              <h2
                className="font-display mt-2 text-4xl font-bold leading-tight sm:text-5xl"
                style={{ color: theme.text }}
              >
                Seven ways to find<br />your people.
              </h2>
            </div>
            <p className="max-w-md text-base" style={{ color: theme.textMuted }}>
              Tap any category to preview the experience. Tap again to close.
              Rotary is live — the rest are launching soon.
            </p>
          </div>

          {/* ---- Category grid ---- */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-8">
            {/* Default / Heritage reset card */}
            <button
              onClick={() => setActiveCategory('heritage')}
              className="group relative flex flex-col items-center justify-center rounded-2xl p-4 transition-all duration-200 hover:scale-[1.03]"
              style={{
                background: activeCategory === 'heritage' ? theme.text : theme.surface,
                color: activeCategory === 'heritage' ? theme.bg : theme.text,
                border: `2px solid ${theme.text}`,
                minHeight: '168px',
              }}
            >
              <Sparkles size={28} strokeWidth={1.5} />
              <p className="font-display mt-3 text-base font-bold">Default</p>
              <p className="font-pixel text-xs opacity-70">HERITAGE</p>
            </button>

            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className="group relative flex flex-col items-center justify-center rounded-2xl p-4 transition-all duration-200 hover:scale-[1.03]"
                  style={{
                    background: isActive ? theme.primary : theme.surface,
                    color: isActive ? theme.bg : theme.text,
                    border: `2px solid ${isActive ? theme.primary : theme.border}`,
                    minHeight: '168px',
                    boxShadow: isActive ? `0 4px 20px ${theme.primary}40` : 'none',
                  }}
                >
                  {cat.status === 'live' && (
                    <Badge
                      className="absolute -top-2.5 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: theme.accent, color: '#F1EDE1', border: 'none' }}
                    >
                      LIVE
                    </Badge>
                  )}
                  {cat.status === 'soon' && (
                    <span
                      className="font-pixel absolute -top-2.5 right-3 rounded-sm px-2 py-0.5 text-[10px]"
                      style={{
                        background: isActive ? theme.highlight : theme.surfaceAlt,
                        color: isActive ? theme.text : theme.textMuted,
                      }}
                    >
                      SOON
                    </span>
                  )}
                  <cat.Icon size={28} strokeWidth={1.5} />
                  <p className="font-display mt-3 text-base font-bold">{cat.name}</p>
                  <p className="font-pixel text-xs opacity-70">{cat.tagline.toUpperCase()}</p>
                  {/* close hint on active */}
                  {isActive && (
                    <span
                      className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full opacity-60"
                      style={{ background: theme.bg }}
                    >
                      <X size={10} style={{ color: theme.primary }} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ---- Animated preview panel ---- */}
          {/* grid-template-rows trick: animates height without a fixed max-height */}
          <div
            ref={panelRef}
            style={{
              display: 'grid',
              gridTemplateRows: panelOpen ? '1fr' : '0fr',
              opacity: panelOpen ? 1 : 0,
              transition: 'grid-template-rows 500ms ease, opacity 400ms ease',
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              {displayCategory && (() => {
                const details = CATEGORY_DETAILS[displayCategory.id];
                return (
                  <div
                    className="mt-8 overflow-hidden rounded-3xl"
                    style={{
                      background: theme.surface,
                      border: `2px solid ${theme.border}`,
                      transition: 'background 600ms ease, border-color 600ms ease',
                    }}
                  >
                    <div className="grid lg:grid-cols-2">

                      {/* LEFT — image / mascot */}
                      <div
                        className="relative flex min-h-[280px] items-center justify-center overflow-hidden lg:min-h-[420px]"
                        style={{ background: theme.surfaceAlt, transition: 'background 600ms ease' }}
                      >
                        {/* pixel grid overlay */}
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
                            backgroundSize: '16px 16px',
                            opacity: 0.25,
                          }}
                        />

                        {displayCategory.image ? (
                          <img
                            src={displayCategory.image}
                            alt={`${displayCategory.name} mascot`}
                            className="relative z-10 h-56 w-56 object-contain drop-shadow-xl lg:h-72 lg:w-72"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        ) : (
                          <div className="relative z-10 flex flex-col items-center gap-4">
                            <div
                              className="flex h-32 w-32 items-center justify-center rounded-2xl"
                              style={{
                                background: theme.surface,
                                border: `3px solid ${theme.border}`,
                                boxShadow: `4px 4px 0 ${theme.border}`,
                              }}
                            >
                              <displayCategory.Icon size={64} strokeWidth={1.2} style={{ color: theme.primary }} />
                            </div>
                          </div>
                        )}

                        {/* category name plate at bottom */}
                        <div
                          className="absolute bottom-0 left-0 right-0 px-6 py-4"
                          style={{ background: `${theme.text}CC` }}
                        >
                          <p className="font-pixel text-xl" style={{ color: theme.highlight }}>
                            {displayCategory.name.toUpperCase()}
                          </p>
                          <p className="text-xs font-medium" style={{ color: `${theme.bg}CC` }}>
                            {displayCategory.tagline}
                          </p>
                        </div>

                        {/* pixel decorations */}
                        <div className="absolute right-4 top-4">
                          <PixelPlus color={theme.highlight} size={12} />
                        </div>
                        <div className="absolute left-4 top-4">
                          <PixelHeart color={theme.accent} size={16} />
                        </div>
                      </div>

                      {/* RIGHT — info */}
                      <div className="flex flex-col justify-center gap-6 p-8 lg:p-10">

                        {/* header */}
                        <div>
                          <div className="mb-3 flex items-center gap-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${displayCategory.status === 'live' ? '' : ''}`}
                              style={{
                                background: displayCategory.status === 'live' ? theme.accent : theme.surfaceAlt,
                                color: displayCategory.status === 'live' ? '#F1EDE1' : theme.textMuted,
                              }}
                            >
                              {displayCategory.status === 'live' ? 'AVAILABLE NOW' : 'COMING SOON'}
                            </span>
                          </div>
                          <h3 className="font-display text-3xl font-bold leading-tight sm:text-4xl" style={{ color: theme.text }}>
                            {displayCategory.name} rooms,<br />the SabayPH way.
                          </h3>
                          <p className="mt-3 text-base leading-relaxed" style={{ color: theme.textMuted }}>
                            {details?.description}
                          </p>
                        </div>

                        {/* highlights */}
                        {details?.highlights && (
                          <ul className="space-y-2.5">
                            {details.highlights.map((h, i) => (
                              <li key={i} className="flex items-center gap-3">
                                <div
                                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                                  style={{ background: theme.surfaceAlt, color: theme.primary }}
                                >
                                  <h.Icon size={16} strokeWidth={1.5} />
                                </div>
                                <span className="text-sm font-medium" style={{ color: theme.text }}>{h.label}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* stats row */}
                        {details?.stats && (
                          <div
                            className="grid grid-cols-3 gap-3 rounded-2xl p-4"
                            style={{ background: theme.surfaceAlt, transition: 'background 600ms ease' }}
                          >
                            {details.stats.map((s, i) => (
                              <div key={i} className="text-center">
                                <p className="font-display text-2xl font-extrabold" style={{ color: theme.primary }}>
                                  {s.value}
                                </p>
                                <p className="mt-0.5 text-xs" style={{ color: theme.textMuted }}>{s.label}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* CTA */}
                        <div className="flex items-center gap-3">
                          {displayCategory.status === 'live' ? (
                            <Button
                              className="rounded-full"
                              style={{ background: theme.primary, color: theme.bg, border: 'none' }}
                            >
                              Get started <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="rounded-full"
                              style={{ borderColor: theme.primary, color: theme.primary, background: 'transparent' }}
                              onClick={() => scrollTo('waitlist')}
                            >
                              Notify me when it launches
                            </Button>
                          )}
                          <button
                            className="text-xs font-medium underline underline-offset-2 hover:opacity-70"
                            style={{ color: theme.textMuted }}
                            onClick={() => setActiveCategory('heritage')}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="px-6 py-20 lg:px-12" style={{ background: theme.surfaceAlt, transition: 'background 600ms ease' }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl">
            <p className="font-pixel text-base uppercase tracking-wide" style={{ color: theme.accent }}>
              What you get
            </p>
            <h2 className="font-display mt-2 text-4xl font-bold leading-tight sm:text-5xl" style={{ color: theme.text }}>
              Built for real-world coordination, not endless scrolling.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 transition-all hover:-translate-y-1"
                style={{
                  background: theme.surface,
                  border: `2px solid ${theme.border}`,
                }}
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: theme.surfaceAlt, color: theme.primary }}
                >
                  <f.Icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl font-bold" style={{ color: theme.text }}>
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TRUST & SAFETY ============ */}
      <section id="trust" className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-pixel text-base uppercase tracking-wide" style={{ color: theme.accent }}>
                Trust comes first
              </p>
              <h2 className="font-display mt-2 text-4xl font-bold leading-tight sm:text-5xl" style={{ color: theme.text }}>
                Going with strangers shouldn&apos;t feel like one.
              </h2>
              <p className="mt-6 text-lg leading-relaxed" style={{ color: theme.textMuted }}>
                Every SabayPH room is built on verified identity, reputation history,
                and approval controls — so organizers stay in charge and members stay safe.
              </p>
              <ul className="mt-8 space-y-4">
                {TRUST_ITEMS.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div
                      className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ background: theme.primary, color: theme.bg }}
                    >
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="font-display font-bold" style={{ color: theme.text }}>{item.title}</p>
                      <p className="text-sm" style={{ color: theme.textMuted }}>{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="relative overflow-hidden rounded-3xl"
              style={{
                border: `3px solid ${theme.text}`,
                boxShadow: `8px 8px 0 ${theme.text}`,
                transition: 'border-color 600ms ease, box-shadow 600ms ease',
                background: theme.surfaceAlt,
              }}
            >
              {/* pixel-dot overlay */}
              <div
                className="absolute inset-0 z-10 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle, ${theme.text} 1.5px, transparent 1.5px)`,
                  backgroundSize: '24px 24px',
                }}
              />

              <img
                src="/safe.png"
                alt="SabayPH trust & safety mascot"
                className="relative z-20 w-full object-contain"
                style={{ imageRendering: 'pixelated', display: 'block' }}
              />

              {/* caption strip */}
              <div
                className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-between px-5 py-4"
                style={{ background: `${theme.text}D9` }}
              >
                <div>
                  <p className="font-pixel text-lg leading-none" style={{ color: theme.highlight }}>
                    VERIFIED MEMBER
                  </p>
                  <p className="mt-1 text-xs font-medium" style={{ color: `${theme.bg}CC` }}>
                    Identity checked. Reputation earned.
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <PixelHeart key={i} color={theme.accent} size={14} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TAGLINE / MANIFESTO BAND ============ */}
      <section
        className="px-6 py-24 lg:px-12"
        style={{
          background: theme.text,
          color: theme.bg,
          transition: 'all 600ms ease',
        }}
      >
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 flex justify-center gap-2">
            <PixelHeart color={theme.accent} size={20} />
            <PixelPlus color={theme.highlight} size={16} />
            <PixelHeart color={theme.accent} size={20} />
          </div>
          <p
            className="font-display text-4xl font-extrabold leading-[1.1] sm:text-6xl lg:text-7xl"
            style={{ color: theme.bg }}
          >
            <span style={{ color: theme.highlight }}>Sabay-sabay</span> tayo.<br />
            Mas masaya kapag kasama.
          </p>
          <p className="mx-auto mt-8 max-w-2xl text-lg opacity-80" style={{ color: theme.bg }}>
            We&apos;re building the trusted way Filipinos coordinate real-world adventures —
            from your barangay to the next island over.
          </p>
        </div>
      </section>

      {/* ============ WAITLIST ============ */}
      <section id="waitlist" className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-pixel text-base uppercase tracking-wide" style={{ color: theme.accent }}>
            Be the first kasama
          </p>
          <h2 className="font-display mt-2 text-4xl font-bold leading-tight sm:text-5xl" style={{ color: theme.text }}>
            Join the SabayPH waitlist.
          </h2>
          <p className="mt-4 text-lg" style={{ color: theme.textMuted }}>
            Get early access, exclusive launch perks, and a verified badge from day one.
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="h-12 rounded-full border-2 px-5 text-base"
                style={{
                  background: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                }}
              />
              <Button
                type="submit"
                className="h-12 rounded-full px-7 text-base font-medium"
                style={{ background: theme.primary, color: theme.bg, border: 'none' }}
              >
                Join waitlist
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div
              className="mx-auto mt-8 max-w-md rounded-2xl p-6"
              style={{ background: theme.surface, border: `2px solid ${theme.primary}` }}
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: theme.primary }}>
                <Check size={20} strokeWidth={3} style={{ color: theme.bg }} />
              </div>
              <p className="font-display text-xl font-bold" style={{ color: theme.text }}>
                Salamat, kasama!
              </p>
              <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
                You&apos;re on the list. We&apos;ll be in touch.
              </p>
            </div>
          )}

          <p className="mt-6 text-xs" style={{ color: theme.textMuted }}>
            No spam. Unsubscribe anytime. We respect your inbox.
          </p>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer
        className="px-6 py-12 lg:px-12"
        style={{
          background: theme.surfaceAlt,
          borderTop: `1px solid ${theme.border}`,
          transition: 'all 600ms ease',
        }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="SabayPH logo" className="h-10 w-10 object-contain" />
                <span className="font-display text-xl font-bold" style={{ color: theme.text }}>
                  Sabay<span style={{ color: theme.accent }}>PH</span>
                </span>
              </div>
              <p className="mt-3 max-w-sm text-sm" style={{ color: theme.textMuted }}>
                A trusted coordination platform for real-world group activity. Built in Mindanao, made for the Philippines.
              </p>
            </div>
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wide" style={{ color: theme.text }}>
                Product
              </p>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: theme.textMuted }}>
                <li><a href="#categories" className="hover:opacity-70">Categories</a></li>
                <li><a href="#features" className="hover:opacity-70">Features</a></li>
                <li><a href="#trust" className="hover:opacity-70">Trust & Safety</a></li>
              </ul>
            </div>
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wide" style={{ color: theme.text }}>
                Company
              </p>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: theme.textMuted }}>
                <li><a href="#" className="hover:opacity-70">About</a></li>
                <li><a href="#" className="hover:opacity-70">Contact</a></li>
                <li><a href="#" className="hover:opacity-70">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div
            className="mt-10 flex flex-col items-start justify-between gap-3 border-t pt-6 sm:flex-row sm:items-center"
            style={{ borderColor: theme.border }}
          >
            <p className="text-xs" style={{ color: theme.textMuted }}>
              © {new Date().getFullYear()} SabayPH. Made with <PixelHeart color={theme.accent} size={10} /> in the Philippines.
            </p>
            <p className="font-pixel text-sm" style={{ color: theme.accent }}>
              TARA, SABAY TAYO!
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
