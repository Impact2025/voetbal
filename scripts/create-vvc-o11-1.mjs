/**
 * Fase 2+3: Login als seed club_admin, maak club "VVC O11-1" aan,
 * koppel team VVC-O11-1 + importeer alle 8 spelers van VVCo11-1.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import crypto from 'crypto';

const env = readFileSync('.env.local', 'utf8');
const kv = {};
for (const l of env.split('\n').filter(Boolean)) { const i = l.indexOf('='); kv[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
const supabase = createClient(kv.VITE_SUPABASE_URL, kv.VITE_SUPABASE_ANON_KEY);

const NEW_TEAM_ID = 'VVC-O11-1';
const NEW_CLUB_ID = 'VVC-O11-1';
const CLUB_NAME = 'VVC O11-1';
const OLD_TEAM_ID = 'VVCo11-1';
const COACH_EMAIL = 'chat@weareimpact.nl';
const COACH_PASS = 'Skillkaart2026!';

function hashPin(pin, playerId) {
  return crypto.createHash('sha256').update(pin + playerId, 'utf8').digest('hex');
}

async function run() {
  console.log('Login als ' + COACH_EMAIL + '...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email: COACH_EMAIL, password: COACH_PASS });
  if (authErr) { console.error('Login mislukt:', authErr.message); process.exit(1); }
  console.log('Ingelogd als:', authData.user.id);
  const userId = authData.user.id;
  const accessToken = authData.session.access_token;

  const ac = createClient(kv.VITE_SUPABASE_URL, kv.VITE_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: 'Bearer ' + accessToken } },
  });

  // 1. Club aanmaken/upserten
  console.log('\nMaak club ' + NEW_CLUB_ID + ' aan...');
  const { error: clubErr } = await ac.from('clubs').upsert({ id: NEW_CLUB_ID, name: CLUB_NAME }, { onConflict: 'id' });
  if (clubErr) { console.error('Club error:', clubErr.message); process.exit(1); }
  console.log('  Club aangemaakt/upsert: OK');

  // 2. Profile coach als club_admin
  console.log('\nKoppel coach ' + userId + ' als club_admin aan ' + NEW_CLUB_ID + '...');
  const { error: pErr } = await ac.from('profiles').upsert({
    id: userId, role: 'club_admin', club_id: NEW_CLUB_ID, team_id: NEW_TEAM_ID,
  }, { onConflict: 'id' });
  if (pErr) console.warn('  Profile error:', pErr.message);
  else console.log('  Profile gekoppeld: OK');

  // 3. Nieuw team aanmaken
  console.log('\nMaak team ' + NEW_TEAM_ID + ' aan...');
  const { error: tErr } = await ac.from('teams').upsert({
    id: NEW_TEAM_ID,
    team_name: CLUB_NAME,
    coach_id: userId,
    club_id: NEW_CLUB_ID,
    team_class: 'O11-1',
    evaluation_periods: ['Check-in 1', 'Check-in 2', 'Check-in 3'],
    weekly_questions: ['Wat deed je goed in de laatste wedstrijd?', 'Wat wil je de komende week verbeteren?', 'Wat heb je gedaan om je skills thuis te oefenen?'],
    assigned_homework_ids: [],
  }, { onConflict: 'id' });
  if (tErr) { console.error('Team error:', tErr.message); process.exit(1); }
  console.log('  Team aangemaakt: OK');

  // 4. Alle spelers van VVCo11-1 ophalen
  const { data: srcPlayers, error: pe } = await ac.from('players').select('*').eq('team_id', OLD_TEAM_ID);
  if (pe) { console.error('Players select error:', pe.message); process.exit(1); }
  console.log('\n' + srcPlayers.length + ' spelers gevonden in ' + OLD_TEAM_ID + '. Importeren...');

  // 5. Kopieer elk speler
  let ok = 0, existing = 0;
  for (const p of srcPlayers) {
    const initials = (p.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()) || 'P';
    const avatar = p.avatar_url || 'https://placehold.co/128x128/1A1A1A/FFFFFF?text=' + initials;
    const newId = crypto.randomUUID();
    let pinHash = p.pin_hash;
    if (/^\d{4}$/.test(p.pin_hash || '')) {
      pinHash = hashPin(p.pin_hash, newId);
    } else if (p.pin_hash === 'pending' || !p.pin_hash) {
      pinHash = 'pending';
    }

    const { error: ie } = await ac.from('players').insert({
      id: newId,
      team_id: NEW_TEAM_ID,
      name: p.name,
      pin_hash: pinHash,
      age: p.age,
      preferred_foot: p.preferred_foot,
      position: p.position,
      avatar_url: avatar,
      evaluations: p.evaluations,
      completed_homework_ids: p.completed_homework_ids,
      weekly_question_responses: p.weekly_question_responses,
      avatar_config: p.avatar_config,
      created_at: p.created_at,
    });
    if (ie) {
      if (ie.message.includes('duplicate')) existing++;
      else console.error('  ' + p.name + ': ' + ie.message);
    } else { ok++; console.log('  \u2713 ' + p.name); }
  }

  console.log('\n=== KLAAAR ===');
  console.log('Club "VVC O11-1" (' + NEW_CLUB_ID + ') aangemaakt.');
  console.log('Team "VVC O11-1" (' + NEW_TEAM_ID + ') aangemaakt.');
  console.log('Trainer: ' + authData.user.email + ' (club_admin)');
  console.log('Spelers geïmporteerd: ' + ok + ' OK / ' + existing + ' bestond al');
}
run().catch(e => { console.error(e); process.exit(1); });
