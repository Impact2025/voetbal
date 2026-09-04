/**
 * Convenience runner: upload t via Supabase admin (service-role).
 * Kopieer de productie secrets uit Vercel → lokale omgeving (tijdelijk!), dan:
 *   node scripts/run-upload-lmove.mjs
 *
 * Vereist: node_modules/@supabase/supabase-js (al geïnstalleerd in player-hub).
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const env = {
  ...process.env,
  // Deze overrides zet je zelf even tijdelijk (of exporteer ze in je shell):
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://jouw-project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  VIDEO_PATH: process.env.VIDEO_PATH || 'C:/Users/v_mun/Downloads/L Move (O12).mp4',
};

if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Zet SUPABASE_SERVICE_ROLE_KEY in je omgeving (Vercel → env → copy).');
  console.error('   Dan: node scripts/run-upload-lmove.mjs');
  process.exit(1);
}

const result = spawnSync('node', ['scripts/upload-lmove-homework.mjs'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  env,
});

process.exitCode = result.status ?? 1;
