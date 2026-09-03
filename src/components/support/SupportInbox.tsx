import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Send, ArrowLeft, Inbox, RefreshCw, Sparkles, Crown,
} from 'lucide-react';
import {
  fetchInboxTickets, fetchTicket, sendTicketMessage, updateTicketStatus, fetchSupportCategories,
  type SupportTicket, type SupportMessage, type SupportCategory,
} from '../../lib/support';

const ACCENT = '#16A34A';

const STATUS_LABEL: Record<SupportTicket['status'], { label: string; color: string; bg: string }> = {
  open:            { label: 'Open',           color: '#B45309', bg: '#fef3c7' },
  in_behandeling:  { label: 'In behandeling',  color: '#1D4ED8', bg: '#dbeafe' },
  opgelost:        { label: 'Opgelost',        color: '#15803D', bg: '#dcfce7' },
  gesloten:        { label: 'Gesloten',        color: '#57534e', bg: '#f3f4f6' },
};

const STATUS_ORDER: SupportTicket['status'][] = ['open', 'in_behandeling', 'opgelost', 'gesloten'];

const SENDER_LABEL: Record<string, string> = {
  player: 'Speler', parent: 'Ouder', coach: 'Coach', club_admin: 'Club', superadmin: 'Platform', ai: 'AI-assistent',
};

type FilterId = SupportTicket['status'] | 'alle';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'nu';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}u`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

interface SupportInboxProps {
  className?: string;
}

export default function SupportInbox({ className = '' }: SupportInboxProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>('open');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const categoryName = useCallback(
    (id: string | null) => categories.find(c => c.id === id)?.name ?? 'Overig',
    [categories],
  );

  const loadTickets = useCallback(async () => {
    const t = await fetchInboxTickets();
    setTickets(t);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTickets(), fetchSupportCategories().then(setCategories)]).finally(() => setLoading(false));
    const interval = setInterval(loadTickets, 30000);
    return () => clearInterval(interval);
  }, [loadTickets]);

  const selected = tickets.find(t => t.id === selectedId) ?? null;

  const openTicket = useCallback(async (id: string) => {
    setSelectedId(id);
    const r = await fetchTicket(id);
    setMessages(r?.messages ?? []);
  }, []);

  // Poll open ticket for new messages.
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!selectedId) return;
    pollRef.current = setInterval(async () => {
      const r = await fetchTicket(selectedId);
      if (r) setMessages(r.messages);
    }, 6000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedId]);

  async function handleReply() {
    const text = reply.trim();
    if (!text || !selectedId || sending) return;
    setReply('');
    setSending(true);
    const msg = await sendTicketMessage(selectedId, text);
    setSending(false);
    if (msg) {
      setMessages(prev => [...prev, msg]);
      // Eerste reactie van een behandelaar zet status automatisch op
      // 'in_behandeling' (server-side trigger) — lijst verversen.
      void loadTickets();
    }
  }

  async function handleStatusChange(status: SupportTicket['status']) {
    if (!selectedId) return;
    const ok = await updateTicketStatus(selectedId, status);
    if (ok) {
      setTickets(prev => prev.map(t => (t.id === selectedId ? { ...t, status } : t)));
    }
  }

  const filtered = filter === 'alle' ? tickets : tickets.filter(t => t.status === filter);
  const counts = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = tickets.filter(t => t.status === s).length;
    return acc;
  }, {});

  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`} style={{ minHeight: 480 }}>
      {/* ── Lijst ── */}
      <div className={`sm:w-[340px] shrink-0 ${selected ? 'hidden sm:block' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['open', 'in_behandeling', 'opgelost', 'alle'] as FilterId[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                  filter === f ? 'text-white' : 'text-gray-500 border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
                style={filter === f ? { background: ACCENT, borderColor: ACCENT } : undefined}
              >
                {f === 'alle' ? 'Alle' : STATUS_LABEL[f].label}
                {f !== 'alle' && counts[f] > 0 && <span className="ml-1 opacity-70">{counts[f]}</span>}
              </button>
            ))}
          </div>
          <button onClick={() => void loadTickets()} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" title="Vernieuwen">
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center pt-10"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center pt-10 text-sm text-gray-400">
            <Inbox size={28} className="mx-auto mb-2 opacity-40" />
            Geen tickets in deze status.
          </div>
        ) : (
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-0.5">
            {filtered.map(t => (
              <button
                key={t.id}
                onClick={() => openTicket(t.id)}
                className={`w-full text-left bg-white border rounded-xl p-3 transition-colors ${
                  selectedId === t.id ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{t.subject}</span>
                  {t.priority === 'pro' && <Crown size={13} className="shrink-0 text-amber-500 mt-0.5" />}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: STATUS_LABEL[t.status].color, background: STATUS_LABEL[t.status].bg }}
                  >
                    {STATUS_LABEL[t.status].label}
                  </span>
                  <span className="text-[10px] text-gray-400">{SENDER_LABEL[t.created_by_kind] ?? t.created_by_kind}</span>
                  <span className="text-[10px] text-gray-300">·</span>
                  <span className="text-[10px] text-gray-400">{categoryName(t.category_id)}</span>
                  {t.source === 'ai_escalation' && <Sparkles size={11} className="text-emerald-500" />}
                </div>
                <div className="text-[11px] text-gray-400 mt-1">{t.created_by_name} · {timeAgo(t.updated_at)}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail ── */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {!selected ? (
            <div className="hidden sm:flex items-center justify-center h-full text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl min-h-[300px]">
              Selecteer een ticket om te bekijken.
            </div>
          ) : (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden"
              style={{ minHeight: 480 }}
            >
              <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button onClick={() => setSelectedId(null)} className="sm:hidden mb-1.5 text-xs text-gray-400 flex items-center gap-1">
                    <ArrowLeft size={12} /> Terug
                  </button>
                  <h3 className="font-bold text-gray-900 text-sm leading-snug">{selected.subject}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {selected.created_by_name} ({SENDER_LABEL[selected.created_by_kind] ?? selected.created_by_kind}) · {categoryName(selected.category_id)}
                  </p>
                </div>
                <select
                  value={selected.status}
                  onChange={e => handleStatusChange(e.target.value as SupportTicket['status'])}
                  className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-1.5 shrink-0"
                  style={{ color: STATUS_LABEL[selected.status].color }}
                >
                  {STATUS_ORDER.map(s => (
                    <option key={s} value={s}>{STATUS_LABEL[s].label}</option>
                  ))}
                </select>
              </div>

              {selected.ai_summary && (
                <div className="mx-4 mt-3 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 text-xs text-emerald-800 flex gap-2">
                  <Sparkles size={13} className="shrink-0 mt-0.5" />
                  <div><span className="font-semibold">AI-samenvatting: </span>{selected.ai_summary}</div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 bg-gray-50">
                {messages.map(m => (
                  <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[11px] font-bold text-gray-600">{m.sender_name}</span>
                      <span className="text-[10px] text-gray-400">{timeAgo(m.created_at)}</span>
                    </div>
                    <div className="text-gray-800 leading-snug whitespace-pre-wrap">{m.body}</div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 border-t border-gray-100 flex items-center gap-2">
                <input
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleReply(); }}
                  placeholder="Reageer op dit ticket…"
                  className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleReply}
                  disabled={sending || !reply.trim()}
                  className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40 shrink-0"
                  aria-label="Versturen"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
