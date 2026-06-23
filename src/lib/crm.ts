import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CrmStage = 'lead' | 'demo' | 'trial' | 'paying' | 'churned';
export type CrmType = 'prospect' | 'club' | 'partner' | 'other';
export type ActivityType = 'note' | 'call' | 'email' | 'meeting' | 'task';

export interface CrmAccount {
  id: string;
  name: string;
  type: CrmType;
  stage: CrmStage;
  club_id: string | null;
  website: string | null;
  owner: string | null;
  value: number;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmContact {
  id: string;
  account_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface CrmActivity {
  id: string;
  account_id: string;
  type: ActivityType;
  title: string;
  body: string | null;
  done: boolean;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
}

export const STAGES: { id: CrmStage; label: string; color: string }[] = [
  { id: 'lead',    label: 'Lead',     color: '#9ca3af' },
  { id: 'demo',    label: 'Demo',     color: '#60a5fa' },
  { id: 'trial',   label: 'Proef',    color: '#a78bfa' },
  { id: 'paying',  label: 'Betalend', color: '#00FF9D' },
  { id: 'churned', label: 'Verloren', color: '#f87171' },
];

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  note: 'Notitie', call: 'Telefoon', email: 'E-mail', meeting: 'Afspraak', task: 'Taak',
};

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function fetchAccounts(): Promise<CrmAccount[]> {
  const { data, error } = await supabase
    .from('crm_accounts')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CrmAccount[];
}

export async function createAccount(patch: Partial<CrmAccount> & { name: string }): Promise<CrmAccount> {
  const { data, error } = await supabase.from('crm_accounts').insert(patch).select().single();
  if (error) throw new Error(error.message);
  return data as CrmAccount;
}

export async function updateAccount(id: string, patch: Partial<CrmAccount>): Promise<void> {
  const { error } = await supabase.from('crm_accounts').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase.from('crm_accounts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export async function fetchContacts(accountId: string): Promise<CrmContact[]> {
  const { data, error } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('account_id', accountId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as CrmContact[];
}

export async function createContact(patch: Partial<CrmContact> & { account_id: string; name: string }): Promise<CrmContact> {
  const { data, error } = await supabase.from('crm_contacts').insert(patch).select().single();
  if (error) throw new Error(error.message);
  return data as CrmContact;
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from('crm_contacts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Activities ───────────────────────────────────────────────────────────────

export async function fetchActivities(accountId: string): Promise<CrmActivity[]> {
  const { data, error } = await supabase
    .from('crm_activities')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CrmActivity[];
}

export async function createActivity(patch: Partial<CrmActivity> & { account_id: string; type: ActivityType; title: string }): Promise<CrmActivity> {
  const { data, error } = await supabase.from('crm_activities').insert(patch).select().single();
  if (error) throw new Error(error.message);
  return data as CrmActivity;
}

export async function toggleActivityDone(id: string, done: boolean): Promise<void> {
  const { error } = await supabase.from('crm_activities').update({ done }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteActivity(id: string): Promise<void> {
  const { error } = await supabase.from('crm_activities').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export async function syncPlatform(): Promise<{ new_accounts: number; new_contacts: number }> {
  const { data, error } = await supabase.rpc('crm_sync_platform');
  if (error) throw new Error(error.message);
  return data as { new_accounts: number; new_contacts: number };
}
