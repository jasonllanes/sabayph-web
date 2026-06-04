import { useState, useEffect, lazy, Suspense } from 'react';
import {
  X, ChevronLeft, ChevronRight, Check, Lock, Unlock, Copy, Share2,
  Plus, Trash2, MapPin, Calendar, Users, Link, ShoppingBasket,
  DollarSign, Calculator, Handshake, Package,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { FacebookIcon, InstagramIcon, TwitterIcon } from '@/components/common/SocialIcons';
import type { Theme, Room, OtherSocial } from '@/types';
import type { MapLocation, MapPickerTheme } from '@/components/common/MapPicker';

const MapPicker = lazy(() => import('@/components/common/MapPicker'));

const isDark = (hex: string) => parseInt(hex.replace('#', '').slice(0, 2), 16) < 128;
const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PasaBuyPricingType = 'negotiation' | 'fixed' | 'auto';

export interface PasaBuyWizardData {
  // Info
  name: string;
  host_name: string;
  description: string;
  max_members: number;
  status: 'live' | 'soon';
  // Item
  item_name: string;
  item_notes: string;
  store_preference: string;
  // Meetup
  meetup_location: MapLocation | null;
  meetup_date: string;
  // Pricing
  pricing_type: PasaBuyPricingType;
  fixed_fee: number;
  item_budget: number;
  distance_km: number;
  // Access
  is_private: boolean;
  password: string;
  // Socials
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  other_socials: OtherSocial[];
  // Internal
  join_code: string;
}

interface PasaBuyWizardProps {
  theme: Theme;
  editing: Room | null;
  userId: string | undefined;
  onClose: () => void;
  onCreate: (data: PasaBuyWizardData) => Promise<{ error: string | null; room: Room | null }>;
  onUpdate: (id: string, data: Partial<PasaBuyWizardData>) => Promise<{ error: string | null }>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function estimatedFee(itemBudget: number, distanceKm: number): number {
  return Math.round(itemBudget * 0.1 + distanceKm * 50);
}

function buildDescription(data: PasaBuyWizardData): string {
  const lines: string[] = [];
  if (data.item_name) lines.push(`🛒 Item: ${data.item_name}`);
  if (data.item_notes) lines.push(`📝 Notes: ${data.item_notes}`);
  if (data.store_preference) lines.push(`🏪 Store: ${data.store_preference}`);
  lines.push('');
  if (data.pricing_type === 'negotiation') {
    lines.push('💬 Pricing: Open for negotiation — settle via socials');
  } else if (data.pricing_type === 'fixed') {
    lines.push(`💵 Service fee: ₱${data.fixed_fee.toLocaleString()}`);
  } else {
    const fee = estimatedFee(data.item_budget, data.distance_km);
    lines.push(`🧮 Estimated service fee: ₱${fee.toLocaleString()}`);
    lines.push(`   (10% of ₱${data.item_budget.toLocaleString()} item + ₱50 × ${data.distance_km} km)`);
  }
  if (data.description.trim()) {
    lines.push('');
    lines.push(data.description.trim());
  }
  return lines.join('\n');
}

function makeDefault(): PasaBuyWizardData {
  return {
    name: '', host_name: '', description: '', max_members: 5, status: 'live',
    item_name: '', item_notes: '', store_preference: '',
    meetup_location: null, meetup_date: '',
    pricing_type: 'negotiation', fixed_fee: 100, item_budget: 500, distance_km: 3,
    is_private: false, password: '',
    facebook_url: '', instagram_url: '', twitter_url: '', other_socials: [],
    join_code: '',
  };
}

function parseEditing(room: Room): PasaBuyWizardData {
  const d = makeDefault();
  return {
    ...d,
    name: room.name,
    host_name: room.host_name,
    description: room.description ?? '',
    max_members: room.max_members,
    status: room.status,
    meetup_location: room.location_lat != null && room.location_lng != null
      ? { lat: room.location_lat, lng: room.location_lng, name: room.location_name ?? '' }
      : null,
    meetup_date: room.event_date ? room.event_date.slice(0, 16) : '',
    is_private: room.is_private,
    password: room.password ?? '',
    facebook_url: room.facebook_url ?? '',
    instagram_url: room.instagram_url ?? '',
    twitter_url: room.twitter_url ?? '',
    other_socials: room.other_socials ?? [],
    join_code: room.join_code,
  };
}

const STEPS = ['Info', 'Item', 'Meetup', 'Pricing', 'Access', 'Socials'];

// ─── Step bar ──────────────────────────────────────────────────────────────────

function StepBar({ current, total, T }: { current: number; total: number; T: Theme }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
      {STEPS.map((label, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < total - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i <= current ? T.primary : T.surfaceAlt,
              border: `2px solid ${i <= current ? T.primary : T.border}`,
              color: i <= current ? T.bg : T.textMuted,
              fontSize: 12, fontWeight: 700, flexShrink: 0, transition: 'all 300ms ease',
            }}>
              {i < current ? <Check size={13} /> : i + 1}
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: i === current ? T.primary : T.textMuted, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
              {label.toUpperCase()}
            </span>
          </div>
          {i < total - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? T.primary : T.border, margin: '0 4px', marginBottom: 18, transition: 'background 300ms ease' }} />
          )}
        </div>
      ))}
    </div>
  );
}

