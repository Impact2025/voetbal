import { describe, it, expect } from 'vitest';
import { skillKeys, evaluationPeriods, createInitialEvaluations, NEON_COLOR } from './constants';

describe('constants', () => {
  it('skillKeys has 7 entries', () => {
    expect(skillKeys).toHaveLength(7);
  });

  it('evaluationPeriods has entries', () => {
    expect(evaluationPeriods.length).toBeGreaterThan(0);
  });

  it('NEON_COLOR is a valid hex color', () => {
    expect(NEON_COLOR).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe('createInitialEvaluations', () => {
  it('creates an entry for every evaluation period', () => {
    const evaluations = createInitialEvaluations();
    for (const period of evaluationPeriods) {
      expect(evaluations).toHaveProperty(period);
    }
  });

  it('each period has all skill keys initialized to 5', () => {
    const evaluations = createInitialEvaluations();
    for (const period of evaluationPeriods) {
      for (const key of skillKeys) {
        expect(evaluations[period].skills[key]).toBe(5);
      }
    }
  });

  it('each period has matchRating of 5', () => {
    const evaluations = createInitialEvaluations();
    for (const period of evaluationPeriods) {
      expect(evaluations[period].matchRating).toBe(5);
    }
  });
});
