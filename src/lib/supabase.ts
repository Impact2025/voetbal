import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase omgevingsvariabelen ontbreken. Controleer je .env.local bestand.');
}

// Clear stale auth tokens before Supabase initializes so it won't attempt
// a token refresh that returns 400 and logs AuthApiError on every page load.
try {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      const stored = JSON.parse(localStorage.getItem(key) || 'null');
      const expiredLocally = stored?.expires_at && Date.now() / 1000 > stored.expires_at;
      // Also clear if the stored project URL doesn't match the current env
      const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
      const wrongProject = !key.includes(projectRef);
      if (expiredLocally || wrongProject) localStorage.removeItem(key);
    }
  }
} catch { /* ignore */ }

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
