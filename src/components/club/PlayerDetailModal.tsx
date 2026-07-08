import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Video, FileText, Loader2 } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { SKILL_GROUPS, SKILL_LABELS, skillKeys, testLabels, initialTestState } from '../../utils/constants';
import type { Player } from '../../types';
import type { TeamEnriched, AttendanceRow } from './ClubAdminDashboard';

interface SubmissionRow {
  id: string;
  homework_id: string;
  video_url: string | null;
  ai_feedback: string | null;
  feedback_status: string;
  created_at: string;
}

const ACCENT = '#16A34A';

const scoreColor = (score: number) =>
  score >= 70 ? '#16A34A' : score >= 55 ? '#7c3aed' : score >= 40 ? '#d97706' : '#dc2626';

const calcSkillAvg = (player: Player, period: string): number => {
  const ev = player.evaluations?.[period];
  if (!ev?.skills) return 5;
  return skillKeys.reduce((s, k) => s + (ev.skills[k] ?? 5), 0) / skillKeys.length;
};

const toScore = (avg: number) => Math.round(avg * 10);

interface PlayerDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  player: Player | null;
  team: TeamEnriched | null;
  attendanceRecords: AttendanceRow[];
  onLinkParent: (target: { id: string; teamId: string; name: string }) => void;
}

