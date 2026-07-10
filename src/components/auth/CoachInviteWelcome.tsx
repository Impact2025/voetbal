import { motion } from 'framer-motion';
import { CheckCircle2, UserPlus, MailCheck, Rocket, ArrowRight } from 'lucide-react';
import { NEON_COLOR } from '../../utils/constants';
import type { CoachInvite } from '../../lib/teamManagement';

const coachRoleLabel = (role: CoachInvite['role']) =>
  role === 'assistant' ? 'assistent-trainer' : 'hoofdcoach';

interface Step {
  icon: typeof UserPlus;
  title: string;
  body: string;
}

interface CoachInviteWelcomeProps {
  invite: CoachInvite;
  light: boolean;
  onContinue: () => void;
  onLogin: () => void;
}

const CoachInviteWelcome = ({ invite, light, onContinue, onLogin }: CoachInviteWelcomeProps) => {
  const steps: Step[] = [
    {
      icon: UserPlus,
      title: 'Kies een wachtwoord',
      // Het e-mailadres ligt vast: de uitnodiging is aan dit adres gekoppeld.
      body: `Je account komt op ${invite.email} te staan.`,
    },
    {
      icon: MailCheck,
      title: 'Bevestig je e-mailadres',
      body: 'Je krijgt direct een mail van Skillkaart. Klik op de link daarin om je account te activeren.',
    },
    {
      icon: Rocket,
      title: 'Aan de slag',
      body: `Log in en ${invite.team_name} staat voor je klaar — spelers, trainingen en voortgang.`,
    },
  ];

  const muted = light ? 'text-gray-500' : 'text-gray-400';
  const stepBg = light ? 'bg-gray-50 border-gray-200' : 'bg-gray-800/40 border-gray-700';

  return (
    <div className="space-y-5">
      <div className={`flex items-start gap-2 p-3 rounded-lg border ${light ? 'bg-green-50 border-green-200' : 'bg-green-900/30 border-green-700'}`}>
        <CheckCircle2 size={18} className={`shrink-0 mt-0.5 ${light ? 'text-green-600' : 'text-green-400'}`} />
        <p className={`text-sm ${light ? 'text-green-700' : 'text-green-300'}`}>
          Je bent uitgenodigd als {coachRoleLabel(invite.role)} van <strong>{invite.team_name}</strong>.
        </p>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold" style={light ? {} : { textShadow: `0 0 8px ${NEON_COLOR}` }}>
          Welkom bij Skillkaart
        </h2>
        <p className={`text-sm mt-2 ${muted}`}>
          Skillkaart helpt je de ontwikkeling van je spelers bij te houden: je beoordeelt vaardigheden,
          zet trainingen klaar en houdt ouders op de hoogte. Je bent zo begonnen.
        </p>
      </div>

      <ol className="space-y-2">
        {steps.map((step, i) => (
          <motion.li
            key={step.title}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className={`flex items-start gap-3 p-3 rounded-xl border ${stepBg}`}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${NEON_COLOR}20` }}
            >
              <step.icon size={16} style={{ color: light ? '#16A34A' : NEON_COLOR }} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight">
                <span className={muted}>{i + 1}.</span> {step.title}
              </p>
              <p className={`text-xs mt-1 leading-relaxed ${muted}`}>{step.body}</p>
            </div>
          </motion.li>
        ))}
      </ol>

      <button
        onClick={onContinue}
        className="w-full py-3 font-bold text-black rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
        style={{ backgroundColor: NEON_COLOR }}
      >
        Account aanmaken <ArrowRight size={16} />
      </button>

      <p className={`text-center text-sm ${muted}`}>
        Heb je al een Skillkaart-account?{' '}
        <button onClick={onLogin} className="font-semibold hover:underline" style={{ color: NEON_COLOR }}>
          Log hier in
        </button>
      </p>
    </div>
  );
};

export default CoachInviteWelcome;
