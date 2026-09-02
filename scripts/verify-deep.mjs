/** Diepte-verificatie: volledige player records (evaluations, responses, homework)
 *  vergelijken tussen bron (VVCo11-1) en nieuw (VVC-O11-1). */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = readFileSync('.env.local', 'utf8');
const kv = {};
for (const l of env.split('\n').filter(Boolean)) { const i = l.indexOf('='); kv[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
const supabase = createClient(kv.VITE_SUPABASE_URL, kv.VITE_SUPABASE_ANON_KEY);

(async () => {
  const { data: src } = await supabase.from('players').select('*').eq('team_id', 'VVCo11-1');
  const { data: now } = await supabase.from('players').select('*').eq('team_id', 'VVC-O11-1');

  const fields = ['name','pin_hash','age','preferred_foot','position','avatar_url','evaluations','completed_homework_ids','weekly_question_responses','avatar_config'];
  // pin_hash zal verschillen (nieuwe id); alles anders moet gelijk zijn
  const cmpFields = fields.filter(f => f !== 'pin_hash' && f !== 'id' && f !== 'team_id');

  let perfect = 0;
  for (const np of now) {
    const sp = src.find(s => s.name === np.name);
    if (!sp) { console.log('ORPHAN (geen bron):', np.name); continue; }
    const diffs = cmpFields.filter(f => JSON.stringify(sp[f]) !== JSON.stringify(np[f]));
    if (diffs.length === 0) { perfect++; console.log('OK', np.name.padEnd(20)); }
    else { console.log('DIFF', np.name.padEnd(20), '->', diffs.join(', ')); }
  }
  console.log('\nPerfect overgeheveld (excl. pin_hash/id/team_id):', perfect + '/' + now.length);

  // Sample: toon volledige eval van Vincent van Munster in beide
  const sV = src.find(s => s.name === 'Vincent van Munster');
  const nV = now.find(s => s.name === 'Vincent van Munster');
  console.log('\n=== Vincent - oude weekly_reflections (evaluations Check-in 1 comments) ===');
  console.log(sV.evaluations['Check-in 1'].comments);
  console.log('=== Vincent - nieuwe ===');
  console.log(nV.evaluations['Check-in 1'].comments);
  console.log('\nweekly_reflections (full):');
  console.log(JSON.stringify(nV.evaluations['Check-in 3'].weekly_reflections));
})();
