import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Trash2, Check, Lock, Unlock, Copy, Share2, MapPin, Calendar, Clock, Users, Link, Phone } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { FacebookIcon, InstagramIcon, TwitterIcon } from '@/components/common/SocialIcons';
import { supabase } from '@/lib/supabase';
import type { Theme, Room, ItineraryItem, OtherSocial } from '@/types';
import type { MapLocation, MapPickerTheme } from '@/components/common/MapPicker';

const isDark = (hex: string) => parseInt(hex.replace('#', '').slice(0, 2), 16) < 128;

const MapPicker = lazy(() => import('@/components/common/MapPicker'));

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WizardData {
  name: string; host_name: string; description: string;
  max_members: number; status: 'live' | 'soon' | 'confirmed' | 'completed' | 'cancelled'; category: string; member_count: number;
  event_date: string;
  location: MapLocation | null;
  itinerary: ItineraryItem[];
  is_private: boolean; password: string;
  facebook_url: string; instagram_url: string; twitter_url: string;
  other_socials: OtherSocial[];
  next_event: string; join_code: string;
  // Gaming
  game_name: string;
  game_id: string;
}

interface RoomWizardProps {
  theme: Theme;
  editing: Room | null;
  initialCategory?: string;
  userId: string | undefined;
  onClose: () => void;
  onCreate: (data: WizardData) => Promise<{ error: string | null; room: Room | null }>;
  onUpdate: (id: string, data: Partial<WizardData>) => Promise<{ error: string | null }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);

function makeDefault(): WizardData {
  return {
    name: '', host_name: '', description: '',
    max_members: 20, status: 'live', category: 'rotary', member_count: 1,
    event_date: '', location: null,
    itinerary: [],
    is_private: false, password: '',
    facebook_url: '', instagram_url: '', twitter_url: '',
    other_socials: [],
    next_event: '', join_code: '',
    game_name: '', game_id: '',
  };
}

