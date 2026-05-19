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
  const lastKnownUserId = useRef(null);

  useEffect(() => {
    // Safety: force out of loading after 6s if auth never fires
    const timeout = setTimeout(() => setLoading(false), 6000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          if (lastKnownUserId.current === session.user.id) {
            setSession(session);
            return;
          }
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          setSession(session);
          setUserData(data);
          lastKnownUserId.current = session.user.id;
        } else {
          const playerSession = localStorage.getItem('playerSession');
          if (playerSession) {
            try {
              const parsed = JSON.parse(playerSession);
              if (parsed.role === 'player' && parsed.uid) {
                setSession({ user: { id: parsed.uid } });
                setUserData(parsed);
                lastKnownUserId.current = parsed.uid;
              } else {
                setSession(null);
                setUserData(null);
              }
            } catch {
              localStorage.removeItem('playerSession');
              setSession(null);
              setUserData(null);
            }
          } else {
            setSession(null);
            setUserData(null);
            lastKnownUserId.current = null;
          }
        }
      } catch (err) {
        console.error('Auth state error:', err);
        setSession(null);
        setUserData(null);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
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
        {!(session && userData) ? (
          <AuthComponent onPlayerLogin={handlePlayerLogin} />
        ) : (
          <Dashboard user={session.user} userData={userData} onPlayerLogout={handlePlayerLogout} />
        )}
      </ErrorBoundary>
    </div>
  );
}
