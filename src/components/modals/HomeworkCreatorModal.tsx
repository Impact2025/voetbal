import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, X, Plus, Wand2 } from 'lucide-react';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import { homeworkSuggestions } from '../../utils/constants';
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-lg shadow-black/50" onClick={e => e.stopPropagation()}>
          <div className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2"><ClipboardList size={22} className="text-[--neon-color]" /> Huiswerk Manager</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors"><X size={20} /></button>
          </div>
          <div className="flex-shrink-0 p-2 bg-gray-800/50">
            <div className="flex justify-center gap-2">
              <button onClick={() => setActiveTab('maken')} className={`w-full py-2 rounded-md font-semibold transition-colors ${activeTab === 'maken' ? 'bg-[--neon-color] text-black' : 'hover:bg-gray-700'}`}>Huiswerk Maken</button>
              <button onClick={() => setActiveTab('toewijzen')} className={`w-full py-2 rounded-md font-semibold transition-colors ${activeTab === 'toewijzen' ? 'bg-[--neon-color] text-black' : 'hover:bg-gray-700'}`}>Huiswerk Toewijzen</button>
            </div>
          </div>
          <div className="flex-grow overflow-y-auto p-6">
            {activeTab === 'maken' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-bold mb-4">Nieuwe Huiswerkopdracht</h3>
                  <div className="space-y-4">
                    <Input label="Week (optioneel)" value={week} onChange={e => setWeek(e.target.value)} placeholder="bv. Week 5" />
                    <Input label="Titel" value={title} onChange={e => setTitle(e.target.value)} placeholder="bv. Dribbel Challenge" />
                    <Textarea label="Omschrijving" value={description} onChange={e => setDescription(e.target.value)} placeholder="Omschrijf de oefening..." />
                    <Input label="YouTube Link (optioneel)" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="Plak hier een YouTube URL" />
                    <button onClick={handleSave} className="w-full py-2 font-bold text-black bg-[--neon-color] rounded-lg hover:opacity-90 transition-opacity duration-200 flex items-center justify-center gap-2">
                      <Plus size={18} /> Opdracht Opslaan
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Wand2 size={18} className="text-[--neon-color]" /> Suggesties</h3>
                  <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
                    {homeworkSuggestions.map((s, i) => (
                      <button key={i} onClick={() => handleSuggestionClick(s)} className="w-full text-left p-3 bg-gray-800/70 rounded-lg hover:bg-gray-700/70 transition-colors">
                        <p className="font-semibold text-white">{s.title}</p>
                        <p className="text-sm text-gray-400 mt-1">{s.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'toewijzen' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Beschikbare Huiswerkopdrachten</h3>
                {customHomework.length > 0 ? (
                  <div className="space-y-3">
                    {customHomework.map(hw => (
                      <div key={hw.id} className="p-3 bg-gray-800/50 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-bold">{hw.week && `${hw.week}: `}{hw.title}</p>
                          <p className="text-sm text-gray-400">{hw.description.substring(0, 50)}...</p>
                        </div>
                        <button onClick={() => onAssign([hw.id])} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-md transition-colors shrink-0 ml-4">Wijs toe</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">Je hebt nog geen eigen huiswerk gemaakt. Ga naar 'Huiswerk Maken' om te beginnen.</p>
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
