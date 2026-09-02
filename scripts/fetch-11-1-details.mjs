/**
 * Fase 1b: Haal ALLE details van de trainer en leden van VVCo11-1.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const kv = {};
for (const l of env.split('\n').filter(Boolean)) { const i = l.indexOf('='); kv[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }

const supabase = createClient(kv.VITE_SUPABASE_URL, kv.VITE_SUPABASE_ANON_KEY);
const TEAM_ID = 'VVCo11-1';

async function run() {
  // Trainer = profile met id = teams.coach_id
  console.log('=== TRAINER (coach_id = 7cfbea0a...) ===');
  const { data: coach, error: ce } = await supabase
    .from('profiles').select('*')
    .eq('id', '7cfbea0a-816b-4019-a183-c2bd4b918d8c');
  if (ce) console.error('coach err', ce.message); else console.log(JSON.stringify(coach, null, 2));

  console.log('\n=== ALLE profiles met team_id of club_id gerelATE ===');
  const { data: allP } = await supabase.from('profiles').select('*');
  console.log(JSON.stringify(allP, null, 2));

  console.log('\n=== ALLE players (selectie) voor VVCo11-1 ===');
  const { data: playersFull, error: pe } = await supabase
    .from('players').select('*')
    .eq('team_id', TEAM_ID);
  if (pe) console.error('players err', pe.message); else console.log(JSON.stringify(playersFull, null, 2));

  console.log('\n=== ALLE clubs ===');
  const { data: clubs } = await supabase.from('clubs').select('*');
  console.log(JSON.stringify(clubs, null, 2));
}
run().catch(e => { console.error(e); process.exit(1); });
