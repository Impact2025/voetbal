import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, X, Plus, Wand2 } from 'lucide-react';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import { homeworkSuggestions, COACH_COLOR } from '../../utils/constants';
import type { CustomHomework } from '../../types';

interface HomeworkCreatorModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (homework: Omit<CustomHomework, 'id' | 'team_id'>) => Promise<void>;
  onAssign: (ids: string[]) => void;
  customHomework: CustomHomework[];
}

const HomeworkCreatorModal = ({ isVisible, onClose, onSave, onAssign, customHomework }: HomeworkCreatorModalProps) => {
  const [activeTab, setActiveTab] = useState('maken');
  const [week, setWeek] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const handleSuggestionClick = (suggestion: { title: string; description: string }) => {
    setTitle(suggestion.title);
    setDescription(suggestion.description);
  };

  const handleSave = async () => {
    if (title && description) {
      await onSave({ week, title, description, youtube_url: youtubeUrl });
      setWeek(''); setTitle(''); setDescription(''); setYoutubeUrl('');
      setActiveTab('toewijzen');
    } else {
      alert('Titel en omschrijving zijn verplicht.');
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          className="bg-white border border-gray-200 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList size={20} className="text-emerald-600" /> Huiswerk Manager
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex-shrink-0 px-5 py-3 border-b border-gray-100">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 max-w-xs">
              <button
                onClick={() => setActiveTab('maken')}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'maken' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Maken
              </button>
              <button
                onClick={() => setActiveTab('toewijzen')}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'toewijzen' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Toewijzen
              </button>
            </div>
          </div>

          <div className="flex-grow overflow-y-auto p-5">
            {activeTab === 'maken' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Nieuwe Opdracht</h3>
                  <Input light label="Week (optioneel)" value={week} onChange={e => setWeek(e.target.value)} placeholder="bv. Week 5" />
                  <Input light label="Titel" value={title} onChange={e => setTitle(e.target.value)} placeholder="bv. Dribbel Challenge" />
                  <Textarea light label="Omschrijving" value={description} onChange={e => setDescription(e.target.value)} placeholder="Omschrijf de oefening..." />
                  <Input light label="YouTube Link (optioneel)" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="Plak hier een YouTube URL" />
                  <button
                    onClick={handleSave}
                    className="w-full py-2.5 font-bold text-white rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
                    style={{ backgroundColor: COACH_COLOR }}
                  >
                    <Plus size={16} /> Opdracht Opslaan
                  </button>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5">
                    <Wand2 size={13} className="text-emerald-600" /> Suggesties
                  </h3>
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {homeworkSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(s)}
                        className="w-full text-left p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-colors"
                      >
                        <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'toewijzen' && (
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4">Beschikbare Opdrachten</h3>
                {customHomework.length > 0 ? (
                  <div className="space-y-3">
                    {customHomework.map(hw => (
                      <div key={hw.id} className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center">
                        <div className="min-w-0 flex-1 mr-4">
                          <p className="font-bold text-gray-900 text-sm truncate">{hw.week && `${hw.week}: `}{hw.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{hw.description}</p>
                        </div>
                        <button
                          onClick={() => onAssign([hw.id])}
                          className="shrink-0 text-white font-semibold py-1.5 px-4 rounded-lg transition-colors text-sm hover:opacity-90"
                          style={{ backgroundColor: COACH_COLOR }}
                        >
                          Toewijzen
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                    <ClipboardList size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 text-sm">Nog geen opdrachten gemaakt. Ga naar 'Maken' om te beginnen.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HomeworkCreatorModal;
