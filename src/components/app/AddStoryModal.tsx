import { useRef, useState, useEffect, useCallback } from 'react';
import {
  X, Camera, ImagePlus, FileText, UploadCloud,
  AlertCircle, CheckCircle2, Sparkles,
} from 'lucide-react';
import { NOTE_MAX_CHARS, NOTE_COLORS, PHOTO_MAX_MB, PHOTO_COMPRESSED_MB, MAX_PHOTO_STORIES } from '@/hooks/useStories';
import type { Theme } from '@/types';

interface Props {
  theme: Theme;
  available?: boolean;
  onAddPhoto: (file: File) => Promise<string | null>;
  onAddNote: (text: string, color: string) => Promise<string | null>;
  onClose: () => void;
}

type Tab = 'note' | 'photo' | 'camera';
type CamState = 'idle' | 'requesting' | 'active' | 'denied' | 'captured';

function fileSizeMB(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(1);
}

// ─── Shared wrapper ───────────────────────────────────────────────────────────

function ModalWrapper({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ width: '100%', maxWidth: 420, margin: '0 16px' }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Feature unavailable state ────────────────────────────────────────────────

function Unavailable({ theme: T, onClose }: { theme: Theme; onClose: () => void }) {
  return (
    <ModalWrapper onClose={onClose}>
      <div style={{ background: T.surface, border: `2px solid ${T.border}`, borderRadius: 24, overflow: 'hidden', fontFamily: '"DM Sans",system-ui,sans-serif', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          <Sparkles size={36} style={{ color: T.primary, margin: '0 auto 14px', display: 'block' }} />
          <p style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: T.text, fontFamily: '"Bricolage Grotesque",serif' }}>
            Stories is coming soon!
          </p>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
            This feature isn't set up yet.<br />Your admin needs to run the database migration first.
          </p>
          <button
            onClick={onClose}
            style={{ height: 42, padding: '0 28px', borderRadius: 21, border: 'none', background: T.primary, color: T.surface, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Got it
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function AddStoryModal({ theme, available = true, onAddPhoto, onAddNote, onClose }: Props) {
  // If table not set up, show unavailable state
  if (!available) return <Unavailable theme={theme} onClose={onClose} />;

  return <AddStoryForm theme={theme} onAddPhoto={onAddPhoto} onAddNote={onAddNote} onClose={onClose} />;
}

function AddStoryForm({ theme, onAddPhoto, onAddNote, onClose }: Omit<Props, 'available'>) {
  const T = theme;
  const [tab, setTab] = useState<Tab>('note');

  // Note state
  const [noteText, setNoteText] = useState('');
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0].value);

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camState, setCamState] = useState<CamState>('idle');
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  // Shared
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (tab !== 'camera') stopCamera();
    return stopCamera;
  }, [tab, stopCamera]);

  useEffect(() => {
    if (!photoFile) { setPhotoPreview(null); return; }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  useEffect(() => {
    if (camState === 'active' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [camState]);

  // ── Camera ──────────────────────────────────────────────────────────────────

  const startCamera = async () => {
    setCamState('requesting');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setCamState('active');
    } catch {
      setCamState('denied');
      setError('Camera access denied. Please allow camera in your browser settings.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      stopCamera();
      setCapturedBlob(blob);
      setCapturedPreview(URL.createObjectURL(blob));
      setCamState('captured');
    }, 'image/jpeg', 0.9);
  };

  const retakePhoto = () => {
    if (capturedPreview) URL.revokeObjectURL(capturedPreview);
    setCapturedBlob(null);
    setCapturedPreview(null);
    setCamState('idle');
  };

  // ── Post handlers ─────────────────────────────────────────────────────────

  const postNote = async () => {
    if (!noteText.trim() || posting) return;
    setPosting(true);
    setError(null);
    const err = await onAddNote(noteText, noteColor);
    setPosting(false);
    if (err) { setError(err); return; }
    setSuccess(true);
    setTimeout(onClose, 700);
  };

  const postPhoto = async (file: File) => {
    setPosting(true);
    setError(null);
    const err = await onAddPhoto(file);
    setPosting(false);
    if (err) { setError(err); return; }
    setSuccess(true);
    setTimeout(onClose, 700);
  };

  const remaining = NOTE_MAX_CHARS - noteText.length;
  const remainingColor = remaining < 30 ? '#C82718' : remaining < 60 ? '#D97706' : T.textMuted;

  const tabBtn = (t: Tab, label: string, Icon: React.ElementType) => (
    <button
      onClick={() => { setTab(t); setError(null); }}
      style={{
        flex: 1, height: 36, border: 'none', cursor: 'pointer', borderRadius: 10,
        background: tab === t ? T.primary : 'transparent',
        color: tab === t ? T.surface : T.textMuted,
        fontSize: 12, fontWeight: 700,
        fontFamily: '"DM Sans",system-ui,sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        transition: 'all 180ms',
      }}
    >
      <Icon size={13} /> {label}
    </button>
  );

  return (
    <ModalWrapper onClose={onClose}>
      <div style={{ background: T.surface, border: `2px solid ${T.border}`, borderRadius: 24, overflow: 'hidden', fontFamily: '"DM Sans",system-ui,sans-serif', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 10px' }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.text, fontFamily: '"Bricolage Grotesque",serif' }}>
            Add to Story
          </p>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: T.surfaceAlt, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted }}>
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 3, margin: '0 14px 14px', background: T.bg, padding: 4, borderRadius: 12 }}>
          {tabBtn('note', 'Note', FileText)}
          {tabBtn('photo', 'Photo', ImagePlus)}
          {tabBtn('camera', 'Camera', Camera)}
        </div>

        {/* ── NOTE TAB ── Instagram-style: type on a colored background ── */}
        {tab === 'note' && (
          <div>
            {/* Full-color writing area */}
            <div
              style={{
                margin: '0 14px',
                borderRadius: 18,
                background: noteColor,
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                transition: 'background 200ms ease',
              }}
            >
              {/* Subtle dot pattern */}
              <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: `radial-gradient(circle, #fff 1.5px, transparent 1.5px)`, backgroundSize: '18px 18px', pointerEvents: 'none' }} />

              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value.slice(0, NOTE_MAX_CHARS))}
                placeholder="What's on your mind?"
                autoFocus
                rows={4}
                style={{
                  width: '100%', background: 'transparent', border: 'none', outline: 'none',
                  resize: 'none', padding: '24px 20px',
                  fontSize: noteText.length > 100 ? 16 : noteText.length > 50 ? 20 : 24,
                  fontWeight: 800,
                  fontFamily: '"Bricolage Grotesque",serif',
                  color: '#fff',
                  textAlign: 'center',
                  caretColor: '#fff',
                  lineHeight: 1.4,
                  transition: 'font-size 150ms',
                  boxSizing: 'border-box',
                }}
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) postNote(); }}
              />

              {/* Char counter */}
              <span style={{
                position: 'absolute', bottom: 10, right: 12,
                fontSize: 11, fontWeight: 700,
                color: remaining < 30 ? '#ffaaaa' : 'rgba(255,255,255,0.6)',
              }}>
                {remaining}
              </span>
            </div>

            {/* Color swatches */}
            <div style={{ display: 'flex', gap: 8, padding: '12px 14px 4px', flexWrap: 'wrap' }}>
              {NOTE_COLORS.map(c => (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => setNoteColor(c.value)}
                  style={{
                    width: 26, height: 26, borderRadius: '50%', background: c.value,
                    border: noteColor === c.value ? `3px solid ${T.text}` : `2px solid ${T.border}`,
                    cursor: 'pointer', transition: 'all 150ms', flexShrink: 0,
                    boxShadow: noteColor === c.value ? `0 0 0 2px ${T.surface}, 0 0 0 4px ${T.text}` : 'none',
                  }}
                />
              ))}
            </div>

            {error && (
              <div style={{ margin: '8px 14px 0', padding: '8px 12px', background: '#FEF2F2', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={13} style={{ color: '#C82718', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 12, color: '#C82718' }}>{error}</p>
              </div>
            )}

            <div style={{ padding: '12px 14px 14px' }}>
              <button
                onClick={postNote}
                disabled={!noteText.trim() || posting}
                style={{
                  width: '100%', height: 46, borderRadius: 23, border: 'none',
                  background: noteText.trim() && !posting ? noteColor : T.border,
                  color: noteText.trim() ? '#fff' : T.textMuted,
                  fontSize: 15, fontWeight: 800,
                  cursor: noteText.trim() && !posting ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: '"Bricolage Grotesque",serif',
                  transition: 'all 150ms',
                  boxShadow: noteText.trim() ? `0 4px 16px ${noteColor}55` : 'none',
                }}
              >
                {success ? <><CheckCircle2 size={17} /> Posted!</> : posting ? 'Posting…' : 'Share Note'}
              </button>
            </div>
          </div>
        )}

        {/* ── PHOTO TAB ── */}
        {tab === 'photo' && (
          <div style={{ padding: '0 14px 14px' }}>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0] ?? null;
                setPhotoFile(f);
                setError(null);
                e.target.value = '';
              }}
            />

            {!photoFile ? (
              <div
                onClick={() => photoInputRef.current?.click()}
                style={{ border: `2px dashed ${T.border}`, borderRadius: 16, padding: '32px 16px', textAlign: 'center', cursor: 'pointer', marginBottom: 12, transition: 'border-color 150ms, background 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.background = T.surfaceAlt; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = 'transparent'; }}
              >
                <UploadCloud size={34} style={{ color: T.textMuted, margin: '0 auto 10px', display: 'block' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: '0 0 4px' }}>Tap to choose a photo</p>
                <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 4px' }}>Up to {PHOTO_MAX_MB}MB · JPEG, PNG, HEIC</p>
                <p style={{ fontSize: 11, color: T.primary, margin: 0, fontWeight: 600 }}>
                  Auto-compressed to ≤{PHOTO_COMPRESSED_MB}MB · max {MAX_PHOTO_STORIES} active photos
                </p>
              </div>
            ) : (
              <div style={{ marginBottom: 12 }}>
                {photoPreview && (
                  <img src={photoPreview} alt="preview" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 14, marginBottom: 8, display: 'block' }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: T.bg, borderRadius: 10 }}>
                  <span style={{ fontSize: 11, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{photoFile.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: photoFile.size > PHOTO_MAX_MB * 1024 * 1024 ? '#C82718' : T.primary, marginLeft: 8, flexShrink: 0 }}>
                    {fileSizeMB(photoFile.size)} MB
                  </span>
                </div>
                <button onClick={() => { setPhotoFile(null); setError(null); }} style={{ fontSize: 11, color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginTop: 4 }}>
                  Remove
                </button>
              </div>
            )}

            {error && (
              <div style={{ margin: '0 0 10px', padding: '8px 12px', background: '#FEF2F2', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={13} style={{ color: '#C82718', flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: 12, color: '#C82718' }}>{error}</p>
              </div>
            )}

            <button
              onClick={() => photoFile && postPhoto(photoFile)}
              disabled={!photoFile || posting}
              style={{ width: '100%', height: 44, borderRadius: 22, border: 'none', background: photoFile ? T.primary : T.border, color: photoFile ? T.surface : T.textMuted, fontSize: 14, fontWeight: 700, cursor: photoFile && !posting ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 150ms', fontFamily: 'inherit' }}
            >
              {success ? <><CheckCircle2 size={16} /> Posted!</> : posting ? 'Compressing & uploading…' : 'Post Photo'}
            </button>
          </div>
        )}

        {/* ── CAMERA TAB ── */}
        {tab === 'camera' && (
          <div style={{ padding: '0 14px 14px' }}>
            {camState === 'idle' && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.surfaceAlt, border: `2px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Camera size={28} style={{ color: T.primary }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 6px', fontFamily: '"Bricolage Grotesque",serif' }}>Use your camera</p>
                <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 20px', lineHeight: 1.55 }}>
                  SabayPH will ask for camera permission.<br />Nothing is saved unless you post.
                </p>
                <button
                  onClick={startCamera}
                  style={{ height: 44, padding: '0 24px', borderRadius: 22, border: 'none', background: T.primary, color: T.surface, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Allow Camera
                </button>
              </div>
            )}

            {camState === 'requesting' && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: T.textMuted, fontSize: 14 }}>Requesting camera…</div>
            )}

            {(camState === 'denied') && (
              <div style={{ padding: '14px', background: '#FEF2F2', borderRadius: 12, marginBottom: 14 }}>
                <p style={{ fontSize: 13, color: '#C82718', margin: 0, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  {error ?? 'Camera access denied.'}
                </p>
              </div>
            )}

            {camState === 'active' && (
              <>
                <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 12, background: '#000', position: 'relative' }}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: 280, display: 'block', objectFit: 'cover' }} />
                </div>
                <button
                  onClick={capturePhoto}
                  style={{ width: '100%', height: 44, borderRadius: 22, border: 'none', background: T.primary, color: T.surface, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}
                >
                  <Camera size={17} /> Take Photo
                </button>
              </>
            )}

            {camState === 'captured' && capturedPreview && (
              <>
                <img src={capturedPreview} alt="captured" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 14, display: 'block', marginBottom: 10 }} />
                {error && (
                  <div style={{ padding: '8px 12px', background: '#FEF2F2', borderRadius: 10, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={13} style={{ color: '#C82718' }} />
                    <p style={{ margin: 0, fontSize: 12, color: '#C82718' }}>{error}</p>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={retakePhoto}
                    style={{ flex: '0 0 auto', height: 44, padding: '0 16px', borderRadius: 22, border: `1.5px solid ${T.border}`, background: 'transparent', color: T.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Retake
                  </button>
                  <button
                    onClick={() => capturedBlob && postPhoto(new File([capturedBlob], 'camera.jpg', { type: 'image/jpeg' }))}
                    disabled={posting}
                    style={{ flex: 1, height: 44, borderRadius: 22, border: 'none', background: T.primary, color: T.surface, fontSize: 14, fontWeight: 700, cursor: posting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}
                  >
                    {success ? <><CheckCircle2 size={16} /> Posted!</> : posting ? 'Compressing & uploading…' : 'Post Photo'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Expiry notice */}
        <p style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', padding: '0 14px 14px', margin: 0 }}>
          Stories disappear after 24 hours
        </p>
      </div>
    </ModalWrapper>
  );
}
