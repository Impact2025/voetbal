import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Send, X, Loader2, MessageSquare,
  CheckCircle2, Clock, UserCircle2, Radio, ChevronDown,
  Trophy, CalendarCheck, TrendingUp, TrendingDown, Minus, Users,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { NEON_COLOR } from '../../utils/constants';
import Card from '../ui/Card';
import toast from 'react-hot-toast';
import type { SentMessage } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TrainerRow {
  coachId: string;
  email: string;
  teamId: string;
  teamName: string;
  teamClass: string;
  playerCount: number;
  avgScore: number;
  attendanceRate: number | null;
  trend: 'up' | 'down' | 'stable' | 'new';
  trendDelta: number;
}

interface TeamSummary {
  id: string;
  team_class: string;
  players: { id: string }[];
  avgScore: number;
  attendanceRate: number | null;
  trend: 'up' | 'down' | 'stable' | 'new';
  trendDelta: number;
}

interface TrainersTabProps {
  clubId: string;
  clubName: string;
  senderEmail: string;
  teams: TeamSummary[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toScore = (avg: number) => Math.round(avg * 10);

const scoreColor = (s: number) =>
  s >= 70 ? NEON_COLOR : s >= 55 ? '#a78bfa' : s >= 40 ? '#fbbf24' : '#f87171';

const TrendIcon = ({ trend }: { trend: TrainerRow['trend'] }) => {
  if (trend === 'up') return <TrendingUp size={12} style={{ color: NEON_COLOR }} />;
  if (trend === 'down') return <TrendingDown size={12} className="text-red-400" />;
  if (trend === 'stable') return <Minus size={12} className="text-gray-500" />;
  return <span className="text-[10px] text-gray-600">nieuw</span>;
};

// ─── Message Composer Modal ───────────────────────────────────────────────────

interface ComposerProps {
  recipient: TrainerRow | null;
  allTrainers: TrainerRow[];
  clubName: string;
  senderEmail: string;
  clubId: string;
  onClose: () => void;
  onSent: (msg: SentMessage) => void;
}

const MessageComposer = ({ recipient, allTrainers, clubName, senderEmail, clubId, onClose, onSent }: ComposerProps) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const isBroadcast = recipient === null;
  const targets = isBroadcast ? allTrainers : [recipient!];
  const toEmails = targets.map(t => t.email);
  const toNames = targets.map(t => t.teamName);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Vul onderwerp en bericht in.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: toEmails, toNames, subject, body, clubName, senderEmail }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Versturen mislukt');

      const { data: { user } } = await supabase.auth.getUser();
      const { data: msgRow } = await supabase
        .from('club_messages')
        .insert({ club_id: clubId, sent_by: user?.id, to_emails: toEmails, to_names: toNames, subject, body })
        .select()
        .single();

