# Skill: supabase-storage-with-anon-key

**Use this when** you or a script need to upload files to a Supabase storage bucket using
only the public/anon key (no service_role key available, e.g. a local CLI run outside Vercel
prod env). This skill encodes the **exact byte-size boundary and MIME-type rule** that
determines whether an anon upload succeeds or returns `403 signature verification failed`.

## Core behaviour (do this)

1. **For table INSERTs** (e.g. `homework_submissions`): anon key **works** — provided the
   table has an `anon_all` RLS policy granting `INSERT`. Test once with `curl -X POST`.
2. **For storage uploads**: anon **succeeds only for small object payloads** (observed:
   chunks ≤ ~64 KB / single-request bodies; multipart large uploads are gated by an
   S3-style signing step that anon cannot perform). For full video files (>64 KB) you
   **must** use the `SUPABASE_SERVICE_ROLE_KEY`.
3. Always set `Content-Type` to one of the bucket's `allowed_mime_types`
   (e.g. `video/mp4`). A mismatch yields `415 InvalidMimeType` — NOT an auth error.

## Gotchas / pitfalls

- **`403 signature verification failed`** on large payloads → anon cannot mint the
  signature; switch to service_role. Do NOT retry anon — it will keep failing.
- **Private bucket** (`public=false`): anon can upload IF the write policy allows,
  but cannot **list** (`GET /object/list` → `NoSuchBucket`) unless a SELECT policy
  exists. Listing failure does NOT mean upload failed.
- **MSYS / Git-Bash path quirk**: `curl --data-binary @/c/Users/...` breaks on paths
  that look like MSYS conversions. Prefer stdin pipe: `cat "file" | curl ... --data-binary @-`
  OR use Node's `fs.readFileSync` + `supabase-js` client (supabase client handles
  the S3 signing internally — but still needs service_role to *initiate* the signed URL).

## When the anon shortcut works end-to-end

- Small text/seed files (≤64 KB): direct `curl -X POST .../object/bucket/path`.
- Table writes: direct REST POST `/rest/v1/<table>`.

## When you must escalate

- Video / large binary uploads (>64 KB).
- Any bucket with `allowed_mime_types` that exclude your file type.
- When the user only has the anon key — surface this skill's boundary, ask them to
  paste the `SUPABASE_SERVICE_ROLE_KEY` from Vercel → project → Settings → Environment
  Variables → Production, then proceed with the full script.

See `references/supabase-storage-anon-limitations.md` for the exact curl repro and
error transcript from this session.
