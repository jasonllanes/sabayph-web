import { useState, useEffect } from 'react';
import { X, Lock, Users, ArrowRight, Loader, Check } from 'lucide-react';
import { FacebookIcon, InstagramIcon, TwitterIcon } from '@/components/common/SocialIcons';
import { fetchRoomByCode } from '@/hooks/useRooms';
import { supabase } from '@/lib/supabase';
import type { Room } from '@/types';

interface JoinRoomModalProps {
  joinCode: string;
  onClose: () => void;
}

const T = {
  bg: '#F1EDE1', surface: '#FFFFFF', surfaceAlt: '#E9E2D0',
  primary: '#043E81', accent: '#C82718',
  text: '#06131B', textMuted: '#5A5448', border: '#D6C09D',
};

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function JoinRoomModal({ joinCode, onClose }: JoinRoomModalProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [fetching, setFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    fetchRoomByCode(joinCode).then(r => {
      setRoom(r);
      setNotFound(!r);
      setFetching(false);
    });
  }, [joinCode]);

  const handleJoin = async () => {
    if (!room) return;
    if (room.is_private && password !== room.password) {
      setPwError('Wrong password. Try again.');
      return;
    }
    setJoining(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user && room.member_count < room.max_members) {
      await Promise.all([
        supabase.from('rooms').update({ member_count: room.member_count + 1 }).eq('id', room.id),
        supabase.from('room_members').upsert({ room_id: room.id, user_id: user.id }, { onConflict: 'room_id,user_id' }),
      ]);
    }
    setJoining(false);
    setJoined(true);
    setTimeout(() => {
      onClose();
      // Clear the ?join= param from URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete('join');
      window.history.replaceState({}, '', url);
    }, 2000);
  };

  const eventDisplay = room?.event_date ? formatEventDate(room.event_date) : room?.next_event;
  const fill = room ? Math.min((room.member_count / room.max_members) * 100, 100) : 0;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=VT323&display=swap'); .font-display{font-family:'Bricolage Grotesque',serif;letter-spacing:-0.02em;} .font-pixel{font-family:'VT323',monospace;}`}</style>

      <div style={{ width: '100%', maxWidth: 420, background: T.surface, borderRadius: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="font-pixel" style={{ fontSize: 13, color: T.accent, margin: 0, letterSpacing: 1 }}>ROOM INVITE</p>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${T.border}`, background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.textMuted }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '16px 20px 24px' }}>
          {/* Loading */}
          {fetching && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 10, color: T.textMuted }}>
              <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <span>Looking up room…</span>
            </div>
          )}

          {/* Not found */}
          {!fetching && notFound && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <h3 className="font-display" style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: '0 0 8px' }}>Room not found</h3>
              <p style={{ fontSize: 14, color: T.textMuted, margin: '0 0 20px' }}>The code <strong>{joinCode}</strong> didn't match any room.</p>
              <button onClick={onClose} style={{ padding: '10px 24px', borderRadius: 24, border: 'none', background: T.primary, color: T.bg, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          )}

          {/* Joined success */}
          {joined && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', border: '2px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Check size={28} style={{ color: '#15803D' }} />
              </div>
              <h3 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 6px' }}>You're in, kasama!</h3>
              <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>Welcome to <strong>{room?.name}</strong></p>
            </div>
          )}

          {/* Room details */}
          {!fetching && room && !joined && (
            <>
              <div style={{ background: T.surfaceAlt, borderRadius: 16, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  {room.category === 'gaming'
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, background: '#EDE9FE', color: '#7C3AED', padding: '3px 10px', borderRadius: 20, border: '1px solid #C4B5FD' }}><img src="https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/gaming.png" alt="" style={{ width: 13, height: 13, objectFit: 'contain' }} /> Gaming</span>
                    : room.category === 'pasabuy'
                      ? <span style={{ fontSize: 11, fontWeight: 700, background: '#FEF3E2', color: '#D97706', padding: '3px 10px', borderRadius: 20, border: '1px solid #F9C07E' }}>PasaBuy</span>
                      : room.category === 'cafe'
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, background: '#FEF3C7', color: '#92400E', padding: '3px 10px', borderRadius: 20, border: '1px solid #D97706AA' }}><img src="https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/coffee.png" alt="" style={{ width: 13, height: 13, objectFit: 'contain' }} /> Cafe</span>
                        : <span style={{ fontSize: 11, fontWeight: 700, background: '#F4ECDF', color: '#9F5E0F', padding: '3px 10px', borderRadius: 20, border: '1px solid #9F5E0F44' }}>Rotary</span>
                  }
                  {room.status === 'live' && <span style={{ fontSize: 10, fontWeight: 700, background: '#C82718', color: '#F1EDE1', padding: '2px 8px', borderRadius: 8 }}>LIVE</span>}
                  {room.is_private && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, background: T.border, color: T.textMuted, padding: '2px 8px', borderRadius: 8 }}><Lock size={9} /> PRIVATE</span>}
                </div>

                <h3 className="font-display" style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: '0 0 4px' }}>{room.name}</h3>
                {room.description && <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 8px', lineHeight: 1.5 }}>{room.description}</p>}
                <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 10px' }}>
                  Hosted by <strong style={{ color: T.text }}>{room.host_name}</strong>
                </p>

                <div style={{ marginBottom: eventDisplay ? 10 : 0 }}>
                  <span style={{ fontSize: 11, color: T.textMuted }}><Users size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{room.member_count} / {room.max_members} {room.category === 'gaming' ? 'players' : room.category === 'cafe' ? 'guests' : 'members'}</span>
                  <div style={{ height: 5, background: T.border, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${fill}%`, background: T.primary, transition: 'width 600ms ease' }} />
                  </div>
                </div>

                {eventDisplay && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, background: T.surface, marginTop: 10 }}>
                    <span style={{ fontSize: 14 }}>📅</span>
                    <p style={{ fontSize: 12, color: T.text, margin: 0, fontWeight: 600 }}>{eventDisplay}</p>
                  </div>
                )}

                {(room.facebook_url || room.instagram_url || room.twitter_url) && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {room.facebook_url && <a href={room.facebook_url} target="_blank" rel="noreferrer" style={{ width: 32, height: 32, borderRadius: 8, background: '#1877F218', border: '1px solid #1877F244', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FacebookIcon size={15} /></a>}
                    {room.instagram_url && <a href={room.instagram_url} target="_blank" rel="noreferrer" style={{ width: 32, height: 32, borderRadius: 8, background: '#E4405F18', border: '1px solid #E4405F44', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><InstagramIcon size={15} /></a>}
                    {room.twitter_url && <a href={room.twitter_url} target="_blank" rel="noreferrer" style={{ width: 32, height: 32, borderRadius: 8, background: '#1DA1F218', border: '1px solid #1DA1F244', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TwitterIcon size={15} /></a>}
                  </div>
                )}
              </div>

              {/* Password field if private */}
              {room.is_private && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6, letterSpacing: 0.5 }}>
                    <Lock size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />ROOM PASSWORD
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setPwError(''); }}
                    placeholder="Enter room password"
                    style={{ width: '100%', height: 46, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', border: `1.5px solid ${pwError ? '#FCA5A5' : T.border}`, borderRadius: 10, background: T.bg, color: T.text, outline: 'none', boxSizing: 'border-box' }}
                  />
                  {pwError && <p style={{ fontSize: 12, color: '#B91C1C', margin: '5px 0 0' }}>{pwError}</p>}
                </div>
              )}

              <button
                onClick={handleJoin}
                disabled={joining || room.member_count >= room.max_members}
                style={{ width: '100%', height: 50, borderRadius: 25, border: 'none', background: room.member_count >= room.max_members ? T.border : T.primary, color: room.member_count >= room.max_members ? T.textMuted : T.bg, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: room.member_count >= room.max_members ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {joining ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Joining…</> :
                  room.member_count >= room.max_members ? 'Room is full' :
                    <>Join Room <ArrowRight size={16} /></>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
