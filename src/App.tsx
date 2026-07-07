import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { NEON_COLOR } from './utils/constants';
import { applyManifestForRole } from './lib/pwaManifest';
import AuthComponent from './components/auth/AuthComponent';
import Dashboard from './components/dashboard/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import ConsentModal from './components/modals/ConsentModal';
import { hasConsented } from './lib/consent';
import PrivacyPolicy from './components/PrivacyPolicy';
import LandingPage from './components/landing/LandingPage';
import OnlineBanner from './components/OnlineBanner';
import SWUpdateToast from './components/SWUpdateToast';

const ClubAdminDashboard = lazy(() => import('./components/club/ClubAdminDashboard'));
const ParentDashboard    = lazy(() => import('./components/parent/ParentDashboard'));
const ParentAuthFlow     = lazy(() => import('./components/parent/ParentAuthFlow'));
const AdminApp           = lazy(() => import('./components/admin/AdminApp'));
const AdminLogin         = lazy(() => import('./components/admin/AdminLogin'));

// True wanneer de gebruiker /admin bezoekt — rol-gated platform-admin.
const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

// Redirect old domains to canonical domain, preserving hash (access_token, etc.) and search params.
const OLD_HOSTNAMES = ['voetbal-flame.vercel.app', 'skills.weareimpact.nl'];
if (typeof window !== 'undefined' && OLD_HOSTNAMES.includes(window.location.hostname)) {
  window.location.replace('https://skillkaart.nl' + window.location.pathname + window.location.search + window.location.hash);
}

// Detect error in hash (e.g. expired OTP: #error=access_denied&error_code=otp_expired)
const hashError = (() => {
  if (typeof window === 'undefined' || !window.location.hash.includes('error=')) return null;
  const params = new URLSearchParams(window.location.hash.slice(1));
  const code = params.get('error_code') ?? '';
  if (code === 'otp_expired') return 'Deze reset-link is verlopen. Vraag hieronder een nieuwe aan.';
  return params.get('error_description') ?? 'Link is ongeldig of verlopen. Vraag hieronder een nieuwe aan.';
})();

