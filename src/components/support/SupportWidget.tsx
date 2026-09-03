import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy, X, Send, Loader2, Bot, User as UserIcon,
  Ticket, ArrowLeft, CheckCircle2, MessageCircle,
} from 'lucide-react';
import {
  sendChatMessage, escalateChatToTicket, fetchMyTickets, fetchTicket, sendTicketMessage,
  type SupportTicket, type SupportMessage,
} from '../../lib/support';

interface ChatBubble {
  role: 'user' | 'assistant';
  content: string;
}

type View = 'chat' | 'tickets' | 'ticket-detail';

const STATUS_LABEL: Record<SupportTicket['status'], { label: string; color: string; bg: string }> = {
  open:            { label: 'Open',          color: '#B45309', bg: '#fef3c7' },
  in_behandeling:  { label: 'In behandeling', color: '#1D4ED8', bg: '#dbeafe' },
  opgelost:        { label: 'Opgelost',       color: '#15803D', bg: '#dcfce7' },
  gesloten:        { label: 'Gesloten',       color: '#57534e', bg: '#f3f4f6' },
};

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('chat');

  // ── Chat state ──────────────────────────────────────────────────────────
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [offerEscalate, setOfferEscalate] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [ticketCreated, setTicketCreated] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // ── Tickets state ───────────────────────────────────────────────────────
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [activeMessages, setActiveMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [bubbles, offerEscalate, ticketCreated]);

  useEffect(() => {
    if (view === 'tickets') {
      setTicketsLoading(true);
      fetchMyTickets().then(t => { setTickets(t); setTicketsLoading(false); });
    }
  }, [view]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setBubbles(prev => [...prev, { role: 'user', content: text }]);
    setSending(true);
    setOfferEscalate(false);
    const r = await sendChatMessage(text, sessionId);
    setSending(false);
    if (!r) {
      setBubbles(prev => [...prev, { role: 'assistant', content: 'Sorry, er ging iets mis. Probeer het nog eens.' }]);
      return;
    }
    setSessionId(r.sessionId);
    setBubbles(prev => [...prev, { role: 'assistant', content: r.reply }]);
    if (r.escalate) setOfferEscalate(true);
  }

  async function handleEscalate() {
    if (!sessionId || escalating) return;
    setEscalating(true);
    const lastUserMsg = [...bubbles].reverse().find(b => b.role === 'user')?.content ?? 'Vraag via support-chat';
    const r = await escalateChatToTicket(sessionId, lastUserMsg.slice(0, 120));
    setEscalating(false);
    if (r) {
      setTicketCreated(r.ticketId);
      setOfferEscalate(false);
    }
  }

  async function openTicket(t: SupportTicket) {
    setActiveTicket(t);
    setView('ticket-detail');
    const r = await fetchTicket(t.id);
    setActiveMessages(r?.messages ?? []);
  }

  async function handleReply() {
    const text = reply.trim();
    if (!text || !activeTicket) return;
    setReply('');
    const msg = await sendTicketMessage(activeTicket.id, text);
    if (msg) setActiveMessages(prev => [...prev, msg]);
  }

  function resetChat() {
    setBubbles([]);
    setSessionId(undefined);
    setOfferEscalate(false);
    setTicketCreated(null);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="mb-3 w-[340px] max-w-[90vw] h-[480px] max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
              <div className="flex items-center gap-2">
                {view !== 'chat' && (
                  <button
                    onClick={() => { setView('chat'); setActiveTicket(null); }}
                    className="p-1 -ml-1 rounded hover:bg-white/10"
                    aria-label="Terug"
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <span className="font-semibold text-sm">
                  {view === 'chat' ? 'Skillkaart support' : view === 'tickets' ? 'Mijn tickets' : activeTicket?.subject ?? 'Ticket'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {view === 'chat' && (
                  <button
                    onClick={() => setView('tickets')}
                    className="p-1.5 rounded hover:bg-white/10"
                    title="Mijn tickets"
                  >
                    <Ticket size={16} />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1.5 rounded hover:bg-white/10" aria-label="Sluiten">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            {view === 'chat' && (
              <>
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
                  {bubbles.length === 0 && (
                    <div className="text-sm text-gray-500 text-center mt-6 px-4">
                      Stel je vraag — ik zoek meteen in de FAQ. Kom ik er niet uit, dan zet ik je door naar een medewerker.
                    </div>
                  )}
                  {bubbles.map((b, i) => (
                    <div key={i} className={`flex gap-2 ${b.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {b.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot size={13} className="text-emerald-700" />
                        </div>
                      )}
                      <div
                        className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                          b.role === 'user' ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white border border-gray-200 rounded-bl-sm'
                        }`}
                      >
                        {b.content}
                      </div>
                      {b.role === 'user' && (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                          <UserIcon size={13} className="text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))}
                  {sending && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 pl-8">
                      <Loader2 size={12} className="animate-spin" /> aan het typen…
                    </div>
                  )}

                  {ticketCreated ? (
                    <div className="bg-white border border-emerald-200 rounded-xl p-3 text-sm flex flex-col items-start gap-2">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <CheckCircle2 size={15} /> Ticket aangemaakt
                      </div>
                      <p className="text-gray-600 text-xs">Een medewerker neemt het gesprek over — je vindt het terug bij "Mijn tickets".</p>
                      <button
                        onClick={() => { resetChat(); }}
                        className="text-xs font-medium text-emerald-700 underline"
                      >
                        Nieuwe vraag stellen
                      </button>
                    </div>
                  ) : offerEscalate && (
                    <div className="bg-white border border-amber-200 rounded-xl p-3 text-sm flex items-center justify-between gap-2">
                      <span className="text-gray-600 text-xs">Wil je een medewerker erbij halen?</span>
                      <button
                        onClick={handleEscalate}
                        disabled={escalating}
                        className="shrink-0 flex items-center gap-1 text-xs font-medium bg-amber-500 text-white px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                      >
                        {escalating ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
                        Praat met een mens
                      </button>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                <div className="p-2.5 border-t border-gray-200 bg-white flex items-center gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                    placeholder="Typ je vraag…"
                    disabled={!!ticketCreated}
                    className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !!ticketCreated || !input.trim()}
                    className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40 shrink-0"
                    aria-label="Versturen"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </>
            )}

            {view === 'tickets' && (
              <div className="flex-1 overflow-y-auto px-3 py-3 bg-gray-50">
                {ticketsLoading ? (
                  <div className="flex justify-center pt-8"><Loader2 size={18} className="animate-spin text-gray-400" /></div>
                ) : tickets.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center mt-6">Nog geen tickets. Stel eerst je vraag in de chat.</p>
                ) : (
                  <div className="space-y-2">
                    {tickets.map(t => (
                      <button
                        key={t.id}
                        onClick={() => openTicket(t)}
                        className="w-full text-left bg-white border border-gray-200 rounded-xl p-3 hover:border-emerald-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-gray-800 leading-snug">{t.subject}</span>
                          <span
                            className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ color: STATUS_LABEL[t.status].color, background: STATUS_LABEL[t.status].bg }}
                          >
                            {STATUS_LABEL[t.status].label}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          {new Date(t.updated_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {view === 'ticket-detail' && activeTicket && (
              <>
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-gray-50">
                  <span
                    className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1"
                    style={{ color: STATUS_LABEL[activeTicket.status].color, background: STATUS_LABEL[activeTicket.status].bg }}
                  >
                    {STATUS_LABEL[activeTicket.status].label}
                  </span>
                  {activeMessages.map(m => (
                    <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-2.5 text-sm">
                      <div className="text-[11px] font-medium text-gray-500 mb-0.5">{m.sender_name}</div>
                      <div className="text-gray-800 leading-snug whitespace-pre-wrap">{m.body}</div>
                    </div>
                  ))}
                </div>
                <div className="p-2.5 border-t border-gray-200 bg-white flex items-center gap-2">
                  <input
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleReply(); }}
                    placeholder="Reageer…"
                    className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleReply}
                    disabled={!reply.trim()}
                    className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40 shrink-0"
                    aria-label="Versturen"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full bg-emerald-600 text-white shadow-xl flex items-center justify-center hover:bg-emerald-700 transition-colors"
        aria-label={open ? 'Sluit support' : 'Open support'}
      >
        {open ? <X size={22} /> : <LifeBuoy size={22} />}
      </button>
    </div>
  );
}
