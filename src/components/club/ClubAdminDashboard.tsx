import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Trophy, Copy, CheckCircle2, LogOut, Building2, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { NEON_COLOR, skillKeys } from '../../utils/constants';
import { copyToClipboard } from '../../utils/clipboard';
import Card from '../ui/Card';
import type { UserData } from '../../types';

interface ClubAdminDashboardProps {
  userData: UserData;
  onLogout: () => void;
}

interface TeamSummary {
  id: string;
  team_name: string;
  team_class: string;
  playerCount: number;
  avgSkill: number;
  coach_email?: string;
}

const ClubAdminDashboard = ({ userData, onLogout }: ClubAdminDashboardProps) => {
  const [clubName, setClubName] = useState('');
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData.clubId) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data: club } = await supabase.from('clubs').select('name').eq('id', userData.clubId).single();
        if (club) setClubName(club.name);

        const { data: teamsData } = await supabase.from('teams').select('id, team_name, team_class, coach_id').eq('club_id', userData.clubId);
        if (!teamsData) return;

        const summaries: TeamSummary[] = [];
        let total = 0;

        for (const team of teamsData) {
          const { data: players } = await supabase.from('players').select('evaluations').eq('team_id', team.id);
          const count = players?.length ?? 0;
          total += count;

          const avgSkill = count > 0 ? players!.reduce((sum, p) => {
            const firstPeriod = Object.values(p.evaluations ?? {})[0] as { skills?: Record<string, number> } | undefined;
            if (!firstPeriod?.skills) return sum;
            const s = skillKeys.reduce((a, k) => a + (firstPeriod.skills![k] ?? 5), 0) / skillKeys.length;
            return sum + s;
          }, 0) / count : 0;

          summaries.push({ id: team.id, team_name: team.team_name, team_class: team.team_class, playerCount: count, avgSkill });
        }

        setTeams(summaries);
        setTotalPlayers(total);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [userData.clubId]);

  const handleCopyClubId = async () => {
    if (userData.clubId) {
      await copyToClipboard(userData.clubId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen" style={{ '--neon-color': NEON_COLOR } as React.CSSProperties}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#090B0F]/90 backdrop-blur-xl border-b border-white/[0.06] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Building2 size={20} style={{ color: NEON_COLOR }} />
            <h1 className="text-xl font-black tracking-wide truncate" style={{ color: NEON_COLOR, textShadow: `0 0 20px ${NEON_COLOR}40` }}>
              {clubName || 'Club Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyClubId}
              className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-gray-800/80 border border-gray-700 hover:bg-gray-700 transition-colors"
            >
              <span className="text-gray-400">Club ID:</span>
              <span className="font-mono font-bold text-white">{userData.clubId}</span>
              {copied ? <CheckCircle2 size={13} className="text-green-400" /> : <Copy size={13} className="text-gray-500" />}
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); onLogout(); }}
              className="p-2 rounded-lg bg-gray-800/80 border border-gray-700 hover:bg-red-900/40 transition-colors text-red-400"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        >
          <Card className="text-center py-4">
            <Building2 size={18} className="mx-auto mb-1" style={{ color: NEON_COLOR }} />
            <div className="text-2xl font-black" style={{ color: NEON_COLOR }}>{teams.length}</div>
            <div className="text-xs text-gray-400 font-semibold">Teams</div>
          </Card>
          <Card className="text-center py-4">
            <Users size={18} className="mx-auto mb-1" style={{ color: NEON_COLOR }} />
            <div className="text-2xl font-black" style={{ color: NEON_COLOR }}>{totalPlayers}</div>
            <div className="text-xs text-gray-400 font-semibold">Spelers</div>
          </Card>
          <Card className="text-center py-4 col-span-2 sm:col-span-1">
            <Trophy size={18} className="mx-auto mb-1" style={{ color: NEON_COLOR }} />
            <div className="text-2xl font-black" style={{ color: NEON_COLOR }}>
              {teams.length > 0 ? Math.round(teams.reduce((s, t) => s + t.avgSkill, 0) / teams.length * 10) : '—'}
            </div>
            <div className="text-xs text-gray-400 font-semibold">Club Score</div>
          </Card>
        </motion.div>

        {/* Club ID delen */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${NEON_COLOR}15` }}>
              <Shield size={18} style={{ color: NEON_COLOR }} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm mb-1">Coaches uitnodigen</h3>
              <p className="text-xs text-gray-400 mb-3">
                Deel je Club ID met coaches. Coaches kunnen dit invullen bij registratie om hun team onder deze club te koppelen.
              </p>
              <button
                onClick={handleCopyClubId}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors text-sm"
              >
                <span className="font-mono font-bold text-white">{userData.clubId}</span>
                {copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
              </button>
            </div>
          </div>
        </Card>

        {/* Teams overzicht */}
        <div>
          <h2 className="text-lg font-black mb-3">Teams</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-800/40 rounded-2xl animate-pulse" />)}
            </div>
          ) : teams.length === 0 ? (
            <Card>
              <div className="text-center py-10 text-gray-500">
                <Users size={36} className="mx-auto mb-3 text-gray-700" />
                <p>Nog geen teams gekoppeld aan deze club.</p>
                <p className="text-xs mt-1">Deel je Club ID met coaches bij registratie.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {teams.map((team, idx) => {
                const score = Math.round(team.avgSkill * 10);
                const scoreColor = score >= 70 ? NEON_COLOR : score >= 50 ? '#a78bfa' : '#f87171';
                return (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                  >
                    <Card>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${NEON_COLOR}15` }}>
                          <Users size={20} style={{ color: NEON_COLOR }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold truncate">{team.team_name}</h3>
                          <p className="text-xs text-gray-500">{team.team_class} · {team.playerCount} speler{team.playerCount !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-2xl font-black" style={{ color: scoreColor }}>{team.playerCount > 0 ? score : '—'}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wide">score</div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClubAdminDashboard;
