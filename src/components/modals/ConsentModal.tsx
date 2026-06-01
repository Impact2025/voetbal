import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';
import { NEON_COLOR } from '../../utils/constants';

const CONSENT_KEY = 'gdpr_consent_v1';

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
            className="w-full max-w-lg bg-[#111318] border border-gray-700 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: `${NEON_COLOR}15` }}>
                <ShieldCheck size={24} style={{ color: NEON_COLOR }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Privacy & Gegevensbescherming</h2>
                <p className="text-sm text-gray-400 mt-0.5">Lees hoe we omgaan met persoonsgegevens</p>
              </div>
            </div>

            <div className="text-sm text-gray-300 space-y-3 leading-relaxed mb-6">
              <p>
                Skillkaart slaat gegevens op van voetbalspelers, waaronder naam, leeftijd, positie en prestatie-evaluaties. Deze gegevens worden uitsluitend gebruikt om de sportieve ontwikkeling te ondersteunen.
              </p>
              <p>
                Omdat het hier (mede) om gegevens van minderjarigen gaat, bevestig je met "Akkoord" dat je toestemming hebt van de betrokken ouders of verzorgers voor het verwerken van deze gegevens.
              </p>
              <p className="text-gray-500 text-xs">
                Gegevens worden bewaard zolang het team actief is en worden op verzoek verwijderd. Zie onze{' '}
                <button onClick={onShowPrivacy} className="underline hover:text-white transition-colors" style={{ color: NEON_COLOR }}>
                  privacyverklaring
                </button>{' '}
                voor meer informatie.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 py-3 rounded-xl font-bold text-black text-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: NEON_COLOR }}
              >
                Akkoord — doorgaan
              </button>
              <button
                onClick={onShowPrivacy}
                className="flex-1 py-3 rounded-xl font-semibold text-sm text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors"
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

export const hasConsented = () => !!localStorage.getItem(CONSENT_KEY);

export default ConsentModal;
