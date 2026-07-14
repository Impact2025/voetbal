import { useId } from 'react';
import {
  type AvatarConfig,
  skinById,
  hairColorById,
  backgroundById,
} from '../lib/avatar/catalog';

interface Props {
  config: AvatarConfig;
  className?: string;
}

/**
 * Stelt een "voetbalportret" samen uit losse SVG-lagen.
 * viewBox 0 0 100 100. Volledig schaalbaar, nul externe assets.
 */
export default function AvatarArt({ config, className }: Props) {
  const uid = useId().replace(/:/g, '');
  const skin = skinById(config.skin);
  const hairCol = hairColorById(config.hairColor).value;
  const bg = backgroundById(config.background);
  const bgId = `bg-${uid}`;
  const jerseyId = `jr-${uid}`;
  const hasCap = config.accessory === 'cap';

  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bg.from} />
          <stop offset="1" stopColor={bg.to} />
        </linearGradient>
        <linearGradient id={jerseyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bg.jersey} />
          <stop offset="1" stopColor={bg.to} />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <rect x="0" y="0" width="100" height="100" rx="24" />
        </clipPath>
      </defs>

      <g clipPath={`url(#clip-${uid})`}>
        {/* Achtergrond */}
        <rect x="0" y="0" width="100" height="100" fill={`url(#${bgId})`} />
        {/* Subtiele glans linksboven */}
        <circle cx="26" cy="20" r="30" fill="#ffffff" opacity="0.08" />

        {/* Shirt / schouders */}
        <path d="M14 100 C14 82 30 73 50 73 C70 73 86 82 86 100 Z" fill={`url(#${jerseyId})`} />
        {/* Kraag */}
        <path d="M42 74 L50 82 L58 74 L54 73 L50 76 L46 73 Z" fill="#ffffff" opacity="0.85" />
        {/* Nek */}
        <rect x="44.5" y="60" width="11" height="12" rx="5" fill={skin.shadow} />

        {/* Haar achter het hoofd (afro / staart) */}
        {!hasCap && <HairBack style={config.hair} color={hairCol} />}

        {/* Oren */}
        <circle cx="29" cy="47" r="4.5" fill={skin.base} />
        <circle cx="71" cy="47" r="4.5" fill={skin.base} />

        {/* Hoofd */}
        <circle cx="50" cy="45" r="22" fill={skin.base} />
        {/* Zachte schaduw rechterkant */}
        <path d="M50 23 A22 22 0 0 1 50 67 Z" fill={skin.shadow} opacity="0.25" />

        {/* Wangen */}
        <ellipse cx="38" cy="52" rx="4" ry="2.6" fill="#FF7A7A" opacity="0.28" />
        <ellipse cx="62" cy="52" rx="4" ry="2.6" fill="#FF7A7A" opacity="0.28" />

        {/* Ogen */}
        <ellipse cx="41.5" cy="45" rx="3.2" ry="4" fill="#ffffff" />
        <ellipse cx="58.5" cy="45" rx="3.2" ry="4" fill="#ffffff" />
        <circle cx="42.2" cy="46" r="1.9" fill="#2A2320" />
        <circle cx="59.2" cy="46" r="1.9" fill="#2A2320" />
        <circle cx="43" cy="45.2" r="0.7" fill="#ffffff" />
        <circle cx="60" cy="45.2" r="0.7" fill="#ffffff" />

        {/* Wenkbrauwen */}
        <path d="M38 39.5 Q41.5 37.8 45 39.3" stroke={hairCol} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M55 39.3 Q58.5 37.8 62 39.5" stroke={hairCol} strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Neus */}
        <path d="M50 47 Q51.5 50 49.5 51" stroke={skin.shadow} strokeWidth="1.4" strokeLinecap="round" fill="none" />

        {/* Glimlach */}
        <path d="M43 54.5 Q50 60.5 57 54.5" stroke="#7A4A38" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Haar (onder pet) */}
        {!hasCap && <Hair style={config.hair} color={hairCol} />}

        {/* Accessoires */}
        <Accessory id={config.accessory} />
      </g>
    </svg>
  );
}

