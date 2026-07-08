import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle2, Camera } from 'lucide-react';
import Card from '../ui/Card';
import VideoSubmissionCard from '../homework/VideoSubmissionCard';
import { getYoutubeEmbedUrl } from '../../utils/youtube';
import { COACH_COLOR } from '../../utils/constants';
import type { Player, CustomHomework, HomeworkSubmission } from '../../types';

interface HomeworkItemProps {
  hw: CustomHomework;
  player: Player;
  teamId: string;
  submissions: HomeworkSubmission[];
  onSubmissionComplete: (s: HomeworkSubmission) => void;
  isFocused?: boolean;
}

const HomeworkItem = ({ hw, player, teamId, submissions, onSubmissionComplete, isFocused = false }: HomeworkItemProps) => {
  const isCompleted = player.completed_homework_ids.includes(hw.id);
  const embedUrl = getYoutubeEmbedUrl(hw.youtube_url);
  const latestSubmission = submissions
    .filter(s => s.homework_id === hw.id && s.player_id === player.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden"
      style={
        isCompleted
          ? { background: '#ecfdf5', border: '1px solid #a7f3d0' }
          : isFocused
          ? { background: '#ffffff', border: `1px solid ${COACH_COLOR}40` }
          : { background: '#f9fafb', border: '1px solid #e5e7eb' }
      }
    >
      {/* Accent stripe voor gefocust item */}
      {isFocused && !isCompleted && (
        <div
          className="h-0.5 w-full"
          style={{ background: `linear-gradient(90deg, ${COACH_COLOR}, ${COACH_COLOR}30, transparent)` }}
        />
      )}

      <div className="p-4">
        {/* Tag */}
        {isFocused && !isCompleted && (
          <div className="mb-3">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${COACH_COLOR}12`, color: COACH_COLOR, border: `1px solid ${COACH_COLOR}25` }}
            >
              🎯 Jouw actieve oefening
            </span>
          </div>
        )}

        {/* Titel + beschrijving */}
        <div className="mb-4">
          <h4 className="font-bold text-base text-gray-900 leading-snug mb-1.5">
            {hw.week && <span className="text-gray-500 font-normal text-sm">{hw.week} · </span>}
            {hw.title}
          </h4>
          <p className="text-sm text-gray-500 leading-relaxed">{hw.description}</p>
        </div>

        {/* Voltooid status — alleen tonen als het klaar is */}
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-2 py-3 rounded-xl mb-4"
            style={{ backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}
          >
            <CheckCircle2 size={15} />
            <span className="text-sm font-bold">Voltooid!</span>
          </motion.div>
        )}

        {/* Instructie video */}
        {embedUrl && (
          <div className="mb-4 aspect-video rounded-xl overflow-hidden">
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

        {/* Video upload — het ENIGE pad naar voltooiing */}
        {!isCompleted && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-3">
              <Camera size={14} style={{ color: COACH_COLOR }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: COACH_COLOR }}>
                Upload je uitvoering voor feedback
              </span>
            </div>
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
  onSubmissionComplete: (submission: HomeworkSubmission) => void;
  focusedId?: string;
}

const PlayerHomeworkCard = ({
  player, teamId, customHomework, assignedHomeworkIds, submissions,
  onSubmissionComplete, focusedId,
}: PlayerHomeworkCardProps) => {
  const assignedTasks = customHomework.filter(hw => assignedHomeworkIds.includes(hw.id));

  if (assignedTasks.length === 0) {
    return (
      <Card>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ClipboardList size={20} style={{ color: COACH_COLOR }} /> Huiswerk
        </h3>
        <p className="text-gray-500">Er is momenteel geen huiswerk toegewezen.</p>
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
        <ClipboardList size={20} style={{ color: COACH_COLOR }} /> Jouw Huiswerk
      </h3>
      <div className="space-y-3">
        {sorted.map(hw => (
          <HomeworkItem
            key={hw.id}
            hw={hw}
            player={player}
            teamId={teamId}
            submissions={submissions}
            onSubmissionComplete={onSubmissionComplete}
            isFocused={hw.id === focusedId && !player.completed_homework_ids.includes(hw.id)}
          />
        ))}
      </div>
    </Card>
  );
};

export default PlayerHomeworkCard;
