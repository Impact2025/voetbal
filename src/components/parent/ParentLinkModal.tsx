import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart } from 'lucide-react';
import ParentLinkSection from './ParentLinkSection';

interface ParentLinkModalProps {
  isVisible: boolean;
  onClose: () => void;
  playerId: string;
  teamId: string;
  playerName: string;
}

const ParentLinkModal = ({ isVisible, onClose, playerId, teamId, playerName }: ParentLinkModalProps) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm shadow-xl"
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-gray-900">Ouder koppelen — {playerName}</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <X size={15} />
            </button>
          </div>
          <div className="px-5 pb-5 pt-4">
            <ParentLinkSection playerId={playerId} teamId={teamId} playerName={playerName} />
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ParentLinkModal;