// getSession() can hang when Supabase tries to refresh an expired token.
// Always call it for recovery URLs (implicit: #type=recovery, PKCE: ?code=…).
// For normal navigations, skip if there's no stored session to avoid cold-start delay.
const hasRecoveryCode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('code');
// Magic link via implicit flow: Supabase server-generated invite links redirect with #access_token=…
const hasInviteHash = typeof window !== 'undefined' && window.location.hash.includes('access_token=');
const getSessionSafe = () => {
  const isRecoveryUrl = typeof window !== 'undefined' && window.location.hash.includes('type=recovery');
  const hasStoredSession = Object.keys(localStorage).some(
    k => k.startsWith('sb-') && k.endsWith('-auth-token')
  );
  if (!isRecoveryUrl && !hasRecoveryCode && !hasInviteHash && !hasStoredSession) return Promise.resolve({ data: { session: null }, error: null });
  // Give PKCE/invite flows more time than a normal session refresh.
  const timeout = (hasRecoveryCode || hasInviteHash) ? 10000 : 3000;
  return Promise.race([
    supabase.auth.getSession(),
    new Promise<{ data: { session: null }; error: null }>(resolve =>
      setTimeout(() => resolve({ data: { session: null }, error: null }), timeout)
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
  const [showAuth, setShowAuth] = useState(!!hashError);
  const [showParentAuth, setShowParentAuth] = useState(false);
  const [showParentDemo, setShowParentDemo] = useState(false);
  const lastKnownUserId = useRef(null);

  // Warm up both Supabase services on page load so cold-start delay is absorbed
  // while the user is still typing credentials, not after they click submit.
  // PostgREST and GoTrue (Auth) are separate services with independent cold starts.
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const ping = async () => {
      await Promise.allSettled([
        supabase.from('players').select('id').limit(1),        // warms PostgREST + DB
        fetch(`${supabaseUrl}/auth/v1/health`, { method: 'GET' }), // warms GoTrue
      ]);
    };
    void ping();
  }, []);

  // Koppel de install-manifest (naam, beschrijving, screenshots) aan de rol
  // van de ingelogde gebruiker, zodra die bekend is.
  useEffect(() => {
    applyManifestForRole(showParentDemo ? 'parent' : userData?.role);
  }, [userData?.role, showParentDemo]);

  useEffect(() => {
    let cancelled = false;

    const hardFallback = setTimeout(() => {
      if (!cancelled) { setSession(null); setUserData(null); setLoading(false); }
    }, (hasRecoveryCode || hasInviteHash) ? 12000 : 4000);

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

          // Magic link auto-claim: ouder klikt de link → ?parentCode=XYZ in URL.
          // Claim onafhankelijk van profiel-existentie zodat een 2e/3e kind ook
          // geclaimd kan worden door een ouder die al een account heeft.
          const parentCode = new URLSearchParams(window.location.search).get('parentCode');
          if (parentCode && !cancelled) {
            try {
              const code = parentCode.trim().toUpperCase();
              const { data: link } = await supabase
                .from('parent_links').select('*')
                .eq('link_code', code).eq('verified', false).maybeSingle();
              if (link) {
                if (!data) {
                  await supabase.from('profiles').insert({ id: session.user.id, role: 'parent', team_id: link.team_id });
                  await supabase.from('notification_prefs').insert({ parent_id: session.user.id, weekly_digest: true, critical_alerts: true, channel: 'email', detail_level: 'light' });
                }
                await supabase.from('parent_links').update({ parent_id: session.user.id, verified: true }).eq('link_code', code);
                const { data: links } = await supabase
                  .from('parent_links').select('player_id')
                  .eq('parent_id', session.user.id).eq('verified', true).order('created_at');
                const linkedPlayerIds = (links ?? []).map(l => l.player_id);
                setSession(session);
                setUserData({ id: session.user.id, uid: session.user.id, role: 'parent', team_id: link.team_id, teamId: link.team_id, linkedPlayerId: linkedPlayerIds[0] ?? link.player_id, linkedPlayerIds });
                lastKnownUserId.current = session.user.id;
                window.history.replaceState({}, '', window.location.pathname);
                return;
              }
            } catch (claimErr) {
              console.error('Parent auto-claim mislukt:', claimErr);
            }
          }

          if (!cancelled) {
            setSession(session);
            if (data?.role === 'parent') {
              const { data: links } = await supabase
                .from('parent_links').select('player_id')
                .eq('parent_id', session.user.id).eq('verified', true).order('created_at');
              const linkedPlayerIds = (links ?? []).map(l => l.player_id);
              setUserData({ ...data, teamId: data.team_id, linkedPlayerId: linkedPlayerIds[0] ?? null, linkedPlayerIds });
            } else {
              setUserData(data ? { ...data, teamId: data.team_id, clubId: data.club_id } : null);
            }
            lastKnownUserId.current = session.user.id;
          }
        } else {
          if (!cancelled) {
            // Don't signOut during a PKCE code exchange — it would kill the recovery session.
            if (!hasRecoveryCode) {
              try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
            }
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
        const parentCode = new URLSearchParams(window.location.search).get('parentCode');
        // Bij een nieuwe koppelcode niet vroegtijdig stoppen, ook niet als deze
        // ouder al ingelogd was — anders wordt een 2e/3e kind nooit geclaimd.
        if (lastKnownUserId.current === session.user.id && !parentCode) { setSession(session); return; }
        try {
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

          // Magic link auto-claim: ouder klikt link → SIGNED_IN → claim onafhankelijk
          // van profiel-existentie (idempotent) zodat een 2e kind ook werkt.
          if (parentCode) {
            try {
              const code = parentCode.trim().toUpperCase();
              const { data: link } = await supabase
                .from('parent_links').select('*')
                .eq('link_code', code).eq('verified', false).maybeSingle();
              if (link) {
                if (!data) {
                  await supabase.from('profiles').insert({ id: session.user.id, role: 'parent', team_id: link.team_id });
                  await supabase.from('notification_prefs').insert({ parent_id: session.user.id, weekly_digest: true, critical_alerts: true, channel: 'email', detail_level: 'light' });
                }
                await supabase.from('parent_links').update({ parent_id: session.user.id, verified: true }).eq('link_code', code);
                const { data: links } = await supabase
                  .from('parent_links').select('player_id')
                  .eq('parent_id', session.user.id).eq('verified', true).order('created_at');
                const linkedPlayerIds = (links ?? []).map(l => l.player_id);
                setSession(session);
                setUserData({ id: session.user.id, uid: session.user.id, role: 'parent', team_id: link.team_id, teamId: link.team_id, linkedPlayerId: linkedPlayerIds[0] ?? link.player_id, linkedPlayerIds });
                lastKnownUserId.current = session.user.id;
                window.history.replaceState({}, '', window.location.pathname);
                return;
              }
            } catch (claimErr) {
              console.error('Parent auto-claim mislukt:', claimErr);
            }
          }

          setSession(session);
          if (data?.role === 'parent') {
            const { data: links } = await supabase
              .from('parent_links').select('player_id')
              .eq('parent_id', session.user.id).eq('verified', true).order('created_at');
            const linkedPlayerIds = (links ?? []).map(l => l.player_id);
            setUserData({ ...data, teamId: data.team_id, linkedPlayerId: linkedPlayerIds[0] ?? null, linkedPlayerIds });
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

  if (isAdminRoute) {
    return (
      <div className="bg-white text-gray-900 font-sans min-h-screen" style={{ '--neon-color': NEON_COLOR } as React.CSSProperties}>
        <ErrorBoundary>
          {loading ? (
            <div className="min-h-screen flex items-center justify-center">
              <Loader2 className="animate-spin h-10 w-10" style={{ color: NEON_COLOR }} />
            </div>
          ) : !(session && userData) ? (
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10" style={{ color: NEON_COLOR }} /></div>}>
              <AdminLogin onBack={() => { window.location.href = '/'; }} />
            </Suspense>
          ) : userData.role === 'superadmin' ? (
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10" style={{ color: NEON_COLOR }} /></div>}>
              <AdminApp userData={userData} onLogout={handlePlayerLogout} />
            </Suspense>
          ) : (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
              <h1 className="text-2xl font-black mb-2 text-gray-900">Geen toegang</h1>
              <p className="text-gray-500 mb-6">Dit gedeelte is alleen voor de platformbeheerder.</p>
              <button onClick={() => { window.location.href = '/'; }} className="px-5 py-2 rounded-lg bg-[--neon-color] text-black font-bold">
                Terug naar app
              </button>
            </div>
          )}
        </ErrorBoundary>
      </div>
    );
  }

  const isLightTheme = !!(session && userData);

  return (
    <div className={isLightTheme ? 'bg-white text-gray-900 font-sans min-h-screen' : 'bg-gradient-to-b from-[#0D0D0D] to-[#1A1A1A] text-white font-sans'} style={{ '--neon-color': NEON_COLOR } as React.CSSProperties}>
      {!isLightTheme && <style>{`body { scrollbar-width: thin; scrollbar-color: ${NEON_COLOR} #0D0D0D; } body::-webkit-scrollbar { width: 8px; } body::-webkit-scrollbar-track { background: #0D0D0D; } body::-webkit-scrollbar-thumb { background-color: ${NEON_COLOR}; border-radius: 20px; border: 3px solid #0D0D0D; }`}</style>}

      {!consentGiven && (
        <ConsentModal
          onAccept={() => setConsentGiven(true)}
          onShowPrivacy={() => setShowPrivacy(true)}
        />
      )}

      <ErrorBoundary>
        {!(session && userData) || isRecovering ? (
          showParentDemo ? (
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-[--neon-color]" /></div>}>
              <ParentDashboard
                userData={{ role: 'parent', uid: 'demo-parent', linkedPlayerId: 'demo-player' }}
                demo
                onLogout={() => { setShowParentDemo(false); setShowParentAuth(false); }}
              />
            </Suspense>
          ) : showParentAuth ? (
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-[--neon-color]" /></div>}>
              <ParentAuthFlow onBack={() => setShowParentAuth(false)} onDemo={() => setShowParentDemo(true)} />
            </Suspense>
          ) : showAuth || isRecovering ? (
            <AuthComponent
              onPlayerLogin={handlePlayerLogin}
              isRecovering={isRecovering}
              initialError={hashError ?? undefined}
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
      <OnlineBanner />
      <SWUpdateToast />
    </div>
  );
}