      if (msgRow) onSent(msgRow as SentMessage);
      toast.success(`Bericht verstuurd naar ${toEmails.length} trainer${toEmails.length !== 1 ? 's' : ''}!`);
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-[#111318] border border-gray-800 rounded-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Mail size={16} style={{ color: NEON_COLOR }} />
            <span className="font-bold text-sm">
              {isBroadcast ? `Bericht aan alle ${targets.length} trainers` : `Bericht aan ${recipient?.teamName}`}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {targets.map(t => (
              <span key={t.coachId} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-800 text-gray-300">
                <UserCircle2 size={11} style={{ color: NEON_COLOR }} />
                {t.teamName} · {t.email}
              </span>
            ))}
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Onderwerp</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="bv. Teambespreking volgende week"
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Bericht</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Typ hier je bericht aan de trainer(s)..."
              rows={6}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors text-sm font-semibold"
            >
              Annuleren
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: NEON_COLOR, color: '#000' }}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? 'Versturen...' : `Verstuur${toEmails.length > 1 ? ` (${toEmails.length})` : ''}`}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TrainersTab = ({ clubId, clubName, senderEmail, teams }: TrainersTabProps) => {
  const [trainers, setTrainers] = useState<TrainerRow[]>([]);
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerRecipient, setComposerRecipient] = useState<TrainerRow | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [{ data: trainerEmails }, { data: messages }] = await Promise.all([
          supabase.rpc('get_club_trainer_emails', { p_club_id: clubId }),
          supabase
            .from('club_messages')
            .select('id, to_names, subject, body, sent_at')
            .eq('club_id', clubId)
            .order('sent_at', { ascending: false })
            .limit(20),
        ]);

        if (trainerEmails) {
          const rows: TrainerRow[] = (trainerEmails as { coach_id: string; email: string; team_id: string; team_name: string }[]).map(r => {
            const team = teams.find(t => t.id === r.team_id);
            return {
              coachId: r.coach_id,
              email: r.email,
              teamId: r.team_id,
              teamName: r.team_name,
              teamClass: team?.team_class ?? '',
              playerCount: team?.players.length ?? 0,
              avgScore: toScore(team?.avgScore ?? 0),
              attendanceRate: team?.attendanceRate ?? null,
              trend: team?.trend ?? 'new',
              trendDelta: team?.trendDelta ?? 0,
            };
          });
          setTrainers(rows);
        }

        if (messages) setSentMessages(messages as SentMessage[]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [clubId, teams]);

  const openComposer = (trainer: TrainerRow | null) => {
    setComposerRecipient(trainer);
    setComposerOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin h-8 w-8" style={{ color: NEON_COLOR }} />
      </div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

        {trainers.length > 1 && (
          <button
            onClick={() => openComposer(null)}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border-2 font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ borderColor: NEON_COLOR, color: NEON_COLOR, backgroundColor: `${NEON_COLOR}10` }}
          >
            <Radio size={16} />
            Bericht aan alle {trainers.length} trainers
          </button>
        )}

        {trainers.length === 0 ? (
          <Card>
            <div className="text-center py-14 text-gray-500">
              <Users size={36} className="mx-auto mb-3 text-gray-700" />
              <p className="font-semibold">Nog geen trainers gekoppeld.</p>
              <p className="text-xs mt-1 text-gray-600">Trainers koppelen hun team via het Club ID bij registratie.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {trainers.map((trainer, idx) => (
              <motion.div
                key={trainer.coachId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-gray-800">
                      <UserCircle2 size={22} className="text-gray-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{trainer.teamName}</span>
                        {trainer.teamClass && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                            {trainer.teamClass}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">{trainer.email}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Users size={9} />{trainer.playerCount} spelers
                        </span>
                        {trainer.avgScore > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: scoreColor(trainer.avgScore) }}>
                            <Trophy size={9} />{trainer.avgScore}
                          </span>
                        )}
                        {trainer.attendanceRate !== null && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-500">
                            <CalendarCheck size={9} />{Math.round(trainer.attendanceRate)}%
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <TrendIcon trend={trainer.trend} />
                          {trainer.trend !== 'new' && trainer.trend !== 'stable' && (
                            <span className={`text-[10px] font-bold ${trainer.trend === 'up' ? '' : 'text-red-400'}`}
                              style={trainer.trend === 'up' ? { color: NEON_COLOR } : undefined}>
                              {trainer.trend === 'up' ? '+' : '-'}{Math.abs(Math.round(trainer.trendDelta * 10))} pnt
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => openComposer(trainer)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white transition-all"
                    >
                      <Mail size={13} />
                      <span className="hidden sm:inline">Bericht</span>
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {sentMessages.length > 0 && (
          <div>
            <button
              onClick={() => setShowHistory(v => !v)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-3"
            >
              <Clock size={13} />
              Verzonden berichten ({sentMessages.length})
              <ChevronDown size={13} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  {sentMessages.map(msg => (
                    <Card key={msg.id} className="!py-3">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: `${NEON_COLOR}15` }}>
                          <MessageSquare size={12} style={{ color: NEON_COLOR }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{msg.subject}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            Aan: {msg.to_names?.join(', ') || '—'} · {new Date(msg.sent_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">{msg.body}</p>
                        </div>
                        <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                      </div>
                    </Card>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {composerOpen && (
          <MessageComposer
            recipient={composerRecipient}
            allTrainers={trainers}
            clubName={clubName}
            senderEmail={senderEmail}
            clubId={clubId}
            onClose={() => setComposerOpen(false)}
            onSent={msg => setSentMessages(prev => [msg, ...prev])}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default TrainersTab;