function HairBack({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'afro':
      return (
        <g fill={color}>
          <circle cx="50" cy="32" r="27" />
          <circle cx="28" cy="46" r="9" />
          <circle cx="72" cy="46" r="9" />
        </g>
      );
    case 'ponytail':
      return (
        <path d="M71 40 Q79 42 80 53 Q81 64 73 68 Q79 57 74 48 Q71 43 69 41 Z" fill={color} />
      );
    default:
      return null;
  }
}

function Hair({ style, color }: { style: string; color: string }) {
  switch (style) {
    case 'bald':
      return null;
    case 'buzz':
      return (
        <path d="M28 44 Q28 24 50 24 Q72 24 72 44 Q64 33 50 33 Q36 33 28 44 Z" fill={color} opacity="0.9" />
      );
    case 'short':
      return (
        <path d="M27 46 Q26 22 50 22 Q74 22 73 46 Q73 36 63 34 Q60 28 50 28 Q34 27 30 40 Q28 42 27 46 Z" fill={color} />
      );
    case 'spiky':
      return (
        <path d="M28 42 L31 27 L37 36 L42 24 L47 35 L52 23 L57 35 L62 25 L67 37 L72 42 Q66 31 50 31 Q34 31 28 42 Z" fill={color} />
      );
    case 'curly':
      return (
        <g fill={color}>
          <circle cx="31" cy="34" r="7" />
          <circle cx="40" cy="28" r="8" />
          <circle cx="50" cy="26" r="8.5" />
          <circle cx="60" cy="28" r="8" />
          <circle cx="69" cy="34" r="7" />
          <path d="M27 44 Q27 34 50 34 Q73 34 73 44 Q64 36 50 36 Q36 36 27 44 Z" />
        </g>
      );
    case 'afro':
      return (
        <path d="M29 42 Q28 26 50 26 Q72 26 71 42 Q64 33 50 33 Q36 33 29 42 Z" fill={color} />
      );
    case 'ponytail':
      return (
        <path d="M27 46 Q26 22 50 22 Q74 22 73 46 Q73 36 63 34 Q60 28 50 28 Q34 27 30 40 Q28 42 27 46 Z" fill={color} />
      );
    case 'bun':
      return (
        <g fill={color}>
          <circle cx="50" cy="20" r="6" />
          <path d="M27 46 Q26 22 50 22 Q74 22 73 46 Q73 36 63 34 Q60 28 50 28 Q34 27 30 40 Q28 42 27 46 Z" />
        </g>
      );
    default:
      return null;
  }
}

function Accessory({ id }: { id: string | null }) {
  switch (id) {
    case 'headband':
      return (
        <g>
          <path d="M28 37 Q50 30 72 37 L72 42 Q50 35 28 42 Z" fill="#00FF9D" />
          <rect x="47" y="33.5" width="6" height="4.5" rx="1" fill="#0D0D0D" opacity="0.6" />
        </g>
      );
    case 'glasses':
      return (
        <g stroke="#2A2320" strokeWidth="1.6" fill="none">
          <circle cx="41.5" cy="45" r="5.5" fill="#ffffff" fillOpacity="0.15" />
          <circle cx="58.5" cy="45" r="5.5" fill="#ffffff" fillOpacity="0.15" />
          <path d="M47 45 H53" />
          <path d="M36 44 L31 42" />
          <path d="M64 44 L69 42" />
        </g>
      );
    case 'cap':
      return (
        <g>
          <path d="M27 40 Q27 20 50 20 Q73 20 73 40 Q60 33 50 33 Q40 33 27 40 Z" fill="#E0453C" />
          <path d="M27 40 Q40 43 52 41 L58 45 Q40 49 27 44 Z" fill="#B22B24" />
          <circle cx="50" cy="21.5" r="2" fill="#ffffff" opacity="0.8" />
        </g>
      );
    case 'captain':
      return (
        <g>
          <rect x="66" y="66" width="20" height="14" rx="3" fill="#F5C542" />
          <text x="76" y="77" fontSize="11" fontWeight="900" textAnchor="middle" fill="#7A4A00" fontFamily="Inter, sans-serif">C</text>
        </g>
      );
    case 'crown':
      return (
        <g fill="#F5C542" stroke="#D19A1C" strokeWidth="0.8">
          <path d="M34 26 L38 16 L44 23 L50 13 L56 23 L62 16 L66 26 Z" />
          <circle cx="50" cy="13" r="1.8" fill="#ffffff" stroke="none" />
        </g>
      );
    default:
      return null;
  }
}
