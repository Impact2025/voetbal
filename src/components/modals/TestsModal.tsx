import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X } from 'lucide-react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import { initialTestState, testLabels } from '../../utils/constants';
import type { Player, TestState } from '../../types';

interface TestsModalProps {
  isVisible: boolean;
  onClose: () => void;
  player: Player | null;
  period: string;
  onUpdate: (field: string, value: string) => void;
}

const TestsModal = ({ isVisible, onClose, player, period, onUpdate }: TestsModalProps) => {
  const [localTestData, setLocalTestData] = useState<TestState>(initialTestState);

  useEffect(() => {
    if (isVisible && player && player.evaluations[period]?.tests) {
      setLocalTestData(JSON.parse(JSON.stringify(player.evaluations[period].tests)) as TestState);
    } else if (isVisible) {
      setLocalTestData(JSON.parse(JSON.stringify(initialTestState)) as TestState);
    }
  }, [player, period, isVisible]);

  if (!isVisible || !player) return null;

  const handleInputChange = (category: string, testKey: string, value: string) => {
    const newData = { ...localTestData, [category]: { ...(localTestData[category as keyof TestState] as Record<string, string>), [testKey]: value } };
    setLocalTestData(newData);
    onUpdate(`tests.${category}.${testKey}`, value);
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-lg shadow-black/50" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-gray-900/80 backdrop-blur-md p-4 border-b border-gray-700 flex justify-between items-center z-10">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText size={22} className="text-[--neon-color]" /> Testresultaten voor {player.name} ({period})
            </h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors"><X size={20} /></button>
          </div>
          <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(testLabels).map(([categoryKey, categoryData]) => (
              <Card key={categoryKey}>
                <h3 className="text-lg font-bold text-[--neon-color] mb-4">{categoryData.label}</h3>
                <div className="space-y-4">
                  {Object.entries(categoryData.tests).map(([testKey, testLabel]) => (
                    <Input
                      key={testKey}
                      label={testLabel}
                      value={(localTestData[categoryKey as keyof TestState] as Record<string, string>)?.[testKey] || ''}
                      onChange={e => handleInputChange(categoryKey, testKey, e.target.value)}
                      placeholder="Score..."
                    />
                  ))}
                </div>
              </Card>
            ))}
          </div>
          <div className="p-4 border-t border-gray-700 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity">
              Sluiten
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TestsModal;
