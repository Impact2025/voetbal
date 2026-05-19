import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import Card from '../ui/Card';
import { getYoutubeEmbedUrl } from '../../utils/youtube';
import type { Player, CustomHomework } from '../../types';

interface PlayerHomeworkCardProps {
  player: Player;
  customHomework: CustomHomework[];
  assignedHomeworkIds: string[];
  onToggleStatus: (homeworkId: string) => void;
}

const PlayerHomeworkCard = ({ player, customHomework, assignedHomeworkIds, onToggleStatus }: PlayerHomeworkCardProps) => {
  const assignedTasks = customHomework.filter(hw => assignedHomeworkIds.includes(hw.id));

  if (assignedTasks.length === 0) {
    return (
      <Card>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ClipboardList size={20} className="text-[--neon-color]" /> Huiswerk</h3>
        <p className="text-gray-400">Er is momenteel geen huiswerk toegewezen.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ClipboardList size={20} className="text-[--neon-color]" /> Jouw Huiswerk</h3>
      <div className="space-y-4">
        {assignedTasks.map(hw => {
          const isCompleted = player.completed_homework_ids.includes(hw.id);
          const embedUrl = getYoutubeEmbedUrl(hw.youtube_url);
          return (
            <div key={hw.id} className={`p-4 rounded-lg transition-all ${isCompleted ? 'bg-green-500/10 border-l-4 border-green-500' : 'bg-gray-800/50'}`}>
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h4 className="font-bold text-lg">{hw.week && `${hw.week}: `}{hw.title}</h4>
                  <p className="mt-2 text-gray-300 max-w-prose">{hw.description}</p>
                </div>
                <button
                  onClick={() => onToggleStatus(hw.id)}
                  className={`shrink-0 flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${isCompleted ? 'bg-green-500/80 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  <AnimatePresence>
                    {isCompleted && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={16} /></motion.div>}
                  </AnimatePresence>
                  {isCompleted ? 'Voltooid!' : 'Markeer als voltooid'}
                </button>
              </div>
              {embedUrl && (
                <div className="mt-4 aspect-video rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    title={hw.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default PlayerHomeworkCard;
