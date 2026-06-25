import { useState } from 'react'
import { Send, Bell, Users, User, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Player } from '../../types'

interface Props {
  players: Player[]
  teamId: string
  coachName: string
}

export default function PushNotificationSender({ players, teamId, coachName }: Props) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState<'team' | string>('team')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    if (!title.trim() || !body.trim()) return
    setSending(true)
    setResult(null)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string

      const payload: Record<string, string> = {
        title: title.trim(),
        body: body.trim(),
        coach_name: coachName,
      }
      if (target === 'team') {
        payload.team_id = teamId
      } else {
        payload.player_id = target
        payload.team_id = teamId
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/send-player-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { sent: number; total: number }
      setResult(data)
      setTitle('')
      setBody('')
    } catch (err) {
      setError(String(err))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4' }}>
          <Bell size={16} style={{ color: '#16a34a' }} />
        </div>
        <div>
          <h3 className="text-sm font-black text-gray-900">Push bericht naar spelers</h3>
          <p className="text-xs text-gray-400">Spelers krijgen een melding op hun telefoon.</p>
        </div>
      </div>

      {/* Recipient selector */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Ontvanger</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTarget('team')}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors"
            style={target === 'team'
              ? { background: '#16a34a', color: '#fff', borderColor: '#16a34a' }
              : { background: '#f9fafb', color: '#374151', borderColor: '#e5e7eb' }}
          >
            <Users size={12} /> Hele team
          </button>
          {players.map(p => (
            <button
              key={p.id}
              onClick={() => setTarget(p.id)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors"
              style={target === p.id
                ? { background: '#16a34a', color: '#fff', borderColor: '#16a34a' }
                : { background: '#f9fafb', color: '#374151', borderColor: '#e5e7eb' }}
            >
              <User size={12} /> {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Onderwerp</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="bv. Training morgen afgelast!"
          maxLength={80}
          className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
        />
      </div>

      {/* Body */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Bericht</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="bv. Vanwege het slechte weer is de training van morgen afgelast. We trainen volgende week weer!"
          maxLength={200}
          rows={3}
          className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 resize-none"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{body.length}/200</p>
      </div>

      {/* Send button */}
      <button
        onClick={send}
        disabled={sending || !title.trim() || !body.trim()}
        className="w-full flex items-center justify-center gap-2 text-sm font-black py-3 rounded-xl transition-opacity disabled:opacity-40"
        style={{ background: '#16a34a', color: '#fff' }}
      >
        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        {sending ? 'Versturen...' : 'Verstuur push bericht'}
      </button>

      {result && (
        <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          Verstuurd naar {result.sent} van {result.total} speler{result.total !== 1 ? 's' : ''} met de app geïnstalleerd.
        </div>
      )}
      {error && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          Fout: {error}
        </div>
      )}
    </div>
  )
}
