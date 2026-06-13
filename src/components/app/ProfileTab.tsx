import { useState, useRef, lazy, Suspense } from 'react';
import { getLevelInfo } from '@/lib/levelUtils';
import type { User } from '@supabase/supabase-js';
import {
  Users, LogOut, ChevronDown,
  Bell, Lock, HelpCircle, Moon, Sun, Save, Check, Phone, Copy,
  MapPin, X, ShieldCheck, ShieldAlert, Shield, Calendar, Sprout, AtSign, Navigation, Share2,
} from 'lucide-react';
import ShareProfileCard from '@/components/app/ShareProfileCard';
import { FacebookIcon, InstagramIcon, TwitterIcon } from '@/components/common/SocialIcons';
import { PixelHeart } from '@/components/common/PixelDecorations';
import { useProfile } from '@/hooks/useProfile';
import { useUserStats } from '@/hooks/useUserStats';
import { supabase } from '@/lib/supabase';
import type { Theme, UserInfo } from '@/types';
import type { MapLocation, MapPickerTheme } from '@/components/common/MapPicker';

const MapPicker = lazy(() => import('@/components/common/MapPicker'));

import { PRONOUNS, INTEREST_TAGS, OTHERS_PALETTE, othersColor, tagStyle, getDefaultAvatar } from '@/components/app/tagConstants';

interface ProfileTabProps {
  theme: Theme;
  user: UserInfo;
  supabaseUser?: User;
  avatarUrl?: string;
  userId?: string;
  dark: boolean;
  onToggleDark: () => void;
  onLogout: () => void;
}

// ── Verification progress helpers ──────────────────────────────────────────
function getVerifySteps(
  profileCompleted: boolean,
  emailVerified: boolean,
  phoneAdded: boolean,
  locationPinned: boolean,
  idVerified: boolean,
  idSubmitStatus: 'none' | 'pending' | 'approved' | 'rejected',
) {
  const idSub =
    idVerified ? 'Verified by admin' :
    idSubmitStatus === 'pending' ? 'Under review — check back soon' :
    idSubmitStatus === 'rejected' ? 'Submission rejected — please resubmit' :
    'Upload front & back of your government ID';
  return [
    { key: 'profile', label: 'Complete your profile', sub: 'Display name, bio, and location', done: profileCompleted },
    { key: 'email', label: 'Verify email address', sub: 'Confirm via email link', done: emailVerified },
    { key: 'phone', label: 'Add phone number', sub: 'Save your contact number', done: phoneAdded },
    { key: 'location', label: 'Pin home location', sub: 'Mark your area on the map', done: locationPinned },
    { key: 'id', label: 'Verify your ID', sub: idSub, done: idVerified },
  ];
}

// ── Delete account modal ────────────────────────────────────────────────────

