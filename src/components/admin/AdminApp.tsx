import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, Users, Mail, FileText, Ticket, Building2,
  LogOut, Loader2, RefreshCw, TrendingUp, Video, Activity,
  AlertTriangle, UserCog, Sparkles, BookOpen,
} from 'lucide-react';
import { NEON_COLOR } from '../../utils/constants';
import Card from '../ui/Card';
import { fetchAdminMetrics, type AdminMetrics } from '../../lib/adminMetrics';
import type { UserData } from '../../types';

const CrmModule = lazy(() => import('./CrmModule'));
const MailModule = lazy(() => import('./MailModule'));
const BlogModule = lazy(() => import('./BlogModule'));
const CouponsModule = lazy(() => import('./CouponsModule'));
const TrainingModule = lazy(() => import('./TrainingModule'));

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionId = 'cockpit' | 'crm' | 'mail' | 'blog' | 'coupons' | 'trainingen';

interface AdminAppProps {
  userData: UserData;
  onLogout: () => void;
}

interface NavItem {
  id: SectionId;
  label: string;
  icon: typeof LayoutDashboard;
  ready: boolean;
}

const NAV: NavItem[] = [
  { id: 'cockpit', label: 'Cockpit', icon: LayoutDashboard, ready: true },
  { id: 'crm',     label: 'CRM',     icon: Users,           ready: true },
  { id: 'mail',    label: 'Mail',    icon: Mail,            ready: true },
  { id: 'blog',    label: 'Blog',    icon: FileText,        ready: true },
  { id: 'coupons',    label: 'Coupons',     icon: Ticket,      ready: true },
  { id: 'trainingen', label: 'Voetballessen', icon: BookOpen,  ready: true },
];

// ─── KPI-kaart ────────────────────────────────────────────────────────────────

const Kpi = ({
  icon: Icon, label, value, sub, accent = NEON_COLOR,
}: {
  icon: typeof Users; label: string; value: string | number; sub?: string; accent?: string;
}) => (
  <Card className="flex flex-col gap-2">
    <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wide">
      <Icon className="h-4 w-4" style={{ color: accent }} />
      {label}
    </div>
    <div className="text-3xl font-black text-white">{value}</div>
    {sub && <div className="text-xs text-gray-500">{sub}</div>}
  </Card>
);

// ─── Cockpit ──────────────────────────────────────────────────────────────────

const Cockpit = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMetrics(await fetchAdminMetrics());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onbekende fout');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="animate-spin h-8 w-8 mr-3" style={{ color: NEON_COLOR }} /> Cijfers laden…
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="border-red-500/40">
        <div className="flex items-center gap-3 text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <div className="font-bold">Kon de cijfers niet laden</div>
            <div className="text-sm text-gray-400">{error}</div>
          </div>
        </div>
        <button onClick={() => void load()} className="mt-4 text-sm px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white">
          Opnieuw proberen
        </button>
      </Card>
    );
  }

  const { totals, signups, activity, engagement } = metrics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Platform Cockpit</h1>
          <p className="text-sm text-gray-500">
            Bijgewerkt: {new Date(metrics.generated_at).toLocaleString('nl-NL')}
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white"
        >
          <RefreshCw className="h-4 w-4" /> Verversen
        </button>
      </div>

      <section>
        <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Gebruikers & clubs</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi icon={Building2} label="Clubs" value={totals.clubs} sub={`${engagement.active_clubs_30d} actief · ${engagement.dormant_clubs} slapend`} />
          <Kpi icon={Users} label="Teams" value={totals.teams} sub={`${engagement.active_teams_30d} actief (30d)`} />
          <Kpi icon={Users} label="Spelers" value={totals.players} />
          <Kpi icon={UserCog} label="Coaches" value={totals.coaches} sub={`${totals.club_admins} club-admins · ${totals.parents} ouders`} />
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Groei (nieuwe accounts)</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi icon={TrendingUp} label="Vandaag" value={signups.today} accent="#a78bfa" />
          <Kpi icon={TrendingUp} label="Laatste 7 dagen" value={signups.last_7d} accent="#a78bfa" />
          <Kpi icon={TrendingUp} label="Laatste 30 dagen" value={signups.last_30d} accent="#a78bfa" />
          <Kpi icon={Activity} label="Actieve spelers (7d)" value={engagement.active_players_7d} sub={`${engagement.active_players_30d} in 30d`} accent="#fbbf24" />
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Activiteit</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Kpi icon={Activity} label="Acties (7d)" value={activity.events_7d} sub={`${activity.events_30d} in 30d`} accent="#fbbf24" />
          <Kpi icon={Video} label="Video-inzendingen (7d)" value={activity.videos_7d} accent="#fbbf24" />
          <Kpi icon={FileText} label="Huiswerk-inzendingen (7d)" value={activity.submissions_7d} accent="#fbbf24" />
        </div>
      </section>

      <Card className="bg-gradient-to-br from-black/40 to-[#00FF9D0a]">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 mt-0.5" style={{ color: NEON_COLOR }} />
          <div className="text-sm text-gray-300">
            <span className="font-bold text-white">Dagelijks &amp; maandelijks rapport actief.</span>{' '}
            Een AI-managementanalyse van deze cijfers wordt automatisch naar
            <span className="text-[--neon-color]"> v.munster@weareimpact.nl</span> gemaild
            (dagelijks 06:00, maandelijks de 1e).
          </div>
        </div>
      </Card>
    </div>
  );
};

