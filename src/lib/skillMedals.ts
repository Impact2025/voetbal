export type SkillMedalTier = 'goud' | 'zilver' | 'brons';

export interface SkillMedalConfig {
  label: string;
  youngLabel: string;
  emoji: string;
  color: string;
}

export const SKILL_MEDAL_CONFIG: Record<SkillMedalTier, SkillMedalConfig> = {
  goud: { label: 'Goud', youngLabel: 'Grote sprong!', emoji: '🥇', color: '#FFD700' },
  zilver: { label: 'Zilver', youngLabel: 'Mooie groei!', emoji: '🥈', color: '#C0C0C0' },
  brons: { label: 'Brons', youngLabel: 'Je groeit!', emoji: '🥉', color: '#CD7F32' },
};

export interface SkillMedalResult {
  tier: SkillMedalTier | null;
  delta: number | null;
}

const GOUD_THRESHOLD = 1.5;
const ZILVER_THRESHOLD = 0.5;

/**
 * Medailles belonen groei t.o.v. de vorige check-in, nooit het absolute niveau —
 * zo blijft een van nature zwakkere skill net zo goed medaille-waardig als een sterke.
 */
export function computeSkillMedal(current: number, previous: number | undefined): SkillMedalResult {
  if (previous === undefined) return { tier: null, delta: null };

  const delta = Math.round((current - previous) * 10) / 10;
  if (delta >= GOUD_THRESHOLD) return { tier: 'goud', delta };
  if (delta >= ZILVER_THRESHOLD) return { tier: 'zilver', delta };
  if (delta > 0) return { tier: 'brons', delta };
  return { tier: null, delta };
}

export interface BiggestGrowth {
  key: string;
  tier: SkillMedalTier;
  delta: number;
}

/** Vindt de skill met de grootste groei-medaille, voor een 'één groeipunt per keer'-highlight. */
export function findBiggestGrowth(
  skillKeys: string[],
  currentSkills: Record<string, number>,
  previousSkills: Record<string, number> | undefined
): BiggestGrowth | null {
  if (!previousSkills) return null;

  let best: BiggestGrowth | null = null;
  for (const key of skillKeys) {
    const { tier, delta } = computeSkillMedal(currentSkills[key] ?? 5, previousSkills[key]);
    if (tier && delta !== null && (!best || delta > best.delta)) {
      best = { key, tier, delta };
    }
  }
  return best;
}
