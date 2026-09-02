import { z } from 'zod';

// ─── Email / send-email ──────────────────────────────────────────────────────

export const SendEmailSchema = z.object({
  to: z.array(z.string().email()).min(1).max(50),
  toNames: z.array(z.string()).max(50).default([]),
  subject: z.string().min(1, 'Onderwerp is verplicht').max(200),
  body: z.string().min(1, 'Bericht is verplicht').max(50000),
  clubName: z.string().min(1).max(200),
  senderEmail: z.string().email().optional().default(''),
});

// ─── Stripe checkout ────────────────────────────────────────────────────────

export const CreateCheckoutSchema = z.object({
  priceId: z.string().optional(),
  couponCode: z.string().max(50).optional(),
  email: z.string().email().optional(),
  clubId: z.string().max(100).optional(),
});

// ─── Blog generatie ─────────────────────────────────────────────────────────

export const GenerateBlogSchema = z.object({
  topic: z.string().min(3, 'Onderwerp moet minstens 3 tekens zijn').max(500),
  keywords: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
});

// ─── Ouder uitnodiging ─────────────────────────────────────────────────────

export const SendParentInviteSchema = z.object({
  to: z.string().email(),
  playerName: z.string().min(1).max(200),
  linkCode: z.string().min(3).max(20),
  expiresAt: z.string().min(1),
  senderName: z.string().max(200).optional(),
});

// ─── Coach uitnodiging ─────────────────────────────────────────────────────

export const SendCoachInviteSchema = z.object({
  to: z.string().email(),
  coachName: z.string().max(200).optional(),
  teamName: z.string().min(1).max(200),
  clubName: z.string().min(1).max(200),
  inviteToken: z.string().min(10).max(100),
  role: z.enum(['head', 'assistant']),
  senderName: z.string().max(200).optional(),
});

// ─── Login-link (ouders/coaches, wachtwoordloos) ───────────────────────────

export const SendLoginLinkSchema = z.object({
  email: z.string().email().max(254),
  linkCode: z.string().max(20).optional(),
});

// ─── Club-tier (superadmin) ────────────────────────────────────────────────

export const SetClubTierSchema = z.object({
  clubId: z.string().min(1).max(100),
  tier: z.enum(['free', 'pro']),
});

// ─── Campaign ───────────────────────────────────────────────────────────────

export const SendCampaignSchema = z.object({
  campaignId: z.string().uuid().optional(),
  name: z.string().max(200).optional(),
  subject: z.string().min(1, 'Onderwerp is verplicht').max(200).optional(),
  body: z.string().min(1, 'Bericht is verplicht').optional(),
  segment: z.string().min(1).optional(),
  segment_stage: z.string().nullable().optional(),
});

// ─── Team-chat ──────────────────────────────────────────────────────────────

export const TeamChatActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('listChannels'), teamId: z.string().min(1).max(100) }),
  z.object({ action: z.literal('ensureChannels'), teamId: z.string().min(1).max(100) }),
  z.object({ action: z.literal('joinChannel'), channelId: z.string().uuid() }),
  z.object({
    action: z.literal('listMessages'),
    channelId: z.string().uuid(),
    before: z.string().optional(),
    after: z.string().optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
  z.object({
    action: z.literal('sendMessage'),
    channelId: z.string().uuid(),
    content: z.string().min(1).max(2000),
    senderName: z.string().min(1).max(120).optional(),
    mentions: z.array(z.string().uuid()).max(50).optional(),
    replyTo: z.string().uuid().optional(),
  }),
  z.object({ action: z.literal('editMessage'), messageId: z.string().uuid(), content: z.string().min(1).max(2000) }),
  z.object({ action: z.literal('updateLastRead'), channelId: z.string().uuid() }),
  z.object({ action: z.literal('toggleMute'), channelId: z.string().uuid(), muted: z.boolean() }),
  z.object({ action: z.literal('unreadCounts') }),
]);

// ─── Helpers ────────────────────────────────────────────────────────────────

export function formatZodErrors(
  result: z.ZodError,
): string {
  return result.issues
    .map((i: z.ZodIssue) => `${i.path.join('.')}: ${i.message}`)
    .join('; ');
}

// Middleware-helper: parse body tegen schema, stuur 400 bij fout.
// Geeft false terug als de response al is verstuurd.
export function validateOrError(
  schema: z.ZodSchema,
  body: unknown,
  res: { status: (code: number) => { json: (data: unknown) => void } },
): body is Record<string, unknown> {
  const result = schema.safeParse(body);
  if (!result.success) {
    res.status(400).json({ error: `Validatiefout: ${formatZodErrors(result.error)}` });
    return false;
  }
  return true;
}
