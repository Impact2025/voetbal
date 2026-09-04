import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Ticket, Plus, Loader2, Trash2, AlertTriangle, CheckCircle2, XCircle,
  Power, CreditCard, Beaker,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon, syncToStripe,
  type Coupon, type DiscountType, type CouponDuration,
} from '../../lib/coupons';

// Leesbare (donkerdere) variant van NEON_COLOR voor tekst/iconen op een lichte ondergrond.
const ACCENT_INK = '#009966';

const fieldCls = 'w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-[--neon-color] outline-none';

const discountLabel = (c: Coupon) =>
  c.discount_type === 'percent' ? `${c.discount_value}% korting`
    : c.discount_type === 'fixed' ? `€${c.discount_value} korting`
    : `${c.discount_value} dagen gratis`;

// ─── Aanmaakformulier ───────────────────────────────────────────────────────

const NewCoupon = ({ onCreated }: { onCreated: () => void }) => {
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DiscountType>('percent');
  const [value, setValue] = useState(10);
  const [duration, setDuration] = useState<CouponDuration>('once');
  const [months, setMonths] = useState(3);
  const [maxRed, setMaxRed] = useState('');
  const [perUser, setPerUser] = useState(1);
  const [expires, setExpires] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!code.trim()) { toast.error('Code is verplicht.'); return; }
    setBusy(true);
    try {
      await createCoupon({
        code, description: description || undefined, discount_type: type, discount_value: Number(value),
        duration, duration_in_months: duration === 'repeating' ? Number(months) : null,
        max_redemptions: maxRed ? Number(maxRed) : null, per_user_limit: Number(perUser),
        expires_at: expires ? new Date(expires).toISOString() : null,
      });
      toast.success('Coupon aangemaakt.');
      setCode(''); setDescription(''); setValue(10); setMaxRed(''); setExpires('');
      onCreated();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Mislukt'); }
    finally { setBusy(false); }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 space-y-3 mb-5">
      <div className="flex items-center gap-2 text-gray-900 font-bold"><Plus className="h-4 w-4" style={{ color: ACCENT_INK }} /> Nieuwe coupon</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input className={`${fieldCls} uppercase`} placeholder="CODE (bv. WELKOM10)" value={code} onChange={(e) => setCode(e.target.value)} />
        <input className={fieldCls} placeholder="Omschrijving (intern)" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="block">
          <span className="text-xs text-gray-500">Type</span>
          <select className={fieldCls} value={type} onChange={(e) => setType(e.target.value as DiscountType)}>
            <option value="percent">Percentage</option>
            <option value="fixed">Vast bedrag (€)</option>
            <option value="free_trial">Gratis proef (dagen)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-gray-500">{type === 'percent' ? 'Percentage' : type === 'fixed' ? 'Bedrag (€)' : 'Dagen'}</span>
          <input type="number" className={fieldCls} value={value} onChange={(e) => setValue(Number(e.target.value))} />
        </label>
        {type !== 'free_trial' ? (
          <label className="block">
            <span className="text-xs text-gray-500">Looptijd (abonnement)</span>
            <select className={fieldCls} value={duration} onChange={(e) => setDuration(e.target.value as CouponDuration)}>
              <option value="once">Eenmalig</option>
              <option value="repeating">Herhalend</option>
              <option value="forever">Voor altijd</option>
            </select>
          </label>
        ) : <div />}
      </div>
      <div className="grid sm:grid-cols-4 gap-3">
        {duration === 'repeating' && type !== 'free_trial' && (
          <label className="block">
            <span className="text-xs text-gray-500">Aantal maanden</span>
            <input type="number" className={fieldCls} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
          </label>
        )}
        <label className="block">
          <span className="text-xs text-gray-500">Max. verzilveringen</span>
          <input type="number" className={fieldCls} placeholder="onbeperkt" value={maxRed} onChange={(e) => setMaxRed(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500">Per gebruiker</span>
          <input type="number" className={fieldCls} value={perUser} onChange={(e) => setPerUser(Number(e.target.value))} />
        </label>
        <label className="block">
          <span className="text-xs text-gray-500">Verloopt op</span>
          <input type="date" className={fieldCls} value={expires} onChange={(e) => setExpires(e.target.value)} />
        </label>
      </div>
      <button onClick={submit} disabled={busy} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-[--neon-color] text-black font-bold disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Aanmaken
      </button>
    </div>
  );
};

// ─── Validatie-tester ───────────────────────────────────────────────────────

const Tester = () => {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<{ valid: boolean; reason?: string } | null>(null);
  const test = async () => {
    if (!code.trim()) return;
    try { setResult(await validateCoupon(code, email || undefined)); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Mislukt'); }
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 mb-5">
      <div className="flex items-center gap-2 text-gray-900 font-bold mb-3"><Beaker className="h-4 w-4" style={{ color: ACCENT_INK }} /> Code testen</div>
      <div className="flex flex-wrap gap-2">
        <input className={`${fieldCls} uppercase flex-1 min-w-[140px]`} placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value)} />
        <input className={`${fieldCls} flex-1 min-w-[160px]`} placeholder="e-mail (optioneel)" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button onClick={test} className="text-sm px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900">Test</button>
      </div>
      {result && (
        <div className={`mt-3 flex items-center gap-2 text-sm ${result.valid ? 'text-[#009966]' : 'text-red-600'}`}>
          {result.valid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {result.valid ? 'Geldig' : `Ongeldig — ${result.reason}`}
        </div>
      )}
    </div>
  );
};

// ─── Module ─────────────────────────────────────────────────────────────────

export default function CouponsModule() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setCoupons(await fetchCoupons()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Onbekende fout'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggle = async (c: Coupon) => {
    try { await updateCoupon(c.id, { active: !c.active }); setCoupons((p) => p.map((x) => x.id === c.id ? { ...x, active: !x.active } : x)); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Mislukt'); }
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Coupon ${c.code} verwijderen?`)) return;
    try { await deleteCoupon(c.id); setCoupons((p) => p.filter((x) => x.id !== c.id)); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Mislukt'); }
  };

  const sync = async (c: Coupon) => {
    setSyncing(c.id);
    try { await syncToStripe(c.id); toast.success(`${c.code} gekoppeld aan Stripe.`); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Mislukt'); }
    finally { setSyncing(null); }
  };

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-500"><Loader2 className="animate-spin h-8 w-8 mr-3" style={{ color: ACCENT_INK }} /> Coupons laden…</div>;
  if (error) return (
    <div className="flex items-center gap-3 text-red-600 p-6 border border-red-200 bg-red-50 rounded-2xl">
      <AlertTriangle className="h-5 w-5" /> <div><div className="font-bold text-gray-900">Kon coupons niet laden</div><div className="text-sm text-gray-500">{error}</div></div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-2 mb-5">
        <Ticket className="h-6 w-6" style={{ color: ACCENT_INK }} />
        <h1 className="text-2xl font-black text-gray-900">Coupons</h1>
      </div>

      <NewCoupon onCreated={load} />
      <Tester />

      <div className="space-y-2">
        {coupons.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-gray-900">{c.code}</span>
                {!c.active && <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">inactief</span>}
                {c.stripe_coupon_id && <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#635bff22] text-[#a5a0ff]">Stripe</span>}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {discountLabel(c)}
                {' · '}{c.redeemed_count}{c.max_redemptions ? `/${c.max_redemptions}` : ''} verzilverd
                {c.expires_at ? ` · t/m ${new Date(c.expires_at).toLocaleDateString('nl-NL')}` : ''}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {c.discount_type !== 'free_trial' && !c.stripe_coupon_id && (
                <button onClick={() => sync(c)} disabled={syncing === c.id} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 disabled:opacity-50">
                  {syncing === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />} Sync Stripe
                </button>
              )}
              <button onClick={() => toggle(c)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600" title={c.active ? 'Deactiveren' : 'Activeren'}>
                <Power className="h-4 w-4" style={c.active ? { color: ACCENT_INK } : undefined} />
              </button>
              <button onClick={() => remove(c)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && <p className="text-sm text-gray-500 text-center py-8">Nog geen coupons.</p>}
      </div>
    </motion.div>
  );
}
