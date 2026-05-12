import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, User, BarChart2, LogOut, ShieldCheck, UserSquare, ClipboardList, X, CheckCircle2, Youtube, ListPlus, Wand2, Loader2, FileText, Copy, Edit, Menu } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Client Setup ---
// NOTE: These keys are public (anon) and are safe to be in the frontend code.
const supabaseUrl = "https://ezbsychffwnavedwiqvw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6YnN5Y2hmZnduYXZlZHdpcXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTcyNzgsImV4cCI6MjA5NDA3MzI3OH0.nDtUgUuTE9isLJlfNaBUnCI6WDRtbaJsiaV6jcv--ZE";
const supabase = createClient(supabaseUrl, supabaseAnonKey);


// --- Gemini API Helper (unchanged) ---
const callGeminiAPI = async (prompt, retries = 3, delay = 1000) => {
    const apiKey = ""; // Left empty as per instructions
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7,
            topP: 1,
            topK: 1,
            maxOutputTokens: 256,
        },
    };

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                throw new Error("Invalid response structure from Gemini API");
            }
        } catch (error) {
            console.error(`API call attempt ${i + 1} failed:`, error);
            if (i < retries - 1) {
                await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
            } else {
                return `Kon geen suggestie genereren: ${error.message}. Probeer het later opnieuw.`;
            }
        }
    }
};

// --- Test Data Structure ---
const initialTestState = {
  balvaardigheid: { hooghouden: '', tikken: '', slalom: '', aannemen: '', wandpass: '' },
  schietenPassing: { nauwkeurigheidSchieten: '', passNauwkeurigheid: '', schotkracht: '' },
  fysiekConditie: { sprint10m: '', herhaaldeSprints: '', uithoudingsvermogen: '', sprongkracht: '' },
  coordinatieInzicht: { reactietest: '', duel1v1: '', spelintelligentie: '' }
};

const testLabels = {
  balvaardigheid: { label: 'Balvaardigheid', tests: { hooghouden: 'Hooghouden (aantal)', tikken: 'Binnen-/Buitenkant Tikken (aantal/30s)', slalom: 'Slalom Dribbel (sec)', aannemen: 'Aannemen uit Lucht (x/10)', wandpass: 'Wandpass Controle (x/30)' }},
  schietenPassing: { label: 'Schieten & Passing', tests: { nauwkeurigheidSchieten: 'Nauwkeurigheid Schieten (x/10)', passNauwkeurigheid: 'Pass Nauwkeurigheid (x/10)', schotkracht: 'Schotkracht (km/u)' }},
  fysiekConditie: { label: 'Fysiek & Conditie', tests: { sprint10m: 'Sprinttest 10m (sec)', herhaaldeSprints: 'Herhaalde Sprints (verschil sec)', uithoudingsvermogen: 'Uithoudingsvermogen (m/6min)', sprongkracht: 'Sprongkracht (cm)' }},
  coordinatieInzicht: { label: 'Coördinatie & Inzicht', tests: { reactietest: 'Reactietest (sec)', duel1v1: '1-tegen-1 Duel (x/5)', spelintelligentie: 'Spelintelligentie (score 1-5)' }}
};


const homeworkSuggestions = [
  { title: 'Hooghouden Challenge', description: 'Tel hoe vaak je de bal omhoog kunt houden met voeten, knieën en hoofd. Probeer je record te verbeteren.' },
  { title: 'Doelschieten Precisie', description: 'Zet 2 schoenen of emmers neer als doel en schiet 10 keer met links en 10 keer met rechts.' },
  { title: 'Pionnen Dribbel', description: 'Maak een parcours met flesjes of pionnen en dribbel er zo snel mogelijk doorheen.' },
  { title: '1-tegen-1 Duel', description: 'Speel tegen een broer/zus/ouder: probeer 5x langs de tegenstander te dribbelen.' },
  { title: 'Bal Aannemen uit de Lucht', description: 'Gooi de bal op en neem hem goed aan met voet, dij of borst. De bal mag niet wegstuiteren.' },
  { title: 'Wandpass', description: 'Speel de bal hard tegen een muur en neem hem weer goed aan (10x links, 10x rechts).' },
  { title: 'Trucje Oefenen', description: 'Kies één beweging (schaar, Zidane-draai, elastico) en oefen deze 10 keer.' },
  { title: 'Penalty Shootout', description: 'Laat iemand op doel staan (ouder of broer/zus) en neem 10 penalty’s.' },
  { title: 'Sprint & Stop', description: 'Dribbel 10 meter met de bal en stop hem precies stil bij een pion of schoen.' },
  { title: 'Target Shooting', description: 'Hang een oude doos of hoepel op als target en mik de bal erdoor.' },
  { title: 'Balcontrole Tik-Tak', description: 'Tik de bal met de binnenkant van je voeten, links en rechts om en om (minstens 50 keer).' },
  { title: 'Dribbel + Schot', description: 'Zet 3 pionnen neer, dribbel erdoorheen en eindig met een schot op doel of tegen een muur.' },
  { title: 'Koppenduels', description: 'Gooi de bal op en probeer hem terug te koppen in een mand, doos of naar een ouder.' },
  { title: 'Balafpak Spel', description: 'Iemand dribbelt, de ander probeert de bal af te pakken zonder te duwen. Wie houdt de bal het langst?' },
  { title: 'Obstacle Course', description: 'Maak een parcours (stoel, bank, emmer) en dribbel erdoorheen op tijd.' },
];


const DEFAULT_WEEKLY_QUESTIONS = [
  'Wat maakt een team goed?',
  'Wat zijn de eigenschappen van een goede teamgenoot?',
  'Wat kan ik doen om een goede teamgenoot te zijn?'
];


const skillKeys = ['snelheid', 'passing', 'techniek', 'schot', 'verdedigen', 'inzicht', 'mentaliteit'];
const evaluationPeriods = ['Check-in 1', 'Check-in 2', 'Check-in 3'];
const NEON_COLOR = '#00FF9D';

// --- Helper Functions ---
const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

// --- Helper Components ---
const ToolButton = React.forwardRef(({ children, className, ...props }, ref) => (
  <button ref={ref} className={`flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-lg bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/70 hover:text-white transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[${NEON_COLOR}] ${className}`} {...props}>
    {children}
  </button>
));

const Card = ({ children, className }) => (
  <div className={`bg-black/30 backdrop-blur-sm border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg shadow-black/30 ${className}`}>
    {children}
  </div>
);

const Slider = ({ label, value, onChange, min = 0, max = 10, step = 1, disabled = false }) => (
    <div className={disabled ? 'opacity-50' : ''}>
        <label className="block text-sm font-medium text-gray-400 capitalize mb-2">{label}</label>
        <div className="flex items-center gap-4">
            <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} disabled={disabled} className={`w-full h-3 bg-gray-700 rounded-lg appearance-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} slider-thumb`} style={{ touchAction: 'none' }} />
            <span className="font-bold text-lg w-8 text-center" style={{ color: NEON_COLOR }}>{value}</span>
        </div>
        <style>{`
            .slider-thumb::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 28px; height: 28px; background: ${NEON_COLOR}; border: 3px solid #1A1A1A; border-radius: 50%; cursor: ${disabled ? 'not-allowed' : 'pointer'}; box-shadow: 0 0 0 2px ${NEON_COLOR}40; }
            .slider-thumb::-moz-range-thumb { width: 28px; height: 28px; background: ${NEON_COLOR}; border: 3px solid #1A1A1A; border-radius: 50%; cursor: ${disabled ? 'not-allowed' : 'pointer'}; }
        `}</style>
    </div>
);

const Input = ({ label, value, onChange, placeholder, type = "text", disabled = false, className = '' }) => (
    <div className={className}>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} className={`w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[--neon-color] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} />
    </div>
);

const Select = ({ label, value, onChange, children, disabled = false, className = '' }) => (
    <div className={className}>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        <select value={value} onChange={onChange} disabled={disabled} className={`w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[--neon-color] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {children}
        </select>
    </div>
);


