import { useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Trophy, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import { skillKeys, COACH_COLOR } from '../../utils/constants';
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
  const assignedIds = teamData.assigned_homework_ids ?? [];

  const playerStats = useMemo(() => players.map(p => {
    const ev = p.evaluations?.[activeTab];
    const avgSkill = ev ? skillKeys.reduce((s, k) => s + (ev.skills[k] ?? 5), 0) / skillKeys.length : 5;
    const hwDone = assignedIds.filter(id => p.completed_homework_ids?.includes(id)).length;
    return { player: p, avgSkill, matchRating: ev?.matchRating ?? 0, hwDone };
  }).sort((a, b) => b.avgSkill - a.avgSkill), [players, activeTab, assignedIds]);

  const teamSkillAvgs = useMemo(() => skillKeys.map(key => {
    const avg = players.length
      ? players.reduce((s, p) => s + (p.evaluations?.[activeTab]?.skills[key] ?? 5), 0) / players.length
      : 5;
    return { key, avg };
  }), [players, activeTab]);

  const teamAvg = playerStats.length
    ? playerStats.reduce((s, p) => s + p.avgSkill, 0) / playerStats.length
    : 0;

  const hwComplete = assignedIds.length > 0
    ? playerStats.filter(p => p.hwDone === assignedIds.length).length
    : 0;

  const needsAttention = playerStats.filter(p => p.avgSkill < 5);

  const radarData = teamSkillAvgs.map(({ key, avg }) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    value: parseFloat(avg.toFixed(1)),
    fullMark: 10,
  }));

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
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      >
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
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team radar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card light>
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              Team Skill Gemiddelde
              <span className="text-sm font-normal text-gray-400">— {activeTab}</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar name="Team" dataKey="value" stroke={COACH_COLOR} fill={COACH_COLOR} fillOpacity={0.45} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Skill bars */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <Card light>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Skill Verdeling</h3>
            <div className="space-y-3">
              {teamSkillAvgs.map(({ key, avg }) => {
                const color = avg >= 7 ? '#16a34a' : avg >= 5 ? '#7c3aed' : '#dc2626';
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-gray-600">{key}</span>
                      <span className="font-bold" style={{ color }}>{avg.toFixed(1)}</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="h-2 rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${avg * 10}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Player ranking */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
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
      </motion.div>
    </div>
  );
};

export default TeamOverview;
