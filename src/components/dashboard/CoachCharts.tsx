import { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import Card from '../ui/Card';
import { COACH_COLOR, skillKeys, evaluationPeriods } from '../../utils/constants';
import type { Player } from '../../types';

interface CoachChartsProps {
  players: Player[];
  activePlayer: Player;
  activeTab: string;
}

export default function CoachCharts({ players, activePlayer, activeTab }: CoachChartsProps) {
  const [chartsReady, setChartsReady] = useState(false);
  const [Charts, setCharts] = useState<any>(null);

  // Dynamische import — apart chunk via Vite
  useMemo(() => {
    import('recharts').then(mod => {
      setCharts(mod);
      setChartsReady(true);
    }).catch(() => {});
  }, []);

  const radarChartData = useMemo(() => {
    if (!activePlayer.evaluations?.[activeTab]) return [];
    const ev = activePlayer.evaluations[activeTab];
    return skillKeys.map(key => ({
      subject: key,
      value: ev.skills?.[key] ?? 5,
    }));
  }, [activePlayer, activeTab]);

  const lineChartData = useMemo(() => {
    return evaluationPeriods
      .filter(p => activePlayer.evaluations?.[p])
      .map(p => {
        const ev = activePlayer.evaluations![p];
        const avg = skillKeys.reduce((s, k) => s + (ev.skills?.[k] ?? 5), 0) / skillKeys.length;
        return { name: p, 'Gem. Skill': parseFloat(avg.toFixed(1)), 'Wedstrijdcijfer': ev.matchRating ?? 0 };
      });
  }, [activePlayer]);

  if (!chartsReady || !Charts) {
    return (
      <>
        <Card light><div className="h-64 flex items-center justify-center text-gray-400 text-sm">Grafiek laden...</div></Card>
        <Card light><div className="h-52 flex items-center justify-center text-gray-400 text-sm">Grafiek laden...</div></Card>
      </>
    );
  }

  const {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, Radar,
  } = Charts;

  return (
    <>
      <Card light>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Skill Radar — {activeTab}</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
              <Radar name={activePlayer.name} dataKey="value" stroke={COACH_COLOR} fill={COACH_COLOR} fillOpacity={0.18} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card light>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
          <TrendingUp size={13} style={{ color: COACH_COLOR }} /> Prestatie Trend
        </p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} stroke="#9ca3af" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, color: '#111827' }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="Gem. Skill" stroke={COACH_COLOR} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Wedstrijdcijfer" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}
