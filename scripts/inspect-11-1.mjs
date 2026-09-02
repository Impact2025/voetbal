/**
 * Inspecteer alle trainers en leden (players) van team 11-1,
 * en dump de club/account structuur. Dit is fase 1: verzamelen.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const kv = {};
for (const l of env.split('\n').filter(Boolean)) { const i = l.indexOf('='); kv[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
const supabase = createClient(kv.VITE_SUPABASE_URL, kv.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log('=== 1. Alle teams met "11-1" in id of team_name ===');
  const { data: teams, error: te } = await supabase
    .from('teams')
    .select('id, team_name, coach_id, club_id, team_class')
    .ilike('id', '%11-1%');
  if (te) { console.error('teams error', te.message); }
  else console.log(JSON.stringify(teams, null, 2));

  console.log('\n=== 2. Alle teams (limit 50) ===');
  const { data: allTeams } = await supabase.from('teams').select('id, team_name, coach_id, club_id, team_class').limit(50);
  console.log(JSON.stringify(allTeams, null, 2));

  console.log('\n=== 3. Alle clubs (limit 30) ===');
  const { data: clubs, error: ce } = await supabase.from('clubs').select('*').limit(30);
  if (ce) console.error('clubs error', ce.message);
  else console.log(JSON.stringify(clubs, null, 2));

  console.log('\n=== 4. Alle profiles (limit 50) ===');
  const { data: profiles, error: pe } = await supabase.from('profiles').select('*').limit(50);
  if (pe) console.error('profiles error', pe.message);
  else console.log(JSON.stringify(profiles, null, 2));

  console.log('\n=== 5. Alle team_coaches (limit 50) ===');
  const { data: tcs, error: tce } = await supabase.from('team_coaches').select('*').limit(50);
  if (tce) console.error('team_coaches error', tce.message);
  else console.log(JSON.stringify(tcs, null, 2));

  // Probe: players where team_id matches anything containing 11-1
  console.log('\n=== 6. Players via RPC: zoek op team_id LIKE %11-1% ===');
  // Supabase anon kan geen ILIKE op players.team_id altijd; probeer direct
  const { data: players, error: ple } = await supabase
    .from('players')
    .select('id, name, team_id, position, age, preferred_foot, pin_hash')
    .ilike('team_id', '%11-1%');
  if (ple) console.error('players error', ple.message);
  else console.log(JSON.stringify(players, null, 2));

  // Probe: exact team_id '11-1'
  const { data: pExact } = await supabase.from('players').select('id, name, team_id, position, age').eq('team_id', '11-1');
  console.log('\n=== 7. Players exact team_id=11-1 ===', JSON.stringify(pExact));

  // Probe: exact team_id 'VVC11-1'
  const { data: pVvc } = await supabase.from('players').select('id, name, team_id, position, age').eq('team_id', 'VVC11-1');
  console.log('\n=== 8. Players exact team_id=VVC11-1 ===', JSON.stringify(pVvc));
}
run().catch(e => { console.error(e); process.exit(1); });
