import { describe, it, expect } from 'vitest';
import {
  demoPlayers,
  SKILL_KEYS,
  PERIODS,
  scoreFor,
  finalScore,
} from './demoPlayers.mjs';

/**
 * These tests document and PROVE the demo content is fully filled and actually
 * varied — the original bug was every Top Performer landing on score 52 because
 * the legacy 7-skill shape left the other 17 skills defaulting to 5.
 */

const LATEST = PERIODS[PERIODS.length - 1];

describe('demo players — full coverage', () => {
  it('has all 7 named top performers plus the demo quick-login player', () => {
    expect(demoPlayers).toHaveLength(8);
    const names = demoPlayers.map((p) => p.name);
    expect(names).toEqual([
      'Noah Bakker', 'Tijs Smit', 'Sven de Jong', 'Max Visser',
      'Sander Kuijpers', 'Boris Willems', 'Thijs Groot', 'Luca van den Berg',
    ]);
  });

  it('every player has every skill filled in every period (no 5-default leakage)', () => {
    for (const p of demoPlayers) {
      for (const period of PERIODS) {
        const ev = p.evaluations[period];
        expect(ev, `${p.name} ${period} missing`).toBeTruthy();
        for (const key of SKILL_KEYS) {
          const v = ev.skills[key];
          expect(typeof v, `${p.name}/${period}/${key} type`).toBe('number');
          expect(v, `${p.name}/${period}/${key} in 2..10`).toBeGreaterThanOrEqual(2);
          expect(v, `${p.name}/${period}/${key} in 2..10`).toBeLessThanOrEqual(10);
        }
      }
    }
  });

  it('every player has fitness + all 15 tests filled', () => {
    for (const p of demoPlayers) {
      const ev = p.evaluations[LATEST];
      expect(ev.fitness.yoyo).not.toBe('');
      expect(ev.fitness.cooper).not.toBe('');
      expect(ev.fitness.sprint).not.toBe('');
      const flat = Object.values(ev.tests).flatMap((cat) => Object.values(cat));
      expect(flat).toHaveLength(15);
      for (const val of flat) expect(String(val).length).toBeGreaterThan(0);
    }
  });

  it('every player has comments + training plan in every period', () => {
    for (const p of demoPlayers) {
      for (const period of PERIODS) {
        expect(p.evaluations[period].comments.length).toBeGreaterThan(10);
        expect(p.evaluations[period].trainingPlan.length).toBeGreaterThan(5);
        expect(p.evaluations[period].matchRating).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe('demo players — REAL variation (the point of the task)', () => {
  const scores = demoPlayers.map((p) => finalScore(p));
  const sorted = [...scores].sort((a, b) => a - b);

  it('NO player is stuck on the old placeholder 52', () => {
    expect(scores.every((s) => s !== 52)).toBe(true);
  });

  it('final scores are spread out (range > 15, not a flat line)', () => {
    const range = sorted[sorted.length - 1] - sorted[0];
    expect(range).toBeGreaterThan(15);
  });

  it('highlights distinct top vs bottom performers, not a tie', () => {
    // The screenshot showed all 52 — now the top of the leaderboard must differ
    expect(sorted[sorted.length - 1]).toBeGreaterThan(sorted[0]);
  });

  it('every player shows an upward trend across the 3 check-ins', () => {
    for (const p of demoPlayers) {
      const c1 = scoreFor(p.evaluations, PERIODS[0]);
      const c3 = scoreFor(p.evaluations, PERIODS[2]);
      expect(c3, `${p.name} should improve`).toBeGreaterThanOrEqual(c1);
    }
  });

  it('prints the leaderboard so a human can eyeball the variation', () => {
    const board = demoPlayers
      .map((p) => ({ name: p.name, score: finalScore(p) }))
      .sort((a, b) => b.score - a.score);
    console.log('\n  TOP PERFORMERS (demo):');
    board.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name.padEnd(16)} ${r.score}`);
    });
    // sanity: at least one clearly-different score exists
    expect(new Set(board.map((r) => r.score)).size).toBeGreaterThan(4);
  });
});
