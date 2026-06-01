import { useState, useRef } from 'react';
import { ChevronLeft, Mail, Phone, ArrowRight, RotateCcw } from 'lucide-react';
import { PixelHeart } from '@/components/common/PixelDecorations';
import { supabase } from '@/lib/supabase';

const T = {
  bg: '#F1EDE1', surface: '#FFFFFF', surfaceAlt: '#E9E2D0',
  primary: '#043E81', accent: '#C82718', highlight: '#EEA64C',
  text: '#06131B', textMuted: '#5A5448', border: '#D6C09D',
};

type Step = 'choose' | 'email-sent' | 'phone-input' | 'otp-input';

interface VerifyPageProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export default function VerifyPage({ email, onVerified, onBack }: VerifyPageProps) {
  const [step, setStep] = useState<Step>('choose');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const startCooldown = () => {
    setResendCooldown(60);
    const tick = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(tick); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendEmail = async () => {
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resend({ type: 'signup', email });
    setLoading(false);
    if (err) setError(err.message);
    else startCooldown();
  };

  const handleSendOtp = async () => {
    setError('');
    if (!phone.trim()) { setError('Enter your phone number.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setStep('otp-input');
    startCooldown();
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const token = otp.join('');
    if (token.length < 6) { setError('Enter the full 6-digit code.'); return; }
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    setLoading(false);
    if (err) { setError(err.message); return; }
    onVerified();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 52, padding: '0 16px',
    fontSize: 15, fontFamily: '"DM Sans", system-ui, sans-serif',
    border: `2px solid ${T.border}`, borderRadius: 12,
    background: T.surface, color: T.text, outline: 'none',
    boxSizing: 'border-box',
  };

  const btnPrimary: React.CSSProperties = {
    width: '100%', height: 52, borderRadius: 26, border: 'none',
    background: loading ? T.border : T.primary,
    color: loading ? T.textMuted : T.surface,
    fontSize: 15, fontWeight: 700, fontFamily: '"DM Sans", system-ui, sans-serif',
    cursor: loading ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'background 200ms ease',
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", system-ui, sans-serif', padding: '24px 16px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Bricolage+Grotesque:wght@700;800&family=VT323&display=swap');
        .font-display{font-family:'Bricolage Grotesque',serif;letter-spacing:-0.02em;}
        .font-pixel{font-family:'VT323',monospace;}
        @keyframes fade-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fade-up 500ms ease-out both;}
      `}</style>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.3, backgroundImage: `linear-gradient(${T.border} 1px,transparent 1px),linear-gradient(90deg,${T.border} 1px,transparent 1px)`, backgroundSize: '20px 20px' }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', marginBottom: 24, padding: 0 }}>
          <ChevronLeft size={18} /> Back
        </button>

        <div style={{ background: T.surface, border: `3px solid ${T.text}`, borderRadius: 24, boxShadow: `8px 8px 0 ${T.text}`, padding: '40px 36px' }}>

          {/* CHOOSE METHOD */}
          {step === 'choose' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 42, marginBottom: 12 }}>✉️</div>
                <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: '0 0 8px' }}>Verify your account</h2>
                <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>
                  Choose how you'd like to verify your identity before joining rooms.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={() => { setStep('email-sent'); handleResendEmail(); }}
                  style={{ width: '100%', padding: '16px', borderRadius: 14, border: `2px solid ${T.primary}`, background: `${T.primary}12`, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={20} style={{ color: T.bg }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 2px' }}>Verify via Email</p>
                    <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>{email}</p>
                  </div>
                </button>

                <button
                  onClick={() => setStep('phone-input')}
                  style={{ width: '100%', padding: '16px', borderRadius: 14, border: `2px solid ${T.border}`, background: T.surfaceAlt, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: T.surfaceAlt, border: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={20} style={{ color: T.textMuted }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 2px' }}>Verify via Phone</p>
                    <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>Get a 6-digit SMS code</p>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* EMAIL SENT */}
          {step === 'email-sent' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📬</div>
                <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: '0 0 8px' }}>Check your inbox</h2>
                <p style={{ fontSize: 14, color: T.textMuted, margin: '0 0 6px' }}>
                  We sent a confirmation link to
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.primary, margin: 0 }}>{email}</p>
              </div>

              <div style={{ padding: '14px', background: `${T.highlight}22`, border: `1px solid ${T.highlight}66`, borderRadius: 12, marginBottom: 20 }}>
                <p style={{ fontSize: 13, color: T.text, margin: 0, lineHeight: 1.6 }}>
                  Click the link in the email to verify your account. Once confirmed, come back and sign in.
                </p>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: '#FEE2E2', borderRadius: 8, border: '1px solid #FCA5A5', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>{error}</p>
                </div>
              )}

              <button
                onClick={handleResendEmail}
                disabled={loading || resendCooldown > 0}
                style={{ ...btnPrimary, background: resendCooldown > 0 ? T.surfaceAlt : T.primary, color: resendCooldown > 0 ? T.textMuted : T.surface, marginBottom: 12 }}
              >
                <RotateCcw size={16} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend email'}
              </button>

              <button
                onClick={() => setStep('phone-input')}
                style={{ width: '100%', height: 44, borderRadius: 22, border: `1.5px solid ${T.border}`, background: 'none', color: T.textMuted, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                Use phone instead
              </button>
            </>
          )}

          {/* PHONE INPUT */}
          {step === 'phone-input' && (
            <>
              <div style={{ marginBottom: 24 }}>
                <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: '0 0 8px' }}>Enter your phone</h2>
                <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>
                  We'll send a 6-digit code via SMS to verify it's you.
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, display: 'block', marginBottom: 6 }}>PHONE NUMBER</label>
                <input
                  style={inputStyle}
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+63 917 123 4567"
                />
                <p style={{ fontSize: 11, color: T.textMuted, margin: '6px 0 0' }}>Include country code, e.g. +63 for Philippines</p>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: '#FEE2E2', borderRadius: 8, border: '1px solid #FCA5A5', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>{error}</p>
                </div>
              )}

              <button onClick={handleSendOtp} disabled={loading} style={{ ...btnPrimary, marginBottom: 12 }}>
                {loading ? 'Sending…' : <><Phone size={16} /> Send OTP</>}
              </button>

              <button
                onClick={() => setStep('email-sent')}
                style={{ width: '100%', height: 44, borderRadius: 22, border: `1.5px solid ${T.border}`, background: 'none', color: T.textMuted, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                Use email instead
              </button>
            </>
          )}

          {/* OTP INPUT */}
          {step === 'otp-input' && (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 42, marginBottom: 12, textAlign: 'center' }}>📱</div>
                <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800, color: T.text, margin: '0 0 8px' }}>Enter the code</h2>
                <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>
                  We sent a 6-digit code to <strong style={{ color: T.text }}>{phone}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value.replace(/\D/, ''))}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    style={{
                      width: 46, height: 56, borderRadius: 12, textAlign: 'center',
                      fontSize: 22, fontWeight: 700, color: T.text,
                      border: `2px solid ${digit ? T.primary : T.border}`,
                      background: T.surface, outline: 'none', fontFamily: 'inherit',
                      transition: 'border-color 150ms ease',
                    }}
                  />
                ))}
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: '#FEE2E2', borderRadius: 8, border: '1px solid #FCA5A5', marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>{error}</p>
                </div>
              )}

              <button onClick={handleVerifyOtp} disabled={loading} style={{ ...btnPrimary, marginBottom: 12 }}>
                {loading ? 'Verifying…' : <><ArrowRight size={16} /> Verify Code</>}
              </button>

              <button
                onClick={() => { if (resendCooldown === 0) handleSendOtp(); }}
                disabled={resendCooldown > 0 || loading}
                style={{ width: '100%', height: 44, borderRadius: 22, border: `1.5px solid ${T.border}`, background: 'none', color: resendCooldown > 0 ? T.textMuted : T.primary, fontSize: 14, fontFamily: 'inherit', cursor: resendCooldown > 0 ? 'default' : 'pointer' }}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </button>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <PixelHeart color={T.accent} size={10} />
          <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>Made with love in the Philippines</p>
          <PixelHeart color={T.accent} size={10} />
        </div>
      </div>
    </div>
  );
}
