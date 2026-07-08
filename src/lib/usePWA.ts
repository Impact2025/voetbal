import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Installeerbare PWA hook:
 * - Vangt beforeinstallprompt af (Android)
 * - Geeft showInstallPrompt functie om handmatig te triggeren
 * - Biedt canInstall status voor UI
 * - Beheert push subscription aan/uit
 */
export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [vapidKey] = useState(() => {
    // VAPID public key — komt uit de Supabase Edge Function config
    // Dit is de publieke sleutel, geen geheim. Zet hem in env.
    return import.meta.env.VITE_VAPID_PUBLIC_KEY as string || '';
  });
  // Eigen VAPID-identiteit voor ouder-push — losstaand van de spelers-key
  // zodat een nieuw sleutelpaar de al werkende speler-push niet breekt.
  const [parentVapidKey] = useState(() => {
    return import.meta.env.VITE_PARENT_VAPID_PUBLIC_KEY as string || '';
  });

  // ── beforeinstallprompt afvangen ──
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // ── Check of al geïnstalleerd (display-mode) ──
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setCanInstall(false);
    }
  }, []);

  // ── Install prompt tonen ──
  const showInstallPrompt = useCallback(async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
    return result.outcome === 'accepted';
  }, [deferredPrompt]);

  // ── Push subscription status checken & subscriben ──
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        setPushSubscribed(!!sub);
      });
    });
  }, []);

  const subscribePush = useCallback(async (playerId: string) => {
    if (!vapidKey) {
      console.warn('VITE_VAPID_PUBLIC_KEY niet gezet — push notificaties niet beschikbaar');
      return false;
    }
    if (!('serviceWorker' in navigator)) return false;

    try {
      const reg = await navigator.serviceWorker.ready;
      // Eerst bestaande subscription ophalen (geen dubbele aanmaken)
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
        });
      }

      // Subscription opslaan in Supabase
      await supabase.from('player_push_subscriptions').upsert({
        player_id: playerId,
        subscription: sub.toJSON(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'player_id' });

      setPushSubscribed(true);
      return true;
    } catch (err) {
      console.error('Push subscribe mislukt:', err);
      return false;
    }
  }, [vapidKey]);

  const unsubscribePush = useCallback(async (playerId: string) => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();

      await supabase.from('player_push_subscriptions').delete().eq('player_id', playerId);
      setPushSubscribed(false);
      return true;
    } catch (err) {
      console.error('Push unsubscribe mislukt:', err);
      return false;
    }
  }, []);

  // ── Ouder-varianten: zelfde flow, maar één ouder kan meerdere devices hebben ──
  const subscribeParentPush = useCallback(async (parentId: string) => {
    if (!parentVapidKey) {
      console.warn('VITE_PARENT_VAPID_PUBLIC_KEY niet gezet — push notificaties niet beschikbaar');
      return false;
    }
    if (!('serviceWorker' in navigator)) return false;

    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      // Zelfde origin/service worker als de speler-app — een bestaande
      // subscriptie kan aan de spelers-VAPID-key hangen. Alleen hergebruiken
      // als hij daadwerkelijk met de ouder-key is aangemaakt.
      if (sub && !matchesApplicationServerKey(sub, parentVapidKey)) {
        await sub.unsubscribe();
        sub = null;
      }

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(parentVapidKey) as any,
        });
      }

      await supabase.from('parent_push_subscriptions').upsert({
        parent_id: parentId,
        subscription: sub.toJSON(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'parent_id,endpoint' });

      setPushSubscribed(true);
      return true;
    } catch (err) {
      console.error('Push subscribe (ouder) mislukt:', err);
      return false;
    }
  }, [parentVapidKey]);

  const unsubscribeParentPush = useCallback(async (parentId: string) => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from('parent_push_subscriptions')
          .delete().eq('parent_id', parentId).eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
      setPushSubscribed(false);
      return true;
    } catch (err) {
      console.error('Push unsubscribe (ouder) mislukt:', err);
      return false;
    }
  }, []);

  return {
    canInstall,
    deferredPrompt,
    showInstallPrompt,
    pushSubscribed,
    subscribePush,
    unsubscribePush,
    subscribeParentPush,
    unsubscribeParentPush,
  };
}

// ── Helper: klopt een bestaande subscription met deze VAPID public key? ──
function matchesApplicationServerKey(sub: PushSubscription, base64PublicKey: string): boolean {
  const current = sub.options?.applicationServerKey;
  if (!current) return false;
  const expected = urlBase64ToUint8Array(base64PublicKey);
  const currentBytes = new Uint8Array(current);
  if (currentBytes.length !== expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (currentBytes[i] !== expected[i]) return false;
  }
  return true;
}

// ── Helper: VAPID key (base64url → Uint8Array) ──
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}
