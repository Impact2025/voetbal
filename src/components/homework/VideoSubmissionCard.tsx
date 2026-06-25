import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Upload, Loader2, CheckCircle2, AlertCircle, RotateCcw, Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { uploadHomeworkVideo } from '../../lib/storage';
import { extractVideoFrames, analyzeMovementVideo } from '../../lib/ai';
import { NEON_COLOR } from '../../utils/constants';
import type { CustomHomework, Player, HomeworkSubmission } from '../../types';

interface VideoSubmissionCardProps {
  homework: CustomHomework;
  player: Player;
  teamId: string;
  existingSubmission?: HomeworkSubmission;
  onSubmissionComplete: (submission: HomeworkSubmission) => void;
}

type Step = 'idle' | 'selected' | 'uploading' | 'extracting' | 'analyzing' | 'done' | 'error';

const STEPS = [
  { key: 'uploading',  label: 'Video uploaden…' },
  { key: 'extracting', label: 'Beelden analyseren…' },
  { key: 'analyzing',  label: 'AI feedback schrijven…' },
] as const;

// Parse the structured feedback into sections for nicer rendering
function parseFeedback(text: string) {
  const sections = [
    { key: 'goed',     emoji: '⭐', label: 'Wat gaat goed',         color: '#4ade80', bg: 'bg-green-950/40', border: 'border-green-800/50' },
    { key: 'verbeter', emoji: '🎯', label: 'Één verbeterpunt',      color: '#fb923c', bg: 'bg-orange-950/40', border: 'border-orange-800/50' },
    { key: 'tip',      emoji: '💡', label: 'Tip voor volgende keer', color: '#60a5fa', bg: 'bg-blue-950/40',   border: 'border-blue-800/50' },
    { key: 'motivatie',emoji: '🔥', label: 'Motivatie',             color: NEON_COLOR, bg: 'bg-emerald-950/40', border: 'border-emerald-800/50' },
  ];

  return sections.map(s => {
    const startMarker = s.emoji;
    const startIdx = text.indexOf(startMarker);
    if (startIdx === -1) return null;

    // Find the next section header or end of string
    const afterHeader = text.indexOf('\n', startIdx);
    if (afterHeader === -1) return null;

    const nextEmoji = sections
      .filter(other => other.emoji !== s.emoji)
      .map(other => text.indexOf(other.emoji, afterHeader))
      .filter(i => i !== -1)
      .sort((a, b) => a - b)[0] ?? text.length;

    const body = text.slice(afterHeader, nextEmoji).trim();
    if (!body) return null;

    return { ...s, body };
  }).filter(Boolean) as Array<(typeof sections)[0] & { body: string }>;
}

