import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, MailOpen, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const ACCENT = '#16A34A';

interface PlayerNotification {
  id: string;
  title: string;
  body: string;
  coach_name: string | null;
  read: boolean;
  created_at: string;
}

interface Props {
  playerId: string;
  onUnreadChange?: (count: number) => void;
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

export default function PlayerNotificationsInbox({ playerId, onUnreadChange }: Props) {
  const [notifications, setNotifications] = useState<PlayerNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('player_notifications')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data ?? []) as PlayerNotification[]);
    setLoading(false);
  }, [playerId]);

  useEffect(() => {
    void load();

    const channel = supabase
      .channel(`player_notifications_${playerId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'player_notifications', filter: `player_id=eq.${playerId}` },
        () => { void load(); }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [playerId, load]);

  useEffect(() => {
    onUnreadChange?.(notifications.filter(n => !n.read).length);

    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length) {
      void supabase.from('player_notifications').update({ read: true }).in('id', unreadIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-300">
        <Loader2 size={22} className="animate-spin" />
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <Bell size={28} className="mb-2 text-gray-200" />
        <p className="text-sm font-bold text-gray-400">Nog geen berichten</p>
        <p className="text-xs text-gray-400 mt-1">Berichten van je trainer verschijnen hier.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {notifications.map(n => (
        <motion.div
          key={n.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-4"
          style={n.read ? { background: '#f9fafb', borderColor: '#e5e7eb' } : { background: '#f0fdf4', borderColor: `${ACCENT}40` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-900 truncate">{n.title}</p>
              <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-line">{n.body}</p>
            </div>
            {!n.read && (
              <span className="shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ background: ACCENT }} />
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400 font-semibold">
            <MailOpen size={11} />
            {n.coach_name || 'Trainer'} &middot; {formatTime(n.created_at)}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
