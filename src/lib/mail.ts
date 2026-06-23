import { supabase } from './supabase';
import type { CrmStage } from './crm';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Segment = 'coaches' | 'club_admins' | 'parents' | 'all_staff' | 'crm';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  body: string;
  segment: Segment;
  segment_stage: CrmStage | null;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  recipients_count: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  created_at: string;
  sent_at: string | null;
}

export const SEGMENTS: { id: Segment; label: string }[] = [
  { id: 'coaches',     label: 'Coaches' },
  { id: 'club_admins', label: 'Club-admins' },
  { id: 'parents',     label: 'Ouders' },
  { id: 'all_staff',   label: 'Coaches + club-admins' },
  { id: 'crm',         label: 'CRM-contacten' },
];

// ─── Templates ────────────────────────────────────────────────────────────────

export async function fetchTemplates(): Promise<EmailTemplate[]> {
  const { data, error } = await supabase.from('email_templates').select('*').order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as EmailTemplate[];
}

export async function createTemplate(patch: { name: string; subject: string; body: string }): Promise<EmailTemplate> {
  const { data, error } = await supabase.from('email_templates').insert(patch).select().single();
  if (error) throw new Error(error.message);
  return data as EmailTemplate;
}

export async function updateTemplate(id: string, patch: Partial<EmailTemplate>): Promise<void> {
  const { error } = await supabase.from('email_templates').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('email_templates').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Campagnes ────────────────────────────────────────────────────────────────

export async function fetchCampaigns(): Promise<EmailCampaign[]> {
  const { data, error } = await supabase.from('email_campaigns').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as EmailCampaign[];
}

// ─── Ontvangers (segment-preview) ──────────────────────────────────────────────

export async function resolveRecipients(segment: Segment, stage?: CrmStage | null): Promise<{ email: string; name: string }[]> {
  const { data, error } = await supabase.rpc('email_resolve_recipients', { p_segment: segment, p_stage: stage ?? null });
  if (error) throw new Error(error.message);
  return (data ?? []) as { email: string; name: string }[];
}

// ─── Versturen (serverless) ─────────────────────────────────────────────────────

export async function sendCampaign(payload: {
  name?: string; subject: string; body: string; segment: Segment; segment_stage?: CrmStage | null;
}): Promise<{ ok: boolean; recipients: number; sent: number; failed: number; message?: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch('/api/admin/send-campaign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Verzenden mislukt.');
  return json as { ok: boolean; recipients: number; sent: number; failed: number; message?: string };
}
