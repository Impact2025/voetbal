# Homework Video Upload (O8–O12)

Auto-mapping van WhatsApp / technique-videos → `homework-videos` Supabase bucket + `homework_submissions` tabel.

## Quick start

```bash
# 1. Export prod secrets (éénmalig, uit Vercel → Settings → Environment Variables)
export SUPABASE_URL=https://ezbsychffwnavedwiqvw.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJ...   # secret, niet in repo
export OPENROUTER_API_KEY=sk-or-...       # optioneel (AI-feedback)

# 2. Upload al onze 5 bekende huiswerk-videos
node scripts/bulk-upload-homework.mjs

# 3. Of één video
node scripts/bulk-upload-homework.mjs --only="L Move"

# 4. Of een custom CSV (filename,playerId,homeworkId,teamId)
node scripts/bulk-upload-homework.mjs --csv=scripts/homework-upload.csv
```

## Bestand → homework-mapping

| Video (Downloads)               | homework_id     | team_id  | speler (exemplaar)                |
| ---- | ---- | ---- | ---- |
| Tippen (O8).mp4                 | Tippen          | VVCO8-1  | Dani Gabel |
| Sole-Heel roll (O9).mp4         | Sole-Heel roll  | VVCO9-1  | (auto-pick) |
| Sole Drag inside push (O10).mp4 | Sole Drag       | VVCO10-1 | (auto-pick) |
| L Move (O11).mp4                | L Move          | —        | (niet gemapped — zie notities) |
| L Move (O12).mp4                | L Move          | VVCO12-1 | Cass Ruigrok |

> Notitie: `L Move (O11)` en `L Move (O12)` delen homework_id `L Move` maar
> verschillen per leeftijdsgroep. Het script mapped obv team_id — voor O11
> moet je een O11 speler opgeven. Extend `VIDEO_HOMEWORK_MAP` in
> `bulk-upload-homework.mjs` als je meer mappings wilt.

## Wat het script doet

1. Scant `~/Downloads` (of `--dir`) op `.mp4/.mov/.avi/.webm`.
2. Matcht bestandsnaam tegen `VIDEO_HOMEWORK_MAP` (regex).
3. Upload naar `homework-videos/<TEAM>/<PLAYER_ID>/<homework>_<timestamp>.<ext>`
   (path is privé — alleen via `/api/media` (signed URLs) of service-role te openen).
4. INSERT in `homework_submissions(player_id, homework_id, team_id, video_url, feedback_status='pending')`.
5. Idempt — als een submission al bestaat voor die speler/homework, wordt ie overgeslagen.

## CSV formaat (`--csv`)

```
filename,playerId,homeworkId,teamId
L Move (O11).mp4,<player-uuid>,L Move,VVCO11-1
```

`homeworkId` en `teamId` zijn optioneel (gevuld van map default).
`playerId` is verplicht tenzij het script er automatisch één voor het team uitpickt.

## Transcriptie / Whisper

Video's zijn te groot voor directe Whisper-upload. Voor transcriptie:
```bash
ffmpeg -i "video.mp4" -ar 16000 -ac 1 -b:a 64k audio.wav
# audio.wav → OpenRouter Whisper endpoint of lokale Whisper
```
AI-feedback wordt in `ai_feedback` kolom van `homework_submissions` gezet
(`feedback_status='done'`).
