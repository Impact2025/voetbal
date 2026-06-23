import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Plus, Sparkles, Loader2, Trash2, Eye, EyeOff, ArrowLeft, Save,
  ExternalLink, AlertTriangle, CheckCircle2, XCircle, Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { NEON_COLOR } from '../../utils/constants';
import { computeSeo, slugify, type SeoResult } from '../../lib/seo';
import {
  fetchPosts, createPost, updatePost, deletePost, setPublished, generatePost,
  type BlogPost,
} from '../../lib/blog';

type Draft = {
  id?: string;
  slug: string; title: string; excerpt: string; body: string;
  cover_image_url: string; category: string;
  meta_title: string; meta_description: string; keywords: string[];
  status: 'draft' | 'published'; published_at: string | null;
};

const blank = (): Draft => ({
  slug: '', title: '', excerpt: '', body: '', cover_image_url: '', category: '',
  meta_title: '', meta_description: '', keywords: [], status: 'draft', published_at: null,
});

const fromPost = (p: BlogPost): Draft => ({
  id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt, body: p.body,
  cover_image_url: p.cover_image_url ?? '', category: p.category ?? '',
  meta_title: p.meta_title ?? '', meta_description: p.meta_description ?? '',
  keywords: p.keywords, status: p.status, published_at: p.published_at,
});

const fieldCls = 'w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[--neon-color] outline-none';

// ─── SEO-paneel ───────────────────────────────────────────────────────────────

