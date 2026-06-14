import { useRef, useState } from 'react';
import { X, Download, Share2, MapPin, Loader } from 'lucide-react';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import type { Theme } from '@/types';
import { getDefaultAvatar } from '@/components/app/tagConstants';

const IMG = (n: string) =>
  `https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/${n}`;

interface ShareProfileCardProps {
  onClose: () => void;
  theme: Theme;
  displayName: string;
  kasamaTag: string;
  location?: string | null;
  gender?: string | null;
  profileTags?: string[];
  avatarUrl?: string | null;
  kasamaRating?: number | null;
}

export default function ShareProfileCard({
  onClose,
  theme: T,
  displayName,
  kasamaTag,
  location,
  gender,
  profileTags = [],
  avatarUrl,
  kasamaRating,
}: ShareProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const profileUrl = `${window.location.origin}/?profile=${kasamaTag}`;
  const defaultAvatar = getDefaultAvatar(gender, profileTags);
  const avatarSrc = avatarUrl || IMG(defaultAvatar.replace('/', ''));

  const handleDownloadPng = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `sabayph-${kasamaTag}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName} – SabayPH`,
          text: `Connect with ${displayName} on SabayPH! Tag: ${kasamaTag}`,
          url: profileUrl,
        });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(profileUrl);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 340,
        maxHeight: 'calc(100dvh - 80px)',
        display: 'flex', flexDirection: 'column',
        background: T.bg,
        borderRadius: 20,
        border: `2.5px solid ${T.text}`,
        boxShadow: `6px 6px 0 ${T.text}`,
        overflow: 'hidden',
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 10,
            width: 28, height: 28, borderRadius: '50%',
            border: `1.5px solid ${T.border}`,
            background: T.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: T.textMuted,
          }}
        >
          <X size={14} />
        </button>

        {/* Card content (what gets printed) — scrollable on very small screens */}
        <div ref={cardRef} style={{ overflowY: 'auto', flex: 1 }}>
          {/* Card header */}
          <div style={{
            background: T.primary, height: 100,
            padding: '12px 14px 0',
            position: 'relative',
            flexShrink: 0,
          }}>
            {/* Grid pattern */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.12,
              backgroundImage: `linear-gradient(${T.bg} 1px,transparent 1px),linear-gradient(90deg,${T.bg} 1px,transparent 1px)`,
              backgroundSize: '18px 18px',
              pointerEvents: 'none',
            }} />
            {/* Decorative circles */}
            <div style={{
              position: 'absolute', bottom: -24, right: -24,
              width: 90, height: 90, borderRadius: '50%',
              background: '#ffffff0d', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: 8, right: 26,
              width: 44, height: 44, borderRadius: '50%',
              background: '#ffffff08', pointerEvents: 'none',
            }} />
            {/* Branding */}
            <div style={{
              position: 'relative', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <img
                src="/sabayph_logo_tp.png"
                alt="SabayPH"
                style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover' }}
              />
              <span style={{
                fontFamily: '"Bricolage Grotesque", serif', fontSize: 14, fontWeight: 800,
                color: '#fff', letterSpacing: '-0.02em',
              }}>
                Sabay<span style={{ color: '#EEA64C' }}>PH</span>
              </span>
              <span style={{
                fontFamily: '"VT323", monospace', fontSize: 10, color: '#ffffff88',
                letterSpacing: 1.5, marginLeft: 2,
              }}>
                KASAMA CARD
              </span>
            </div>
          </div>

          {/* Card body */}
          <div style={{
            background: T.surface,
            padding: '0 20px 16px',
            textAlign: 'center',
          }}>
            {/* Avatar — straddles header/body boundary */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: -38, marginBottom: 10 }}>
              <div style={{
                width: 76, height: 76, borderRadius: '50%',
                border: `3px solid ${T.surface}`,
                overflow: 'hidden', background: T.primary,
                boxShadow: `0 4px 12px rgba(0,0,0,0.25)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <span style={{
                  fontFamily: '"Bricolage Grotesque", serif', fontWeight: 800, fontSize: 28,
                  color: '#fff', position: 'absolute',
                }}>
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <img
                  src={avatarUrl || avatarSrc}
                  alt={displayName}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            </div>

            <h2
              className="font-display"
              style={{
                fontFamily: '"Bricolage Grotesque", serif', letterSpacing: '-0.02em',
                fontSize: 18, fontWeight: 800, color: T.text, margin: '0 0 3px',
              }}
            >
              {displayName}
            </h2>

            {location && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 4, fontSize: 12, color: T.textMuted, marginBottom: 6,
              }}>
                <MapPin size={11} />
                <span>{location}</span>
              </div>
            )}

            {kasamaRating != null && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 10px', borderRadius: 20,
                background: '#FEF9C3', border: '1px solid #FDE047',
                fontSize: 11, fontWeight: 700, color: '#A16207',
                marginBottom: 8,
              }}>
                ⭐ {kasamaRating.toFixed(1)} Kasama Rating
              </div>
            )}

            {/* Kasama tag */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 14px', borderRadius: 20,
              background: T.surfaceAlt ?? T.bg,
              border: `2px solid ${T.border}`,
              fontSize: 14, fontWeight: 700, color: T.primary,
              fontFamily: '"VT323", monospace', letterSpacing: 2,
              margin: '0 0 12px',
            }}>
              {kasamaTag.toUpperCase()}
            </div>

            {/* QR code */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <QRCodeSVG
                value={profileUrl}
                size={104}
                bgColor="transparent"
                fgColor={T.text}
                level="M"
                imageSettings={{
                  src: '/sabayph_logo_tp.png',
                  x: undefined, y: undefined,
                  height: 20, width: 20,
                  excavate: true,
                }}
              />
            </div>

            <p style={{ fontSize: 11, color: T.textMuted, margin: '0 0 2px' }}>
              Scan to view profile on SabayPH
            </p>
            <p style={{
              fontSize: 9, color: T.textMuted,
              fontFamily: '"VT323", monospace', letterSpacing: 1, opacity: 0.6,
              margin: 0,
            }}>
              https://sabayph-web.vercel.app/
            </p>
          </div>
        </div>

        {/* Action buttons — always visible, never scrolled away */}
        <div style={{
          flexShrink: 0,
          padding: '10px 16px 16px',
          background: T.bg,
          display: 'flex', gap: 10,
          borderTop: `1.5px solid ${T.border}`,
        }}>
          <button
            onClick={handleDownloadPng}
            disabled={downloading}
            style={{
              flex: 1, height: 42, borderRadius: 21,
              border: `2px solid ${T.border}`,
              background: T.surface,
              color: T.text, fontSize: 13, fontWeight: 700,
              fontFamily: '"DM Sans", system-ui, sans-serif',
              cursor: downloading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: downloading ? 0.65 : 1,
              transition: 'background 150ms, opacity 150ms',
            }}
            onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = T.bg; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.surface; }}
          >
            {downloading
              ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              : <><Download size={14} /> Save as PNG</>
            }
          </button>
          <button
            onClick={handleShare}
            style={{
              flex: 1, height: 42, borderRadius: 21, border: 'none',
              background: T.primary,
              color: '#fff', fontSize: 13, fontWeight: 700,
              fontFamily: '"DM Sans", system-ui, sans-serif',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: `0 4px 14px ${T.primary}44`,
              transition: 'opacity 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Share2 size={14} /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
