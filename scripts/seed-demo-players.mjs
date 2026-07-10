/**
 * Seed the 7 Top Performers with full demo content (all 17 skills × 3 periods +
 * fitness + 15 tests + comments + plans + match ratings), replacing the legacy
 * 7-skill placeholder rows that collapsed every player to score 52.
 *
 * Uses the same source-of-truth data as src/demo/demoPlayers.mjs.
 *
 * Run:  node scripts/seed-demo-players.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { demoPlayers, finalScore } from '../src/demo/demoPlayers.mjs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const kv = {};
for (const l of env.split('\n').filter(Boolean)) { const i = l.indexOf('='); kv[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
const supabase = createClient(kv['VITE_SUPABASE_URL'], kv['VITE_SUPABASE_ANON_KEY']);

async function main() {
  const names = demoPlayers.map((p) => p.name);
  const { data: existing, error } = await supabase
    .from('players')
    .select('id, name, evaluations')
    .in('name', names);
  if (error) { console.error('Lookup failed:', error.message); process.exit(1); }

  const byName = new Map((existing || []).map((p) => [p.name, p]));
  let updated = 0, skipped = 0;

  for (const player of demoPlayers) {
    const row = byName.get(player.name);
    if (!row) { console.log(`  ⚠️  ${player.name} niet gevonden in DB — skip`); skipped++; continue; }

    // Behoud een eventueel al gegenereerd AI-trainingsplan (structuredPlan) per periode —
    // deze demo-content overschrijft alleen skills/comments/fitness/tests.
    const mergedEvaluations = {};
    for (const period of Object.keys(player.evaluations)) {
      const preservedPlan = row.evaluations?.[period]?.structuredPlan;
      mergedEvaluations[period] = preservedPlan
        ? { ...player.evaluations[period], structuredPlan: preservedPlan }
        : player.evaluations[period];
    }

    const { error: upErr } = await supabase
      .from('players')
      .update({ evaluations: mergedEvaluations })
      .eq('id', row.id);
    if (upErr) { console.warn(`  ✗ ${player.name}:`, upErr.message); continue; }
    console.log(`  ✅ ${player.name.padEnd(16)} score ${finalScore(player)}  [${player.position} · ${player.team_id}]`);
    updated++;
  }

  console.log(`\n${'═'.repeat(50)}\n🎉 Demo content klaar: ${updated} spelers bijgewerkt, ${skipped} overgeslagen.`);
  console.log('Ververs de Club Admin → "Top Performers" om de variatie te zien (62 → 85).');
}

main().catch((e) => { console.error(e); process.exit(1); });
