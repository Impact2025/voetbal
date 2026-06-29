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

// ─── Campaign ───────────────────────────────────────────────────────────────

export const SendCampaignSchema = z.object({
  campaignId: z.string().uuid().optional(),
  name: z.string().max(200).optional(),
  subject: z.string().min(1, 'Onderwerp is verplicht').max(200).optional(),
  body: z.string().min(1, 'Bericht is verplicht').optional(),
  segment: z.string().min(1).optional(),
  segment_stage: z.string().nullable().optional(),
});

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
