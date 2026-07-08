import { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { COACH_COLOR } from '../../utils/constants';
import type { AttendanceRecord, StatAxis } from '../../types';

interface GrowthEvent {
  axis: StatAxis;
  xp: number;
  created_at: string;
}

interface ParentGrowthChartProps {
  statEvents: GrowthEvent[];
  attendance: AttendanceRecord[];
  weeks?: number;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Maandag 00:00 van de week waarin `date` valt
function weekStart(date: Date): number {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // ma=1 ... zo=0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d.getTime();
}

function buildWeeklySeries(statEvents: GrowthEvent[], attendance: AttendanceRecord[], weeks: number) {
  const now = weekStart(new Date());
  const buckets: { start: number; xp: number; presentCount: number; sessionCount: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    buckets.push({ start: now - i * WEEK_MS, xp: 0, presentCount: 0, sessionCount: 0 });
  }
  const bucketFor = (t: number) => {
    const idx = buckets.findIndex(b => t >= b.start && t < b.start + WEEK_MS);
    return idx >= 0 ? buckets[idx] : null;
  };

  for (const e of statEvents) {
    const b = bucketFor(new Date(e.created_at).getTime());
    if (b) b.xp += e.xp;
  }
  for (const a of attendance) {
    const b = bucketFor(new Date(a.session_date).getTime());
    if (b) { b.sessionCount += 1; if (a.present) b.presentCount += 1; }
  }

  return buckets.map(b => ({
    name: new Date(b.start).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }),
    'XP deze week': b.xp,
    'Aanwezigheid %': b.sessionCount > 0 ? Math.round((b.presentCount / b.sessionCount) * 100) : null,
  }));
}

export default function ParentGrowthChart({ statEvents, attendance, weeks = 10 }: ParentGrowthChartProps) {
  const [chartsReady, setChartsReady] = useState(false);
  const [Charts, setCharts] = useState<any>(null);

  // Dynamische import — apart chunk via Vite, alleen geladen als deze tab opent
  useMemo(() => {
    import('recharts').then(mod => {
      setCharts(mod);
      setChartsReady(true);
    }).catch(() => {});
  }, []);

  const data = useMemo(
    () => buildWeeklySeries(statEvents, attendance, weeks),
    [statEvents, attendance, weeks]
  );

  const weeksWithActivity = data.filter(d => d['XP deze week'] > 0 || d['Aanwezigheid %'] !== null).length;

  if (weeksWithActivity < 2) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
          <TrendingUp size={13} style={{ color: COACH_COLOR }} /> Groei over tijd
        </p>
        <p className="text-xs text-gray-400 italic leading-relaxed">
          Nog niet genoeg data voor een trend — kom terug over een paar weken.
        </p>
      </div>
    );
  }

  if (!chartsReady || !Charts) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-4">
        <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Grafiek laden...</div>
      </div>
    );
  }

  const {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  } = Charts;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
        <TrendingUp size={13} style={{ color: COACH_COLOR }} /> Groei over tijd
      </p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="xp" stroke="#9ca3af" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} stroke="#9ca3af" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, color: '#111827' }} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Line yAxisId="xp" type="monotone" dataKey="XP deze week" stroke={COACH_COLOR} strokeWidth={2} dot={false} />
            <Line yAxisId="pct" type="monotone" dataKey="Aanwezigheid %" stroke="#8b5cf6" strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-gray-400 mt-3 leading-relaxed border-t border-gray-50 pt-3">
        Laatste {weeks} weken — inzet-XP en aanwezigheid, geen vergelijking met andere kinderen.
      </p>
    </div>
  );
}
