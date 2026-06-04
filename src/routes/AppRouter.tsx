import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import SabayPHLanding from '@/pages/landing';
import LoginPage from '@/components/LoginPage';
import SignUpPage from '@/components/SignUpPage';
import VerifyPage from '@/components/VerifyPage';
import ProfileSetupPage from '@/components/ProfileSetupPage';
import SplashScreen from '@/components/SplashScreen';
import OnboardingScreen from '@/components/OnboardingScreen';
import AppShell from '@/components/app/AppShell';
import JoinRoomModal from '@/components/JoinRoomModal';

type InternalView = 'landing' | 'login' | 'signup' | 'verify' | 'profile-setup' | 'splash' | 'onboarding' | 'app';

const STORAGE_KEYS = ['sabayph_auth', 'sabayph_onboarding_seen'];

function clearAppStorage() {
  STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
}

function getJoinParam(): string {
  return new URLSearchParams(window.location.search).get('join') ?? '';
}

export default function AppRouter() {
  const { session, loading, authEvent } = useAuth();
  const [view, setView] = useState<InternalView>('landing');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingJoinCode, setPendingJoinCode] = useState(() => getJoinParam());
  const initialLoadDone = useRef(false);
  const wasLoggedIn = useRef(false);

  useEffect(() => {
    if (loading) return;

    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      if (session) {
        wasLoggedIn.current = true;
        const seenOnboarding = localStorage.getItem('sabayph_onboarding_seen');
        setView(seenOnboarding ? 'app' : 'onboarding');
      }
      return;
    }

    if (authEvent === 'SIGNED_IN' && !wasLoggedIn.current) {
      wasLoggedIn.current = true;
      localStorage.removeItem('sabayph_auth');

      const userId = session?.user?.id;
      if (userId) {
        (async () => {
          const { data } = await supabase
            .from('profiles')
            .select('profile_completed')
            .eq('id', userId)
            .single();
          setView(!data?.profile_completed ? 'profile-setup' : 'splash');
        })();
      } else {
        setView('splash');
      }
    } else if (authEvent === 'SIGNED_OUT') {
      wasLoggedIn.current = false;
      clearAppStorage();
      setView('landing');
    }
  }, [session, loading, authEvent]);

  const handleLogout = async () => {
    clearAppStorage();
    await supabase.auth.signOut();
  };

  const handleSplashDone = () => {
    const seenOnboarding = localStorage.getItem('sabayph_onboarding_seen');
    setView(seenOnboarding ? 'app' : 'onboarding');
  };

  const handleOnboardingDone = () => {
    localStorage.setItem('sabayph_onboarding_seen', 'true');
    setView('app');
  };

  const dismissJoin = () => {
    setPendingJoinCode('');
    const url = new URL(window.location.href);
    url.searchParams.delete('join');
    window.history.replaceState({}, '', url);
  };

  if (loading) return null;

  const user = session?.user ?? null;

  if (view === 'profile-setup' && user) {
    const googleName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? '';
    return <ProfileSetupPage userId={user.id} initialName={googleName} onDone={() => setView('splash')} />;
  }
  if (view === 'splash')     return <SplashScreen onDone={handleSplashDone} />;
  if (view === 'onboarding') return <OnboardingScreen onDone={handleOnboardingDone} />;

  if (view === 'app') {
    return (
      <>
        <AppShell user={user} onLogout={handleLogout} />
        {pendingJoinCode && session && (
          <JoinRoomModal joinCode={pendingJoinCode} onClose={dismissJoin} />
        )}
      </>
    );
  }

  if (view === 'verify') {
    return (
      <VerifyPage
        email={pendingEmail}
        onVerified={() => setView('splash')}
        onBack={() => setView('signup')}
      />
    );
  }

  if (view === 'login') {
    return (
      <LoginPage
        onLogin={() => setView('splash')}
        onBack={() => setView('landing')}
        onGoToSignUp={() => setView('signup')}
      />
    );
  }

  if (view === 'signup') {
    return (
      <SignUpPage
        onSignUp={() => setView('splash')}
        onNeedsVerification={(email) => { setPendingEmail(email); setView('verify'); }}
        onBack={() => setView('landing')}
        onGoToLogin={() => setView('login')}
      />
    );
  }

  return <SabayPHLanding onLoginClick={() => setView('login')} />;
}
