import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { NEON_COLOR } from './utils/constants';
import AuthComponent from './components/auth/AuthComponent';
import Dashboard from './components/dashboard/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import ConsentModal, { hasConsented } from './components/modals/ConsentModal';
import PrivacyPolicy from './components/PrivacyPolicy';
import LandingPage from './components/landing/LandingPage';

const ClubAdminDashboard = lazy(() => import('./components/club/ClubAdminDashboard'));
const ParentDashboard    = lazy(() => import('./components/parent/ParentDashboard'));
const ParentAuthFlow     = lazy(() => import('./components/parent/ParentAuthFlow'));

// getSession() can hang when Supabase tries to refresh an expired token.
// Only call it if there's actually a stored session — otherwise return null immediately.
const getSessionSafe = () => {
  const hasStoredSession = Object.keys(localStorage).some(
    k => k.startsWith('sb-') && k.endsWith('-auth-token')
  );
  if (!hasStoredSession) return Promise.resolve({ data: { session: null }, error: null });
  return Promise.race([
    supabase.auth.getSession(),
    new Promise<{ data: { session: null }; error: null }>(resolve =>
      setTimeout(() => resolve({ data: { session: null }, error: null }), 3000)
    ),
  ]);
};

export default function Skillkaart() {
  const [session, setSession] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);
  const [consentGiven, setConsentGiven] = useState(hasConsented);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showParentAuth, setShowParentAuth] = useState(false);
  const lastKnownUserId = useRef(null);

  // Warm up the PostgREST database connection in the background so the first
  // login query doesn't hit a cold-start delay on Supabase free tier.
  useEffect(() => {
    const ping = async () => { try { await supabase.from('players').select('id').limit(1); } catch { /* ignore */ } };
    void ping();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hardFallback = setTimeout(() => {
      if (!cancelled) { setSession(null); setUserData(null); setLoading(false); }
    }, 4000);

    const init = async () => {
      if (window.location.hash.includes('type=recovery')) {
        try { await getSessionSafe(); } catch { /* ignore */ }
        if (!cancelled) { setIsRecovering(true); setLoading(false); }
        return;
      }

      const raw = localStorage.getItem('playerSession');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.role === 'player' && parsed.uid) {
            if (!cancelled) {
              setSession({ user: { id: parsed.uid } });
              setUserData(parsed);
              lastKnownUserId.current = parsed.uid;
              setLoading(false);
            }
            return;
          }
        } catch {
          localStorage.removeItem('playerSession');
        }
      }

      try {
        const { data: { session } } = await getSessionSafe();
        if (cancelled) return;

        if (session?.user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (!cancelled) {
            setSession(session);
            if (data?.role === 'parent') {
              const { data: link } = await supabase
                .from('parent_links').select('player_id')
                .eq('parent_id', session.user.id).eq('verified', true).maybeSingle();
              setUserData({ ...data, teamId: data.team_id, linkedPlayerId: link?.player_id ?? null });
            } else {
              setUserData(data ? { ...data, teamId: data.team_id, clubId: data.club_id } : null);
            }
            lastKnownUserId.current = session.user.id;
          }
        } else {
          if (!cancelled) {
            try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
            setSession(null);
            setUserData(null);
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (!cancelled) { setSession(null); setUserData(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void init().finally(() => clearTimeout(hardFallback));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
        setLoading(false);
        return;
      }
      if (_event === 'INITIAL_SESSION') return;

      if (session?.user) {
        if (lastKnownUserId.current === session.user.id) { setSession(session); return; }
        try {
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          setSession(session);
          if (data?.role === 'parent') {
            const { data: link } = await supabase
              .from('parent_links').select('player_id')
              .eq('parent_id', session.user.id).eq('verified', true).maybeSingle();
            setUserData({ ...data, teamId: data.team_id, linkedPlayerId: link?.player_id ?? null });
          } else {
            setUserData(data ? { ...data, teamId: data.team_id, clubId: data.club_id } : null);
          }
          lastKnownUserId.current = session.user.id;
        } catch { setSession(null); setUserData(null); }
      } else if (_event === 'SIGNED_OUT') {
        setSession(null);
        setUserData(null);
        lastKnownUserId.current = null;
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(hardFallback);
      subscription.unsubscribe();
    };
  }, []);

  const handlePlayerLogin = (playerData) => {
    localStorage.setItem('playerSession', JSON.stringify(playerData));
    setSession({ user: { id: playerData.uid } });
    setUserData(playerData);
    lastKnownUserId.current = playerData.uid;
  };

  const handlePlayerLogout = () => {
    localStorage.removeItem('playerSession');
    setSession(null);
    setUserData(null);
    lastKnownUserId.current = null;
  };

  if (showPrivacy) {
    return (
      <div style={{ '--neon-color': NEON_COLOR } as React.CSSProperties}>
        <PrivacyPolicy onBack={() => setShowPrivacy(false)} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-[#0D0D0D] to-[#1A1A1A] text-white min-h-screen flex flex-col items-center justify-center text-center" style={{ '--neon-color': NEON_COLOR } as React.CSSProperties}>
        <Loader2 className="animate-spin h-12 w-12 text-[--neon-color] mb-4" />
        <h2 className="text-2xl font-bold">Verbinden met de server...</h2>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-[#0D0D0D] to-[#1A1A1A] text-white font-sans" style={{ '--neon-color': NEON_COLOR } as React.CSSProperties}>
      <style>{`body { scrollbar-width: thin; scrollbar-color: ${NEON_COLOR} #0D0D0D; } body::-webkit-scrollbar { width: 8px; } body::-webkit-scrollbar-track { background: #0D0D0D; } body::-webkit-scrollbar-thumb { background-color: ${NEON_COLOR}; border-radius: 20px; border: 3px solid #0D0D0D; }`}</style>

      {!consentGiven && (
        <ConsentModal
          onAccept={() => setConsentGiven(true)}
          onShowPrivacy={() => setShowPrivacy(true)}
        />
      )}

      <ErrorBoundary>
        {!(session && userData) || isRecovering ? (
          showParentAuth ? (
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-[--neon-color]" /></div>}>
              <ParentAuthFlow onBack={() => setShowParentAuth(false)} />
            </Suspense>
          ) : showAuth || isRecovering ? (
            <AuthComponent
              onPlayerLogin={handlePlayerLogin}
              isRecovering={isRecovering}
              onBack={isRecovering ? undefined : () => setShowAuth(false)}
              onPasswordUpdated={() => {
                setIsRecovering(false);
                void supabase.auth.signOut();
              }}
            />
          ) : (
            <LandingPage onLogin={() => setShowAuth(true)} onParentLogin={() => setShowParentAuth(true)} />
          )
        ) : userData.role === 'club_admin' ? (
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-[--neon-color]" /></div>}>
            <ClubAdminDashboard userData={userData} onLogout={handlePlayerLogout} />
          </Suspense>
        ) : userData.role === 'parent' ? (
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-[--neon-color]" /></div>}>
            <ParentDashboard userData={userData} onLogout={handlePlayerLogout} />
          </Suspense>
        ) : (
          <Dashboard user={session.user} userData={userData} onPlayerLogout={handlePlayerLogout} />
        )}
      </ErrorBoundary>
    </div>
  );
}
