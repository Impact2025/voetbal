import AvatarArt from './AvatarArt';
import type { AvatarConfig } from '../lib/avatar/catalog';

interface Props {
  config?: AvatarConfig | null;
  avatarUrl?: string | null;
  name: string;
  size?: number;
  className?: string;
}

/**
 * Uniforme avatar-weergave met fallback-keten:
 *   1. zelf-gekozen "baller" (avatar_config)
 *   2. bestaande geüploade foto (avatar_url) — legacy
 *   3. initiaal
 */
export default function Avatar({ config, avatarUrl, name, size = 80, className = '' }: Props) {
  const style = { width: size, height: size };
  const radius = Math.round(size * 0.28);

  if (config) {
    return (
      <div style={{ ...style, borderRadius: radius }} className={`overflow-hidden ${className}`}>
        <AvatarArt config={config} className="w-full h-full" />
      </div>
    );
  }

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ ...style, borderRadius: radius }}
        className={`object-cover ${className}`}
      />
    );
  }

  const initial = name?.trim()?.charAt(0)?.toUpperCase() ?? '?';
  return (
    <div
      style={{ ...style, borderRadius: radius }}
      className={`flex items-center justify-center bg-gray-100 border border-gray-200 text-gray-400 font-black ${className}`}
    >
      <span style={{ fontSize: size * 0.4 }}>{initial}</span>
    </div>
  );
}
