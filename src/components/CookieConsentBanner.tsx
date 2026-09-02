import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie } from 'lucide-react';
import { NEON_COLOR } from '../utils/constants';

const COOKIE_CONSENT_KEY = 'cookie_consent_v1';
const GA_MEASUREMENT_ID = 'G-NY73YP5HXS';

/**
 * Laadt Google Analytics pas ná expliciete toestemming. Voorheen laadde
 * index.html gtag.js onvoorwaardelijk bij elke pageview — zonder
 * toestemmingsvraag, ook niet voor bezoekers die nooit inloggen (landingspagina).
 */
function loadGoogleAnalytics(): void {
  if (document.getElementById('ga-script')) return;
  const script = document.createElement('script');
  script.id = 'ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  const win = window as unknown as { dataLayer?: unknown[] };
  win.dataLayer = win.dataLayer || [];
  function gtag(...args: unknown[]) { win.dataLayer!.push(args); }
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const choice = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (choice === 'accepted') { loadGoogleAnalytics(); return; }
    if (choice === 'rejected') return;
    setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    loadGoogleAnalytics();
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed bottom-0 inset-x-0 z-[60] p-4"
        >
          <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="p-2 rounded-xl shrink-0 hidden sm:block" style={{ backgroundColor: `${NEON_COLOR}20` }}>
              <Cookie size={20} style={{ color: '#16A34A' }} />
            </div>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed flex-1">
              We gebruiken alleen analytics-cookies als je daarvoor toestemming geeft. Zonder toestemming werkt de app net zo goed.
            </p>
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={reject}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                Alleen noodzakelijk
              </button>
              <button
                onClick={accept}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold text-black hover:opacity-90 transition-opacity"
                style={{ backgroundColor: NEON_COLOR }}
              >
                Accepteren
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
