import { useState, useEffect, useCallback } from 'react';
import { Loader2, Building2, Zap, ChevronRight, ChevronDown } from 'lucide-react';
import Card from '../ui/Card';
import { NEON_COLOR } from '../../utils/constants';
import { fetchAllClubsWithTier } from '../../lib/trainingLibrary';
import ClubTrainingTab from '../club/ClubTrainingTab';

type Club = { id: string; name: string; subscription_tier: 'free' | 'pro' };

export default function TrainingModule() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setClubs(await fetchAllClubsWithTier());
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="animate-spin h-8 w-8 mr-3" style={{ color: NEON_COLOR }} /> Clubs laden…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Voetballessen</h1>
        <p className="text-sm text-gray-500 mt-1">Activeer het seizoensprogramma PRO per club en beheer leeftijdscategorieën.</p>
      </div>

      <div className="space-y-2">
        {clubs.length === 0 && (
          <Card light={false}><p className="text-gray-500 text-sm text-center py-6">Geen clubs gevonden.</p></Card>
        )}
        {clubs.map(club => {
          const open = selected === club.id;
          return (
            <div key={club.id} className="rounded-xl border border-gray-800 overflow-hidden">
              <button
                onClick={() => setSelected(open ? null : club.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/40 transition-colors text-left"
              >
                <Building2 size={16} className="text-gray-500 shrink-0" />
                <span className="flex-1 font-semibold text-white text-sm">{club.name}</span>
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0"
                  style={club.subscription_tier === 'pro'
                    ? { backgroundColor: `${NEON_COLOR}20`, color: NEON_COLOR }
                    : { backgroundColor: '#1f2937', color: '#6b7280' }}
                >
                  {club.subscription_tier === 'pro' ? 'PRO' : 'FREE'}
                </span>
                {open
                  ? <ChevronDown size={15} className="text-gray-500 shrink-0" />
                  : <ChevronRight size={15} className="text-gray-500 shrink-0" />}
              </button>

              {open && (
                <div className="border-t border-gray-800 bg-white p-4">
                  <ClubTrainingTab clubId={club.id} isSuperAdmin />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
