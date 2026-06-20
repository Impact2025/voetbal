import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TIER_CONFIG } from '../../lib/cardTier';
import type { CardTier } from '../../types';

const CONFETTI_COLORS = ['#ffffff', '#facc15', '#4ade80', '#38bdf8', '#f97316', '#c084fc', '#fb7185'];

interface Particle {
  angle: number;
  dist: number;
  color: string;
  size: number;
  rotate: number;
  delay: number;
}

function genParticles(count = 28): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    angle:  (i / count) * 360 + (Math.random() - 0.5) * (360 / count),
    dist:   110 + Math.random() * 130,
    color:  CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size:   5 + Math.random() * 9,
    rotate: Math.random() * 540 - 270,
    delay:  i * 0.018,
  }));
}

const SOCKS_MESSAGES: Record<CardTier, string> = {
  brons:     'Goed bezig! Elke actie telt mee voor jouw groei.',
  zilver:    'Je werkt als een pro — zie je de voortgang al?',
  goud:      'Wauw! Jij bent echt een voorbeeld voor het team.',
  legendary: 'Legendary! Jij hebt laten zien dat doorzetten loont.',
};

interface TierUpModalProps {
  tier: CardTier;
  onClose: () => void;
}

const TierUpModal = ({ tier, onClose }: TierUpModalProps) => {
  const cfg = TIER_CONFIG[tier];
  const [particles] = useState(() => genParticles());
  const [particlesVisible, setParticlesVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setParticlesVisible(true), 500);
    const autoClose = setTimeout(onClose, 8000);
    return () => { clearTimeout(t); clearTimeout(autoClose); };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="relative flex flex-col items-center gap-6 select-none" onClick={e => e.stopPropagation()}>

        {/* Particle burst */}
        <AnimatePresence>
          {particlesVisible && particles.map((p, i) => {
            const rad = (p.angle * Math.PI) / 180;
            return (
              <motion.div
                key={i}
                className="absolute rounded-sm pointer-events-none"
                style={{
                  width: p.size, height: p.size,
                  backgroundColor: p.color,
                  left: '50%', top: '50%',
                  marginLeft: -p.size / 2,
                  marginTop: -p.size / 2,
                }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                animate={{
                  x: Math.cos(rad) * p.dist,
                  y: Math.sin(rad) * p.dist,
                  opacity: 0,
                  rotate: p.rotate,
                  scale: 0.4,
                }}
                transition={{ duration: 1.1, delay: p.delay, ease: [0.2, 0.8, 0.4, 1] }}
              />
            );
          })}
        </AnimatePresence>

        {/* Card */}
        <motion.div
          className="relative w-52 h-72 rounded-3xl flex flex-col items-center justify-center gap-4 border overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${cfg.bgFrom} 0%, ${cfg.bgTo} 100%)`,
            borderColor: `${cfg.color}60`,
            boxShadow: `0 0 80px ${cfg.glow}, 0 0 160px ${cfg.glow}`,
          }}
          initial={{ scale: 0, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.05 }}
        >
          {/* Shine sweep */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(105deg, transparent 30%, ${cfg.color}30 50%, transparent 70%)`,
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.4, delay: 0.6, ease: 'easeInOut' }}
          />

          {/* Radial glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 50% 30%, ${cfg.color}18 0%, transparent 70%)` }}
          />

          {/* Socks mascotte */}
          <motion.div
            className="text-5xl"
            animate={{ rotate: [0, -8, 8, -5, 5, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            ⚽
          </motion.div>

          {/* Tier label */}
          <div className="text-center relative z-10">
            <motion.div
              className="text-3xl font-black tracking-tight"
              style={{ color: cfg.color, textShadow: `0 0 40px ${cfg.color}` }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              {cfg.label.toUpperCase()}
            </motion.div>
            <motion.div
              className="text-xs font-bold tracking-widest uppercase mt-1"
              style={{ color: `${cfg.color}80` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Ontgrendeld!
            </motion.div>
          </div>

          {/* XP badge */}
          <motion.div
            className="absolute bottom-4 px-3 py-1 rounded-full text-[10px] font-black"
            style={{ backgroundColor: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {cfg.xpMin} XP bereikt
          </motion.div>
        </motion.div>

        {/* Socks speech bubble */}
        <motion.div
          className="max-w-xs rounded-2xl p-4 border text-center"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <p className="text-[11px] font-black uppercase tracking-widest mb-1.5" style={{ color: `${cfg.color}90` }}>
            ⚽ Socks zegt
          </p>
          <p className="text-sm text-gray-200 leading-relaxed font-medium">
            "{SOCKS_MESSAGES[tier]}"
          </p>
        </motion.div>

        {/* CTA */}
        <motion.button
          className="px-10 py-3.5 rounded-2xl text-sm font-black text-black transition-opacity hover:opacity-90 active:scale-95"
          style={{ backgroundColor: cfg.color, boxShadow: `0 4px 24px ${cfg.color}50` }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          whileTap={{ scale: 0.96 }}
          onClick={onClose}
        >
          Ga verder ✨
        </motion.button>
      </div>
    </motion.div>
  );
};

export default TierUpModal;
