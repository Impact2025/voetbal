import type { CardTier } from '../types';

export interface TierConfig {
  label: string;
  color: string;
  bgFrom: string;
  bgTo: string;
  glow: string;
  xpMin: number;
  xpMax: number;
}

export const TIER_CONFIG: Record<CardTier, TierConfig> = {
  brons: {
    label: 'Brons',
    color: '#CD7F32',
    bgFrom: '#1c0f00',
    bgTo: '#3d1f00',
    glow: '#CD7F3240',
    xpMin: 0,
    xpMax: 99,
  },
  zilver: {
    label: 'Zilver',
    color: '#C0C0C0',
    bgFrom: '#0f1117',
    bgTo: '#1f2937',
    glow: '#C0C0C040',
    xpMin: 100,
    xpMax: 299,
  },
  goud: {
    label: 'Goud',
    color: '#FFD700',
    bgFrom: '#1a1000',
    bgTo: '#3d2e00',
    glow: '#FFD70050',
    xpMin: 300,
    xpMax: 599,
  },
  legendary: {
    label: 'Legendary',
    color: '#c084fc',
    bgFrom: '#0d0019',
    bgTo: '#2e0a4a',
    glow: '#a855f760',
    xpMin: 600,
    xpMax: Infinity,
  },
};

export function computeTier(totalXP: number): CardTier {
  if (totalXP >= 600) return 'legendary';
  if (totalXP >= 300) return 'goud';
  if (totalXP >= 100) return 'zilver';
  return 'brons';
}

export function nextTierXP(tier: CardTier): number {
  const next: Record<CardTier, number> = {
    brons: 100, zilver: 300, goud: 600, legendary: Infinity,
  };
  return next[tier];
}

export function tierProgress(totalXP: number, tier: CardTier): number {
  const cfg = TIER_CONFIG[tier];
  if (tier === 'legendary') return 100;
  const range = cfg.xpMax - cfg.xpMin + 1;
  return Math.min(100, Math.round(((totalXP - cfg.xpMin) / range) * 100));
}
