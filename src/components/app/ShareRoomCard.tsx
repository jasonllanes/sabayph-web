import { useRef, useState } from 'react';
import { X, Download, Share2, Loader } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import type { Theme, Room } from '@/types';

const IMG = (n: string) =>
  `https://ajyaecxypxtzahjhezwy.supabase.co/storage/v1/object/public/app_images/${n}`;

type RoomCategory = 'rotary' | 'pasabuy' | 'gaming' | 'cafe';

const CATEGORY_META: Record<RoomCategory, { label: string; emoji: string; cardLabel: string }> = {
  rotary:  { label: 'Rotary',  emoji: '🏛️', cardLabel: 'ROTARY ROOM' },
  pasabuy: { label: 'PasaBuy', emoji: '🛒', cardLabel: 'PASABUY REQUEST' },
  gaming:  { label: 'Gaming',  emoji: '🎮', cardLabel: 'GAMING LOBBY' },
  cafe:    { label: 'Cafe',    emoji: '☕', cardLabel: 'CAFE HANGOUT' },
};

interface ShareRoomCardProps {
  onClose: () => void;
  theme: Theme;
  room: Room;
  category: RoomCategory;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export default function ShareRoomCard({ onClose, theme: T, room, category }: ShareRoomCardProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrExportRef = useRef<HTMLDivElement>(null); // untainted canvas (no imageSettings)
  const [downloading, setDownloading] = useState(false);

  const meta = CATEGORY_META[category];
  const joinUrl = `${window.location.origin}${window.location.pathname}?join=${room.join_code}`;

  const handleDownloadPng = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const SCALE = 3;
      const W = 340;
      const HEADER_H = 160;
      const BODY_H = 260;
      const H = HEADER_H + BODY_H;
      const CORNER = 20;

      const canvas = document.createElement('canvas');
      canvas.width = W * SCALE;
      canvas.height = H * SCALE;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(SCALE, SCALE);

      await document.fonts.ready;
      try {
        await Promise.all([
          document.fonts.load('400 22px "VT323"'),
          document.fonts.load('700 22px "VT323"'),
          document.fonts.load('800 18px "Bricolage Grotesque"'),
        ]);
      } catch { /* already loaded */ }

      // Load logo image
      let logo: HTMLImageElement | null = null;
      try {
        logo = await new Promise<HTMLImageElement>((res, rej) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => res(img);
          img.onerror = rej;
          img.src = '/sabayph_logo_tp.png';
        });
      } catch { /* skip if CORS fails */ }

      // ─── HEADER ───────────────────────────────
      ctx.fillStyle = T.primary;
      ctx.fillRect(0, 0, W, HEADER_H);

