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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white border border-gray-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white/98 backdrop-blur-md p-4 border-b border-gray-100 flex justify-between items-center z-10 rounded-t-2xl">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText size={20} className="text-emerald-600" />
              Testresultaten — {player.name} ({period})
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="flex-grow overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {Object.entries(testLabels).map(([categoryKey, categoryData]) => (
              <Card key={categoryKey} light>
                <h3 className="text-base font-bold text-emerald-700 mb-4">{categoryData.label}</h3>
                <div className="space-y-4">
                  {Object.entries(categoryData.tests).map(([testKey, testLabel]) => (
                    <Input
                      key={testKey}
                      light
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
          <div className="p-4 border-t border-gray-100 flex justify-end rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:opacity-90 transition-opacity text-sm"
            >
              Sluiten
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TestsModal;
