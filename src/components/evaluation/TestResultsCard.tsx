import { FileText } from 'lucide-react';
import Card from '../ui/Card';
import { initialTestState, testLabels } from '../../utils/constants';
import type { Player } from '../../types';

interface TestResultsCardProps {
  player: Player;
  period: string;
}

const TestResultsCard = ({ player, period }: TestResultsCardProps) => {
  const testData = player.evaluations[period]?.tests || initialTestState;
  const hasResults = Object.values(testData).some(category =>
    Object.values(category as Record<string, string>).some(value => value !== '')
  );

  return (
    <Card>
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText size={20} className="text-[--neon-color]" />Testresultaten ({period})</h3>
      {!hasResults ? (
        <p className="text-gray-400">Nog geen testresultaten ingevoerd voor deze periode.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {Object.entries(testLabels).map(([categoryKey, categoryData]) => (
            <div key={categoryKey}>
              <h4 className="font-semibold text-gray-300 mb-2">{categoryData.label}</h4>
              <ul className="space-y-1 text-sm">
                {Object.entries(categoryData.tests).map(([testKey, testLabel]) => {
                  const value = (testData[categoryKey as keyof typeof testData] as Record<string, string>)?.[testKey];
                  return value ? (
                    <li key={testKey} className="flex justify-between">
                      <span className="text-gray-400">{testLabel.split(' (')[0]}:</span>
                      <span className="font-bold text-white">{value}</span>
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default TestResultsCard;
