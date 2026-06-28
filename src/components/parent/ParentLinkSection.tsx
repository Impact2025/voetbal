import { useState, useEffect } from 'react';
import { Heart, Copy, CheckCircle2, Loader2, MessageCircle, Unlink, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { copyToClipboard } from '../../utils/clipboard';
import toast from 'react-hot-toast';

interface LinkStatus {
  link_code: string;
  expires_at: string;
  verified: boolean;
  parent_email: string | null;
}

interface ParentLinkSectionProps {
  playerId: string;
  teamId: string;
  playerName: string;
  senderName?: string;
}

const APP_URL = 'https://skillkaart.nl';
const ACCENT = '#16A34A';
const WA_GREEN = '#25D366';

export default function ParentLinkSection({ playerId, teamId, playerName, senderName }: ParentLinkSectionProps) {
  const [status, setStatus]       = useState<LinkStatus | null | undefined>(undefined);
  const [generating, setGen]      = useState(false);
  const [unlinking, setUnlink]    = useState(false);
  const [email, setEmail]         = useState('');
  const [sendingMail, setSending] = useState(false);
  const [mailSent, setMailSent]   = useState(false);

  useEffect(() => {
    setStatus(undefined);
    setEmail('');
    setMailSent(false);
    void load();
  }, [playerId]);

  const load = async () => {
    const { data } = await supabase.rpc('get_parent_link_status', { p_player_id: playerId });
    setStatus((data as LinkStatus[] | null)?.[0] ?? null);
  };

  const handleGenerate = async () => {
    setGen(true);
    const { data, error } = await supabase.rpc('generate_parent_link_code', {
      p_player_id: playerId,
      p_team_id: teamId,
    });
    if (error || !(data as LinkStatus[] | null)?.[0]) {
      console.error('[generate_parent_link_code]', error);
      toast.error('Genereren mislukt. Probeer opnieuw.');
    } else {
      setStatus((data as LinkStatus[])[0]);
    }
    setGen(false);
  };

  const handleUnlink = async () => {
    setUnlink(true);
    const { error } = await supabase.rpc('unlink_parent', { p_player_id: playerId });
    if (error) {
      toast.error('Ontkoppelen mislukt.');
    } else {
      setStatus(null);
      setMailSent(false);
      toast.success('Ouder ontkoppeld.');
    }
    setUnlink(false);
  };

  const handleSendMail = async () => {
    if (!email.includes('@') || !status) return;
    setSending(true);
    try {
      const res = await fetch('/api/send-parent-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email.trim(),
          playerName,
          linkCode: status.link_code,
          expiresAt: status.expires_at,
          senderName: senderName ?? '',
        }),
      });

      let data: { error?: string } = {};
      try { data = await res.json(); } catch {
        throw new Error('API niet bereikbaar. Start vercel dev of test op de live omgeving.');
      }

      if (!res.ok) throw new Error(data.error || 'Versturen mislukt');
      setMailSent(true);
      toast.success('Uitnodiging verstuurd!');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const expiryLabel = status && !status.verified
    ? new Date(status.expires_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    : '';

  const waText = status && !status.verified
    ? encodeURIComponent(
        `Hoi! Je kunt de voortgang van ${playerName} volgen via onze voetbalapp.\n\n` +
        `Open: ${APP_URL}\n` +
        `Kies "Ouder-portaal" → "Account aanmaken"\n` +
        `Koppelcode: ${status.link_code}\n\n` +
        `De code is geldig t/m ${expiryLabel}.`
      )
    : '';

  return (
    <div className="border-t border-gray-100 pt-4">
      <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Ouder koppelen</p>

      {/* Loading */}
      {status === undefined && (
        <div className="flex items-center justify-center py-3">
          <Loader2 size={16} className="animate-spin text-gray-300" />
        </div>
      )}

      {/* Verified: ouder is gekoppeld */}
      {status !== undefined && status?.verified && (
        <div className="p-3.5 rounded-xl bg-green-50 border border-green-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 size={15} style={{ color: ACCENT }} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-green-800">Ouder gekoppeld</p>
                {status.parent_email && (
                  <p className="text-[10px] text-green-600 truncate">{status.parent_email}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleUnlink}
              disabled={unlinking}
              className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              {unlinking ? <Loader2 size={10} className="animate-spin" /> : <Unlink size={10} />}
              Ontkoppelen
            </button>
          </div>
        </div>
      )}

      {/* Code actief maar nog niet geclaimd */}
      {status !== undefined && status && !status.verified && (
        <div className="space-y-2">
          {/* Code display */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
              Koppelcode — geldig t/m {expiryLabel}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black tracking-[0.3em] text-gray-900 font-mono select-all">
                {status.link_code}
              </span>
              <button
                onClick={() => void copyToClipboard(status.link_code).then(() => toast.success('Gekopieerd!'))}
                className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-gray-700"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: WA_GREEN }}
          >
            <MessageCircle size={14} />
            Stuur via WhatsApp
          </a>

          {/* E-mail */}
          {mailSent ? (
            <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-green-700 font-semibold">
              <CheckCircle2 size={13} style={{ color: ACCENT }} />
              Uitnodiging verstuurd naar {email}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && void handleSendMail()}
                placeholder="of stuur per e-mail..."
                className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
              <button
                onClick={handleSendMail}
                disabled={sendingMail || !email.includes('@')}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: ACCENT }}
              >
                {sendingMail ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                {sendingMail ? '' : 'Stuur'}
              </button>
            </div>
          )}

          <p className="text-[9px] text-gray-400 text-center">
            E-mail stuurt een directe inloglink · WhatsApp stuurt de code
          </p>
        </div>
      )}

      {/* Geen koppeling */}
      {status !== undefined && status === null && (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border-2 border-dashed border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-700 hover:bg-green-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {generating ? <Loader2 size={13} className="animate-spin" /> : <Heart size={13} />}
          {generating ? 'Genereren...' : 'Genereer koppelcode voor ouder'}
        </button>
      )}
    </div>
  );
}
