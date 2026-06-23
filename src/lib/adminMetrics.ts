import { supabase } from './supabase';

export interface AdminMetrics {
  totals: {
    clubs: number;
    teams: number;
    players: number;
    coaches: number;
    club_admins: number;
    parents: number;
  };
  signups: { today: number; last_7d: number; last_30d: number };
  activity: { events_7d: number; events_30d: number; submissions_7d: number; videos_7d: number };
  engagement: {
    active_players_7d: number;
    active_players_30d: number;
    active_teams_30d: number;
    active_clubs_30d: number;
    dormant_clubs: number;
  };
  generated_at: string;
}

// Roept de SECURITY DEFINER RPC aan. Werkt alleen wanneer de ingelogde
// gebruiker de superadmin is — anders gooit de RPC een fout.
export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const { data, error } = await supabase.rpc('admin_metrics');
  if (error) throw new Error(error.message);
  return data as AdminMetrics;
}
