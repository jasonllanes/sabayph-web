import { useState, useEffect } from 'react';
import { X, Save, Copy, Lock, Unlock, Check } from 'lucide-react';
import { FacebookIcon, InstagramIcon, TwitterIcon } from '@/components/common/SocialIcons';
import { useProfile } from '@/hooks/useProfile';
import { generateJoinCode } from '@/hooks/useRooms';
import { supabase } from '@/lib/supabase';
import type { Theme, Room } from '@/types';

export interface RoomFormData {
  host_name: string;
  name: string;
  description: string;
  max_members: number;
  next_event: string;
  event_date: string;
  status: 'live' | 'soon' | 'confirmed' | 'completed' | 'cancelled';
  category: string;
  member_count: number;
  join_code: string;
  is_private: boolean;
  password: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
}

interface RoomFormModalProps {
  theme: Theme;
  editing: Room | null;
  onClose: () => void;
  onSubmit: (data: RoomFormData) => Promise<{ error: string | null }>;
}

function makeEmpty(joinCode: string): RoomFormData {
  return {
    host_name: '', name: '', description: '',
    max_members: 20, next_event: '', event_date: '',
    status: 'soon', category: 'rotary', member_count: 1,
    join_code: joinCode, is_private: false, password: '',
    facebook_url: '', instagram_url: '', twitter_url: '',
  };
}

