import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, LayoutDashboard, Users, ClipboardList,
  Target, MessageSquare, Share2, Wand2, Rocket, HelpCircle, CheckCircle2,
  Flame, Trophy, User,
} from 'lucide-react';
import { NEON_COLOR } from '../utils/constants';

const STORAGE_KEY_COACH = 'onboardingDone_coach_v2';
const STORAGE_KEY_PLAYER = 'onboardingDone_player_v2';

interface TourStep {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
  bullets?: string[];
}

const COACH_STEPS: TourStep[] = [
  {
    icon: Rocket,
    iconBg: `${NEON_COLOR}1A`,
    iconColor: NEON_COLOR,
    title: 'Welkom bij Skillkaart!',
    body: 'Jouw platform voor voetbalontwikkeling. Evalueer spelers, stuur trainingsplannen en houd het teamgevoel bij — alles op één plek.',
  },
  {
    icon: Share2,
    iconBg: '#6366f11A',
    iconColor: '#818cf8',
    title: 'Team ID delen met spelers',
    body: 'Jouw unieke Team ID staat rechtsboven. Spelers loggen in met dit ID en hun persoonlijke PIN.',
    bullets: [
      'Kopieer het ID met één klik op het klembord-icoon',
      'Stuur het ID via WhatsApp of e-mail naar ouders',
      'Elke speler krijgt automatisch een unieke 6-cijferige PIN',
      'PINs zijn zichtbaar bij "Speler toevoegen"',
    ],
  },
  {
    icon: LayoutDashboard,
    iconBg: '#fbbf241A',
    iconColor: '#fbbf24',
    title: 'Team Overzicht',
    body: 'Zie direct hoe je team ervoor staat na elke check-in periode.',
    bullets: [
      'Team score (0–100) en gemiddelde per skill',
      'Radar-grafiek van het hele team',
      'Ranglijst van spelers gesorteerd op score',
      '"Let Op" melding voor spelers die achterblijven',
    ],
  },
  {
    icon: Users,
    iconBg: '#3b82f61A',
    iconColor: '#60a5fa',
    title: 'Spelers evalueren',
    body: 'Selecteer een speler en vul na elke check-in de skills in. Alles wordt realtime opgeslagen.',
    bullets: [
      '7 skills beoordelen op schaal 1–10 via sliders',
      'Wedstrijdcijfer invullen per check-in periode',
      'Coach-opmerkingen typen of met AI laten genereren',
      'Radar-chart en prestatie-trend per speler bekijken',
    ],
  },
  {
    icon: ClipboardList,
    iconBg: '#ec48991A',
    iconColor: '#f472b6',
    title: 'Huiswerk toewijzen',
    body: 'Maak oefeningen aan en wijs ze toe aan je team. Spelers vinken ze af als ze klaar zijn.',
    bullets: [
      'Opdrachten aanmaken met titel en beschrijving',
      'YouTube-video koppelen voor visuele uitleg',
      'Met één klik toewijzen aan het hele team',
      'Voltooiing per speler realtime bijhouden',
    ],
  },
  {
    icon: Wand2,
    iconBg: '#a78bfa1A',
    iconColor: '#a78bfa',
    title: 'AI Trainingsplannen',
    body: 'Laat AI op basis van skill-scores een persoonlijk trainingsplan genereren voor elke speler.',
    bullets: [
      'Automatisch afgestemd op sterke en zwakke punten',
      '2–3 leuke thuisoefeningen per speler',
      'Genereer voor één speler of het hele team tegelijk',
      'Spelers zien het plan in hun eigen dashboard',
    ],
  },
  {
    icon: MessageSquare,
    iconBg: '#34d3991A',
    iconColor: '#34d399',
    title: 'Reflectievragen',
    body: 'Stel wekelijks maximaal 3 vragen aan je team. Lees de antwoorden terug per speler.',
    bullets: [
      'Eigen vragen opstellen en op elk moment aanpassen',
      'Spelers beantwoorden de vragen in hun eigen app',
      'Antwoorden per speler inzien via het Vragen-tabblad',
      'Nieuwe vragen versturen wist de oude antwoorden',
    ],
  },
  {
    icon: Target,
    iconBg: `${NEON_COLOR}1A`,
    iconColor: NEON_COLOR,
    title: 'Klaar om te coachen!',
    body: 'Gebruik het vraagteken-icoon rechtsonder om deze gids altijd opnieuw te openen. Succes met je team!',
  },
];

const PLAYER_STEPS: TourStep[] = [
  {
    icon: Rocket,
    iconBg: `${NEON_COLOR}1A`,
    iconColor: NEON_COLOR,
    title: 'Welkom bij Skillkaart!',
    body: 'Volg hier jouw ontwikkeling als voetballer. Je coach heeft je een Team ID en persoonlijke PIN gegeven om in te loggen.',
  },
  {
    icon: Flame,
    iconBg: '#f973161A',
    iconColor: '#f97316',
    title: 'Tabblad: Vandaag',
    body: 'Hier begint elke dag. Je ziet één ding om te doen — een oefening of een uitdaging. Klaar? Dan groei je!',
    bullets: [
      'Eén duidelijke actie per keer',
      'Jouw weekdoel en streak 🔥',
      'Huiswerk en uitdagingen op één plek',
    ],
  },
  {
    icon: Trophy,
    iconBg: '#fbbf241A',
    iconColor: '#fbbf24',
    title: 'Tabblad: Mijn Kaart',
    body: 'Jouw eigen voetbalkaart. Hoe meer je traint, hoe sterker je kaart wordt — van brons tot legendarisch.',
    bullets: [
      'Jouw Inzet-DNA: beloont doorzetten, niet talent',
      'Verdien een hogere tier door te doen',
      'Helemaal van jou — niet om mee te vergelijken',
    ],
  },
  {
    icon: User,
    iconBg: '#3b82f61A',
    iconColor: '#60a5fa',
    title: 'Tabblad: Ik',
    body: 'Wil je de details? Hier vind je je skills, je groei per check-in en de tips van je coach.',
    bullets: [
      'Jouw skills en hoe je groeit',
      'Coach-feedback en trainingsplan',
      'Jij nu vs. jij eerder — alleen jouw groei',
    ],
  },
  {
    icon: MessageSquare,
    iconBg: '#34d3991A',
    iconColor: '#34d399',
    title: 'Vragen van je coach',
    body: 'Soms stelt je coach een vraag. Die zie je onderaan bij Vandaag. Beantwoord ‘m zodat je coach weet hoe het gaat.',
    bullets: [
      'Maximaal 3 vragen per week',
      'Jouw antwoorden zijn alleen zichtbaar voor de coach',
    ],
  },
];

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 36 : -36, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d < 0 ? 36 : -36, opacity: 0 }),
};

