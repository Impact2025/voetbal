import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Send, Plus, Loader2, Trash2, FileText, Users, Eye, MousePointerClick,
  AlertTriangle, Save, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { NEON_COLOR } from '../../utils/constants';
import { STAGES, type CrmStage } from '../../lib/crm';
import {
  SEGMENTS,
  fetchTemplates, createTemplate, updateTemplate, deleteTemplate,
  fetchCampaigns, resolveRecipients, sendCampaign,
  type EmailTemplate, type EmailCampaign, type Segment,
} from '../../lib/mail';

const fieldCls = 'w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[--neon-color] outline-none';
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

// ─── Composer ─────────────────────────────────────────────────────────────────

const Composer = ({ templates, onSent }: { templates: EmailTemplate[]; onSent: () => void }) => {
  const [segment, setSegment] = useState<Segment>('coaches');
  const [stage, setStage] = useState<CrmStage>('paying');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  const [sending, setSending] = useState(false);

  const refreshCount = useCallback(async () => {
    setCounting(true);
    try {
      const r = await resolveRecipients(segment, segment === 'crm' ? stage : null);
      setCount(r.length);
    } catch { setCount(null); }
    finally { setCounting(false); }
  }, [segment, stage]);

  useEffect(() => { void refreshCount(); }, [refreshCount]);

  const applyTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (t) { setSubject(t.subject); setBody(t.body); }
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) { toast.error('Onderwerp en tekst zijn verplicht.'); return; }
    if (!confirm(`Campagne versturen naar ${count ?? '?'} ontvangers?`)) return;
    setSending(true);
    try {
      const r = await sendCampaign({ subject, body, segment, segment_stage: segment === 'crm' ? stage : null });
      toast.success(`Verstuurd: ${r.sent} van ${r.recipients}${r.failed ? `, ${r.failed} mislukt` : ''}.`);
      setSubject(''); setBody('');
      onSent();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Mislukt'); }
    finally { setSending(false); }
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-black/30 p-4 space-y-3">
      <div className="flex items-center gap-2 text-white font-bold"><Send className="h-4 w-4" style={{ color: NEON_COLOR }} /> Nieuwe campagne</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-gray-500">Doelgroep</span>
          <select className={fieldCls} value={segment} onChange={(e) => setSegment(e.target.value as Segment)}>
            {SEGMENTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        {segment === 'crm' ? (
          <label className="block">
            <span className="text-xs text-gray-500">CRM-fase</span>
            <select className={fieldCls} value={stage} onChange={(e) => setStage(e.target.value as CrmStage)}>
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
        ) : (
          templates.length > 0 && (
            <label className="block">
              <span className="text-xs text-gray-500">Template laden</span>
              <select className={fieldCls} defaultValue="" onChange={(e) => e.target.value && applyTemplate(e.target.value)}>
                <option value="">— kies —</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </label>
          )
        )}
      </div>
      <input className={fieldCls} placeholder="Onderwerp" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <textarea className={`${fieldCls} h-40 resize-none`} placeholder="Bericht… gebruik {{naam}} voor personalisatie" value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Users className="h-4 w-4" />
          {counting ? 'tellen…' : <span><span className="text-white font-bold">{count ?? '?'}</span> ontvangers</span>}
          <button onClick={() => void refreshCount()} className="text-gray-500 hover:text-white"><RefreshCw className="h-3.5 w-3.5" /></button>
        </div>
        <button onClick={send} disabled={sending} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-[--neon-color] text-black font-bold disabled:opacity-50">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Versturen
        </button>
      </div>
    </div>
  );
};

// ─── Campagne-rij ─────────────────────────────────────────────────────────────

const CampaignRow = ({ c }: { c: EmailCampaign }) => (
  <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="font-bold text-white truncate">{c.subject}</div>
        <div className="text-xs text-gray-500">
          {SEGMENTS.find((s) => s.id === c.segment)?.label ?? c.segment}
          {c.sent_at ? ` · ${new Date(c.sent_at).toLocaleDateString('nl-NL')}` : ''}
        </div>
      </div>
      <span className={`text-[11px] px-2 py-1 rounded-full ${
        c.status === 'sent' ? 'bg-[#00FF9D1a] text-[--neon-color]' :
        c.status === 'sending' ? 'bg-blue-500/20 text-blue-300' :
        c.status === 'failed' ? 'bg-red-500/20 text-red-300' : 'bg-gray-700 text-gray-300'
      }`}>{c.status}</span>
    </div>
    <div className="flex gap-4 mt-3 text-xs text-gray-400">
      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {c.sent_count}/{c.recipients_count}</span>
      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {c.opened_count} ({pct(c.opened_count, c.sent_count)}%)</span>
      <span className="flex items-center gap-1"><MousePointerClick className="h-3.5 w-3.5" /> {c.clicked_count} ({pct(c.clicked_count, c.sent_count)}%)</span>
      {c.bounced_count > 0 && <span className="flex items-center gap-1 text-red-400"><AlertTriangle className="h-3.5 w-3.5" /> {c.bounced_count}</span>}
    </div>
  </div>
);

