import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle2, Loader2, Wand2, Video, Upload, RotateCcw, Camera, Play } from 'lucide-react';
import { CATEGORY_META } from '../../data/challenges';
import { getChallengeAIFeedback, extractVideoFrames, analyzeChallengeVideo } from '../../lib/ai';
import { uploadChallengeVideo } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import { NEON_COLOR } from '../../utils/constants';
import type { Challenge, ChallengeCompletion, Player } from '../../types';

interface ChallengeCardProps {
  challenge: Challenge;
  player: Player;
  completion: ChallengeCompletion | undefined;
  onComplete: (challengeId: string, reflection: string, videoUrl?: string, videoAIFeedback?: string) => Promise<string | null>;
}

type VideoStep = 'idle' | 'selected' | 'uploading' | 'extracting' | 'analyzing' | 'done' | 'error';

const VIDEO_STEPS = [
  { key: 'uploading',  label: 'Uploaden...' },
  { key: 'extracting', label: 'Beelden analyseren...' },
  { key: 'analyzing',  label: 'AI feedback schrijven...' },
] as const;

const ChallengeCard = ({ challenge, player, completion, onComplete }: ChallengeCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [reflection, setReflection] = useState('');
  const [aiFeedback, setAIFeedback] = useState(completion?.ai_feedback ?? '');
  const [videoAIFeedback, setVideoAIFeedback] = useState(completion?.video_ai_feedback ?? '');
  const [loadingAI, setLoadingAI] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [done, setDone] = useState(!!completion);

  // Video state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [videoStep, setVideoStep] = useState<VideoStep>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [videoErrorMsg, setVideoErrorMsg] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const [submittedVideoUrl, setSubmittedVideoUrl] = useState(completion?.video_url ?? '');

  const meta = CATEGORY_META[challenge.category];
  const playerAge = parseInt(player.age ?? '10', 10);
  const ageOk = playerAge >= challenge.age_min && playerAge <= challenge.age_max;
  const hasVideo = challenge.supports_video === true;
  const videoStepIdx = VIDEO_STEPS.findIndex(s => s.key === videoStep);

  if (!ageOk) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      setVideoErrorMsg('Video mag maximaal 100 MB zijn.');
      setVideoStep('error');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setVideoStep('selected');
    setVideoErrorMsg('');
  };

  const handleVideoUpload = useCallback(async () => {
    if (!selectedFile) return;
    setVideoStep('uploading');
    setUploadPct(0);

    let videoUrl = '';

    try {
      // 1. Upload video
      videoUrl = await uploadChallengeVideo(
        selectedFile,
        player.team_id,
        player.id,
        challenge.id,
        (pct) => setUploadPct(pct)
      );

      // 2. Extract frames
      setVideoStep('extracting');
      const frames = await extractVideoFrames(selectedFile, 6);

      // 3. AI analysis
      setVideoStep('analyzing');
      const feedback = await analyzeChallengeVideo({
        challenge: { title: challenge.title, setup: challenge.setup, win_condition: challenge.win_condition },
        player: { name: player.name, age: player.age, position: player.position },
        frames,
      });
      setVideoAIFeedback(feedback);

      setSubmittedVideoUrl(videoUrl);
      setVideoStep('done');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (err) {
      console.error('Challenge video fout:', err);
      const msg = err instanceof Error ? err.message : 'Onbekende fout';
      setVideoErrorMsg(msg);
      setVideoStep('error');
    }
  }, [selectedFile, player, challenge, previewUrl]);

  const handleVideoReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setVideoStep('idle');
    setVideoErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleComplete = async () => {
    if (completing || done) return;
    setCompleting(true);

    // Reflection-based AI feedback (only if reflection given)
    let feedback = '';
    if (reflection.trim() && challenge.reflection_prompt) {
      setLoadingAI(true);
      feedback = await getChallengeAIFeedback({
        challengeTitle: challenge.title,
        reflection: reflection.trim(),
        playerName: player.name,
        playerAge: player.age ?? '10',
        hint: challenge.ai_feedback_hint,
      });
      setAIFeedback(feedback);
      setLoadingAI(false);
    }

    await onComplete(
      challenge.id,
      reflection.trim(),
      submittedVideoUrl || undefined,
      videoAIFeedback || undefined
    );
    setDone(true);
    setCompleting(false);
  };

  const isCompletable = !hasVideo || videoStep === 'done';

  return (
    <motion.div
      layout
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: done ? `${meta.color}40` : 'rgba(255,255,255,0.06)',
        background: done ? meta.bg : '#0d0f14',
      }}
    >
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div
          className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base"
          style={{ backgroundColor: `${meta.color}18` }}
        >
          {meta.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white leading-tight">{challenge.title}</span>
            {hasVideo && !done && videoStep === 'done' && (
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${NEON_COLOR}15`, color: NEON_COLOR }}>
                Video klaar
              </span>
            )}
            {done && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle2 size={14} style={{ color: meta.color }} />
              </motion.div>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
            >
              {meta.label}
            </span>
            <span className="text-[9px] text-gray-600">{challenge.age_min}-{challenge.age_max} jaar</span>
          </div>
        </div>

        <span className="shrink-0 text-gray-600">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/[0.04]">

              {/* Setup */}
              <div className="pt-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Setup</p>
                <p className="text-sm text-gray-300 leading-relaxed">{challenge.setup}</p>
              </div>

              {/* Win condition */}
              <div
                className="rounded-xl p-3 border"
                style={{ backgroundColor: `${meta.color}0a`, borderColor: `${meta.color}25` }}
              >
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: `${meta.color}90` }}>
                  Win-conditie
                </p>
                <p className="text-sm font-semibold text-white leading-relaxed">{challenge.win_condition}</p>
              </div>

              {/* ── VIDEO UPLOAD (voor challenges die het ondersteunen) ── */}
              {hasVideo && !done && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-2">
                    <Camera size={14} style={{ color: NEON_COLOR }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: NEON_COLOR }}>
                      Upload je uitvoering voor AI feedback
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                    aria-label="Video selecteren"
                  />

                  {/* IDLE */}
                  {videoStep === 'idle' && (
                    <motion.button
                      onClick={() => fileInputRef.current?.click()}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left"
                      style={{ background: 'linear-gradient(135deg, rgba(0,255,157,0.08) 0%, rgba(0,255,157,0.03) 100%)', border: `1px solid ${NEON_COLOR}25` }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${NEON_COLOR}25, ${NEON_COLOR}10)`, border: `1px solid ${NEON_COLOR}30` }}>
                        <Video size={18} style={{ color: NEON_COLOR }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white leading-tight">Film je uitvoering</p>
                        <p className="text-xs text-gray-400 mt-0.5">Krijg persoonlijke AI-videoanalyse</p>
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shrink-0" style={{ backgroundColor: `${NEON_COLOR}15`, color: NEON_COLOR }}>
                        AI
                      </div>
                    </motion.button>
                  )}

                  {/* SELECTED: preview + upload */}
                  {videoStep === 'selected' && previewUrl && (
                    <motion.div key="selected" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                        <video src={previewUrl} className="w-full h-full object-contain" controls playsInline />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleVideoReset} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-400 hover:text-white transition-colors">
                          <RotateCcw size={14} /> Opnieuw
                        </button>
                        <button onClick={handleVideoUpload} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-black hover:opacity-90 transition-opacity" style={{ backgroundColor: NEON_COLOR }}>
                          <Upload size={15} /> Upload & Analyseer
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* PROGRESS: uploading / extracting / analyzing */}
                  {(videoStep === 'uploading' || videoStep === 'extracting' || videoStep === 'analyzing') && (
                    <motion.div key="progress" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                      <div className="flex items-center gap-2.5 text-sm text-gray-300">
                        <Loader2 size={16} className="animate-spin shrink-0" style={{ color: NEON_COLOR }} />
                        <span>{VIDEO_STEPS.find(s => s.key === videoStep)?.label}</span>
                      </div>
                      <div className="space-y-1.5">
                        {VIDEO_STEPS.map((s, idx) => {
                          const isDone = idx < videoStepIdx;
                          const isActive = s.key === videoStep;
                          return (
                            <div key={s.key} className="flex items-center gap-2.5">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${isDone ? 'bg-green-500' : isActive ? '' : 'bg-gray-800'}`}
                                style={isActive ? { backgroundColor: `${NEON_COLOR}30`, border: `1px solid ${NEON_COLOR}` } : {}}>
                                {isDone ? <CheckCircle2 size={12} className="text-white" />
                                  : isActive ? <Loader2 size={9} className="animate-spin" style={{ color: NEON_COLOR }} /> : null}
                              </div>
                              <span className={`text-xs ${isDone ? 'text-green-400' : isActive ? 'text-white font-medium' : 'text-gray-600'}`}>{s.label}</span>
                            </div>
                          );
                        })}
                      </div>
                      {videoStep === 'uploading' && (
                        <div className="bg-gray-800 rounded-full h-1.5 overflow-hidden">
                          <motion.div className="h-1.5 rounded-full" style={{ backgroundColor: NEON_COLOR }} animate={{ width: `${uploadPct}%` }} transition={{ duration: 0.3 }} />
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* VIDEO DONE */}
                  {videoStep === 'done' && videoAIFeedback && (
                    <motion.div key="video-done" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl p-3 border" style={{ backgroundColor: `${NEON_COLOR}08`, borderColor: `${NEON_COLOR}25` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 size={13} className="text-green-400" />
                          <span className="text-[10px] font-bold text-green-400 uppercase tracking-wide">Video-analyse ontvangen</span>
                        </div>
                        {submittedVideoUrl && (
                          <button onClick={() => setShowVideo(v => !v)} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
                            <Play size={10} /> {showVideo ? 'Verberg' : 'Bekijk'}
                          </button>
                        )}
                      </div>
                      {submittedVideoUrl && showVideo && (
                        <div className="mb-3 rounded-xl overflow-hidden bg-black">
                          <video src={submittedVideoUrl} controls playsInline className="w-full max-h-40 object-contain" />
                        </div>
                      )}
                      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{videoAIFeedback}</p>
                    </motion.div>
                  )}

                  {/* VIDEO ERROR */}
                  {videoStep === 'error' && (
                    <motion.div key="video-error" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/30 border border-red-800/40">
                        <div><p className="text-xs font-bold text-red-400">Er ging iets mis</p>
                          <p className="text-xs text-gray-400 mt-0.5">{videoErrorMsg || 'Onbekende fout'}</p></div>
                      </div>
                      <button onClick={handleVideoReset} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-700 text-xs text-gray-400 hover:text-white transition-colors">
                        <RotateCcw size={12} /> Opnieuw proberen
                      </button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Video feedback (bestaat al, bij reeds voltooide challenge) */}
              {done && hasVideo && completion?.video_url && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Jouw video</span>
                    <button onClick={() => setShowVideo(v => !v)} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
                      <Play size={10} /> {showVideo ? 'Verberg' : 'Bekijk'}
                    </button>
                  </div>
                  {showVideo && (
                    <div className="rounded-xl overflow-hidden bg-black">
                      <video src={completion.video_url} controls playsInline className="w-full max-h-40 object-contain" />
                    </div>
                  )}
                  {completion.video_ai_feedback && (
                    <div className="rounded-xl p-3 border" style={{ backgroundColor: `${meta.color}08`, borderColor: `${meta.color}20` }}>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: `${meta.color}80` }}>Video-analyse</p>
                      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{completion.video_ai_feedback}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── REFLECTION + COMPLETION ── */}
              {!done ? (
                <div className="space-y-3">
                  {challenge.reflection_prompt && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1.5">
                        Reflectie <span className="font-normal normal-case text-gray-700">(optioneel)</span>
                      </p>
                      <p className="text-xs text-gray-400 mb-2 italic">"{challenge.reflection_prompt}"</p>
                      <textarea
                        value={reflection}
                        onChange={e => setReflection(e.target.value)}
                        placeholder="Schrijf hier je antwoord..."
                        rows={2}
                        className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-gray-500 transition-colors"
                      />
                    </div>
                  )}

                  <motion.button
                    onClick={handleComplete}
                    disabled={completing || (hasVideo && !isCompletable)}
                    whileTap={{ scale: 0.95 }}
                    className="w-full py-3 rounded-xl text-sm font-black text-black flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ backgroundColor: meta.color }}
                  >
                    {completing ? (
                      <><Loader2 size={14} className="animate-spin" /> Verwerken...</>
                    ) : hasVideo && !isCompletable ? (
                      <><Camera size={14} /> Eerst video uploaden</>
                    ) : (
                      <><CheckCircle2 size={14} /> Gedaan! {'\u{1F389}'}</>
                    )}
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-3">
                  {reflection && (
                    <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Jouw reflectie</p>
                      <p className="text-sm text-gray-300 italic">"{reflection || completion?.reflection}"</p>
                    </div>
                  )}

                  {/* AI feedback van reflectie */}
                  {loadingAI ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Loader2 size={12} className="animate-spin" /> AI feedback laden...
                    </div>
                  ) : aiFeedback ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl p-3 border"
                      style={{ backgroundColor: `${meta.color}08`, borderColor: `${meta.color}20` }}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        <Wand2 size={11} style={{ color: meta.color }} />
                        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: `${meta.color}80` }}>
                          Coach AI
                        </p>
                      </div>
                      <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">{aiFeedback}</p>
                    </motion.div>
                  ) : null}

                  <div className="flex items-center gap-2 text-xs font-bold" style={{ color: meta.color }}>
                    <CheckCircle2 size={13} />
                    Uitdaging voltooid — XP toegevoegd aan jouw kaart!
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChallengeCard;
