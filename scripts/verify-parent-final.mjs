import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envRaw = readFileSync('D:/apps/Voetbal/player-hub/.env.local', 'utf8');
const kv = {};
for (const l of envRaw.split('\n').filter(Boolean)) { const i = l.indexOf('='); kv[l.slice(0,i).trim()] = l.slice(i+1).trim(); }
const supabase = createClient(kv.VITE_SUPABASE_URL, kv.VITE_SUPABASE_ANON_KEY);

(async () => {
  const NEW_EMAIL = 'weareimpactnl@gmail.com';
  const OLD_EMAIL = 'v.munster@weareimpact.nl';
  const PLAYER_ID = 'dfa9df53-0eef-484d-9c84-ad681390908c';
  const PARENT_ID = '7cfbea0a-816b-4019-a183-c2bd4b918d8c';

  console.log('=== 1. PROFILES — nieuwe email ===');
  const { data: pNew, error: e1 } = await supabase
    .from('profiles').select('*').eq('email', NEW_EMAIL);
  console.log(JSON.stringify(pNew), e1 ? ('ERR: '+e1.message) : '');

  console.log('\n=== 2. PROFILES — oude email (moet leeg zijn) ===');
  const { data: pOld } = await supabase
    .from('profiles').select('email').eq('email', OLD_EMAIL);
  console.log(JSON.stringify(pOld));

  console.log('\n=== 3. PARENT_LINKS voor Alex ===');
  const { data: links } = await supabase
    .from('parent_links').select('*').eq('player_id', PLAYER_ID);
  console.log(JSON.stringify(links, null, 2));

  console.log('\n=== 4. PARENT_LINK (verified, met ouder) ===');
  const { data: vlink } = await supabase
    .from('parent_links').select('*, profiles(id,email,role)')
    .eq('player_id', PLAYER_ID).eq('verified', true);
  console.log(JSON.stringify(vlink, null, 2));

  console.log('\n=== 5. notification_prefs ===');
  const { data: notif } = await supabase
    .from('notification_prefs').select('*').eq('parent_id', PARENT_ID);
  console.log(JSON.stringify(notif, null, 2));

  console.log('\n=== 6. Speler Alex (confirm team_id) ===');
  const { data: player } = await supabase
    .from('players').select('id, name, team_id').eq('id', PLAYER_ID).single();
  console.log(JSON.stringify(player));
})();
