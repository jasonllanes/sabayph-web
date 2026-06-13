import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, MoreVertical, Trash2 } from 'lucide-react';
import type { Story } from '@/hooks/useStories';
import { getDefaultAvatar } from '@/components/app/tagConstants';

interface Props {
  stories: Story[];
  startIndex?: number;
  onClose: () => void;
  isMobile?: boolean;
  userId?: string;
  userAvatar?: string;
  onDelete?: (storyId: string) => Promise<void>;
}

const DURATION_MS = 5000;
const TICK_MS = 50;

function timeAgoShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function noteFontSize(text: string): number {
  if (text.length < 50) return 28;
  if (text.length < 100) return 22;
  return 16;
}

export default function StoryViewer({ stories, startIndex = 0, onClose, isMobile, userId, userAvatar, onDelete }: Props) {
  const [idx, setIdx] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [localStories, setLocalStories] = useState(stories);

  const story = localStories[idx];

  // Hide bottom nav and lock body scroll while viewer is open
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'story-viewer-hide-nav';
    style.textContent = '[data-bottomnav] { display: none !important; }';
    document.head.appendChild(style);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.getElementById('story-viewer-hide-nav')?.remove();
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const clearTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const advance = () => {
    if (idx < localStories.length - 1) {
      setIdx(i => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goBack = () => {
    if (idx > 0) {
      setIdx(i => i - 1);
      setProgress(0);
    }
  };

  useEffect(() => {
    setProgress(0);
    clearTimer();
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        const next = p + (TICK_MS / DURATION_MS) * 100;
        if (next >= 100) {
          clearTimer();
          setTimeout(advance, 60);
          return 100;
        }
        return next;
      });
    }, TICK_MS);
    return clearTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, localStories.length]);

  const handleDelete = async () => {
    if (!onDelete || !story) return;
    setDeleting(true);
    setShowMenu(false);
    await onDelete(story.id);
    const remaining = localStories.filter(s => s.id !== story.id);
    if (remaining.length === 0) {
      onClose();
      return;
    }
    setLocalStories(remaining);
    setIdx(i => Math.min(i, remaining.length - 1));
    setProgress(0);
    setDeleting(false);
  };

  if (!story) return null;

  const isOwn = userId && story.user_id === userId;
  const isDesktop = !isMobile;

  const containerStyle: React.CSSProperties = isDesktop
    ? {
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }
    : {
        position: 'fixed', inset: 0, zIndex: 99999,
        background: '#000',
      };

  const cardStyle: React.CSSProperties = isDesktop
    ? {
        width: 400, height: 700, borderRadius: 20, overflow: 'hidden',
        position: 'relative', background: '#000',
        boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
      }
    : {
        position: 'absolute', inset: 0,
      };

  return (
    <div style={containerStyle} onClick={isDesktop ? onClose : undefined}>
      <div style={cardStyle} onClick={e => e.stopPropagation()}>

        {/* Progress bars */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', gap: 4, padding: '10px 12px 0' }}>
          {localStories.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: '#fff',
                width: i < idx ? '100%' : i === idx ? `${progress}%` : '0%',
                transition: i === idx ? `width ${TICK_MS}ms linear` : 'none',
              }} />
            </div>
          ))}
        </div>

        {/* Author bar */}
        <div style={{ position: 'absolute', top: 20, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.8)', overflow: 'hidden', background: '#043E81', position: 'relative', flexShrink: 0 }}>
              <img
                src={isOwn && userAvatar ? userAvatar : getDefaultAvatar(story.gender, story.profile_tags)}
                alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.currentTarget as HTMLImageElement).src = getDefaultAvatar(story.gender, story.profile_tags); }}
              />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: '"DM Sans",system-ui,sans-serif', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                {story.display_name ?? 'Kasama'}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: '"DM Sans",system-ui,sans-serif' }}>
                {timeAgoShort(story.created_at)}
              </p>
            </div>
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Three-dot menu — only for own stories */}
            {isOwn && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowMenu(v => !v)}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
                >
                  <MoreVertical size={16} />
                </button>

                {showMenu && (
                  <div
                    style={{
                      position: 'absolute', top: 38, right: 0,
                      background: '#1a1a1a', borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      overflow: 'hidden', minWidth: 160, zIndex: 20,
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      style={{
                        width: '100%', padding: '12px 16px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 10,
                        color: '#FF6B6B', fontSize: 14, fontWeight: 600,
                        fontFamily: '"DM Sans",system-ui,sans-serif',
                        textAlign: 'left',
                        transition: 'background 150ms',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,107,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <Trash2 size={15} />
                      {deleting ? 'Deleting…' : 'Delete story'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Story content */}
        {story.type === 'photo' && story.media_url ? (
          <img
            src={story.media_url}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: story.theme_color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 32,
          }}>
            <p style={{
              margin: 0,
              fontSize: noteFontSize(story.note_text ?? ''),
              fontWeight: 800,
              color: '#fff',
              fontFamily: '"Bricolage Grotesque",serif',
              lineHeight: 1.3,
              textAlign: 'center',
              textShadow: '0 2px 12px rgba(0,0,0,0.3)',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              width: '100%',
            }}>
              {story.note_text}
            </p>
          </div>
        )}

        {/* Tap zones (close menu on tap) */}
        <div
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', cursor: 'pointer', zIndex: 5 }}
          onClick={() => { if (showMenu) { setShowMenu(false); return; } goBack(); }}
        />
        <div
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', cursor: 'pointer', zIndex: 5 }}
          onClick={() => { if (showMenu) { setShowMenu(false); return; } advance(); }}
        />

        {/* Desktop nav arrows */}
        {isDesktop && idx > 0 && (
          <button
            onClick={goBack}
            style={{ position: 'absolute', left: -52, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
          >
            <ChevronLeft size={20} color="#000" />
          </button>
        )}
        {isDesktop && idx < localStories.length - 1 && (
          <button
            onClick={advance}
            style={{ position: 'absolute', right: -52, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
          >
            <ChevronRight size={20} color="#000" />
          </button>
        )}
      </div>
    </div>
  );
}
