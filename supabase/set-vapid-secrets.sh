#!/bin/bash
# ─── Supabase VAPID secrets instellen voor push notificaties ──────────────
# Run dit script na: supabase login
# Meer info: https://supabase.com/docs/guides/functions/secrets
#
# Gebruik:
#   bash supabase/set-vapid-secrets.sh

set -euo pipefail

echo "VAPID secrets instellen voor project: ezbsychffwnavedwiqvw"

supabase secrets set \
  VAPID_EMAIL=hello@skillkaart.nl \
  VAPID_PUBLIC_KEY=BCau8OUNeTpcElntf7v8Um1ToHqUaVcMJ8Fj5dgBhNRrHk3NPR61V2JKgvIcSE4ZwRvGTwn4ZphyqM4r-l7NzWg \
  VAPID_PRIVATE_KEY=SeJofIalEwyEq4nXWRe0UIU0PAosr0pZogNi0HaZWKA \
  --project-ref ezbsychffwnavedwiqvw

echo "✅ VAPID secrets gezet. Push notificaties zouden nu moeten werken."
echo ""
echo "Controleer met: supabase secrets list --project-ref ezbsychffwnavedwiqvw"
