import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wand2, Loader2, ChevronLeft, Save, Users, Clock, Target, CheckCircle2 } from 'lucide-react';
import type { StructuredTrainingPlan, TeamSession } from '../../types';
import { generateTeamSession } from '../../lib/trainingAI';
import TrainingPlanCard from './TrainingPlanCard';
import { NEON_COLOR, AGE_GROUPS, SESSION_DURATIONS, TRAINING_THEMES } from '../../utils/constants';

interface TeamSessionModalProps {
  isVisible: boolean;
  teamId: string;
  onClose: () => void;
  onSave: (session: TeamSession) => void;
}

type Step = 'config' | 'generating' | 'result';

export default function TeamSessionModal({ isVisible, teamId, onClose, onSave }: TeamSessionModalProps) {
  const [step, setStep] = useState<Step>('config');
  const [theme, setTheme] = useState('');
  const [ageGroup, setAgeGroup] = useState('U12');
  const [duration, setDuration] = useState(75);
  const [generatedPlan, setGeneratedPlan] = useState<StructuredTrainingPlan | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    if (!theme) { setError('Kies eerst een thema.'); return; }
    setError('');
    setStep('generating');
    const plan = await generateTeamSession(theme, ageGroup, duration);
    if (plan) {
      setGeneratedPlan(plan);
      setStep('result');
    } else {
      setError('Genereren mislukt. Controleer je API-sleutel en probeer opnieuw.');
      setStep('config');
    }
  };

  const handleSave = () => {
    if (!generatedPlan) return;
    const session: TeamSession = {
      id: crypto.randomUUID(),
      team_id: teamId,
      title: generatedPlan.focus_theme,
      plan: generatedPlan,
      created_at: new Date().toISOString(),
    };
    onSave(session);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setStep('config');
    setGeneratedPlan(null);
    setSaved(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 16 }}
          className="bg-[#0D1117] border border-white/[0.08] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              {step === 'result' && (
                <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 mr-1">
                  <ChevronLeft size={16} />
                </button>
              )}
              <Users size={18} style={{ color: NEON_COLOR }} />
              <h2 className="font-black text-white">Teamsessie Generator</h2>
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-500">
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">

              {/* ── CONFIG ── */}
              {step === 'config' && (
                <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-6">

                  {/* Theme grid */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                      <Target size={11} /> Trainingsthema
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TRAINING_THEMES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => { setTheme(t.id); setError(''); }}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all border ${
                            theme === t.id
                              ? 'border-[#00FF9D] text-white bg-[#00FF9D]/10'
                              : 'border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200 bg-gray-900/60'
                          }`}
                        >
                          <span className="text-base">{t.emoji}</span>
                          <span className="truncate">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age + Duration row */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                        <Users size={11} /> Leeftijdsgroep
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {AGE_GROUPS.map(ag => (
                          <button
                            key={ag}
                            onClick={() => setAgeGroup(ag)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${
                              ageGroup === ag
                                ? 'border-[#00FF9D] text-white bg-[#00FF9D]/10'
                                : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {ag}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                        <Clock size={11} /> Duur
                      </label>
                      <div className="flex gap-2">
                        {SESSION_DURATIONS.map(d => (
                          <button
                            key={d}
                            onClick={() => setDuration(d)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all border ${
                              duration === d
                                ? 'border-[#00FF9D] text-white bg-[#00FF9D]/10'
                                : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {d}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">{error}</p>}
                </motion.div>
              )}

              {/* ── GENERATING ── */}
              {step === 'generating' && (
                <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24 gap-5">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-[#00FF9D]/20 flex items-center justify-center">
                      <Loader2 size={28} style={{ color: NEON_COLOR }} className="animate-spin" />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-[#00FF9D]/40"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-white">Sessie wordt gegenereerd...</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {TRAINING_THEMES.find(t => t.id === theme)?.label} · {ageGroup} · {duration} min
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── RESULT ── */}
              {step === 'result' && generatedPlan && (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5">
                  <TrainingPlanCard plan={generatedPlan} />
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-5 py-4 border-t border-white/[0.06] flex items-center gap-3">
            {step === 'config' && (
              <>
                <button onClick={handleClose} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border border-gray-700">
                  Annuleren
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!theme}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-black text-black disabled:opacity-40 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: NEON_COLOR }}
                >
                  <Wand2 size={15} /> Genereer Sessie
                </button>
              </>
            )}
            {step === 'result' && (
              <>
                <button onClick={handleReset} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border border-gray-700">
                  Nieuwe Sessie
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-black text-black hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: NEON_COLOR }}
                >
                  {saved
                    ? <><CheckCircle2 size={15} /> Opgeslagen!</>
                    : <><Save size={15} /> Sessie Opslaan</>
                  }
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
