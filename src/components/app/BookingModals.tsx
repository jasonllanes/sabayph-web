import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, MapPin, ShoppingBasket, Clock, DollarSign, XCircle, Package } from 'lucide-react';
import type { Theme, Room, BookingRating } from '@/types';

// ── Swipe-to-confirm ─────────────────────────────────────────────────────────

export function SwipeToConfirm({
  label = 'Slide to confirm',
  sublabel,
  color = '#059669',
  onConfirm,
}: {
  label?: string;
  sublabel?: string;
  color?: string;
  onConfirm: () => void;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const draggingRef = useRef(false);

  const THUMB = 54;
  const PAD = 4;
  const getMax = () => Math.max((trackRef.current?.offsetWidth ?? 280) - THUMB - PAD * 2, 1);

  const onPointerDown = (e: React.PointerEvent) => {
    if (done) return;
    draggingRef.current = true;
    setDragging(true);
    startXRef.current = e.clientX - dragX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const max = getMax();
    const x = Math.max(0, Math.min(e.clientX - startXRef.current, max));
    setDragX(x);
  };

  const onPointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    const max = getMax();
    if (dragX / max >= 0.75) {
      setDragX(max);
      setDone(true);
      setTimeout(onConfirm, 380);
    } else {
      setDragX(0);
    }
  };

  const pct = dragX / getMax();

  return (
    <div>
      {sublabel && (
        <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 10px', textAlign: 'center' }}>{sublabel}</p>
      )}
      <div
        ref={trackRef}
        style={{
          position: 'relative', height: 58, borderRadius: 29,
          background: done ? `${color}25` : `${color}12`,
          border: `2px solid ${done ? color : color + '55'}`,
          overflow: 'hidden', touchAction: 'none', userSelect: 'none',
          transition: 'border-color 300ms, background 300ms',
        }}
      >
        {/* Progress fill */}
        <div style={{
          position: 'absolute', inset: 0,
          width: PAD + THUMB / 2 + dragX,
          background: `${color}1A`, borderRadius: 29,
          transition: dragging ? 'none' : 'width 300ms ease',
          pointerEvents: 'none',
        }} />
        {/* Centre label */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', gap: 6 }}>
          {done ? (
            <span style={{ fontSize: 14, fontWeight: 800, color }}>✓ Confirmed!</span>
          ) : (
            <>
              <span style={{ fontSize: 14, fontWeight: 700, color, opacity: Math.max(0.15, 1 - pct * 2.2), transition: 'opacity 80ms' }}>{label}</span>
              {[1, 2, 3].map(i => (
                <span key={i} style={{ fontSize: 14, color, opacity: Math.max(0, (0.5 - i * 0.12) - pct * 0.8), transition: 'opacity 80ms' }}>›</span>
              ))}
            </>
          )}
        </div>
        {/* Thumb */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            position: 'absolute', top: PAD, left: PAD + dragX,
            width: THUMB, height: 58 - PAD * 2, borderRadius: 25,
            background: done ? color : '#fff',
            boxShadow: '0 2px 14px rgba(0,0,0,0.18)',
            cursor: done ? 'default' : 'grab',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, transition: dragging ? 'none' : 'left 300ms ease, background 250ms',
            zIndex: 2, touchAction: 'none', userSelect: 'none',
          }}
        >
          {done ? '✓' : '→'}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}

// ── Star picker ──────────────────────────────────────────────────────────────

function StarPicker({ value, onChange, color = '#D97706' }: { value: number; onChange: (v: number) => void; color?: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
          <Star size={26} style={{ color: n <= (hover || value) ? color : '#D1D5DB', fill: n <= (hover || value) ? color : 'transparent', transition: 'all 100ms' }} />
        </button>
      ))}
    </div>
  );
}

// ── Booking Detail Sheet ──────────────────────────────────────────────────────

interface DetailSheetProps {
  room: Room;
  isOwner: boolean;
  courierName: string;
  theme: Theme;
  onClose: () => void;
  onCancel: () => void;
  onComplete: () => void;
}

