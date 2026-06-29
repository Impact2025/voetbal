import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * SW Update toast — luistert naar berichten van de service worker
 * en toont een herlaad-knop wanneer een nieuwe versie klaar staat.
 */
export default function SWUpdateToast() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    // 1) Luister naar SW berichten
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED') {
        setUpdateReady(true);
      }
    };
    navigator.serviceWorker?.addEventListener('message', handler);

    // 2) Check bij de registration of er een wachtende SW is
    navigator.serviceWorker?.getRegistration().then(reg => {
      if (reg?.waiting) {
        setUpdateReady(true);
      }
      // Luister naar updatefound
      reg?.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        newSW?.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        });
      });
    });

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handler);
    };
  }, []);

  if (!updateReady) return null;

  const handleRefresh = () => {
    // Stuur bericht naar SW om de wachtende versie actief te maken
    navigator.serviceWorker?.getRegistration().then(reg => {
      reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    });
    // Force reload
    window.location.reload();
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9998,
        background: '#1a2e1a',
        border: '1px solid #4ade8040',
        borderRadius: 16,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 14,
        fontWeight: 600,
        color: '#4ade80',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      <RefreshCw size={16} />
      <span>Nieuwe versie beschikbaar</span>
      <button
        onClick={handleRefresh}
        style={{
          background: '#4ade80',
          color: '#000',
          border: 'none',
          borderRadius: 10,
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 900,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Herlaad
      </button>
    </div>
  );
}
