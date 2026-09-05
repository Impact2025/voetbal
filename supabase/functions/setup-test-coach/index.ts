import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json().catch(() => ({})) as {
      email?: string
      team_id?: string
      action?: string
    }

    const email = (body.email || 'info@datingassistent.nl').toLowerCase()
    const teamId = body.team_id || 'VVCO11-1'

    if (body.action === 'create') {
      // Step 1: Create/ensure Supabase Auth user exists with the given email + password
      // Step 2: Insert team_coaches row as 'invited' (if not exists)
      // Step 3: If user exists, activate the coach link

      // Check if auth user exists
      const { data: existingUsers, error: listErr } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === email)

      if (!existingUser) {
        // Create new auth user
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: 'TestCoach2026!',
          email_confirm: true,
        })
        if (createErr) {
          return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        Object.assign(existingUser || {}, newUser.user)
      }

      // Check if team_coaches row already exists
      const { data: existingCoach, error: tcErr } = await supabaseAdmin
        .from('team_coaches')
        .select('*')
        .eq('team_id', teamId)
        .eq('email', email)
        .maybeSingle()

      if (tcErr) {
        return new Response(JSON.stringify({ error: tcErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const user = existingUser as any
      const coachId = user?.id ?? null

      if (!existingCoach) {
        // Insert new team_coaches row
        const { data: newCoach, error: insertErr } = await supabaseAdmin
          .from('team_coaches')
          .insert({
            team_id: teamId,
            club_id: 'VVC',
            coach_id: coachId,
            email: email,
            role: 'head',
            status: coachId ? 'active' : 'invited',
          })
          .select()

        if (insertErr) {
          return new Response(JSON.stringify({ error: insertErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // If coach_id is set, also update teams.coach_id
        if (coachId) {
          await supabaseAdmin.from('teams').update({ coach_id: coachId }).eq('id', teamId)
          // Ensure profile exists
          const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('id', coachId).maybeSingle()
          if (!profile) {
            await supabaseAdmin.from('profiles').insert({
              id: coachId,
              email: email,
              role: 'coach',
              team_id: teamId,
              club_id: 'VVC',
            })
          }
        }

        return new Response(JSON.stringify({
          success: true,
          action: 'created',
          coach: newCoach,
          email,
          password: 'TestCoach2026!',
          teamId,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      } else {
        // Update existing coach to 'active' and link to user
        const { data: updated, error: updErr } = await supabaseAdmin
          .from('team_coaches')
          .update({
            coach_id: coachId,
            status: 'active',
            joined_at: new Date().toISOString(),
            invite_token: null,
          })
          .eq('team_id', teamId)
          .eq('email', email)
          .select()

        if (updErr) {
          return new Response(JSON.stringify({ error: updErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (coachId) {
          await supabaseAdmin.from('teams').update({ coach_id: coachId }).eq('id', teamId)
        }

        return new Response(JSON.stringify({
          success: true,
          action: 'updated',
          coach: updated,
          email,
          password: 'TestCoach2026!',
          teamId,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    return new Response(JSON.stringify({ error: 'action "create" required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
