# Supabase Storage — Anon Upload Limits (reference)

## Repro: 64 KB chunk upload (anon — SUCCEEDS)

```bash
export SUPABASE_URL="https://ezbsychffwnavedwiqvw.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGc...ABON_KEY"   # only the public anon key
curl -s -X POST "$SUPABASE_URL/storage/v1/object/homework-videos/test/lmove-header-test.mp4" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: video/mp4" \
  --data-binary @-   # pipe 64 KB chunk via stdin
```
Result: `{"Key":"homework-videos/test/...","Id":"8ae2ea14-...."}` — upload OK.

## Repro: full 2.3 MB video upload (anon — FAILS)

```bash
cat "/c/Users/v_mun/Downloads/L Move (O12).mp4" | \
curl -s -X POST "$SUPABASE_URL/storage/v1/object/homework-videos/VVCO12-1/<player>/LMove_full_20260903.mp4" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: video/mp4" \
  --data-binary @-
```
Result: `{"statusCode":"403","error":"Unauthorized","message":"signature verification failed","code":"AccessDenied"}`

Root cause: Supabase storage uses an S3-style signature step for object payloads
larger than the in-memory direct-upload buffer. Anon role cannot mint the signature
(it requires a `role: service_role` JWT to call `POST /object/sign`). The 64 KB
success was below that threshold.

## Anon CAN write tables (homework_submissions)

The `homework_submissions` table has an `anon_all` RLS policy granting INSERT.
Tested with anon key:
`{"id":"30b213d8-7d8d-413f-8759-6848352d88ae","player_id":"...","homework_id":"L Move","team_id":"VVCO12-1","feedback_status":"pending","created_at":"2026-09-04T13:44:34Z","updated_at":"2026-09-04T13:44:34Z","coach_reviewed":false}`

→ Use this to pre-register the submission row, then upload the video separately
with service_role.

## Workaround for "I only have anon"

1. Create `homework_submissions` row via anon + curl REST (`feedback_status='pending_upload'`).
2. Ask user for `SUPABASE_SERVICE_ROLE_KEY` from Vercel prod env → re-run upload.
3. UPDATE the row's `video_url` to the storage path returned by the signed upload.

This keeps progress moving when service_role is unavailable, and the submission
record exists for later video backfill.
