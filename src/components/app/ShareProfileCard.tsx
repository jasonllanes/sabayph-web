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
      padding: '20px',
    }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Dialog */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 360,
        background: T.bg,
        borderRadius: 24,
        border: `3px solid ${T.text}`,
        boxShadow: `8px 8px 0 ${T.text}`,
        overflow: 'hidden',
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}>
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 10,
            width: 32, height: 32, borderRadius: '50%',
            border: `1.5px solid ${T.border}`,
            background: T.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: T.textMuted,
          }}
        >
          <X size={16} />
        </button>

        {/* Card content (what gets printed) */}
        <div ref={cardRef}>
          {/* Card header — tall cover area */}
          <div style={{
            background: T.primary, height: 150,
            padding: '16px 16px 0',
            position: 'relative',
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
              position: 'absolute', bottom: -30, right: -30,
              width: 120, height: 120, borderRadius: '50%',
              background: '#ffffff0d', pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', bottom: 10, right: 30,
              width: 60, height: 60, borderRadius: '50%',
              background: '#ffffff08', pointerEvents: 'none',
            }} />
            {/* Branding */}
            <div style={{
              position: 'relative', display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <img
                src={IMG('sabayph_logo.png')}
                alt="SabayPH"
                style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover' }}
              />
              <span style={{
                fontFamily: '"Bricolage Grotesque", serif', fontSize: 15, fontWeight: 800,
                color: '#fff', letterSpacing: '-0.02em',
              }}>
                Sabay<span style={{ color: '#EEA64C' }}>PH</span>
              </span>
              <span style={{
                fontFamily: '"VT323", monospace', fontSize: 11, color: '#ffffff88',
                letterSpacing: 1.5, marginLeft: 2,
              }}>
                KASAMA CARD
              </span>
            </div>
          </div>

          {/* Card body — avatar sits halfway across the header/body boundary */}
          <div style={{
            background: T.surface,
            padding: '0 24px 20px',
            textAlign: 'center',
          }}>
            {/* Avatar — pulled up so it straddles the boundary */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: -52, marginBottom: 14 }}>
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                border: `4px solid ${T.surface}`,
                overflow: 'hidden', background: T.primary,
                boxShadow: `0 4px 16px rgba(0,0,0,0.25)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <span style={{
                  fontFamily: '"Bricolage Grotesque", serif', fontWeight: 800, fontSize: 36,
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
                fontSize: 22, fontWeight: 800, color: T.text, margin: '0 0 4px',
              }}
            >
              {displayName}
            </h2>

            {location && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 4, fontSize: 13, color: T.textMuted, marginBottom: 8,
              }}>
                <MapPin size={12} />
                <span>{location}</span>
              </div>
            )}

            {kasamaRating != null && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 12px', borderRadius: 20,
                background: '#FEF9C3', border: '1px solid #FDE047',
                fontSize: 12, fontWeight: 700, color: '#A16207',
                marginBottom: 12,
              }}>
                ⭐ {kasamaRating.toFixed(1)} Kasama Rating
              </div>
            )}

            {/* Kasama tag */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 16px', borderRadius: 20,
              background: T.surfaceAlt ?? T.bg,
              border: `2px solid ${T.border}`,
              fontSize: 15, fontWeight: 700, color: T.primary,
              fontFamily: '"VT323", monospace', letterSpacing: 2,
              margin: '0 0 16px',
            }}>
              {kasamaTag.toUpperCase()}
            </div>

            {/* QR code */}
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: 12,
            }}>
              <div style={{
                padding: 12, borderRadius: 16,
                border: `2px solid ${T.border}`,
                background: '#fff',
                display: 'inline-flex',
              }}>
                <QRCodeSVG
                  value={profileUrl}
                  size={128}
                  bgColor="#ffffff"
                  fgColor={T.text}
                  level="M"
                  imageSettings={{
                    src: IMG('sabayph_logo.png'),
                    x: undefined, y: undefined,
                    height: 24, width: 24,
                    excavate: true,
                  }}
                />
              </div>
            </div>

            <p style={{ fontSize: 11, color: T.textMuted, margin: '0 0 4px' }}>
              Scan to view profile on SabayPH
            </p>
            <p style={{
              fontSize: 10, color: T.textMuted,
              fontFamily: '"VT323", monospace', letterSpacing: 1, opacity: 0.6,
            }}>
              https://sabayph-web.vercel.app/
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{
          padding: '12px 20px 20px',
          background: T.bg,
          display: 'flex', gap: 10,
          borderTop: `1.5px solid ${T.border}`,
        }}>
          <button
            onClick={handleDownloadPng}
            disabled={downloading}
            style={{
              flex: 1, height: 46, borderRadius: 23,
              border: `2px solid ${T.border}`,
              background: T.surface,
              color: T.text, fontSize: 14, fontWeight: 700,
              fontFamily: '"DM Sans", system-ui, sans-serif',
              cursor: downloading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              opacity: downloading ? 0.65 : 1,
              transition: 'background 150ms, opacity 150ms',
            }}
            onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = T.bg; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.surface; }}
          >
            {downloading
              ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              : <><Download size={16} /> Save as PNG</>
            }
          </button>
          <button
            onClick={handleShare}
            style={{
              flex: 1, height: 46, borderRadius: 23, border: 'none',
              background: T.primary,
              color: '#fff', fontSize: 14, fontWeight: 700,
              fontFamily: '"DM Sans", system-ui, sans-serif',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: `0 4px 14px ${T.primary}44`,
              transition: 'opacity 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
