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
      className="rounded-xl transition-all"
      style={
        isFocused && !isCompleted
          ? {
              padding: '1px',
              background: `linear-gradient(135deg, ${NEON_COLOR}60, ${NEON_COLOR}20)`,
            }
          : undefined
      }
    >
      <div
        className={`p-4 rounded-xl transition-all ${
          isCompleted
            ? 'bg-emerald-950/30 border border-emerald-900/40'
            : isFocused
            ? 'bg-gray-900 border-0'
            : 'bg-gray-800/40 border border-gray-700/30'
        }`}
      >
        {/* "Actieve oefening" tag — alleen op gefocust + niet voltooid */}
        {isFocused && !isCompleted && (
          <div className="flex items-center gap-1.5 mb-3">
            <span
              className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${NEON_COLOR}15`, color: NEON_COLOR }}
            >
              🎯 Jouw actieve oefening
            </span>
          </div>
        )}

        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base text-white leading-snug">
              {hw.week && <span className="text-gray-500 font-normal">{hw.week}: </span>}
              {hw.title}
            </h4>
            <p className="mt-1.5 text-sm text-gray-300 leading-relaxed">{hw.description}</p>
          </div>

          {/* 3D button + confetti container */}
          <div className="relative shrink-0">
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
                    x: Math.cos(rad) * (55 + i * 2),
                    y: Math.sin(rad) * (55 + i * 2),
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
              whileTap={{ scale: 0.90, y: 3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex items-center gap-2 py-2.5 px-5 rounded-xl text-sm font-bold relative"
              style={isCompleted
                ? { backgroundColor: '#065f46', color: '#4ade80', boxShadow: '0 0 0 1px #4ade8030' }
                : isFocused
                ? { backgroundColor: NEON_COLOR, color: '#000', boxShadow: `0 4px 0 ${NEON_COLOR}50` }
                : { backgroundColor: '#111827', color: '#e5e7eb', boxShadow: '0 4px 0 #030712, 0 0 0 1px #374151' }
              }
            >
              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.div key="done" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <CheckCircle2 size={15} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
              {isCompleted ? 'Voltooid!' : 'Markeer als voltooid'}
            </motion.button>
          </div>
        </div>

        {embedUrl && (
          <div className="mt-4 aspect-video rounded-lg overflow-hidden">
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

  // Gefocust item altijd bovenaan
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
