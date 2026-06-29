import { useState, useEffect } from 'react';

/**
 * Eenvoudige banner die toont of de app online/offline is.
 * Gebruikt navigator.onLine + events voor realtime status.
 */
export default function OnlineBanner() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#1a0f00',
        borderBottom: '1px solid #f9731640',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 13,
        fontWeight: 700,
        color: '#f97316',
      }}
    >
      <span>📡</span>
      <span>Geen internet — data wordt geladen uit cache</span>
    </div>
  );
}
