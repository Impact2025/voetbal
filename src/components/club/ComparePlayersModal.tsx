import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend,
} from 'recharts';
import { SKILL_GROUPS, SKILL_LABELS, skillKeys } from '../../utils/constants';
import type { Player } from '../../types';
import type { TeamEnriched, AttendanceRow } from './ClubAdminDashboard';

const COMPARE_COLORS = ['#16A34A', '#7c3aed', '#d97706'];

const scoreColor = (score: number) =>
  score >= 70 ? '#16A34A' : score >= 55 ? '#7c3aed' : score >= 40 ? '#d97706' : '#dc2626';

const calcSkillAvg = (player: Player, period: string): number => {
  const ev = player.evaluations?.[period];
  if (!ev?.skills) return 5;
  return skillKeys.reduce((s, k) => s + (ev.skills[k] ?? 5), 0) / skillKeys.length;
};

const toScore = (avg: number) => Math.round(avg * 10);

export interface CompareEntry {
  player: Player;
  team: TeamEnriched;
}

interface ComparePlayersModalProps {
  isVisible: boolean;
  onClose: () => void;
  entries: CompareEntry[];
  attendanceRecords: AttendanceRow[];
}

const ComparePlayersModal = ({ isVisible, onClose, entries, attendanceRecords }: ComparePlayersModalProps) => {
  if (!isVisible || entries.length < 2) return null;

  const periods = entries.map(e => e.team.evaluation_periods.at(-1) ?? '');

  const scores = entries.map((e, i) => toScore(calcSkillAvg(e.player, periods[i])));

  const attendance = entries.map(e => {
    const rows = attendanceRecords.filter(a => a.player_id === e.player.id);
    const sessions = [...new Set(rows.map(a => a.session_date))];
    return sessions.length ? Math.round((rows.filter(a => a.present).length / sessions.length) * 100) : null;
  });

  const homework = entries.map(e => {
    const assigned = e.team.assigned_homework_ids.length;
    const completed = e.player.completed_homework_ids.filter(id => e.team.assigned_homework_ids.includes(id)).length;
    return assigned ? Math.round((completed / assigned) * 100) : null;
  });

  const radarData = SKILL_GROUPS.map(group => {
    const row: Record<string, string | number> = { subject: group.label };
    entries.forEach((e, i) => {
      const avg = group.skills.reduce((s, sk) => s + (e.player.evaluations?.[periods[i]]?.skills?.[sk.key] ?? 5), 0) / group.skills.length;
      row[`p${i}`] = +avg.toFixed(1);
    });
    return row;
  });

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="text-base font-bold text-gray-900">Spelers vergelijken</h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors shrink-0">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Player headers + score cards */}
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${entries.length}, minmax(0, 1fr))` }}>
                {entries.map((e, i) => (
                  <div key={e.player.id} className="text-center">
                    <img src={e.player.avatar_url} alt={e.player.name} className="w-12 h-12 rounded-full mx-auto border-2" style={{ borderColor: COMPARE_COLORS[i] }} />
                    <p className="text-sm font-bold text-gray-900 mt-1.5 truncate">{e.player.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{e.team.team_name}{e.player.position ? ` · ${e.player.position}` : ''}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${entries.length}, minmax(0, 1fr))` }}>
                {entries.map((e, i) => (
                  <div key={e.player.id} className="p-3 rounded-xl bg-gray-50 text-center space-y-2">
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Score</p>
                      <p className="text-xl font-black" style={{ color: scoreColor(scores[i]) }}>{scores[i]}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Aanwezig</p>
                      <p className="text-sm font-bold text-gray-900">{attendance[i] !== null ? `${attendance[i]}%` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Huiswerk</p>
                      <p className="text-sm font-bold text-gray-900">{homework[i] !== null ? `${homework[i]}%` : '—'}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Radar overlay */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Skill-profiel</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="70%">
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                      {entries.map((e, i) => (
                        <Radar key={e.player.id} name={e.player.name} dataKey={`p${i}`} stroke={COMPARE_COLORS[i]} fill={COMPARE_COLORS[i]} fillOpacity={0.2} />
                      ))}
                      <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detailed skill table */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Alle vaardigheden</p>
                <div className="space-y-4">
                  {SKILL_GROUPS.map(group => (
                    <div key={group.key}>
                      <p className="text-xs font-semibold mb-1.5" style={{ color: group.color }}>{group.label}</p>
                      <div className="space-y-1">
                        {group.skills.map(sk => {
                          const values = entries.map((e, i) => e.player.evaluations?.[periods[i]]?.skills?.[sk.key] ?? 5);
                          const max = Math.max(...values);
                          const allEqual = values.every(v => v === max);
                          return (
                            <div key={sk.key} className="grid items-center gap-2 text-xs" style={{ gridTemplateColumns: `1fr repeat(${entries.length}, 3rem)` }}>
                              <span className="text-gray-500 truncate">{SKILL_LABELS[sk.key] ?? sk.label}</span>
                              {values.map((v, i) => (
                                <span key={i} className={`text-center rounded-md py-1 ${!allEqual && v === max ? 'font-black text-white' : 'font-semibold text-gray-700 bg-gray-50'}`} style={!allEqual && v === max ? { backgroundColor: COMPARE_COLORS[i] } : undefined}>
                                  {v}
                                </span>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button onClick={onClose} className="px-5 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity text-sm" style={{ backgroundColor: '#16A34A' }}>
                  Sluiten
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ComparePlayersModal;
