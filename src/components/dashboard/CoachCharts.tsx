import { useState, useMemo } from 'react';
import { TrendingUp, FileText } from 'lucide-react';
import Card from '../ui/Card';
import { COACH_COLOR, skillKeys, SKILL_GROUPS, evaluationPeriods, testLabels, testDayLabel } from '../../utils/constants';
import type { Player } from '../../types';

interface CoachChartsProps {
  players: Player[];
  activePlayer: Player;
  activeTab: string;
}

export default function CoachCharts({ activePlayer, activeTab }: CoachChartsProps) {
  const [chartsReady, setChartsReady] = useState(false);
  const [Charts, setCharts] = useState<typeof import('recharts') | null>(null);

  // Dynamische import — apart chunk via Vite
  useMemo(() => {
    import('recharts').then(mod => {
      setCharts(mod);
      setChartsReady(true);
    }).catch(() => {});
  }, []);

  const radarChartsByGroup = useMemo(() => {
    const ev = activePlayer.evaluations?.[activeTab];
    return SKILL_GROUPS.map(group => ({
      key: group.key,
      label: group.label,
      color: group.color,
      data: group.skills.map(s => ({
        subject: s.label,
        value: ev?.skills?.[s.key] ?? 5,
      })),
    }));
  }, [activePlayer, activeTab]);

  const lineChartData = useMemo(() => {
    return evaluationPeriods
      .filter(p => activePlayer.evaluations?.[p])
      .map(p => {
        const ev = activePlayer.evaluations![p];
        const avg = skillKeys.reduce((s, k) => s + (ev.skills?.[k] ?? 5), 0) / skillKeys.length;
        return { name: p, 'Gem. Skill': parseFloat(avg.toFixed(1)) };
      });
  }, [activePlayer]);

  const testData = activePlayer.evaluations?.[activeTab]?.tests;
  const hasTestResults = !!testData && Object.values(testData).some(category =>
    Object.values(category as Record<string, string>).some(value => value !== '')
  );

  if (!chartsReady || !Charts) {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SKILL_GROUPS.map(group => (
            <Card light key={group.key}><div className="h-56 flex items-center justify-center text-gray-400 text-sm">Grafiek laden...</div></Card>
          ))}
        </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {radarChartsByGroup.map(group => (
          <Card light key={group.key}>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">{group.label} — {activeTab}</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={group.data}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar name={activePlayer.name} dataKey="value" stroke={group.color} fill={group.color} fillOpacity={0.35} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ))}
      </div>

      {hasTestResults && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(testLabels).map(([categoryKey, categoryData]) => (
            <Card light key={categoryKey}>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                <FileText size={13} style={{ color: COACH_COLOR }} /> {categoryData.label} — {testDayLabel(activeTab)}
              </p>
              <ul className="space-y-1.5 text-sm">
                {Object.entries(categoryData.tests).map(([testKey, testLabel]) => {
                  const value = (testData?.[categoryKey as keyof typeof testData] as Record<string, string> | undefined)?.[testKey];
                  return value ? (
                    <li key={testKey} className="flex justify-between">
                      <span className="text-gray-500">{testLabel.split(' (')[0]}:</span>
                      <span className="font-bold text-gray-900">{value}</span>
                    </li>
                  ) : null;
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}

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
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}
