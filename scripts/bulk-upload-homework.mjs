/**
 * Bulk-upload homework videos naar Supabase (privé bucket 'homework-videos')
 * en registreer homework_submissions.
 *
 * Gebruik:
 *   # 1. Exporteer prod secrets (eenmalig)
 *   export SUPABASE_URL=https://ezbsychffwnavedwiqvw.supabase.co
 *   export SUPABASE_SERVICE_ROLE_KEY=<key-from-Vercel-prod-env>
 *   export OPENROUTER_API_KEY=sk-or-...   # optioneel voor AI-feedback
 *
 *   # 2. Upload alle 5 O-vorm videos
 *   node scripts/bulk-upload-homework.mjs
 *
 *   # 3. Of één specifieke video
 *   node scripts/bulk-upload-homework.mjs "L Move (O12).mp4"
 *
 * Mechanica:
 *  - Leest .mp4/.mov bestanden uit ~/Downloads (overschrijfbaar via --dir).
 *  - Matcht bestandsnaam met VIDEO_HOMEWORK_MAP (regex per O-group).
 *  - Upload naar 'homework-videos/<TEAM>/<PLAYER_ID>/<homework>_<ts>.<ext>'.
 *  - INSERT homework_submissions row: player_id, homework_id, team_id, video_url.
 *  - Stelt feedback_status='pending' (AI-feedback als extra stap).
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { createClient } from '@supabase/supabase-js';

/* ── Config ────────────────────────────────────────────────────────── */
// Elk item: regex match op bestandsnaam → homework_id + team_id + speler.
// O-suffix-aware: "L Move (O11).mp4" matched via oSuffix='11' voor VVCO11-1.
// Speler UUID's zijn hardcoded (Cass = O12, Cas Rodi = O11) — anders auto-pick.
const VIDEO_HOMEWORK_MAP = [
  // L Move has different spelers per O-group, so order matters (O-suffix checked first)
  { match: /L\sMove/i, homeworkId: 'L Move', teamId: 'VVCO12-1', playerId: '2cceeb98-a407-4488-8245-b99035cee389', oSuffix: '12' }, // Cass Ruigrok → O12
  { match: /L\sMove/i, homeworkId: 'L Move', teamId: 'VVCO11-1', playerId: '599dc895-b4c5-4868-85be-c93e7238233d', oSuffix: '11' }, // Cas Rodi → O11
  { match: /Tippen/i,           homeworkId: 'Tippen',          teamId: 'VVCO8-1',  playerId: '908d89e8-8db5-470c-984c-dab74a8b2810' }, // Dani Gabel
  { match: /Sole-Heel roll/i,   homeworkId: 'Sole-Heel roll',  teamId: 'VVCO9-1',  playerId: null }, // auto-pick first VVCO9-1 speler
  { match: /Sole Drag/i,        homeworkId: 'Sole Drag',       teamId: 'VVCO10-1', playerId: null }, // auto-pick first VVCO10-1 speler
];

// Default downloads map
const DEFAULT_DOWNLOADS =
  process.platform === 'win32' ? 'C:/Users/v_mun/Downloads' : `${process.env.HOME ?? '.'}/Downloads`;

/** Parse CLI args: --dir=<path> --csv=<path> --only=<regex> */
function parseArgs(argv) {
  const args = { dir: DEFAULT_DOWNLOADS, csv: null, only: null };
  for (const a of argv) {
    if (a.startsWith('--dir=')) args.dir = a.slice(6);
    else if (a.startsWith('--csv=')) args.csv = a.slice(5);
    else if (a.startsWith('--only=')) args.only = a.slice(7);
    else args._ = (args._ ?? []).concat(a);
  }
  return args;
}

/** Resolve Supabase client from env (service-role). */
function makeClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY vereist in env (Vercel → prod env).');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Upload video file → storage bucket 'homework-videos', return path */
async function uploadVideo(supabase, fileBuffer, fileName, playerId, homeworkId, teamId) {
  const ext = (path.extname(fileName) || '.mp4').replace(/[^a-zA-Z0-9]/g, '') || 'mp4';
  const safeHw = homeworkId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `${teamId}/${playerId}/${safeHw}_${timestamp}.${ext}`;

  console.log(`    📤 Upload naar bucket: ${storagePath}`);
  const { data, error } = await supabase.storage
    .from('homework-videos')
    .upload(storagePath, fileBuffer, { contentType: 'video/mp4', upsert: false });

  if (error) throw error;
  return data.path;
}

