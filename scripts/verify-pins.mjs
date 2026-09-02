/** Verifieer dat de PIN hashing klopt voor alle 8 geïmporteerde spelers. */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import crypto from 'crypto';
const env = readFileSync('.env.local', 'utf8');
const kv = {};
for (const l of env.split('\n').filter(Boolean)) { const i = l.indexOf('='); kv[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
const supabase = createClient(kv.VITE_SUPABASE_URL, kv.VITE_SUPABASE_ANON_KEY);

// Bekende PINs uit VVCo11-1 bron (plaintext), in volgorde van inspect output
const knownPins = {
  'Ronaldo': '8891',
  'Van Basten': '5921',
  'Max verstappen': '2648',
  'Elvis Presley': '5095',
  'Messi': '6541',
  'Naam jouw speler': '5692',
  'Ben van Munster': '3330',
  'Vincent van Munster': '8773',
};
function hashPin(pin, playerId) { return crypto.createHash('sha256').update(pin + playerId, 'utf8').digest('hex'); }

(async () => {
  const { data: players } = await supabase.from('players').select('id, name, pin_hash').eq('team_id', 'VVC-O11-1');
  console.log('Spelers in VVC-O11-1:', players.length);
  let ok = 0;
  for (const p of players) {
    const pin = knownPins[p.name];
    const expected = hashPin(pin, p.id);
    const match = p.pin_hash === expected;
    if (match) ok++;
    console.log(p.name.padEnd(20), pin ? pin.padEnd(6) : '??', match ? 'OK' : 'MISMATCH ('+p.id.slice(0,6)+')');
  }
  console.log('\n' + ok + '/' + players.length + ' PINs correct gehasht');
})();