const PlayerDetailModal = ({ isVisible, onClose, player, team, attendanceRecords, onLinkParent }: PlayerDetailModalProps) => {
  const [period, setPeriod] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [homeworkTitles, setHomeworkTitles] = useState<Record<string, string>>({});
  const [loadingVideos, setLoadingVideos] = useState(false);

  useEffect(() => {
    if (player && team) setPeriod(team.evaluation_periods.at(-1) ?? '');
  }, [player, team]);

  useEffect(() => {
    if (!player) { setSubmissions([]); return; }
    setLoadingVideos(true);
    (async () => {
      const [{ data: subs }, { data: hw }] = await Promise.all([
        supabase.from('homework_submissions').select('*').eq('player_id', player.id).order('created_at', { ascending: false }),
        supabase.from('custom_homework').select('id,title').eq('team_id', player.team_id),
      ]);
      setSubmissions((subs || []) as SubmissionRow[]);
      setHomeworkTitles(Object.fromEntries((hw || []).map((h: { id: string; title: string }) => [h.id, h.title])));
      setLoadingVideos(false);
    })();
  }, [player]);

  if (!isVisible || !player || !team) return null;

  const score = toScore(calcSkillAvg(player, period));
  const ev = player.evaluations?.[period];

  const radarData = SKILL_GROUPS.map(group => {
    const playerAvg = group.skills.reduce((s, sk) => s + (ev?.skills?.[sk.key] ?? 5), 0) / group.skills.length;
    const teamAvg = group.skills.reduce((s, sk) => {
      const a = team.players.length
        ? team.players.reduce((ps, p) => ps + (p.evaluations?.[period]?.skills?.[sk.key] ?? 5), 0) / team.players.length
        : 5;
      return s + a;
    }, 0) / group.skills.length;
    return { subject: group.label, speler: +playerAvg.toFixed(1), team: +teamAvg.toFixed(1) };
  });

  const skillEntries = ev?.skills ? Object.entries(ev.skills).sort((a, b) => b[1] - a[1]) : [];
  const strengths = skillEntries.slice(0, 2);
  const weaknesses = skillEntries.slice(-2).reverse();

  const testData = ev?.tests || initialTestState;
  const hasTestResults = Object.values(testData).some(cat =>
    Object.values(cat as Record<string, string>).some(v => v !== '')
  );

  const playerAttendance = attendanceRecords.filter(a => a.player_id === player.id);
  const attendanceSessions = [...new Set(playerAttendance.map(a => a.session_date))];
  const attendanceRate = attendanceSessions.length
    ? Math.round((playerAttendance.filter(a => a.present).length / attendanceSessions.length) * 100)
    : null;

  const assignedCount = team.assigned_homework_ids.length;
  const completedCount = player.completed_homework_ids.filter(id => team.assigned_homework_ids.includes(id)).length;
  const hwRate = assignedCount ? Math.round((completedCount / assignedCount) * 100) : null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3 min-w-0">
                <img src={player.avatar_url} alt={player.name} className="w-11 h-11 rounded-full shrink-0 border-2 border-gray-100" />
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate">{player.name}</h3>
                  <p className="text-xs text-gray-400 truncate">
                    {team.team_name}{player.position ? ` · ${player.position}` : ''}{player.age ? ` · ${player.age} jr` : ''}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors shrink-0">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Period selector */}
              {team.evaluation_periods.length > 1 && (
                <div className="flex gap-1.5 flex-wrap">
                  {team.evaluation_periods.map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${p === period ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      style={p === period ? { backgroundColor: ACCENT } : undefined}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {/* Score + stats row */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Score</p>
                  <p className="text-2xl font-black" style={{ color: scoreColor(score) }}>{score}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Aanwezigheid</p>
                  <p className="text-2xl font-black text-gray-900">{attendanceRate !== null ? `${attendanceRate}%` : '—'}</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Huiswerk</p>
                  <p className="text-2xl font-black text-gray-900">{hwRate !== null ? `${hwRate}%` : '—'}</p>
                </div>
              </div>

              {/* Radar */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Skill-profiel vs. team</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="72%">
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
                      <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                      <Radar name="Speler" dataKey="speler" stroke={ACCENT} fill={ACCENT} fillOpacity={0.35} />
                      <Radar name="Team" dataKey="team" stroke="#9ca3af" fill="#9ca3af" fillOpacity={0.12} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Strong / weak */}
              {skillEntries.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Sterk in</p>
                    <div className="space-y-1">
                      {strengths.map(([key, val]) => (
                        <div key={key} className="flex justify-between text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
                          <span className="text-gray-600">{SKILL_LABELS[key] ?? key}</span>
                          <span className="font-bold text-gray-900">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Werk aan</p>
                    <div className="space-y-1">
                      {weaknesses.map(([key, val]) => (
                        <div key={key} className="flex justify-between text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
                          <span className="text-gray-600">{SKILL_LABELS[key] ?? key}</span>
                          <span className="font-bold text-gray-900">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Testresultaten */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1.5">
                  <FileText size={11} style={{ color: ACCENT }} /> Testresultaten ({period})
                </p>
                {!hasTestResults ? (
                  <p className="text-xs text-gray-400">Nog geen testresultaten ingevoerd voor deze periode.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    {Object.entries(testLabels).map(([categoryKey, categoryData]) => {
                      const catData = (testData[categoryKey as keyof typeof testData] as Record<string, string>) || {};
                      const entries = Object.entries(categoryData.tests).filter(([testKey]) => catData[testKey]);
                      if (!entries.length) return null;
                      return (
                        <div key={categoryKey}>
                          <p className="text-xs font-semibold text-gray-600 mb-1">{categoryData.label}</p>
                          <ul className="space-y-0.5">
                            {entries.map(([testKey, testLabel]) => (
                              <li key={testKey} className="flex justify-between text-xs">
                                <span className="text-gray-400">{testLabel.split(' (')[0]}</span>
                                <span className="font-bold text-gray-900">{catData[testKey]}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Video inzendingen */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1.5">
                  <Video size={11} style={{ color: ACCENT }} /> Video-inzendingen
                </p>
                {loadingVideos ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-2"><Loader2 size={12} className="animate-spin" /> Laden...</div>
                ) : submissions.length === 0 ? (
                  <p className="text-xs text-gray-400">Nog geen video's ingeleverd.</p>
                ) : (
                  <div className="space-y-2">
                    {submissions.map(sub => (
                      <details key={sub.id} className="rounded-xl bg-gray-50 p-2.5">
                        <summary className="flex items-center gap-2 cursor-pointer text-xs">
                          <span className="flex-1 font-semibold text-gray-900 truncate">{homeworkTitles[sub.homework_id] ?? 'Huiswerk'}</span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                            sub.feedback_status === 'done' ? 'bg-green-100 text-green-700'
                            : sub.feedback_status === 'error' ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                          }`}>
                            {sub.feedback_status === 'done' ? 'Klaar' : sub.feedback_status === 'error' ? 'Fout' : 'Bezig'}
                          </span>
                        </summary>
                        <div className="mt-2 space-y-2">
                          {sub.video_url && (
                            <video src={sub.video_url} controls className="w-full rounded-lg max-h-64" />
                          )}
                          {sub.ai_feedback && (
                            <p className="text-xs text-gray-600 whitespace-pre-line">{sub.ai_feedback}</p>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => onLinkParent({ id: player.id, teamId: player.team_id, name: player.name })}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Ouder koppelen
                </button>
                <button onClick={onClose} className="px-5 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity text-sm" style={{ backgroundColor: ACCENT }}>
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

export default PlayerDetailModal;
