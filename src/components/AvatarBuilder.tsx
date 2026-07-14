import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Lock, Shuffle, Loader2 } from 'lucide-react';
import AvatarArt from './AvatarArt';
import { COACH_COLOR } from '../utils/constants';
import {
  type AvatarConfig,
  type PlayerStats,
  type UnlockRule,
  SKINS, HAIRS, HAIR_COLORS, BACKGROUNDS, ACCESSORIES,
  isUnlocked, unlockProgress,
} from '../lib/avatar/catalog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initial: AvatarConfig;
  name: string;
  stats: PlayerStats;
  onSave: (config: AvatarConfig) => Promise<void>;
}

type Tab = 'baller' | 'kleur' | 'extras';

const TABS: { id: Tab; label: string }[] = [
  { id: 'baller', label: 'Baller' },
  { id: 'kleur', label: 'Kleur' },
  { id: 'extras', label: "Extra's" },
];

export default function AvatarBuilder({ isOpen, onClose, initial, name, stats, onSave }: Props) {
  const [config, setConfig] = useState<AvatarConfig>(initial);
  const [tab, setTab] = useState<Tab>('baller');
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const set = (patch: Partial<AvatarConfig>) => setConfig(c => ({ ...c, ...patch }));

  const tryLocked = (rule: UnlockRule) => {
    const p = unlockProgress(rule, stats);
    setHint(`🔒 ${p.current}/${p.target} — ${rule.label}`);
    window.setTimeout(() => setHint(null), 2400);
  };

  const randomize = () => {
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    set({
      skin: pick(SKINS).id,
      hair: pick(HAIRS).id,
      hairColor: pick(HAIR_COLORS.filter(c => isUnlocked(c.unlock, stats))).id,
      background: pick(BACKGROUNDS.filter(b => isUnlocked(b.unlock, stats))).id,
      accessory: Math.random() > 0.4 ? pick(ACCESSORIES.filter(a => isUnlocked(a.unlock, stats))).id : null,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[80] bg-white flex flex-col"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
            <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors">
              <X size={18} />
            </button>
            <h2 className="text-base font-black text-gray-900">Bouw je baller</h2>
            <button onClick={randomize} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors" style={{ color: COACH_COLOR }} title="Verras me">
              <Shuffle size={18} />
            </button>
          </div>

          {/* Live preview */}
          <div className="flex flex-col items-center pt-2 pb-4">
            <motion.div
              key={JSON.stringify(config)}
              initial={{ scale: 0.94 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-36 h-36 rounded-3xl overflow-hidden"
              style={{ border: `2px solid ${COACH_COLOR}40`, boxShadow: `0 10px 40px ${COACH_COLOR}22` }}
            >
              <AvatarArt config={config} className="w-full h-full" />
            </motion.div>
            <p className="text-sm text-gray-600 mt-3 font-semibold">{name}</p>
            <AnimatePresence>
              {hint && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-200 rounded-full px-3 py-1"
                >
                  {hint}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-4 mb-3">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  backgroundColor: tab === t.id ? COACH_COLOR : '#f3f4f6',
                  color: tab === t.id ? '#ffffff' : '#6b7280',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Options */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-6">
            {tab === 'baller' && (
              <>
                <Section title="Huidtint">
                  <div className="grid grid-cols-6 gap-2.5">
                    {SKINS.map(s => (
                      <SwatchButton key={s.id} selected={config.skin === s.id} onClick={() => set({ skin: s.id })} color={s.base} />
                    ))}
                  </div>
                </Section>

                <Section title="Haarstijl">
                  <div className="grid grid-cols-4 gap-2.5">
                    {HAIRS.map(h => (
                      <PreviewTile
                        key={h.id}
                        label={h.label}
                        selected={config.hair === h.id}
                        onClick={() => set({ hair: h.id })}
                        config={{ ...config, hair: h.id, accessory: null }}
                      />
                    ))}
                  </div>
                </Section>

                <Section title="Haarkleur">
                  <div className="grid grid-cols-7 gap-2.5">
                    {HAIR_COLORS.map(c => {
                      const unlocked = isUnlocked(c.unlock, stats);
                      return (
                        <SwatchButton
                          key={c.id}
                          selected={config.hairColor === c.id}
                          locked={!unlocked}
                          progress={!unlocked ? unlockProgress(c.unlock!, stats).pct : undefined}
                          onClick={() => unlocked ? set({ hairColor: c.id }) : tryLocked(c.unlock!)}
                          color={c.value}
                        />
                      );
                    })}
                  </div>
                </Section>
              </>
            )}

            {tab === 'kleur' && (
              <Section title="Kit-kleur">
                <div className="grid grid-cols-3 gap-3">
                  {BACKGROUNDS.map(b => {
                    const unlocked = isUnlocked(b.unlock, stats);
                    return (
                      <PreviewTile
                        key={b.id}
                        label={b.label}
                        selected={config.background === b.id}
                        locked={!unlocked}
                        lockLabel={b.unlock?.label}
                        progress={!unlocked ? unlockProgress(b.unlock!, stats) : undefined}
                        onClick={() => unlocked ? set({ background: b.id }) : tryLocked(b.unlock!)}
                        config={{ ...config, background: b.id }}
                        big
                      />
                    );
                  })}
                </div>
              </Section>
            )}

            {tab === 'extras' && (
              <Section title="Accessoires">
                <div className="grid grid-cols-3 gap-3">
                  <PreviewTile
                    label="Geen"
                    selected={config.accessory === null}
                    onClick={() => set({ accessory: null })}
                    config={{ ...config, accessory: null }}
                    big
                  />
                  {ACCESSORIES.map(a => {
                    const unlocked = isUnlocked(a.unlock, stats);
                    return (
                      <PreviewTile
                        key={a.id}
                        label={a.label}
                        selected={config.accessory === a.id}
                        locked={!unlocked}
                        lockLabel={a.unlock?.label}
                        progress={!unlocked ? unlockProgress(a.unlock!, stats) : undefined}
                        onClick={() => unlocked ? set({ accessory: a.id }) : tryLocked(a.unlock!)}
                        config={{ ...config, accessory: a.id }}
                        big
                      />
                    );
                  })}
                </div>
              </Section>
            )}
          </div>

          {/* Save */}
          <div className="px-4 pb-4 pt-3 border-t border-gray-100" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
              style={{ backgroundColor: COACH_COLOR }}
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
              Opslaan
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function SwatchButton({ selected, locked, progress, color, onClick }: { selected: boolean; locked?: boolean; progress?: number; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative aspect-square rounded-full transition-all active:scale-90"
      style={{
        backgroundColor: color,
        boxShadow: selected ? `0 0 0 3px #fff, 0 0 0 5px ${COACH_COLOR}` : '0 0 0 2px rgba(0,0,0,0.08)',
      }}
    >
      {locked && (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
          <Lock size={11} className="text-white" />
          {progress !== undefined && progress > 0 && (
            <span className="absolute -bottom-0.5 inset-x-1 h-1 rounded-full bg-white/30 overflow-hidden">
              <span className="block h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
            </span>
          )}
        </span>
      )}
      {selected && !locked && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Check size={14} className="text-white drop-shadow" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

function PreviewTile({
  label, selected, locked, lockLabel, progress, config, onClick, big,
}: {
  label: string;
  selected: boolean;
  locked?: boolean;
  lockLabel?: string;
  progress?: { current: number; target: number; pct: number };
  config: AvatarConfig;
  onClick: () => void;
  big?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all active:scale-95"
      style={{
        backgroundColor: selected ? `${COACH_COLOR}12` : '#f9fafb',
        boxShadow: selected ? `inset 0 0 0 1.5px ${COACH_COLOR}` : 'inset 0 0 0 1px rgba(0,0,0,0.05)',
      }}
    >
      <div className={`${big ? 'w-16 h-16' : 'w-12 h-12'} rounded-xl overflow-hidden`}>
        <AvatarArt config={config} className="w-full h-full" />
      </div>
      <span className="text-[10px] font-semibold text-gray-600 leading-tight text-center">{label}</span>
      {locked && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/75 backdrop-blur-[1px]">
          <Lock size={14} className="text-amber-500" />
          {progress && (
            <>
              <span className="text-[9px] text-amber-700 font-black">{progress.current}/{progress.target}</span>
              <span className="w-10 h-1 rounded-full bg-amber-200 overflow-hidden">
                <span className="block h-full rounded-full bg-amber-500" style={{ width: `${progress.pct}%` }} />
              </span>
            </>
          )}
          {lockLabel && <span className="text-[8px] text-amber-600 font-bold px-1 text-center leading-tight">{lockLabel}</span>}
        </span>
      )}
    </button>
  );
}
