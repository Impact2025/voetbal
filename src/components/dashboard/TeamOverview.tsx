import { useMemo } from 'react';
import LazyRadar from './LazyRadar';
import { Trophy, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import { skillKeys, SKILL_GROUPS, COACH_COLOR } from '../../utils/constants';
import type { Player, Team } from '../../types';

interface TeamOverviewProps {
  players: Player[];
  teamData: Partial<Team>;
  activeTab: string;
  onSelectPlayer: (id: string) => void;
}

interface StatChipProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  warn?: boolean;
}

interface ColoredAxisTickProps {
  x?: number;
  y?: number;
  textAnchor?: string;
  payload?: { value: string };
  colorMap: Record<string, string>;
}

const ColoredAxisTick = ({ x, y, textAnchor, payload, colorMap }: ColoredAxisTickProps) => (
  <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" fontSize={11} fontWeight={700} fill={colorMap[payload?.value ?? ''] ?? '#6b7280'}>
    {payload?.value}
  </text>
);

interface ColoredRadarDotProps {
  cx?: number;
  cy?: number;
  payload?: { payload?: { color?: string } };
}

const ColoredRadarDot = ({ cx, cy, payload }: ColoredRadarDotProps) => (
  <circle cx={cx} cy={cy} r={5} fill={payload?.payload?.color ?? COACH_COLOR} stroke="#fff" strokeWidth={1.5} />
);

const StatChip = ({ label, value, sub, icon, warn = false }: StatChipProps) => (
  <Card light className="text-center py-4">
    <div className="flex flex-col items-center gap-1">
      <div style={{ color: warn && value !== '0' ? '#dc2626' : COACH_COLOR }}>{icon}</div>
      <div className="text-2xl font-black" style={{ color: warn && value !== '0' ? '#dc2626' : COACH_COLOR }}>{value}</div>
      <div className="text-xs font-semibold text-gray-600">{label}</div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wide">{sub}</div>
    </div>
  </Card>
);

