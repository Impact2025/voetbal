import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { NEON_COLOR } from '../utils/constants';

interface Step {
  title: string;
  body: string;
  // 'center' = modal in het midden, 'above-nav' = boven de bottom nav met pijl
  position: 'center' | 'above-nav';
  // arrowOffset: % van links (alleen bij above-nav)
  arrowOffset?: number;
}

const COACH_STEPS: Step[] = [
  {
    title: 'Welkom bij Skillkaart!',
    body: 'Als coach beheer je hier jouw team. Je kunt spelers toevoegen, evaluaties bijhouden en huiswerk toewijzen. We laten je even snel zien hoe het werkt.',
    position: 'center',
  },
  {
    title: 'Team Overzicht',
    body: 'Hier zie je de statistieken van je hele team: gemiddelde skills, radar-grafiek en een ranglijst van je spelers.',
    position: 'above-nav',
    arrowOffset: 17,
  },
  {
    title: 'Spelersbeheer',
    body: 'Selecteer een speler om zijn evaluatie in te vullen. Gebruik de sliders voor skills, geef een wedstrijdcijfer en laat AI een trainingsplan genereren.',
    position: 'above-nav',
    arrowOffset: 50,
  },
  {
    title: 'Menu',
    body: 'Via het menu rechtsboven voeg je spelers toe, beheer je huiswerk en pas je het teamprofiel aan. Deel de Team ID met je spelers zodat zij kunnen inloggen.',
    position: 'center',
  },
  {
    title: 'Reflectievragen',
    body: 'Stel wekelijkse vragen aan je spelers. Ze beantwoorden die in de app — jij leest de antwoorden terug per speler.',
    position: 'above-nav',
    arrowOffset: 83,
  },
];

const PLAYER_STEPS: Step[] = [
  {
    title: 'Welkom bij Skillkaart!',
    body: 'Hier volg je jouw ontwikkeling als voetballer. Je coach heeft jou een pincode gegeven waarmee je kunt inloggen.',
    position: 'center',
  },
  {
    title: 'Jouw Dashboard',
    body: 'Dit is je persoonlijk dashboard. Je ziet je level, badges die je hebt verdiend, een AI-analyse en je positie in het team.',
    position: 'above-nav',
    arrowOffset: 50,
  },
  {
    title: 'Skills & Stats',
    body: 'Hier zie je de skills die je coach heeft ingevuld, je radar-grafiek en je progressie over de tijd.',
    position: 'above-nav',
    arrowOffset: 30,
  },
  {
    title: 'Huiswerk',
    body: 'Je coach kan huiswerkopdrachten voor je klaarzetten. Als je ze klaar hebt, vink je ze hier af.',
    position: 'above-nav',
    arrowOffset: 10,
  },
  {
    title: 'Coach Vragen',
    body: 'Jouw coach stelt soms vragen aan het team. Beantwoord ze hier zodat je coach weet hoe het met je gaat.',
    position: 'above-nav',
    arrowOffset: 90,
  },
];

const STORAGE_KEY_COACH = 'onboardingDone_coach';
const STORAGE_KEY_PLAYER = 'onboardingDone_player';

interface OnboardingTourProps {
  role: 'coach' | 'player';
}

export default function OnboardingTour({ role }: OnboardingTourProps) {
  const storageKey = role === 'coach' ? STORAGE_KEY_COACH : STORAGE_KEY_PLAYER;
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) {
      // Small delay so the dashboard has rendered first
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [storageKey]);

  const steps = role === 'coach' ? COACH_STEPS : PLAYER_STEPS;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const dismiss = () => {
    localStorage.setItem(storageKey, '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] sm:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Dimmed backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            onClick={dismiss}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              className="absolute left-4 right-4"
              style={
                current.position === 'center'
                  ? { top: '50%', transform: 'translateY(-50%)' }
                  : { bottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }
              }
            >
              {/* Card */}
              <div
                className="relative rounded-2xl p-5"
                style={{
                  background: '#111',
                  border: `1.5px solid ${NEON_COLOR}44`,
                  boxShadow: `0 0 32px ${NEON_COLOR}22`,
                }}
              >
                {/* Step counter + close */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-1.5">
                    {steps.map((_, i) => (
                      <div
                        key={i}
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: i === step ? 20 : 6,
                          background: i === step ? NEON_COLOR : '#333',
                        }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={dismiss}
                    className="p-1.5 rounded-full hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                <h3
                  className="text-lg font-bold mb-2"
                  style={{ textShadow: `0 0 8px ${NEON_COLOR}88` }}
                >
                  {current.title}
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed mb-5">
                  {current.body}
                </p>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setStep(s => s - 1)}
                    disabled={step === 0}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-white transition-colors disabled:opacity-0"
                  >
                    <ChevronLeft size={16} /> Vorige
                  </button>

                  {isLast ? (
                    <button
                      onClick={dismiss}
                      className="px-5 py-2 rounded-xl text-sm font-bold text-black transition-opacity hover:opacity-90 active:scale-95"
                      style={{ background: NEON_COLOR }}
                    >
                      Aan de slag!
                    </button>
                  ) : (
                    <button
                      onClick={() => setStep(s => s + 1)}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 active:scale-95"
                      style={{ background: NEON_COLOR, color: '#000' }}
                    >
                      Volgende <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Arrow pointing down toward bottom nav (only for above-nav steps) */}
              {current.position === 'above-nav' && current.arrowOffset !== undefined && (
                <div
                  className="absolute -bottom-2.5 w-5 h-5 rotate-45 rounded-sm"
                  style={{
                    left: `${current.arrowOffset}%`,
                    transform: `translateX(-50%) rotate(45deg)`,
                    background: '#111',
                    border: `1.5px solid ${NEON_COLOR}44`,
                    borderTop: 'none',
                    borderLeft: 'none',
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