/** Insert homework_submissions row */
async function createSubmission(supabase, playerId, homeworkId, teamId, videoPath) {
  const { data, error } = await supabase
    .from('homework_submissions')
    .insert({
      player_id: playerId,
      homework_id: homeworkId,
      team_id: teamId,
      video_url: videoPath,
      feedback_status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data.id;
}

// Resolve best matching config entry for a filename.
// O-suffix-aware: "L Move (O11).mp4" matches O11-entry before O12-entry.
function resolveConfig(fileName) {
  // Prefer an exact O-suffix match, eg "(O11)" / "(O12)" in filename.
  // Uses String.includes() — far less escaping-error-prone than RegExp templating.
  for (const c of VIDEO_HOMEWORK_MAP) {
    if (c.oSuffix && fileName.toLowerCase().includes('(o' + c.oSuffix + ')') && c.match.test(fileName)) return c;
  }
  // Fall back: first map entry whose match regex matches (no oSuffix constraint)
  for (const c of VIDEO_HOMEWORK_MAP) {
    if (c.match.test(fileName)) return c;
  }
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const supabase = makeClient();

  // Collect target files
  let files = [];
  if (args.csv) {
    // CSV: filename,playerId,homeworkId,teamId
    const csvText = fs.readFileSync(args.csv, 'utf8');
    const lines = csvText.split('\n').slice(1).filter(Boolean);
    for (const line of lines) {
      const [filename, playerId, homeworkId, teamId] = line.split(',').map(s => s.trim()).filter(Boolean);
      if (!filename) continue;
      const fp = path.join(args.dir, filename);
      files.push({ path: fp, ...{ playerId, homeworkId, teamId: teamId ?? 'VVCO12-1' } });
    }
  } else {
    const dir = args.dir;
    for (const entry of fs.readdirSync(dir)) {
      if (!/\.(mp4|mov|avi|webm)$/i.test(entry)) continue;
      if (args.only && !new RegExp(args.only, 'i').test(entry)) continue;
      files.push({ path: path.join(dir, entry) });
    }
  }

  if (!files.length) {
    console.log('⚠️  Geen video bestanden gevonden. Gebruik --dir=<folder> of --csv=<file>.');
    process.exit(0);
  }

  console.log(`🎬 Start bulk upload: ${files.length} video(s)\n`);

  let ok = 0, skipped = 0, failed = 0;

  for (const f of files) {
    const fileName = path.basename(f.path);
    console.log(`\n▶ ${fileName}`);
    try {
      const stat = fs.statSync(f.path);
      const sizeLabel = (stat.size / (1024 * 1024)).toFixed(2) + ' MB';

      // Resolve metadata
      let homeworkId = f.homeworkId, teamId = f.teamId, playerId = f.playerId;

      if (!playerId || !homeworkId) {
        const cfg = resolveConfig(fileName);
        if (!cfg) {
          console.log(`   ⏭  Geen match in VIDEO_HOMEWORK_MAP — skip. (override via --csv)`);
          skipped++;
          continue;
        }
        homeworkId = homeworkId || cfg.homeworkId;
        teamId = teamId || cfg.teamId;
        // Resolve player: cfg.playerId (mapped) -> auto-pick first speler -> error
        if (!playerId) {
          playerId = cfg.playerId || null;  // use mapped player first (e.g. Cass/Cas)
        }
        if (!playerId) {
          // ... fallback: auto-pick first speler in team
          const { data: p, error: pe } = await supabase
            .from('players')
            .select('id')
            .eq('team_id', teamId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (pe || !p) {
            console.log(`   ⚠️  Player niet gevonden voor ${teamId} — vul playerId in via --csv`);
            skipped++;
            continue;
          }
          playerId = p.id;
        }
      }

      console.log(`   📋 homework="${homeworkId}" team="${teamId}" player="${playerId}" (${sizeLabel})`);

      // Check: exists submission already?
      const { data: exists, error: exErr } = await supabase
        .from('homework_submissions')
        .select('id, video_url')
        .eq('player_id', playerId)
        .eq('homework_id', homeworkId)
        .maybeSingle();

      if (exErr) throw exErr;
      if (exists) {
        console.log(`   ⚠️  Submission bestaat al (${exists.id}) — update video_url? (skip)`);
        skipped++;
        continue;
      }

      const fileBuffer = fs.readFileSync(f.path);
      const videoPath = await uploadVideo(supabase, fileBuffer, fileName, playerId, homeworkId, teamId);
      const submissionId = await createSubmission(supabase, playerId, homeworkId, teamId, videoPath);

      console.log(`   ✅ submission_id=${submissionId}`);
      console.log(`   📎 video=${videoPath}`);
      if (sizeLabel) console.log(`   📏 ${sizeLabel}`);
      ok++;
    } catch (err) {
      console.error(`   ❌ Fout: ${err.message}`);
      failed++;
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log(`📊 Resultaat: ${ok} geüpload, ${skipped} overgeslagen, ${failed} mislukt`);
  console.log('═'.repeat(50));
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