const GAMES: { name: string; idLabel: string; placeholder: string }[] = [
  { name: 'Mobile Legends: Bang Bang', idLabel: 'ML Player ID',        placeholder: 'e.g. 123456789 (1234)' },
  { name: 'Honor of Kings',            idLabel: 'HOK Player ID',        placeholder: 'e.g. 123456789' },
  { name: 'Valorant',                  idLabel: 'Riot ID',              placeholder: 'e.g. PlayerName#1234' },
  { name: 'Dota 2',                    idLabel: 'Steam Friend Code',    placeholder: 'e.g. 1234567890' },
  { name: 'League of Legends',         idLabel: 'Summoner Name',        placeholder: 'e.g. SummonerName' },
  { name: 'Call of Duty',              idLabel: 'Activision ID',        placeholder: 'e.g. Name#1234567' },
  { name: 'Minecraft',                 idLabel: 'Minecraft Username',   placeholder: 'e.g. Steve123' },
  { name: 'Roblox',                    idLabel: 'Roblox Username',      placeholder: 'e.g. RobloxPlayer' },
  { name: 'Genshin Impact',            idLabel: 'UID',                  placeholder: 'e.g. 800000000' },
  { name: 'Honkai: Star Rail',         idLabel: 'UID',                  placeholder: 'e.g. 800000000' },
  { name: 'Fortnite',                  idLabel: 'Epic Games Username',  placeholder: 'e.g. FortnitePlayer' },
  { name: 'PUBG Mobile',               idLabel: 'PUBG ID',              placeholder: 'e.g. 5123456789' },
  { name: 'Free Fire',                 idLabel: 'Free Fire UID',        placeholder: 'e.g. 123456789' },
  { name: 'Other',                     idLabel: 'Game Username / ID',   placeholder: 'Your in-game ID' },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ current, steps, theme: T }: { current: number; steps: string[]; theme: Theme }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
      {steps.map((label, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < current ? T.primary : i === current ? T.primary : T.surfaceAlt,
              border: `2px solid ${i <= current ? T.primary : T.border}`,
              color: i <= current ? T.bg : T.textMuted,
              fontSize: 12, fontWeight: 700, flexShrink: 0,
              transition: 'all 300ms ease',
            }}>
              {i < current ? <Check size={13} /> : i + 1}
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: i === current ? T.primary : T.textMuted, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
              {label.toUpperCase()}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? T.primary : T.border, margin: '0 4px', marginBottom: 18, transition: 'background 300ms ease' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Shared input styles ──────────────────────────────────────────────────────

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

// ─── Step 1: Info ─────────────────────────────────────────────────────────────

function Step1({ data, set, T, nameRef }: { data: WizardData; set: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void; T: Theme; nameRef?: React.RefObject<HTMLInputElement | null> }) {
  const { inp, lbl } = makeStyles(T);
  const reqStar = <span style={{ color: '#C82718', marginLeft: 2 }}>*</span>;
  const roomNameLabel = data.category === 'gaming' ? 'GAMING ROOM NAME'
    : data.category === 'cafe' ? 'CAFE ROOM NAME'
    : 'ROTARY ROOM NAME';
  const roomNamePlaceholder = data.category === 'gaming' ? 'e.g. Friday Night Valorant Squad'
    : data.category === 'cafe' ? 'e.g. Sunday Coffee at Bo\'s'
    : 'e.g. Davao Rotary District 3860';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={lbl}>{roomNameLabel} {reqStar}</label>
        <input ref={nameRef} style={{ ...inp, borderColor: !data.name.trim() ? '#FCA5A5' : inp.border as string }} value={data.name} onChange={e => set('name', e.target.value)} placeholder={roomNamePlaceholder} />
        {!data.name.trim() && <p style={{ fontSize: 11, color: '#C82718', margin: '3px 0 0' }}>Room name is required.</p>}
      </div>
      <div>
        <label style={lbl}>DESCRIPTION</label>
        <textarea style={{ ...inp, height: 80, padding: '10px 14px', resize: 'vertical' }} value={data.description} onChange={e => set('description', e.target.value)} placeholder="What is this room about?" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={lbl}>MAX MEMBERS</label>
          <input style={inp} type="number" min={2} max={500} value={data.max_members} onChange={e => set('max_members', parseInt(e.target.value) || 20)} />
        </div>
        <div>
          <label style={lbl}>STATUS</label>
          <select style={{ ...inp, cursor: 'pointer' }} value={data.status} onChange={e => set('status', e.target.value as 'live' | 'soon')}>
            <option value="live">Live</option>
            <option value="soon">Soon</option>
          </select>
        </div>
      </div>
      <br />
    </div>
  );
}

// ─── Step 2: Schedule & Location / Gaming ────────────────────────────────────

