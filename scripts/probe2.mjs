import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = readFileSync('.env.local','utf8');
const lines = env.split('\n').filter(Boolean);
const kv = {};
for (const l of lines) { const i = l.indexOf('='); kv[l.slice(0,i).trim()] = l.slice(i+1).trim(); }
const url = kv['VITE_SUPABASE_URL'];
const key = kv['VITE_SUPABASE_ANON_KEY'];
console.log('url:', url, '| keylen:', (key||'').length);
const supabase = createClient(url, key);
const { data, error } = await supabase.from('players').select('id,name,team_id,position').limit(3);
console.log('err:', error && (error.code+' '+error.message));
console.log('data:', data && data.map(d=>`${d.name} (${d.position}) @${d.team_id}`));