const TeamOverview = ({ players, teamData, activeTab, onSelectPlayer }: TeamOverviewProps) => {
  const assignedIds = useMemo(
    () => teamData.assigned_homework_ids ?? [],
    [teamData.assigned_homework_ids],
  );

  const playerStats = useMemo(() => players.map(p => {
    const ev = p.evaluations?.[activeTab];
    const avgSkill = ev ? skillKeys.reduce((s, k) => s + (ev.skills[k] ?? 5), 0) / skillKeys.length : 5;
    const hwDone = assignedIds.filter(id => p.completed_homework_ids?.includes(id)).length;
    return { player: p, avgSkill, matchRating: ev?.matchRating ?? 0, hwDone };
  }).sort((a, b) => b.avgSkill - a.avgSkill), [players, activeTab, assignedIds]);

  const teamAvg = playerStats.length
    ? playerStats.reduce((s, p) => s + p.avgSkill, 0) / playerStats.length
    : 0;

  const hwComplete = assignedIds.length > 0
    ? playerStats.filter(p => p.hwDone === assignedIds.length).length
    : 0;

  const needsAttention = playerStats.filter(p => p.avgSkill < 5);

  const radarData = SKILL_GROUPS.map(group => {
    const avg = group.skills.reduce((sum, s) => {
      const playerAvg = players.length
        ? players.reduce((ps, p) => ps + (p.evaluations?.[activeTab]?.skills[s.key] ?? 5), 0) / players.length
        : 5;
      return sum + playerAvg;
    }, 0) / group.skills.length;
    return { subject: group.label, value: parseFloat(avg.toFixed(1)), fullMark: 10, color: group.color };
  });

  const subjectColorMap: Record<string, string> = Object.fromEntries(SKILL_GROUPS.map(g => [g.label, g.color]));

  if (players.length === 0) {
    return (
      <Card light>
        <div className="text-center py-10 text-gray-400">
          <Users size={48} className="mx-auto mb-3 text-gray-300" />
          <p>Voeg spelers toe om het overzicht te zien.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatChip label="Team Score" value={`${(teamAvg * 10).toFixed(0)}`} sub="/ 100" icon={<Trophy size={18} />} />
        <StatChip label="Spelers" value={`${players.length}`} sub="in team" icon={<Users size={18} />} />
        <StatChip
          label="HW Voltooid"
          value={assignedIds.length > 0 ? `${hwComplete}/${players.length}` : '—'}
          sub={assignedIds.length > 0 ? 'spelers' : 'geen HW'}
          icon={<CheckCircle2 size={18} />}
        />
        <StatChip
          label="Let Op"
          value={`${needsAttention.length}`}
          sub="spelers < 5"
          icon={<AlertTriangle size={18} />}
          warn
        />
      </div>

      {/* Team radar */}
      <div>
        <Card light>
          <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            Team Skill Gemiddelde
            <span className="text-sm font-normal text-gray-400">— {activeTab}</span>
          </h3>
          <div className="h-64">
            <LazyRadar>
              {(C) => (
                <C.ResponsiveContainer width="100%" height="100%">
                  <C.RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <C.PolarGrid stroke="#e5e7eb" />
                    <C.PolarAngleAxis dataKey="subject" tick={<ColoredAxisTick colorMap={subjectColorMap} />} />
                    <C.PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                    <C.Radar name="Team" dataKey="value" stroke={COACH_COLOR} fill={COACH_COLOR} fillOpacity={0.35} dot={<ColoredRadarDot />} />
                  </C.RadarChart>
                </C.ResponsiveContainer>
              )}
            </LazyRadar>
          </div>
        </Card>
      </div>

      {/* Skill bars */}
      <div>
        <Card light>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Skill Verdeling</h3>
          <div className="space-y-4">
            {SKILL_GROUPS.map(group => {
              const groupAvg = group.skills.reduce((sum, s) => {
                const a = players.length
                  ? players.reduce((ps, p) => ps + (p.evaluations?.[activeTab]?.skills[s.key] ?? 5), 0) / players.length
                  : 5;
                return sum + a;
              }, 0) / group.skills.length;
              const color = groupAvg >= 7 ? '#16a34a' : groupAvg >= 5 ? '#7c3aed' : '#dc2626';
              return (
                <div key={group.key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-gray-700" style={{ color: group.color }}>{group.label}</span>
                    <span className="font-bold" style={{ color }}>{groupAvg.toFixed(1)}</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="h-2 rounded-full"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${groupAvg * 10}%` }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Player ranking */}
      <div>
        <Card light>
          <h3 className="text-lg font-bold text-gray-900 mb-3">Spelers Ranglijst</h3>
          <div className="divide-y divide-gray-100">
            {playerStats.map(({ player, avgSkill, matchRating, hwDone }, idx) => {
              const medalColor = idx === 0 ? '#ca8a04' : idx === 1 ? '#6b7280' : idx === 2 ? '#92400e' : '#d1d5db';
              const score = (avgSkill * 10).toFixed(0);
              return (
                <button
                  key={player.id}
                  onClick={() => onSelectPlayer(player.id)}
                  className="w-full flex items-center gap-3 py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors text-left active:scale-[0.99]"
                >
                  <span className="text-base font-black w-5 text-center" style={{ color: medalColor }}>
                    {idx + 1}
                  </span>
                  <img src={player.avatar_url} className="w-9 h-9 rounded-full border border-gray-200" alt={player.name} />
                  <span className="flex-1 font-medium text-sm text-gray-900">{player.name}</span>
                  <div className="flex items-center gap-3 text-sm shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{score}</div>
                      <div className="text-[10px] text-gray-400 uppercase">score</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{matchRating}</div>
                      <div className="text-[10px] text-gray-400 uppercase">rating</div>
                    </div>
                    {assignedIds.length > 0 && (
                      <CheckCircle2 size={16} className={hwDone === assignedIds.length ? 'text-green-400' : 'text-gray-600'} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TeamOverview;
