import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, RefreshCw, Loader2, Search, X, Building2, Globe, Trash2,
  Phone, Mail, CalendarClock, StickyNote, CheckSquare, Square,
  User, Star, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { NEON_COLOR } from '../../utils/constants';
import {
  STAGES, ACTIVITY_LABEL,
  fetchAccounts, createAccount, updateAccount, deleteAccount,
  fetchContacts, createContact, deleteContact,
  fetchActivities, createActivity, toggleActivityDone, deleteActivity,
  syncPlatform,
  type CrmAccount, type CrmContact, type CrmActivity, type CrmStage, type ActivityType,
} from '../../lib/crm';

const eur = (n: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);

// ─── Account-kaart ──────────────────────────────────────────────────────────

const AccountCard = ({ account, onOpen }: { account: CrmAccount; onOpen: () => void }) => (
  <div
    draggable
    onDragStart={(e) => e.dataTransfer.setData('text/plain', account.id)}
    onClick={onOpen}
    className="cursor-pointer rounded-xl border border-gray-800 bg-black/40 p-3 hover:border-gray-600 transition-colors"
  >
    <div className="flex items-start justify-between gap-2">
      <span className="font-bold text-white text-sm leading-tight">{account.name}</span>
      {account.value > 0 && <span className="text-xs font-bold" style={{ color: NEON_COLOR }}>{eur(account.value)}</span>}
    </div>
    {account.tags.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-2">
        {account.tags.map((t) => (
          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{t}</span>
        ))}
      </div>
    )}
    <div className="mt-2 text-[11px] text-gray-500 capitalize">{account.type}{account.owner ? ` · ${account.owner}` : ''}</div>
  </div>
);

// ─── Kanban-kolom ───────────────────────────────────────────────────────────

const Column = ({
  stage, accounts, onDropAccount, onOpen,
}: {
  stage: typeof STAGES[number];
  accounts: CrmAccount[];
  onDropAccount: (id: string, stage: CrmStage) => void;
  onOpen: (a: CrmAccount) => void;
}) => {
  const [over, setOver] = useState(false);
  const total = accounts.reduce((s, a) => s + (a.value || 0), 0);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData('text/plain');
        if (id) onDropAccount(id, stage.id);
      }}
      className={`flex-shrink-0 w-64 rounded-2xl p-3 transition-colors ${over ? 'bg-gray-800/60' : 'bg-black/20'}`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
          <span className="text-sm font-bold text-white">{stage.label}</span>
          <span className="text-xs text-gray-500">{accounts.length}</span>
        </div>
        {total > 0 && <span className="text-[11px] text-gray-500">{eur(total)}</span>}
      </div>
      <div className="space-y-2 min-h-[60px]">
        {accounts.map((a) => <AccountCard key={a.id} account={a} onOpen={() => onOpen(a)} />)}
      </div>
    </div>
  );
};

// ─── Account-drawer ─────────────────────────────────────────────────────────

