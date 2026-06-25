import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import Card from '../ui/Card';
import VideoSubmissionCard from '../homework/VideoSubmissionCard';
import XPFloater from '../feedback/XPFloater';
import { getYoutubeEmbedUrl } from '../../utils/youtube';
import { NEON_COLOR } from '../../utils/constants';
import type { Player, CustomHomework, HomeworkSubmission } from '../../types';

const CONFETTI_COLORS = ['#4ade80', '#facc15', '#38bdf8', '#f97316', '#c084fc', '#ffffff', '#fb7185'];
const ANGLES = Array.from({ length: 14 }, (_, i) => (i / 14) * 360);

interface HomeworkItemProps {
  hw: CustomHomework;
  player: Player;
  teamId: string;
  submissions: HomeworkSubmission[];
  onToggleStatus: (id: string) => void;
  onSubmissionComplete: (s: HomeworkSubmission) => void;
  isFocused?: boolean;
}

const HomeworkItem = ({ hw, player, teamId, submissions, onToggleStatus, onSubmissionComplete, isFocused = false }: HomeworkItemProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const isCompleted = player.completed_homework_ids.includes(hw.id);
  const embedUrl = getYoutubeEmbedUrl(hw.youtube_url);
  const latestSubmission = submissions
    .filter(s => s.homework_id === hw.id && s.player_id === player.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  const handleToggle = () => {
    if (!isCompleted) {
      setShowConfetti(true);
      setShowXP(true);
      setTimeout(() => setShowConfetti(false), 750);
      setTimeout(() => setShowXP(false), 1800);
    }
    onToggleStatus(hw.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden"
      style={
        isCompleted
          ? { background: 'rgba(6,95,70,0.15)', border: '1px solid rgba(74,222,128,0.12)' }
          : isFocused
          ? { background: 'rgba(15,17,23,1)', border: `1px solid ${NEON_COLOR}30`, boxShadow: `0 0 20px ${NEON_COLOR}08` }
          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }
      }
    >
      {/* Neon accent stripe voor gefocust item */}
      {isFocused && !isCompleted && (
        <div
          className="h-0.5 w-full"
          style={{ background: `linear-gradient(90deg, ${NEON_COLOR}, ${NEON_COLOR}30, transparent)` }}
        />
      )}

      <div className="p-4">
        {/* Tag */}
        {isFocused && !isCompleted && (
          <div className="mb-3">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${NEON_COLOR}12`, color: NEON_COLOR, border: `1px solid ${NEON_COLOR}25` }}
            >
              🎯 Jouw actieve oefening
            </span>
          </div>
        )}

        {/* Titel + beschrijving — volledige breedte */}
        <div className="mb-4">
          <h4 className="font-bold text-base text-white leading-snug mb-1.5">
            {hw.week && <span className="text-gray-500 font-normal text-sm">{hw.week} · </span>}
            {hw.title}
          </h4>
          <p className="text-sm text-gray-400 leading-relaxed">{hw.description}</p>
        </div>

        {/* Voltooid-knop — volledige breedte onder de tekst */}
        <div className="relative">
          <XPFloater visible={showXP} eventType="homework_done" />

          {showConfetti && ANGLES.map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <motion.div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 6 + (i % 3) * 3,
                  height: 6 + (i % 3) * 3,
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  left: '50%',
                  top: '50%',
                  marginLeft: -4,
                  marginTop: -4,
                  zIndex: 10,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                animate={{
                  x: Math.cos(rad) * (65 + i * 3),
                  y: Math.sin(rad) * (65 + i * 3),
                  opacity: 0,
                  scale: 0.3,
                  rotate: 360,
                }}
                transition={{ duration: 0.65, ease: [0.2, 0.9, 0.3, 1] }}
              />
            );
          })}

          <motion.button
            onClick={handleToggle}
            whileTap={{ scale: 0.97, y: 2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-opacity"
            style={
              isCompleted
                ? { backgroundColor: 'rgba(6,95,70,0.6)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }
                : isFocused
                ? { backgroundColor: NEON_COLOR, color: '#000', boxShadow: `0 4px 16px ${NEON_COLOR}40` }
                : { backgroundColor: 'rgba(255,255,255,0.07)', color: '#e5e7eb', border: '1px solid rgba(255,255,255,0.1)' }
            }
          >
            <AnimatePresence mode="wait">
              {isCompleted && (
                <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <CheckCircle2 size={15} />
                </motion.div>
              )}
            </AnimatePresence>
            {isCompleted ? 'Voltooid!' : 'Markeer als voltooid'}
          </motion.button>
        </div>

        {embedUrl && (
          <div className="mt-4 aspect-video rounded-xl overflow-hidden">
            <iframe
              width="100%" height="100%"
              src={embedUrl}
              title={hw.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <VideoSubmissionCard
          homework={hw}
          player={player}
          teamId={teamId}
          existingSubmission={latestSubmission}
          onSubmissionComplete={onSubmissionComplete}
        />
      </div>
    </motion.div>
  );
};

interface PlayerHomeworkCardProps {
  player: Player;
  teamId: string;
  customHomework: CustomHomework[];
  assignedHomeworkIds: string[];
  submissions: HomeworkSubmission[];
  onToggleStatus: (homeworkId: string) => void;
  onSubmissionComplete: (submission: HomeworkSubmission) => void;
  focusedId?: string;
}

const PlayerHomeworkCard = ({
  player, teamId, customHomework, assignedHomeworkIds, submissions,
  onToggleStatus, onSubmissionComplete, focusedId,
}: PlayerHomeworkCardProps) => {
  const assignedTasks = customHomework.filter(hw => assignedHomeworkIds.includes(hw.id));

  if (assignedTasks.length === 0) {
    return (
      <Card>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ClipboardList size={20} className="text-[--neon-color]" /> Huiswerk
        </h3>
        <p className="text-gray-400">Er is momenteel geen huiswerk toegewezen.</p>
      </Card>
    );
  }

  const sorted = focusedId
    ? [
        ...assignedTasks.filter(hw => hw.id === focusedId),
        ...assignedTasks.filter(hw => hw.id !== focusedId),
      ]
    : assignedTasks;

  return (
    <Card>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <ClipboardList size={20} className="text-[--neon-color]" /> Jouw Huiswerk
      </h3>
      <div className="space-y-3">
        {sorted.map(hw => (
          <HomeworkItem
            key={hw.id}
            hw={hw}
            player={player}
            teamId={teamId}
            submissions={submissions}
            onToggleStatus={onToggleStatus}
            onSubmissionComplete={onSubmissionComplete}
            isFocused={hw.id === focusedId && !player.completed_homework_ids.includes(hw.id)}
          />
        ))}
      </div>
    </Card>
  );
};

export default PlayerHomeworkCard;
