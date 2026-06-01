import { useState } from 'react';
import { Users, Plus, Edit2, Trash2, ArrowRight, Loader, Copy, Share2, Check, Lock, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { PixelHeart } from '@/components/common/PixelDecorations';
import { FacebookIcon, InstagramIcon, TwitterIcon } from '@/components/common/SocialIcons';
import { useRooms } from '@/hooks/useRooms';
import RoomWizard, { type WizardData } from '@/components/app/RoomWizard';
import { supabase } from '@/lib/supabase';
import type { Theme, Room } from '@/types';

interface RoomsTabProps { theme: Theme; userId?: string; }

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function RoomsTab({ theme: T, userId }: RoomsTabProps) {
  const { rooms, loading, error, createRoom, updateRoom, deleteRoom } = useRooms('rotary');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openCreate = () => { setEditing(null); setWizardOpen(true); };
  const openEdit   = (room: Room) => { setEditing(room); setWizardOpen(true); };

  const handleCreate = async (data: WizardData) => {
    // Destructure out 'location' so it's never sent as a DB column
    const { location, ...rest } = data;
    return createRoom({
      ...rest,
      event_date:    rest.event_date    || null,
      next_event:    rest.next_event    || null,
      password:      rest.password      || null,
      description:   rest.description   || null,
      location_lat:  location?.lat       ?? null,
      location_lng:  location?.lng       ?? null,
      location_name: location?.name      || null,
      facebook_url:  rest.facebook_url  || null,
      instagram_url: rest.instagram_url || null,
      twitter_url:   rest.twitter_url   || null,
    } as Parameters<typeof createRoom>[0]);
  };

  const handleUpdate = async (id: string, data: Partial<WizardData>) => {
    const { location, ...rest } = data;
    return updateRoom(id, {
      ...rest,
      event_date:    rest.event_date    || null,
      next_event:    rest.next_event    || null,
      password:      rest.password      || null,
      description:   rest.description   || null,
      location_lat:  location?.lat       ?? null,
      location_lng:  location?.lng       ?? null,
      location_name: location?.name      || null,
      facebook_url:  rest.facebook_url  || null,
      instagram_url: rest.instagram_url || null,
      twitter_url:   rest.twitter_url   || null,
    });
  };

  const handleDelete = async (room: Room) => {
    if (!confirm(`Delete "${room.name}"? This cannot be undone.`)) return;
    setDeletingId(room.id);
    await deleteRoom(room.id);
    setDeletingId(null);
  };

  const copyCode = (room: Room) => {
    navigator.clipboard.writeText(room.join_code);
    setCopiedId(room.id + '-code');
    setTimeout(() => setCopiedId(null), 2000);
  };
  const shareLink = (room: Room) => {
    const url = `${window.location.origin}${window.location.pathname}?join=${room.join_code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(room.id + '-link');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ padding: '20px 16px 32px', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&family=VT323&display=swap'); .font-display{font-family:'Bricolage Grotesque',serif;letter-spacing:-0.02em;} .font-pixel{font-family:'VT323',monospace;}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p className="font-pixel" style={{ fontSize: 13, color: T.accent, margin: '0 0 3px', letterSpacing: 1 }}>ROTARY ROOMS</p>
          <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>Your sabay spaces.</h2>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 40, borderRadius: 20, border: 'none', background: T.primary, color: T.bg, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
          <Plus size={16} /> New Room
        </button>
      </div>

      {error && <div style={{ padding: '10px 14px', background: '#FEE2E2', borderRadius: 10, border: '1px solid #FCA5A5', marginBottom: 16 }}><p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>Failed to load rooms: {error}</p></div>}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 10, color: T.textMuted }}>
          <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 14 }}>Loading rooms…</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {!loading && rooms.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          {rooms.map(room => {
            const isOwner = room.user_id === userId;
            const isExpanded = expandedId === room.id;
            const fill = Math.min((room.member_count / room.max_members) * 100, 100);
            const eventDisplay = room.event_date ? formatEventDate(room.event_date) : room.next_event;
            const hasItinerary = room.itinerary && room.itinerary.length > 0;
            const allSocials = [
              room.facebook_url && { Icon: FacebookIcon, url: room.facebook_url, color: '#1877F2' },
              room.instagram_url && { Icon: InstagramIcon, url: room.instagram_url, color: '#E4405F' },
              room.twitter_url && { Icon: TwitterIcon, url: room.twitter_url, color: '#1DA1F2' },
              ...(room.other_socials ?? []).filter(s => s.url).map(s => ({ Icon: null, url: s.url, label: s.label, color: T.primary })),
            ].filter(Boolean);

            return (
              <div key={room.id} style={{ background: T.surface, border: `2px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', opacity: deletingId === room.id ? 0.5 : 1, transition: 'box-shadow 150ms' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 4px 16px ${T.text}18`)}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>

                {/* Main card content */}
                <div style={{ padding: 16 }}>
                  {/* Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#F4ECDF', color: '#9F5E0F', padding: '3px 10px', borderRadius: 20, border: '1px solid #9F5E0F44' }}>Rotary</span>
                    {room.status === 'live' && <span style={{ fontSize: 10, fontWeight: 700, background: '#C82718', color: '#F1EDE1', padding: '2px 8px', borderRadius: 8 }}>LIVE</span>}
                    {room.is_private && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, background: T.surfaceAlt, color: T.textMuted, padding: '2px 8px', borderRadius: 8, border: `1px solid ${T.border}` }}><Lock size={9} /> PRIVATE</span>}
                    {isOwner && <span style={{ fontSize: 10, fontWeight: 700, background: T.primary, color: T.bg, padding: '2px 8px', borderRadius: 8, marginLeft: 'auto' }}>YOUR ROOM</span>}
                  </div>

                  <h3 className="font-display" style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: '0 0 4px' }}>{room.name}</h3>
                  {room.description && <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 8px', lineHeight: 1.5 }}>{room.description}</p>}
                  <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 10px' }}>Hosted by <strong style={{ color: T.text }}>{room.host_name}</strong></p>

                  {/* Members */}
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: T.textMuted }}><Users size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{room.member_count} / {room.max_members} members</span>
                    <div style={{ height: 5, background: T.surfaceAlt, borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
                      <div style={{ height: '100%', borderRadius: 3, width: `${fill}%`, background: T.primary, transition: 'width 600ms' }} />
                    </div>
                  </div>

                  {/* Event & Location */}
                  {(eventDisplay || room.location_name) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                      {eventDisplay && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, background: T.surfaceAlt }}>
                          <span style={{ fontSize: 13 }}>📅</span>
                          <p style={{ fontSize: 12, color: T.text, margin: 0, fontWeight: 600, flex: 1 }}>{eventDisplay}</p>
                        </div>
                      )}
                      {room.location_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, background: T.surfaceAlt }}>
                          <MapPin size={13} style={{ color: T.primary, flexShrink: 0 }} />
                          <p style={{ fontSize: 12, color: T.text, margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.location_name}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Social links */}
                  {allSocials.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      {allSocials.map((s, i) => s && (
                        s.Icon
                          ? <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}18`, border: `1px solid ${s.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                              <s.Icon size={15} color={s.color} />
                            </a>
                          : <a key={i} href={s.url} target="_blank" rel="noreferrer" style={{ padding: '4px 10px', borderRadius: 8, background: `${T.primary}12`, border: `1px solid ${T.primary}33`, display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 600, color: T.primary, textDecoration: 'none', gap: 4 }}>
                              🔗 {(s as { label?: string }).label || 'Link'}
                            </a>
                      ))}
                    </div>
                  )}

                  {/* Itinerary preview */}
                  {hasItinerary && (
                    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : room.id)}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0, fontFamily: 'inherit' }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.primary }}>📋 Itinerary ({room.itinerary.length} steps)</span>
                        {isExpanded ? <ChevronUp size={14} style={{ color: T.textMuted }} /> : <ChevronDown size={14} style={{ color: T.textMuted }} />}
                      </button>
                      {isExpanded && (
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {room.itinerary.map((item, idx) => (
                            <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                              <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${T.primary}18`, border: `1.5px solid ${T.primary}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: T.primary, flexShrink: 0 }}>{idx + 1}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  {item.time && <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>{item.time}</span>}
                                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.title}</span>
                                </div>
                                {item.description && <p style={{ fontSize: 12, color: T.textMuted, margin: '2px 0 0', lineHeight: 1.4 }}>{item.description}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Join code strip */}
                <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 16px', background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <p className="font-pixel" style={{ fontSize: 9, color: T.textMuted, margin: '0 0 1px', letterSpacing: 1 }}>JOIN CODE</p>
                    <p className="font-display" style={{ fontSize: 15, fontWeight: 800, color: T.primary, margin: 0, letterSpacing: 1.5 }}>{room.join_code}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => copyCode(room)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${T.border}`, background: T.surface, color: T.text, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                      {copiedId === room.id + '-code' ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Code</>}
                    </button>
                    <button onClick={() => shareLink(room)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${T.primary}44`, background: `${T.primary}12`, color: T.primary, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                      {copiedId === room.id + '-link' ? <><Check size={12} /> Copied!</> : <><Share2 size={12} /> Share Link</>}
                    </button>
                  </div>
                </div>

                {/* Owner actions */}
                {isOwner && (
                  <div style={{ borderTop: `1px solid ${T.border}`, padding: '10px 16px', display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(room)} style={{ flex: 1, height: 36, borderRadius: 10, border: `1.5px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Edit2 size={13} /> Edit
                    </button>
                    <button onClick={() => handleDelete(room)} disabled={!!deletingId} style={{ flex: 1, height: 36, borderRadius: 10, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#B91C1C', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && rooms.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '40px 20px', border: `2px dashed ${T.border}`, borderRadius: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏛️</div>
          <p className="font-display" style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>No Rotary rooms yet.</p>
          <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 20px' }}>Be the first to create a room for your chapter!</p>
          <button onClick={openCreate} style={{ padding: '10px 24px', borderRadius: 24, border: 'none', background: T.primary, color: T.bg, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Plus size={15} /> Create first room
          </button>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <PixelHeart color={T.accent} size={10} />
          <p className="font-pixel" style={{ fontSize: 11, color: T.textMuted, margin: 0, letterSpacing: 1 }}>ROTARY ROOMS — SABAYPH</p>
          <PixelHeart color={T.accent} size={10} />
        </div>
      </div>

      {wizardOpen && (
        <RoomWizard
          theme={T}
          editing={editing}
          userId={userId}
          onClose={() => { setWizardOpen(false); setEditing(null); }}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
