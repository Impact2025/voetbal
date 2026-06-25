import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, X, Plus, Loader2, ArrowLeft,
  UserCircle2, Users, ChevronRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import type { Conversation, ConversationMessage, MessagingContact } from '../../types';

const ACCENT = '#16A34A';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MessagingInboxProps {
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'coach' | 'club_admin' | 'parent';
  clubId?: string;
  teamId?: string;
  onUnreadChange?: (count: number) => void;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function otherParticipant(conv: Conversation, myId: string) {
  const idx = conv.participant_ids.findIndex(id => id !== myId);
  return {
    name: conv.participant_names[idx] ?? 'Onbekend',
    role: conv.participant_roles[idx] ?? '',
  };
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'gisteren';
  if (diffDays < 7) return d.toLocaleDateString('nl-NL', { weekday: 'short' });
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

function roleLabel(role: string) {
  if (role === 'club_admin') return 'Club Admin';
  if (role === 'coach')      return 'Trainer';
  if (role === 'parent')     return 'Ouder';
  return role;
}

// ─── New Conversation Modal ───────────────────────────────────────────────────

interface NewConvModalProps {
  contacts: MessagingContact[];
  loading: boolean;
  onClose: () => void;
  onStart: (contact: MessagingContact) => void;
}

const NewConvModal = ({ contacts, loading, onClose, onStart }: NewConvModalProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(4px)' }}
    onClick={e => e.target === e.currentTarget && onClose()}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <span className="font-bold text-gray-900">Nieuw gesprek</span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <X size={16} />
        </button>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin h-6 w-6" style={{ color: ACCENT }} />
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users size={28} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Geen contacten beschikbaar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {contacts.map(c => (
              <button
                key={c.id}
                onClick={() => onStart(c)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 shrink-0">
                  <UserCircle2 size={20} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{roleLabel(c.role)}{c.subtitle ? ` · ${c.subtitle}` : ''}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  </motion.div>
);

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MessageBubble = ({ msg, isMine }: { msg: ConversationMessage; isMine: boolean }) => (
  <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} gap-0.5`}>
    {!isMine && (
      <span className="text-[10px] text-gray-400 px-1">{msg.sender_name}</span>
    )}
    <div
      className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
        isMine
          ? 'text-white rounded-br-sm'
          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
      }`}
      style={isMine ? { backgroundColor: ACCENT } : {}}
    >
      {msg.content}
    </div>
    <span className="text-[9px] text-gray-400 px-1">{formatTime(msg.created_at)}</span>
  </div>
);

// ─── Thread View ──────────────────────────────────────────────────────────────

interface ThreadViewProps {
  conv: Conversation;
  currentUserId: string;
  currentUserName: string;
  onBack: () => void;
}

const ThreadView = ({ conv, currentUserId, currentUserName, onBack }: ThreadViewProps) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const other = otherParticipant(conv, currentUserId);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as ConversationMessage[]);
  }, [conv.id]);

  useEffect(() => {
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));

    // Mark read
    supabase.from('conversation_reads').upsert({
      conversation_id: conv.id,
      user_id: currentUserId,
      last_read_at: new Date().toISOString(),
    }).then(() => {/* best-effort */});

    // Realtime: listen for new messages in this conversation
    const channel = supabase
      .channel(`msgs:${conv.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversation_messages', filter: `conversation_id=eq.${conv.id}` },
        payload => {
          const newMsg = payload.new as ConversationMessage;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Update read cursor for messages we receive
          if (newMsg.sender_id !== currentUserId) {
            supabase.from('conversation_reads').upsert({
              conversation_id: conv.id,
              user_id: currentUserId,
              last_read_at: new Date().toISOString(),
            }).then(() => {/* best-effort */});
          }
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [conv.id, currentUserId, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft('');

    // Optimistic: toon bericht direct in de UI
    const tempId = crypto.randomUUID();
    const optimistic: ConversationMessage = {
      id: tempId,
      conversation_id: conv.id,
      sender_id: currentUserId,
      sender_name: currentUserName,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const { error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conv.id,
          sender_id: currentUserId,
          sender_name: currentUserName,
          content,
        });
      if (error) {
        // Rollback
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setDraft(content);
        toast.error('Versturen mislukt: ' + error.message);
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setDraft(content);
      toast.error('Verbindingsfout — probeer opnieuw');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 md:hidden">
          <ArrowLeft size={16} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
          <UserCircle2 size={18} className="text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 truncate">{other.name}</p>
          <p className="text-[10px] text-gray-400">{roleLabel(other.role)}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-8">
            <Loader2 className="animate-spin h-6 w-6 text-gray-300" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <MessageSquare size={28} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm">Begin een gesprek met {other.name}</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMine={msg.sender_id === currentUserId}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Typ een bericht… (Enter om te versturen)"
            rows={1}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-gray-300 transition-colors"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: ACCENT }}
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Conversation List Item ───────────────────────────────────────────────────

interface ConvItemProps {
  conv: Conversation;
  myId: string;
  isActive: boolean;
  unread: boolean;
  onClick: () => void;
}

const ConvItem = ({ conv, myId, isActive, unread, onClick }: ConvItemProps) => {
  const other = otherParticipant(conv, myId);
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-gray-50 ${
        isActive ? 'bg-green-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
          <UserCircle2 size={20} className="text-gray-400" />
        </div>
        {unread && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
            style={{ backgroundColor: ACCENT }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${unread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
            {other.name}
          </p>
          <span className="text-[10px] text-gray-400 shrink-0">
            {formatTime(conv.last_message_at)}
          </span>
        </div>
        <p className={`text-[11px] truncate mt-0.5 ${unread ? 'text-gray-700' : 'text-gray-400'}`}>
          {conv.last_message_preview ?? roleLabel(other.role)}
        </p>
      </div>
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MessagingInbox = ({
  currentUserId,
  currentUserName,
  currentUserRole,
  clubId,
  teamId,
  onUnreadChange,
  className,
}: MessagingInboxProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [reads, setReads] = useState<Record<string, string>>({});
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [contacts, setContacts] = useState<MessagingContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');

  const activeConv = conversations.find(c => c.id === activeConvId) ?? null;

  // ── Load conversations ──────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    const [{ data: convs }, { data: readRows }] = await Promise.all([
      supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false }),
      supabase
        .from('conversation_reads')
        .select('conversation_id, last_read_at')
        .eq('user_id', currentUserId),
    ]);
    if (convs) setConversations(convs as Conversation[]);
    if (readRows) {
      const map: Record<string, string> = {};
      (readRows as { conversation_id: string; last_read_at: string }[]).forEach(r => {
        map[r.conversation_id] = r.last_read_at;
      });
      setReads(map);
    }
  }, [currentUserId]);

  useEffect(() => {
    setLoadingConvs(true);
    loadConversations().finally(() => setLoadingConvs(false));

    // Realtime: re-fetch when conversations change
    const channel = supabase
      .channel('conversations:me')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => void loadConversations()
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [loadConversations]);

  // ── Unread count ────────────────────────────────────────────────────────────

  useEffect(() => {
    const unread = conversations.filter(c => {
      const readAt = reads[c.id];
      if (!readAt) return true;
      return new Date(c.last_message_at) > new Date(readAt);
    }).length;
    onUnreadChange?.(unread);
  }, [conversations, reads, onUnreadChange]);

  const isUnread = (conv: Conversation) => {
    const readAt = reads[conv.id];
    if (!readAt) return true;
    return new Date(conv.last_message_at) > new Date(readAt);
  };

  // ── Mark conversation as read ───────────────────────────────────────────────

  const openConversation = (id: string) => {
    setActiveConvId(id);
    setMobileView('thread');
    const now = new Date().toISOString();
    supabase.from('conversation_reads').upsert({
      conversation_id: id,
      user_id: currentUserId,
      last_read_at: now,
    }).then(() => {
      setReads(prev => ({ ...prev, [id]: now }));
    });
  };

  // ── Load contacts for new conversation modal ────────────────────────────────

  const openNewModal = async () => {
    setShowNewModal(true);
    setLoadingContacts(true);
    try {
      let rows: MessagingContact[] = [];

      if (currentUserRole === 'club_admin' && clubId) {
        const { data } = await supabase.rpc('get_club_trainer_emails', { p_club_id: clubId });
        rows = (data ?? []).map((r: { coach_id: string; email: string; team_name: string }) => ({
          id: r.coach_id,
          name: r.team_name,
          role: 'coach',
          subtitle: r.email,
        }));
      } else if (currentUserRole === 'coach' && teamId) {
        const { data } = await supabase.rpc('get_coach_contacts', {
          p_coach_id: currentUserId,
          p_team_id: teamId,
        });
        rows = (data ?? []).map((r: { contact_id: string; contact_name: string; contact_role: string; subtitle: string }) => ({
          id: r.contact_id,
          name: r.contact_name,
          role: r.contact_role,
          subtitle: r.subtitle,
        }));
      } else if (currentUserRole === 'parent') {
        const { data } = await supabase.rpc('get_parent_contacts', { p_parent_id: currentUserId });
        rows = (data ?? []).map((r: { contact_id: string; contact_name: string; contact_role: string; subtitle: string }) => ({
          id: r.contact_id,
          name: r.contact_name,
          role: r.contact_role,
          subtitle: r.subtitle,
        }));
      }

      // Filter out contacts that already have a conversation with us
      const existingContactIds = new Set(
        conversations.flatMap(c => c.participant_ids.filter(id => id !== currentUserId))
      );
      setContacts(rows.filter(c => !existingContactIds.has(c.id)));
    } finally {
      setLoadingContacts(false);
    }
  };

  // ── Start conversation with a contact ──────────────────────────────────────

  const startConversation = async (contact: MessagingContact) => {
    setShowNewModal(false);

    // Check if conversation already exists
    const existing = conversations.find(c =>
      c.participant_ids.includes(currentUserId) && c.participant_ids.includes(contact.id)
    );
    if (existing) {
      openConversation(existing.id);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          club_id: clubId ?? null,
          participant_ids: [currentUserId, contact.id],
          participant_names: [currentUserName, contact.name],
          participant_roles: [currentUserRole, contact.role],
        })
        .select()
        .single();

      if (error) throw error;
      const newConv = data as Conversation;
      setConversations(prev => [newConv, ...prev]);
      openConversation(newConv.id);
    } catch {
      toast.error('Gesprek starten mislukt');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loadingConvs) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin h-8 w-8" style={{ color: ACCENT }} />
      </div>
    );
  }

  return (
    <div className={`flex rounded-2xl border border-gray-200 overflow-hidden bg-white ${className ?? 'h-[calc(100vh-200px)] min-h-[400px]'}`}>

      {/* ── Conversation list (left panel / mobile full) ── */}
      <div className={`flex flex-col border-r border-gray-100 ${
        mobileView === 'thread' ? 'hidden md:flex md:w-72 lg:w-80' : 'flex w-full md:w-72 lg:w-80'
      }`}>
        {/* List header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare size={15} style={{ color: ACCENT }} />
            <span className="font-bold text-sm text-gray-900">Berichten</span>
          </div>
          <button
            onClick={openNewModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            <Plus size={12} />
            Nieuw
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center py-16 px-4 text-gray-400">
              <MessageSquare size={32} className="mx-auto mb-3 text-gray-200" />
              <p className="font-semibold text-sm">Geen berichten nog</p>
              <p className="text-xs mt-1">Start een nieuw gesprek via de knop hierboven.</p>
            </div>
          ) : (
            conversations.map(conv => (
              <ConvItem
                key={conv.id}
                conv={conv}
                myId={currentUserId}
                isActive={conv.id === activeConvId}
                unread={isUnread(conv)}
                onClick={() => openConversation(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Thread panel (right / mobile full) ── */}
      <div className={`flex-1 flex flex-col min-w-0 ${
        mobileView === 'list' ? 'hidden md:flex' : 'flex'
      }`}>
        {activeConv ? (
          <ThreadView
            conv={activeConv}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onBack={() => setMobileView('list')}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-6">
            <MessageSquare size={40} className="mb-3 text-gray-200" />
            <p className="font-semibold text-gray-500">Selecteer een gesprek</p>
            <p className="text-sm mt-1">of start een nieuw gesprek</p>
            <button
              onClick={openNewModal}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: ACCENT }}
            >
              <Plus size={14} />
              Nieuw gesprek
            </button>
          </div>
        )}
      </div>

      {/* New conversation modal */}
      <AnimatePresence>
        {showNewModal && (
          <NewConvModal
            contacts={contacts}
            loading={loadingContacts}
            onClose={() => setShowNewModal(false)}
            onStart={startConversation}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessagingInbox;