// ─── Templates-tab ────────────────────────────────────────────────────────────

const TemplatesTab = ({ templates, reload }: { templates: EmailTemplate[]; reload: () => void }) => {
  const [editing, setEditing] = useState<{ id?: string; name: string; subject: string; body: string } | null>(null);

  const save = async () => {
    if (!editing || !editing.name.trim()) { toast.error('Naam is verplicht.'); return; }
    try {
      if (editing.id) await updateTemplate(editing.id, { name: editing.name, subject: editing.subject, body: editing.body });
      else await createTemplate({ name: editing.name, subject: editing.subject, body: editing.body });
      setEditing(null); reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Mislukt'); }
  };

  return (
    <div className="space-y-3">
      {!editing && (
        <button onClick={() => setEditing({ name: '', subject: '', body: '' })} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-[--neon-color] text-black font-bold">
          <Plus className="h-4 w-4" /> Nieuwe template
        </button>
      )}

      {editing && (
        <div className="rounded-2xl border border-gray-800 bg-black/30 p-4 space-y-3">
          <input className={fieldCls} placeholder="Naam van de template" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          <input className={fieldCls} placeholder="Onderwerp" value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} />
          <textarea className={`${fieldCls} h-36 resize-none`} placeholder="Tekst… {{naam}} voor personalisatie" value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-[--neon-color] text-black font-bold"><Save className="h-4 w-4" /> Opslaan</button>
            <button onClick={() => setEditing(null)} className="text-sm px-4 py-2 rounded-lg bg-gray-800 text-white">Annuleren</button>
          </div>
        </div>
      )}

      {templates.map((t) => (
        <div key={t.id} className="rounded-xl border border-gray-800 bg-black/30 p-4 flex items-center justify-between gap-2">
          <button className="min-w-0 text-left flex-1" onClick={() => setEditing({ id: t.id, name: t.name, subject: t.subject, body: t.body })}>
            <div className="font-bold text-white truncate flex items-center gap-2"><FileText className="h-4 w-4 text-gray-500" /> {t.name}</div>
            <div className="text-xs text-gray-500 truncate mt-0.5">{t.subject}</div>
          </button>
          <button onClick={async () => { if (confirm('Template verwijderen?')) { await deleteTemplate(t.id); reload(); } }} className="text-gray-500 hover:text-red-400">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      {templates.length === 0 && !editing && <p className="text-sm text-gray-600 text-center py-6">Nog geen templates.</p>}
    </div>
  );
};

// ─── Module ─────────────────────────────────────────────────────────────────

export default function MailModule() {
  const [tab, setTab] = useState<'campaigns' | 'templates'>('campaigns');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [t, c] = await Promise.all([fetchTemplates(), fetchCampaigns()]);
      setTemplates(t); setCampaigns(c);
    } catch (e) { setError(e instanceof Error ? e.message : 'Onbekende fout'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin h-8 w-8 mr-3" style={{ color: NEON_COLOR }} /> Mail laden…</div>;
  if (error) return (
    <div className="flex items-center gap-3 text-red-400 p-6 border border-red-500/40 rounded-2xl">
      <AlertTriangle className="h-5 w-5" /> <div><div className="font-bold">Kon mail niet laden</div><div className="text-sm text-gray-400">{error}</div></div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-2 mb-5">
        <Mail className="h-6 w-6" style={{ color: NEON_COLOR }} />
        <h1 className="text-2xl font-black text-white">Mail</h1>
      </div>

      <div className="flex gap-1 mb-5 border-b border-gray-800">
        {(['campaigns', 'templates'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium ${tab === t ? 'text-white border-b-2 border-[--neon-color]' : 'text-gray-500'}`}>
            {t === 'campaigns' ? 'Campagnes' : 'Templates'}
          </button>
        ))}
      </div>

      {tab === 'campaigns' ? (
        <div className="space-y-4">
          <Composer templates={templates} onSent={load} />
          <div className="space-y-3">
            {campaigns.map((c) => <CampaignRow key={c.id} c={c} />)}
            {campaigns.length === 0 && <p className="text-sm text-gray-600 text-center py-6">Nog geen campagnes verstuurd.</p>}
          </div>
        </div>
      ) : (
        <TemplatesTab templates={templates} reload={load} />
      )}
    </motion.div>
  );
}