const makeStyles = (T: Theme) => ({
  inp: {
    width: '100%', height: 46, padding: '0 14px', fontSize: 14,
    fontFamily: '"DM Sans", system-ui, sans-serif',
    border: `1.5px solid ${T.border}`, borderRadius: 10,
    background: T.bg, color: T.text, outline: 'none', boxSizing: 'border-box' as const,
  },
  lbl: {
    fontSize: 11, fontWeight: 700 as const, color: T.textMuted,
    display: 'block' as const, marginBottom: 5, letterSpacing: 0.5,
  },
});

// ─── Step 1: Info ──────────────────────────────────────────────────────────────

function Step1({ data, set, T }: { data: PasaBuyWizardData; set: <K extends keyof PasaBuyWizardData>(k: K, v: PasaBuyWizardData[K]) => void; T: Theme }) {
  const { inp, lbl } = makeStyles(T);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={lbl}>REQUEST NAME *</label>
        <input style={inp} value={data.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Pabili sa SM City Davao" />
      </div>
      <div>
        <label style={lbl}>YOUR NAME *</label>
        <input style={inp} value={data.host_name} onChange={e => set('host_name', e.target.value)} placeholder="Who is requesting?" />
      </div>
      <div>
        <label style={lbl}>ADDITIONAL NOTES</label>
        <textarea
          style={{ ...inp, height: 72, padding: '10px 14px', resize: 'vertical' }}
          value={data.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Any extra details for the buyer…"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={lbl}>MAX AGENTS</label>
          <input style={inp} type="number" min={1} max={20} value={data.max_members} onChange={e => set('max_members', parseInt(e.target.value) || 5)} />
          <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 0' }}>How many buyers can apply</p>
        </div>
        <div>
          <label style={lbl}>STATUS</label>
          <select style={{ ...inp, cursor: 'pointer' }} value={data.status} onChange={e => set('status', e.target.value as 'live' | 'soon')}>
            <option value="live">Live</option>
            <option value="soon">Soon</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Item Details ──────────────────────────────────────────────────────

function Step2({ data, set, T }: { data: PasaBuyWizardData; set: <K extends keyof PasaBuyWizardData>(k: K, v: PasaBuyWizardData[K]) => void; T: Theme }) {
  const { inp, lbl } = makeStyles(T);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 12, background: `${T.primary}0D`, border: `1px solid ${T.primary}33` }}>
        <ShoppingBasket size={20} style={{ color: T.primary, flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 13, color: T.text, margin: 0, lineHeight: 1.5 }}>
          Describe exactly what you want bought — brand, size, color, quantity. The more detail, the better!
        </p>
      </div>

      <div>
        <label style={lbl}>ITEM TO BUY *</label>
        <input style={inp} value={data.item_name} onChange={e => set('item_name', e.target.value)} placeholder="e.g. Jollibee Yumburger Meal with Large fries" />
      </div>
      <div>
        <label style={lbl}>SPECIFIC NOTES / VARIANTS</label>
        <textarea
          style={{ ...inp, height: 72, padding: '10px 14px', resize: 'vertical' }}
          value={data.item_notes}
          onChange={e => set('item_notes', e.target.value)}
          placeholder="e.g. No onions, size M, SKU #12345, blue color…"
        />
      </div>
      <div>
        <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Package size={11} /> STORE / SHOP PREFERENCE
        </label>
        <input style={inp} value={data.store_preference} onChange={e => set('store_preference', e.target.value)} placeholder="e.g. SM City Davao, Gaisano Mall, any 7-Eleven…" />
        <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 0' }}>Leave blank if you're open to any store</p>
      </div>
    </div>
  );
}

