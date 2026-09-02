/** Verifieer: VVC O11-1 account compleet aanwezig. */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = readFileSync('.env.local', 'utf8');
const kv = {};
for (const l of env.split('\n').filter(Boolean)) { const i = l.indexOf('='); kv[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
const supabase = createClient(kv.VITE_SUPABASE_URL, kv.VITE_SUPABASE_ANON_KEY);

(async () => {
  console.log('=== CLUB ===');
  const { data: club } = await supabase.from('clubs').select('*').eq('id', 'VVC-O11-1');
  console.log(JSON.stringify(club));

  console.log('\n=== TEAM ===');
  const { data: team } = await supabase.from('teams').select('*').eq('id', 'VVC-O11-1');
  console.log(JSON.stringify(team));

  console.log('\n=== TRAINER (coach_id owner profile) ===');
  const coachId = team?.[0]?.coach_id;
  const { data: coach } = await supabase.from('profiles').select('*').eq('id', coachId || '');
  console.log(JSON.stringify(coach));

  console.log('\n=== SPELERS (players) van VVC-O11-1 ===');
  const { data: players } = await supabase.from('players').select('id, name, pin_hash, team_id, position, age, preferred_foot, avatar_url').eq('team_id', 'VVC-O11-1');
  console.log(JSON.stringify(players, null, 2));
  console.log('\nAantal spelers:', players?.length);

  console.log('\n=== CONTROLE: oude VVCo11-1 nog intact? ===');
  const { data: old } = await supabase.from('players').select('name,team_id').eq('team_id', 'VVCo11-1');
  console.log('Oude spelers VVCo11-1 nog aanwezig:', old?.length);
})();
