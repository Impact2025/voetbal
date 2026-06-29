import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, Send, MessageSquare, Hash, Plus, X, ChevronDown,
  CheckCheck, Reply, Bell, BellOff, Users, AtSign,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  fetchMessages, sendMessage, subscribeToChannel,
  fetchChannels, ensureChannels, joinChannel,
  updateLastRead, fetchUnreadCounts, toggleMute,
  type TeamChannelRow, type TeamChannelMessageRow,
} from '../../lib/teamChat';
import type { UserData } from '../../types';

// ─── Props ──────────────────────────────────────────────────────────────────

interface TeamChatProps {
  teamId: string;
  userData: Pick<UserData, 'uid' | 'role'>;
  userName: string;
  className?: string;
  onUnreadChange?: (total: number) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function formatDateSeparator(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  if (sameDay(dateStr, today.toISOString())) return 'Vandaag';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay(dateStr, yesterday.toISOString())) return 'Gisteren';
  return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
}

const ROLE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  coach:      { label: 'Coach',     color: '#16A34A', bg: '#dcfce7' },
  club_admin: { label: 'Beheerder', color: '#2563EB', bg: '#dbeafe' },
  parent:     { label: 'Ouder',     color: '#D97706', bg: '#fef3c7' },
  player:     { label: '',          color: '#6b7280', bg: '#f3f4f6' },
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function TeamChat({
  teamId, userData, userName, className = '', onUnreadChange,
}: TeamChatProps) {
  const [channels, setChannels] = useState<TeamChannelRow[]>([]);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<TeamChannelMessageRow[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [replyTo, setReplyTo] = useState<TeamChannelMessageRow | null>(null);
  const [showChannelList, setShowChannelList] = useState(false);
  const [joinedChannels, setJoinedChannels] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const role = userData.role as TeamChannelMessageRow['sender_role'];

  // ── Load channels ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);

    ensureChannels(teamId).then(() => {
      fetchChannels(teamId).then((chs) => {
        setChannels(chs);
        // Auto-join + set active
        const joinPromises = chs.map((ch) =>
          joinChannel(ch.id, userData.uid, role).then(() => ch.id),
        );
        Promise.all(joinPromises).then((ids) => {
          setJoinedChannels(new Set(ids));
          if (!activeChannel && chs.length > 0) {
            setActiveChannel(chs[0].id);
          }
          setLoading(false);
        });
      });
    });
  }, [teamId, userData.uid]);

  // ── Load messages & subscribe ────────────────────────────────────────────

  useEffect(() => {
    if (!activeChannel) return;

    // Laad berichten
    fetchMessages(activeChannel).then(setMessages);

    // Markeer als gelezen
    updateLastRead(activeChannel, userData.uid);

    // Realtime subscription
    if (unsubRef.current) unsubRef.current();
    const sub = subscribeToChannel(activeChannel, (msg) => {
      setMessages((prev) => {
        // Voorkom dubbele berichten door realtime + eigen insert
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      updateLastRead(activeChannel, userData.uid);
    });
    unsubRef.current = sub.unsubscribe;

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [activeChannel, userData.uid]);

  // ── Unread counts ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!userData.uid) return;
    const interval = setInterval(() => {
      fetchUnreadCounts(userData.uid).then((counts) => {
        setUnread(counts);
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        onUnreadChange?.(total);
      });
    }, 15_000); // elke 15 seconden

    return () => clearInterval(interval);
  }, [userData.uid, onUnreadChange]);

  // ── Scroll naar onder bij nieuwe berichten ──────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ── Send ─────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !activeChannel || sending) return;

    setSending(true);
    const msg = await sendMessage(
      activeChannel, userData.uid, userName, role,
      text, undefined, replyTo?.id,
    );
    if (msg) {
      setMessages((prev) => [...prev, msg]);
      setInput('');
      setReplyTo(null);
    }
    setSending(false);
    inputRef.current?.focus();
  }, [input, activeChannel, sending, userData.uid, userName, role, replyTo]);

  // ── Keyboard ────────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Active channel object ────────────────────────────────────────────────

  const activeCh = channels.find((c) => c.id === activeChannel);

  // ── Unread badge total ───────────────────────────────────────────────────

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0);

  // ── Render date separators + group by sender ────────────────────────────

  function renderMessages() {
    const elements: JSX.Element[] = [];
    let lastDate = '';
    let lastSender = '';

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      const isMe = m.sender_id === userData.uid;
      const showDate = !lastDate || !sameDay(m.created_at, lastDate);
      const showSender = m.sender_name !== lastSender;
      const showAvatar = showSender || (i > 0 && messages[i - 1].sender_id !== m.sender_id);

      if (showDate) {
        elements.push(
          <div key={`date-${i}`} className="flex items-center gap-3 my-4 first:mt-0">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
              {formatDateSeparator(m.created_at)}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>,
        );
      }

      lastDate = m.created_at;
      lastSender = m.sender_name;

      const badge = ROLE_BADGE[m.sender_role] ?? ROLE_BADGE.player;
      const time = timeAgo(m.created_at);

      elements.push(
        <div key={m.id} className={`flex gap-2.5 mb-2 ${isMe ? 'flex-row-reverse' : ''}`}>
          {/* Avatar */}
          {!isMe && (
            <div
              className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black mt-0.5"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {m.sender_name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Bubble */}
          <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
            {/* Sender name + role badge */}
            {!isMe && showSender && (
              <div className="flex items-center gap-1.5 mb-1 ml-1">
                <span className="text-xs font-bold text-gray-700">{m.sender_name}</span>
                {badge.label && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>
                )}
              </div>
            )}

            {/* Reply-to reference */}
            {m.reply_to && (
              <div
                className={`text-[10px] px-3 py-1 rounded-t-lg flex items-center gap-1 ${
                  isMe ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'
                }`}
              >
                <Reply size={10} />
                <span className="truncate max-w-[120px]">
                  {messages.find((mm) => mm.id === m.reply_to)?.content || 'Bericht'}
                </span>
              </div>
            )}

            {/* Content */}
            <div
              className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                isMe
                  ? 'rounded-tr-md bg-emerald-500 text-white'
                  : 'rounded-tl-md bg-gray-100 text-gray-800'
              }`}
            >
              {m.content}
            </div>

            {/* Time + status */}
            <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'flex-row-reverse' : ''} px-1`}>
              <span className="text-[9px] text-gray-400">{time}</span>
              {isMe && <CheckCheck size={10} className="text-emerald-500" />}
              {!isMe && (
                <button
                  onClick={() => {
                    setReplyTo(m);
                    inputRef.current?.focus();
                  }}
                  className="text-gray-300 hover:text-emerald-500 transition-colors"
                >
                  <Reply size={10} />
                </button>
              )}
            </div>
          </div>
        </div>,
      );
    }

    if (elements.length === 0) {
      elements.push(
        <div key="empty" className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare size={32} className="text-gray-200 mb-3" />
          <p className="text-sm font-bold text-gray-400">Nog geen berichten</p>
          <p className="text-xs text-gray-300 mt-1">Begin het gesprek!</p>
        </div>,
      );
    }

    return elements;
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={`flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden ${className}`}>
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => setShowChannelList(!showChannelList)}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <Hash size={16} className="text-emerald-500 shrink-0" />
            <span className="text-sm font-bold text-gray-900 truncate">
              {activeCh?.name || 'Teamchat'}
            </span>
            <ChevronDown size={14} className="text-gray-400 shrink-0" />
          </button>

          {totalUnread > 0 && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
              {totalUnread}
            </span>
          )}

          <button
            onClick={() => {
              if (activeChannel) toggleMute(activeChannel, userData.uid, !unread[activeChannel] || unread[activeChannel] === 0);
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {activeChannel && unread[activeChannel] ? (
              <BellOff size={14} className="text-gray-400" />
            ) : (
              <Bell size={14} className="text-gray-400" />
            )}
          </button>
        </div>

        {/* ── Channel switcher dropdown ── */}
        <AnimatePresence>
          {showChannelList && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-gray-50"
            >
              <div className="p-2 space-y-0.5">
                {channels.map((ch) => {
                  const uc = unread[ch.id] ?? 0;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setActiveChannel(ch.id);
                        setShowChannelList(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors min-h-[44px] ${
                        ch.id === activeChannel
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Hash size={14} className="shrink-0 opacity-50" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{ch.name}</p>
                        {ch.description && (
                          <p className="text-[10px] text-gray-400 truncate">{ch.description}</p>
                        )}
                      </div>
                      {uc > 0 && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">
                          {uc}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Members indicator */}
                <div className="flex items-center gap-2 px-3 py-2 text-[10px] text-gray-400">
                  <Users size={12} />
                  <span>Teamleden kunnen meelezen</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-2 scroll-smooth">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin h-6 w-6 text-gray-300" />
          </div>
        ) : (
          renderMessages()
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Reply indicator ── */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <Reply size={12} className="text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-emerald-700 truncate">
                  {replyTo.sender_name}
                </p>
                <p className="text-[10px] text-gray-500 truncate">{replyTo.content}</p>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
              >
                <X size={12} className="text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-gray-100 bg-white p-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 focus-within:border-emerald-300 focus-within:ring-1 focus-within:ring-emerald-200 transition-all">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Bericht naar #${activeCh?.name || 'team'}...`}
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none min-h-[24px]"
              maxLength={2000}
              disabled={sending}
            />
            <button
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              title="@mention"
              tabIndex={-1}
            >
              <AtSign size={14} className="text-gray-400" />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || !activeChannel}
            className={`p-2.5 rounded-xl transition-all min-w-[40px] min-h-[40px] flex items-center justify-center ${
              input.trim()
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                : 'bg-gray-100 text-gray-300'
            }`}
          >
            {sending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
