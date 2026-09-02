import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Loader2, Download, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { createTeam, type TeamDraft } from '../../lib/teamManagement';
import { createInitialEvaluations } from '../../utils/constants';
import { hashPin } from '../../utils/crypto';
import type { Team } from '../../types';

const ACCENT = '#16A34A';

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ─── CSV parsing (komma of puntkomma, met ondersteuning voor "aangehaalde,velden") ──

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const delimiter = (text.split('\n')[0] ?? '').split(';').length > (text.split('\n')[0] ?? '').split(',').length ? ';' : ',';

  const pushField = () => { row.push(field.trim()); field = ''; };
  const pushRow = () => { pushField(); if (row.some(f => f !== '')) rows.push(row); row = []; };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      pushField();
    } else if (c === '\n') {
      pushRow();
    } else if (c === '\r') {
      // negeren, \n volgt
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) pushRow();
  return rows;
}

interface ImportRow {
  teamClass: string;
  teamName: string;
  playerName: string;
  age: string;
  preferredFoot: string;
  position: string;
  rowNumber: number;
}

const HEADER_ALIASES: Record<string, keyof Omit<ImportRow, 'rowNumber'>> = {
  team_klasse: 'teamClass', teamklasse: 'teamClass', team_class: 'teamClass', klasse: 'teamClass',
  team_naam: 'teamName', teamnaam: 'teamName', team_name: 'teamName',
  speler_naam: 'playerName', spelernaam: 'playerName', naam: 'playerName', name: 'playerName', player_name: 'playerName',
  leeftijd: 'age', age: 'age',
  voorkeursvoet: 'preferredFoot', preferred_foot: 'preferredFoot', voet: 'preferredFoot',
  positie: 'position', position: 'position',
};

function rowsToImportRows(csvRows: string[][]): { rows: ImportRow[]; errors: string[] } {
  if (csvRows.length < 2) return { rows: [], errors: ['Het bestand bevat geen datarijen.'] };
  const header = csvRows[0].map(h => h.toLowerCase().trim());
  const colIndex: Partial<Record<keyof Omit<ImportRow, 'rowNumber'>, number>> = {};
  header.forEach((h, i) => { const mapped = HEADER_ALIASES[h]; if (mapped) colIndex[mapped] = i; });

  const errors: string[] = [];
  if (colIndex.teamClass === undefined) errors.push('Kolom "team_klasse" ontbreekt.');
  if (colIndex.playerName === undefined) errors.push('Kolom "speler_naam" ontbreekt.');
  if (errors.length) return { rows: [], errors };

  const rows: ImportRow[] = [];
  csvRows.slice(1).forEach((r, idx) => {
    const get = (key: keyof Omit<ImportRow, 'rowNumber'>) => (colIndex[key] !== undefined ? (r[colIndex[key]!] ?? '').trim() : '');
    const teamClass = get('teamClass');
    const playerName = get('playerName');
    if (!teamClass && !playerName) return; // lege rij
    if (!teamClass || !playerName) {
      errors.push(`Rij ${idx + 2}: "team_klasse" en "speler_naam" zijn beide verplicht.`);
      return;
    }
    rows.push({
      teamClass,
      teamName: get('teamName') || teamClass,
      playerName,
      age: get('age'),
      preferredFoot: get('preferredFoot') || 'Rechts',
      position: get('position'),
      rowNumber: idx + 2,
    });
  });
  return { rows, errors };
}

const TEMPLATE_CSV = 'team_klasse,team_naam,speler_naam,leeftijd,voorkeursvoet,positie\nO11-1,VVC O11-1,Daan de Vries,10,Rechts,Aanvaller\nO11-1,VVC O11-1,Sem Jansen,11,Links,Verdediger\n';

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface ImportedPlayer { teamName: string; playerName: string; pin: string }

interface BulkImportPlayersModalProps {
  clubId: string;
  existingTeams: Team[];
  onClose: () => void;
  onImported: () => void;
}

