import { useState, useEffect, lazy, Suspense } from 'react';
import {
  X, ChevronLeft, ChevronRight, Check, Lock, Unlock, Copy, Share2,
  Plus, Trash2, MapPin, Calendar, Users, Link, ShoppingBasket,
  DollarSign, Handshake, Package, Clock, ToggleLeft, ToggleRight,
  AlertCircle, UserCheck,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { FacebookIcon, InstagramIcon, TwitterIcon } from '@/components/common/SocialIcons';
import type { Theme, Room, OtherSocial } from '@/types';
import type { MapLocation, MapPickerTheme } from '@/components/common/MapPicker';

const MapPicker = lazy(() => import('@/components/common/MapPicker'));

const isDark = (hex: string) => parseInt(hex.replace('#', '').slice(0, 2), 16) < 128;
const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ServiceFeeMode = 'fixed' | 'negotiable' | 'distance_based';
export type OverageRule = 'hard_cap' | 'allow_over' | 'reimburse';
export type ApprovalMode = 'auto' | 'manual';

export interface PasaBuyItemRow {
  id: string;
  name: string;
  qty: number;
  unit: string;
  brand: string;
  max_price: number | null;
  substitute: boolean;
}

export interface PasaBuyWizardData {
  // Step 1 — Info
  name: string;
  host_name: string;
  description: string;
  max_members: number;
  status: 'live' | 'soon' | 'confirmed' | 'completed' | 'cancelled';
  // Step 2 — Items
  items: PasaBuyItemRow[];
  item_list_notes: string;
  store_area: string;
  // Step 3 — Meetup
  meetup_location: MapLocation | null;
  dropoff_location: MapLocation | null;
  dropoff_instructions: string;
  needed_by: string;
  flexible_timing: boolean;
  // Step 4 — Pricing
  goods_budget: number;
  overage_rule: OverageRule;
  service_fee_mode: ServiceFeeMode;
  service_fee_amount: number;
  // Step 5 — Access
  is_private: boolean;
  password: string;
  approval_mode: ApprovalMode;
  // Step 6 — Socials
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

const UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'pack', 'box', 'bottle', 'can', 'dozen'];

function buildDescription(data: PasaBuyWizardData): string {
  const lines: string[] = [];
  if (data.store_area) lines.push(`🏪 Buy from: ${data.store_area}`);
  if (data.items.length) {
    lines.push(`🛒 Items (${data.items.length}):`);
    data.items.forEach(it => {
      let row = `  • ${it.qty} ${it.unit} ${it.name}`;
      if (it.brand) row += ` (${it.brand})`;
      if (it.max_price != null) row += ` — max ₱${it.max_price}`;
      if (it.substitute) row += ' [sub OK]';
      lines.push(row);
    });
  }
  if (data.item_list_notes) lines.push(`📝 ${data.item_list_notes}`);
  if (data.dropoff_location?.name) lines.push(`📍 Dropoff: ${data.dropoff_location.name}`);
  if (data.dropoff_instructions) lines.push(`   ${data.dropoff_instructions}`);
  lines.push('');
  lines.push(`💰 Goods budget: ₱${data.goods_budget.toLocaleString()}`);
  if (data.service_fee_mode === 'fixed') {
    lines.push(`💵 Service fee: ₱${data.service_fee_amount.toLocaleString()} (fixed)`);
  } else if (data.service_fee_mode === 'negotiable') {
    lines.push('💬 Service fee: Negotiable — settle with buyer');
  } else {
    lines.push('📏 Service fee: Distance-based (computed after match)');
  }
  if (data.description.trim()) { lines.push(''); lines.push(data.description.trim()); }
  return lines.join('\n');
}

function makeDefault(): PasaBuyWizardData {
  return {
    name: '', host_name: '', description: '', max_members: 5, status: 'live',
    items: [], item_list_notes: '', store_area: '',
    meetup_location: null, dropoff_location: null, dropoff_instructions: '',
    needed_by: '', flexible_timing: false,
    goods_budget: 500, overage_rule: 'reimburse',
    service_fee_mode: 'negotiable', service_fee_amount: 100,
    is_private: false, password: '', approval_mode: 'auto',
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
    items: (room.items ?? []) as PasaBuyItemRow[],
    store_area: room.location_name ?? '',
    meetup_location: room.location_lat != null && room.location_lng != null
      ? { lat: room.location_lat, lng: room.location_lng, name: room.location_name ?? '' }
      : null,
    dropoff_location: room.dropoff_lat != null && room.dropoff_lng != null
      ? { lat: room.dropoff_lat, lng: room.dropoff_lng, name: room.dropoff_name ?? '' }
      : null,
    needed_by: room.needed_by ? room.needed_by.slice(0, 16) : (room.event_date ? room.event_date.slice(0, 16) : ''),
    goods_budget: room.goods_budget ?? 500,
    service_fee_mode: (room.service_fee_mode as ServiceFeeMode) ?? 'negotiable',
    service_fee_amount: room.service_fee_amount ?? 100,
    overage_rule: (room.overage_rule as OverageRule) ?? 'reimburse',
    approval_mode: (room.approval_mode as ApprovalMode) ?? 'auto',
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
        <label style={lbl}>What is your request called? *</label>
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

// ─── Step 2: Item List ─────────────────────────────────────────────────────────

function Step2({ data, set, T }: { data: PasaBuyWizardData; set: <K extends keyof PasaBuyWizardData>(k: K, v: PasaBuyWizardData[K]) => void; T: Theme }) {
  const { inp, lbl } = makeStyles(T);

  const addItem = () => set('items', [...data.items, { id: uid(), name: '', qty: 1, unit: 'pcs', brand: '', max_price: null, substitute: false }]);

  const updItem = (id: string, patch: Partial<PasaBuyItemRow>) =>
    set('items', data.items.map(it => it.id === id ? { ...it, ...patch } : it));

  const delItem = (id: string) => set('items', data.items.filter(it => it.id !== id));

  const estimatedSubtotal = data.items.reduce((sum, it) => sum + (it.max_price ?? 0) * it.qty, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Store preference */}
      <div>
        <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Package size={11} /> STORE / AREA TO BUY FROM
        </label>
        <input style={inp} value={data.store_area} onChange={e => set('store_area', e.target.value)} placeholder="e.g. any SM Supermarket, Gaisano Mall…" />
        <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 0' }}>Leave blank if open to any store</p>
      </div>

      {/* Item rows */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ ...lbl, margin: 0 }}>SHOPPING LIST *</label>
          {data.items.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: T.primary }}>
              {data.items.length} item{data.items.length !== 1 ? 's' : ''}
              {estimatedSubtotal > 0 ? ` · est. ₱${estimatedSubtotal.toLocaleString()}` : ''}
            </span>
          )}
        </div>

        {data.items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', border: `2px dashed ${T.border}`, borderRadius: 14 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🛒</div>
            <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>No items yet — add your first item below</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.items.map((item, idx) => (
              <div key={item.id} style={{ background: T.surfaceAlt, borderRadius: 12, padding: 12, border: `1.5px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: T.primary, background: `${T.primary}18`, padding: '2px 9px', borderRadius: 20 }}>Item {idx + 1}</span>
                  <button onClick={() => delItem(item.id)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #FCA5A5', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#B91C1C' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <input style={{ ...inp, fontWeight: 600 }} value={item.name} onChange={e => updItem(item.id, { name: e.target.value })} placeholder="Item name *" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <label style={{ ...lbl, fontSize: 9 }}>QTY</label>
                    <input style={{ ...inp, height: 38 }} type="number" min={1} value={item.qty} onChange={e => updItem(item.id, { qty: parseInt(e.target.value) || 1 })} />
                  </div>
                  <div>
                    <label style={{ ...lbl, fontSize: 9 }}>UNIT</label>
                    <select style={{ ...inp, height: 38, cursor: 'pointer' }} value={item.unit} onChange={e => updItem(item.id, { unit: e.target.value })}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...lbl, fontSize: 9 }}>MAX PRICE (₱)</label>
                    <input style={{ ...inp, height: 38 }} type="number" min={0} value={item.max_price ?? ''} onChange={e => updItem(item.id, { max_price: e.target.value ? parseFloat(e.target.value) : null })} placeholder="optional" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                  <input style={{ ...inp, height: 38, fontSize: 13 }} value={item.brand} onChange={e => updItem(item.id, { brand: e.target.value })} placeholder="Brand / spec (optional)" />
                  <button
                    type="button"
                    onClick={() => updItem(item.id, { substitute: !item.substitute })}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', height: 38, borderRadius: 19, border: `1.5px solid ${item.substitute ? T.primary : T.border}`, background: item.substitute ? `${T.primary}12` : 'transparent', color: item.substitute ? T.primary : T.textMuted, fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 150ms' }}
                  >
                    {item.substitute ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    Sub OK
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={addItem} style={{ marginTop: 10, width: '100%', height: 42, borderRadius: 21, border: `2px dashed ${T.primary}`, background: `${T.primary}08`, color: T.primary, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Plus size={14} /> Add Item
        </button>
      </div>

      {/* List-wide notes */}
      <div>
        <label style={lbl}>LIST NOTES (optional)</label>
        <textarea style={{ ...inp, height: 64, padding: '10px 14px', resize: 'vertical', fontSize: 13 }} value={data.item_list_notes} onChange={e => set('item_list_notes', e.target.value)} placeholder="e.g. get the ripe ones, check frozen section, brand X only…" />
      </div>
    </div>
  );
}

// ─── Step 3: Meetup / Dropoff ──────────────────────────────────────────────────

function Step3({ data, set, T }: { data: PasaBuyWizardData; set: <K extends keyof PasaBuyWizardData>(k: K, v: PasaBuyWizardData[K]) => void; T: Theme }) {
  const { inp, lbl } = makeStyles(T);
  const mapTheme: MapPickerTheme = {
    primary: T.primary, bg: T.bg, surface: T.surface,
    surfaceAlt: T.surfaceAlt, text: T.text, textMuted: T.textMuted, border: T.border,
  };
  const [locating, setLocating] = useState(false);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let name = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`);
          const json = await res.json();
          if (json.display_name) name = json.display_name;
        } catch { /* fallback to coords */ }
        set('dropoff_location', { lat, lng, name });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Past-date/time guards
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nowTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const selectedDate = data.needed_by ? data.needed_by.split('T')[0] : '';
  const selectedTime = data.needed_by ? (data.needed_by.split('T')[1] || '') : '';
  const isToday = selectedDate === todayStr;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Needed by — split into date + time so each picker closes on selection */}
      <div>
        <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock size={11} /> NEEDED BY *
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {/* Date */}
          <div style={{ position: 'relative' }}>
            <Calendar size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
            <input
              style={{ ...inp, paddingLeft: 34, colorScheme: isDark(T.bg) ? 'dark' : 'light' }}
              type="date"
              min={todayStr}
              value={selectedDate}
              onChange={e => {
                const date = e.target.value;
                // If switching to today and the stored time is already past, bump to now
                const time = (date === todayStr && selectedTime && selectedTime <= nowTimeStr)
                  ? nowTimeStr
                  : (selectedTime || '00:00');
                set('needed_by', date ? `${date}T${time}` : '');
              }}
            />
          </div>
          {/* Time */}
          <div style={{ position: 'relative', paddingRight: 8 }}>
            <Clock size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
            <input
              style={{ ...inp, paddingLeft: 34, colorScheme: isDark(T.bg) ? 'dark' : 'light' }}
              type="time"
              min={isToday ? nowTimeStr : undefined}
              value={selectedTime}
              onChange={e => {
                const time = e.target.value;
                const date = selectedDate || todayStr;
                set('needed_by', time ? `${date}T${time}` : '');
              }}
            />
          </div>
        </div>
        {/* Flexible timing toggle */}
        <button type="button" onClick={() => set('flexible_timing', !data.flexible_timing)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
          <div style={{ width: 36, height: 20, borderRadius: 10, background: data.flexible_timing ? T.primary : T.border, position: 'relative', transition: 'background 200ms', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 2, left: data.flexible_timing ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 200ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.textMuted }}>Flexible timing — I can adjust if needed</span>
        </button>
      </div>

      {/* Dropoff location */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
            <MapPin size={11} /> DROPOFF LOCATION *
          </label>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, border: `1.5px solid ${T.primary}55`, background: `${T.primary}10`, color: T.primary, fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: locating ? 'default' : 'pointer', opacity: locating ? 0.6 : 1 }}
          >
            <MapPin size={11} /> {locating ? 'Locating…' : 'Use My Location'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 8px', lineHeight: 1.5 }}>
          Where should the buyer deliver the items to you? Pin the exact spot.
        </p>
        <Suspense fallback={<div style={{ height: 240, background: T.surfaceAlt, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: 13 }}>Loading map…</div>}>
          <MapPicker value={data.dropoff_location} onChange={loc => set('dropoff_location', loc)} theme={mapTheme} />
        </Suspense>
        {data.dropoff_location && (
          <div style={{ marginTop: 10 }}>
            <label style={lbl}>DROPOFF LOCATION NAME</label>
            <input style={inp} value={data.dropoff_location.name} onChange={e => set('dropoff_location', { ...data.dropoff_location!, name: e.target.value })} placeholder="e.g. Gate 2, Landmark near the guard post" />
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <label style={lbl}>DROPOFF INSTRUCTIONS (optional)</label>
          <input style={inp} value={data.dropoff_instructions} onChange={e => set('dropoff_instructions', e.target.value)} placeholder="e.g. Gate code 1234, ask for Jason at reception" />
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Pricing ───────────────────────────────────────────────────────────

function Step4({ data, set, T }: { data: PasaBuyWizardData; set: <K extends keyof PasaBuyWizardData>(k: K, v: PasaBuyWizardData[K]) => void; T: Theme }) {
  const { inp, lbl } = makeStyles(T);

  const feeModes: { mode: ServiceFeeMode; icon: React.ReactNode; label: string; sub: string }[] = [
    { mode: 'negotiable', icon: <Handshake size={18} style={{ color: '#7C3AED' }} />, label: 'Negotiable', sub: 'Left open — you and the buyer agree on a fee' },
    { mode: 'fixed', icon: <DollarSign size={18} style={{ color: '#059669' }} />, label: 'Fixed Fee', sub: 'You set a flat service fee upfront' },
    // { mode: 'distance_based', icon: <MapPin size={18} style={{ color: T.primary }} />, label: 'Distance-based', sub: 'Computed after buyer is matched based on km' },
  ];

  const overageOpts: { rule: OverageRule; label: string }[] = [
    { rule: 'hard_cap', label: 'Hard cap — stop at budget' },
    // { rule: 'allow_over', label: 'Allow up to ₱___ over budget' },
    { rule: 'reimburse', label: 'Reimburse on receipt (track actual)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Goods budget */}
      <div>
        <label style={lbl}>ESTIMATED GOODS BUDGET (₱) *</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, fontWeight: 700, color: T.primary }}>₱</span>
          <input style={{ ...inp, paddingLeft: 30 }} type="number" min={0} value={data.goods_budget} onChange={e => set('goods_budget', parseFloat(e.target.value) || 0)} placeholder="e.g. 500" />
        </div>
        <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 0' }}>Money for the groceries/items — separate from the service fee</p>
      </div>

      {/* Overage rule */}
      <div>
        <label style={lbl}>IF ITEMS EXCEED BUDGET</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {overageOpts.map(({ rule, label }) => (
            <button key={rule} type="button" onClick={() => set('overage_rule', rule)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${data.overage_rule === rule ? T.primary : T.border}`, background: data.overage_rule === rule ? `${T.primary}10` : T.surfaceAlt, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${data.overage_rule === rule ? T.primary : T.border}`, background: data.overage_rule === rule ? T.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {data.overage_rule === rule && <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.bg }} />}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Service fee mode */}
      <div>
        <label style={lbl}>SERVICE FEE MODE</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {feeModes.map(({ mode, icon, label, sub }) => {
            const active = data.service_fee_mode === mode;
            return (
              <button key={mode} type="button" onClick={() => set('service_fee_mode', mode)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 12, border: `2px solid ${active ? T.primary : T.border}`, background: active ? `${T.primary}08` : T.surfaceAlt, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 150ms' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: active ? `${T.primary}18` : T.surface, border: `1.5px solid ${active ? T.primary : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{label}</span>
                    {active && <Check size={13} style={{ color: T.primary }} />}
                  </div>
                  <p style={{ fontSize: 11, color: T.textMuted, margin: 0, lineHeight: 1.4 }}>{sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {data.service_fee_mode === 'fixed' && (
        <div style={{ padding: 12, borderRadius: 10, background: '#05966910', border: '1.5px solid #05966933' }}>
          <label style={{ ...lbl, color: '#059669' }}>FIXED SERVICE FEE (₱)</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#059669' }}>₱</span>
            <input style={{ ...inp, paddingLeft: 30, background: '#fff' }} type="number" min={0} value={data.service_fee_amount} onChange={e => set('service_fee_amount', parseFloat(e.target.value) || 0)} />
          </div>
        </div>
      )}

      {data.service_fee_mode === 'distance_based' && (
        <div style={{ padding: 12, borderRadius: 10, background: `${T.primary}08`, border: `1.5px solid ${T.primary}22`, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <AlertCircle size={14} style={{ color: T.primary, flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>
            Fee is computed after a buyer is matched, based on distance from store to your dropoff point. Estimated range: ₱50–₱200.
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
      {/* Max Agents stepper */}
      <div>
        <label style={lbl}><Users size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />MAX AGENTS</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: 46, border: `1.5px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', background: T.bg }}>
          <button type="button"
            onClick={() => set('max_members', Math.max(1, data.max_members - 1))}
            style={{ width: 46, height: '100%', border: 'none', borderRight: `1.5px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: 22, cursor: data.max_members <= 1 ? 'default' : 'pointer', opacity: data.max_members <= 1 ? 0.3 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            −
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: T.text, fontFamily: '"Bricolage Grotesque",serif' }}>{data.max_members}</span>
            <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 5 }}>agent{data.max_members !== 1 ? 's' : ''}</span>
          </div>
          <button type="button"
            onClick={() => set('max_members', Math.min(20, data.max_members + 1))}
            style={{ width: 46, height: '100%', border: 'none', borderLeft: `1.5px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: 22, cursor: data.max_members >= 20 ? 'default' : 'pointer', opacity: data.max_members >= 20 ? 0.3 : 1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            +
          </button>
        </div>
        <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 0' }}>How many couriers can apply (max 20)</p>
      </div>

      {/* Status toggle — Live vs Draft */}
      <div>
        <label style={lbl}>STATUS</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {([['live', '🟢 Live — accepting applicants'], ['soon', '📋 Draft — not yet open']] as ['live' | 'soon', string][]).map(([val, label]) => (
            <button key={val} type="button" onClick={() => set('status', val)}
              style={{ flex: 1, padding: '11px 10px', borderRadius: 12, border: `2px solid ${data.status === val ? T.primary : T.border}`, background: data.status === val ? `${T.primary}10` : T.surfaceAlt, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: data.status === val ? T.primary : T.textMuted, transition: 'all 150ms', lineHeight: 1.4, textAlign: 'center' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Approval mode */}
      <div>
        <label style={lbl}><UserCheck size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />APPROVAL MODE</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {([['auto', 'Auto-accept first buyer'], ['manual', 'Manual — I pick the buyer']] as [ApprovalMode, string][]).map(([mode, label]) => (
            <button key={mode} type="button" onClick={() => set('approval_mode', mode)}
              style={{ flex: 1, padding: '12px 10px', borderRadius: 12, border: `2px solid ${data.approval_mode === mode ? T.primary : T.border}`, background: data.approval_mode === mode ? `${T.primary}10` : T.surfaceAlt, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: data.approval_mode === mode ? T.primary : T.textMuted, transition: 'all 150ms' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div>
        <label style={lbl}>VISIBILITY</label>
        <button type="button" onClick={() => set('is_private', !data.is_private)}
          style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1.5px solid ${data.is_private ? T.primary : T.border}`, background: data.is_private ? `${T.primary}12` : T.surfaceAlt, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: data.is_private ? T.primary : T.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {data.is_private ? <Lock size={18} style={{ color: T.bg }} /> : <Unlock size={18} style={{ color: T.bg }} />}
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 2px' }}>{data.is_private ? 'Private' : 'Public'}</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>{data.is_private ? 'Requires password' : 'Anyone with join code can apply'}</p>
          </div>
          <div style={{ width: 44, height: 24, borderRadius: 12, background: data.is_private ? T.primary : T.border, position: 'relative', transition: 'background 250ms', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 3, left: data.is_private ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 250ms', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
          </div>
        </button>
        {data.is_private && (
          <div style={{ marginTop: 10 }}>
            <label style={lbl}>ROOM PASSWORD</label>
            <input style={inp} value={data.password} onChange={e => set('password', e.target.value)} placeholder="Set a passcode" />
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

  // Mobile number stored in other_socials with label 'Mobile'
  const mobileEntry = data.other_socials.find(s => s.label === 'Mobile');
  const mobileValue = mobileEntry?.url ?? '';
  const setMobile = (val: string) => {
    const rest = data.other_socials.filter(s => s.label !== 'Mobile');
    set('other_socials', val.trim() ? [{ id: 'mobile', label: 'Mobile', url: val }, ...rest] : rest);
  };

  useEffect(() => {
    if (profile && !applied) {
      if (!data.facebook_url && profile.facebook_url) set('facebook_url', profile.facebook_url);
      if (!data.instagram_url && profile.instagram_url) set('instagram_url', profile.instagram_url);
      if (!data.twitter_url && profile.twitter_url) set('twitter_url', profile.twitter_url);
      if (!mobileValue && profile.contact_phone) setMobile(profile.contact_phone);
      setApplied(true);
    }
  }, [profile, applied]);

  const addOther = () => set('other_socials', [...data.other_socials, { id: uid(), label: '', url: '' }]);
  const updateOther = (id: string, field: 'label' | 'url', val: string) =>
    set('other_socials', data.other_socials.map(s => s.id === id ? { ...s, [field]: val } : s));
  const removeOther = (id: string) =>
    set('other_socials', data.other_socials.filter(s => s.id !== id));

  // Custom socials excluding the reserved Mobile entry
  const customSocials = data.other_socials.filter(s => s.label !== 'Mobile');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>
        Where can the buyer reach you to confirm details? Auto-filled from your profile if set.
      </p>

      {/* Mobile number — dedicated row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#16A34A18', border: '1.5px solid #16A34A44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 17 }}>
          📱
        </div>
        <input
          style={{ ...inp, flex: 1 }}
          type="tel"
          value={mobileValue}
          onChange={e => setMobile(e.target.value)}
          placeholder="e.g. 09123456789"
        />
      </div>

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
          {customSocials.map(s => (
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
    if (step === 1 && data.items.length === 0) return 'Add at least one item to your shopping list.';
    if (step === 1 && data.items.some(it => !it.name.trim())) return 'All items need a name.';
    if (step === 2 && !data.needed_by) return 'Please set a needed-by date and time.';
    if (step === 2 && data.needed_by && new Date(data.needed_by) <= new Date()) return 'Please choose a future date and time.';
    if (step === 2 && !data.dropoff_location) return 'Please pin a dropoff location.';
    if (step === 3 && data.goods_budget <= 0) return 'Please enter an estimated goods budget.';
    if (step === 4 && data.is_private && !data.password.trim()) return 'Enter a password for the private room.';
    return '';
  };

  const next = () => {
    const err = validate(); if (err) { setError(err); return; }
    setError('');
    if (step < STEPS.length - 1) { setStep(s => s + 1); return; }
    handleSave();
  };

  // Map a Supabase column error to the step that contains it so we can jump there.
  const errorToStep = (msg: string): number | null => {
    const m = msg.match(/column '?(\w+)'?/i);
    const col = m?.[1];
    if (!col) return null;
    if (['name', 'host_name', 'description', 'max_members', 'status'].includes(col)) return 0;
    if (['items'].includes(col)) return 1;
    if (['dropoff_lat', 'dropoff_lng', 'dropoff_name', 'needed_by', 'location_lat', 'location_lng', 'location_name'].includes(col)) return 2;
    if (['goods_budget', 'service_fee_mode', 'service_fee_amount', 'overage_rule'].includes(col)) return 3;
    if (['is_private', 'password', 'approval_mode'].includes(col)) return 4;
    if (['facebook_url', 'instagram_url', 'twitter_url', 'other_socials'].includes(col)) return 5;
    return null;
  };

  const handleSave = async () => {
    setSaving(true); setError('');

    // Build an EXPLICIT payload — never spread WizardData directly, as it contains
    // wizard-only fields (dropoff_instructions, flexible_timing, item_list_notes, store_area)
    // that are not DB columns. Those are encoded into the description by buildDescription().
    const description = buildDescription(data);
    const payload = {
      name: data.name,
      host_name: data.host_name,
      description: description || null,
      max_members: data.max_members,
      status: data.status,
      category: 'pasabuy',
      event_date: data.needed_by || null,
      needed_by: data.needed_by || null,
      next_event: null,
      is_private: data.is_private,
      password: data.password || null,
      facebook_url: data.facebook_url || null,
      instagram_url: data.instagram_url || null,
      twitter_url: data.twitter_url || null,
      other_socials: data.other_socials,
      location_lat: data.meetup_location?.lat ?? null,
      location_lng: data.meetup_location?.lng ?? null,
      location_name: data.meetup_location?.name || data.store_area || null,
      dropoff_lat: data.dropoff_location?.lat ?? null,
      dropoff_lng: data.dropoff_location?.lng ?? null,
      dropoff_name: data.dropoff_location?.name || null,
      goods_budget: data.goods_budget || null,
      service_fee_mode: data.service_fee_mode,
      service_fee_amount: data.service_fee_mode === 'fixed' ? data.service_fee_amount : null,
      items: data.items,
      overage_rule: data.overage_rule,
      approval_mode: data.approval_mode,
      member_count: 0, // requester is NOT an agent — agents are buyers who apply
      itinerary: [],
      join_code: data.join_code,
      game_name: null,
      game_id: null,
    };

    const handleError = (msg: string) => {
      setSaving(false);
      const targetStep = errorToStep(msg);
      if (targetStep !== null && targetStep !== step) {
        setStep(targetStep);
        setError(`⬆ Fixed step: ${msg}`);
      } else {
        setError(msg);
      }
    };

    if (editing) {
      const { error: err } = await onUpdate(editing.id, payload as unknown as Partial<PasaBuyWizardData>);
      if (err) { handleError(err); return; }
      setSaving(false);
      onClose();
    } else {
      const { error: err, room } = await onCreate(payload as unknown as PasaBuyWizardData);
      if (err) { handleError(err); return; }
      setSaving(false);
      if (room) setCreatedRoom(room);
    }
  };

  const stepProps = { data, set, T };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 28px' }}>
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
          <div style={{ padding: '16px 16px 24px', flexShrink: 0, borderTop: `1px solid ${T.border}` }}>
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