const SeoPanel = ({ result }: { result: SeoResult }) => {
  const color = result.score >= 80 ? NEON_COLOR : result.score >= 50 ? '#fbbf24' : '#f87171';
  return (
    <div className="rounded-2xl border border-gray-800 bg-black/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold text-white">SEO-score</span>
        <span className="text-2xl font-black" style={{ color }}>{result.score}</span>
      </div>
      <div className="space-y-1.5">
        {result.checks.map((c) => (
          <div key={c.label} className="flex items-start gap-2 text-xs">
            {c.ok ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: NEON_COLOR }} /> : <XCircle className="h-4 w-4 flex-shrink-0 text-gray-600" />}
            <span className={c.ok ? 'text-gray-300' : 'text-gray-500'}>{c.ok ? c.label : c.hint}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Editor ───────────────────────────────────────────────────────────────────

const Editor = ({ initial, onBack, onSaved }: { initial: Draft; onBack: () => void; onSaved: () => void }) => {
  const [d, setD] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const seo = useMemo(() => computeSeo({
    title: d.title, meta_title: d.meta_title, meta_description: d.meta_description,
    excerpt: d.excerpt, body: d.body, keywords: d.keywords, cover_image_url: d.cover_image_url || null,
  }), [d]);

  const save = async (): Promise<string | null> => {
    if (!d.title.trim()) { toast.error('Titel is verplicht.'); return null; }
    const slug = d.slug.trim() || slugify(d.title);
    setSaving(true);
    try {
      const patch = {
        slug, title: d.title, excerpt: d.excerpt, body: d.body,
        cover_image_url: d.cover_image_url || null, category: d.category || null,
        meta_title: d.meta_title || null, meta_description: d.meta_description || null,
        keywords: d.keywords, seo_score: seo.score,
      };
      let id = d.id;
      if (id) await updatePost(id, patch);
      else { const created = await createPost(patch); id = created.id; setD({ ...d, id, slug }); }
      toast.success('Opgeslagen.');
      onSaved();
      return id ?? null;
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Opslaan mislukt'); return null; }
    finally { setSaving(false); }
  };

  const togglePublish = async () => {
    const id = d.id ?? (await save());
    if (!id) return;
    const publish = d.status !== 'published';
    try {
      await setPublished(id, publish);
      setD({ ...d, status: publish ? 'published' : 'draft' });
      toast.success(publish ? 'Gepubliceerd!' : 'Teruggezet naar concept.');
      onSaved();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Mislukt'); }
  };

  const remove = async () => {
    if (!d.id || !confirm('Artikel verwijderen?')) return;
    try { await deletePost(d.id); toast.success('Verwijderd.'); onSaved(); onBack(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Mislukt'); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Terug</button>
        <div className="flex items-center gap-2">
          {d.status === 'published' && d.slug && (
            <a href={`/blog/${d.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white">
              <ExternalLink className="h-4 w-4" /> Bekijk live
            </a>
          )}
          {d.id && <button onClick={remove} className="text-sm px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-red-400"><Trash2 className="h-4 w-4" /></button>}
          <button onClick={togglePublish} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white">
            {d.status === 'published' ? <><EyeOff className="h-4 w-4" /> Depubliceren</> : <><Eye className="h-4 w-4" /> Publiceren</>}
          </button>
          <button onClick={() => void save()} disabled={saving} className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-[--neon-color] text-black font-bold disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Opslaan
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <input className={`${fieldCls} text-lg font-bold`} placeholder="Titel" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} onBlur={() => !d.slug && setD((p) => ({ ...p, slug: slugify(p.title) }))} />
          <div className="grid sm:grid-cols-2 gap-3">
            <input className={fieldCls} placeholder="slug" value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} />
            <input className={fieldCls} placeholder="Categorie" value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })} />
          </div>
          <input className={fieldCls} placeholder="Cover-afbeelding URL" value={d.cover_image_url} onChange={(e) => setD({ ...d, cover_image_url: e.target.value })} />
          <textarea className={`${fieldCls} h-16 resize-none`} placeholder="Excerpt (samenvatting, max 160 tekens)" value={d.excerpt} onChange={(e) => setD({ ...d, excerpt: e.target.value })} />

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Body (HTML)</span>
            <button onClick={() => setShowPreview((s) => !s)} className="text-xs text-gray-400 hover:text-white">{showPreview ? 'Bewerken' : 'Preview'}</button>
          </div>
          {showPreview ? (
            <div className="prose-invert bg-black/40 border border-gray-700 rounded-lg p-4 text-gray-200 text-sm max-h-[480px] overflow-y-auto" dangerouslySetInnerHTML={{ __html: d.body }} />
          ) : (
            <textarea className={`${fieldCls} h-[480px] resize-none font-mono text-xs`} placeholder="<p>Begin hier… gebruik <h2>, <ul>, en <a href=&quot;/blog/...&quot;> voor interne links.</p>" value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} />
          )}
        </div>

        <div className="space-y-3">
          <SeoPanel result={seo} />
          <div className="rounded-2xl border border-gray-800 bg-black/30 p-4 space-y-3">
            <span className="text-sm font-bold text-white">Meta & keywords</span>
            <input className={fieldCls} placeholder="Meta-title (max 60)" value={d.meta_title} onChange={(e) => setD({ ...d, meta_title: e.target.value })} />
            <textarea className={`${fieldCls} h-20 resize-none`} placeholder="Meta-description (80–155)" value={d.meta_description} onChange={(e) => setD({ ...d, meta_description: e.target.value })} />
            <input className={fieldCls} placeholder="Keywords (komma-gescheiden)" value={d.keywords.join(', ')} onChange={(e) => setD({ ...d, keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })} />
            <p className="text-[11px] text-gray-500">Eerste keyword = focus-keyword voor de SEO-check.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── AI-generatiepaneel ─────────────────────────────────────────────────────────

const GeneratePanel = ({ onGenerated, onClose }: { onGenerated: (d: Draft) => void; onClose: () => void }) => {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [category, setCategory] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (!topic.trim()) { toast.error('Onderwerp is verplicht.'); return; }
    setBusy(true);
    try {
      const g = await generatePost({ topic, keywords: keywords || undefined, category: category || undefined });
      onGenerated({
        ...blank(),
        title: g.title, slug: g.slug || slugify(g.title), excerpt: g.excerpt, body: g.body,
        category: g.category || category, meta_title: g.meta_title, meta_description: g.meta_description,
        keywords: g.keywords || [],
      });
      toast.success('Concept gegenereerd — controleer en sla op.');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Generatie mislukt'); }
    finally { setBusy(false); }
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-black/40 to-[#00FF9D0a] p-4 space-y-3 mb-4">
      <div className="flex items-center gap-2 text-white font-bold"><Sparkles className="h-4 w-4" style={{ color: NEON_COLOR }} /> AI-artikel genereren</div>
      <input className={fieldCls} placeholder="Onderwerp, bv. 'Hoe motiveer je een JO9-team'" value={topic} onChange={(e) => setTopic(e.target.value)} />
      <div className="grid sm:grid-cols-2 gap-3">
        <input className={fieldCls} placeholder="Keywords (optioneel)" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
        <input className={fieldCls} placeholder="Categorie (optioneel)" value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={go} disabled={busy} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-[--neon-color] text-black font-bold disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Genereer
        </button>
        <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg bg-gray-800 text-white">Sluiten</button>
      </div>
      <p className="text-[11px] text-gray-500">AI schrijft incl. interne links naar bestaande artikelen, externe bronnen en meta-tags. Daarna review je het concept.</p>
    </div>
  );
};

// ─── Module ─────────────────────────────────────────────────────────────────

export default function BlogModule() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [genOpen, setGenOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setPosts(await fetchPosts()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Onbekende fout'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (editing) {
    return <Editor initial={editing} onBack={() => setEditing(null)} onSaved={load} />;
  }

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-400"><Loader2 className="animate-spin h-8 w-8 mr-3" style={{ color: NEON_COLOR }} /> Blog laden…</div>;
  if (error) return (
    <div className="flex items-center gap-3 text-red-400 p-6 border border-red-500/40 rounded-2xl">
      <AlertTriangle className="h-5 w-5" /> <div><div className="font-bold">Kon blog niet laden</div><div className="text-sm text-gray-400">{error}</div></div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" style={{ color: NEON_COLOR }} />
          <h1 className="text-2xl font-black text-white">Blog</h1>
        </div>
        <div className="flex items-center gap-2">
          <a href="/blog" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white"><Globe className="h-4 w-4" /> Publieke blog</a>
          <button onClick={() => setGenOpen((o) => !o)} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white"><Sparkles className="h-4 w-4" style={{ color: NEON_COLOR }} /> AI</button>
          <button onClick={() => setEditing(blank())} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-[--neon-color] text-black font-bold"><Plus className="h-4 w-4" /> Nieuw</button>
        </div>
      </div>

      {genOpen && <GeneratePanel onGenerated={(d) => { setGenOpen(false); setEditing(d); }} onClose={() => setGenOpen(false)} />}

      <div className="space-y-2">
        {posts.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-black/30 p-4">
            <button className="min-w-0 text-left flex-1" onClick={() => setEditing(fromPost(p))}>
              <div className="font-bold text-white truncate">{p.title || '(zonder titel)'}</div>
              <div className="text-xs text-gray-500 truncate mt-0.5">/{p.slug}{p.category ? ` · ${p.category}` : ''}</div>
            </button>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-xs font-bold" style={{ color: p.seo_score >= 80 ? NEON_COLOR : p.seo_score >= 50 ? '#fbbf24' : '#f87171' }}>SEO {p.seo_score}</span>
              <span className={`text-[11px] px-2 py-1 rounded-full ${p.status === 'published' ? 'bg-[#00FF9D1a] text-[--neon-color]' : 'bg-gray-700 text-gray-300'}`}>{p.status === 'published' ? 'live' : 'concept'}</span>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="text-sm text-gray-600 text-center py-8">Nog geen artikelen. Klik op <strong>AI</strong> of <strong>Nieuw</strong>.</p>}
      </div>
    </motion.div>
  );
}
