import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Loader2, Plus, ChevronDown, Pencil, Archive, ArchiveRestore,
  UserPlus, X, Mail, Trash2, Shield as ShieldIcon, BarChart2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchClubSubscriptionTier, setClubProStatus } from '../../lib/trainingLibrary';
import {
  createTeam, updateTeam, archiveTeam, unarchiveTeam,
  fetchTeamCoaches, fetchClubCoaches, addExistingCoachToTeam, inviteCoach, removeCoachFromTeam,
  type TeamDraft,
} from '../../lib/teamManagement';
import Card from '../ui/Card';
import Input from '../ui/Input';
import type { Team, TeamCoach } from '../../types';
import toast from 'react-hot-toast';

const ACCENT = '#16A34A';

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

interface TeamManagementTabProps {
  clubId: string;
  clubName: string;
  senderEmail: string;
  isSuperAdmin?: boolean;
  onTeamsChanged: () => void;
  onViewStats: (teamId: string) => void;
}

// ─── Nieuw team modal ─────────────────────────────────────────────────────────

const CreateTeamModal = ({ clubId, onClose, onCreated }: { clubId: string; onClose: () => void; onCreated: () => void }) => {
  const [name, setName] = useState('');
  const [teamClass, setTeamClass] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !teamClass.trim()) { toast.error('Vul naam en leeftijdscategorie in.'); return; }
    setSaving(true);
    try {
      const base = slugify(`${clubId}-${teamClass}-${name}`) || `${clubId}-${Date.now()}`;
      const draft: TeamDraft = { id: base, team_name: name.trim(), team_class: teamClass.trim() };
      await createTeam(clubId, draft);
      toast.success('Team aangemaakt!');
      onCreated();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm shadow-xl p-6"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Nieuw team</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <Input light label="Teamnaam" value={name} onChange={e => setName(e.target.value)} placeholder="bv. Impact JO10-1" />
          <Input light label="Leeftijdscategorie" value={teamClass} onChange={e => setTeamClass(e.target.value)} placeholder="bv. JO10-1" />
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium">Annuleren</button>
          <button onClick={handleCreate} disabled={saving} className="px-5 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity text-sm disabled:opacity-50 flex items-center gap-2" style={{ backgroundColor: ACCENT }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : null} Aanmaken
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Team bewerken modal ──────────────────────────────────────────────────────

const EditTeamModal = ({ team, onClose, onSaved }: { team: Team; onClose: () => void; onSaved: () => void }) => {
  const [name, setName] = useState(team.team_name);
  const [teamClass, setTeamClass] = useState(team.team_class);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTeam(team.id, { team_name: name.trim(), team_class: teamClass.trim() });
      toast.success('Team bijgewerkt.');
      onSaved();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm shadow-xl p-6"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Team bewerken</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="space-y-4">
          <Input light label="Teamnaam" value={name} onChange={e => setName(e.target.value)} />
          <Input light label="Leeftijdscategorie" value={teamClass} onChange={e => setTeamClass(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium">Annuleren</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity text-sm disabled:opacity-50 flex items-center gap-2" style={{ backgroundColor: ACCENT }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : null} Opslaan
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Coach toevoegen modal ────────────────────────────────────────────────────

interface AddCoachModalProps {
  team: Team;
  clubId: string;
  clubName: string;
  senderEmail: string;
  existingCoachIds: string[];
  clubCoaches: { coachId: string; email: string }[];
  onClose: () => void;
  onAdded: () => void;
}

const AddCoachModal = ({ team, clubId, clubName, senderEmail, existingCoachIds, clubCoaches, onClose, onAdded }: AddCoachModalProps) => {
  const [mode, setMode] = useState<'existing' | 'invite'>('existing');
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [role, setRole] = useState<'head' | 'assistant'>('assistant');
  const [saving, setSaving] = useState(false);

  const availableCoaches = clubCoaches.filter(c => !existingCoachIds.includes(c.coachId));

  const handleAddExisting = async () => {
    const coach = availableCoaches.find(c => c.coachId === selectedCoachId);
    if (!coach) { toast.error('Kies een coach.'); return; }
    setSaving(true);
    try {
      await addExistingCoachToTeam({ teamId: team.id, clubId, coachId: coach.coachId, email: coach.email, role });
      toast.success('Coach toegevoegd aan team.');
      onAdded();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { toast.error('Vul een e-mailadres in.'); return; }
    setSaving(true);
    try {
      const invite = await inviteCoach({ teamId: team.id, clubId, email: inviteEmail.trim(), role });
      const link = `${window.location.origin}/?coachInvite=${invite.invite_token}`;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          to: [inviteEmail.trim()],
          toNames: [team.team_name],
          subject: `Uitnodiging als coach van ${team.team_name}`,
          body: `Je bent uitgenodigd om coach te worden van ${team.team_name} bij ${clubName}.\n\nMaak je account aan via de link hieronder:\n${link}`,
          clubName,
          senderEmail,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Versturen van uitnodiging mislukt.');
      toast.success('Uitnodiging verstuurd!');
      onAdded();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm shadow-xl p-6"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Coach toevoegen — {team.team_name}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setMode('existing')} className={`py-2 rounded-lg text-xs font-bold transition-colors ${mode === 'existing' ? 'text-white' : 'bg-gray-100 text-gray-500'}`} style={mode === 'existing' ? { backgroundColor: ACCENT } : undefined}>
            Bestaande coach
          </button>
          <button onClick={() => setMode('invite')} className={`py-2 rounded-lg text-xs font-bold transition-colors ${mode === 'invite' ? 'text-white' : 'bg-gray-100 text-gray-500'}`} style={mode === 'invite' ? { backgroundColor: ACCENT } : undefined}>
            Nieuwe uitnodigen
          </button>
        </div>

        <div className="space-y-4">
          {mode === 'existing' ? (
            availableCoaches.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Geen andere coaches beschikbaar in deze club — nodig een nieuwe uit.</p>
            ) : (
              <select
                value={selectedCoachId}
                onChange={e => setSelectedCoachId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm bg-white text-gray-900"
              >
                <option value="">Kies een coach...</option>
                {availableCoaches.map(c => <option key={c.coachId} value={c.coachId}>{c.email}</option>)}
              </select>
            )
          ) : (
            <Input light label="E-mailadres" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="coach@email.com" />
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-600">Rol</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setRole('head')} className={`py-2 rounded-lg text-xs font-bold border transition-colors ${role === 'head' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>Hoofdcoach</button>
              <button onClick={() => setRole('assistant')} className={`py-2 rounded-lg text-xs font-bold border transition-colors ${role === 'assistant' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>Assistent</button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium">Annuleren</button>
          <button
            onClick={mode === 'existing' ? handleAddExisting : handleInvite}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity text-sm disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: ACCENT }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : mode === 'invite' ? <Mail size={14} /> : <UserPlus size={14} />}
            {mode === 'existing' ? 'Toevoegen' : 'Uitnodigen'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main tab ─────────────────────────────────────────────────────────────────

const TeamManagementTab = ({ clubId, clubName, senderEmail, isSuperAdmin = false, onTeamsChanged, onViewStats }: TeamManagementTabProps) => {
  const [isPro, setIsPro] = useState(false);
  const [togglingPro, setTogglingPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [coachesByTeam, setCoachesByTeam] = useState<Record<string, TeamCoach[]>>({});
  const [clubCoaches, setClubCoaches] = useState<{ coachId: string; email: string }[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [addCoachTeam, setAddCoachTeam] = useState<Team | null>(null);

  const reload = useCallback(async () => {
    const tier = await fetchClubSubscriptionTier(clubId);
    setIsPro(tier === 'pro');
    const { data: teamRows } = await supabase.from('teams').select('*').eq('club_id', clubId).order('team_name');
    const allTeams = (teamRows ?? []) as Team[];
    setTeams(allTeams);
    const [coaches, roster] = await Promise.all([
      fetchClubCoaches(clubId),
      fetchTeamCoaches(allTeams.map(t => t.id)),
    ]);
    setClubCoaches(coaches);
    const grouped: Record<string, TeamCoach[]> = {};
    roster.forEach(tc => { (grouped[tc.team_id] ??= []).push(tc); });
    setCoachesByTeam(grouped);
    setLoading(false);
  }, [clubId]);

  useEffect(() => { void reload(); }, [reload]);

  const handleTogglePro = async () => {
    setTogglingPro(true);
    await setClubProStatus(clubId, !isPro);
    setIsPro(p => !p);
    setTogglingPro(false);
  };

  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const refreshAll = () => { void reload(); onTeamsChanged(); };

  const handleArchive = async (team: Team) => {
    await archiveTeam(team.id);
    toast.success('Team gearchiveerd.');
    refreshAll();
  };
  const handleUnarchive = async (team: Team) => {
    await unarchiveTeam(team.id);
    toast.success('Team hersteld.');
    refreshAll();
  };
  const handleRemoveCoach = async (tc: TeamCoach) => {
    await removeCoachFromTeam(tc.id, tc.team_id, tc.coach_id);
    toast.success(tc.status === 'invited' ? 'Uitnodiging ingetrokken.' : 'Coach losgekoppeld van team.');
    refreshAll();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* PRO status card */}
      <Card light>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <Zap size={18} style={{ color: ACCENT }} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-black text-gray-900">Teams &amp; Coaches PRO</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: isPro ? '#f0fdf4' : '#f3f4f6', color: isPro ? ACCENT : '#9ca3af' }}>
                  {isPro ? 'ACTIEF' : 'INACTIEF'}
                </span>
              </div>
              <p className="text-sm text-gray-500">Teams aanmaken/bewerken en coaches (incl. assistenten) toewijzen of uitnodigen.</p>
            </div>
          </div>
          {isSuperAdmin && (
            <button
              onClick={handleTogglePro}
              disabled={togglingPro}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
              style={isPro ? { backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' } : { backgroundColor: ACCENT, color: '#fff' }}
            >
              {togglingPro ? <Loader2 size={13} className="animate-spin" /> : null}
              {isPro ? 'Deactiveren' : 'Activeren'}
            </button>
          )}
        </div>
      </Card>

      {!isPro ? (
        <Card light>
          <div className="text-center py-8">
            <ShieldIcon size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-gray-500 mb-1">PRO niet actief</p>
            <p className="text-sm text-gray-400">Neem contact op met je accountmanager om PRO te activeren.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex justify-end">
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity" style={{ backgroundColor: ACCENT }}>
              <Plus size={14} /> Nieuw team
            </button>
          </div>

          {teams.length === 0 ? (
            <Card light><p className="text-sm text-gray-400 text-center py-8">Nog geen teams. Maak er een aan om coaches toe te wijzen.</p></Card>
          ) : (
            <div className="space-y-2">
              {teams.map(team => {
                const isOpen = expanded.has(team.id);
                const roster = coachesByTeam[team.id] ?? [];
                const isArchived = !!team.archived_at;
                return (
                  <Card key={team.id} light className={isArchived ? 'opacity-60' : ''}>
                    <div onClick={() => toggleExpand(team.id)} className="w-full flex items-center gap-3 text-left cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 truncate">{team.team_name}</p>
                          {isArchived && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-400">Gearchiveerd</span>}
                        </div>
                        <p className="text-xs text-gray-400">{team.team_class} · {roster.filter(r => r.status === 'active').length} coach{roster.filter(r => r.status === 'active').length === 1 ? '' : 'es'}</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); onViewStats(team.id); }}
                        title="Bekijk stats"
                        className="shrink-0 p-1.5 rounded-lg hover:bg-green-100 text-gray-300 hover:text-green-600 transition-colors"
                      >
                        <BarChart2 size={15} />
                      </button>
                      <ChevronDown size={16} className={`text-gray-300 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isOpen && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                        <div className="flex gap-2">
                          <button onClick={() => setEditingTeam(team)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                            <Pencil size={12} /> Bewerken
                          </button>
                          {isArchived ? (
                            <button onClick={() => handleUnarchive(team)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                              <ArchiveRestore size={12} /> Herstellen
                            </button>
                          ) : (
                            <button onClick={() => handleArchive(team)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors">
                              <Archive size={12} /> Archiveren
                            </button>
                          )}
                          {!isArchived && (
                            <button onClick={() => setAddCoachTeam(team)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ml-auto" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>
                              <UserPlus size={12} /> Coach toevoegen
                            </button>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          {roster.length === 0 ? (
                            <p className="text-xs text-gray-400">Nog geen coach toegewezen.</p>
                          ) : (
                            roster.map(tc => (
                              <div key={tc.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 text-sm">
                                <span className="flex-1 min-w-0 truncate text-gray-800">{tc.email}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-gray-200 text-gray-500">
                                  {tc.role === 'head' ? 'Hoofdcoach' : 'Assistent'}
                                </span>
                                {tc.status === 'invited' && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600">Uitgenodigd</span>
                                )}
                                <button onClick={() => handleRemoveCoach(tc)} title="Verwijderen" className="p-1 rounded-md hover:bg-red-100 text-gray-300 hover:text-red-600 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showCreate && <CreateTeamModal clubId={clubId} onClose={() => setShowCreate(false)} onCreated={refreshAll} />}
        {editingTeam && <EditTeamModal team={editingTeam} onClose={() => setEditingTeam(null)} onSaved={refreshAll} />}
        {addCoachTeam && (
          <AddCoachModal
            team={addCoachTeam}
            clubId={clubId}
            clubName={clubName}
            senderEmail={senderEmail}
            existingCoachIds={(coachesByTeam[addCoachTeam.id] ?? []).filter(c => c.status === 'active' && c.coach_id).map(c => c.coach_id!)}
            clubCoaches={clubCoaches}
            onClose={() => setAddCoachTeam(null)}
            onAdded={refreshAll}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamManagementTab;