const AccountDrawer = ({
  account, onClose, onChanged, onDeleted,
}: {
  account: CrmAccount;
  onClose: () => void;
  onChanged: (a: CrmAccount) => void;
  onDeleted: (id: string) => void;
}) => {
  const [form, setForm] = useState<CrmAccount>(account);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [tab, setTab] = useState<'details' | 'contacts' | 'activity'>('details');
  const [newContact, setNewContact] = useState({ name: '', email: '', role: '' });
  const [newAct, setNewAct] = useState<{ type: ActivityType; title: string; due_date: string }>({ type: 'note', title: '', due_date: '' });

  useEffect(() => { setForm(account); }, [account]);
  useEffect(() => {
    void fetchContacts(account.id).then(setContacts).catch(() => {});
    void fetchActivities(account.id).then(setActivities).catch(() => {});
  }, [account.id]);

  const saveField = async (patch: Partial<CrmAccount>) => {
    const next = { ...form, ...patch };
    setForm(next);
    try { await updateAccount(account.id, patch); onChanged(next); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Opslaan mislukt'); }
  };

  const addContact = async () => {
    if (!newContact.name.trim()) return;
    try {
      const c = await createContact({ account_id: account.id, ...newContact });
      setContacts((p) => [...p, c]);
      setNewContact({ name: '', email: '', role: '' });
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Mislukt'); }
  };

  const addActivity = async () => {
    if (!newAct.title.trim()) return;
    try {
      const a = await createActivity({
        account_id: account.id, type: newAct.type, title: newAct.title,
        due_date: newAct.due_date || null,
      });
      setActivities((p) => [a, ...p]);
      setNewAct({ type: 'note', title: '', due_date: '' });
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Mislukt'); }
  };

  const removeAccount = async () => {
    if (!confirm(`Account "${account.name}" definitief verwijderen?`)) return;
    try { await deleteAccount(account.id); onDeleted(account.id); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Mislukt'); }
  };

  const fieldCls = 'w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[--neon-color] outline-none';

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.25 }}
      className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-[#0b0e12] border-l border-gray-800 z-50 overflow-y-auto"
    >
      <div className="sticky top-0 bg-[#0b0e12] border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="h-5 w-5 flex-shrink-0" style={{ color: NEON_COLOR }} />
          <span className="font-bold text-white truncate">{form.name}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
      </div>

      <div className="flex border-b border-gray-800">
        {(['details', 'contacts', 'activity'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium ${tab === t ? 'text-white border-b-2 border-[--neon-color]' : 'text-gray-500'}`}
          >
            {t === 'details' ? 'Details' : t === 'contacts' ? `Contacten (${contacts.length})` : `Activiteit (${activities.length})`}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {tab === 'details' && (
          <>
            <label className="block">
              <span className="text-xs text-gray-500">Naam</span>
              <input className={fieldCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onBlur={() => saveField({ name: form.name })} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-gray-500">Type</span>
                <select className={fieldCls} value={form.type} onChange={(e) => saveField({ type: e.target.value as CrmAccount['type'] })}>
                  <option value="prospect">Prospect</option><option value="club">Club</option>
                  <option value="partner">Partner</option><option value="other">Overig</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Fase</span>
                <select className={fieldCls} value={form.stage} onChange={(e) => saveField({ stage: e.target.value as CrmStage })}>
                  {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-gray-500">Waarde (€)</span>
                <input type="number" className={fieldCls} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} onBlur={() => saveField({ value: form.value })} />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Eigenaar</span>
                <input className={fieldCls} value={form.owner ?? ''} onChange={(e) => setForm({ ...form, owner: e.target.value })} onBlur={() => saveField({ owner: form.owner })} />
              </label>
            </div>
            <label className="block">
              <span className="text-xs text-gray-500">Website</span>
              <input className={fieldCls} value={form.website ?? ''} onChange={(e) => setForm({ ...form, website: e.target.value })} onBlur={() => saveField({ website: form.website })} placeholder="https://" />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Tags (komma-gescheiden)</span>
              <input
                className={fieldCls}
                value={form.tags.join(', ')}
                onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
                onBlur={() => saveField({ tags: form.tags })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Notities</span>
              <textarea className={`${fieldCls} h-28 resize-none`} value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} onBlur={() => saveField({ notes: form.notes })} />
            </label>
            <button onClick={removeAccount} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 mt-2">
              <Trash2 className="h-4 w-4" /> Account verwijderen
            </button>
          </>
        )}

        {tab === 'contacts' && (
          <>
            {contacts.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-2 rounded-lg border border-gray-800 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                    {c.is_primary && <Star className="h-3.5 w-3.5" style={{ color: NEON_COLOR }} />}
                    {c.name} {c.role && <span className="text-gray-500 text-xs">· {c.role}</span>}
                  </div>
                  {c.email && <div className="flex items-center gap-1 text-xs text-gray-400 mt-1"><Mail className="h-3 w-3" />{c.email}</div>}
                  {c.phone && <div className="flex items-center gap-1 text-xs text-gray-400 mt-1"><Phone className="h-3 w-3" />{c.phone}</div>}
                </div>
                <button onClick={async () => { await deleteContact(c.id); setContacts((p) => p.filter((x) => x.id !== c.id)); }} className="text-gray-500 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <div className="rounded-lg border border-gray-800 p-3 space-y-2">
              <input className={fieldCls} placeholder="Naam" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
              <input className={fieldCls} placeholder="E-mail" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} />
              <input className={fieldCls} placeholder="Functie" value={newContact.role} onChange={(e) => setNewContact({ ...newContact, role: e.target.value })} />
              <button onClick={addContact} className="w-full flex items-center justify-center gap-2 text-sm py-2 rounded-lg bg-[--neon-color] text-black font-bold">
                <Plus className="h-4 w-4" /> Contact toevoegen
              </button>
            </div>
          </>
        )}

        {tab === 'activity' && (
          <>
            <div className="rounded-lg border border-gray-800 p-3 space-y-2">
              <div className="flex gap-2">
                <select className={fieldCls} value={newAct.type} onChange={(e) => setNewAct({ ...newAct, type: e.target.value as ActivityType })}>
                  {Object.entries(ACTIVITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                {newAct.type === 'task' && (
                  <input type="date" className={fieldCls} value={newAct.due_date} onChange={(e) => setNewAct({ ...newAct, due_date: e.target.value })} />
                )}
              </div>
              <input className={fieldCls} placeholder="Omschrijving…" value={newAct.title} onChange={(e) => setNewAct({ ...newAct, title: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addActivity()} />
              <button onClick={addActivity} className="w-full flex items-center justify-center gap-2 text-sm py-2 rounded-lg bg-[--neon-color] text-black font-bold">
                <Plus className="h-4 w-4" /> Toevoegen
              </button>
            </div>
            {activities.map((a) => (
              <div key={a.id} className="flex items-start gap-2 rounded-lg border border-gray-800 p-3">
                {a.type === 'task' ? (
                  <button onClick={async () => { await toggleActivityDone(a.id, !a.done); setActivities((p) => p.map((x) => x.id === a.id ? { ...x, done: !x.done } : x)); }}>
                    {a.done ? <CheckSquare className="h-4 w-4" style={{ color: NEON_COLOR }} /> : <Square className="h-4 w-4 text-gray-500" />}
                  </button>
                ) : a.type === 'call' ? <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
                  : a.type === 'meeting' ? <CalendarClock className="h-4 w-4 text-gray-500 mt-0.5" />
                  : a.type === 'email' ? <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
                  : <StickyNote className="h-4 w-4 text-gray-500 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${a.done ? 'line-through text-gray-500' : 'text-white'}`}>{a.title}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {ACTIVITY_LABEL[a.type]} · {new Date(a.created_at).toLocaleDateString('nl-NL')}
                    {a.due_date && ` · deadline ${new Date(a.due_date).toLocaleDateString('nl-NL')}`}
                  </div>
                </div>
                <button onClick={async () => { await deleteActivity(a.id); setActivities((p) => p.filter((x) => x.id !== a.id)); }} className="text-gray-500 hover:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {activities.length === 0 && <p className="text-sm text-gray-600 text-center py-4">Nog geen activiteit.</p>}
          </>
        )}
      </div>
    </motion.div>
  );
};

// ─── Module ─────────────────────────────────────────────────────────────────

export default function CrmModule() {
  const [accounts, setAccounts] = useState<CrmAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [selected, setSelected] = useState<CrmAccount | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setAccounts(await fetchAccounts()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Onbekende fout'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? accounts.filter((a) => a.name.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q))) : accounts;
  }, [accounts, search]);

  const byStage = useCallback((stage: CrmStage) => filtered.filter((a) => a.stage === stage), [filtered]);

  const handleDrop = async (id: string, stage: CrmStage) => {
    const acc = accounts.find((a) => a.id === id);
    if (!acc || acc.stage === stage) return;
    setAccounts((p) => p.map((a) => a.id === id ? { ...a, stage } : a)); // optimistic
    try { await updateAccount(id, { stage }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Verplaatsen mislukt'); void load(); }
  };

  const handleNew = async () => {
    const name = prompt('Naam van het nieuwe account?');
    if (!name?.trim()) return;
    try {
      const a = await createAccount({ name: name.trim(), type: 'prospect', stage: 'lead' });
      setAccounts((p) => [a, ...p]);
      setSelected(a);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Mislukt'); }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const r = await syncPlatform();
      toast.success(`Sync: ${r.new_accounts} accounts, ${r.new_contacts} contacten toegevoegd.`);
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Sync mislukt'); }
    finally { setSyncing(false); }
  };

  const totalPipeline = useMemo(() => accounts.filter((a) => a.stage !== 'churned').reduce((s, a) => s + (a.value || 0), 0), [accounts]);

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin h-8 w-8 mr-3" style={{ color: NEON_COLOR }} /> CRM laden…</div>;
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 text-red-400 p-6 border border-red-500/40 rounded-2xl">
        <AlertTriangle className="h-5 w-5" /> <div><div className="font-bold">Kon CRM niet laden</div><div className="text-sm text-gray-400">{error}</div></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-black text-white">CRM</h1>
          <p className="text-sm text-gray-500">Open pipeline: <span style={{ color: NEON_COLOR }}>{eur(totalPipeline)}</span> · {accounts.length} accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoeken…" className="pl-8 pr-3 py-2 rounded-lg bg-black/40 border border-gray-700 text-sm text-white outline-none focus:border-[--neon-color]" />
          </div>
          <button onClick={handleSync} disabled={syncing} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white disabled:opacity-50">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Sync platform
          </button>
          <button onClick={handleNew} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-[--neon-color] text-black font-bold">
            <Plus className="h-4 w-4" /> Nieuw
          </button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((s) => (
          <Column key={s.id} stage={s} accounts={byStage(s.id)} onDropAccount={handleDrop} onOpen={setSelected} />
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/60 z-40"
            />
            <AccountDrawer
              account={selected}
              onClose={() => setSelected(null)}
              onChanged={(a) => { setAccounts((p) => p.map((x) => x.id === a.id ? a : x)); setSelected(a); }}
              onDeleted={(id) => { setAccounts((p) => p.filter((x) => x.id !== id)); setSelected(null); }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
