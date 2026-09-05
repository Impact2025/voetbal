import { useState, useEffect, useCallback, lazy, Suspense, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, Users, Mail, FileText, Ticket, Building2,
  LogOut, Loader2, RefreshCw, TrendingUp, Video, Activity,
  AlertTriangle, UserCog, Sparkles, BookOpen, LifeBuoy,
} from 'lucide-react';
import { NEON_COLOR } from '../../utils/constants';
import { fetchAdminMetrics, type AdminMetrics } from '../../lib/adminMetrics';
import type { UserData } from '../../types';

const CrmModule = lazy(() => import('./CrmModule'));
const MailModule = lazy(() => import('./MailModule'));
const BlogModule = lazy(() => import('./BlogModule'));
const CouponsModule = lazy(() => import('./CouponsModule'));
const TrainingModule = lazy(() => import('./TrainingModule'));
const SupportInbox = lazy(() => import('../support/SupportInbox'));

// Leesbare (donkerdere) variant van NEON_COLOR voor tekst/iconen op een lichte ondergrond.
const ACCENT_INK = '#009966';

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionId = 'cockpit' | 'crm' | 'mail' | 'blog' | 'coupons' | 'trainingen' | 'support';

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
  { id: 'support',    label: 'Support',        icon: LifeBuoy, ready: true },
];

// ─── KPI-kaart ────────────────────────────────────────────────────────────────

const Kpi = ({
  icon: Icon, label, value, sub, accent = ACCENT_INK,
}: {
  icon: typeof Users; label: string; value: string | number; sub?: string; accent?: string;
}) => (
  <div className="group relative rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-gray-300">
    <div className="flex items-center gap-2.5 mb-4">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${accent}14`, color: accent }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</span>
    </div>
    <div className="text-3xl font-bold tabular-nums text-gray-900 leading-none">{value}</div>
    {sub && <div className="mt-2 text-xs text-gray-500">{sub}</div>}
  </div>
);

const SectionHeader = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-3 mb-3">
    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">{children}</h2>
    <div className="h-px flex-1 bg-gray-200" />
  </div>
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
      <div className="flex items-center justify-center py-24 text-gray-500">
        <Loader2 className="animate-spin h-6 w-6 mr-3" style={{ color: ACCENT_INK }} /> Cijfers laden…
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <div className="font-semibold text-gray-900">Kon de cijfers niet laden</div>
            <div className="text-sm text-gray-500">{error}</div>
          </div>
        </div>
        <button onClick={() => void load()} className="mt-4 text-sm font-medium px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 transition-colors">
          Opnieuw proberen
        </button>
      </div>
    );
  }

  const { totals, signups, activity, engagement } = metrics;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Platform Cockpit</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Bijgewerkt {new Date(metrics.generated_at).toLocaleString('nl-NL')}
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Verversen
        </button>
      </div>

      <section>
        <SectionHeader>Gebruikers &amp; clubs</SectionHeader>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi icon={Building2} label="Clubs" value={totals.clubs} sub={`${engagement.active_clubs_30d} actief · ${engagement.dormant_clubs} slapend`} />
          <Kpi icon={Users} label="Teams" value={totals.teams} sub={`${engagement.active_teams_30d} actief (30d)`} />
          <Kpi icon={Users} label="Spelers" value={totals.players} />
          <Kpi icon={UserCog} label="Coaches" value={totals.coaches} sub={`${totals.club_admins} club-admins · ${totals.parents} ouders`} />
        </div>
      </section>

      <section>
        <SectionHeader>Groei (nieuwe accounts)</SectionHeader>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi icon={TrendingUp} label="Vandaag" value={signups.today} accent="#7c3aed" />
          <Kpi icon={TrendingUp} label="Laatste 7 dagen" value={signups.last_7d} accent="#7c3aed" />
          <Kpi icon={TrendingUp} label="Laatste 30 dagen" value={signups.last_30d} accent="#7c3aed" />
          <Kpi icon={Activity} label="Actieve spelers (7d)" value={engagement.active_players_7d} sub={`${engagement.active_players_30d} in 30d`} accent="#d97706" />
        </div>
      </section>

      <section>
        <SectionHeader>Activiteit</SectionHeader>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi icon={Activity} label="Acties (7d)" value={activity.events_7d} sub={`${activity.events_30d} in 30d`} accent="#d97706" />
          <Kpi icon={Video} label="Video-inzendingen (7d)" value={activity.videos_7d} accent="#d97706" />
          <Kpi icon={FileText} label="Huiswerk-inzendingen (7d)" value={activity.submissions_7d} accent="#d97706" />
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-[#00FF9D0d] p-5 shadow-sm">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${ACCENT_INK}14`, color: ACCENT_INK }}>
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="text-sm text-gray-600 leading-relaxed">
          <span className="font-semibold text-gray-900">Dagelijks &amp; maandelijks rapport actief.</span>{' '}
          Een AI-managementanalyse van deze cijfers wordt automatisch naar{' '}
          <span className="font-medium" style={{ color: ACCENT_INK }}>weareimpactnl@gmail.com</span> gemaild
          (dagelijks 06:00, maandelijks de 1e).
        </div>
      </div>
    </div>
  );
};