const Textarea = ({ label, value, onChange, placeholder, disabled = false, className = '', children }) => (
    <div className={className}>
        <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-400">{label}</label>
            {children}
        </div>
        <textarea value={value} onChange={onChange} placeholder={placeholder} rows="4" disabled={disabled} className={`w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[--neon-color] resize-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} />
    </div>
);

const ConfirmModal = ({ isVisible, onClose, onConfirm, title, children }) => {
    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-lg"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-white mb-4">{title}</h3>
                        <div className="text-gray-400 mb-6">{children}</div>
                        <div className="flex justify-end gap-4">
                            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors">Annuleren</button>
                            <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity">Bevestigen</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- App Components (Moved Before Dashboard) ---
const AuthComponent = ({ onPlayerLogin }) => {
    const [view, setView] = useState('playerLogin'); // playerLogin, coachLogin, coachRegister
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [teamId, setTeamId] = useState('');
    const [newTeamId, setNewTeamId] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [rememberCoach, setRememberCoach] = useState(false);

    useEffect(() => {
        if (view === 'playerLogin') {
            const savedTeamId = localStorage.getItem('rememberedTeamId');
            const savedPin = localStorage.getItem('rememberedPin');
            if (savedTeamId && savedPin) {
                setTeamId(savedTeamId);
                setPin(savedPin);
                setRememberMe(true);
            }
        } else if (view === 'coachLogin') {
            const savedEmail = localStorage.getItem('rememberedCoachEmail');
            if (savedEmail) {
                setEmail(savedEmail);
                setRememberCoach(true);
            }
        }
    }, [view]);

    const handleCoachAuth = async (isRegistering) => {
        setLoading(true);
        setError('');
        try {
            if (isRegistering) {
                if (!newTeamId.trim()) {
                    throw new Error("Een unieke Team ID is verplicht om een team te registreren.");
                }

                const { data: teamData } = await supabase
                    .from('teams')
                    .select('id')
                    .eq('id', newTeamId)
                    .single();

                if (teamData) {
                    throw new Error("Deze Team ID is al in gebruik. Kies een andere.");
                }

                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                
                await supabase.from('teams').insert({ id: newTeamId, coach_id: data.user.id, team_name: `${email.split('@')[0]}'s Team` });
                await supabase.from('profiles').insert({ id: data.user.id, role: 'coach', team_id: newTeamId });

            } else {
                if (rememberCoach) {
                    localStorage.setItem('rememberedCoachEmail', email);
                } else {
                    localStorage.removeItem('rememberedCoachEmail');
                }
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if(error) throw error;
            }
        } catch (err) {
            let friendlyMessage = "Er is iets misgegaan. Probeer het opnieuw.";
             switch (err.message) {
                case 'Invalid login credentials':
                    friendlyMessage = "Ongeldige inloggegevens. Controleer uw e-mail en wachtwoord.";
                    break;
                case 'User already registered':
                     friendlyMessage = "Dit e-mailadres is al in gebruik door een ander account.";
                    break;
                case 'Password should be at least 6 characters':
                    friendlyMessage = "Het wachtwoord moet uit minstens 6 tekens bestaan.";
                    break;
                default:
                     friendlyMessage = err.message;
            }
            setError(friendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    const handlePlayerLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!teamId.trim() || !pin.trim()) {
                throw new Error("Team ID en Pincode zijn beide verplicht.");
            }
            const { data: playerData, error } = await supabase
                .from('players')
                .select('*')
                .eq('team_id', teamId)
                .eq('pin', pin)
                .single();
            
            if (error || !playerData) {
                 throw new Error("Speler niet gevonden. Controleer de Team ID en Pincode.");
            }
            
            if (rememberMe) {
                localStorage.setItem('rememberedTeamId', teamId);
                localStorage.setItem('rememberedPin', pin);
            } else {
                localStorage.removeItem('rememberedTeamId');
                localStorage.removeItem('rememberedPin');
            }

            onPlayerLogin({
                role: 'player',
                teamId: teamId,
                uid: playerData.id,
                ...playerData
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderForm = () => {
        if (view === 'playerLogin') {
            return (
                <form onSubmit={handlePlayerLogin} className="space-y-4">
                    <h2 className="text-2xl font-bold text-center mb-4" style={{ textShadow: `0 0 8px ${NEON_COLOR}` }}>SPELER LOGIN</h2>
                    <Input label="Team ID" value={teamId} onChange={e => setTeamId(e.target.value)} placeholder="Vraag je coach" />
                    <Input label="Jouw Pincode" value={pin} onChange={e => setPin(e.target.value)} placeholder="4-cijferige code" />
                     <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-[--neon-color] focus:ring-[--neon-color]"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                                Bewaar mijn gegevens
                            </label>
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 font-bold text-black bg-[--neon-color] rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin" /> : 'Inloggen'}
                    </button>
                </form>
            );
        }
        // Coach views
        return (
            <form onSubmit={(e) => { e.preventDefault(); handleCoachAuth(view === 'coachRegister'); }} className="space-y-4">
                <h2 className="text-2xl font-bold text-center mb-4" style={{ textShadow: `0 0 8px ${NEON_COLOR}` }}>
                    {view === 'coachLogin' ? 'COACH LOGIN' : 'COACH REGISTRATIE'}
                </h2>
                <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="coach@email.com" />
                <Input label="Wachtwoord" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                 {view === 'coachRegister' && (
                    <Input label="Kies een unieke Team ID" value={newTeamId} onChange={e => setNewTeamId(e.target.value)} placeholder="bv. VVC11-1" />
                )}
                {view === 'coachLogin' && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-coach"
                                name="remember-coach"
                                type="checkbox"
                                checked={rememberCoach}
                                onChange={(e) => setRememberCoach(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-[--neon-color] focus:ring-[--neon-color]"
                            />
                            <label htmlFor="remember-coach" className="ml-2 block text-sm text-gray-400">
                                Bewaar mijn e-mail
                            </label>
                        </div>
                    </div>
                )}
                <button type="submit" disabled={loading} className="w-full py-3 font-bold text-black bg-[--neon-color] rounded-lg hover:opacity-90 transition-opacity flex justify-center items-center disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" /> : (view === 'coachLogin' ? 'Inloggen' : 'Registreren')}
                </button>
            </form>
        );
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                <Card className="w-full max-w-sm">
                    <div className="flex border-b border-gray-700 mb-6">
                        <button onClick={() => setView('playerLogin')} className={`w-full py-3 font-medium ${view === 'playerLogin' ? 'text-[--neon-color]' : 'text-gray-400'}`}>Speler</button>
                        <button onClick={() => setView('coachLogin')} className={`w-full py-3 font-medium ${view.startsWith('coach') ? 'text-[--neon-color]' : 'text-gray-400'}`}>Coach</button>
                    </div>
                    {renderForm()}
                    {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
                    {view === 'coachLogin' && <p className="text-center text-sm mt-4 text-gray-400">Nog geen account? <button onClick={() => setView('coachRegister')} className="font-semibold text-[--neon-color] hover:underline">Registreer hier</button></p>}
                    {view === 'coachRegister' && <p className="text-center text-sm mt-4 text-gray-400">Al een account? <button onClick={() => setView('coachLogin')} className="font-semibold text-[--neon-color] hover:underline">Log hier in</button></p>}
                </Card>
            </motion.div>
        </div>
    );
};

const HomeworkCreatorModal = ({ isVisible, onClose, onSave, onAssign, customHomework }) => {
    const [activeTab, setActiveTab] = useState('maken');
    const [week, setWeek] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');

    const handleSuggestionClick = (suggestion) => {
        setTitle(suggestion.title);
        setDescription(suggestion.description);
    };

    const handleSave = () => {
        if (title && description) {
            onSave({ week, title, description, youtube_url: youtubeUrl });
            // Reset fields
            setWeek(''); setTitle(''); setDescription(''); setYoutubeUrl('');
            setActiveTab('toewijzen');
        } else {
            alert('Titel en omschrijving zijn verplicht.');
        }
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-lg shadow-black/50" onClick={e => e.stopPropagation()}>
                    <div className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2"><ClipboardList size={22} className="text-[--neon-color]" /> Huiswerk Manager</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors"><X size={20} /></button>
                    </div>
                    <div className="flex-shrink-0 p-2 bg-gray-800/50">
                        <div className="flex justify-center gap-2">
                            <button onClick={() => setActiveTab('maken')} className={`w-full py-2 rounded-md font-semibold transition-colors ${activeTab === 'maken' ? 'bg-[--neon-color] text-black' : 'hover:bg-gray-700'}`}>Huiswerk Maken</button>
                            <button onClick={() => setActiveTab('toewijzen')} className={`w-full py-2 rounded-md font-semibold transition-colors ${activeTab === 'toewijzen' ? 'bg-[--neon-color] text-black' : 'hover:bg-gray-700'}`}>Huiswerk Toewijzen</button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto p-6">
                        {activeTab === 'maken' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-lg font-bold mb-4">Nieuwe Huiswerkopdracht</h3>
                                    <div className="space-y-4">
                                        <Input label="Week (optioneel)" value={week} onChange={e => setWeek(e.target.value)} placeholder="bv. Week 5" />
                                        <Input label="Titel" value={title} onChange={e => setTitle(e.target.value)} placeholder="bv. Dribbel Challenge" />
                                        <Textarea label="Omschrijving" value={description} onChange={e => setDescription(e.target.value)} placeholder="Omschrijf de oefening..." />
                                        <Input label="YouTube Link (optioneel)" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="Plak hier een YouTube URL" />
                                        <button onClick={handleSave} className="w-full py-2 font-bold text-black bg-[--neon-color] rounded-lg hover:opacity-90 transition-opacity duration-200 flex items-center justify-center gap-2">
                                            <Plus size={18} /> Opdracht Opslaan
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Wand2 size={18} className="text-[--neon-color]" /> Suggesties</h3>
                                    <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
                                        {homeworkSuggestions.map((s, i) => (
                                            <button key={i} onClick={() => handleSuggestionClick(s)} className="w-full text-left p-3 bg-gray-800/70 rounded-lg hover:bg-gray-700/70 transition-colors">
                                                <p className="font-semibold text-white">{s.title}</p>
                                                <p className="text-sm text-gray-400 mt-1">{s.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'toewijzen' && (
                            <div>
                                <h3 className="text-lg font-bold mb-4">Beschikbare Huiswerkopdrachten</h3>
                                {customHomework.length > 0 ? (
                                    <div className="space-y-3">
                                        {customHomework.map(hw => (
                                            <div key={hw.id} className="p-3 bg-gray-800/50 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold">{hw.week && `${hw.week}: `}{hw.title}</p>
                                                    <p className="text-sm text-gray-400">{hw.description.substring(0, 50)}...</p>
                                                </div>
                                                <button onClick={() => onAssign([hw.id])} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-md transition-colors shrink-0 ml-4">Wijs toe</button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-400 text-center py-8">Je hebt nog geen eigen huiswerk gemaakt. Ga naar 'Huiswerk Maken' om te beginnen.</p>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const AddPlayerModal = ({ isVisible, onClose, onAdd, teamId }) => {
    const [playerName, setPlayerName] = useState('');
    const [newPlayerInfo, setNewPlayerInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Reset state when modal opens/closes
        setPlayerName('');
        setNewPlayerInfo(null);
        setLoading(false);
    }, [isVisible]);

    const handleAdd = async () => {
        if (!playerName.trim()) return;
        setLoading(true);
        const newPlayerData = await onAdd(playerName);
        setNewPlayerInfo({
            name: playerName,
            id: newPlayerData.id,
            pin: newPlayerData.pin
        });
        setLoading(false);
    };

    const handleCopy = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    };


    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-lg"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={e => e.stopPropagation()}
                    >
                        {!newPlayerInfo ? (
                             <>
                                <h3 className="text-lg font-bold text-white mb-4">Nieuwe Speler Toevoegen</h3>
                                <Input label="Naam van de speler" value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="bv. Johan Cruijff" />
                                <div className="flex justify-end gap-4 mt-6">
                                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors">Annuleren</button>
                                    <button onClick={handleAdd} disabled={loading} className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity flex items-center disabled:opacity-50">
                                         {loading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2" size={16}/>}
                                        Aanmaken
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><CheckCircle2 className="text-green-400"/>Speler Aangemaakt!</h3>
                                <p className="text-gray-400 mb-4">Deel de volgende inloggegevens met <strong className="text-white">{newPlayerInfo.name}</strong>:</p>
                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-800 rounded-lg">
                                        <p className="text-sm text-gray-400">Team ID</p>
                                        <div className="flex justify-between items-center">
                                            <strong className="text-white font-mono">{teamId}</strong>
                                            <button onClick={() => handleCopy(teamId)} className="p-1 hover:bg-gray-700 rounded-md"><Copy size={16}/></button>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-800 rounded-lg">
                                        <p className="text-sm text-gray-400">Pincode</p>
                                         <div className="flex justify-between items-center">
                                            <strong className="text-white font-mono">{newPlayerInfo.pin}</strong>
                                            <button onClick={() => handleCopy(newPlayerInfo.pin)} className="p-1 hover:bg-gray-700 rounded-md"><Copy size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-6">
                                      <button onClick={onClose} className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity">
                                        Sluiten
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const PlayerProfileModal = ({ isVisible, onClose, player, teamId, onSave }) => {
    const [age, setAge] = useState('');
    const [preferredFoot, setPreferredFoot] = useState('Rechts');
    const [position, setPosition] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (player) {
            setAge(player.age || '');
            setPreferredFoot(player.preferred_foot || 'Rechts');
            setPosition(player.position || '');
        }
    }, [player]);

    if (!isVisible || !player) return null;

    const handleSave = async () => {
        setLoading(true);
        await onSave(player.id, { age, preferred_foot: preferredFoot, position });
        setLoading(false);
        onClose();
    };
    
    const handleCopy = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    };

    return (
         <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-lg"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-white mb-4">Profiel van {player.name}</h3>
                        
                        <div className="space-y-4">
                            <Input label="Leeftijd" value={age} onChange={e => setAge(e.target.value)} placeholder="bv. 10" />
                            <Select label="Voorkeursbeen" value={preferredFoot} onChange={e => setPreferredFoot(e.target.value)}>
                                <option>Rechts</option>
                                <option>Links</option>
                                <option>Beide</option>
                            </Select>
                            <Input label="Positie" value={position} onChange={e => setPosition(e.target.value)} placeholder="bv. Spits" />
                        </div>

                        <h4 className="text-md font-bold text-white mt-6 mb-2">Inloggegevens</h4>
                         <div className="space-y-3">
                            <div className="p-3 bg-gray-800 rounded-lg">
                                <p className="text-sm text-gray-400">Team ID</p>
                                <div className="flex justify-between items-center">
                                    <strong className="text-white font-mono">{teamId}</strong>
                                    <button onClick={() => handleCopy(teamId)} className="p-1 hover:bg-gray-700 rounded-md"><Copy size={16}/></button>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-800 rounded-lg">
                                <p className="text-sm text-gray-400">Pincode</p>
                                    <div className="flex justify-between items-center">
                                    <strong className="text-white font-mono">{player.pin}</strong>
                                    <button onClick={() => handleCopy(player.pin)} className="p-1 hover:bg-gray-700 rounded-md"><Copy size={16}/></button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors">Sluiten</button>
                            <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity flex items-center disabled:opacity-50">
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                                Opslaan
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const PlayerHomeworkCard = ({ player, customHomework, assignedHomeworkIds, onToggleStatus }) => {
    const assignedTasks = customHomework.filter(hw => assignedHomeworkIds.includes(hw.id));

    if (assignedTasks.length === 0) {
        return (
            <Card>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ClipboardList size={20} className="text-[--neon-color]" /> Huiswerk</h3>
                <p className="text-gray-400">Er is momenteel geen huiswerk toegewezen.</p>
            </Card>
        );
    }

    return (
        <Card>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ClipboardList size={20} className="text-[--neon-color]" /> Jouw Huiswerk</h3>
            <div className="space-y-4">
                {assignedTasks.map(hw => {
                    const isCompleted = player.completed_homework_ids.includes(hw.id);
                    const embedUrl = getYoutubeEmbedUrl(hw.youtube_url);
                    return (
                        <div key={hw.id} className={`p-4 rounded-lg transition-all ${isCompleted ? 'bg-green-500/10 border-l-4 border-green-500' : 'bg-gray-800/50'}`}>
                            <div className="flex justify-between items-start flex-wrap gap-4">
                                <div>
                                    <h4 className="font-bold text-lg">{hw.week && `${hw.week}: `}{hw.title}</h4>
                                    <p className="mt-2 text-gray-300 max-w-prose">{hw.description}</p>
                                </div>
                                <button
                                    onClick={() => onToggleStatus(hw.id)}
                                    className={`shrink-0 flex items-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${isCompleted ? 'bg-green-500/80 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    <AnimatePresence>
                                        {isCompleted && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={16} /></motion.div>}
                                    </AnimatePresence>
                                    {isCompleted ? 'Voltooid!' : 'Markeer als voltooid'}
                                </button>
                            </div>
                            {embedUrl && (
                                <div className="mt-4 aspect-video rounded-lg overflow-hidden">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={embedUrl}
                                        title={hw.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

const TestsModal = ({ isVisible, onClose, player, period, onUpdate }) => {
    const [localTestData, setLocalTestData] = useState(initialTestState);

    useEffect(() => {
        if (isVisible && player && player.evaluations[period]?.tests) {
            setLocalTestData(JSON.parse(JSON.stringify(player.evaluations[period].tests)));
        } else if (isVisible) {
            setLocalTestData(JSON.parse(JSON.stringify(initialTestState)));
        }
    }, [player, period, isVisible]);

    if (!isVisible || !player) return null;

    const handleInputChange = (category, testKey, value) => {
        const newData = { ...localTestData, [category]: { ...localTestData[category], [testKey]: value } };
        setLocalTestData(newData);
        onUpdate(`tests.${category}.${testKey}`, value);
    };

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-lg shadow-black/50" onClick={e => e.stopPropagation()}>
                    <div className="sticky top-0 bg-gray-900/80 backdrop-blur-md p-4 border-b border-gray-700 flex justify-between items-center z-10">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FileText size={22} className="text-[--neon-color]" /> Testresultaten voor {player.name} ({period})
                        </h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors"><X size={20} /></button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(testLabels).map(([categoryKey, categoryData]) => (
                            <Card key={categoryKey}>
                                <h3 className="text-lg font-bold text-[--neon-color] mb-4">{categoryData.label}</h3>
                                <div className="space-y-4">
                                    {Object.entries(categoryData.tests).map(([testKey, testLabel]) => (
                                        <Input
                                            key={testKey}
                                            label={testLabel}
                                            value={localTestData[categoryKey]?.[testKey] || ''}
                                            onChange={(e) => handleInputChange(categoryKey, testKey, e.target.value)}
                                            placeholder="Score..."
                                        />
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </div>
                    <div className="p-4 border-t border-gray-700 flex justify-end">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity">
                            Sluiten
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const TestResultsCard = ({ player, period }) => {
    const testData = player.evaluations[period]?.tests || initialTestState;
    const hasResults = Object.values(testData).some(category => Object.values(category).some(value => value !== ''));

    return (
        <Card>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText size={20} className="text-[--neon-color]" />Testresultaten ({period})</h3>
            {!hasResults ? (
                <p className="text-gray-400">Nog geen testresultaten ingevoerd voor deze periode.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {Object.entries(testLabels).map(([categoryKey, categoryData]) => (
                        <div key={categoryKey}>
                            <h4 className="font-semibold text-gray-300 mb-2">{categoryData.label}</h4>
                            <ul className="space-y-1 text-sm">
                                {Object.entries(categoryData.tests).map(([testKey, testLabel]) => {
                                    const value = testData[categoryKey]?.[testKey];
                                    return value ? (
                                        <li key={testKey} className="flex justify-between">
                                            <span className="text-gray-400">{testLabel.split(' (')[0]}:</span>
                                            <span className="font-bold text-white">{value}</span>
                                        </li>
                                    ) : null;
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

const CoachProfileModal = ({ isVisible, onClose, teamData, onSave }) => {
    const [teamName, setTeamName] = useState('');
    const [teamClass, setTeamClass] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (teamData) {
            setTeamName(teamData.team_name || '');
            setTeamClass(teamData.team_class || '');
        }
    }, [teamData, isVisible]);

    if (!isVisible) return null;

    const handleSave = async () => {
        setLoading(true);
        await onSave({ team_name: teamName, team_class: teamClass });
        setLoading(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-lg"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-white mb-4">Coach / Team Profiel</h3>
                        
                        <div className="space-y-4">
                            <Input label="Teamnaam" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Naam van je team" />
                            <Input label="Klasse" value={teamClass} onChange={e => setTeamClass(e.target.value)} placeholder="bv. JO11-2" />
                        </div>

                        <div className="flex justify-end gap-4 mt-6">
                            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors">Sluiten</button>
                            <button onClick={handleSave} disabled={loading} className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity flex items-center disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                                Opslaan
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};


// --- DASHBOARD COMPONENT (Main UI after login) ---
const Dashboard = ({ user, userData, onPlayerLogout }) => {
    const [players, setPlayers] = useState([]);
    const [customHomework, setCustomHomework] = useState([]);
    const [teamData, setTeamData] = useState({});
    const [activePlayerId, setActivePlayerId] = useState(null);
    const [activeTab, setActiveTab] = useState(evaluationPeriods[0]);
    const [isHomeworkVisible, setIsHomeworkVisible] = useState(false);
    const [isTestsVisible, setIsTestsVisible] = useState(false);
    const [confirmAssign, setConfirmAssign] = useState({ isVisible: false, homeworkIds: null });
    const [confirmRemove, setConfirmRemove] = useState({ isVisible: false, playerId: null });
    const [isGenerating, setIsGenerating] = useState({ plan: false, comments: false });
    const [copied, setCopied] = useState(false);
    const [isAddPlayerVisible, setIsAddPlayerVisible] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [isCoachProfileVisible, setIsCoachProfileVisible] = useState(false);
    const [questionDrafts, setQuestionDrafts] = useState(['', '', '']);
    const [responseDrafts, setResponseDrafts] = useState(['', '', '']);
    const [savingQuestions, setSavingQuestions] = useState(false);
    const [savingResponses, setSavingResponses] = useState(false);
    const [questionFeedback, setQuestionFeedback] = useState('');
    const [responseFeedback, setResponseFeedback] = useState('');
    const [mobileSection, setMobileSection] = useState(() => userData.role === 'coach' ? 'players' : 'profiel');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


    useEffect(() => {
        if (!userData.teamId) return;

        // Fetch initial data
        const fetchData = async () => {
            const { data: playersData } = await supabase.from('players').select('*').eq('team_id', userData.teamId);
            const { data: teamRecord } = await supabase.from('teams').select('*').eq('id', userData.teamId).single();
            const { data: homeworkData } = await supabase.from('custom_homework').select('*').eq('team_id', userData.teamId);

            const normalizedPlayers = (playersData || []).map(player => ({
                ...player,
                weekly_question_responses: Array.from({ length: 3 }, (_, idx) => player.weekly_question_responses?.[idx] || '')
            }));
            const baseQuestions = Array.isArray(teamRecord?.weekly_questions) && teamRecord.weekly_questions.length > 0
                ? teamRecord.weekly_questions
                : DEFAULT_WEEKLY_QUESTIONS;
            const normalizedTeam = teamRecord ? {
                ...teamRecord,
                weekly_questions: Array.from({ length: 3 }, (_, idx) => baseQuestions[idx] || '')
            } : { weekly_questions: DEFAULT_WEEKLY_QUESTIONS.slice() };

            setPlayers(normalizedPlayers);
            setTeamData(normalizedTeam);
            setCustomHomework(homeworkData || []);

            if (userData.role === 'coach' && normalizedPlayers.length > 0) {
                setActivePlayerId(normalizedPlayers[0].id);
            } else if (userData.role === 'player') {
                setActivePlayerId(user.id);
            }
        };

        fetchData();

        // Set up subscriptions
        supabase.channel(`public:players:team_id=eq.${userData.teamId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => fetchData())
            .subscribe();

        supabase.channel(`public:teams:id=eq.${userData.teamId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'teams' }, payload => setTeamData(payload.new))
            .subscribe();

        supabase.channel(`public:custom_homework:team_id=eq.${userData.teamId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_homework' }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeAllChannels();
        };
    }, [userData, user.uid]);

    const activePlayer = useMemo(() => {
        if (userData.role === 'player') {
            return players.find(p => p.id === user.id);
        }
        return players.find(p => p.id === activePlayerId);
    }, [players, activePlayerId, user.uid, userData.role]);

    const normalizedQuestions = useMemo(() => Array.from({ length: 3 }, (_, idx) => teamData?.weekly_questions?.[idx] || ''), [teamData?.weekly_questions]);
    const visibleQuestions = useMemo(() => normalizedQuestions
        .map((text, idx) => ({ text, idx }))
        .filter(({ text }) => text.trim()), [normalizedQuestions]);

    useEffect(() => {
        setQuestionDrafts(normalizedQuestions);
    }, [normalizedQuestions]);

    const normalizedResponses = useMemo(() => Array.from({ length: 3 }, (_, idx) => activePlayer?.weekly_question_responses?.[idx] || ''), [activePlayer?.weekly_question_responses]);

    useEffect(() => {
        setResponseDrafts(normalizedResponses);
    }, [normalizedResponses]);
    
    const handleAddPlayer = async (playerName) => {
        let newPin;
        let isUnique = false;
        while (!isUnique) {
            newPin = Math.floor(1000 + Math.random() * 9000).toString();
            const { data } = await supabase.from('players').select('id').eq('team_id', userData.teamId).eq('pin', newPin);
            isUnique = !data || data.length === 0;
        }

        const newPlayer = {
            name: playerName,
            team_id: userData.teamId,
            age: '',
            preferred_foot: 'Rechts',
            position: '',
            pin: newPin,
            avatar_url: `https://placehold.co/128x128/1A1A1A/FFFFFF?text=${playerName.substring(0,2).toUpperCase()}`,
            evaluations: {
                'Check-in 1': { skills: { snelheid: 5, passing: 5, techniek: 5, schot: 5, verdedigen: 5, inzicht: 5, mentaliteit: 5 }, matchRating: 5, comments: '', fitness: { yoyo: '', cooper: '', sprint: '' }, trainingPlan: '', tests: JSON.parse(JSON.stringify(initialTestState)) },
                'Check-in 2': { skills: { snelheid: 5, passing: 5, techniek: 5, schot: 5, verdedigen: 5, inzicht: 5, mentaliteit: 5 }, matchRating: 5, comments: '', fitness: { yoyo: '', cooper: '', sprint: '' }, trainingPlan: '', tests: JSON.parse(JSON.stringify(initialTestState)) },
                'Check-in 3': { skills: { snelheid: 5, passing: 5, techniek: 5, schot: 5, verdedigen: 5, inzicht: 5, mentaliteit: 5 }, matchRating: 5, comments: '', fitness: { yoyo: '', cooper: '', sprint: '' }, trainingPlan: '', tests: JSON.parse(JSON.stringify(initialTestState)) }
            },
            completed_homework_ids: [],
            weekly_question_responses: ['', '', '']
        };
        
        const { data, error } = await supabase.from('players').insert(newPlayer).select().single();
        if (error) throw error;
        
        return { id: data.id, pin: newPin };
    };

    const handleSaveProfile = async (playerId, profileData) => {
        await supabase.from('players').update(profileData).eq('id', playerId);
    };
    
    const handleSaveCoachProfile = async (coachProfileData) => {
        await supabase.from('teams').update(coachProfileData).eq('id', userData.teamId);
    };

    const handleSaveTeamQuestions = async () => {
        setQuestionFeedback('');
        const normalized = Array.from({ length: 3 }, (_, idx) => (questionDrafts[idx] || '').trim());
        setSavingQuestions(true);
        try {
            const { error } = await supabase.from('teams').update({ weekly_questions: normalized }).eq('id', userData.teamId);
            if (error) throw error;

            setTeamData(prev => ({ ...prev, weekly_questions: normalized }));

            const emptyResponses = normalized.map(() => '');
            const { error: playersError } = await supabase.from('players').update({ weekly_question_responses: emptyResponses }).eq('team_id', userData.teamId);
            if (!playersError) {
                setPlayers(prev => prev.map(player => ({ ...player, weekly_question_responses: emptyResponses.slice() })));
                setQuestionFeedback('Vragen opgeslagen en gedeeld met het team.');
            } else {
                console.error('Error resetting player responses:', playersError);
                setQuestionFeedback('Vragen opgeslagen, maar antwoorden konden niet worden gereset.');
            }
        } catch (err) {
            console.error('Error saving team questions:', err);
            setQuestionFeedback('Opslaan van vragen is mislukt.');
        } finally {
            setSavingQuestions(false);
        }
    };

    const handleSaveQuestionResponses = async () => {
        if (!activePlayer) return;
        setResponseFeedback('');
        const normalized = responseDrafts.map(answer => answer.trim());
        setSavingResponses(true);
        try {
            const { error } = await supabase.from('players').update({ weekly_question_responses: normalized }).eq('id', activePlayer.id);
            if (error) throw error;

            setPlayers(prev => prev.map(player => player.id === activePlayer.id ? { ...player, weekly_question_responses: normalized } : player));
            setResponseDrafts(normalized);
            setResponseFeedback('Antwoorden opgeslagen.');
        } catch (err) {
            console.error('Error saving question responses:', err);
            setResponseFeedback('Opslaan van antwoorden is mislukt.');
        } finally {
            setSavingResponses(false);
        }
    };
    
    const handleUpdateEvaluation = async (field, value) => {
        if (userData.role !== 'coach' || !activePlayer) return;
        
        const newEvaluations = JSON.parse(JSON.stringify(activePlayer.evaluations));
        const path = field.split('.');
        
        let currentLevel = newEvaluations[activeTab];
        for (let i = 0; i < path.length - 1; i++) {
          if (!currentLevel[path[i]]) {
            currentLevel[path[i]] = {};
          }
          currentLevel = currentLevel[path[i]];
        }
        currentLevel[path[path.length - 1]] = value;

        const { error } = await supabase
            .from('players')
            .update({ evaluations: newEvaluations })
            .eq('id', activePlayer.id);
        
        if (error) {
            console.error("Error updating evaluation:", error);
        }
    };

    const handleSaveHomework = async (newHomework) => {
        await supabase.from('custom_homework').insert({ ...newHomework, team_id: userData.teamId });
    };

    const handleAssignHomework = (homeworkIds) => {
        setConfirmAssign({ isVisible: true, homeworkIds });
    };

    const executeAssignHomework = async () => {
        const { homeworkIds } = confirmAssign;
        if (!homeworkIds) return;

        await supabase.from('teams').update({ assigned_homework_ids: homeworkIds }).eq('id', userData.teamId);

        for (const player of players) {
            const newCompletedIds = player.completed_homework_ids.filter(id => homeworkIds.includes(id));
            await supabase.from('players').update({ completed_homework_ids: newCompletedIds }).eq('id', player.id);
        }

        setConfirmAssign({ isVisible: false, homeworkIds: null });
        setIsHomeworkVisible(false);
    };

    const handleToggleHomeworkStatus = async (homeworkId) => {
        if (userData.role !== 'player' || !activePlayer) return;

        const isCompleted = activePlayer.completed_homework_ids.includes(homeworkId);
        const newCompletedIds = isCompleted
            ? activePlayer.completed_homework_ids.filter(id => id !== homeworkId)
            : [...activePlayer.completed_homework_ids, homeworkId];
        
        await supabase.from('players').update({ completed_homework_ids: newCompletedIds }).eq('id', user.uid);
    };
    
    const handleRemovePlayer = (id) => {
        setConfirmRemove({ isVisible: true, playerId: id });
    };

    const executeRemovePlayer = async () => {
        const { playerId } = confirmRemove;
        if (!playerId) return;

        await supabase.from('players').delete().eq('id', playerId);
        setConfirmRemove({ isVisible: false, playerId: null });
    };
    
    const handleCopyTeamId = () => {
        const textArea = document.createElement("textarea");
        textArea.value = userData.teamId;
        textArea.style.position = "fixed";  // Avoid scrolling to bottom
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
    };

    const handleGenerateComments = async () => {
        if (!activePlayer) return;
        setIsGenerating(prev => ({ ...prev, comments: true }));
        const currentEval = activePlayer.evaluations[activeTab];
        const skills = currentEval.skills;
        const sortedSkills = Object.entries(skills).sort(([, a], [, b]) => b - a);
        const topSkills = sortedSkills.slice(0, 2).map(s => s[0]).join(', ');
        const bottomSkills = sortedSkills.slice(-2).map(s => s[0]).join(', ');

        const prompt = `Schrijf een korte, bemoedigende feedback-opmerking in het Nederlands voor een jonge voetballer (7-12 jaar). Het wedstrijdcijfer was ${currentEval.matchRating}/10. De beste skills zijn: ${topSkills}. De skills die verbetering nodig hebben zijn: ${bottomSkills}. Begin met een compliment over de sterke punten en geef dan op een vriendelijke en constructieve manier één tip voor een verbeterpunt. Houd het onder de 40 woorden.`;

        const result = await callGeminiAPI(prompt);
        handleUpdateEvaluation('comments', result);
        setIsGenerating(prev => ({ ...prev, comments: false }));
    };

    const handleGeneratePlan = async () => {
        if (!activePlayer) return;
        setIsGenerating(prev => ({ ...prev, plan: true }));
        const currentEval = activePlayer.evaluations[activeTab];
        const skills = currentEval.skills;
        const sortedSkills = Object.entries(skills).sort(([, a], [, b]) => b - a);
        const topSkills = sortedSkills.slice(0, 2).map(s => s[0]).join(', ');
        const bottomSkills = sortedSkills.slice(-2).map(s => s[0]).join(', ');

        const prompt = `Genereer een beknopt, positief en motiverend persoonlijk trainingsplan in het Nederlands voor een jonge voetballer (7-12 jaar). Focus op het verbeteren van zwakke punten en benutten van sterke punten. Sterke punten: ${topSkills}. Zwakke punten: ${bottomSkills}. Coach opmerkingen: "${currentEval.comments}". Het plan moet bestaan uit 2-3 leuke, uitvoerbare oefeningen voor thuis. Formatteer het als een lijst met koppeltekens.`;

        const result = await callGeminiAPI(prompt);
        handleUpdateEvaluation('trainingPlan', result);
        setIsGenerating(prev => ({ ...prev, plan: false }));
    };


    const radarChartData = useMemo(() => {
        if (!activePlayer) return [];
        const currentSkills = activePlayer.evaluations[activeTab].skills;
        return skillKeys.map(key => ({ subject: key.charAt(0).toUpperCase() + key.slice(1), value: currentSkills[key], fullMark: 10 }));
    }, [activePlayer, activeTab]);

    const lineChartData = useMemo(() => {
        if (!activePlayer) return [];
        return evaluationPeriods.map(period => {
            const evalData = activePlayer.evaluations[period];
            const skillAverage = skillKeys.reduce((sum, key) => sum + (evalData.skills[key] || 0), 0) / skillKeys.length;
            return { name: period, 'Gem. Skill': parseFloat(skillAverage.toFixed(1)), 'Wedstrijdcijfer': evalData.matchRating };
        });
    }, [activePlayer]);


    if (!activePlayer && userData.role === 'player') {
         return (
             <div className="flex flex-col items-center justify-center min-h-screen text-center">
                 <Loader2 className="animate-spin h-12 w-12 text-[--neon-color] mb-4"/>
                 <h2 className="text-2xl font-bold">Laden van spelerdata...</h2>
                 <p className="text-gray-400">Een ogenblik geduld.</p>
             </div>
         );
    }
    
    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 pb-24 sm:pb-0">
            <HomeworkCreatorModal isVisible={isHomeworkVisible} onClose={() => setIsHomeworkVisible(false)} onSave={handleSaveHomework} onAssign={handleAssignHomework} customHomework={customHomework} />
            <TestsModal isVisible={isTestsVisible} onClose={() => setIsTestsVisible(false)} player={activePlayer} period={activeTab} onUpdate={handleUpdateEvaluation} />
            <AddPlayerModal isVisible={isAddPlayerVisible} onClose={() => setIsAddPlayerVisible(false)} onAdd={handleAddPlayer} teamId={userData.teamId} />
            <PlayerProfileModal isVisible={!!editingPlayer} onClose={() => setEditingPlayer(null)} player={editingPlayer} teamId={userData.teamId} onSave={handleSaveProfile} />
            <CoachProfileModal isVisible={isCoachProfileVisible} onClose={() => setIsCoachProfileVisible(false)} teamData={teamData} onSave={handleSaveCoachProfile} />

            <ConfirmModal isVisible={confirmAssign.isVisible} onClose={() => setConfirmAssign({ isVisible: false, homeworkId: null })} onConfirm={executeAssignHomework} title="Huiswerk Toewijzen">
                Weet je zeker dat je deze opdracht wilt toewijzen? Dit zal de huidige huiswerkopdracht voor het team vervangen.
            </ConfirmModal>
            <ConfirmModal isVisible={confirmRemove.isVisible} onClose={() => setConfirmRemove({ isVisible: false, playerId: null })} onConfirm={executeRemovePlayer} title="Speler Verwijderen">
                Weet je zeker dat je deze speler wilt verwijderen?
            </ConfirmModal>

            <AnimatePresence>
                {mobileMenuOpen && userData.role === 'coach' && (
                    <motion.div className="fixed inset-0 z-50 sm:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)}>
                        <motion.div
                            className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl border-t border-gray-800 p-6"
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}
                            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
                        >
                            <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-6" />
                            <h3 className="text-lg font-bold mb-4 text-white">Team Beheer</h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-4 bg-gray-800/80 rounded-2xl">
                                    <span className="text-gray-400 text-sm">Team ID</span>
                                    <div className="flex items-center gap-3">
                                        <strong className="text-white font-mono">{userData.teamId}</strong>
                                        <button onClick={handleCopyTeamId} className="p-2 hover:bg-gray-700 rounded-xl active:scale-95 transition-transform">
                                            {copied ? <CheckCircle2 size={18} className="text-green-400"/> : <Copy size={18}/>}
                                        </button>
                                    </div>
                                </div>
                                <button onClick={() => { setIsAddPlayerVisible(true); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 bg-gray-800/80 hover:bg-gray-700/80 rounded-2xl text-left transition-colors active:scale-[0.98]">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${NEON_COLOR}20` }}><Plus size={20} style={{ color: NEON_COLOR }}/></div>
                                    <span className="font-medium">Speler Toevoegen</span>
                                </button>
                                <button onClick={() => { setIsHomeworkVisible(true); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 bg-gray-800/80 hover:bg-gray-700/80 rounded-2xl text-left transition-colors active:scale-[0.98]">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${NEON_COLOR}20` }}><ClipboardList size={20} style={{ color: NEON_COLOR }}/></div>
                                    <span className="font-medium">Huiswerk Manager</span>
                                </button>
                                <button onClick={() => { setIsCoachProfileVisible(true); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 bg-gray-800/80 hover:bg-gray-700/80 rounded-2xl text-left transition-colors active:scale-[0.98]">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${NEON_COLOR}20` }}><Edit size={20} style={{ color: NEON_COLOR }}/></div>
                                    <span className="font-medium">Team Profiel</span>
                                </button>
                                <button onClick={async () => { const { error } = await supabase.auth.signOut(); if(error) console.error(error); setMobileMenuOpen(false); }} className="w-full flex items-center gap-4 p-4 bg-red-950/50 hover:bg-red-900/40 rounded-2xl text-left transition-colors active:scale-[0.98]">
                                    <div className="w-10 h-10 rounded-xl bg-red-900/40 flex items-center justify-center"><LogOut size={20} className="text-red-400"/></div>
                                    <span className="font-medium text-red-400">Uitloggen</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-wider" style={{ textShadow: `0 0 8px ${NEON_COLOR}` }}>{teamData.team_name || 'Skillkaart'}</h1>
                    {userData.role === 'coach' && (
                        <button onClick={() => setIsCoachProfileVisible(true)} className="hidden sm:flex text-gray-400 hover:text-white transition-colors p-1">
                            <Edit size={18}/>
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {userData.role === 'coach' && (
                        <div className="hidden sm:flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2 text-sm p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                               <span className="text-gray-400">Team ID:</span>
                               <strong className="text-white">{userData.teamId}</strong>
                               <button onClick={handleCopyTeamId} className="p-1 hover:bg-gray-700 rounded-md">
                                   {copied ? <CheckCircle2 size={16} className="text-green-400"/> : <Copy size={16} />}
                               </button>
                            </div>
                            <ToolButton onClick={() => setIsAddPlayerVisible(true)}><Plus size={16}/> Speler Toevoegen</ToolButton>
                            <ToolButton onClick={() => setIsHomeworkVisible(true)}><ClipboardList size={16}/> Huiswerk</ToolButton>
                            <ToolButton onClick={async () => { const { error } = await supabase.auth.signOut(); if(error) console.error("Error signing out:", error); }}><LogOut size={16} /> Uitloggen</ToolButton>
                        </div>
                    )}
                    {userData.role === 'player' && (
                        <ToolButton className="hidden sm:flex" onClick={onPlayerLogout}><LogOut size={16} /> Uitloggen</ToolButton>
                    )}
                    {userData.role === 'coach' ? (
                        <button onClick={() => setMobileMenuOpen(true)} className="sm:hidden p-2.5 rounded-xl bg-gray-800/80 border border-gray-700 active:scale-95 transition-transform">
                            <Menu size={22}/>
                        </button>
                    ) : (
                        <button onClick={onPlayerLogout} className="sm:hidden p-2.5 rounded-xl bg-gray-800/80 border border-gray-700 active:scale-95 transition-transform text-gray-300">
                            <LogOut size={22}/>
                        </button>
                    )}
                </div>
            </header>

            {(userData.role === 'coach' || visibleQuestions.length > 0) && (
                <motion.div className={`mb-6 ${mobileSection === 'questions' ? '' : 'hidden'} sm:block`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <Card>
                        {userData.role === 'coach' ? (
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <h3 className="text-xl font-bold flex items-center gap-2"><ListPlus size={20} className="text-[--neon-color]" /> Team Reflectievragen</h3>
                                    <p className="text-sm text-gray-400">Stel tot drie vragen voor je spelers.</p>
                                </div>
                                <div className="mt-4 space-y-4">
                                    {questionDrafts.map((value, idx) => (
                                        <Textarea
                                            key={`coach-question-${idx}`}
                                            label={`Vraag ${idx + 1}`}
                                            value={value}
                                            onChange={(e) => {
                                                const updated = [...questionDrafts];
                                                updated[idx] = e.target.value;
                                                setQuestionDrafts(updated);
                                                setQuestionFeedback('');
                                            }}
                                            placeholder="Typ de vraag die je wilt stellen..."
                                        />
                                    ))}
                                </div>
                                <div className="mt-4 flex flex-wrap justify-end gap-3">
                                    <button onClick={() => setQuestionDrafts(['', '', ''])} className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors">Reset</button>
                                    <button onClick={handleSaveTeamQuestions} disabled={savingQuestions} className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity flex items-center disabled:opacity-50">
                                        {savingQuestions ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                                        Vragen opslaan
                                    </button>
                                </div>
                                {questionFeedback && <p className="text-sm text-gray-400 mt-2">{questionFeedback}</p>}
                                <div className="mt-6 border-t border-gray-800 pt-4">
                                    <h4 className="font-semibold text-gray-300 mb-3">Antwoorden per speler</h4>
                                    {!players.length ? (
                                        <p className="text-sm text-gray-500">Nog geen spelers toegevoegd.</p>
                                    ) : !activePlayer ? (
                                        <p className="text-sm text-gray-500">Selecteer een speler om antwoorden te bekijken.</p>
                                    ) : !visibleQuestions.length ? (
                                        <p className="text-sm text-gray-500">Stel eerst vragen om antwoorden te verzamelen.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {visibleQuestions.map(({ text, idx }) => (
                                                <div key={`coach-answer-${idx}`} className="p-3 rounded-lg bg-gray-800/40">
                                                    <p className="text-sm text-gray-400">Vraag {idx + 1}</p>
                                                    <p className="text-white font-medium mt-1">{text}</p>
                                                    <p className="mt-2 text-sm text-gray-300">
                                                        {activePlayer.weekly_question_responses?.[idx]?.trim()
                                                            ? activePlayer.weekly_question_responses[idx]
                                                            : <span className="text-gray-500 italic">Nog geen antwoord</span>}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <h3 className="text-xl font-bold flex items-center gap-2"><ShieldCheck size={20} className="text-[--neon-color]" /> Coach Vragen</h3>
                                    <p className="text-sm text-gray-400">Beantwoord de vragen van je coach.</p>
                                </div>
                                {!visibleQuestions.length ? (
                                    <p className="text-gray-400 mt-4">Je coach heeft deze week nog geen vragen gedeeld.</p>
                                ) : (
                                    <div className="mt-4 space-y-5">
                                        {visibleQuestions.map(({ text, idx }) => (
                                            <div key={`player-question-${idx}`} className="space-y-2">
                                                <p className="text-sm font-semibold text-[--neon-color] uppercase tracking-wide">Vraag {idx + 1}</p>
                                                <p className="text-base text-white leading-relaxed">{text}</p>
                                                <Textarea
                                                    label="Jouw antwoord"
                                                    value={responseDrafts[idx]}
                                                    onChange={(e) => {
                                                        const updated = [...responseDrafts];
                                                        updated[idx] = e.target.value;
                                                        setResponseDrafts(updated);
                                                        setResponseFeedback('');
                                                    }}
                                                    placeholder="Schrijf hier je antwoord..."
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {visibleQuestions.length > 0 && (
                                    <div className="mt-4 flex justify-end">
                                        <button onClick={handleSaveQuestionResponses} disabled={savingResponses} className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity flex items-center disabled:opacity-50">
                                            {savingResponses ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                                            Verstuur antwoorden
                                        </button>
                                    </div>
                                )}
                                {responseFeedback && <p className="text-sm text-gray-400 mt-2">{responseFeedback}</p>}
                            </div>
                        )}
                    </Card>
                </motion.div>
            )}

            <div className={(userData.role === 'coach' ? mobileSection === 'players' : mobileSection === 'profiel') ? '' : 'hidden sm:block'}>
            {userData.role === 'coach' && (
                 <div className="mb-6"><div className="flex gap-3 pb-3 overflow-x-auto">
                    {players.map(player => {
                        const assignedCount = teamData.assigned_homework_ids?.length || 0;
                        const completedCount = player.completed_homework_ids?.filter(id => teamData.assigned_homework_ids?.includes(id)).length || 0;
                        return (
                            <motion.div key={player.id} role="button" tabIndex="0" onClick={() => setActivePlayerId(player.id)} onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') setActivePlayerId(player.id); }} className={`relative shrink-0 flex flex-col items-start gap-2 p-3 rounded-lg transition-all duration-200 border cursor-pointer ${activePlayerId === player.id ? `border-[${NEON_COLOR}] bg-gray-800/80` : 'border-gray-700 bg-gray-900/60 hover:bg-gray-800/60'}`} whileHover={{ y: -2 }}>
                                <div className="flex items-center gap-3">
                                    <img src={player.avatar_url} alt={player.name} className="w-10 h-10 rounded-full" />
                                    <span className="font-medium whitespace-nowrap">{player.name}</span>
                                </div>
                                {assignedCount > 0 && (
                                    <div className="text-xs text-gray-400 flex items-center gap-1.5 pl-1">
                                        <CheckCircle2 size={14} className={completedCount === assignedCount ? 'text-green-400' : 'text-gray-600'} />
                                        Huiswerk: {completedCount}/{assignedCount}
                                    </div>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); setEditingPlayer(player) }} className="absolute -top-2 -left-2 p-1 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-transform duration-200 hover:scale-110" aria-label="Profiel bewerken"><User size={12} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleRemovePlayer(player.id); }} className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-500 transition-transform duration-200 hover:scale-110" aria-label="Verwijder speler"><Trash2 size={12} /></button>
                            </motion.div>
                        )
                    })}
                    {players.length === 0 && (<div className="text-center w-full py-8 border-2 border-dashed border-gray-700 rounded-lg"><p className="text-gray-400">Nog geen spelers in je team.</p><p className="text-gray-500">Voeg een speler toe om te beginnen.</p></div>)}
                </div></div>
            )}
            
            {activePlayer ? (
                 <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {userData.role === 'player' && (
                        <motion.div className="lg:col-span-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <PlayerHomeworkCard player={activePlayer} customHomework={customHomework} assignedHomeworkIds={teamData.assigned_homework_ids || []} onToggleStatus={handleToggleHomeworkStatus} />
                        </motion.div>
                    )}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <Card className="h-full">
                                <div className="flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <img src={activePlayer.avatar_url} alt={activePlayer.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2" style={{borderColor: NEON_COLOR}}/>
                                    <div className="absolute -bottom-2 right-0 bg-gray-900 px-4 py-1 rounded-full border" style={{borderColor: NEON_COLOR, color: NEON_COLOR}}>
                                    <span className="text-2xl font-black">{Math.round(radarChartData.reduce((sum, skill) => sum + skill.value, 0) / skillKeys.length * 10)}</span>
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold">{activePlayer.name}</h2>
                                </div>
                                <div className="h-64 sm:h-80 mt-4">
                                <ResponsiveContainer width="100%" height="100%"><RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}><PolarGrid stroke="#4A5568" /><PolarAngleAxis dataKey="subject" tick={{ fill: 'white', fontSize: 12 }} /><PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} /><Radar name={activePlayer.name} dataKey="value" stroke={NEON_COLOR} fill={NEON_COLOR} fillOpacity={0.6} /></RadarChart></ResponsiveContainer>
                                </div>
                            </Card>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                            <TestResultsCard player={activePlayer} period={activeTab} />
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                            <Card>
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><BarChart2 size={20} className="text-[--neon-color]"/>Prestatie Trend</h3>
                                <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%"><LineChart data={lineChartData}><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><XAxis dataKey="name" stroke="#A0AEC0" /><YAxis domain={[0, 10]} stroke="#A0AEC0" /><Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} /><Legend /><Line type="monotone" dataKey="Gem. Skill" stroke={NEON_COLOR} strokeWidth={2} /><Line type="monotone" dataKey="Wedstrijdcijfer" stroke="#8884d8" strokeWidth={2} /></LineChart></ResponsiveContainer>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                    <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                        <Card>
                            <div className="flex justify-between items-center border-b border-gray-700 mb-4">
                                <div className="flex">
                                    {evaluationPeriods.map(period => (
                                    <button key={period} onClick={() => setActiveTab(period)} className={`px-4 py-3 text-sm sm:text-base font-medium transition-colors duration-200 relative ${activeTab === period ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                                        {period}
                                        {activeTab === period && (<motion.div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[--neon-color]" layoutId="underline" transition={{ type: 'spring', stiffness: 300, damping: 30 }}/>)}
                                    </button>
                                    ))}
                                </div>
                                {userData.role === 'coach' && (
                                    <ToolButton onClick={() => setIsTestsVisible(true)}>
                                        <FileText size={16}/> Testen Afnemen
                                    </ToolButton>
                                )}
                            </div>
                            <AnimatePresence mode="wait"><motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                    {skillKeys.map(key => (<Slider key={key} label={key} value={activePlayer.evaluations[activeTab]?.skills[key] || 5} onChange={e => handleUpdateEvaluation(`skills.${key}`, parseInt(e.target.value))} disabled={userData.role !== 'coach'} />))}
                                    </div>
                                    <hr className="md:col-span-2 border-gray-700" />
                                    <div className="space-y-6">
                                        <Input label="Wedstrijdcijfer (0-10)" type="number" value={activePlayer.evaluations[activeTab]?.matchRating || ''} onChange={e => handleUpdateEvaluation('matchRating', parseFloat(e.target.value))} disabled={userData.role !== 'coach'} />
                                        <Textarea label="Opmerkingen Coach" placeholder="Sterke punten, verbeterpunten..." value={activePlayer.evaluations[activeTab]?.comments || ''} onChange={e => handleUpdateEvaluation('comments', e.target.value)} disabled={userData.role !== 'coach'}>
                                            {userData.role === 'coach' && (
                                                <button onClick={handleGenerateComments} disabled={isGenerating.comments} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50">
                                                    {isGenerating.comments ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} className="text-[--neon-color]" />}
                                                    ✨ Genereer
                                                </button>
                                            )}
                                        </Textarea>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Conditietests (Wedstrijd)</label>
                                            <div className="space-y-2">
                                            <Input label="" placeholder="YoYo Test" value={activePlayer.evaluations[activeTab]?.fitness.yoyo || ''} onChange={e => handleUpdateEvaluation('fitness.yoyo', e.target.value)} disabled={userData.role !== 'coach'} />
                                            <Input label="" placeholder="Coopertest" value={activePlayer.evaluations[activeTab]?.fitness.cooper || ''} onChange={e => handleUpdateEvaluation('fitness.cooper', e.target.value)} disabled={userData.role !== 'coach'} />
                                            <Input label="" placeholder="Sprint 30m" value={activePlayer.evaluations[activeTab]?.fitness.sprint || ''} onChange={e => handleUpdateEvaluation('fitness.sprint', e.target.value)} disabled={userData.role !== 'coach'} />
                                            </div>
                                        </div>
                                        <Textarea label="Persoonlijk Oefenplan" placeholder="Specifieke oefeningen voor deze speler..." value={activePlayer.evaluations[activeTab]?.trainingPlan || ''} onChange={e => handleUpdateEvaluation('trainingPlan', e.target.value)} disabled={userData.role !== 'coach'}>
                                            {userData.role === 'coach' && (
                                                <button onClick={handleGeneratePlan} disabled={isGenerating.plan} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50">
                                                    {isGenerating.plan ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} className="text-[--neon-color]" />}
                                                    ✨ Genereer
                                                </button>
                                            )}
                                        </Textarea>
                                    </div>
                                </div>
                            </motion.div></AnimatePresence>
                        </Card>
                    </motion.div>
                </main>
            ) : (
                <div className="text-center py-20">
                    <User size={64} className="mx-auto text-gray-600 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-400">Welkom!</h2>
                    <p className="text-gray-500 mt-2">{userData.role === 'player' ? 'Jouw data wordt geladen...' : 'Selecteer een speler om te beginnen of wacht tot spelers zich aanmelden.'}</p>
                </div>
            )}
            </div>

            <nav
                className="fixed bottom-0 left-0 right-0 sm:hidden z-30"
                style={{
                    background: 'rgba(9,11,15,0.97)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                <div className="flex">
                    {userData.role === 'coach' ? (
                        <>
                            <button onClick={() => setMobileSection('players')} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70 transition-opacity" style={{ color: mobileSection === 'players' ? NEON_COLOR : '#6b7280' }}>
                                <UserSquare size={24}/>
                                <span className="text-[10px] font-semibold tracking-wider uppercase">Spelers</span>
                            </button>
                            <button onClick={() => setMobileSection('questions')} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70 transition-opacity" style={{ color: mobileSection === 'questions' ? NEON_COLOR : '#6b7280' }}>
                                <ListPlus size={24}/>
                                <span className="text-[10px] font-semibold tracking-wider uppercase">Vragen</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setMobileSection('profiel')} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70 transition-opacity" style={{ color: mobileSection === 'profiel' ? NEON_COLOR : '#6b7280' }}>
                                <User size={24}/>
                                <span className="text-[10px] font-semibold tracking-wider uppercase">Profiel</span>
                            </button>
                            <button onClick={() => setMobileSection('questions')} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 active:opacity-70 transition-opacity" style={{ color: mobileSection === 'questions' ? NEON_COLOR : '#6b7280' }}>
                                <ShieldCheck size={24}/>
                                <span className="text-[10px] font-semibold tracking-wider uppercase">Vragen</span>
                            </button>
                        </>
                    )}
                </div>
            </nav>
        </div>
    );
}


// --- MAIN APP COMPONENT ---
export default function Skillkaart() {
  const [session, setSession] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastKnownUserId = useRef(null);
  
  useEffect(() => {
    // Coach session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        if (lastKnownUserId.current === session.user.id) {
          setSession(session);
          setLoading(false);
          return;
        }

        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setSession(session);
        setUserData(data);
        lastKnownUserId.current = session.user.id;
      } else {
        const playerSession = localStorage.getItem('playerSession');
        if (playerSession) {
          const parsedSession = JSON.parse(playerSession);
          if (parsedSession.role === 'player' && parsedSession.uid) {
            const pseudoSession = { user: { id: parsedSession.uid } };
            setSession(pseudoSession);
            setUserData(parsedSession);
            lastKnownUserId.current = parsedSession.uid;
          } else {
            setSession(null);
            setUserData(null);
            lastKnownUserId.current = null;
          }
        } else {
          setSession(null);
          setUserData(null);
          lastKnownUserId.current = null;
        }
      }
      setLoading(false);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  const handlePlayerLogin = (playerData) => {
      localStorage.setItem('playerSession', JSON.stringify(playerData));
      setSession({ user: { id: playerData.uid }}); // Mock session
      setUserData(playerData);
      lastKnownUserId.current = playerData.uid;
  };
  
  const handlePlayerLogout = () => {
      localStorage.removeItem('playerSession');
      setSession(null);
      setUserData(null);
      lastKnownUserId.current = null;
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-[#0D0D0D] to-[#1A1A1A] text-white min-h-screen flex flex-col items-center justify-center text-center">
        <Loader2 className="animate-spin h-12 w-12 text-[--neon-color] mb-4"/>
        <h2 className="text-2xl font-bold">Verbinden met de server...</h2>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-[#0D0D0D] to-[#1A1A1A] text-white font-sans" style={{ '--neon-color': NEON_COLOR }}>
      <style>{`body { scrollbar-width: thin; scrollbar-color: ${NEON_COLOR} #0D0D0D; } body::-webkit-scrollbar { width: 8px; } body::-webkit-scrollbar-track { background: #0D0D0D; } body::-webkit-scrollbar-thumb { background-color: ${NEON_COLOR}; border-radius: 20px; border: 3px solid #0D0D0D; }`}</style>
      {!(session && userData) ? (
        <AuthComponent onPlayerLogin={handlePlayerLogin} />
      ) : (
        <Dashboard user={session.user} userData={userData} onPlayerLogout={handlePlayerLogout} />
      )}
    </div>
  );
}