export default function RoomFormModal({ theme: T, editing, onClose, onSubmit }: RoomFormModalProps) {
  const [form, setForm] = useState<RoomFormData>(() => makeEmpty(generateJoinCode()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const { profile } = useProfile(userId);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
  }, []);

  // Populate form when editing or when profile loads (for new room autofill)
  useEffect(() => {
    if (editing) {
      setForm({
        host_name: editing.host_name,
        name: editing.name,
        description: editing.description ?? '',
        max_members: editing.max_members,
        next_event: editing.next_event ?? '',
        event_date: editing.event_date ? editing.event_date.slice(0, 16) : '',
        status: editing.status,
        category: editing.category,
        member_count: editing.member_count,
        join_code: editing.join_code,
        is_private: editing.is_private,
        password: editing.password ?? '',
        facebook_url: editing.facebook_url ?? '',
        instagram_url: editing.instagram_url ?? '',
        twitter_url: editing.twitter_url ?? '',
      });
    } else if (profile) {
      setForm(prev => ({
        ...prev,
        facebook_url: profile.facebook_url ?? '',
        instagram_url: profile.instagram_url ?? '',
        twitter_url: profile.twitter_url ?? '',
      }));
    }
  }, [editing, profile]);

  const set = <K extends keyof RoomFormData>(k: K, v: RoomFormData[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const copyCode = () => {
    navigator.clipboard.writeText(form.join_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Room name is required.'); return; }
    if (!form.host_name.trim()) { setError('Host name is required.'); return; }
    if (form.is_private && !form.password.trim()) { setError('Enter a password for the private room.'); return; }
    setSaving(true);
    const { error: err } = await onSubmit(form);
    setSaving(false);
    if (err) { setError(err); return; }
    onClose();
  };

  const inp: React.CSSProperties = {
    width: '100%', height: 46, padding: '0 14px', fontSize: 14,
    fontFamily: '"DM Sans", system-ui, sans-serif',
    border: `1.5px solid ${T.border}`, borderRadius: 10,
    background: T.bg, color: T.text, outline: 'none', boxSizing: 'border-box',
  };
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: T.textMuted,
    display: 'block', marginBottom: 5, letterSpacing: 0.5,
  };
  const section: React.CSSProperties = {
    paddingTop: 16, marginTop: 16, borderTop: `1px solid ${T.border}`,
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}
    >
      <div style={{ width: '100%', maxWidth: 500, background: T.surface, borderRadius: 24, padding: '28px 28px 32px', maxHeight: '90vh', overflowY: 'auto', fontFamily: '"DM Sans", system-ui, sans-serif', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=VT323&display=swap'); .font-display{font-family:'Bricolage Grotesque',serif;letter-spacing:-0.02em;} .font-pixel{font-family:'VT323',monospace;}`}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0 }}>
            {editing ? 'Edit Room' : 'Create a Room'}
          </h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${T.border}`, background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.textMuted }}>
            <X size={16} />
          </button>
        </div>

        {/* Join Code (always visible, read-only) */}
        <div style={{ padding: '12px 14px', borderRadius: 12, background: `${T.primary}12`, border: `1.5px solid ${T.primary}44`, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div>
            <p className="font-pixel" style={{ fontSize: 11, color: T.primary, margin: '0 0 2px', letterSpacing: 1 }}>ROOM JOIN CODE</p>
            <p className="font-display" style={{ fontSize: 20, fontWeight: 800, color: T.primary, margin: 0, letterSpacing: 2 }}>{form.join_code}</p>
          </div>
          <button
            type="button"
            onClick={copyCode}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${T.primary}`, background: codeCopied ? T.primary : 'transparent', color: codeCopied ? T.bg : T.primary, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 200ms ease', flexShrink: 0 }}
          >
            {codeCopied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Basic info */}
          <div>
            <label style={lbl}>ROOM NAME *</label>
            <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Davao Rotary District 3860" required />
          </div>
          <div>
            <label style={lbl}>HOST NAME *</label>
            <input style={inp} value={form.host_name} onChange={e => set('host_name', e.target.value)} placeholder="e.g. PDG Liza Santos" required />
          </div>
          <div>
            <label style={lbl}>DESCRIPTION</label>
            <textarea style={{ ...inp, height: 76, padding: '10px 14px', resize: 'vertical' as const }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What is this room about?" />
          </div>

          {/* Date + Members + Status */}
          <div>
            <label style={lbl}>EVENT DATE & TIME</label>
            <input style={inp} type="datetime-local" value={form.event_date} onChange={e => set('event_date', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>MAX MEMBERS</label>
              <input style={inp} type="number" min={2} max={500} value={form.max_members} onChange={e => set('max_members', parseInt(e.target.value) || 20)} />
            </div>
            <div>
              <label style={lbl}>STATUS</label>
              <select style={{ ...inp, cursor: 'pointer' }} value={form.status} onChange={e => set('status', e.target.value as 'live' | 'soon')}>
                <option value="soon">Soon</option>
                <option value="live">Live</option>
              </select>
            </div>
          </div>

          <br />
          {/* Privacy */}
          <div style={section}>
            <p className="font-pixel" style={{ fontSize: 12, color: T.textMuted, margin: '0 0 12px', letterSpacing: 1 }}>PRIVACY</p>
            <button
              type="button"
              onClick={() => set('is_private', !form.is_private)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${form.is_private ? T.primary : T.border}`, background: form.is_private ? `${T.primary}12` : T.surfaceAlt, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, background: form.is_private ? T.primary : T.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {form.is_private ? <Lock size={17} style={{ color: T.bg }} /> : <Unlock size={17} style={{ color: T.bg }} />}
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 1px' }}>
                  {form.is_private ? 'Private Room' : 'Public Room'}
                </p>
                <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
                  {form.is_private ? 'Joiners need the password' : 'Anyone with the code can join'}
                </p>
              </div>
              {/* Toggle pill */}
              <div style={{ marginLeft: 'auto', width: 44, height: 24, borderRadius: 12, background: form.is_private ? T.primary : T.border, position: 'relative', transition: 'background 250ms ease', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, left: form.is_private ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.25)', transition: 'left 250ms ease' }} />
              </div>
            </button>

            {form.is_private && (
              <div style={{ marginTop: 10 }}>
                <label style={lbl}>ROOM PASSWORD</label>
                <input style={inp} type="text" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Set a passcode for joiners" />
              </div>
            )}
          </div>

          {/* Social links */}
          <div style={section}>
            <p className="font-pixel" style={{ fontSize: 12, color: T.textMuted, margin: '0 0 12px', letterSpacing: 1 }}>SOCIAL LINKS <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>(auto-filled from your profile)</span></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'facebook_url' as const, Icon: FacebookIcon, label: 'Facebook', placeholder: 'https://facebook.com/yourpage', color: '#1877F2' },
                { key: 'instagram_url' as const, Icon: InstagramIcon, label: 'Instagram', placeholder: 'https://instagram.com/yourhandle', color: '#E4405F' },
                { key: 'twitter_url' as const, Icon: TwitterIcon, label: 'Twitter / X', placeholder: 'https://x.com/yourhandle', color: '#1DA1F2' },
              ].map(({ key, Icon, label, placeholder, color }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color={color} />
                  </div>
                  <input style={{ ...inp, flex: 1 }} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} aria-label={label} />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: '#FEE2E2', borderRadius: 8, border: '1px solid #FCA5A5' }}>
              <p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{ width: '100%', height: 50, borderRadius: 25, border: 'none', background: saving ? T.border : T.primary, color: T.bg, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}
          >
            <Save size={17} />
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
}