function Step2({ data, set, T }: { data: WizardData; set: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void; T: Theme }) {
  const { inp, lbl } = makeStyles(T);
  const isGaming = data.category === 'gaming';

  const mapTheme: MapPickerTheme = {
    primary: T.primary, bg: T.bg, surface: T.surface,
    surfaceAlt: T.surfaceAlt, text: T.text, textMuted: T.textMuted, border: T.border,
  };

  const selectedGame = GAMES.find(g => g.name === data.game_name);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Date + Time — split so each picker closes on selection, and past values are blocked */}
      {(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const nowTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const selectedDate = data.event_date ? data.event_date.split('T')[0] : '';
        const selectedTime = data.event_date ? (data.event_date.split('T')[1] ?? '') : '';
        const isToday = selectedDate === todayStr;
        return (
          <div>
            <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={11} /> EVENT DATE & TIME <span style={{ color: '#C82718' }}>*</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <Calendar size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
                <input
                  style={{ ...inp, paddingLeft: 34, colorScheme: isDark(T.bg) ? 'dark' : 'light' }}
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={e => {
                    const date = e.target.value;
                    const time = (date === todayStr && selectedTime && selectedTime <= nowTimeStr)
                      ? nowTimeStr : (selectedTime || '00:00');
                    set('event_date', date ? `${date}T${time}` : '');
                  }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <Clock size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
                <input
                  style={{ ...inp, paddingLeft: 34, colorScheme: isDark(T.bg) ? 'dark' : 'light' }}
                  type="time"
                  min={isToday ? nowTimeStr : undefined}
                  value={selectedTime}
                  onChange={e => {
                    const time = e.target.value;
                    const date = selectedDate || todayStr;
                    set('event_date', time ? `${date}T${time}` : '');
                  }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {isGaming ? (
        /* ── Gaming: game picker + dynamic ID field ── */
        <>
          <div>
            <label style={lbl}>CHOOSE A GAME *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
              {GAMES.map(g => (
                <button
                  key={g.name}
                  type="button"
                  onClick={() => { set('game_name', g.name); set('game_id', ''); }}
                  style={{
                    padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                    border: `1.5px solid ${data.game_name === g.name ? T.primary : T.border}`,
                    background: data.game_name === g.name ? `${T.primary}18` : T.surfaceAlt,
                    color: data.game_name === g.name ? T.primary : T.text,
                    fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                    textAlign: 'left', transition: 'all 150ms',
                  }}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {selectedGame && (
            <div>
              <label style={lbl}>{selectedGame.idLabel.toUpperCase()} (YOUR ID)</label>
              <input
                style={inp}
                value={data.game_id}
                onChange={e => set('game_id', e.target.value)}
                placeholder={selectedGame.placeholder}
              />
              <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 0' }}>
                This helps members find and add you in-game.
              </p>
            </div>
          )}
        </>
      ) : (
        /* ── Non-gaming: map location ── */
        <div>
          <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={11} /> MEETUP LOCATION
          </label>
          <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 8px', lineHeight: 1.5 }}>
            Search for a place or drag the map to pin your meetup location.
          </p>
          <Suspense fallback={<div style={{ height: 280, background: T.surfaceAlt, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: 13 }}>Loading map…</div>}>
            <MapPicker value={data.location} onChange={loc => set('location', loc)} theme={mapTheme} />
          </Suspense>
          {data.location && (
            <div style={{ marginTop: 10 }}>
              <label style={lbl}>LOCATION NAME (editable)</label>
              <input style={inp} value={data.location.name} onChange={e => set('location', { ...data.location!, name: e.target.value })} placeholder="e.g. Apo View Hotel, Davao City" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Itinerary ────────────────────────────────────────────────────────

function Step3({ data, set, T }: { data: WizardData; set: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void; T: Theme }) {
  const { inp, lbl } = makeStyles(T);

  const addItem = () => set('itinerary', [...data.itinerary, { id: uid(), time: '', title: '', description: '' }]);

  const updateItem = (id: string, field: keyof ItineraryItem, val: string) =>
    set('itinerary', data.itinerary.map(it => it.id === id ? { ...it, [field]: val } : it));

  const removeItem = (id: string) =>
    set('itinerary', data.itinerary.filter(it => it.id !== id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 13, color: T.textMuted, margin: 0, lineHeight: 1.6 }}>
        Add the step-by-step schedule for your event. You can edit this any time after creating the room.
      </p>

      {data.itinerary.length === 0 && (
        <div style={{ textAlign: 'center', padding: '28px 0', border: `2px dashed ${T.border}`, borderRadius: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>No itinerary yet. Add your first step!</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.itinerary.map((item, idx) => (
          <div key={item.id} style={{ background: T.surfaceAlt, borderRadius: 14, padding: 14, border: `1.5px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.primary, background: `${T.primary}18`, padding: '3px 10px', borderRadius: 20 }}>Step {idx + 1}</span>
              <button onClick={() => removeItem(item.id)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #FCA5A5', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#B91C1C' }}>
                <Trash2 size={13} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={lbl}>TIME</label>
                <input style={inp} type="time" value={item.time} onChange={e => updateItem(item.id, 'time', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>STEP TITLE *</label>
                <input style={inp} value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)} placeholder="e.g. Opening Ceremony" />
              </div>
            </div>
            <div>
              <label style={lbl}>DETAILS (optional)</label>
              <input style={inp} value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="e.g. Welcome remarks by the District Governor" />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addItem}
        style={{ width: '100%', height: 44, borderRadius: 22, border: `2px dashed ${T.primary}`, background: `${T.primary}0A`, color: T.primary, fontSize: 13, fontWeight: 700, fontFamily: '"DM Sans",system-ui,sans-serif', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      >
        <Plus size={15} /> Add Step
      </button>
    </div>
  );
}

// ─── Step 4: Access ───────────────────────────────────────────────────────────

function Step4({ data, set, T, passwordRef }: { data: WizardData; set: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void; T: Theme; passwordRef?: React.RefObject<HTMLInputElement | null> }) {
  const { inp, lbl } = makeStyles(T);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={lbl}><Users size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />MAX MEMBERS</label>
        <input style={inp} type="number" min={2} max={500} value={data.max_members} onChange={e => set('max_members', parseInt(e.target.value) || 20)} />
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
            <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>{data.is_private ? 'Joiners need the password' : 'Anyone with the join code can enter'}</p>
          </div>
          <div style={{ width: 44, height: 24, borderRadius: 12, background: data.is_private ? T.primary : T.border, position: 'relative', transition: 'background 250ms', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 3, left: data.is_private ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 250ms', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
          </div>
        </button>

        {data.is_private && (
          <div style={{ marginTop: 10 }}>
            <label style={lbl}>ROOM PASSWORD <span style={{ color: '#C82718' }}>*</span></label>
            <input
              ref={passwordRef}
              style={{ ...inp, borderColor: data.is_private && !data.password.trim() ? '#FCA5A5' : inp.border as string }}
              type="text"
              value={data.password}
              onChange={e => set('password', e.target.value)}
              placeholder="Set a passcode for joiners"
            />
            {data.is_private && !data.password.trim() && (
              <p style={{ fontSize: 11, color: '#C82718', margin: '3px 0 0' }}>Password is required for private rooms.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 5: Socials ──────────────────────────────────────────────────────────

function Step5({ data, set, T, userId }: { data: WizardData; set: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void; T: Theme; userId?: string }) {
  const { inp, lbl } = makeStyles(T);
  const { profile } = useProfile(userId);
  const [profileApplied, setProfileApplied] = useState(false);
  const [mobile, setMobile] = useState(() => {
    const existing = data.other_socials.find(s => s.label === 'Mobile');
    return existing?.url ?? '';
  });

  useEffect(() => {
    if (profile && !profileApplied) {
      if (!data.facebook_url && profile.facebook_url) set('facebook_url', profile.facebook_url);
      if (!data.instagram_url && profile.instagram_url) set('instagram_url', profile.instagram_url);
      if (!data.twitter_url && profile.twitter_url) set('twitter_url', profile.twitter_url);
      if (!mobile && profile.contact_phone) {
        const phone = profile.contact_phone;
        setMobile(phone);
        set('other_socials', [
          { id: 'mobile_0', label: 'Mobile', url: phone },
          ...data.other_socials.filter(s => s.label !== 'Mobile'),
        ]);
      }
      setProfileApplied(true);
    }
  }, [profile, profileApplied]);

  const updateMobile = (val: string) => {
    setMobile(val);
    const others = data.other_socials.filter(s => s.label !== 'Mobile');
    if (val.trim()) {
      set('other_socials', [{ id: 'mobile_0', label: 'Mobile', url: val }, ...others]);
    } else {
      set('other_socials', others);
    }
  };

  const addOther = () => set('other_socials', [...data.other_socials, { id: uid(), label: '', url: '' }]);
  const updateOther = (id: string, field: 'label' | 'url', val: string) =>
    set('other_socials', data.other_socials.map(s => s.id === id ? { ...s, [field]: val } : s));
  const removeOther = (id: string) =>
    set('other_socials', data.other_socials.filter(s => s.id !== id));

  const hasContact = data.facebook_url.trim() || data.instagram_url.trim() || data.twitter_url.trim() || mobile.trim();
  const reqStar = <span style={{ color: '#C82718', marginLeft: 2 }}>*</span>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>
        A mobile number or at least one social media link is <strong style={{ color: T.text }}>required</strong> so members can reach you.
      </p>

      {/* Mobile Number */}
      <div>
        <label style={lbl}>MOBILE NUMBER {reqStar}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#10B98118', border: '1.5px solid #10B98144', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Phone size={16} color="#10B981" />
          </div>
          <input
            style={{ ...inp, flex: 1, borderColor: !hasContact ? '#FCA5A5' : inp.border as string }}
            value={mobile}
            onChange={e => updateMobile(e.target.value)}
            placeholder="+63 912 345 6789"
            type="tel"
          />
        </div>
        {!hasContact && <p style={{ fontSize: 11, color: '#C82718', margin: '3px 0 0' }}>Required if no social media link is provided.</p>}
      </div>

      {/* Social links */}
      {[
        { key: 'facebook_url' as const, Icon: FacebookIcon, label: 'Facebook', ph: 'https://facebook.com/yourpage', color: '#1877F2' },
        { key: 'instagram_url' as const, Icon: InstagramIcon, label: 'Instagram', ph: 'https://instagram.com/yourhandle', color: '#E4405F' },
        { key: 'twitter_url' as const, Icon: TwitterIcon, label: 'Twitter / X', ph: 'https://x.com/yourhandle', color: '#1DA1F2' },
      ].map(({ key, Icon, ph, color }) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={16} color={color} />
          </div>
          <input style={{ ...inp, flex: 1 }} value={data[key]} onChange={e => set(key, e.target.value)} placeholder={ph} />
        </div>
      ))}

      {/* Others */}
      <div style={{ paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
        <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link size={11} /> OTHER LINKS
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.other_socials.filter(s => s.label !== 'Mobile').map((s) => (
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

// ─── Success screen ───────────────────────────────────────────────────────────

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
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', border: '2px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Check size={28} style={{ color: '#15803D' }} />
      </div>
      <h3 style={{ fontFamily: '"Bricolage Grotesque",serif', fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 6px' }}>Room created!</h3>
      <p style={{ fontSize: 14, color: T.textMuted, margin: '0 0 24px' }}>Share your join code or link so others can find the room.</p>

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

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function RoomWizard({ theme: T, editing, initialCategory, userId, onClose, onCreate, onUpdate }: RoomWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(() => {
    if (!editing) return { ...makeDefault(), category: initialCategory ?? 'rotary' };
    return {
      name: editing.name, host_name: editing.host_name, description: editing.description ?? '',
      max_members: editing.max_members, status: editing.status, category: editing.category, member_count: editing.member_count,
      event_date: editing.event_date ? editing.event_date.slice(0, 16) : '',
      location: editing.location_lat != null && editing.location_lng != null
        ? { lat: editing.location_lat, lng: editing.location_lng, name: editing.location_name ?? '' }
        : null,
      itinerary: editing.itinerary ?? [],
      is_private: editing.is_private, password: editing.password ?? '',
      facebook_url: editing.facebook_url ?? '', instagram_url: editing.instagram_url ?? '', twitter_url: editing.twitter_url ?? '',
      other_socials: editing.other_socials ?? [],
      next_event: editing.next_event ?? '', join_code: editing.join_code,
      game_name: editing.game_name ?? '', game_id: editing.game_id ?? '',
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null);

  // Auto-populate host_name from the logged-in user's profile
  const { profile: creatorProfile } = useProfile(userId);
  useEffect(() => {
    if (!editing && creatorProfile?.display_name && !data.host_name) {
      setData(prev => ({ ...prev, host_name: creatorProfile.display_name! }));
    }
  }, [creatorProfile?.display_name, editing]);

  const isRotary = data.category === 'rotary';
  const isGaming = data.category === 'gaming';
  const isCafe   = data.category === 'cafe';

  // Itinerary step only exists for Rotary rooms
  const STEPS_LIST = isRotary
    ? ['Info', 'Schedule', 'Itinerary', 'Access', 'Socials']
    : isGaming
      ? ['Info', 'Game & Schedule', 'Access', 'Socials']
      : ['Info', 'Schedule', 'Access', 'Socials'];

  // Access step index differs by category
  const accessStepIdx = isRotary ? 3 : 2;

  // Refs for focusing required fields on validation failure
  const nameRef     = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof WizardData>(k: K, v: WizardData[K]) =>
    setData(prev => ({ ...prev, [k]: v }));

  const validate = (): string => {
    if (step === 0) {
      if (!data.name.trim()) { setTimeout(() => nameRef.current?.focus(), 50); return 'Room name is required.'; }
    }
    if (step === 1 && !data.event_date) {
      return 'Event date and time are required.';
    }
    if (step === 1 && isGaming && !data.game_name) {
      return 'Please choose a game for this lobby.';
    }
    if (step === accessStepIdx && data.is_private && !data.password.trim()) {
      setTimeout(() => passwordRef.current?.focus(), 50);
      return 'Enter a password for the private room.';
    }
    if (step === STEPS_LIST.length - 1) {
      const hasMobile = data.other_socials.some(s => s.label === 'Mobile' && s.url.trim());
      if (!data.facebook_url.trim() && !data.instagram_url.trim() && !data.twitter_url.trim() && !hasMobile) {
        return 'Please add at least one social media link or a mobile number so members can reach you.';
      }
    }
    return '';
  };

  const next = () => {
    const err = validate(); if (err) { setError(err); return; }
    setError('');
    if (step < STEPS_LIST.length - 1) { setStep(s => s + 1); return; }
    handleSave();
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    if (editing) {
      // Destructure 'location' so the raw MapLocation object is never sent as a DB column
      const { location, ...rest } = data;
      const payload = {
        ...rest,
        event_date:    rest.event_date    || null,
        password:      rest.password      || null,
        description:   rest.description   || null,
        facebook_url:  rest.facebook_url  || null,
        instagram_url: rest.instagram_url || null,
        twitter_url:   rest.twitter_url   || null,
        location_lat:  location?.lat       ?? null,
        location_lng:  location?.lng       ?? null,
        location_name: location?.name      || null,
      };
      const { error: err } = await onUpdate(editing.id, payload as unknown as Partial<WizardData>);
      setSaving(false);
      if (err) { setError(err); return; }
      onClose();
    } else {
      const { error: err, room } = await onCreate(data);
      setSaving(false);
      if (err) { setError(err); return; }
      if (room) setCreatedRoom(room);
    }
  };

  const stepProps = { data, set, T, nameRef, passwordRef };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=VT323&display=swap'); .font-display{font-family:'Bricolage Grotesque',serif;letter-spacing:-0.02em;} .font-pixel{font-family:'VT323',monospace;}`}</style>

      <div style={{ width: '100%', maxWidth: 520, background: T.surface, borderRadius: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', maxHeight: '95vh' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: '0 0 2px' }}>
                {createdRoom
                  ? (isGaming ? 'Lobby Ready!' : isCafe ? 'Hangout Ready!' : 'Room Ready!')
                  : editing
                    ? `Edit ${isGaming ? 'Lobby' : isCafe ? 'Hangout' : 'Room'}`
                    : `New ${isGaming ? 'Lobby' : isCafe ? 'Hangout' : 'Room'}`}
              </h2>
              {!createdRoom && (
                <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
                  {editing ? 'Update your room details' : `Step ${step + 1} of ${STEPS_LIST.length} — ${STEPS_LIST[step]}`}
                </p>
              )}
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${T.border}`, background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.textMuted }}>
              <X size={16} />
            </button>
          </div>
          {!createdRoom && <StepBar current={step} steps={STEPS_LIST} theme={T} />}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px' }}>
          {createdRoom
            ? <SuccessScreen room={createdRoom} onClose={onClose} T={T} />
            : step === 0 ? <Step1 {...stepProps} />
            : step === 1 ? <Step2 {...stepProps} />
            : isRotary && step === 2 ? <Step3 {...stepProps} />
            : step === accessStepIdx ? <Step4 {...stepProps} />
            : <Step5 {...stepProps} userId={userId} />
          }
        </div>

        {/* Footer nav */}
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
                {saving ? 'Saving…' : step === STEPS_LIST.length - 1
                  ? <>{editing ? 'Save Changes' : isGaming ? 'Create Lobby' : isCafe ? 'Create Hangout' : 'Create Room'} <Check size={16} /></>
                  : <>Next <ChevronRight size={16} /></>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
