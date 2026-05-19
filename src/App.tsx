import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { NEON_COLOR } from './utils/constants';
import AuthComponent from './components/auth/AuthComponent';
import Dashboard from './components/dashboard/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';

export default function Skillkaart() {
  const [session, setSession] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);
  const lastKnownUserId = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Player session: local only, no network needed
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

      // Coach session: single getSession() call, much faster than waiting for the event
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session?.user) {
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (!cancelled) {
            setSession(session);
            setUserData(data);
            lastKnownUserId.current = session.user.id;
          }
        } else {
          if (!cancelled) { setSession(null); setUserData(null); }
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (!cancelled) { setSession(null); setUserData(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
        setLoading(false);
        return;
      }
      // INITIAL_SESSION is handled by init() above
      if (_event === 'INITIAL_SESSION') return;

      if (session?.user) {
        if (lastKnownUserId.current === session.user.id) { setSession(session); return; }
        try {
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          setSession(session);
          setUserData(data);
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
      <ErrorBoundary>
        {!(session && userData) || isRecovering ? (
          <AuthComponent
            onPlayerLogin={handlePlayerLogin}
            isRecovering={isRecovering}
            onPasswordUpdated={() => {
              setIsRecovering(false);
              void supabase.auth.signOut();
            }}
          />
        ) : (
          <Dashboard user={session.user} userData={userData} onPlayerLogout={handlePlayerLogout} />
        )}
      </ErrorBoundary>
    </div>
  );
}
