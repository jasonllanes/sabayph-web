import { useState, useRef } from 'react';
import { ArrowRight, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { PixelHeart } from '@/components/common/PixelDecorations';
import { supabase } from '@/lib/supabase';

const T = {
  bg: '#F1EDE1', surface: '#FFFFFF', surfaceAlt: '#E9E2D0',
  primary: '#043E81', accent: '#C82718', highlight: '#EEA64C',
  text: '#06131B', textMuted: '#5A5448', border: '#D6C09D',
};

interface SignUpPageProps {
  onSignUp: (email: string) => void;
  onNeedsVerification: (email: string) => void;
  onBack: () => void;
  onGoToLogin: () => void;
}

const PW_RULES = [
  { key: 'length',    label: 'Minimum characters 12',   test: (p: string) => p.length >= 12 },
  { key: 'upper',     label: 'One uppercase character',  test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower',     label: 'One lowercase character',  test: (p: string) => /[a-z]/.test(p) },
  { key: 'special',   label: 'One special character',    test: (p: string) => /[^A-Za-z0-9]/.test(p) },
  { key: 'number',    label: 'One number',               test: (p: string) => /[0-9]/.test(p) },
];

export default function SignUpPage({ onSignUp, onNeedsVerification, onBack, onGoToLogin }: SignUpPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);
  const [confirmFocus, setConfirmFocus] = useState(false);
  const [pwDirty, setPwDirty] = useState(false);
  const emailRef   = useRef<HTMLInputElement>(null);
  const pwRef      = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const pwResults = PW_RULES.map(r => ({ ...r, pass: r.test(password) }));
  const pwValid = pwResults.every(r => r.pass);
  const showPwErrors = pwDirty && !pwValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPwDirty(true);

    if (!email.trim()) { emailRef.current?.focus(); setError('Email address is required.'); return; }
    if (!pwValid) {
      pwRef.current?.focus();
      setError('Please add all necessary characters to create safe password.');
      return;
    }
    if (password !== confirmPassword) {
      confirmRef.current?.focus();
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (authError) {
      if (
        authError.message?.toLowerCase().includes('confirmation email') ||
        authError.message?.toLowerCase().includes('sending')
      ) {
        onSignUp((data as any)?.user?.email ?? email);
        return;
      }
      if (
        authError.message?.toLowerCase().includes('already registered') ||
        authError.message?.toLowerCase().includes('already been registered') ||
        authError.message?.toLowerCase().includes('user already exists') ||
        authError.status === 422
      ) {
        setError('This email is already registered. Please sign in instead.');
        return;
      }
      setError(authError.message);
      return;
    }

    // Verification disabled — proceed directly regardless of session state
    onSignUp(data.user?.email ?? email);
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });

    if (authError) {
      setError(authError.message);
      setGoogleLoading(false);
    }
  };

  const inputStyle = (focused: boolean, hasError = false): React.CSSProperties => ({
    width: '100%', height: 52, padding: '0 48px 0 16px',
    fontSize: 15, fontFamily: '"DM Sans", system-ui, sans-serif',
    border: `2px solid ${hasError ? '#C82718' : focused ? T.primary : T.border}`,
    borderRadius: 12, background: T.surface,
    color: T.text, outline: 'none',
    transition: 'border-color 200ms ease',
    boxSizing: 'border-box',
  });

  return (
    <div
      style={{
        minHeight: '100vh', background: T.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        padding: '24px 16px',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Bricolage+Grotesque:wght@500;700;800&family=VT323&display=swap');
        .font-display { font-family: 'Bricolage Grotesque', serif; letter-spacing: -0.02em; }
        .font-pixel  { font-family: 'VT323', monospace; }
        @keyframes fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-up 500ms ease-out both; }
        .google-btn:hover { background: #f3f4f6 !important; }
      `}</style>

      <div
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.3,
          backgroundImage: `linear-gradient(${T.border} 1px, transparent 1px), linear-gradient(90deg, ${T.border} 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      <div className="fade-up" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: T.textMuted, background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 14, fontFamily: 'inherit',
            marginBottom: 24, padding: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = T.text)}
          onMouseLeave={e => (e.currentTarget.style.color = T.textMuted)}
        >
          <ChevronLeft size={18} />
          Back to home
        </button>

        <div
          style={{
            background: T.surface,
            border: `3px solid ${T.text}`,
            borderRadius: 24,
            boxShadow: `8px 8px 0 ${T.text}`,
            padding: '40px 36px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <img
              src="/sabayph_logo.png"
              alt="SabayPH"
              style={{ width: 48, height: 48, borderRadius: 12, border: `2px solid ${T.primary}`, objectFit: 'cover' }}
            />
            <div>
              <p className="font-display" style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>
                Sabay<span style={{ color: T.accent }}>PH</span>
              </p>
              <p className="font-pixel" style={{ fontSize: 11, color: T.textMuted, margin: 0, letterSpacing: 1 }}>
                CREATE YOUR ACCOUNT
              </p>
            </div>
          </div>

          <h2 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: T.text, margin: '0 0 6px' }}>
            Sumali na, kasama!
          </h2>
          <p style={{ fontSize: 14, color: T.textMuted, margin: '0 0 28px' }}>
            Create your account and join the community.
          </p>

          {/* Google Sign-Up */}
          <button
            className="google-btn"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            style={{
              width: '100%', height: 52, borderRadius: 12,
              border: `2px solid ${T.border}`, background: T.surface,
              color: T.text, fontSize: 15, fontWeight: 600,
              fontFamily: 'inherit', cursor: googleLoading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'background 150ms ease', marginBottom: 20,
            }}
          >
            {googleLoading ? (
              <span className="font-pixel" style={{ fontSize: 16, letterSpacing: 2 }}>REDIRECTING...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>or sign up with email</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'block', marginBottom: 6 }}>
                Email address <span style={{ color: '#C82718' }}>*</span>
              </label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                placeholder="your@email.com"
                style={inputStyle(emailFocus)}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'block', marginBottom: 6 }}>
                Password <span style={{ color: '#C82718' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={pwRef}
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPwDirty(true); }}
                  onFocus={() => setPwFocus(true)}
                  onBlur={() => setPwFocus(false)}
                  placeholder="Create a strong password"
                  style={inputStyle(pwFocus, showPwErrors)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {/* Password requirements */}
              {pwDirty && (
                <div style={{ marginTop: 8 }}>
                  {showPwErrors && (
                    <p style={{ fontSize: 12, color: '#C82718', fontWeight: 600, margin: '0 0 6px' }}>
                      Please add all necessary characters to create safe password.
                    </p>
                  )}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {pwResults.map(r => (
                      <li key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                          background: r.pass ? '#15803D' : '#C82718',
                        }} />
                        <span style={{ color: r.pass ? '#15803D' : '#C82718', fontWeight: r.pass ? 400 : 600 }}>
                          {r.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'block', marginBottom: 6 }}>
                Confirm password <span style={{ color: '#C82718' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={confirmRef}
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onFocus={() => setConfirmFocus(true)}
                  onBlur={() => setConfirmFocus(false)}
                  placeholder="Re-enter your password"
                  style={inputStyle(confirmFocus, !!(confirmPassword && password !== confirmPassword))}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#FEE2E2', borderRadius: 8, border: '1px solid #FCA5A5' }}>
                <p style={{ fontSize: 13, color: '#B91C1C', margin: 0 }}>
                  {error}
                  {error.includes('already registered') && (
                    <> <button type="button" onClick={onGoToLogin} style={{ background: 'none', border: 'none', color: '#B91C1C', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0 }}>Sign in instead →</button></>
                  )}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              style={{
                width: '100%', height: 52, borderRadius: 26,
                border: 'none', background: loading ? T.border : T.primary,
                color: loading ? T.textMuted : T.surface,
                fontSize: 16, fontWeight: 700, fontFamily: 'inherit',
                cursor: loading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 200ms ease',
                marginTop: 4,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {loading ? (
                <span className="font-pixel" style={{ fontSize: 16, letterSpacing: 2 }}>CREATING...</span>
              ) : (
                <>Gumawa ng account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div style={{ margin: '24px 0 0', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
              Mayroon nang account?{' '}
              <button
                onClick={onGoToLogin}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.primary, fontWeight: 600, fontFamily: 'inherit', fontSize: 13, padding: 0 }}
              >
                Sign in here
              </button>
            </p>
          </div>
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
