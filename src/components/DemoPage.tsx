import { Building2, ShieldCheck, User } from 'lucide-react';
import { NEON_COLOR } from '../utils/constants';

const ACCOUNTS = [
  {
    demo: 'clubAdmin',
    icon: Building2,
    title: 'Club Admin — Impact FC',
    detail: 'chat@weareimpact.nl · Skillkaart2026!',
  },
  {
    demo: 'coach',
    icon: ShieldCheck,
    title: 'Coach — V. Munster',
    detail: 'v.munster@weareimpact.nl · Demo1234',
  },
  {
    demo: 'player',
    icon: User,
    title: 'Speler — Luca van den Berg',
    detail: 'IMPACT-JO10-1 · PIN 112233',
  },
] as const;

const DemoPage = () => (
  <div className="min-h-screen bg-gradient-to-b from-[#0D0D0D] to-[#1A1A1A] text-white p-4 sm:p-8 flex items-center justify-center">
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center gap-2 mb-8">
        <img src="/logo.png" alt="Skillkaart" className="w-16 h-16 rounded-2xl object-cover" style={{ filter: `drop-shadow(0 0 12px ${NEON_COLOR}60)` }} />
        <h1 className="text-2xl font-black" style={{ color: NEON_COLOR }}>Demo-accounts</h1>
        <p className="text-gray-500 text-sm text-center">Kies een rol om Skillkaart direct uit te proberen</p>
      </div>

      <div className="space-y-2">
        {ACCOUNTS.map(({ demo, icon: Icon, title, detail }) => (
          <button
            key={demo}
            type="button"
            onClick={() => {
              if (demo === 'clubAdmin') {
                window.location.href = '/club?demo=clubAdmin';
              } else {
                window.location.href = `/?demo=${demo}`;
              }
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group bg-gray-800/40 border-gray-700/40 hover:bg-gray-800/70 hover:border-gray-600"
          >
            <Icon size={18} style={{ color: NEON_COLOR }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-gray-500 truncate">{detail}</p>
            </div>
            <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">inloggen →</span>
          </button>
        ))}
      </div>

      <a href="/" className="block text-center text-sm text-gray-500 hover:text-white transition-colors mt-8">
        Terug naar Skillkaart
      </a>
    </div>
  </div>
);

export default DemoPage;