function DeleteAccountSection({ onLogout, theme: T }: { onLogout: () => void; theme: any }) {
  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const openDialog = () => {
    setCountdown(5);
    setReady(false);
    setError('');
    setOpen(true);
    // Auto-start countdown immediately when dialog opens
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const closeDialog = () => {
    clearInterval(timerRef.current!);
    setOpen(false);
    setReady(false);
    setCountdown(5);
    setError('');
  };

  const handleDelete = async () => {
    if (!ready || loading) return;
    setLoading(true);
    setError('');
    const { error: err } = await supabase.rpc('delete_user');
    if (err) { setError(err.message); setLoading(false); return; }
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openDialog}
        style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1.5px solid #FCA5A5', background: '#FEF2F2', fontFamily: '"DM Sans",system-ui,sans-serif', fontSize: 14, fontWeight: 600, color: '#B91C1C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 150ms ease' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
        onMouseLeave={e => (e.currentTarget.style.background = '#FEF2F2')}
      >
        🗑️ Delete account
      </button>

      {/* Modal overlay */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          {/* Backdrop */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={closeDialog} />

          {/* Dialog */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 400, background: '#fff', borderRadius: 20, border: '2px solid #B91C1C', boxShadow: '0 24px 60px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
            {/* Red header bar */}
            <div style={{ background: '#B91C1C', padding: '20px 24px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 32, margin: '0 0 6px' }}>⚠️</p>
              <p style={{ fontFamily: '"Bricolage Grotesque",serif', fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>
                Delete your account?
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px 24px' }}>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: '0 0 8px', textAlign: 'center' }}>
                This will <strong style={{ color: '#B91C1C' }}>permanently delete</strong> your profile,
                rooms, messages, and all data.
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#B91C1C', textAlign: 'center', margin: '0 0 20px' }}>
                This action cannot be undone.
              </p>

              {error && (
                <div style={{ padding: '10px 14px', background: '#FEE2E2', borderRadius: 10, border: '1px solid #FCA5A5', marginBottom: 14 }}>
                  <p style={{ fontSize: 12, color: '#B91C1C', margin: 0 }}>{error}</p>
                </div>
              )}

              {/* Countdown indicator */}
              {!ready && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', border: '3px solid #FCA5A5', background: '#FEF2F2' }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#B91C1C', fontFamily: '"Bricolage Grotesque",serif' }}>{countdown}</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '6px 0 0' }}>
                    Please wait before confirming…
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={closeDialog}
                  style={{ flex: 1, height: 46, borderRadius: 23, border: '1.5px solid #D1D5DB', background: 'transparent', color: '#374151', fontSize: 14, fontWeight: 600, fontFamily: '"DM Sans",system-ui,sans-serif', cursor: 'pointer' }}
                >
                  No, keep it
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!ready || loading}
                  style={{ flex: 1, height: 46, borderRadius: 23, border: 'none', background: ready ? '#B91C1C' : '#FCA5A5', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: '"DM Sans",system-ui,sans-serif', cursor: ready && !loading ? 'pointer' : 'default', transition: 'background 300ms ease' }}
                >
                  {loading ? 'Deleting…' : ready ? 'Yes, delete it' : `Yes (${countdown}s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const TOTAL_VERIFY_STEPS = 5;

function badgeConfig(count: number) {
  if (count === TOTAL_VERIFY_STEPS) return { label: 'Fully verified', color: '#15803D', bg: '#DCFCE7', border: '#86EFAC', Icon: ShieldCheck };
  if (count >= 2) return { label: 'Partially verified', color: '#A16207', bg: '#FEF9C3', border: '#FDE047', Icon: Shield };
  if (count === 1) return { label: 'Getting started', color: '#C2410C', bg: '#FFEDD5', border: '#FDBA74', Icon: ShieldAlert };
  return { label: 'Not verified', color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB', Icon: ShieldAlert };
}

// ── Kasama tag chip ───────────────────────────────────────────────────────

function KasamaTagChip({ tag, T }: { tag: string; T: { primary: string; surfaceAlt: string; border: string; textMuted: string; text: string } }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(tag.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      title="Copy your Kasama tag"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 11px', borderRadius: 20,
        border: `1.5px solid ${copied ? '#86EFAC' : T.border}`,
        background: copied ? '#DCFCE7' : T.surfaceAlt,
        color: copied ? '#15803D' : T.primary,
        fontSize: 12, fontWeight: 700,
        fontFamily: '"VT323",monospace', letterSpacing: 1.5,
        cursor: 'pointer', transition: 'all 200ms', marginBottom: 6,
      }}
    >
      {copied
        ? <><Check size={11} /> Copied!</>
        : <><Copy size={11} /> {tag.toUpperCase()}</>}
    </button>
  );
}

// ── Skeleton loader ────────────────────────────────────────────────────────

function ProfileSkeleton({ T }: { T: Theme }) {
  return (
    <div style={{ padding: '20px 16px 32px' }}>
      <style>{`
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .sk { border-radius: 8px; background: linear-gradient(90deg, ${T.surfaceAlt} 25%, ${T.border} 50%, ${T.surfaceAlt} 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite linear; }
      `}</style>

      {/* Profile card skeleton */}
      <div style={{ background: T.surface, border: `3px solid ${T.border}`, borderRadius: 24, overflow: 'hidden', marginBottom: 20 }}>
        {/* Header strip */}
        <div style={{ height: 80, background: T.surfaceAlt }} />

        <div style={{ padding: '0 20px 20px', marginTop: -28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="sk" style={{ width: 64, height: 64, borderRadius: '50%', border: `3px solid ${T.surface}` }} />
            <div className="sk" style={{ width: 110, height: 28, borderRadius: 20 }} />
          </div>
          <div className="sk" style={{ width: 160, height: 22, marginBottom: 8 }} />
          <div className="sk" style={{ width: 200, height: 14, marginBottom: 8 }} />
          <div className="sk" style={{ width: 100, height: 22, borderRadius: 20, marginBottom: 12 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="sk" style={{ width: 60, height: 14, borderRadius: 12 }} />
            <div className="sk" style={{ width: 50, height: 14, borderRadius: 12 }} />
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `1px solid ${T.border}` }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ padding: '16px 8px', textAlign: 'center', borderRight: i < 2 ? `1px solid ${T.border}` : 'none' }}>
              <div className="sk" style={{ width: 32, height: 24, margin: '0 auto 6px' }} />
              <div className="sk" style={{ width: 70, height: 11, margin: '0 auto', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Tags skeleton */}
      <div className="sk" style={{ height: 58, borderRadius: 18, marginBottom: 16 }} />

      {/* Verification skeleton */}
      <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16, padding: '14px 16px' }}>
        <div className="sk" style={{ width: 160, height: 16, marginBottom: 8 }} />
        <div className="sk" style={{ width: '100%', height: 8, borderRadius: 6, marginBottom: 14 }} />
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: T.surfaceAlt, border: `1px solid ${T.border}`, marginBottom: 8 }}>
            <div className="sk" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="sk" style={{ width: '60%', height: 13, marginBottom: 5, borderRadius: 6 }} />
              <div className="sk" style={{ width: '40%', height: 10, borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Settings skeleton */}
      <div className="sk" style={{ height: 180, borderRadius: 18, marginBottom: 16 }} />
      {/* Social links skeleton */}
      <div className="sk" style={{ height: 220, borderRadius: 18, marginBottom: 16 }} />
    </div>
  );
}

// ── ID Upload form ────────────────────────────────────────────────────────────

const PH_ID_TYPES = [
  'PhilSys / National ID', "Driver's License (LTO)", 'Passport', 'SSS / UMID',
  'PhilHealth ID', "Voter's ID (COMELEC)", 'TIN ID (BIR)', 'PRC License',
  'Senior Citizen ID', 'Postal ID', 'Barangay ID',
];

function compressImage(file: File, maxPx = 1200, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), 'image/jpeg', quality);
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface IdUploadFormProps {
  T: any; inputSt: any;
  idType: string; setIdType: (v: string) => void;
  onClose: () => void;
  onSubmitted: () => void;
  userId?: string;
}

function IdUploadForm({ T, inputSt, idType, setIdType, onClose, onSubmitted, userId }: IdUploadFormProps) {
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [backPreview, setBackPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const pickFile = (side: 'front' | 'back', file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (side === 'front') { setFrontFile(file); setFrontPreview(url); }
    else { setBackFile(file); setBackPreview(url); }
  };

  const handleSubmit = async () => {
    if (!idType) { setError('Please select your ID type.'); return; }
    if (!frontFile) { setError('Please upload the front of your ID.'); return; }
    if (!backFile) { setError('Please upload the back of your ID.'); return; }
    if (!userId) { setError('Not logged in.'); return; }
    setError(''); setSubmitting(true);

    let frontBlob: Blob, backBlob: Blob;
    try {
      [frontBlob, backBlob] = await Promise.all([
        compressImage(frontFile),
        compressImage(backFile),
      ]);
    } catch {
      setError('Failed to process images. Please try a different file.'); setSubmitting(false); return;
    }

    const ts = Date.now();
    const frontPath = `${userId}/front_${ts}.jpg`;
    const backPath = `${userId}/back_${ts}.jpg`;

    const [fr, br] = await Promise.all([
      supabase.storage.from('id-photos').upload(frontPath, frontBlob, { upsert: true, contentType: 'image/jpeg' }),
      supabase.storage.from('id-photos').upload(backPath, backBlob, { upsert: true, contentType: 'image/jpeg' }),
    ]);

    if (fr.error || br.error) {
      setError(fr.error?.message || br.error?.message || 'Upload failed. Make sure the id-photos bucket exists in Supabase storage.');
      setSubmitting(false); return;
    }

    const frontUrl = supabase.storage.from('id-photos').getPublicUrl(frontPath).data.publicUrl;
    const backUrl = supabase.storage.from('id-photos').getPublicUrl(backPath).data.publicUrl;

    const { error: insertErr } = await supabase.from('id_submissions').insert({
      user_id: userId, id_type: idType, id_front_url: frontUrl, id_back_url: backUrl, status: 'pending',
    });

    if (insertErr) { setError(insertErr.message); setSubmitting(false); return; }
    setSubmitting(false);
    onSubmitted();
    onClose();
  };

  const filePickerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    borderRadius: 10, border: `1.5px dashed ${T.border}`, background: T.bg,
    cursor: 'pointer', transition: 'border-color 150ms',
  };

  return (
    <div style={{ margin: '0 16px 16px', padding: 16, background: T.surfaceAlt, borderRadius: 14, border: `1.5px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 800, color: T.text, margin: '0 0 3px', fontFamily: '"Bricolage Grotesque",serif' }}>
            🪪 Upload Government ID
          </p>
          <p style={{ fontSize: 11, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>
            Submit front &amp; back of your ID. Admin reviews within 1–2 business days.
          </p>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, flexShrink: 0, marginLeft: 8, display: 'flex' }}>
          <X size={15} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 5, letterSpacing: 0.4 }}>ID TYPE *</label>
          <select value={idType} onChange={e => setIdType(e.target.value)} style={{ ...inputSt, height: 42, cursor: 'pointer' }}>
            <option value="">Select your ID type…</option>
            {PH_ID_TYPES.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
        </div>

        {/* Front */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 5, letterSpacing: 0.4 }}>FRONT OF ID *</label>
          <label style={filePickerStyle}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => pickFile('front', e.target.files?.[0] ?? null)} />
            <span style={{ fontSize: 18 }}>📷</span>
            <span style={{ fontSize: 12, color: frontFile ? T.text : T.textMuted, fontWeight: frontFile ? 600 : 400 }}>
              {frontFile ? frontFile.name : 'Tap to choose front photo'}
            </span>
          </label>
          {frontPreview && (
            <img src={frontPreview} alt="Front ID preview" style={{ width: '100%', borderRadius: 8, marginTop: 6, maxHeight: 140, objectFit: 'cover', border: `1px solid ${T.border}` }} />
          )}
        </div>

        {/* Back */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 5, letterSpacing: 0.4 }}>BACK OF ID *</label>
          <label style={filePickerStyle}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => pickFile('back', e.target.files?.[0] ?? null)} />
            <span style={{ fontSize: 18 }}>📷</span>
            <span style={{ fontSize: 12, color: backFile ? T.text : T.textMuted, fontWeight: backFile ? 600 : 400 }}>
              {backFile ? backFile.name : 'Tap to choose back photo'}
            </span>
          </label>
          {backPreview && (
            <img src={backPreview} alt="Back ID preview" style={{ width: '100%', borderRadius: 8, marginTop: 6, maxHeight: 140, objectFit: 'cover', border: `1px solid ${T.border}` }} />
          )}
        </div>

        <p style={{ fontSize: 11, color: T.textMuted, margin: 0, lineHeight: 1.5, padding: '8px 10px', background: `${T.primary}10`, borderRadius: 8, border: `1px solid ${T.primary}22` }}>
          🔒 Your ID photos are stored securely and only accessible to SabayPH admins for verification purposes.
        </p>

        {error && (
          <p style={{ fontSize: 12, color: '#B91C1C', background: '#FEE2E2', padding: '8px 12px', borderRadius: 8, margin: 0 }}>{error}</p>
        )}

        <button onClick={handleSubmit} disabled={submitting}
          style={{ width: '100%', height: 44, borderRadius: 22, border: 'none', background: submitting ? T.border : T.primary, color: submitting ? T.textMuted : '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: submitting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          {submitting ? 'Uploading…' : <><Check size={15} /> Submit for Review</>}
        </button>
      </div>
    </div>
  );
}

export default function ProfileTab({ theme: T, user, supabaseUser, avatarUrl, userId, dark, onToggleDark, onLogout }: ProfileTabProps) {
  const { profile, loading: profileLoading, saveProfile } = useProfile(userId);
  const stats = useUserStats(userId);

  // Social links
  const [fb, setFb] = useState('');
  const [ig, setIg] = useState('');
  const [tw, setTw] = useState('');
  const [savedLinks, setSavedLinks] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Profile edit
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAgeRange, setEditAgeRange] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editMapLoc, setEditMapLoc] = useState<import('@/components/common/MapPicker').MapLocation | null>(null);
  const [editLoaded, setEditLoaded] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savedEdit, setSavedEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Privacy panel
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacyLevel, setPrivacyLevel] = useState<'public' | 'members'>('public');
  const [showInDiscover, setShowInDiscover] = useState(true);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [savedPrivacy, setSavedPrivacy] = useState(false);
  const [privacyLoaded, setPrivacyLoaded] = useState(false);

  // Online status
  const [isOnline, setIsOnline] = useState(false);
  const [onlineLoaded, setOnlineLoaded] = useState(false);
  const [savingOnline, setSavingOnline] = useState(false);

  // Phone (simple add — no OTP)
  const [contactPhone, setContactPhone] = useState('');
  const [phoneInputOpen, setPhoneInputOpen] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savedPhone, setSavedPhone] = useState(false);
  const [phoneLoaded, setPhoneLoaded] = useState(false);

  // Tags & pronouns
  const [profileTags, setProfileTags] = useState<string[]>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [savingTags, setSavingTags] = useState(false);
  const [savedTags, setSavedTags] = useState(false);

  // Accordion open states
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [linksError, setLinksError] = useState('');

  // Scroll refs for inline forms
  const profileEditRef = useRef<HTMLDivElement>(null);
  const phoneInputRef = useRef<HTMLDivElement>(null);
  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  };

  // Home location pin (dialog)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<MapLocation | null>(null);
  const [locationName, setLocationName] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);
  const [savedLocation, setSavedLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationLoaded, setLocationLoaded] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Email resend
  const [emailResendLoading, setEmailResendLoading] = useState(false);
  const [emailResendDone, setEmailResendDone] = useState(false);

  // Share profile card
  const [showShareCard, setShowShareCard] = useState(false);

  // ID verification
  const [idVerifyOpen, setIdVerifyOpen] = useState(false);
  const [idType, setIdType] = useState('');
  const [idSubmitStatus, setIdSubmitStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [idRejectionReason, setIdRejectionReason] = useState<string | null>(null);
  const [idSubmitLoaded, setIdSubmitLoaded] = useState(false);

  if (profile && !profileLoaded) {
    setFb(profile.facebook_url ?? '');
    setIg(profile.instagram_url ?? '');
    setTw(profile.twitter_url ?? '');
    setProfileLoaded(true);
  }
  if (profile && !onlineLoaded) {
    setIsOnline(profile.is_online ?? false);
    setOnlineLoaded(true);
  }
  if (profile && !editLoaded) {
    setEditName(profile.display_name ?? '');
    setEditBio(profile.bio ?? '');
    setEditAgeRange(profile.age_range ?? '');
    setEditGender(profile.gender ?? '');
    setEditLocation(profile.location ?? '');
    if (profile.location && (profile as any).home_lat != null) {
      setEditMapLoc({ lat: (profile as any).home_lat, lng: (profile as any).home_lng, name: profile.location });
    }
    setEditLoaded(true);
  }
  if (profile && !phoneLoaded) {
    setContactPhone(profile.contact_phone ?? '');
    setPhoneLoaded(true);
  }
  if (profile && !locationLoaded) {
    if (profile.home_lat != null && profile.home_lng != null) {
      setPendingLocation({ lat: profile.home_lat, lng: profile.home_lng, name: profile.location ?? '' });
      setLocationName(profile.location ?? '');
    }
    setLocationLoaded(true);
  }
  if (profile && !tagsLoaded) {
    setProfileTags(profile.profile_tags ?? []);
    setTagsLoaded(true);
  }
  if (profile && !privacyLoaded) {
    setPrivacyLevel((profile as any).privacy_level ?? 'public');
    setShowInDiscover((profile as any).show_in_discover ?? true);
    setPrivacyLoaded(true);
  }

  // Fetch latest ID submission status
  if (userId && !idSubmitLoaded && !idVerifyOpen) {
    setIdSubmitLoaded(true);
    supabase
      .from('id_submissions')
      .select('status, rejection_reason')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setIdSubmitStatus(data.status as 'none' | 'pending' | 'approved' | 'rejected');
          setIdRejectionReason(data.rejection_reason ?? null);
        }
      });
  }

  // Derived state
  const emailVerified = !!supabaseUser?.email_confirmed_at;
  const phoneAdded = !!(profile?.contact_phone);
  const locationPinned = profile?.home_lat != null;
  const profileCompleted = !!profile?.profile_completed;
  const idVerified = !!(profile as any)?.id_verified;
  const currentPhone = profile?.contact_phone ?? supabaseUser?.phone ?? '';

  const yearJoined = supabaseUser?.created_at
    ? new Date(supabaseUser.created_at).getFullYear()
    : null;
  const daysSinceJoined = supabaseUser?.created_at
    ? Math.floor((Date.now() - new Date(supabaseUser.created_at).getTime()) / 86_400_000)
    : null;
  const isNewJoiner = daysSinceJoined !== null && daysSinceJoined < 90;

  const verifySteps = getVerifySteps(profileCompleted, emailVerified, phoneAdded, locationPinned, idVerified, idSubmitStatus);
  const doneCount = verifySteps.filter(s => s.done).length;
  const badge = badgeConfig(doneCount);
  const BadgeIcon = badge.Icon;

  const ratingDisplay = stats.kasamaRating !== null
    ? stats.kasamaRating.toFixed(1)
    : '—';

  // ── handlers ──────────────────────────────────────────────────────────────

  const isValidUrl = (val: string) => {
    if (!val.trim()) return true;
    try { new URL(val.trim()); return true; } catch { return false; }
  };

  const handleSaveLinks = async () => {
    setLinksError('');
    const invalid = [
      { label: 'Facebook', val: fb },
      { label: 'Instagram', val: ig },
      { label: 'Twitter/X', val: tw },
    ].find(f => !isValidUrl(f.val));
    if (invalid) {
      setLinksError(`${invalid.label} URL is not valid. It must start with https://`);
      return;
    }
    setSavingLinks(true);
    await saveProfile({ facebook_url: fb.trim() || null, instagram_url: ig.trim() || null, twitter_url: tw.trim() || null });
    setSavingLinks(false); setSavedLinks(true);
    setTimeout(() => setSavedLinks(false), 2500);
  };

  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    await saveProfile({ privacy_level: privacyLevel, show_in_discover: showInDiscover } as any);
    setSavingPrivacy(false); setSavedPrivacy(true);
    setTimeout(() => setSavedPrivacy(false), 2500);
  };

  const [phoneError, setPhoneError] = useState('');

  const handleSavePhone = async () => {
    if (!contactPhone.trim()) return;
    setPhoneError('');
    setSavingPhone(true);
    const { error } = await saveProfile({ contact_phone: contactPhone.trim() });
    setSavingPhone(false);
    if (error) { setPhoneError(error); return; }
    setSavedPhone(true);
    setPhoneInputOpen(false);
    setTimeout(() => setSavedPhone(false), 2500);
  };

  const useGPS = () => {
    if (!navigator.geolocation) { setLocationError('Geolocation not supported by your browser.'); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, name: locationName };
        setPendingLocation(loc);
        setGpsLoading(false);
      },
      () => { setLocationError('Could not get GPS location. Try tapping the map instead.'); setGpsLoading(false); },
    );
  };

  const handleSaveLocation = async () => {
    if (!pendingLocation) { setLocationError('Pin a location on the map first.'); return; }
    setLocationError('');
    setSavingLocation(true);
    const { error } = await saveProfile({
      home_lat: pendingLocation.lat,
      home_lng: pendingLocation.lng,
      location: locationName.trim() || null,
    } as any);
    setSavingLocation(false);
    if (error) { setLocationError(error); return; }
    setSavedLocation(true);
    setLocationDialogOpen(false);
    setTimeout(() => setSavedLocation(false), 2500);
  };

  const handleToggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    setSavingOnline(true);
    await saveProfile({ is_online: next } as any);
    setSavingOnline(false);
  };

  const PRONOUN_LABELS = ['He/Him', 'She/Her', 'They/Them', 'She/They', 'He/They'];

  const toggleTag = (label: string) => {
    const isPronoun = PRONOUN_LABELS.includes(label);
    setProfileTags(prev => {
      if (isPronoun) {
        // Radio: remove all existing pronouns, then toggle the clicked one
        const withoutPronoun = prev.filter(t => !PRONOUN_LABELS.includes(t));
        return prev.includes(label) ? withoutPronoun : [...withoutPronoun, label];
      }
      return prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label];
    });
  };

  const handleSaveTags = async () => {
    setSavingTags(true);
    await saveProfile({ profile_tags: profileTags } as any);
    setSavingTags(false); setSavedTags(true);
    setTagsOpen(false);
    setTimeout(() => setSavedTags(false), 2000);
  };

  const handleSaveProfileEdit = async () => {
    if (!editName.trim()) { setEditError('Display name is required.'); return; }
    setEditError('');
    setSavingEdit(true);
    const { error } = await saveProfile({
      display_name: editName.trim(),
      bio: editBio.trim() || null,
      age_range: editAgeRange || null,
      gender: editGender || null,
      location: editLocation.trim() || null,
      ...(editMapLoc ? { home_lat: editMapLoc.lat, home_lng: editMapLoc.lng } : {}),
      profile_completed: true,
    } as any);
    setSavingEdit(false);
    if (error) { setEditError(error); return; }
    setSavedEdit(true);
    setProfileEditOpen(false);
    setTimeout(() => setSavedEdit(false), 2000);
  };

  const handleResendEmail = async () => {
    if (!user.email) return;
    setEmailResendLoading(true);
    await supabase.auth.resend({ type: 'signup', email: user.email });
    setEmailResendLoading(false); setEmailResendDone(true);
    setTimeout(() => setEmailResendDone(false), 4000);
  };

  // ── shared styles ──────────────────────────────────────────────────────────

  const inputSt: React.CSSProperties = {
    width: '100%', height: 48, padding: '0 14px', fontSize: 14,
    fontFamily: '"DM Sans", system-ui, sans-serif',
    border: `1.5px solid ${T.border}`, borderRadius: 10,
    background: T.bg, color: T.text, outline: 'none', boxSizing: 'border-box',
  };

  const tog = (on: boolean, fn: () => void) => (
    <div onClick={fn} style={{ width: 44, height: 24, borderRadius: 12, background: on ? T.primary : T.border, position: 'relative', transition: 'background 250ms ease', flexShrink: 0, cursor: 'pointer' }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.3)', transition: 'left 250ms ease' }} />
    </div>
  );

  // ── render ─────────────────────────────────────────────────────────────────

  if (profileLoading && !profile) {
    return <ProfileSkeleton T={T} />;
  }

  return (
    <div style={{ padding: '20px 16px 32px' }}>

      {/* ── Profile card ── */}
      <div style={{ background: T.surface, border: `3px solid ${T.text}`, borderRadius: 24, boxShadow: `6px 6px 0 ${T.text}`, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: 80, background: T.primary, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: `linear-gradient(${T.bg} 1px,transparent 1px),linear-gradient(90deg,${T.bg} 1px,transparent 1px)`, backgroundSize: '20px 20px' }} />
          <div style={{ position: 'absolute', top: 12, right: 16 }}><PixelHeart color={T.highlight} size={16} /></div>
        </div>

        <div style={{ padding: '0 20px 20px', marginTop: -28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', border: `3px solid ${T.surface}`, overflow: 'hidden', background: T.primary, boxShadow: `0 2px 8px ${T.text}22`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: '"Bricolage Grotesque",serif', fontWeight: 800, fontSize: 26, color: T.bg, position: 'absolute' }}>
                {user.name.charAt(0).toUpperCase()}
              </span>
              {avatarUrl
                ? <img src={avatarUrl} alt={user.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                : <img src={getDefaultAvatar(profile?.gender, profileTags)} alt="Profile" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              }
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: badge.bg, border: `1px solid ${badge.border}` }}>
              <BadgeIcon size={13} style={{ color: badge.color }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: badge.color }}>{badge.label}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
            <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>{user.name}</h2>
            {(() => {
              const pronoun = profileTags.find(t => ['He/Him', 'She/Her', 'They/Them', 'She/They', 'He/They'].includes(t));
              if (!pronoun) return null;
              const pr = PRONOUNS.find(p => p.label === pronoun);
              if (!pr) return null;
              return (
                <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: pr.bg, color: pr.color, border: `1.5px solid ${pr.color}44`, flexShrink: 0 }}>
                  {pr.label}
                </span>
              );
            })()}
          </div>
          <p style={{ fontSize: 13, color: T.textMuted, margin: '0 0 8px' }}>{user.email}</p>
          {/* Kasama tag + share button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {profile?.kasama_tag
              ? <KasamaTagChip tag={profile.kasama_tag} T={T} />
              : userId && (
                <span style={{ fontSize: 11, color: T.textMuted, fontFamily: '"DM Sans",system-ui,sans-serif' }}>
                  Tag generating…
                </span>
              )
            }
            {profile?.kasama_tag && (
              <button
                onClick={() => setShowShareCard(true)}
                title="Share your profile card"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 11px', borderRadius: 20,
                  border: `1.5px solid ${T.border}`,
                  background: T.primary, color: '#fff',
                  marginTop: -6,
                  fontSize: 12, fontWeight: 700,
                  fontFamily: '"DM Sans",system-ui,sans-serif',
                  cursor: 'pointer', transition: 'opacity 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <Share2 size={11} /> Share
              </button>
            )}
          </div>

          {/* Year joined + new joiner badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {yearJoined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.textMuted }}>
                <Calendar size={12} />
                <span>Member since {yearJoined}</span>
              </div>
            )}
            {isNewJoiner && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 12, background: '#F0FDF4', border: '1px solid #86EFAC' }}>
                <Sprout size={11} style={{ color: '#15803D' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D' }}>New Kasama</span>
              </div>
            )}
          </div>

          {profile?.bio && <p style={{ fontSize: 13, color: T.text, margin: '0 0 4px', lineHeight: 1.5 }}>{profile.bio}</p>}
          {(profile?.location || profile?.age_range) && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: profileTags.length > 0 ? 8 : 0 }}>
              {profile.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.textMuted }}><MapPin size={12} />{profile.location}</span>}
              {profile.age_range && <span style={{ fontSize: 12, color: T.textMuted, background: T.surfaceAlt, padding: '2px 10px', borderRadius: 12 }}>{profile.age_range}</span>}
            </div>
          )}
          {profileTags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {profileTags.map(tag => {
                const ts = tagStyle(tag, userId ?? '');
                return (
                  <span key={tag} style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: ts.bg, color: ts.color, border: `1px solid ${ts.color}33` }}>
                    {ts.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats — live from DB */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `1px solid ${T.border}` }}>
          {[
            { value: stats.loading ? '…' : String(stats.roomsJoined), label: 'Rooms joined' },
            { value: stats.loading ? '…' : String(stats.eventsAttended), label: 'Events attended' },
            { value: stats.loading ? '…' : ratingDisplay, label: 'Kasama rating' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '16px 8px', textAlign: 'center', borderRight: i < 2 ? `1px solid ${T.border}` : 'none' }}>
              <p className="font-display" style={{ fontSize: 20, fontWeight: 800, color: T.primary, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: T.textMuted, margin: '2px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Kasama Reputation — inside profile card */}
        {(() => {
          const lvl = getLevelInfo(stats.roomsJoined);
          return (
            <div style={{ padding: '14px 16px', borderTop: `1px solid ${T.border}`, background: T.surfaceAlt }}>
              {/* Level row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <p className="font-display" style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: '0 0 3px' }}>Kasama Reputation</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 8, background: T.primary, color: T.bg }}>Lv.{lvl.level}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{lvl.title}</span>
                  </div>
                </div>
                {stats.kasamaRating !== null && (
                  <span style={{ fontSize: 11, color: T.textMuted }}>⭐ {stats.kasamaRating.toFixed(1)}</span>
                )}
              </div>

              {/* XP bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.primary }}>{lvl.xp} XP</span>
                {!lvl.isMax && <span style={{ fontSize: 10, color: T.textMuted }}>{lvl.xpForNext} XP · Lv.{lvl.level + 1}</span>}
              </div>
              <div style={{ background: T.border, borderRadius: 6, height: 8, overflow: 'hidden', marginBottom: 5 }}>
                <div style={{ height: '100%', borderRadius: 6, width: `${lvl.progress}%`, background: lvl.isMax ? '#15803D' : T.primary, transition: 'width 800ms ease' }} />
              </div>
              <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>
                {lvl.isMax
                  ? '🏆 Max level reached — true Haligi ng Komunidad!'
                  : `${lvl.xpForNext - lvl.xp} XP to Level ${lvl.level + 1} · earn 10 XP per room joined`}
              </p>
            </div>
          );
        })()}
      </div>

      {/* ── Tags & Pronouns ── */}
      <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', transition: 'background 150ms' }}
          onClick={() => setTagsOpen(o => !o)}
          onMouseEnter={e => (e.currentTarget.style.background = T.surfaceAlt)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 1px' }}>Tags & Pronouns</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
              {profileTags.length > 0 ? profileTags.join(', ') : 'Let others know who you are'}
            </p>
          </div>
          <ChevronDown size={16} style={{ color: T.textMuted, transition: 'transform 200ms', transform: tagsOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
        </div>

        {tagsOpen && (
          <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${T.border}`, background: T.surfaceAlt }}>
            {/* Pronouns */}
            <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: '14px 0 8px', letterSpacing: 0.5 }}>PRONOUNS</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {PRONOUNS.map(p => {
                const active = profileTags.includes(p.label);
                return (
                  <button key={p.label} onClick={() => toggleTag(p.label)}
                    style={{ padding: '6px 14px', borderRadius: 20, border: `2px solid ${active ? p.color : T.border}`, background: active ? p.bg : T.surface, color: active ? p.color : T.textMuted, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {active && <Check size={11} />}
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Interests */}
            <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: '0 0 8px', letterSpacing: 0.5 }}>INTERESTS</p>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 16 }}>
              {INTEREST_TAGS.map(t => {
                const active = profileTags.includes(t.label);
                return (
                  <button key={t.label} onClick={() => toggleTag(t.label)}
                    style={{ padding: '6px 12px', borderRadius: 20, border: `2px solid ${active ? t.color : T.border}`, background: active ? t.bg : T.surface, color: active ? t.color : T.textMuted, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>{t.emoji}</span>
                    {t.label}
                    {active && <Check size={10} />}
                  </button>
                );
              })}

              {/* Others — random color per user, not user-selectable */}
              {(() => {
                const active = profileTags.includes('Others');
                const oc = othersColor(userId ?? '');
                return (
                  <button onClick={() => toggleTag('Others')}
                    style={{ padding: '6px 12px', borderRadius: 20, border: `2px solid ${active ? oc.color : T.border}`, background: active ? oc.bg : T.surface, color: active ? oc.color : T.textMuted, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 5 }}>
                    ✨ Others
                    {active && <Check size={10} />}
                  </button>
                );
              })()}
            </div>

            <button onClick={handleSaveTags} disabled={savingTags}
              style={{ width: '100%', height: 42, borderRadius: 21, border: 'none', background: savedTags ? '#15803D' : T.primary, color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: savingTags ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 250ms' }}>
              {savedTags ? <><Check size={14} /> Saved!</> : savingTags ? 'Saving…' : <><Save size={14} /> Save Tags</>}
            </button>
          </div>
        )}
      </div>

      {/* ── Verification Progress ── */}
      <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', transition: 'background 150ms' }}
          onClick={() => setVerifyOpen(o => !o)}
          onMouseEnter={e => (e.currentTarget.style.background = T.surfaceAlt)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 1px' }}>Verification Progress</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>{doneCount}/{TOTAL_VERIFY_STEPS} steps complete</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ padding: '4px 10px', borderRadius: 20, background: badge.bg, border: `1px solid ${badge.border}` }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: badge.color }}>{doneCount === TOTAL_VERIFY_STEPS ? 'Verified ✓' : `${doneCount}/${TOTAL_VERIFY_STEPS}`}</span>
            </div>
            <ChevronDown size={16} style={{ color: T.textMuted, transition: 'transform 200ms', transform: verifyOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
          </div>
        </div>
        {verifyOpen && (
          <>
            <div style={{ padding: '0 16px 10px', borderTop: `1px solid ${T.border}` }}>
              {/* Progress bar */}
              <div style={{ background: T.surfaceAlt, borderRadius: 6, height: 8, overflow: 'hidden', margin: '14px 0' }}>
                <div style={{ height: '100%', borderRadius: 6, width: `${(doneCount / TOTAL_VERIFY_STEPS) * 100}%`, background: doneCount === TOTAL_VERIFY_STEPS ? '#15803D' : doneCount >= 2 ? '#EAB308' : doneCount === 1 ? T.highlight : T.border, transition: 'width 600ms ease' }} />
              </div>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {verifySteps.map((step, i) => (
                  <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: step.done ? '#F0FDF4' : T.surfaceAlt, border: `1px solid ${step.done ? '#86EFAC' : T.border}`, transition: 'all 200ms ease' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: step.done ? '#15803D' : T.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 200ms ease' }}>
                      {step.done
                        ? <Check size={14} style={{ color: '#fff' }} />
                        : <span style={{ fontSize: 12, fontWeight: 700, color: T.surface }}>{i + 1}</span>
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: step.done ? '#15803D' : T.text, margin: 0 }}>{step.label}</p>
                      <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>{step.sub}</p>
                    </div>
                    {step.key === 'profile' && (
                      <button onClick={() => { setProfileEditOpen(o => !o); setEditError(''); scrollToRef(profileEditRef); }}
                        style={{ padding: '5px 14px', borderRadius: 16, fontSize: 11, fontWeight: 700, border: 'none', background: step.done ? '#DCFCE7' : T.highlight, color: step.done ? '#15803D' : '#06131B', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        {step.done ? 'Edit' : 'Set up'}
                      </button>
                    )}
                    {!step.done && step.key === 'email' && (
                      <button onClick={handleResendEmail} disabled={emailResendLoading || emailResendDone}
                        style={{ padding: '5px 14px', borderRadius: 16, fontSize: 11, fontWeight: 700, border: 'none', background: emailResendDone ? '#DCFCE7' : T.highlight, color: emailResendDone ? '#15803D' : '#06131B', cursor: emailResendDone ? 'default' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        {emailResendDone ? '✓ Sent' : emailResendLoading ? '…' : 'Resend'}
                      </button>
                    )}
                    {!step.done && step.key === 'phone' && !phoneInputOpen && (
                      <button onClick={() => { setPhoneInputOpen(true); setPhoneError(''); scrollToRef(phoneInputRef); }}
                        style={{ padding: '5px 14px', borderRadius: 16, fontSize: 11, fontWeight: 700, border: 'none', background: T.highlight, color: '#06131B', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        Add
                      </button>
                    )}
                    {step.done && step.key === 'phone' && (
                      <button onClick={() => { setPhoneInputOpen(o => !o); setPhoneError(''); scrollToRef(phoneInputRef); }}
                        style={{ padding: '5px 14px', borderRadius: 16, fontSize: 11, fontWeight: 700, border: 'none', background: '#DCFCE7', color: '#15803D', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        Edit
                      </button>
                    )}
                    {step.key === 'location' && (
                      <button onClick={() => { setLocationDialogOpen(true); setLocationError(''); }}
                        style={{ padding: '5px 14px', borderRadius: 16, fontSize: 11, fontWeight: 700, border: 'none', background: step.done ? '#DCFCE7' : T.highlight, color: step.done ? '#15803D' : '#06131B', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        {step.done ? 'Edit' : 'Pin'}
                      </button>
                    )}
                    {step.key === 'id' && step.done && (
                      <span style={{ padding: '5px 12px', borderRadius: 16, fontSize: 11, fontWeight: 700, background: '#DCFCE7', color: '#15803D' }}>✓ Verified</span>
                    )}
                    {step.key === 'id' && !step.done && idSubmitStatus === 'pending' && (
                      <span style={{ padding: '5px 12px', borderRadius: 16, fontSize: 11, fontWeight: 700, background: '#FEF9C3', color: '#A16207', border: '1px solid #FDE047' }}>⏳ Reviewing</span>
                    )}
                    {step.key === 'id' && !step.done && idSubmitStatus === 'rejected' && (
                      <button onClick={() => { setIdVerifyOpen(o => !o); }}
                        style={{ padding: '5px 14px', borderRadius: 16, fontSize: 11, fontWeight: 700, border: 'none', background: '#FEE2E2', color: '#B91C1C', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        Resubmit
                      </button>
                    )}
                    {step.key === 'id' && !step.done && (idSubmitStatus === 'none') && (
                      <button onClick={() => setIdVerifyOpen(o => !o)}
                        style={{ padding: '5px 14px', borderRadius: 16, fontSize: 11, fontWeight: 700, border: 'none', background: T.highlight, color: '#06131B', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        Upload
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── ID Verification inline form ── */}
            {idVerifyOpen && !idVerified && (
              <>
                {idSubmitStatus === 'rejected' && idRejectionReason && (
                  <div style={{ margin: '0 16px 8px', padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#B91C1C', margin: '0 0 3px' }}>Previous submission rejected</p>
                    <p style={{ fontSize: 12, color: '#7F1D1D', margin: 0 }}>{idRejectionReason}</p>
                  </div>
                )}
                <IdUploadForm
                  T={T}
                  inputSt={inputSt}
                  idType={idType}
                  setIdType={setIdType}
                  onClose={() => setIdVerifyOpen(false)}
                  onSubmitted={() => { setIdSubmitStatus('pending'); setIdRejectionReason(null); }}
                  userId={userId}
                />
              </>
            )}

            {/* ── Inline profile edit ── */}
            {profileEditOpen && (
              <div ref={profileEditRef} style={{ margin: '0 16px 16px', padding: 16, background: T.surfaceAlt, borderRadius: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>Edit your profile</p>
                  <button onClick={() => setProfileEditOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex' }}>
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Name */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 5, letterSpacing: 0.4 }}>DISPLAY NAME <span style={{ color: '#C82718' }}>*</span></label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="What should we call you?" maxLength={40}
                      style={{ ...inputSt, height: 42 }} />
                  </div>

                  {/* Age range */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6, letterSpacing: 0.4 }}>AGE RANGE</label>
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                      {['18–24', '25–34', '35–44', '45+'].map(r => (
                        <button key={r} type="button" onClick={() => setEditAgeRange(editAgeRange === r ? '' : r)}
                          style={{ padding: '5px 13px', borderRadius: 20, border: `1.5px solid ${editAgeRange === r ? T.primary : T.border}`, background: editAgeRange === r ? `${T.primary}12` : T.surface, color: editAgeRange === r ? T.primary : T.textMuted, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 150ms' }}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6, letterSpacing: 0.4 }}>GENDER</label>
                    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                      {['Lalaki', 'Babae', 'Non-binary', 'Prefer not to say'].map(g => (
                        <button key={g} type="button" onClick={() => setEditGender(editGender === g ? '' : g)}
                          style={{ padding: '5px 13px', borderRadius: 20, border: `1.5px solid ${editGender === g ? T.primary : T.border}`, background: editGender === g ? `${T.primary}12` : T.surface, color: editGender === g ? T.primary : T.textMuted, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 150ms' }}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* City / Area — map picker */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 5, letterSpacing: 0.4 }}>CITY / AREA</label>
                    <Suspense fallback={
                      <input value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="e.g. Cagayan de Oro, Davao…" maxLength={60}
                        style={{ ...inputSt, height: 42 }} />
                    }>
                      <MapPicker
                        value={editMapLoc}
                        onChange={loc => { setEditMapLoc(loc); setEditLocation(loc.name.split(',').slice(0, 2).join(', ')); }}
                        height={220}
                        theme={{ primary: T.primary, bg: T.bg, surface: T.surface, surfaceAlt: T.surfaceAlt, text: T.text, textMuted: T.textMuted, border: T.border } as MapPickerTheme}
                      />
                    </Suspense>
                  </div>

                  {/* Bio */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 5, letterSpacing: 0.4 }}>SHORT BIO</label>
                    <textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Tell the community a bit about yourself…" maxLength={120} rows={3}
                      style={{ ...inputSt, height: 'auto', padding: '10px 14px', resize: 'none', lineHeight: 1.5 }} />
                    <p style={{ fontSize: 11, color: T.textMuted, margin: '3px 0 0', textAlign: 'right' }}>{editBio.length}/120</p>
                  </div>

                  {editError && (
                    <p style={{ fontSize: 12, color: '#B91C1C', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '7px 10px', margin: 0 }}>{editError}</p>
                  )}

                  <button onClick={handleSaveProfileEdit} disabled={savingEdit || !editName.trim()}
                    style={{ width: '100%', height: 42, borderRadius: 21, border: 'none', background: (!editName.trim() || savingEdit) ? T.border : T.primary, color: (!editName.trim() || savingEdit) ? T.textMuted : '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: (!editName.trim() || savingEdit) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 200ms' }}>
                    {savingEdit ? 'Saving…' : savedEdit ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Profile</>}
                  </button>
                </div>
              </div>
            )}

            {/* Inline phone input — no OTP */}
            {phoneInputOpen && (
              <div ref={phoneInputRef} style={{ margin: '0 16px 16px', padding: 14, background: T.surfaceAlt, borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>
                    {phoneAdded ? 'Update phone number' : 'Add your phone number'}
                  </p>
                  <button onClick={() => setPhoneInputOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex' }}>
                    <X size={16} />
                  </button>
                </div>
                <input
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="+63 917 123 4567"
                  style={inputSt}
                />
                <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 10px' }}>
                  Include country code, e.g. +63 for Philippines
                </p>
                {phoneError && (
                  <p style={{ fontSize: 12, color: '#B91C1C', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '7px 10px', margin: '0 0 10px' }}>{phoneError}</p>
                )}
                <button
                  onClick={handleSavePhone}
                  disabled={savingPhone || !contactPhone.trim()}
                  style={{ width: '100%', height: 40, borderRadius: 20, border: 'none', background: (!contactPhone.trim() || savingPhone) ? T.border : T.primary, color: (!contactPhone.trim() || savingPhone) ? T.textMuted : '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: (!contactPhone.trim() || savingPhone) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 200ms' }}
                >
                  {savingPhone ? 'Saving…' : <><Phone size={14} /> Save Number</>}
                </button>
              </div>
            )}

            {savedPhone && (
              <div style={{ margin: '0 16px 16px', padding: '10px 14px', background: '#DCFCE7', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} style={{ color: '#15803D' }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: '#15803D', margin: 0 }}>Phone number saved!</p>
              </div>
            )}

            {savedLocation && (
              <div style={{ margin: '0 16px 8px', padding: '10px 14px', background: '#DCFCE7', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} style={{ color: '#15803D' }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: '#15803D', margin: 0 }}>Home location saved!</p>
              </div>
            )}
          </>
        )}
      </div>


      {/* ── Settings ── */}
      <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}>

        {/* Dark mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 150ms ease' }}
          onClick={onToggleDark}
          onMouseEnter={e => (e.currentTarget.style.background = T.surfaceAlt)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: dark ? '#2A405A' : T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#EEA64C' : T.primary }}>
            {dark ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>{dark ? 'Light Mode' : 'Dark Mode'}</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: '1px 0 0' }}>{dark ? 'Switch to light theme' : 'Switch to dark theme'}</p>
          </div>
          {tog(dark, onToggleDark)}
        </div>

        {/* Online status toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', transition: 'background 150ms ease' }}
          onClick={handleToggleOnline}
          onMouseEnter={e => (e.currentTarget.style.background = T.surfaceAlt)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: isOnline ? '#DCFCE7' : T.surfaceAlt, border: `1.5px solid ${isOnline ? '#86EFAC' : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 250ms' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: isOnline ? '#15803D' : T.textMuted, display: 'inline-block', transition: 'background 250ms' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>
              {isOnline ? 'Active now' : 'Appear offline'}
              {savingOnline && <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 6 }}>saving…</span>}
            </p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: '1px 0 0' }}>{isOnline ? 'Others can see you\'re online' : 'Toggle to show you\'re available'}</p>
          </div>
          {tog(isOnline, handleToggleOnline)}
        </div>

        {/* Notifications — disabled */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${T.border}`, opacity: 0.45, cursor: 'not-allowed' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted }}>
            <Bell size={18} strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>Notifications</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: '1px 0 0' }}>Manage alerts & reminders</p>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, background: T.surfaceAlt, border: `1px solid ${T.border}`, padding: '3px 8px', borderRadius: 10, letterSpacing: 0.5 }}>SOON</span>
        </div>

        {/* Privacy & Safety */}
        <div style={{ borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', cursor: 'pointer', transition: 'background 150ms ease' }}
            onClick={() => setPrivacyOpen(o => !o)}
            onMouseEnter={e => (e.currentTarget.style.background = T.surfaceAlt)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>
              <Lock size={18} strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>Privacy & Safety</p>
              <p style={{ fontSize: 12, color: T.textMuted, margin: '1px 0 0' }}>Control who sees your profile</p>
            </div>
            <ChevronDown size={16} style={{ color: T.textMuted, transition: 'transform 200ms ease', transform: privacyOpen ? 'rotate(180deg)' : 'none' }} />
          </div>

          {privacyOpen && (
            <div style={{ padding: '0 16px 16px', background: T.surfaceAlt, borderTop: `1px solid ${T.border}` }}>
              <div style={{ marginTop: 14, marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, margin: '0 0 8px', letterSpacing: 0.5 }}>PROFILE VISIBILITY</p>
                {(['public', 'members'] as const).map(level => (
                  <div key={level} onClick={() => setPrivacyLevel(level)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: privacyLevel === level ? `${T.primary}12` : 'transparent', border: `1.5px solid ${privacyLevel === level ? T.primary : T.border}`, marginBottom: 6, transition: 'all 150ms ease' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${privacyLevel === level ? T.primary : T.border}`, background: privacyLevel === level ? T.primary : 'transparent', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>{level === 'public' ? 'Everyone' : 'Members only'}</p>
                      <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>{level === 'public' ? 'Anyone can see your profile' : 'Only verified members can see you'}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: T.surface, border: `1.5px solid ${T.border}`, marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>Show in Discover</p>
                  <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>Let others find you in room suggestions</p>
                </div>
                {tog(showInDiscover, () => setShowInDiscover(v => !v))}
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 10, background: `${T.accent}0D`, border: `1px solid ${T.accent}33`, marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: T.accent, margin: '0 0 2px' }}>Safety reminder</p>
                <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>Never share personal addresses or financial details inside rooms. Use the flag button to report suspicious behavior.</p>
              </div>
              <button onClick={handleSavePrivacy} disabled={savingPrivacy} style={{ width: '100%', height: 40, borderRadius: 20, border: 'none', background: savedPrivacy ? '#15803D' : T.primary, color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: savingPrivacy ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 250ms ease' }}>
                {savedPrivacy ? <><Check size={14} /> Saved!</> : savingPrivacy ? 'Saving…' : <><Save size={14} /> Save Privacy Settings</>}
              </button>
            </div>
          )}
        </div>

        {/* Help & Support — disabled */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', opacity: 0.45, cursor: 'not-allowed' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted }}>
            <HelpCircle size={18} strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>Help & Support</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: '1px 0 0' }}>FAQs and contact support</p>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, background: T.surfaceAlt, border: `1px solid ${T.border}`, padding: '3px 8px', borderRadius: 10, letterSpacing: 0.5 }}>SOON</span>
        </div>
      </div>

      {/* ── Contact & Social Links accordion ── */}
      <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 18, overflow: 'hidden', marginBottom: 16 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', cursor: 'pointer', transition: 'background 150ms' }}
          onClick={() => setSocialOpen(o => !o)}
          onMouseEnter={e => (e.currentTarget.style.background = T.surfaceAlt)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 1px' }}>Contact & Social Links</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>These auto-fill when you create a room</p>
          </div>
          <ChevronDown size={16} style={{ color: T.textMuted, transition: 'transform 200ms', transform: socialOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
        </div>

        {socialOpen && (
          <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${T.border}`, background: T.surfaceAlt }}>
            {/* Default contact */}
            <div style={{ margin: '14px 0', padding: '10px 12px', borderRadius: 12, background: T.surface, border: `1.5px solid ${T.border}` }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: '0 0 8px', letterSpacing: 0.5 }}>DEFAULT CONTACT (from your account)</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${T.primary}18`, border: `1.5px solid ${T.primary}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AtSign size={14} color={T.primary} />
                  </div>
                  <div style={{ flex: 1, height: 36, padding: '0 10px', fontSize: 13, border: `1.5px solid ${T.border}`, borderRadius: 8, background: T.bg, color: T.text, display: 'flex', alignItems: 'center', opacity: 0.85 }}>
                    {user.email || 'No email on account'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `#16A34A18`, border: `1.5px solid #16A34A44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={14} color="#16A34A" />
                  </div>
                  <div style={{ flex: 1, height: 36, padding: '0 10px', fontSize: 13, border: `1.5px solid ${T.border}`, borderRadius: 8, background: T.bg, color: currentPhone ? T.text : T.textMuted, display: 'flex', alignItems: 'center', opacity: 0.85 }}>
                    {currentPhone || 'No phone — add one in Verification'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              {[
                { val: fb, set: setFb, Icon: FacebookIcon, placeholder: 'https://facebook.com/yourpage', color: '#1877F2' },
                { val: ig, set: setIg, Icon: InstagramIcon, placeholder: 'https://instagram.com/yourhandle', color: '#E4405F' },
                { val: tw, set: setTw, Icon: TwitterIcon, placeholder: 'https://x.com/yourhandle', color: '#1DA1F2' },
              ].map(({ val, set, Icon, placeholder, color }, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color={color} />
                  </div>
                  <input value={val} onChange={e => { set(e.target.value); setLinksError(''); }} placeholder={placeholder}
                    style={{ flex: 1, height: 40, padding: '0 12px', fontSize: 13, fontFamily: '"DM Sans",system-ui,sans-serif', border: `1.5px solid ${val && !isValidUrl(val) ? '#FCA5A5' : T.border}`, borderRadius: 10, background: T.surface, color: T.text, outline: 'none', boxSizing: 'border-box' as const }}
                  />
                </div>
              ))}
            </div>
            {linksError && <p style={{ fontSize: 12, color: '#B91C1C', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '7px 10px', margin: '0 0 10px' }}>{linksError}</p>}
            <button onClick={handleSaveLinks} disabled={savingLinks} style={{ width: '100%', height: 42, borderRadius: 21, border: 'none', background: savedLinks ? '#15803D' : T.primary, color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: '"DM Sans",system-ui,sans-serif', cursor: savingLinks ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 250ms ease' }}>
              {savedLinks ? <><Check size={15} /> Saved!</> : savingLinks ? 'Saving…' : <><Save size={15} /> Save Social Links</>}
            </button>
          </div>
        )}
      </div>

      <DeleteAccountSection onLogout={onLogout} theme={T} />

      <button onClick={onLogout} style={{ width: '100%', padding: '14px', borderRadius: 14, border: `1.5px solid ${T.border}`, background: 'transparent', fontFamily: '"DM Sans",system-ui,sans-serif', fontSize: 14, fontWeight: 600, color: T.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 150ms ease' }}
        onMouseEnter={e => (e.currentTarget.style.background = `${T.text}08`)}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <LogOut size={17} /> Sign out
      </button>

      <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <PixelHeart color={T.accent} size={10} />
        <p className="font-pixel" style={{ fontSize: 11, color: T.textMuted, margin: 0, letterSpacing: 1 }}>SABAYPH v1.0 — MADE IN MINDANAO</p>
        <PixelHeart color={T.accent} size={10} />
      </div>

      {/* ── Location Dialog ── */}
      {locationDialogOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div style={{ width: '100%', maxWidth: 480, background: T.surface, borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 14px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 2px' }}>
                  {locationPinned ? 'Update home location' : 'Pin home location'}
                </p>
                <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>Tap the map or search to set your area</p>
              </div>
              <button onClick={() => setLocationDialogOpen(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: `1.5px solid ${T.border}`, background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.textMuted, flexShrink: 0 }}>
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* GPS button */}
              <button type="button" onClick={useGPS} disabled={gpsLoading}
                style={{ width: '100%', height: 40, borderRadius: 20, border: `1.5px solid ${pendingLocation ? '#86EFAC' : T.border}`, background: pendingLocation ? '#DCFCE7' : T.surfaceAlt, color: pendingLocation ? '#15803D' : T.text, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: gpsLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                {gpsLoading ? 'Getting location…' : pendingLocation
                  ? <><Check size={13} /> GPS set — drag pin to adjust</>
                  : <><Navigation size={13} /> Use my current location (GPS)</>}
              </button>

              {/* Map */}
              <div style={{ borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${T.border}` }}>
                <Suspense fallback={<div style={{ height: 260, background: T.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: T.textMuted }}>Loading map…</div>}>
                  <MapPicker
                    value={pendingLocation}
                    onChange={loc => setPendingLocation({ lat: loc.lat, lng: loc.lng, name: loc.name })}
                    theme={{ primary: T.primary, bg: T.bg, surface: T.surface, surfaceAlt: T.surfaceAlt, text: T.text, textMuted: T.textMuted, border: T.border } as MapPickerTheme}
                  />
                </Suspense>
              </div>

              {/* Short area label — separate from geocoder result */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: '0 0 6px', letterSpacing: 0.4 }}>AREA LABEL <span style={{ fontWeight: 400 }}>(optional)</span></p>
                <input
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  placeholder="e.g. Davao City, CDO, Cebu…"
                  style={{ ...inputSt, height: 42 }}
                />
                <p style={{ fontSize: 11, color: T.textMuted, margin: '4px 0 0' }}>A short name shown on your profile — not the full address.</p>
              </div>

              {locationError && (
                <p style={{ fontSize: 12, color: '#B91C1C', background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '8px 12px', margin: 0 }}>{locationError}</p>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 20px 20px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
              <button onClick={handleSaveLocation} disabled={savingLocation || !pendingLocation}
                style={{ width: '100%', height: 46, borderRadius: 23, border: 'none', background: (!pendingLocation || savingLocation) ? T.border : T.primary, color: (!pendingLocation || savingLocation) ? T.textMuted : '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: (!pendingLocation || savingLocation) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 200ms' }}>
                {savingLocation ? 'Saving…' : <><MapPin size={15} /> Save Location</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share profile card dialog */}
      {showShareCard && profile?.kasama_tag && (
        <ShareProfileCard
          onClose={() => setShowShareCard(false)}
          theme={T}
          displayName={user.name}
          kasamaTag={profile.kasama_tag}
          location={profile.location}
          gender={profile.gender}
          profileTags={profileTags}
          avatarUrl={avatarUrl}
          kasamaRating={stats.kasamaRating}
        />
      )}
    </div>
  );
}
