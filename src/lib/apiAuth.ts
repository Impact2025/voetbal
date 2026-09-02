// Gedeelde identiteits-headers voor serverless endpoints onder /api/*.
// Coach/club_admin/ouder hebben een Supabase-sessie (Bearer-token); spelers
// loggen in met PIN en hebben geen sessie — hun speler-uuid (X-Player-Id)
// fungeert als capability-token, zie api/_lib/authn.ts verifyPlayerId().
import { supabase } from './supabase';

export async function authHeaders(): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return { Authorization: `Bearer ${session.access_token}` };
  } catch { /* geen Supabase-sessie — mogelijk speler-login */ }
  try {
    const raw = localStorage.getItem('playerSession');
    if (raw) {
      const parsed = JSON.parse(raw) as { uid?: string };
      if (parsed.uid) return { 'X-Player-Id': parsed.uid };
    }
  } catch { /* corrupte sessie negeren */ }
  return {};
}
