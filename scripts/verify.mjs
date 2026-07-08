import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = readFileSync('.env.local','utf8');
const kv = {};
for (const l of env.split('\n').filter(Boolean)) { const i = l.indexOf('='); kv[l.slice(0,i).trim()] = l.slice(i+1).trim(); }
const supabase = createClient(kv['VITE_SUPABASE_URL'], kv['VITE_SUPABASE_ANON_KEY']);

const NAMES = ['Noah Bakker','Tijs Smit','Sven de Jong','Max Visser','Sander Kuijpers','Boris Willems','Thijs Groot'];
const { data, error } = await supabase.from('players').select('name,position,team_id,evaluations').in('name', NAMES);
if (error) { console.error(error.message); process.exit(1); }

// Replicate the dashboard's score calc (17 skills, latest period, *10)
const PERIOD = 'Check-in 3';
const SKILLS = ['rechterbeen','linkerbeen','aannemen','passen','passeerbewegingen','scoren','aanvallend_1v1','verdedigend_1v1','snelheid','wendbaarheid','duelkracht','trainingsmentaliteit','wedstrijdmentaliteit','leiderschap','concentratie','discipline','aanwezigheid'];

const board = (data||[]).map(p => {
  const ev = p.evaluations[PERIOD];
  const skillCount = Object.keys(ev.skills).length;
  const avg = SKILLS.reduce((s,k)=>s+(ev.skills[k]??5),0)/SKILLS.length;
  const tests = Object.values(ev.tests).flatMap(c=>Object.values(c)).filter(v=>String(v).length>0).length;
  return { name:p.name, score:Math.round(avg*10), skillCount, tests, fitnessFilled: !!(ev.fitness.yoyo&&ev.fitness.cooper&&ev.fitness.sprint) };
}).sort((a,b)=>b.score-a.score);

console.log('Live DB — Top Performers now:\n');
for (const r of board) {
  console.log(`${r.name.padEnd(16)} score=${r.score} | skills=${r.skillCount}/17 | tests=${r.tests}/15 | fitness=${r.fitnessFilled?'Y':'N'}`);
}
const scores = board.map(r=>r.score);
console.log(`\nRange: ${Math.min(...scores)}–${Math.max(...scores)} (spread ${Math.max(...scores)-Math.min(...scores)})`);
console.log('All 52?', scores.every(s=>s!==52));
