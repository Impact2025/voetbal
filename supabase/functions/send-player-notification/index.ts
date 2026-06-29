import { createClient } from 'npm:@supabase/supabase-js@2'
// @deno-types="npm:@types/web-push@3"
import webpush from 'npm:web-push@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Require authenticated coach
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { player_id, team_id, title, body, coach_name } = await req.json() as {
      player_id?: string
      team_id?: string
      title: string
      body: string
      coach_name?: string
    }

    if (!title || !body) {
      return new Response(JSON.stringify({ error: 'title and body required' }), { status: 400, headers: corsHeaders })
    }

    webpush.setVapidDetails(
      `mailto:${Deno.env.get('VAPID_EMAIL') ?? 'noreply@skillkaart.app'}`,
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!
    )

    // Resolve which player_ids to notify
    let playerIds: string[] = []

    if (player_id) {
      playerIds = [player_id]
    } else if (team_id) {
      const { data: players } = await supabase
        .from('players')
        .select('id')
        .eq('team_id', team_id)
      playerIds = (players ?? []).map((p: { id: string }) => p.id)
    }

    if (!playerIds.length) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Get push subscriptions
    const { data: subs } = await supabase
      .from('player_push_subscriptions')
      .select('*')
      .in('player_id', playerIds)

    // Save notifications to DB
    if (playerIds.length > 0) {
      await supabase.from('player_notifications').insert(
        playerIds.map(pid => ({ player_id: pid, team_id, title, body, coach_name }))
      )
    }

    // Send Web Push to each subscriber
    const results = await Promise.allSettled(
      (subs ?? []).map((s: { subscription: object }) =>
        webpush.sendNotification(
          s.subscription as webpush.PushSubscription,
          JSON.stringify({ title, body })
        )
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    return new Response(
      JSON.stringify({ sent, total: playerIds.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
