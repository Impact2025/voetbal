import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';
import { COACH_COLOR } from '../../utils/constants';
import { CONSENT_KEY } from '../../lib/consent';

interface ConsentModalProps {
  onAccept: () => void;
  onShowPrivacy: () => void;
}

const ConsentModal = ({ onAccept, onShowPrivacy }: ConsentModalProps) => {
  const [visible, setVisible] = useState(true);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, '1');
    setVisible(false);
    onAccept();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 sm:pb-0"
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${COACH_COLOR}15` }}>
                <ShieldCheck size={24} style={{ color: COACH_COLOR }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Privacy & Gegevensbescherming</h2>
                <p className="text-sm text-gray-500 mt-0.5">Lees hoe we omgaan met persoonsgegevens</p>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-3 leading-relaxed mb-6">
              <p>
                Skillkaart slaat gegevens op van voetbalspelers, waaronder naam, leeftijd, positie en prestatie-evaluaties. Deze gegevens worden uitsluitend gebruikt om de sportieve ontwikkeling te ondersteunen.
              </p>
              <p>
                Omdat het hier (mede) om gegevens van minderjarigen gaat, bevestig je met "Akkoord" dat je toestemming hebt van de betrokken ouders of verzorgers voor het verwerken van deze gegevens.
              </p>
              <p className="text-gray-500 text-xs">
                Gegevens worden bewaard zolang het team actief is en worden op verzoek verwijderd. Zie onze{' '}
                <button onClick={onShowPrivacy} className="underline hover:text-gray-900 transition-colors" style={{ color: COACH_COLOR }}>
                  privacyverklaring
                </button>{' '}
                voor meer informatie.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: COACH_COLOR }}
              >
                Akkoord — doorgaan
              </button>
              <button
                onClick={onShowPrivacy}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Meer lezen
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConsentModal;
