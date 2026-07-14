// "Bouw je baller" — avatar systeem
// Single source of truth voor alle onderdelen + unlock-regels.
// Wordt gedeeld door <Avatar> (render) en <AvatarBuilder> (kiezer).

export interface AvatarConfig {
  skin: string;        // huidtint id
  hair: string;        // haarstijl id
  hairColor: string;   // haarkleur id
  background: string;  // achtergrond / kit-kleur id
  accessory: string | null; // extra id of null
}

export const DEFAULT_AVATAR: AvatarConfig = {
  skin: 'skin3',
  hair: 'short',
  hairColor: 'brown',
  background: 'neon',
  accessory: null,
};

// Speler-statistieken die unlocks bepalen.
export interface PlayerStats {
  attendanceCount: number;
  attendancePct: number | null;
  avgSkill: number;
  homeworkDone: number;
}

export interface UnlockRule {
  metric: keyof PlayerStats;
  gte: number;
  label: string; // getoond bij vergrendelde items
}

export interface AvatarOption {
  id: string;
  label: string;
  unlock?: UnlockRule;
}

// ---- Huidtinten (altijd vrij) ----
export const SKINS: { id: string; label: string; base: string; shadow: string }[] = [
  { id: 'skin1', label: 'Licht',        base: '#F8D5B4', shadow: '#EBC199' },
  { id: 'skin2', label: 'Zacht',        base: '#F0C29B', shadow: '#DDAC82' },
  { id: 'skin3', label: 'Getint',       base: '#D8A278', shadow: '#C08C63' },
  { id: 'skin4', label: 'Warm',         base: '#B87A54', shadow: '#A0663F' },
  { id: 'skin5', label: 'Bruin',        base: '#8D5524', shadow: '#734419' },
  { id: 'skin6', label: 'Diep',         base: '#5C3A1E', shadow: '#4A2E15' },
];

// ---- Haarstijlen (altijd vrij) ----
export const HAIRS: AvatarOption[] = [
  { id: 'bald',     label: 'Kaal' },
  { id: 'buzz',     label: 'Millimeter' },
  { id: 'short',    label: 'Kort' },
  { id: 'spiky',    label: 'Stekels' },
  { id: 'curly',    label: 'Krullen' },
  { id: 'afro',     label: 'Afro' },
  { id: 'ponytail', label: 'Staart' },
  { id: 'bun',      label: 'Knot' },
];

// ---- Haarkleuren ----
export const HAIR_COLORS: (AvatarOption & { value: string })[] = [
  { id: 'black',  label: 'Zwart',    value: '#2B2B2B' },
  { id: 'brown',  label: 'Bruin',    value: '#6B4423' },
  { id: 'auburn', label: 'Rossig',   value: '#A9662E' },
  { id: 'blond',  label: 'Blond',    value: '#E0C068' },
  { id: 'grey',   label: 'Grijs',    value: '#B0B0B0' },
  { id: 'neon',   label: 'Neon',     value: '#00FF9D', unlock: { metric: 'avgSkill', gte: 7, label: 'Gem. skill 7+' } },
  { id: 'blue',   label: 'IJsblauw', value: '#5AC8FA', unlock: { metric: 'homeworkDone', gte: 5, label: '5 huiswerk af' } },
];

// ---- Achtergrond / kit-kleuren ----
export const BACKGROUNDS: (AvatarOption & { from: string; to: string; jersey: string })[] = [
  { id: 'neon',    label: 'Neon',      from: '#0FA968', to: '#0B7D4D', jersey: '#0E9A5F' },
  { id: 'blue',    label: 'Blauw',     from: '#2E6BD6', to: '#1E4DA0', jersey: '#2A5FC0' },
  { id: 'red',     label: 'Rood',      from: '#E0453C', to: '#B22B24', jersey: '#D13A32' },
  { id: 'orange',  label: 'Oranje',    from: '#F59433', to: '#D9741A', jersey: '#EE8A2C' },
  { id: 'purple',  label: 'Paars',     from: '#8B5CF6', to: '#6D3EDC', jersey: '#7F51EC' },
  { id: 'cyan',    label: 'Cyaan',     from: '#22B8CF', to: '#1594A8', jersey: '#20AEC2' },
  { id: 'pink',    label: 'Roze',      from: '#EC4899', to: '#C42E76', jersey: '#E03F8C' },
  { id: 'slate',   label: 'Grafiet',   from: '#4B5563', to: '#2C333E', jersey: '#3F4753' },
  { id: 'gold',    label: 'Goud',      from: '#F5C542', to: '#D19A1C', jersey: '#ECB731',
    unlock: { metric: 'attendanceCount', gte: 10, label: '10 trainingen' } },
];

// ---- Extra's / accessoires ----
export const ACCESSORIES: AvatarOption[] = [
  { id: 'headband', label: 'Zweetband' },
  { id: 'glasses',  label: 'Bril' },
  { id: 'cap',      label: 'Pet' },
  { id: 'captain',  label: 'Aanvoerdersband', unlock: { metric: 'attendanceCount', gte: 8, label: '8 trainingen' } },
  { id: 'crown',    label: 'Kroon',           unlock: { metric: 'attendancePct', gte: 80, label: '80% aanwezig' } },
];

export function isUnlocked(rule: UnlockRule | undefined, stats: PlayerStats): boolean {
  if (!rule) return true;
  const val = stats[rule.metric];
  if (val === null || val === undefined) return false;
  return val >= rule.gte;
}

export function skinById(id: string) {
  return SKINS.find(s => s.id === id) ?? SKINS[2];
}
export function hairColorById(id: string) {
  return HAIR_COLORS.find(c => c.id === id) ?? HAIR_COLORS[1];
}
export function backgroundById(id: string) {
  return BACKGROUNDS.find(b => b.id === id) ?? BACKGROUNDS[0];
}

/** Aantal onderdelen dat de speler nog kan ontgrendelen (voor badge/teaser). */
export function lockedCount(stats: PlayerStats): number {
  const all = [...HAIR_COLORS, ...BACKGROUNDS, ...ACCESSORIES];
  return all.filter(o => o.unlock && !isUnlocked(o.unlock, stats)).length;
}