      // Grid overlay
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += 18) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEADER_H); ctx.stroke(); }
      for (let y = 0; y <= HEADER_H; y += 18) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.restore();

      // Decorative circles
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(W + 28, HEADER_H - 28, 58, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(W - 28, HEADER_H - 12, 28, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // Logo
      if (logo) ctx.drawImage(logo, 18, 18, 26, 26);

      // "SabayPH" branding
      ctx.textBaseline = 'middle';
      ctx.font = '800 15px "Bricolage Grotesque", serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Sabay', 52, 31);
      const sabayW = ctx.measureText('Sabay').width;
      ctx.fillStyle = '#EEA64C';
      ctx.fillText('PH', 52 + sabayW, 31);
      const phW = ctx.measureText('PH').width;

      // Category label
      ctx.font = '400 13px "VT323", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.53)';
      ctx.fillText(`  ${meta.cardLabel}`, 52 + sabayW + phW, 30);

      // Room name
      ctx.font = '800 18px "Bricolage Grotesque", serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 3;
      let nameText = room.name;
      const maxNameW = W - 36;
      while (nameText.length > 1 && ctx.measureText(nameText + '…').width > maxNameW) nameText = nameText.slice(0, -1);
      if (nameText !== room.name) nameText += '…';
      ctx.fillText(nameText, 18, 76);
      ctx.shadowBlur = 0;

      // Category badge (centered)
      const badgeLabel = `${meta.emoji} ${meta.label} Room`;
      ctx.font = '700 12px system-ui, sans-serif';
      const bTw = ctx.measureText(badgeLabel).width;
      const bW = bTw + 28;
      const bX = (W - bW) / 2;
      const bY = 120;
      const bH = 24;
      rr(ctx, bX, bY, bW, bH, bH / 2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeLabel, bX + 14, bY + bH / 2);

      // ─── BODY ─────────────────────────────────
      ctx.fillStyle = T.surface;
      ctx.fillRect(0, HEADER_H, W, BODY_H);

      // Join code pill
      const JOIN_LABEL = 'JOIN CODE';
      ctx.font = '700 10px system-ui, sans-serif';
      ctx.textBaseline = 'alphabetic';
      const jLabelW = ctx.measureText(JOIN_LABEL).width;
      ctx.font = '700 24px "VT323", monospace';
      const jCodeW = ctx.measureText(room.join_code).width;

      const pPad = 16;
      const pGap = 8;
      const pillW = jLabelW + pGap + jCodeW + pPad * 2;
      const pillH = 36;
      const pillX = (W - pillW) / 2;
      const pillY = HEADER_H + 18;

      rr(ctx, pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fillStyle = T.surfaceAlt;
      ctx.fill();
      ctx.strokeStyle = T.border;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '700 10px system-ui, sans-serif';
      ctx.fillStyle = T.textMuted;
      ctx.textBaseline = 'middle';
      ctx.fillText(JOIN_LABEL, pillX + pPad, pillY + pillH / 2);
      ctx.font = '700 24px "VT323", monospace';
      ctx.fillStyle = T.primary;
      ctx.fillText(room.join_code, pillX + pPad + jLabelW + pGap, pillY + pillH / 2 + 2);

      // QR code — use the untainted hidden canvas (no cross-origin imageSettings)
      const qrDom = qrExportRef.current?.querySelector('canvas') ?? null;
      const QR_SIZE = 120;
      const QR_PAD = 10;
      const qrBoxW = QR_SIZE + QR_PAD * 2;
      const qrBoxX = (W - qrBoxW) / 2;
      const qrBoxY = pillY + pillH + 14;

      rr(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxW, 14);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = T.border;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (qrDom) {
        ctx.drawImage(qrDom, qrBoxX + QR_PAD, qrBoxY + QR_PAD, QR_SIZE, QR_SIZE);
      }

      // "Scan to join" label
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.fillStyle = T.textMuted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('Scan to join on SabayPH', W / 2, qrBoxY + qrBoxW + 16);
      ctx.textAlign = 'start';

      // ─── ROUNDED CORNER MASK ──────────────────
      ctx.globalCompositeOperation = 'destination-in';
      rr(ctx, 0, 0, W, H, CORNER);
      ctx.fillStyle = '#000000';
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      const link = document.createElement('a');
      link.download = `sabayph-room-${room.join_code}.png`;
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
          title: `${room.name} – SabayPH`,
          text: `Join ${room.name} on SabayPH! Code: ${room.join_code}`,
          url: joinUrl,
        });
      } catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(joinUrl);
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

      {/* Card */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 340,
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
            border: `1.5px solid ${T.border}`, background: T.surface,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: T.textMuted,
          }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ background: T.primary, padding: '18px 18px 52px', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none',
            backgroundImage: `linear-gradient(${T.bg} 1px,transparent 1px),linear-gradient(90deg,${T.bg} 1px,transparent 1px)`,
            backgroundSize: '18px 18px',
          }} />
          <div style={{ position: 'absolute', bottom: -30, right: -30, width: 116, height: 116, borderRadius: '50%', background: '#ffffff0d', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 12, right: 32, width: 56, height: 56, borderRadius: '50%', background: '#ffffff08', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <img src={'/sabayph_logo_tp.png'} alt="SabayPH" style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover' }} />
            <span style={{ fontFamily: '"Bricolage Grotesque", serif', fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Sabay<span style={{ color: '#EEA64C' }}>PH</span>
            </span>
            <span style={{ fontFamily: '"VT323", monospace', fontSize: 13, color: '#ffffff88', letterSpacing: 1.5, marginLeft: 2 }}>
              {meta.cardLabel}
            </span>
          </div>

          <p style={{
            position: 'relative',
            fontFamily: '"Bricolage Grotesque", serif', fontSize: 18, fontWeight: 800,
            color: '#fff', letterSpacing: '-0.02em', margin: 0,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {room.name}
          </p>

          <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 20,
              background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)',
              fontSize: 12, fontWeight: 700, color: '#fff',
            }}>
              <span>{meta.emoji}</span>
              <span>{meta.label} Room</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div ref={qrRef} style={{ padding: '18px 20px 20px', background: T.surface, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 18px', borderRadius: 20,
            background: T.surfaceAlt, border: `2px solid ${T.border}`,
            marginBottom: 14,
          }}>
            <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, letterSpacing: 1.5 }}>JOIN CODE</span>
            <span style={{ fontFamily: '"VT323", monospace', fontSize: 24, fontWeight: 700, color: T.primary, letterSpacing: 2 }}>
              {room.join_code}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div style={{ padding: 10, borderRadius: 14, border: `2px solid ${T.border}`, background: '#fff', display: 'inline-flex' }}>
              <QRCodeCanvas
                value={joinUrl}
                size={120}
                bgColor="#ffffff"
                fgColor="#1a1a1a"
                level="M"
                imageSettings={{
                  src: '/sabayph_logo_tp.png',
                  x: undefined, y: undefined,
                  height: 22, width: 22,
                  excavate: true,
                }}
              />
            </div>
          </div>

          <p style={{ fontSize: 11, color: T.textMuted, margin: 0, fontWeight: 600 }}>
            Scan to join on SabayPH
          </p>
        </div>

        {/* Hidden clean QR canvas for PNG export — no imageSettings so it stays untainted */}
        <div ref={qrExportRef} style={{ position: 'absolute', left: -9999, top: 0, pointerEvents: 'none', opacity: 0 }}>
          <QRCodeCanvas value={joinUrl} size={120} bgColor="#ffffff" fgColor="#1a1a1a" level="M" />
        </div>

        {/* Action buttons */}
        <div style={{ padding: '10px 16px 16px', background: T.bg, display: 'flex', gap: 10, borderTop: `1.5px solid ${T.border}` }}>
          <button
            onClick={handleDownloadPng}
            disabled={downloading}
            style={{
              flex: 1, height: 44, borderRadius: 22,
              border: `2px solid ${T.border}`, background: T.surface,
              color: T.text, fontSize: 13, fontWeight: 700,
              fontFamily: '"DM Sans", system-ui, sans-serif',
              cursor: downloading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: downloading ? 0.65 : 1,
            }}
          >
            {downloading
              ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              : <><Download size={14} /> Save PNG</>
            }
          </button>
          <button
            onClick={handleShare}
            style={{
              flex: 1, height: 44, borderRadius: 22, border: 'none',
              background: T.primary, color: '#fff', fontSize: 13, fontWeight: 700,
              fontFamily: '"DM Sans", system-ui, sans-serif',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: `0 4px 14px ${T.primary}44`,
            }}
          >
            <Share2 size={14} /> Share Link
          </button>
        </div>
      </div>
    </div>
  );
}