const BulkImportPlayersModal = ({ clubId, existingTeams, onClose, onImported }: BulkImportPlayersModalProps) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<ImportedPlayer[]>([]);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const csvRows = parseCsv(text);
    const { rows, errors } = rowsToImportRows(csvRows);
    setParsedRows(rows);
    setParseErrors(errors);
    setStep('preview');
  };

  const teamGroups = Array.from(new Set(parsedRows.map(r => r.teamClass))).map(teamClass => {
    const rowsForTeam = parsedRows.filter(r => r.teamClass === teamClass);
    const existing = existingTeams.find(t => t.team_class.toLowerCase() === teamClass.toLowerCase());
    return { teamClass, teamName: existing?.team_name ?? rowsForTeam[0].teamName, isNew: !existing, players: rowsForTeam, existing };
  });

  const handleImport = async () => {
    setStep('importing');
    setProgress({ done: 0, total: parsedRows.length + teamGroups.filter(g => g.isNew).length });
    const teamIdByClass = new Map<string, string>();
    const teamNameByClass = new Map<string, string>();
    const imported: ImportedPlayer[] = [];

    try {
      for (const group of teamGroups) {
        teamNameByClass.set(group.teamClass, group.teamName);
        if (group.existing) {
          teamIdByClass.set(group.teamClass, group.existing.id);
        } else {
          const draft: TeamDraft = {
            id: slugify(`${clubId}-${group.teamClass}-${group.teamName}`) || `${clubId}-${Date.now()}`,
            team_name: group.teamName,
            team_class: group.teamClass,
          };
          const team = await createTeam(clubId, draft);
          teamIdByClass.set(group.teamClass, team.id);
        }
        setProgress(p => ({ ...p, done: p.done + 1 }));
      }

      for (const row of parsedRows) {
        const teamId = teamIdByClass.get(row.teamClass);
        if (!teamId) continue;
        const plainPin = Math.floor(100000 + Math.random() * 900000).toString();
        const newPlayer = {
          name: row.playerName,
          team_id: teamId,
          age: row.age,
          preferred_foot: row.preferredFoot,
          position: row.position,
          pin_hash: 'pending',
          avatar_url: `https://placehold.co/128x128/1A1A1A/FFFFFF?text=${row.playerName.substring(0, 2).toUpperCase()}`,
          evaluations: createInitialEvaluations(),
          completed_homework_ids: [],
          weekly_question_responses: ['', '', ''],
        };
        const { data, error } = await supabase.from('players').insert(newPlayer).select().single();
        if (error || !data) throw new Error(`Speler "${row.playerName}" (rij ${row.rowNumber}): ${error?.message ?? 'aanmaken mislukt'}`);
        const pinHash = await hashPin(plainPin, data.id);
        const { error: updateError } = await supabase.from('players').update({ pin_hash: pinHash }).eq('id', data.id);
        if (updateError) throw new Error(`Speler "${row.playerName}": pincode opslaan mislukt.`);
        imported.push({ teamName: teamNameByClass.get(row.teamClass) ?? row.teamClass, playerName: row.playerName, pin: plainPin });
        setProgress(p => ({ ...p, done: p.done + 1 }));
      }

      setResults(imported);
      setStep('done');
      onImported();
      toast.success(`${imported.length} spelers geïmporteerd!`);
    } catch (err) {
      toast.error((err as Error).message);
      setStep('preview');
    }
  };

  const downloadPinList = () => {
    const header = 'team,speler,pincode\n';
    const body = results.map(r => `"${r.teamName}","${r.playerName}","${r.pin}"`).join('\n');
    downloadTextFile(`pincodes-${clubId}-${Date.now()}.csv`, header + body);
  };

  return (
    <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={step === 'importing' ? undefined : onClose}>
      <motion.div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-xl p-6 max-h-[85vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Spelers importeren (CSV)</h3>
          {step !== 'importing' && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
          )}
        </div>

        {step === 'upload' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Upload een CSV-bestand met je hele ledenbestand. Teams die nog niet bestaan worden automatisch aangemaakt.
              Elke speler krijgt een unieke pincode — die zie je aan het eind om te delen.
            </p>
            <button
              onClick={() => downloadTextFile('sjabloon-spelers-import.csv', TEMPLATE_CSV)}
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
            >
              <Download size={14} /> Download CSV-sjabloon
            </button>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-10 cursor-pointer hover:border-green-400 hover:bg-green-50/40 transition-colors">
              <Upload size={22} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-600">Klik om een CSV-bestand te kiezen</span>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
            </label>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            {parseErrors.length > 0 && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1">
                {parseErrors.map((e, i) => (
                  <p key={i} className="text-xs text-red-700 flex items-start gap-1.5"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> {e}</p>
                ))}
              </div>
            )}
            {parsedRows.length > 0 && (
              <>
                <p className="text-sm text-gray-600">
                  <span className="font-bold">{parsedRows.length}</span> spelers in{' '}
                  <span className="font-bold">{teamGroups.length}</span> teams —{' '}
                  <span className="font-bold text-green-700">{teamGroups.filter(g => g.isNew).length} nieuw</span>,{' '}
                  {teamGroups.filter(g => !g.isNew).length} bestaand.
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {teamGroups.map(g => (
                    <div key={g.teamClass} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{g.teamName}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={g.isNew ? { backgroundColor: '#f0fdf4', color: ACCENT } : { backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                          {g.isNew ? 'nieuw team' : 'bestaand team'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{g.players.length} speler{g.players.length === 1 ? '' : 's'}: {g.players.map(p => p.playerName).join(', ')}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="flex justify-between gap-3 pt-2">
              <button onClick={() => setStep('upload')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm font-medium">
                <ArrowLeft size={14} /> Terug
              </button>
              <button
                onClick={handleImport}
                disabled={parsedRows.length === 0}
                className="px-5 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity text-sm disabled:opacity-40"
                style={{ backgroundColor: ACCENT }}
              >
                Importeer {parsedRows.length} spelers
              </button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 size={28} className="animate-spin" style={{ color: ACCENT }} />
            <p className="text-sm text-gray-500">Bezig met importeren… ({progress.done}/{progress.total})</p>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 size={20} />
              <p className="font-bold">{results.length} spelers aangemaakt!</p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800">
                Dit is de enige keer dat de pincodes leesbaar getoond worden. Download de lijst en deel elke pincode met de bijbehorende speler/ouder.
              </p>
            </div>
            <button onClick={downloadPinList} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: ACCENT }}>
              <Download size={14} /> Download pincode-lijst (CSV)
            </button>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr><th className="text-left px-3 py-2">Team</th><th className="text-left px-3 py-2">Speler</th><th className="text-left px-3 py-2">Pincode</th></tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-1.5 text-gray-600">{r.teamName}</td>
                      <td className="px-3 py-1.5 text-gray-900 font-medium">{r.playerName}</td>
                      <td className="px-3 py-1.5 font-mono text-gray-700">{r.pin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={onClose} className="px-5 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity text-sm" style={{ backgroundColor: ACCENT }}>
                Sluiten
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default BulkImportPlayersModal;