const VideoSubmissionCard = ({
  homework,
  player,
  teamId,
  existingSubmission,
  onSubmissionComplete,
}: VideoSubmissionCardProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(() =>
    existingSubmission?.feedback_status === 'done' ? 'done' :
    existingSubmission?.feedback_status === 'error' ? 'error' : 'idle'
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [submission, setSubmission] = useState<HomeworkSubmission | null>(existingSubmission ?? null);
  const [showVideo, setShowVideo] = useState(false);

  const parsedFeedback = submission?.ai_feedback ? parseFeedback(submission.ai_feedback) : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setErrorMsg('Video mag maximaal 100 MB zijn.');
      setStep('error');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStep('selected');
    setErrorMsg('');
  };

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;

    setStep('uploading');
    setUploadPct(0);

    let submissionId: string | null = null;

    try {
      // 1. Insert submission record immediately so coach can see it's in progress
      const { data: newRow, error: insertError } = await supabase
        .from('homework_submissions')
        .insert({
          player_id: player.id,
          homework_id: homework.id,
          team_id: teamId,
          feedback_status: 'processing',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      submissionId = newRow.id;

      // 2. Upload video
      const videoUrl = await uploadHomeworkVideo(
        selectedFile,
        teamId,
        player.id,
        homework.id,
        (pct) => setUploadPct(pct)
      );

      await supabase
        .from('homework_submissions')
        .update({ video_url: videoUrl })
        .eq('id', submissionId);

      // 3. Extract frames
      setStep('extracting');
      const frames = await extractVideoFrames(selectedFile, 6);

      // 4. AI analysis
      setStep('analyzing');
      const feedback = await analyzeMovementVideo({
        homework: { title: homework.title, description: homework.description },
        player: { name: player.name, age: player.age, position: player.position },
        frames,
      });

      // 5. Save feedback
      const { data: updated, error: updateError } = await supabase
        .from('homework_submissions')
        .update({ ai_feedback: feedback, feedback_status: 'done' })
        .eq('id', submissionId)
        .select()
        .single();

      if (updateError) throw updateError;

      setSubmission(updated as HomeworkSubmission);
      setStep('done');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      onSubmissionComplete(updated as HomeworkSubmission);
    } catch (err) {
      console.error('Submission fout:', err);
      const msg = err instanceof Error ? err.message : 'Onbekende fout';
      setErrorMsg(msg);
      setStep('error');

      if (submissionId) {
        await supabase
          .from('homework_submissions')
          .update({ feedback_status: 'error' })
          .eq('id', submissionId);
      }
    }
  }, [selectedFile, player, homework, teamId, previewUrl, onSubmissionComplete]);

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setStep('idle');
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const activeStepIdx = STEPS.findIndex(s => s.key === step);

  return (
    <div className="mt-4 pt-4 border-t border-gray-700/40">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Video selecteren"
      />

      <AnimatePresence mode="wait">

        {/* ── IDLE: upload knop ── */}
        {step === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-2xl overflow-hidden text-left transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, rgba(0,255,157,0.08) 0%, rgba(0,255,157,0.03) 100%)',
                border: `1px solid ${NEON_COLOR}25`,
              }}
            >
              <div className="px-4 py-3.5 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${NEON_COLOR}25, ${NEON_COLOR}10)`, border: `1px solid ${NEON_COLOR}30` }}
                >
                  <Video size={18} style={{ color: NEON_COLOR }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white leading-tight">Film je oefening</p>
                  <p className="text-xs text-gray-400 mt-0.5">Krijg persoonlijke AI-feedback</p>
                </div>
                <div
                  className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shrink-0"
                  style={{ backgroundColor: `${NEON_COLOR}15`, color: NEON_COLOR }}
                >
                  AI
                </div>
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* ── SELECTED: preview + bevestig knop ── */}
        {step === 'selected' && previewUrl && (
          <motion.div key="selected" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video
                src={previewUrl}
                className="w-full h-full object-contain"
                controls
                playsInline
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <RotateCcw size={14} /> Opnieuw
              </button>
              <button
                onClick={handleAnalyze}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-black hover:opacity-90 transition-opacity"
                style={{ backgroundColor: NEON_COLOR }}
              >
                <Upload size={15} /> Uploaden &amp; Analyseren
              </button>
            </div>
          </motion.div>
        )}

        {/* ── PROGRESS: uploading / extracting / analyzing ── */}
        {(step === 'uploading' || step === 'extracting' || step === 'analyzing') && (
          <motion.div key="progress" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center gap-2.5 text-sm text-gray-300">
              <Loader2 size={16} className="animate-spin shrink-0" style={{ color: NEON_COLOR }} />
              <span>{STEPS.find(s => s.key === step)?.label}</span>
            </div>

            {/* Step indicators */}
            <div className="space-y-1.5">
              {STEPS.map((s, idx) => {
                const isDone = idx < activeStepIdx;
                const isActive = s.key === step;
                return (
                  <div key={s.key} className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${isDone ? 'bg-green-500' : isActive ? '' : 'bg-gray-800'}`}
                      style={isActive ? { backgroundColor: `${NEON_COLOR}30`, border: `1px solid ${NEON_COLOR}` } : {}}>
                      {isDone
                        ? <CheckCircle2 size={12} className="text-white" />
                        : isActive
                          ? <Loader2 size={9} className="animate-spin" style={{ color: NEON_COLOR }} />
                          : null
                      }
                    </div>
                    <span className={`text-xs ${isDone ? 'text-green-400' : isActive ? 'text-white font-medium' : 'text-gray-600'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {step === 'uploading' && (
              <div className="bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-1.5 rounded-full"
                  style={{ backgroundColor: NEON_COLOR }}
                  animate={{ width: `${uploadPct}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* ── DONE: feedback display ── */}
        {step === 'done' && submission?.ai_feedback && (
          <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-green-400" />
                <span className="text-xs font-bold text-green-400 uppercase tracking-wide">AI Feedback ontvangen</span>
              </div>
              {submission.video_url && (
                <button
                  onClick={() => setShowVideo(v => !v)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <Play size={11} /> {showVideo ? 'Verberg' : 'Bekijk video'}
                </button>
              )}
            </div>

            {showVideo && submission.video_url && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="rounded-xl overflow-hidden bg-black">
                <video src={submission.video_url} controls playsInline className="w-full max-h-48 object-contain" />
              </motion.div>
            )}

            {parsedFeedback.length > 0 ? (
              <div className="space-y-2">
                {parsedFeedback.map(section => (
                  <div
                    key={section.key}
                    className={`rounded-xl p-3 border ${section.bg} ${section.border}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{section.emoji}</span>
                      <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: section.color }}>
                        {section.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed">{section.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/40">
                <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{submission.ai_feedback}</p>
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-700 text-xs text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors"
            >
              <RotateCcw size={12} /> Opnieuw inzenden
            </button>
          </motion.div>
        )}

        {/* ── ERROR ── */}
        {step === 'error' && (
          <motion.div key="error" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/30 border border-red-800/40">
              <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-400">Er ging iets mis</p>
                <p className="text-xs text-gray-400 mt-0.5">{errorMsg || 'Onbekende fout'}</p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-700 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <RotateCcw size={12} /> Opnieuw proberen
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default VideoSubmissionCard;
