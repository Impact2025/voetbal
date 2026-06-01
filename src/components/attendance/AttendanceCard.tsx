import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck, CalendarX } from 'lucide-react';
import Card from '../ui/Card';
import { NEON_COLOR } from '../../utils/constants';
import type { Player, AttendanceRecord } from '../../types';

interface AttendanceCardProps {
  players: Player[];
  records: AttendanceRecord[];
}

const AttendanceCard = ({ players, records }: AttendanceCardProps) => {
  const stats = useMemo(() => {
    return players.map(player => {
      const playerRecords = records.filter(r => r.player_id === player.id);
      const sessions = [...new Map(playerRecords.map(r => [`${r.session_date}_${r.session_type}`, r])).values()];
      const recent = sessions.sort((a, b) => b.session_date.localeCompare(a.session_date)).slice(0, 10);
      const present = recent.filter(r => r.present).length;
      const pct = recent.length > 0 ? Math.round((present / recent.length) * 100) : null;
      const absenceReasons = recent.filter(r => !r.present && r.notes).map(r => r.notes!);
      return { player, pct, total: recent.length, present, absenceReasons };
    });
  }, [players, records]);

  if (players.length === 0) {
    return (
      <Card>
        <div className="text-center py-10 text-gray-500">
          <CalendarCheck size={36} className="mx-auto mb-3 text-gray-700" />
          <p>Voeg spelers toe om aanwezigheid bij te houden.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Aanwezigheid (laatste 10 sessies)</p>
      <div className="space-y-4">
        {stats.map(({ player, pct, total, present, absenceReasons }, idx) => {
          const color = pct === null ? '#6b7280' : pct >= 80 ? '#4ade80' : pct >= 60 ? '#fb923c' : '#f87171';
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <div className="flex items-center gap-3 mb-1.5">
                <img src={player.avatar_url} alt={player.name} className="w-8 h-8 rounded-full shrink-0 border border-gray-700" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate">{player.name}</span>
                    <span className="text-sm font-black tabular-nums shrink-0 ml-2" style={{ color: pct === null ? '#6b7280' : color }}>
                      {pct === null ? '—' : `${pct}%`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                      <motion.div
                        className="h-1.5 rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: pct === null ? 0 : `${pct}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.05 }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-600 tabular-nums shrink-0">
                      {total === 0 ? 'Geen sessies' : `${present}/${total}`}
                    </span>
                  </div>
                </div>
              </div>
              {absenceReasons.length > 0 && (
                <div className="ml-11 flex flex-wrap gap-1">
                  {absenceReasons.slice(0, 2).map((reason, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/40 text-red-400 border border-red-900/40">
                      {reason}
                    </span>
                  ))}
                  {absenceReasons.length > 2 && (
                    <span className="text-[10px] text-gray-600">+{absenceReasons.length - 2} meer</span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
};

export default AttendanceCard;