// ─── Placeholder voor nog te bouwen secties ─────────────────────────────────────

const ComingSoon = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="h-14 w-14 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
      <Sparkles className="h-6 w-6" style={{ color: NEON_COLOR }} />
    </div>
    <h2 className="text-xl font-black text-white">{label}</h2>
    <p className="text-sm text-gray-500 max-w-sm mt-2">
      Deze module staat op de roadmap (Bundel B–E). De cockpit en de
      automatische rapporten zijn al live.
    </p>
  </div>
);

// ─── Shell ──────────────────────────────────────────────────────────────────

export default function AdminApp({ userData, onLogout }: AdminAppProps) {
  const [section, setSection] = useState<SectionId>('cockpit');

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#0b0e12', color: '#fff', border: '1px solid #1f2937' } }} />
      {/* Sidebar */}
      <aside className="md:w-60 md:min-h-screen border-b md:border-b-0 md:border-r border-gray-800 bg-black/40 backdrop-blur-sm p-4 flex md:flex-col gap-2">
        <div className="hidden md:block mb-4">
          <div className="text-lg font-black text-white tracking-widest">SKILLKAART</div>
          <div className="text-xs" style={{ color: NEON_COLOR }}>ADMIN</div>
        </div>
        <nav className="flex md:flex-col gap-1 flex-1 overflow-x-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  active ? 'bg-[--neon-color] text-black font-bold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {!item.ready && <span className="ml-auto text-[10px] opacity-60">soon</span>}
              </button>
            );
          })}
        </nav>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Uitloggen
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl">
        <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {section === 'cockpit' ? (
            <Cockpit />
          ) : section === 'crm' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="animate-spin h-8 w-8" style={{ color: NEON_COLOR }} /></div>}>
              <CrmModule />
            </Suspense>
          ) : section === 'mail' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="animate-spin h-8 w-8" style={{ color: NEON_COLOR }} /></div>}>
              <MailModule />
            </Suspense>
          ) : section === 'blog' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="animate-spin h-8 w-8" style={{ color: NEON_COLOR }} /></div>}>
              <BlogModule />
            </Suspense>
          ) : section === 'coupons' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="animate-spin h-8 w-8" style={{ color: NEON_COLOR }} /></div>}>
              <CouponsModule />
            </Suspense>
          ) : section === 'trainingen' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="animate-spin h-8 w-8" style={{ color: NEON_COLOR }} /></div>}>
              <TrainingModule />
            </Suspense>
          ) : (
            <ComingSoon label={NAV.find((n) => n.id === section)?.label ?? ''} />
          )}
        </motion.div>
        <p className="mt-8 text-[11px] text-gray-600">Ingelogd als superadmin · {userData.id ?? userData.uid}</p>
      </main>
    </div>
  );
}