interface OnboardingTourProps {
  role: 'coach' | 'player';
}

export default function OnboardingTour({ role }: OnboardingTourProps) {
  const storageKey = role === 'coach' ? STORAGE_KEY_COACH : STORAGE_KEY_PLAYER;
  const steps = role === 'coach' ? COACH_STEPS : PLAYER_STEPS;

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (localStorage.getItem(storageKey)) return;
    const t = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(t);
  }, [storageKey]);

  const go = useCallback((next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }, [step]);

  const dismiss = useCallback(() => {
    localStorage.setItem(storageKey, '1');
    setVisible(false);
    setTimeout(() => setStep(0), 350);
  }, [storageKey]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && step < steps.length - 1) go(step + 1);
      if (e.key === 'ArrowLeft' && step > 0) go(step - 1);
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, step, steps.length, go, dismiss]);

  const current = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;
  const Icon = current.icon;
  const progressPct = steps.length > 1 ? (step / (steps.length - 1)) * 100 : 100;

  return (
    <>
      {/* Floating help button — only on desktop (mobile nav has no room) */}
      <motion.button
        onClick={() => { setStep(0); setDirection(1); setVisible(true); }}
        className="hidden sm:flex fixed right-4 z-[90] w-9 h-9 rounded-full items-center justify-center"
        style={{
          bottom: '1.5rem',
          background: '#111',
          border: `1.5px solid ${NEON_COLOR}44`,
          color: `${NEON_COLOR}cc`,
          boxShadow: `0 0 14px ${NEON_COLOR}18`,
        }}
        whileHover={{ scale: 1.12, boxShadow: `0 0 18px ${NEON_COLOR}35` }}
        whileTap={{ scale: 0.92 }}
        aria-label="Open rondleiding"
      >
        <HelpCircle size={16} />
      </motion.button>

      {/* Tour overlay */}
      <AnimatePresence>
        {visible && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Dimmed backdrop */}
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.84)', backdropFilter: 'blur(6px)' }}
              onClick={dismiss}
            />

            {/* Card */}
            <motion.div
              className="relative w-full max-w-sm"
              initial={{ scale: 0.93, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.93, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              style={{
                background: '#0e0e0e',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)',
                overflow: 'hidden',
              }}
            >
              {/* Progress bar */}
              <div className="h-[3px]" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div
                  className="h-full"
                  style={{ background: current.iconColor, borderRadius: 2 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                />
              </div>

              <div className="p-6">
                {/* Counter + close */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    Stap {step + 1} van {steps.length}
                  </span>
                  <button
                    onClick={dismiss}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    aria-label="Sluiten"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Animated step content */}
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                  >
                    {/* Icon badge */}
                    <div
                      className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center mb-5"
                      style={{ background: current.iconBg }}
                    >
                      <Icon size={24} style={{ color: current.iconColor }} />
                    </div>

                    {/* Title */}
                    <h3 className="text-[19px] font-black leading-snug text-white mb-2">
                      {current.title}
                    </h3>

                    {/* Body */}
                    <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {current.body}
                    </p>

                    {/* Bullets */}
                    {current.bullets && (
                      <ul className="space-y-2.5">
                        {current.bullets.map((bullet, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <CheckCircle2
                              size={13}
                              className="shrink-0 mt-[3px]"
                              style={{ color: current.iconColor }}
                            />
                            <span className="text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.72)' }}>
                              {bullet}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation row */}
                <div className="flex items-center justify-between mt-7 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* Back */}
                  <button
                    onClick={() => go(step - 1)}
                    disabled={isFirst}
                    className="flex items-center gap-1 text-sm transition-colors disabled:invisible"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                    onMouseEnter={e => !isFirst && (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                  >
                    <ChevronLeft size={15} /> Vorige
                  </button>

                  {/* Step dots */}
                  <div className="flex items-center gap-1.5">
                    {steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => go(i)}
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: i === step ? 18 : 6,
                          height: 6,
                          background: i === step ? current.iconColor : 'rgba(255,255,255,0.12)',
                        }}
                        aria-label={`Ga naar stap ${i + 1}`}
                      />
                    ))}
                  </div>

                  {/* Next / Finish */}
                  {isLast ? (
                    <motion.button
                      onClick={dismiss}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-black"
                      style={{ background: NEON_COLOR }}
                      whileHover={{ opacity: 0.9 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Aan de slag!
                    </motion.button>
                  ) : (
                    <button
                      onClick={() => go(step + 1)}
                      className="flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-75"
                      style={{ color: current.iconColor }}
                    >
                      Volgende <ChevronRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