export function BookingDetailSheet({ room, isOwner, courierName, theme: T, onClose, onCancel, onComplete }: DetailSheetProps) {
  const isActive = room.status === 'confirmed';
  const isDone   = room.status === 'completed';
  const isCancelled = room.status === 'cancelled';

  const statusBadge = isDone
    ? { label: '✅ Completed', bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' }
    : isCancelled
      ? { label: '❌ Cancelled', bg: '#FEF2F2', color: '#B91C1C', border: '#FCA5A5' }
      : { label: '📦 Active booking', bg: '#FEF3E2', color: '#D97706', border: '#F9C07E' };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', background: T.surface, borderRadius: '20px 20px 0 0', maxHeight: '82vh', display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(0,0,0,0.3)' }}>
        {/* Handle */}
        <div style={{ flexShrink: 0, padding: '12px 20px 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: T.border, margin: '0 auto 14px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}` }}>
                {statusBadge.label}
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: '6px 0 2px', fontFamily: '"Bricolage Grotesque",serif' }}>{room.name}</h3>
              <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
                {isOwner ? `Courier: ${courierName}` : `Requested by: ${room.host_name}`}
              </p>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${T.border}`, background: T.surfaceAlt, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 12px' }}>

          {/* Items */}
          {room.items?.length > 0 && (
            <div style={{ marginBottom: 16, padding: 14, background: T.surfaceAlt, borderRadius: 14, border: `1.5px solid ${T.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <ShoppingBasket size={14} style={{ color: T.primary }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Shopping List ({room.items.length} items)</span>
              </div>
              {room.items.map(it => (
                <div key={it.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.primary, marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{it.qty} {it.unit} {it.name}</span>
                    {it.brand && <span style={{ fontSize: 12, color: T.textMuted }}> ({it.brand})</span>}
                    {it.max_price != null && <span style={{ fontSize: 12, color: T.textMuted }}> — max ₱{it.max_price}</span>}
                    {it.substitute && <span style={{ fontSize: 11, color: '#7C3AED', marginLeft: 4 }}>[sub OK]</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {room.location_name && (
              <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: T.surfaceAlt, borderRadius: 12, alignItems: 'flex-start' }}>
                <Package size={14} style={{ color: T.primary, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: '0 0 2px' }}>BUY FROM</p>
                  <p style={{ fontSize: 13, color: T.text, margin: 0 }}>{room.location_name}</p>
                </div>
              </div>
            )}
            {room.dropoff_name && (
              <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: T.surfaceAlt, borderRadius: 12, alignItems: 'flex-start' }}>
                <MapPin size={14} style={{ color: '#E4405F', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: '0 0 2px' }}>DROPOFF</p>
                  <p style={{ fontSize: 13, color: T.text, margin: 0 }}>{room.dropoff_name}</p>
                </div>
              </div>
            )}
            {(room.needed_by || room.event_date) && (
              <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: T.surfaceAlt, borderRadius: 12, alignItems: 'flex-start' }}>
                <Clock size={14} style={{ color: '#7C3AED', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: '0 0 2px' }}>MEETUP / NEEDED BY</p>
                  <p style={{ fontSize: 13, color: T.text, margin: 0 }}>{fmt((room.needed_by || room.event_date)!)}</p>
                </div>
              </div>
            )}
            {room.goods_budget != null && (
              <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: T.surfaceAlt, borderRadius: 12, alignItems: 'flex-start' }}>
                <DollarSign size={14} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: '0 0 2px' }}>GOODS BUDGET</p>
                  <p style={{ fontSize: 13, color: T.text, margin: 0 }}>₱{room.goods_budget.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Sticky action footer */}
        {isActive && (
          <div style={{ flexShrink: 0, borderTop: `1px solid ${T.border}`, background: T.surface }}>
            {/* Buyer swipe-to-confirm */}
            {isOwner && (
              <div style={{ padding: '14px 20px 4px' }}>
                <SwipeToConfirm
                  label="Slide to mark as done"
                  sublabel="Confirm the delivery was completed"
                  color="#059669"
                  onConfirm={onComplete}
                />
              </div>
            )}
            <div style={{ padding: isOwner ? '8px 20px 20px' : '12px 20px 20px' }}>
              <button onClick={onCancel}
                style={{ width: '100%', height: 46, borderRadius: 23, border: '1.5px solid #FCA5A5', background: '#FEF2F2', color: '#B91C1C', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <XCircle size={16} /> Cancel Booking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Cancel Modal ──────────────────────────────────────────────────────────────

interface CancelModalProps {
  theme: Theme;
  submitting: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export function CancelModal({ theme: T, submitting, onConfirm, onClose }: CancelModalProps) {
  const [reason, setReason] = useState('');
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 510, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 380, background: T.surface, borderRadius: 20, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: '0 0 6px', fontFamily: '"Bricolage Grotesque",serif' }}>Cancel Booking</h3>
        <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 16px' }}>Let the other party know why you're cancelling.</p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Change of plans, item no longer needed…"
          rows={4}
          style={{ width: '100%', padding: '10px 14px', fontSize: 13, fontFamily: '"DM Sans",system-ui,sans-serif', border: `1.5px solid ${T.border}`, borderRadius: 12, background: T.bg, color: T.text, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button onClick={onClose} disabled={submitting}
            style={{ flex: 1, height: 44, borderRadius: 22, border: `1.5px solid ${T.border}`, background: T.surfaceAlt, color: T.text, fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
            Back
          </button>
          <button onClick={() => onConfirm(reason.trim())} disabled={submitting || !reason.trim()}
            style={{ flex: 1, height: 44, borderRadius: 22, border: 'none', background: !reason.trim() ? T.border : '#B91C1C', color: !reason.trim() ? T.textMuted : '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: !reason.trim() ? 'default' : 'pointer', transition: 'all 150ms' }}>
            {submitting ? 'Cancelling…' : 'Confirm Cancel'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Rating Modal ──────────────────────────────────────────────────────────────

interface RatingCategory { key: 'communication' | 'timeliness' | 'reliability'; label: string; icon: string; desc: string; }

const CATEGORIES: RatingCategory[] = [
  { key: 'communication', label: 'Communication', icon: '💬', desc: 'Responsive and clear messages' },
  { key: 'timeliness',    label: 'Timeliness',    icon: '⏱️', desc: 'Delivered / coordinated on time' },
  { key: 'reliability',   label: 'Reliability',   icon: '✅', desc: 'Followed through on commitments' },
];

interface RatingModalProps {
  rateeRole: 'courier' | 'requester';
  rateeName: string;
  existingRating: BookingRating | null;
  theme: Theme;
  submitting: boolean;
  onSubmit: (scores: { overall: number; communication: number; timeliness: number; reliability: number; comment: string }) => void;
  onClose: () => void;
}

export function RatingModal({ rateeRole, rateeName, existingRating, theme: T, submitting, onSubmit, onClose }: RatingModalProps) {
  const [overall, setOverall]           = useState(existingRating?.overall_score       ?? 0);
  const [communication, setCommunication] = useState(existingRating?.communication_score ?? 0);
  const [timeliness, setTimeliness]     = useState(existingRating?.timeliness_score     ?? 0);
  const [reliability, setReliability]   = useState(existingRating?.reliability_score   ?? 0);
  const [comment, setComment]           = useState(existingRating?.comment              ?? '');

  const scores = { communication, timeliness, reliability };
  const setters: Record<string, (v: number) => void> = { communication: setCommunication, timeliness: setTimeliness, reliability: setReliability };

  const canSubmit = !existingRating && overall > 0;
  const alreadyRated = !!existingRating;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 510, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, background: T.surface, borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: T.primary, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', margin: '0 0 2px' }}>
              {alreadyRated ? 'YOUR RATING' : `RATE YOUR ${rateeRole.toUpperCase()}`}
            </p>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0, fontFamily: '"Bricolage Grotesque",serif' }}>{rateeName}</h3>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '18px 20px 20px' }}>
          {/* Overall */}
          <div style={{ marginBottom: 18, textAlign: 'center' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, margin: '0 0 8px', letterSpacing: 0.5 }}>OVERALL EXPERIENCE</p>
            <StarPicker value={overall} onChange={alreadyRated ? () => {} : setOverall} color="#D97706" />
            {overall > 0 && (
              <p style={{ fontSize: 12, color: '#D97706', fontWeight: 700, margin: '6px 0 0' }}>
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][overall]}
              </p>
            )}
          </div>

          {/* Category scores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
            {CATEGORIES.map(cat => (
              <div key={cat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: T.surfaceAlt, borderRadius: 12 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: '0 0 1px' }}>{cat.icon} {cat.label}</p>
                  <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>{cat.desc}</p>
                </div>
                <StarPicker value={scores[cat.key] ?? 0} onChange={alreadyRated ? () => {} : setters[cat.key]} color={T.primary} />
              </div>
            ))}
          </div>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={e => !alreadyRated && setComment(e.target.value)}
            readOnly={alreadyRated}
            placeholder="Share your experience (optional)…"
            rows={3}
            style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontFamily: '"DM Sans",system-ui,sans-serif', border: `1.5px solid ${T.border}`, borderRadius: 12, background: alreadyRated ? T.surfaceAlt : T.bg, color: T.text, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 14 }}
          />

          {alreadyRated ? (
            <div style={{ textAlign: 'center', padding: '8px', background: '#DCFCE7', borderRadius: 12 }}>
              <p style={{ fontSize: 13, color: '#15803D', fontWeight: 700, margin: 0 }}>✅ You've already submitted your rating.</p>
            </div>
          ) : (
            <button
              onClick={() => onSubmit({ overall, communication, timeliness, reliability, comment })}
              disabled={!canSubmit || submitting}
              style={{ width: '100%', height: 46, borderRadius: 23, border: 'none', background: canSubmit ? T.primary : T.border, color: canSubmit ? T.bg : T.textMuted, fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: canSubmit ? 'pointer' : 'default', transition: 'all 150ms' }}>
              {submitting ? 'Submitting…' : overall === 0 ? 'Select a star rating first' : 'Submit Rating'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