// ─── Step 3: Meetup ────────────────────────────────────────────────────────────

function Step3({ data, set, T }: { data: PasaBuyWizardData; set: <K extends keyof PasaBuyWizardData>(k: K, v: PasaBuyWizardData[K]) => void; T: Theme }) {
  const { inp, lbl } = makeStyles(T);
  const mapTheme: MapPickerTheme = {
    primary: T.primary, bg: T.bg, surface: T.surface,
    surfaceAlt: T.surfaceAlt, text: T.text, textMuted: T.textMuted, border: T.border,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={lbl}>MEETUP DATE & TIME *</label>
        <div style={{ position: 'relative' }}>
          <Calendar size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
          <input
            style={{ ...inp, paddingLeft: 36, colorScheme: isDark(T.bg) ? 'dark' : 'light' }}
            type="datetime-local"
            value={data.meetup_date}
            onChange={e => set('meetup_date', e.target.value)}
          />
        </div>
        <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 0' }}>When and where to exchange the item and payment</p>
      </div>

      <div>
        <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MapPin size={11} /> MEETUP / HANDOFF LOCATION
        </label>
        <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 8px', lineHeight: 1.5 }}>
          Pin the exact spot where you'll receive your item and hand over payment.
        </p>
        <Suspense fallback={<div style={{ height: 260, background: T.surfaceAlt, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: 13 }}>Loading map…</div>}>
          <MapPicker value={data.meetup_location} onChange={loc => set('meetup_location', loc)} theme={mapTheme} />
        </Suspense>
        {data.meetup_location && (
          <div style={{ marginTop: 10 }}>
            <label style={lbl}>LOCATION NAME (editable)</label>
            <input style={inp} value={data.meetup_location.name} onChange={e => set('meetup_location', { ...data.meetup_location!, name: e.target.value })} placeholder="e.g. SM City Davao Ground Floor Entrance" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 4: Pricing ───────────────────────────────────────────────────────────

function Step4({ data, set, T }: { data: PasaBuyWizardData; set: <K extends keyof PasaBuyWizardData>(k: K, v: PasaBuyWizardData[K]) => void; T: Theme }) {
  const { inp, lbl } = makeStyles(T);

  const autoFee = estimatedFee(data.item_budget, data.distance_km);

  const options: { type: PasaBuyPricingType; icon: React.ReactNode; label: string; sub: string }[] = [
    {
      type: 'negotiation',
      icon: <Handshake size={20} style={{ color: '#7C3AED' }} />,
      label: 'Negotiation',
      sub: 'No fee set — you and the buyer settle the amount via socials',
    },
    {
      type: 'fixed',
      icon: <DollarSign size={20} style={{ color: '#059669' }} />,
      label: 'Fixed Service Fee',
      sub: 'You declare a flat service fee that the buyer pays on top of the item price',
    },
    {
      type: 'auto',
      icon: <Calculator size={20} style={{ color: T.primary }} />,
      label: 'Auto-Estimate',
      sub: 'System estimates fee: 10% of item price + ₱50 per km traveled',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 13, color: T.textMuted, margin: 0, lineHeight: 1.6 }}>
        How will the service fee be calculated? This is on top of the item's actual price.
      </p>

      {options.map(({ type, icon, label, sub }) => {
        const active = data.pricing_type === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => set('pricing_type', type)}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 14, border: `2px solid ${active ? T.primary : T.border}`,
              background: active ? `${T.primary}10` : T.surfaceAlt,
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              display: 'flex', alignItems: 'flex-start', gap: 14, transition: 'all 150ms ease',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: active ? `${T.primary}18` : T.surface, border: `1.5px solid ${active ? T.primary : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>{label}</p>
                {active && <Check size={14} style={{ color: T.primary }} />}
              </div>
              <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.4 }}>{sub}</p>
            </div>
          </button>
        );
      })}

      {data.pricing_type === 'fixed' && (
        <div style={{ padding: 14, borderRadius: 12, background: `#05966918`, border: '1.5px solid #05966944' }}>
          <label style={{ ...lbl, color: '#059669' }}>FIXED SERVICE FEE (₱)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, fontWeight: 700, color: '#059669' }}>₱</span>
            <input
              style={{ ...inp, paddingLeft: 30, borderColor: '#05966966', background: '#fff' }}
              type="number"
              min={0}
              value={data.fixed_fee}
              onChange={e => set('fixed_fee', parseFloat(e.target.value) || 0)}
              placeholder="e.g. 100"
            />
          </div>
          <p style={{ fontSize: 11, color: '#059669', margin: '6px 0 0' }}>Buyer pays ₱{data.fixed_fee.toLocaleString()} on top of the item price</p>
        </div>
      )}

      {data.pricing_type === 'auto' && (
        <div style={{ padding: 14, borderRadius: 12, background: `${T.primary}08`, border: `1.5px solid ${T.primary}33` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ ...lbl, color: T.primary }}>ITEM BUDGET (₱)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 700, color: T.primary }}>₱</span>
                <input style={{ ...inp, paddingLeft: 30, background: '#fff' }} type="number" min={0} value={data.item_budget} onChange={e => set('item_budget', parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div>
              <label style={{ ...lbl, color: T.primary }}>DISTANCE TO STORE (km)</label>
              <input style={{ ...inp, background: '#fff' }} type="number" min={0} step={0.5} value={data.distance_km} onChange={e => set('distance_km', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 10, background: T.primary, color: T.bg, textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, margin: '0 0 2px', letterSpacing: 0.5, opacity: 0.8 }}>ESTIMATED SERVICE FEE</p>
            <p style={{ fontFamily: '"Bricolage Grotesque",serif', fontSize: 28, fontWeight: 800, margin: 0 }}>₱{autoFee.toLocaleString()}</p>
            <p style={{ fontSize: 11, margin: '4px 0 0', opacity: 0.75 }}>10% × ₱{data.item_budget.toLocaleString()} + ₱50 × {data.distance_km} km</p>
          </div>
          <p style={{ fontSize: 11, color: T.textMuted, margin: '8px 0 0', lineHeight: 1.5 }}>
            This is an estimate. Final amount may vary based on actual distance and agreement.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Access ────────────────────────────────────────────────────────────

function Step5({ data, set, T }: { data: PasaBuyWizardData; set: <K extends keyof PasaBuyWizardData>(k: K, v: PasaBuyWizardData[K]) => void; T: Theme }) {
  const { inp, lbl } = makeStyles(T);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={lbl}><Users size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />MAX BUYER AGENTS</label>
        <input style={inp} type="number" min={1} max={20} value={data.max_members} onChange={e => set('max_members', parseInt(e.target.value) || 5)} />
        <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 0' }}>How many people can apply to do the buying for you</p>
      </div>

      <div>
        <label style={lbl}>ROOM VISIBILITY</label>
        <button
          type="button"
          onClick={() => set('is_private', !data.is_private)}
          style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1.5px solid ${data.is_private ? T.primary : T.border}`, background: data.is_private ? `${T.primary}12` : T.surfaceAlt, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit' }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 10, background: data.is_private ? T.primary : T.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {data.is_private ? <Lock size={18} style={{ color: T.bg }} /> : <Unlock size={18} style={{ color: T.bg }} />}
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 2px' }}>{data.is_private ? 'Private Room' : 'Public Room'}</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>{data.is_private ? 'Requires a password to join' : 'Anyone with the join code can apply'}</p>
          </div>
          <div style={{ width: 44, height: 24, borderRadius: 12, background: data.is_private ? T.primary : T.border, position: 'relative', transition: 'background 250ms', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 3, left: data.is_private ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 250ms', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
          </div>
        </button>
        {data.is_private && (
          <div style={{ marginTop: 10 }}>
            <label style={lbl}>ROOM PASSWORD</label>
            <input style={inp} type="text" value={data.password} onChange={e => set('password', e.target.value)} placeholder="Set a passcode for this request" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 6: Socials ───────────────────────────────────────────────────────────

function Step6({ data, set, T, userId }: { data: PasaBuyWizardData; set: <K extends keyof PasaBuyWizardData>(k: K, v: PasaBuyWizardData[K]) => void; T: Theme; userId?: string }) {
  const { inp, lbl } = makeStyles(T);
  const { profile } = useProfile(userId);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (profile && !applied) {
      if (!data.facebook_url && profile.facebook_url) set('facebook_url', profile.facebook_url);
      if (!data.instagram_url && profile.instagram_url) set('instagram_url', profile.instagram_url);
      if (!data.twitter_url && profile.twitter_url) set('twitter_url', profile.twitter_url);
      setApplied(true);
    }
  }, [profile, applied]);

  const addOther = () => set('other_socials', [...data.other_socials, { id: uid(), label: '', url: '' }]);
  const updateOther = (id: string, field: 'label' | 'url', val: string) =>
    set('other_socials', data.other_socials.map(s => s.id === id ? { ...s, [field]: val } : s));
  const removeOther = (id: string) =>
    set('other_socials', data.other_socials.filter(s => s.id !== id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>
        Where can the buyer reach you to confirm details? Auto-filled from your profile if set.
      </p>

      {[
        { key: 'facebook_url' as const, Icon: FacebookIcon, ph: 'https://facebook.com/yourpage', color: '#1877F2' },
        { key: 'instagram_url' as const, Icon: InstagramIcon, ph: 'https://instagram.com/yourhandle', color: '#E4405F' },
        { key: 'twitter_url' as const, Icon: TwitterIcon, ph: 'https://x.com/yourhandle', color: '#1DA1F2' },
      ].map(({ key, Icon, ph, color }) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={16} color={color} />
          </div>
          <input style={{ ...inp, flex: 1 }} value={data[key]} onChange={e => set(key, e.target.value)} placeholder={ph} />
        </div>
      ))}

      <div style={{ paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
        <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link size={11} /> OTHER CONTACT LINKS
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.other_socials.map(s => (
            <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input style={{ ...inp, width: 110, flex: 'none' }} value={s.label} onChange={e => updateOther(s.id, 'label', e.target.value)} placeholder="Label" />
              <input style={{ ...inp, flex: 1 }} value={s.url} onChange={e => updateOther(s.id, 'url', e.target.value)} placeholder="https://…" />
              <button onClick={() => removeOther(s.id)} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#B91C1C', flexShrink: 0 }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addOther}
          style={{ marginTop: 10, width: '100%', height: 40, borderRadius: 20, border: `1.5px dashed ${T.border}`, background: 'none', color: T.textMuted, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Plus size={13} /> Add custom link
        </button>
      </div>
    </div>
  );
}

// ─── Success screen ─────────────────────────────────────────────────────────────

function SuccessScreen({ room, onClose, T }: { room: Room; onClose: () => void; T: Theme }) {
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(room.join_code);
    setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000);
  };
  const copyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?join=${room.join_code}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEF3C7', border: '2px solid #FCD34D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Check size={28} style={{ color: '#D97706' }} />
      </div>
      <h3 style={{ fontFamily: '"Bricolage Grotesque",serif', fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 6px' }}>PasaBuy request posted!</h3>
      <p style={{ fontSize: 14, color: T.textMuted, margin: '0 0 24px' }}>Share the join code so buyers can apply. Negotiate and confirm via your socials.</p>

      <div style={{ padding: '16px', borderRadius: 16, background: `${T.primary}10`, border: `2px solid ${T.primary}33`, marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.primary, margin: '0 0 4px', letterSpacing: 1 }}>JOIN CODE</p>
        <p style={{ fontFamily: '"Bricolage Grotesque",serif', fontSize: 28, fontWeight: 800, color: T.primary, margin: '0 0 12px', letterSpacing: 3 }}>{room.join_code}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copyCode} style={{ flex: 1, height: 38, borderRadius: 19, border: `1.5px solid ${T.primary}`, background: codeCopied ? T.primary : 'transparent', color: codeCopied ? T.bg : T.primary, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 200ms' }}>
            {codeCopied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Code</>}
          </button>
          <button onClick={copyLink} style={{ flex: 1, height: 38, borderRadius: 19, border: `1.5px solid ${T.border}`, background: linkCopied ? T.primary : T.surfaceAlt, color: linkCopied ? T.bg : T.text, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 200ms' }}>
            {linkCopied ? <><Check size={13} /> Copied!</> : <><Share2 size={13} /> Share Link</>}
          </button>
        </div>
      </div>
      <button onClick={onClose} style={{ width: '100%', height: 48, borderRadius: 24, border: 'none', background: T.primary, color: T.bg, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
        Done
      </button>
    </div>
  );
}

// ─── Main Wizard ────────────────────────────────────────────────────────────────

export default function PasaBuyWizard({ theme: T, editing, userId, onClose, onCreate, onUpdate }: PasaBuyWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<PasaBuyWizardData>(() => editing ? parseEditing(editing) : makeDefault());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null);

  const set = <K extends keyof PasaBuyWizardData>(k: K, v: PasaBuyWizardData[K]) =>
    setData(prev => ({ ...prev, [k]: v }));

  const validate = (): string => {
    if (step === 0) {
      if (!data.name.trim()) return 'Request name is required.';
      if (!data.host_name.trim()) return 'Your name is required.';
    }
    if (step === 1 && !data.item_name.trim()) return 'Item description is required.';
    if (step === 4 && data.is_private && !data.password.trim()) return 'Enter a password for the private room.';
    return '';
  };

  const next = () => {
    const err = validate(); if (err) { setError(err); return; }
    setError('');
    if (step < STEPS.length - 1) { setStep(s => s + 1); return; }
    handleSave();
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    const assembled = { ...data, description: buildDescription(data) };

    if (editing) {
      const { meetup_location, ...rest } = assembled;
      const payload = {
        ...rest,
        event_date:    rest.meetup_date    || null,
        password:      rest.password       || null,
        description:   rest.description    || null,
        facebook_url:  rest.facebook_url   || null,
        instagram_url: rest.instagram_url  || null,
        twitter_url:   rest.twitter_url    || null,
        location_lat:  meetup_location?.lat  ?? null,
        location_lng:  meetup_location?.lng  ?? null,
        location_name: meetup_location?.name || null,
        category:      'pasabuy',
      };
      const { error: err } = await onUpdate(editing.id, payload as unknown as Partial<PasaBuyWizardData>);
      setSaving(false);
      if (err) { setError(err); return; }
      onClose();
    } else {
      const { error: err, room } = await onCreate(assembled);
      setSaving(false);
      if (err) { setError(err); return; }
      if (room) setCreatedRoom(room);
    }
  };

  const stepProps = { data, set, T };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=VT323&display=swap'); .font-display{font-family:'Bricolage Grotesque',serif;letter-spacing:-0.02em;} .font-pixel{font-family:'VT323',monospace;}`}</style>

      <div style={{ width: '100%', maxWidth: 540, background: T.surface, borderRadius: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', maxHeight: '95vh' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <ShoppingBasket size={18} style={{ color: T.primary }} />
                <h2 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0 }}>
                  {createdRoom ? 'Request Posted!' : editing ? 'Edit PasaBuy' : 'New PasaBuy Request'}
                </h2>
              </div>
              {!createdRoom && (
                <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
                  {editing ? 'Update your request details' : `Step ${step + 1} of ${STEPS.length} — ${STEPS[step]}`}
                </p>
              )}
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${T.border}`, background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.textMuted }}>
              <X size={16} />
            </button>
          </div>
          {!createdRoom && <StepBar current={step} total={STEPS.length} T={T} />}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px' }}>
          {createdRoom
            ? <SuccessScreen room={createdRoom} onClose={onClose} T={T} />
            : step === 0 ? <Step1 {...stepProps} />
              : step === 1 ? <Step2 {...stepProps} />
                : step === 2 ? <Step3 {...stepProps} />
                  : step === 3 ? <Step4 {...stepProps} />
                    : step === 4 ? <Step5 {...stepProps} />
                      : <Step6 {...stepProps} userId={userId} />
          }
        </div>

        {/* Footer */}
        {!createdRoom && (
          <div style={{ padding: '16px 28px 24px', flexShrink: 0, borderTop: `1px solid ${T.border}` }}>
            {error && (
              <div style={{ padding: '8px 12px', background: '#FEE2E2', borderRadius: 8, border: '1px solid #FCA5A5', marginBottom: 12 }}>
                <p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>{error}</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              {step > 0 && (
                <button onClick={() => { setStep(s => s - 1); setError(''); }} style={{ height: 46, paddingInline: 20, borderRadius: 23, border: `1.5px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              <button
                onClick={next}
                disabled={saving}
                style={{ flex: 1, height: 46, borderRadius: 23, border: 'none', background: saving ? T.border : T.primary, color: saving ? T.textMuted : T.bg, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {saving ? 'Saving…' : step === STEPS.length - 1
                  ? <>{editing ? 'Save Changes' : 'Post Request'} <Check size={16} /></>
                  : <>Next <ChevronRight size={16} /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
