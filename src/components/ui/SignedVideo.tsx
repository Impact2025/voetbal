import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getSignedVideoUrl } from '../../lib/storage';

interface SignedVideoProps {
  value: string | null | undefined; // opgeslagen storage-pad (of legacy publieke URL)
  className?: string;
  controls?: boolean;
  playsInline?: boolean;
}

/**
 * Video's van kinderen staan in een privé bucket (zie fix_media_storage.sql).
 * Deze component haalt vlak voor weergave een kortlevende signed URL op —
 * er wordt nooit een permanente/publieke URL opgeslagen of hergebruikt.
 */
export default function SignedVideo({ value, className, controls = true, playsInline = true }: SignedVideoProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setUrl(null);
    setFailed(false);
    if (!value) return;
    let cancelled = false;
    getSignedVideoUrl(value).then((signed) => {
      if (cancelled) return;
      if (signed) setUrl(signed); else setFailed(true);
    });
    return () => { cancelled = true; };
  }, [value]);

  if (!value) return null;

  if (failed) {
    return <p className="text-xs text-gray-400 italic">Video kon niet geladen worden.</p>;
  }

  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-black/5 rounded-lg ${className ?? 'h-32'}`}>
        <Loader2 size={18} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return <video src={url} controls={controls} playsInline={playsInline} className={className} />;
}