// ─── Placeholder voor nog te bouwen secties ─────────────────────────────────────

const ComingSoon = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4">
      <Sparkles className="h-5 w-5" style={{ color: ACCENT_INK }} />
    </div>
    <h2 className="text-lg font-bold text-gray-900">{label}</h2>
    <p className="text-sm text-gray-500 max-w-sm mt-2 leading-relaxed">
      Deze module staat op de roadmap (Bundel B–E). De cockpit en de
      automatische rapporten zijn al live.
    </p>
  </div>
);

// ─── Shell ──────────────────────────────────────────────────────────────────

export default function AdminApp({ userData, onLogout }: AdminAppProps) {
  const [section, setSection] = useState<SectionId>('cockpit');

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-900">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#fff', color: '#111827', border: '1px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' } }} />
      {/* Sidebar */}
      <aside className="md:w-56 md:min-h-screen md:sticky md:top-0 border-b md:border-b-0 md:border-r border-gray-200 bg-white p-3 flex md:flex-col gap-1">
        <div className="hidden md:flex items-center gap-2 px-2 py-2 mb-3">
          <div className="h-6 w-6 rounded-md flex items-center justify-center font-black text-[11px]" style={{ backgroundColor: NEON_COLOR, color: '#000' }}>S</div>
          <div>
            <div className="text-[13px] font-bold text-gray-900 tracking-wide leading-none">Skillkaart</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-gray-400 leading-none mt-0.5">Admin</div>
          </div>
        </div>
        <nav className="flex md:flex-col gap-0.5 flex-1 overflow-x-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-[15px] w-[15px]" style={active ? { color: ACCENT_INK } : undefined} />
                {item.label}
                {!item.ready && <span className="ml-auto text-[10px] opacity-60">soon</span>}
              </button>
            );
          })}
        </nav>
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-[15px] w-[15px]" /> Uitloggen
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-6xl">
        <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {section === 'cockpit' ? (
            <Cockpit />
          ) : section === 'crm' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="animate-spin h-8 w-8" style={{ color: ACCENT_INK }} /></div>}>
              <CrmModule />
            </Suspense>
          ) : section === 'mail' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="animate-spin h-8 w-8" style={{ color: ACCENT_INK }} /></div>}>
              <MailModule />
            </Suspense>
          ) : section === 'blog' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="animate-spin h-8 w-8" style={{ color: ACCENT_INK }} /></div>}>
              <BlogModule />
            </Suspense>
          ) : section === 'coupons' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="animate-spin h-8 w-8" style={{ color: ACCENT_INK }} /></div>}>
              <CouponsModule />
            </Suspense>
          ) : section === 'trainingen' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="animate-spin h-8 w-8" style={{ color: ACCENT_INK }} /></div>}>
              <TrainingModule />
            </Suspense>
          ) : section === 'support' ? (
            <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="animate-spin h-8 w-8" style={{ color: ACCENT_INK }} /></div>}>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Support</h1>
                <p className="text-sm text-gray-500 mt-0.5">Platform-brede tickets — alles wat clubs niet zelf konden oplossen.</p>
              </div>
              <SupportInbox />
            </Suspense>
          ) : (
            <ComingSoon label={NAV.find((n) => n.id === section)?.label ?? ''} />
          )}
        </motion.div>
        <p className="mt-10 text-[11px] text-gray-400 border-t border-gray-200 pt-4">Ingelogd als superadmin · {userData.id ?? userData.uid}</p>
      </main>
    </div>
  );
}
