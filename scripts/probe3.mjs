import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = readFileSync('.env.local','utf8');
const kv = {};
for (const l of env.split('\n').filter(Boolean)) { const i = l.indexOf('='); kv[l.slice(0,i).trim()] = l.slice(i+1).trim(); }
const supabase = createClient(kv['VITE_SUPABASE_URL'], kv['VITE_SUPABASE_ANON_KEY']);

const NAMES = ['Noah Bakker','Tijs Smit','Sven de Jong','Max Visser','Sander Kuijpers','Boris Willems','Thijs Groot'];
const { data, error } = await supabase.from('players').select('*').in('name', NAMES);
console.log('error', error && error.message);
console.log('found', data?.length, 'of', NAMES.length);
for (const p of (data||[])) {
  console.log('\n===', p.name, '|', p.position, '| age', p.age, '| foot', p.preferred_foot, '| team', p.team_id);
  console.log('  evals periods:', Object.keys(p.evaluations||{}));
  const first = p.evaluations && Object.values(p.evaluations)[0];
  if (first) {
    console.log('  first.skills keys:', Object.keys(first.skills||{}).length, '->', JSON.stringify(first.skills));
    console.log('  first.fitness:', JSON.stringify(first.fitness));
    console.log('  first.tests:', JSON.stringify(first.tests));
    console.log('  first.matchRating:', first.matchRating, '| comments:', (first.comments||'').slice(0,40));
  }
  console.log('  completed_hw:', p.completed_homework_ids, '| weekly_q:', (p.weekly_question_responses||[]).length);
}
