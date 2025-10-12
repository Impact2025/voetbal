import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, User, BarChart2, LogOut, ShieldCheck, UserSquare, ClipboardList, X, CheckCircle2, Youtube, Wand2, Loader2, FileText, Copy, Edit, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Client Setup ---
// NOTE: These keys are public (anon) and are safe to be in the frontend code.
const supabaseUrl = "https://omnsabjbuswlvvedqswf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tbnNhYmpidXN3bHZ2ZWRxc3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NzAzNTEsImV4cCI6MjA3NTE0NjM1MX0.SSQo_vxNscprwOlqWOlAOwOv53HLo29pxRWRI3WPUaE";
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

const MAX_WEEKLY_QUESTIONS = 3;


const skillKeys = ['snelheid', 'passing', 'techniek', 'schot', 'verdedigen', 'inzicht', 'mentaliteit'];
const evaluationPeriods = ['Check-in 1', 'Check-in 2', 'Check-in 3'];
const NEON_COLOR = '#00FF9D';

const landingFeatures = [
  {
    title: 'Slim spelersdashboard',
    description: 'Krijg direct inzicht in evaluaties, trendgrafieken en huiswerkvoortgang voor iedere speler.',
    icon: BarChart2
  },
  {
    title: 'Coach-first workflow',
    description: 'Registreer teams, wijs huiswerk toe en noteer testresultaten zonder gedoe.',
    icon: ClipboardList
  },
  {
    title: 'Veilig en schaalbaar',
    description: 'Supabase-authenticatie en rolbeheer zorgen voor een veilige ervaring voor coaches en spelers.',
    icon: ShieldCheck
  }
];

const landingScreenshots = [
  { src: '/topspeler/Schermafbeelding 2025-10-10 094201.png', caption: 'Dashboard-overzicht' },
  { src: '/topspeler/Schermafbeelding 2025-10-10 094249.png', caption: 'Spelerprofiel' },
  { src: '/topspeler/Schermafbeelding 2025-10-10 094320.png', caption: 'Evaluatieformulier' },
  { src: '/topspeler/Schermafbeelding 2025-10-10 094345.png', caption: 'Homeworkbeheer' },
  { src: '/topspeler/Schermafbeelding 2025-10-10 094411.png', caption: 'Coach tooling' },
  { src: '/topspeler/Schermafbeelding 2025-10-10 094426.png', caption: 'Speler dashboard' }
];

const landingHeroImage = '/topspeler/Schermafbeelding 2025-10-10 141631.png';

const stepSliderItems = [
  {
    step: 'Stap 1',
    title: 'Je Team Opzetten',
    subtitle: 'Jouw Digitale Kleedkamer',
    lead: 'Alles begint met jouw team. Spelers, huiswerk en evaluaties zijn allemaal gekoppeld aan jouw unieke Team ID.',
    details: [
      'Je Team ID vinden & delen: Rechtsboven in je dashboard vind je jouw unieke Team ID (bijv. VVC11-1). Kopieer deze sleutel en deel hem met je spelers.',
      'Je profiel aanpassen: Klik op het bewerk-icoon naast je teamnaam. Pas Teamnaam en Klasse (bijv. "JO11-2") aan om het dashboard persoonlijk te maken.'
    ]
  },
  {
    step: 'Stap 2',
    title: 'Spelers Toevoegen',
    subtitle: 'Stel je Selectie Samen',
    lead: 'Jij hebt de regie. Spelers kunnen zichzelf niet aanmelden; jij maakt ze aan en deelt de inlogdetails.',
    details: [
      'Klik op [+ Speler Toevoegen] en vul de volledige naam in.',
      'Klik op “Aanmaken” en je krijgt direct een scherm met Team ID + unieke 4-cijferige pincode.',
      'Deel beide codes met de speler; meer hebben ze niet nodig om in te loggen.'
    ]
  },
  {
    step: 'Stap 3',
    title: 'Evalueren & Feedback Geven',
    subtitle: 'De Kern van Coaching',
    lead: 'Selecteer een speler om het persoonlijke dashboard te openen en begeleid de ontwikkeling per check-in.',
    details: [
      'Check-in momenten: Gebruik de tabs (Check-in 1, Check-in 2, …) om groei gedurende het seizoen te volgen.',
      'Skills beoordelen: Verschuif de sliders voor de 7 kernvaardigheden en bespreek samen de live radar chart.',
      '✨ AI-Assistent Coach: Klik op ✨ Genereer bij “Opmerkingen Coach” of “Persoonlijk Oefenplan” voor directe, motiverende feedback en oefeningen.'
    ]
  },
  {
    step: 'Stap 4',
    title: 'Huiswerk Manager',
    subtitle: 'Oefening baart kunst',
    lead: 'Geef je team leuke, visuele opdrachten die ze thuis kunnen doen en volg de voortgang.',
    details: [
      'Klik op [Huiswerk] in de header en open de tab “Huiswerk Maken”.',
      'Geef titel, omschrijving en optioneel een YouTube-link of kies een van de 15 kant-en-klare suggesties.',
      'Ga naar “Huiswerk Toewijzen”, selecteer je opdracht en klik op “Wijs toe”; spelers zien het direct op hun dashboard inclusief voltooiingsstatus.'
    ]
  },
  {
    step: 'Stap 5',
    title: 'Testen Afnemen',
    subtitle: 'Meten is Weten',
    lead: 'Leg objectieve data vast om progressie te meten en te vieren.',
    details: [
      'Selecteer een speler en een check-in moment en klik op [Testen Afnemen].',
      'Vul de resultaten in voor balvaardigheid, schieten, fysiek, coördinatie en meer in het gedetailleerde formulier.',
      'Klik op “Sluiten”; de resultaten worden opgeslagen en zichtbaar in de kaart “Testresultaten” op het spelerdashboard.'
    ]
  }
];

const StepSlider = ({ items, onStartApp }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % items.length);
    }, 9000);
    return () => clearInterval(timer);
  }, [items.length]);

  const goToIndex = (index) => {
    if (index < 0) {
      setActiveIndex(items.length - 1);
    } else if (index >= items.length) {
      setActiveIndex(0);
    } else {
      setActiveIndex(index);
    }
  };

  const activeItem = items[activeIndex];

  return (
    <Card className="bg-black/60 border-gray-800/70 relative overflow-hidden">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,#00ff9d1a,transparent_65%)]" />
      <div className="relative flex flex-col lg:flex-row gap-10">
        <div className="lg:w-1/3 space-y-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[--neon-color] bg-[--neon-color]/10 px-3 py-1 rounded-full">
            {activeItem.step} • {activeItem.subtitle}
          </span>
          <h3 className="text-3xl font-bold leading-tight">{activeItem.title}</h3>
          <p className="text-gray-300">{activeItem.lead}</p>
          <button type="button" onClick={onStartApp} className="px-5 py-2.5 rounded-lg font-semibold bg-[--neon-color] text-black hover:opacity-90 transition">
            Start nu met TopSpeler
          </button>
        </div>
        <div className="lg:w-2/3">
          <motion.div
            key={activeItem.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="space-y-3"
          >
            <ul className="space-y-3">
              {activeItem.details.map(detail => (
                <li key={detail} className="flex gap-3">
                  <span className="text-[--neon-color] mt-1">•</span>
                  <span className="text-gray-300 leading-relaxed">{detail}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
      <div className="relative mt-8 flex items-center justify-between gap-4">
        <button type="button" onClick={() => goToIndex(activeIndex - 1)} className="p-2 rounded-full bg-gray-800/80 border border-gray-700 hover:border-[--neon-color]/60 transition">
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-2">
          {items.map((item, idx) => (
            <button
              key={item.title}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all ${idx === activeIndex ? 'w-8 bg-[--neon-color]' : 'w-2 bg-gray-700'}`}
              aria-label={`Ga naar ${item.step}`}
            />
          ))}
        </div>
        <button type="button" onClick={() => goToIndex(activeIndex + 1)} className="p-2 rounded-full bg-gray-800/80 border border-gray-700 hover:border-[--neon-color]/60 transition">
          <ChevronRight size={18} />
        </button>
      </div>
    </Card>
  );
};

const GallerySlider = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  const goToIndex = (index) => {
    if (index < 0) {
      setActiveIndex(items.length - 1);
    } else if (index >= items.length) {
      setActiveIndex(0);
    } else {
      setActiveIndex(index);
    }
  };

  const activeItem = items[activeIndex];

  return (
    <Card className="bg-black/60 border-gray-800/70 relative overflow-hidden">
      <div className="relative flex flex-col items-center gap-4">
        <motion.div
          key={activeItem.src}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="w-full flex justify-center"
        >
          <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-gray-800/80 shadow-lg shadow-[--neon-color]/10">
            <img
              src={activeItem.src}
              alt={activeItem.caption}
              className="w-full h-56 object-cover"
              loading="lazy"
            />
          </div>
        </motion.div>
        <p className="text-sm text-gray-400 text-center px-4">{activeItem.caption}</p>
      </div>
      <div className="relative mt-6 flex items-center justify-between">
        <button type="button" onClick={() => goToIndex(activeIndex - 1)} className="p-2 rounded-full bg-gray-800/80 border border-gray-700 hover:border-[--neon-color]/60 transition">
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-2">
          {items.map((item, idx) => (
            <button
              key={item.src}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-2 rounded-full transition-all ${idx === activeIndex ? 'w-8 bg-[--neon-color]' : 'w-2 bg-gray-700'}`}
              aria-label={`Screenshot ${idx + 1}`}
            />
          ))}
        </div>
        <button type="button" onClick={() => goToIndex(activeIndex + 1)} className="p-2 rounded-full bg-gray-800/80 border border-gray-700 hover:border-[--neon-color]/60 transition">
          <ChevronRight size={18} />
        </button>
      </div>
    </Card>
  );
};

const TopSpelerLanding = ({ onStartApp }) => (
  <div className="bg-gradient-to-b from-[#080808] via-[#0D0D0D] to-[#141414] text-white" style={{ '--neon-color': NEON_COLOR }}>
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,#00ff9d1a,transparent_60%)]" />
      <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 bg-[--neon-color]/10 text-[--neon-color] px-4 py-1 rounded-full text-sm font-semibold">TopSpeler</span>
            <h1 className="text-4xl lg:text-6xl font-black leading-tight" style={{ textShadow: `0 0 16px ${NEON_COLOR}33` }}>
              Bouw de ultieme spelershub voor jouw team
            </h1>
            <p className="text-lg text-gray-300 max-w-xl">
              TopSpeler is jouw digitale assistent voor talentontwikkeling. Monitor vaardigheden, geef huiswerk mee en begeleid spelers met een strak design dat motiveert.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={onStartApp} className="px-6 py-3 rounded-xl font-semibold bg-[--neon-color] text-black hover:opacity-90 transition" type="button">
                Start de TopSpeler app
              </button>
              <a href="#handleiding" className="px-6 py-3 rounded-xl font-semibold border border-[--neon-color]/40 text-gray-200 hover:border-[--neon-color] transition">
                Bekijk handleiding
              </a>
            </div>
          </div>
          <Card className="bg-black/50 border-[--neon-color]/20 backdrop-blur-xl p-4">
            <div className="rounded-2xl overflow-hidden border border-gray-800/80 shadow-2xl shadow-[--neon-color]/10">
              <img
                src={landingHeroImage}
                alt="Voorbeeld van de TopSpeler spelershub"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </Card>
        </div>
      </div>
    </header>

    <section className="max-w-6xl mx-auto px-6 py-16" id="features">
      <h2 className="text-3xl font-bold text-center mb-12">Waarom coaches voor TopSpeler kiezen</h2>
      <div className="grid gap-8 md:grid-cols-3">
        {landingFeatures.map(({ title, description, icon: Icon }) => (
          <Card key={title} className="h-full bg-black/50 border-gray-800 hover:border-[--neon-color]/50 transition">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[--neon-color]/10 text-[--neon-color] mb-6">
              <Icon size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-3">{title}</h3>
            <p className="text-gray-400">{description}</p>
          </Card>
        ))}
      </div>
    </section>

    <section className="bg-black/40 border-y border-gray-800/60" id="handleiding">
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold">Aan de slag met TopSpeler</h2>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Swipe door de handleiding en volg elke stap om je digitale voetbalhub volledig in te richten – van teamopbouw tot testen.
          </p>
        </div>
        <StepSlider items={stepSliderItems} onStartApp={onStartApp} />
      </div>
    </section>

    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex flex-col lg:flex-row gap-12 items-center">
        <div className="lg:w-1/2 space-y-4">
          <h2 className="text-3xl font-bold">Visualiseer progressie in één oogopslag</h2>
          <p className="text-gray-400">
            Het neonkleurige design sluit naadloos aan op de app. Coaches krijgen overzicht, spelers voelen zich gemotiveerd.
          </p>
          <button onClick={onStartApp} className="px-6 py-3 rounded-xl font-semibold bg-[--neon-color] text-black hover:opacity-90 transition" type="button">
            Naar de spelershub
          </button>
        </div>
        <div className="lg:w-1/2 w-full">
          <GallerySlider items={landingScreenshots} />
        </div>
      </div>
    </section>

    <section className="max-w-6xl mx-auto px-6 pb-24">
      <Card className="bg-black/60 border-[--neon-color]/30 text-center py-16 px-6">
        <h2 className="text-3xl font-bold mb-4">Klaar om jouw spelers naar het volgende niveau te tillen?</h2>
        <p className="text-gray-400 mb-8">Start vandaag met TopSpeler en combineer coaching, data en motivatie op één plek.</p>
        <button onClick={onStartApp} className="px-8 py-3 rounded-xl font-semibold bg-[--neon-color] text-black hover:opacity-90 transition" type="button">
          Activeer TopSpeler
        </button>
      </Card>
      <p className="mt-8 text-sm text-gray-600 text-center">Gebouwd op dezelfde infrastructuur als de spelershub – één codebase, twee ervaringen.</p>
    </section>
  </div>
);

// --- Helper Functions ---
const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

// --- Helper Components ---
const ToolButton = React.forwardRef(({ children, className, ...props }, ref) => (
  <button ref={ref} className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 text-gray-300 border border-gray-700 hover:bg-gray-700/70 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[${NEON_COLOR}] ${className}`} {...props}>
    {children}
  </button>
));

const Card = ({ children, className }) => (
  <div className={`bg-black/30 backdrop-blur-sm border border-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg shadow-black/30 ${className}`}>
    {children}
  </div>
);

const HelpTooltip = ({ text }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative inline-block">
            <button
                type="button"
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onClick={() => setIsVisible(!isVisible)}
                className="ml-1 text-gray-500 hover:text-[--neon-color] transition-colors"
            >
                <HelpCircle size={14} />
            </button>
            {isVisible && (
                <div className="absolute left-0 top-6 z-50 w-64 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-lg text-xs text-gray-300">
                    {text}
                </div>
            )}
        </div>
    );
};

const Slider = ({ label, value, onChange, min = 0, max = 10, step = 1, disabled = false, help }) => (
    <div className={disabled ? 'opacity-50' : ''}>
        <label className="block text-sm font-medium text-gray-400 capitalize mb-2 flex items-center">
            {label}
            {help && <HelpTooltip text={help} />}
        </label>
        <div className="flex items-center gap-4">
            <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} disabled={disabled} className={`w-full h-2 bg-gray-700 rounded-lg appearance-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} slider-thumb`} />
            <span className="font-bold text-lg text-white w-8 text-center" style={{ color: NEON_COLOR }}>{value}</span>
        </div>
        <style>{`
            .slider-thumb::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; background: ${NEON_COLOR}; border: 2px solid #1A1A1A; border-radius: 50%; cursor: ${disabled ? 'not-allowed' : 'pointer'}; }
            .slider-thumb::-moz-range-thumb { width: 20px; height: 20px; background: ${NEON_COLOR}; border: 2px solid #1A1A1A; border-radius: 50%; cursor: ${disabled ? 'not-allowed' : 'pointer'}; }
        `}</style>
    </div>
);

const Input = ({ label, value, onChange, placeholder, type = "text", disabled = false, className = '' }) => (
    <div className={className}>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} className={`w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[--neon-color] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} />
    </div>
);

const Select = ({ label, value, onChange, children, disabled = false, className = '' }) => (
    <div className={className}>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        <select value={value} onChange={onChange} disabled={disabled} className={`w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[--neon-color] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {children}
        </select>
    </div>
);


const Textarea = ({ label, value, onChange, placeholder, disabled = false, className = '', textareaClassName = '', rows = 4, children }) => (
    <div className={className}>
        <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-400">{label}</label>
            {children}
        </div>
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={`w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[--neon-color] resize-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${textareaClassName}`.trim()}
        />
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
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

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

                const { data: teamData, error: teamError } = await supabase
                    .from('teams')
                    .select('id')
                    .eq('id', newTeamId)
                    .single();

                if (teamError && teamError.code !== 'PGRST116') {
                    throw teamError;
                }

                if (teamData) {
                    throw new Error("Deze Team ID is al in gebruik. Kies een andere.");
                }

                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;

                const { error: createTeamError } = await supabase
                    .from('teams')
                    .insert({ id: newTeamId, coach_id: data.user.id, team_name: `${email.split('@')[0]}'s Team` });
                if (createTeamError) throw createTeamError;

                const { data: profileInsert, error: profileInsertError } = await supabase
                    .from('profiles')
                    .insert({ id: data.user.id, role: 'coach', team_id: newTeamId })
                    .select()
                    .single();
                if (profileInsertError) throw profileInsertError;

                // Show success message
                setRegistrationSuccess(true);
                setTimeout(() => {
                    setRegistrationSuccess(false);
                    setView('coachLogin');
                    setPassword('');
                    setNewTeamId('');
                }, 3000);
                return;

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
                case 'Email not confirmed':
                    friendlyMessage = "Bevestig eerst je e-mailadres via de link in je inbox.";
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
                ...playerData,
                role: 'player',
                uid: playerData.id
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderForm = () => {
        if (registrationSuccess) {
            return (
                <div className="text-center space-y-4">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                        <CheckCircle2 size={64} className="mx-auto text-green-400 mb-4" />
                    </motion.div>
                    <h2 className="text-2xl font-bold" style={{ color: NEON_COLOR }}>Account Aangemaakt!</h2>
                    <p className="text-gray-400">Je wordt doorgestuurd naar de login pagina...</p>
                </div>
            );
        }

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

const HomeworkCreatorModal = ({ isVisible, onClose, onSave, onDelete, customHomework, players, assignedHomeworkIds }) => {
    const [activeTab, setActiveTab] = useState('overzicht');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const handleSuggestionClick = (suggestion) => {
        setTitle(suggestion.title);
        setDescription(suggestion.description);
    };

    const formatDateRange = (start, end) => {
        if (!start && !end) return '';

        const formatDate = (dateStr) => {
            const date = new Date(dateStr);
            const day = date.getDate();
            const month = date.getMonth() + 1;
            return `${day}/${month}`;
        };

        if (start && end) {
            return `${formatDate(start)} - ${formatDate(end)}`;
        } else if (start) {
            return `vanaf ${formatDate(start)}`;
        } else {
            return `tot ${formatDate(end)}`;
        }
    };

    const handleSave = async () => {
        if (!title.trim() || !description.trim()) {
            alert('Titel en omschrijving zijn verplicht.');
            return;
        }

        setLoading(true);
        try {
            const dateRange = formatDateRange(startDate, endDate);
            await onSave({
                week: dateRange,
                title,
                description,
                youtube_url: youtubeUrl
            });
            // Reset fields
            setStartDate('');
            setEndDate('');
            setTitle('');
            setDescription('');
            setYoutubeUrl('');
            setActiveTab('overzicht');
        } catch (error) {
            console.error('Error saving homework:', error);
            alert('Er ging iets mis bij het opslaan. Probeer het opnieuw.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (homeworkId) => {
        if (!confirm('Weet je zeker dat je dit huiswerk wilt verwijderen?')) return;

        setDeletingId(homeworkId);
        try {
            await onDelete(homeworkId);
        } catch (error) {
            console.error('Error deleting homework:', error);
            const message = typeof error?.message === 'string' ? error.message : 'Onbekende fout';
            alert(`Er ging iets mis bij het verwijderen.\n\n${message}`);
        } finally {
            setDeletingId(null);
        }
    };

    if (!isVisible) return null;

    // Get assigned homework sorted by week/creation date
    const assignedHomework = customHomework
        .filter(hw => assignedHomeworkIds.includes(hw.id))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
                <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-lg shadow-black/50" onClick={e => e.stopPropagation()}>
                    <div className="flex-shrink-0 p-4 border-b border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2"><ClipboardList size={22} className="text-[--neon-color]" /> Huiswerk Beheer</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors"><X size={20} /></button>
                    </div>
                    <div className="flex-shrink-0 p-2 bg-gray-800/50">
                        <div className="flex justify-center gap-2">
                            <button onClick={() => setActiveTab('overzicht')} className={`px-6 py-2 rounded-md font-semibold transition-colors ${activeTab === 'overzicht' ? 'bg-[--neon-color] text-black' : 'hover:bg-gray-700'}`}>Overzicht</button>
                            <button onClick={() => setActiveTab('toevoegen')} className={`px-6 py-2 rounded-md font-semibold transition-colors ${activeTab === 'toevoegen' ? 'bg-[--neon-color] text-black' : 'hover:bg-gray-700'}`}>Nieuw Huiswerk</button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto p-6">
                        {activeTab === 'overzicht' && (
                            <div>
                                <h3 className="text-lg font-bold mb-4">Toegewezen Huiswerk & Voortgang</h3>
                                {assignedHomework.length > 0 ? (
                                    <div className="space-y-4">
                                        {assignedHomework.map(hw => {
                                            const completedCount = players.filter(p => p.completed_homework_ids?.includes(hw.id)).length;
                                            const totalPlayers = players.length;
                                            const percentage = totalPlayers > 0 ? Math.round((completedCount / totalPlayers) * 100) : 0;

                                            return (
                                                <div key={hw.id} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="flex-1">
                                                            <h4 className="font-bold text-lg">{hw.week && `${hw.week}: `}{hw.title}</h4>
                                                            <p className="text-sm text-gray-400 mt-1">{hw.description}</p>
                                                            {hw.youtube_url && (
                                                                <a href={hw.youtube_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[--neon-color] hover:underline mt-1 inline-flex items-center gap-1">
                                                                    <Youtube size={12} /> Video bekijken
                                                                </a>
                                                            )}
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <div className="text-right">
                                                                <div className="text-2xl font-bold" style={{ color: percentage === 100 ? '#00FF9D' : 'white' }}>
                                                                    {completedCount}/{totalPlayers}
                                                                </div>
                                                                <div className="text-xs text-gray-400">{percentage}% voltooid</div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDelete(hw.id)}
                                                                disabled={deletingId === hw.id}
                                                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group disabled:opacity-50"
                                                                title="Verwijderen"
                                                            >
                                                                {deletingId === hw.id ? (
                                                                    <Loader2 size={18} className="animate-spin text-red-400" />
                                                                ) : (
                                                                    <Trash2 size={18} className="text-gray-400 group-hover:text-red-400" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Progress bar */}
                                                    <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                                                        <div
                                                            className="h-2 rounded-full transition-all duration-300"
                                                            style={{
                                                                width: `${percentage}%`,
                                                                backgroundColor: percentage === 100 ? '#00FF9D' : '#4B5563'
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Player status list */}
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                                        {players.map(player => {
                                                            const isCompleted = player.completed_homework_ids?.includes(hw.id);
                                                            return (
                                                                <div
                                                                    key={player.id}
                                                                    className={`flex items-center gap-2 p-2 rounded text-sm ${
                                                                        isCompleted
                                                                            ? 'bg-green-500/20 text-green-400'
                                                                            : 'bg-gray-700/50 text-gray-400'
                                                                    }`}
                                                                >
                                                                    <CheckCircle2 size={14} className={isCompleted ? 'text-green-400' : 'text-gray-600'} />
                                                                    <span className="truncate">{player.name}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <ClipboardList size={48} className="mx-auto text-gray-600 mb-4" />
                                        <p className="text-gray-400">Nog geen huiswerk toegewezen.</p>
                                        <p className="text-sm text-gray-500 mt-2">Klik op "Nieuw Huiswerk" om te beginnen.</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'toevoegen' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-lg font-bold mb-4">Nieuwe Huiswerkopdracht</h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Start Datum (optioneel)"
                                                type="date"
                                                value={startDate}
                                                onChange={e => setStartDate(e.target.value)}
                                            />
                                            <Input
                                                label="Eind Datum (optioneel)"
                                                type="date"
                                                value={endDate}
                                                onChange={e => setEndDate(e.target.value)}
                                                disabled={!startDate}
                                            />
                                        </div>
                                        {startDate && endDate && (
                                            <div className="text-sm text-gray-400 -mt-2">
                                                Periode: {formatDateRange(startDate, endDate)}
                                            </div>
                                        )}
                                        <Input label="Titel" value={title} onChange={e => setTitle(e.target.value)} placeholder="bv. Dribbel Challenge" />
                                        <Textarea label="Omschrijving" value={description} onChange={e => setDescription(e.target.value)} placeholder="Omschrijf de oefening..." />
                                        <Input label="YouTube Link (optioneel)" value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} placeholder="Plak hier een YouTube URL" />
                                        <button onClick={handleSave} disabled={loading} className="w-full py-2 font-bold text-black bg-[--neon-color] rounded-lg hover:opacity-90 transition-opacity duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                            {loading ? 'Toevoegen...' : 'Huiswerk Toevoegen'}
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
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const ReflectionManagerModal = ({
    isVisible,
    onClose,
    questions,
    onQuestionChange,
    onAddQuestion,
    onRemoveQuestion,
    onResetQuestions,
    onSaveQuestions,
    savingQuestions,
    feedback,
    players = [],
    questionLimit,
    currentQuestions
}) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);

    useEffect(() => {
        if (isVisible) {
            if (players.length > 0) {
                setSelectedPlayerId(players[0].id);
            } else {
                setSelectedPlayerId(null);
            }
        }
    }, [isVisible, players]);

    if (!isVisible) return null;

    const savedQuestions = (currentQuestions || []).map((text, idx) => ({
        text: (text || '').trim(),
        idx
    })).filter(({ text }) => text);

    const selectedPlayer = players.find(player => player.id === selectedPlayerId) || null;
    const selectedResponses = selectedPlayer?.evaluations?.weekly_reflections?.responses || selectedPlayer?.weekly_question_responses || [];
    const lastUpdated = selectedPlayer?.evaluations?.weekly_reflections?.updated_at;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-lg"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-4 border-b border-gray-800/70">
                        <h2 className="text-xl font-bold flex items-center gap-2"><HelpCircle size={20} className="text-[--neon-color]" /> Reflectievragen</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-800 transition-colors" aria-label="Sluiten">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card className="bg-gray-900/60 border-gray-800">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">Vragen beheren</h3>
                                        <p className="text-sm text-gray-400">Voeg tot {questionLimit} vragen toe voor je team.</p>
                                    </div>
                                    <span className="text-xs font-semibold text-gray-400 bg-gray-800 px-3 py-1 rounded-full">{questions.length}/{questionLimit}</span>
                                </div>
                                <div className="space-y-4">
                                    {questions.map((value, idx) => (
                                        <Textarea
                                            key={`reflection-question-${idx}`}
                                            label={`Vraag ${idx + 1}`}
                                            value={value}
                                            onChange={(e) => onQuestionChange(idx, e.target.value)}
                                            placeholder="Typ hier je vraag..."
                                            rows={2}
                                            textareaClassName="min-h-[64px] max-h-[64px]"
                                        >
                                            {questions.length > 1 && (
                                                <button type="button" onClick={() => onRemoveQuestion(idx)} className="text-xs text-gray-400 hover:text-red-400 transition-colors">
                                                    Verwijderen
                                                </button>
                                            )}
                                        </Textarea>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-3 items-center justify-between mt-5">
                                    <div className="flex gap-3">
                                        {questions.length < questionLimit && (
                                            <button type="button" onClick={onAddQuestion} className="px-4 py-2 rounded-lg border border-[--neon-color]/40 text-sm font-semibold text-gray-200 hover:border-[--neon-color] transition-colors">
                                                + Vraag toevoegen
                                            </button>
                                        )}
                                        <button type="button" onClick={onResetQuestions} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors text-sm font-semibold">
                                            Herstel standaard
                                        </button>
                                    </div>
                                    <button type="button" onClick={onSaveQuestions} disabled={savingQuestions} className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity flex items-center disabled:opacity-50">
                                        {savingQuestions ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                                        Opslaan
                                    </button>
                                </div>
                                {feedback && <p className="text-sm text-gray-400 mt-3">{feedback}</p>}
                            </Card>

                            <Card className="bg-gray-900/60 border-gray-800">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">Antwoorden spelers</h3>
                                        <p className="text-sm text-gray-400">Bekijk reacties per speler op de huidige vragen.</p>
                                    </div>
                                    <span className="text-xs text-gray-500">{players.length} spelers</span>
                                </div>
                                {players.length === 0 ? (
                                    <p className="text-sm text-gray-500">Nog geen spelers toegevoegd.</p>
                                ) : savedQuestions.length === 0 ? (
                                    <p className="text-sm text-gray-500">Er zijn nog geen opgeslagen vragen.</p>
                                ) : (
                                    <div className="space-y-4">
                                        <Select
                                            label="Selecteer speler"
                                            value={selectedPlayerId || ''}
                                            onChange={(e) => setSelectedPlayerId(e.target.value)}
                                        >
                                            {players.map(player => (
                                                <option key={player.id} value={player.id}>{player.name}</option>
                                            ))}
                                        </Select>
                                        {selectedPlayer ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-xs text-gray-400">
                                                    <span>{selectedPlayer.name}</span>
                                                    {lastUpdated && <span>Laatst bijgewerkt: {new Date(lastUpdated).toLocaleString()}</span>}
                                                </div>
                                                {savedQuestions.map(({ text, idx }) => (
                                                    <div key={`response-${selectedPlayer.id}-${idx}`} className="p-3 bg-gray-800/50 rounded-lg border border-gray-800/70">
                                                        <p className="text-sm font-semibold text-[--neon-color]">Vraag {idx + 1}</p>
                                                        <p className="text-sm text-white mt-1">{text}</p>
                                                        <p className="text-sm text-gray-300 mt-3">
                                                            {selectedResponses?.[idx]?.trim() ? selectedResponses[idx] : <span className="italic text-gray-500">Nog geen antwoord</span>}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">Geen speler geselecteerd.</p>
                                        )}
                                        <div className="border-t border-gray-800 pt-3">
                                            <h4 className="text-xs uppercase tracking-wide text-gray-400 mb-2">Overzicht</h4>
                                            <div className="grid gap-2">
                                                {players.map(player => {
                                                    const responses = player.evaluations?.weekly_reflections?.responses || player.weekly_question_responses || [];
                                                    const answeredCount = savedQuestions.reduce((count, { idx }) => count + (responses[idx]?.trim() ? 1 : 0), 0);
                                                    return (
                                                        <div key={`player-summary-${player.id}`} className="flex items-center justify-between bg-gray-800/40 rounded-lg px-3 py-2 text-sm text-gray-300">
                                                            <span className="truncate pr-3">{player.name}</span>
                                                            <span className="text-xs text-gray-400">{answeredCount}/{savedQuestions.length} antwoorden</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-800/70 flex justify-end">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors">Sluiten</button>
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
        try {
            const newPlayerData = await onAdd(playerName);
            setNewPlayerInfo({
                name: playerName,
                id: newPlayerData.id,
                pin: newPlayerData.pin
            });
        } catch (error) {
            console.error('Error adding player:', error);
            const message = typeof error?.message === 'string' ? error.message : 'Onbekende fout';
            alert(`Er ging iets mis bij het aanmaken van de speler.\n\n${message}`);
        } finally {
            setLoading(false);
        }
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

const PlayerHomeworkCard = ({ player, customHomework, assignedHomeworkIds, onToggleStatus, highlight = false, pendingCount = 0 }) => {
    const assignedTasks = customHomework.filter(hw => assignedHomeworkIds.includes(hw.id));

    if (assignedTasks.length === 0) {
        return (
            <Card>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ClipboardList size={20} className="text-[--neon-color]" /> Huiswerk</h3>
                <p className="text-gray-400">Er is momenteel geen huiswerk toegewezen.</p>
            </Card>
        );
    }

    const pendingBadge = pendingCount > 0 ? pendingCount : assignedTasks.filter(hw => !player.completed_homework_ids.includes(hw.id)).length;

    return (
        <Card className={highlight && pendingBadge > 0 ? 'border-[--neon-color] shadow-[0_0_25px_rgba(0,255,157,0.35)]' : ''}>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ClipboardList size={20} className="text-[--neon-color]" /> Jouw Huiswerk</h3>
            {pendingBadge > 0 && (
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-black bg-[--neon-color] rounded-full px-3 py-1 w-fit shadow-[0_0_15px_rgba(0,255,157,0.4)]">
                    <span>{pendingBadge} opdracht{pendingBadge === 1 ? '' : 'en'} open</span>
                </div>
            )}
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
        try {
            await onSave({ team_name: teamName, team_class: teamClass });
        } catch (error) {
            console.error('Error updating coach profile:', error);
            const message = typeof error?.message === 'string' ? error.message : 'Onbekende fout';
            alert(`Opslaan mislukt.\n\n${message}`);
        }
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
    const [confirmRemove, setConfirmRemove] = useState({ isVisible: false, playerId: null });
    const [isGenerating, setIsGenerating] = useState({ plan: false, comments: false });
    const [copied, setCopied] = useState(false);
    const [coachTeamId, setCoachTeamId] = useState(userData?.team_id || userData?.teamId || null);
    const [isAddPlayerVisible, setIsAddPlayerVisible] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [isCoachProfileVisible, setIsCoachProfileVisible] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isReflectionVisible, setIsReflectionVisible] = useState(false);
    const [questionDrafts, setQuestionDrafts] = useState([DEFAULT_WEEKLY_QUESTIONS[0]]);
    const [responseDrafts, setResponseDrafts] = useState(Array.from({ length: MAX_WEEKLY_QUESTIONS }, () => ''));
    const [savingQuestions, setSavingQuestions] = useState(false);
    const [savingResponses, setSavingResponses] = useState(false);
    const [questionFeedback, setQuestionFeedback] = useState('');
    const [responseFeedback, setResponseFeedback] = useState('');
    const [playerSection, setPlayerSection] = useState(userData.role === 'player' ? 'overzicht' : null);

    const ensureTeamContext = useCallback(async () => {
        let teamId = coachTeamId || userData?.team_id || userData?.teamId || teamData?.id;
        if (teamId) {
            return teamId;
        }

        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('team_id')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError && profileError.code !== 'PGRST116') {
                console.warn('Kon profielgegevens niet ophalen:', profileError);
            }

            if (profileData?.team_id) {
                teamId = profileData.team_id;
                setCoachTeamId(teamId);
            }
        } catch (error) {
            console.warn('Profiel-opvraag fout:', error);
        }

        if (teamId) {
            return teamId;
        }

        try {
            const { data: teamRow, error: teamError } = await supabase
                .from('teams')
                .select('*')
                .eq('coach_id', user.id)
                .maybeSingle();

            if (teamError && teamError.code !== 'PGRST116') {
                console.warn('Kon team niet ophalen:', teamError);
            }

            if (teamRow?.id) {
                teamId = teamRow.id;
                setTeamData(teamRow);
                setCoachTeamId(teamId);
            }
        } catch (error) {
            console.warn('Team-opvraag fout:', error);
        }

        if (teamId) {
            return teamId;
        }

        const baseId = (user.email?.split('@')[0] || 'coach').replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'TEAM';
        const generatedId = `${baseId}-${Date.now().toString().slice(-4)}`;

        try {
            const { data: newTeam, error: createTeamError } = await supabase
                .from('teams')
                .insert({
                    id: generatedId,
                    coach_id: user.id,
                    team_name: `${user.email?.split('@')[0] || 'Mijn team'}`
                })
                .select()
                .single();

            if (createTeamError) {
                console.error('Kon automatisch team niet aanmaken:', createTeamError);
                throw new Error(createTeamError?.message || 'Automatisch team aanmaken mislukt');
            }

            teamId = newTeam.id;
            setTeamData(newTeam);
            setCoachTeamId(teamId);

            try {
                await supabase
                    .from('profiles')
                    .upsert({ id: user.id, role: 'coach', team_id: teamId }, { onConflict: 'id' });
            } catch (profileUpdateError) {
                console.warn('Kon profiel niet bijwerken met team-id:', profileUpdateError);
            }

            return teamId;
        } catch (error) {
            console.error('Automatische team-aanmaak mislukt:', error);
            throw error;
        }
    }, [coachTeamId, userData?.team_id, userData?.teamId, teamData?.id, user.id, user.email]);

    useEffect(() => {
        const incomingTeamId = userData?.team_id || userData?.teamId || null;
        if (incomingTeamId && incomingTeamId !== coachTeamId) {
            setCoachTeamId(incomingTeamId);
        }
    }, [userData?.team_id, userData?.teamId, coachTeamId]);


    useEffect(() => {
        let isMounted = true;
        let playersChannel = null;
        let teamChannel = null;
        let homeworkChannel = null;

        const setup = async () => {
            let teamId;
            try {
                teamId = await ensureTeamContext();
            } catch (error) {
                if (isMounted) {
                    console.error('Kon teamcontext niet vaststellen:', error);
                    setIsLoadingData(false);
                }
                return;
            }

            if (!isMounted) return;

            if (!teamId) {
                setIsLoadingData(false);
                return;
            }

            const fetchData = async () => {
                try {
                    setIsLoadingData(true);
                    const { data: playersData } = await supabase.from('players').select('*').eq('team_id', teamId);
                    const { data: freshTeamData } = await supabase.from('teams').select('*').eq('id', teamId).maybeSingle();
                    const { data: homeworkData } = await supabase.from('custom_homework').select('*').eq('team_id', teamId);

                    if (!isMounted) return;

                    const normalizedPlayers = (playersData || []).map(player => {
                        const reflectionBlock = player.evaluations?.weekly_reflections || {};
                        const reflectionResponses = reflectionBlock.responses;
                    return {
                        ...player,
                        weekly_question_responses: Array.from({ length: MAX_WEEKLY_QUESTIONS }, (_, idx) => reflectionResponses?.[idx] || '')
                    };
                    });

                    const storedQuestions = normalizedPlayers.reduce((acc, player) => {
                        if (acc.length) return acc;
                        const questions = player.evaluations?.weekly_reflections?.questions;
                        if (Array.isArray(questions)) {
                            const cleaned = questions.filter(q => (q || '').trim());
                            if (cleaned.length) {
                                return cleaned;
                            }
                        }
                        return acc;
                    }, []);

                    let effectiveQuestions = storedQuestions;
                    if (!effectiveQuestions.length && typeof window !== 'undefined') {
                        try {
                            const cached = window.localStorage.getItem(`team-${teamId}-reflection-questions`);
                            if (cached) {
                                const parsed = JSON.parse(cached);
                                if (Array.isArray(parsed)) {
                                    const cleaned = parsed.filter(q => (q || '').trim());
                                    if (cleaned.length) {
                                        effectiveQuestions = cleaned;
                                    }
                                }
                            }
                        } catch (cacheError) {
                            console.warn('Kon lokale reflectievraag-cache niet lezen:', cacheError);
                        }
                    }

                    setPlayers(normalizedPlayers);
                    setTeamData(freshTeamData || {});
                    setCoachTeamId(prev => prev || freshTeamData?.id || teamId);
                    setCustomHomework(homeworkData || []);

                    if (userData.role === 'coach') {
                        setQuestionDrafts(effectiveQuestions.length ? effectiveQuestions : [DEFAULT_WEEKLY_QUESTIONS[0]]);
                    }

                    if (userData.role === 'coach' && playersData && playersData.length > 0) {
                        setActivePlayerId(playersData[0].id);
                    } else if (userData.role === 'player' && userData.uid) {
                        setActivePlayerId(userData.uid);
                    }
                } catch (error) {
                    if (isMounted) {
                        console.error('Error loading data:', error);
                    }
                } finally {
                    if (isMounted) {
                        setIsLoadingData(false);
                    }
                }
            };

            await fetchData();

            playersChannel = supabase
                .channel('players-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'players',
                        filter: `team_id=eq.${teamId}`
                    },
                    () => {
                        fetchData();
                    }
                )
                .subscribe();

            teamChannel = supabase
                .channel('team-changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'teams',
                        filter: `id=eq.${teamId}`
                    },
                    (payload) => {
                        if (!isMounted) return;
                        setTeamData(payload.new);
                    }
                )
                .subscribe();

            homeworkChannel = supabase
                .channel('homework-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'custom_homework',
                        filter: `team_id=eq.${teamId}`
                    },
                    () => {
                        fetchData();
                    }
                )
                .subscribe();
        };

        setup();

        return () => {
            isMounted = false;
            if (playersChannel) supabase.removeChannel(playersChannel);
            if (teamChannel) supabase.removeChannel(teamChannel);
            if (homeworkChannel) supabase.removeChannel(homeworkChannel);
        };
    }, [ensureTeamContext, userData?.uid, userData?.role]);

    const activePlayer = useMemo(() => {
        if (userData.role === 'player') {
            return players.find(p => p.id === userData.uid);
        }
        return players.find(p => p.id === activePlayerId);
    }, [players, activePlayerId, userData.uid, userData.role]);

    const savedQuestions = useMemo(() => {
        const result = players.reduce((acc, player) => {
            if (acc.length) return acc;
            const questions = player.evaluations?.weekly_reflections?.questions;
            if (Array.isArray(questions)) {
                const cleaned = questions.filter(q => (q || '').trim());
                if (cleaned.length) {
                    return cleaned;
                }
            }
            return acc;
        }, []);
        return result.length ? result : [];
    }, [players]);

    const playerQuestionList = useMemo(() => {
        const fromActive = activePlayer?.evaluations?.weekly_reflections?.questions;
        if (Array.isArray(fromActive)) {
            const cleaned = fromActive.filter(q => (q || '').trim());
            if (cleaned.length) {
                return cleaned;
            }
        }
        if (savedQuestions.length) {
            return savedQuestions;
        }
        if (typeof window !== 'undefined') {
            try {
                const teamId = activePlayer?.team_id || userData?.team_id || userData?.teamId;
                if (teamId) {
                    const cached = window.localStorage.getItem(`team-${teamId}-reflection-questions`);
                    if (cached) {
                        const parsed = JSON.parse(cached);
                        if (Array.isArray(parsed)) {
                            const cleaned = parsed.filter(q => (q || '').trim());
                            if (cleaned.length) {
                                return cleaned;
                            }
                        }
                    }
                }
            } catch (cacheError) {
                console.warn('Kon lokale reflectievraag-cache voor speler niet lezen:', cacheError);
            }
        }
        return [DEFAULT_WEEKLY_QUESTIONS[0]];
    }, [activePlayer?.evaluations?.weekly_reflections?.questions, activePlayer?.team_id, savedQuestions, userData?.team_id, userData?.teamId]);

    const coachVisibleQuestions = useMemo(() => {
        if (userData.role === 'coach') {
            if (questionDrafts.length) {
                return questionDrafts;
            }
            if (savedQuestions.length) {
                return savedQuestions;
            }
        }
        return playerQuestionList;
    }, [questionDrafts, savedQuestions, playerQuestionList, userData.role]);

    const visibleQuestions = useMemo(() => {
        const source = userData.role === 'coach' ? questionDrafts : playerQuestionList;
        return source.map((text, idx) => ({ text, idx })).filter(({ text }) => text.trim());
    }, [questionDrafts, playerQuestionList, userData.role]);

    const reflectionStats = useMemo(() => {
        const questionsCount = coachVisibleQuestions.filter(q => (q || '').trim()).length;
        if (!questionsCount) {
            return { questionsCount: 0, playersAnswered: 0 };
        }
        let playersAnswered = 0;
        players.forEach(player => {
            const responses = player.evaluations?.weekly_reflections?.responses || player.weekly_question_responses || [];
            const answered = responses.slice(0, questionsCount).some(answer => (answer || '').trim());
            if (answered) {
                playersAnswered += 1;
            }
        });
        return { questionsCount, playersAnswered };
    }, [coachVisibleQuestions, players]);

    const playerPendingHomeworkCount = useMemo(() => {
        if (userData.role !== 'player' || !activePlayer) return 0;
        const assigned = teamData.assigned_homework_ids || [];
        if (!assigned.length) return 0;
        const completedSet = new Set(activePlayer.completed_homework_ids || []);
        return assigned.filter(id => !completedSet.has(id)).length;
    }, [userData.role, activePlayer, teamData.assigned_homework_ids]);

    const isPlayerHomeworkView = userData.role === 'player' && playerSection === 'huiswerk';

    useEffect(() => {
        if (userData.role === 'coach' && isReflectionVisible) {
            if (!questionDrafts.length) {
                setQuestionDrafts(savedQuestions.length ? savedQuestions : [DEFAULT_WEEKLY_QUESTIONS[0]]);
            }
            setQuestionFeedback('');
        }
    }, [isReflectionVisible, questionDrafts.length, savedQuestions, userData.role]);

    useEffect(() => {
        if (!isReflectionVisible) {
            setQuestionFeedback('');
        }
    }, [isReflectionVisible]);

    useEffect(() => {
        if (userData.role === 'player') {
            setPlayerSection(prev => (prev ? prev : 'overzicht'));
        } else {
            setPlayerSection(null);
        }
    }, [userData.role]);

    useEffect(() => {
        if (!activePlayer) {
            setResponseDrafts(['', '', '']);
            return;
        }
        setResponseDrafts(Array.from({ length: MAX_WEEKLY_QUESTIONS }, (_, idx) => activePlayer.weekly_question_responses?.[idx] || ''));
    }, [activePlayer]);
    
    const handleAddPlayer = async (playerName) => {
        const teamId = await ensureTeamContext();

        if (!teamId) {
            throw new Error('Team ID niet gevonden. Log opnieuw in.');
        }

        let newPin;
        let isUnique = false;
        while (!isUnique) {
            newPin = Math.floor(1000 + Math.random() * 9000).toString();
            const { data } = await supabase.from('players').select('id').eq('team_id', teamId).eq('pin', newPin);
            isUnique = !data || data.length === 0;
        }

        const questionTemplate = (questionDrafts.length ? questionDrafts : [DEFAULT_WEEKLY_QUESTIONS[0]]);
        const paddedQuestions = Array.from({ length: MAX_WEEKLY_QUESTIONS }, (_, idx) => (questionTemplate[idx] || '').trim());
        const blankResponses = Array.from({ length: MAX_WEEKLY_QUESTIONS }, () => '');

        const newPlayer = {
            name: playerName,
            team_id: teamId,
            age: '',
            preferred_foot: 'Rechts',
            position: '',
            pin: newPin,
            avatar_url: `https://placehold.co/128x128/1A1A1A/FFFFFF?text=${playerName.substring(0,2).toUpperCase()}`,
            evaluations: {
                'Check-in 1': { skills: { snelheid: 5, passing: 5, techniek: 5, schot: 5, verdedigen: 5, inzicht: 5, mentaliteit: 5 }, matchRating: 5, comments: '', fitness: { yoyo: '', cooper: '', sprint: '' }, trainingPlan: '', tests: JSON.parse(JSON.stringify(initialTestState)) },
                'Check-in 2': { skills: { snelheid: 5, passing: 5, techniek: 5, schot: 5, verdedigen: 5, inzicht: 5, mentaliteit: 5 }, matchRating: 5, comments: '', fitness: { yoyo: '', cooper: '', sprint: '' }, trainingPlan: '', tests: JSON.parse(JSON.stringify(initialTestState)) },
                'Check-in 3': { skills: { snelheid: 5, passing: 5, techniek: 5, schot: 5, verdedigen: 5, inzicht: 5, mentaliteit: 5 }, matchRating: 5, comments: '', fitness: { yoyo: '', cooper: '', sprint: '' }, trainingPlan: '', tests: JSON.parse(JSON.stringify(initialTestState)) },
                weekly_reflections: {
                    responses: blankResponses,
                    questions: paddedQuestions,
                    updated_at: new Date().toISOString()
                }
            },
            completed_homework_ids: []
        };
        
        const { data, error } = await supabase.from('players').insert(newPlayer).select().single();
        if (error) {
            console.error('Supabase fout bij speler toevoegen:', error);
            throw new Error(error?.message || 'Supabase insert mislukte');
        }

        // Manually update local state for immediate UI update
        setPlayers(prev => [...prev, {
            ...data,
            weekly_question_responses: blankResponses
        }]);

        // Set as active player if first player
        if (players.length === 0) {
            setActivePlayerId(data.id);
        }

        return { id: data.id, pin: newPin };
    };

    const handleSaveProfile = async (playerId, profileData) => {
        await supabase.from('players').update(profileData).eq('id', playerId);
    };
    
    const handleSaveCoachProfile = async (coachProfileData) => {
        const teamId = await ensureTeamContext();
        if (!teamId) {
            throw new Error('Team ID niet gevonden. Log opnieuw in.');
        }
        await supabase.from('teams').update(coachProfileData).eq('id', teamId);
    };

    const handleQuestionDraftChange = (index, value) => {
        setQuestionDrafts(prev => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
        setQuestionFeedback('');
    };

    const handleAddQuestionField = () => {
        setQuestionDrafts(prev => {
            if (prev.length >= MAX_WEEKLY_QUESTIONS) return prev;
            const nextPreset = DEFAULT_WEEKLY_QUESTIONS[prev.length] || '';
            return [...prev, nextPreset];
        });
        setQuestionFeedback('');
    };

    const handleRemoveQuestionField = (index) => {
        setQuestionDrafts(prev => {
            if (prev.length <= 1) return prev;
            const updated = prev.filter((_, idx) => idx !== index);
            return updated.length > 0 ? updated : [DEFAULT_WEEKLY_QUESTIONS[0]];
        });
        setQuestionFeedback('');
    };

    const handleResetQuestionDrafts = () => {
        setQuestionDrafts([DEFAULT_WEEKLY_QUESTIONS[0]]);
        setQuestionFeedback('');
    };

    const handleSaveTeamQuestions = async () => {
        setQuestionFeedback('');
        const teamId = await ensureTeamContext();
        if (!teamId) {
            setQuestionFeedback('Team ID niet gevonden. Probeer opnieuw.');
            return;
        }

        const hasAtLeastOne = questionDrafts.some(question => question.trim());
        if (!hasAtLeastOne) {
            setQuestionFeedback('Voeg minimaal één vraag toe.');
            return;
        }

        const normalized = Array.from({ length: MAX_WEEKLY_QUESTIONS }, (_, idx) => (questionDrafts[idx] || '').trim());
        setSavingQuestions(true);
        try {
            const emptyResponses = normalized.map(() => '');
            const playersSnapshot = Array.isArray(players) ? players : [];

            const updateResults = await Promise.allSettled(playersSnapshot.map(async (player) => {
                const clonedEvaluations = JSON.parse(JSON.stringify(player.evaluations || {}));
                if (!clonedEvaluations.weekly_reflections) {
                    clonedEvaluations.weekly_reflections = {};
                }
                clonedEvaluations.weekly_reflections.responses = emptyResponses.slice();
                clonedEvaluations.weekly_reflections.updated_at = new Date().toISOString();
                clonedEvaluations.weekly_reflections.questions = normalized;

                const { error: playerError } = await supabase
                    .from('players')
                    .update({ evaluations: clonedEvaluations })
                    .eq('id', player.id)
                    .eq('team_id', teamId);

                if (playerError) {
                    throw new Error(playerError.message || 'Kon speler niet bijwerken');
                }

                return {
                    id: player.id,
                    evaluations: clonedEvaluations,
                    responses: emptyResponses.slice()
                };
            }));

            const successes = updateResults.filter(result => result.status === 'fulfilled');
            const failures = updateResults.filter(result => result.status === 'rejected');

            if (successes.length > 0) {
                const map = new Map(successes.map(({ value }) => [value.id, value]));
                setPlayers(prev => prev.map(player => {
                    const updated = map.get(player.id);
                    if (!updated) return player;
                    return {
                        ...player,
                        evaluations: updated.evaluations,
                        weekly_question_responses: updated.responses
                    };
                }));
            }

            const trimmedQuestions = normalized.filter(Boolean);
            setQuestionDrafts(trimmedQuestions.length ? trimmedQuestions : [DEFAULT_WEEKLY_QUESTIONS[0]]);

            if (typeof window !== 'undefined') {
                try {
                    window.localStorage.setItem(`team-${teamId}-reflection-questions`, JSON.stringify(normalized));
                } catch (storageError) {
                    console.warn('Kon reflectievraag-cache niet opslaan:', storageError);
                }
            }

            if (failures.length > 0) {
                console.warn('Niet alle spelersantwoorden konden worden gereset:', failures.map(f => f.reason));
                setQuestionFeedback('Vragen opgeslagen, maar sommige antwoorden konden niet worden gereset.');
            } else {
                if (!playersSnapshot.length) {
                    setQuestionFeedback('Vragen opgeslagen. Voeg spelers toe om antwoorden te verzamelen.');
                } else {
                    setQuestionFeedback('Vragen opgeslagen en naar spelers verstuurd.');
                }
            }
        } catch (err) {
            console.error('Opslaan van vragen mislukt:', err);
            const errorMessage = err?.message || err?.error_description || 'Opslaan mislukt. Probeer het opnieuw.';
            setQuestionFeedback(errorMessage);
        } finally {
            setSavingQuestions(false);
        }
    };

    const handleSaveQuestionResponses = async () => {
        if (userData.role !== 'player' || !activePlayer) return;

        setResponseFeedback('');
        const normalized = responseDrafts.map(answer => answer.trim());
        setSavingResponses(true);

        try {
            const clonedEvaluations = JSON.parse(JSON.stringify(activePlayer.evaluations || {}));
            if (!clonedEvaluations.weekly_reflections) {
                clonedEvaluations.weekly_reflections = {};
            }
            if (!Array.isArray(clonedEvaluations.weekly_reflections.questions)) {
                clonedEvaluations.weekly_reflections.questions = playerQuestionList;
            }
            clonedEvaluations.weekly_reflections.responses = normalized;
            clonedEvaluations.weekly_reflections.updated_at = new Date().toISOString();

            const { error } = await supabase
                .from('players')
                .update({ evaluations: clonedEvaluations })
                .eq('id', activePlayer.id)
                .eq('team_id', activePlayer.team_id || (userData?.team_id || userData?.teamId));

            if (error) {
                throw error;
            }

            setPlayers(prev => prev.map(player => player.id === activePlayer.id
                ? {
                    ...player,
                    evaluations: clonedEvaluations,
                    weekly_question_responses: normalized
                }
                : player));

            setResponseDrafts(normalized);
            setResponseFeedback('Antwoorden opgeslagen.');
        } catch (err) {
            console.error('Opslaan van antwoorden mislukt:', err);
            const errorMessage = err?.message || err?.error_description || 'Opslaan mislukt. Controleer je verbinding.';
            setResponseFeedback(errorMessage);
        } finally {
            setSavingResponses(false);
        }
    };
    
    const handleUpdateEvaluation = async (field, value) => {
        if (userData.role !== 'coach' || !activePlayer) return;

        // Optimistically update local state first
        setPlayers(prevPlayers =>
            prevPlayers.map(p => {
                if (p.id === activePlayer.id) {
                    const newEvaluations = JSON.parse(JSON.stringify(p.evaluations));
                    const path = field.split('.');
                    let currentLevel = newEvaluations[activeTab];
                    for (let i = 0; i < path.length - 1; i++) {
                        if (!currentLevel[path[i]]) {
                            currentLevel[path[i]] = {};
                        }
                        currentLevel = currentLevel[path[i]];
                    }
                    currentLevel[path[path.length - 1]] = value;
                    return { ...p, evaluations: newEvaluations };
                }
                return p;
            })
        );

        // Then update database
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
        const teamId = await ensureTeamContext();
        if (!teamId) {
            throw new Error('Team ID niet gevonden. Log opnieuw in.');
        }

        // Insert new homework
        const { data: homeworkData, error: insertError } = await supabase
            .from('custom_homework')
            .insert({ ...newHomework, team_id: teamId })
            .select()
            .single();

        if (insertError) {
            console.error('Error saving homework:', insertError);
            throw new Error(insertError?.message || 'Supabase insert mislukte');
        }

        // Automatically assign to team
        const currentHomeworkIds = teamData.assigned_homework_ids || [];
        const newHomeworkIds = [...currentHomeworkIds, homeworkData.id];

        const { error: updateError } = await supabase
            .from('teams')
            .update({ assigned_homework_ids: newHomeworkIds })
            .eq('id', teamId);

        if (updateError) {
            console.error('Error assigning homework:', updateError);
            throw new Error(updateError?.message || 'Supabase update mislukte');
        }

        // Manually update local state for immediate UI update
        setCustomHomework(prev => [...prev, homeworkData]);
        setTeamData(prev => ({ ...prev, assigned_homework_ids: newHomeworkIds }));
    };

    const handleDeleteHomework = async (homeworkId) => {
        const teamId = await ensureTeamContext();
        if (!teamId) {
            throw new Error('Team ID niet gevonden. Log opnieuw in.');
        }

        // Remove from team's assigned homework
        const currentHomeworkIds = teamData.assigned_homework_ids || [];
        const newHomeworkIds = currentHomeworkIds.filter(id => id !== homeworkId);

        const { error: updateError } = await supabase
            .from('teams')
            .update({ assigned_homework_ids: newHomeworkIds })
            .eq('id', teamId);

        if (updateError) {
            console.error('Error updating team homework:', updateError);
            throw new Error(updateError?.message || 'Supabase update mislukte');
        }

        // Delete the homework
        const { error: deleteError } = await supabase
            .from('custom_homework')
            .delete()
            .eq('id', homeworkId);

        if (deleteError) {
            console.error('Error deleting homework:', deleteError);
            throw new Error(deleteError?.message || 'Supabase delete mislukte');
        }

        // Update local state
        setCustomHomework(prev => prev.filter(hw => hw.id !== homeworkId));
        setTeamData(prev => ({ ...prev, assigned_homework_ids: newHomeworkIds }));
    };


    const handleToggleHomeworkStatus = async (homeworkId) => {
        if (userData.role !== 'player' || !activePlayer) return;

        const isCompleted = activePlayer.completed_homework_ids.includes(homeworkId);
        const newCompletedIds = isCompleted
            ? activePlayer.completed_homework_ids.filter(id => id !== homeworkId)
            : [...activePlayer.completed_homework_ids, homeworkId];

        // Optimistically update local state first
        setPlayers(prevPlayers =>
            prevPlayers.map(p =>
                p.id === userData.uid
                    ? { ...p, completed_homework_ids: newCompletedIds }
                    : p
            )
        );

        // Then update database
        const { error } = await supabase
            .from('players')
            .update({ completed_homework_ids: newCompletedIds })
            .eq('id', userData.uid);

        if (error) {
            console.error('Error toggling homework status:', error);
            // Revert on error
            setPlayers(prevPlayers =>
                prevPlayers.map(p =>
                    p.id === userData.uid
                        ? { ...p, completed_homework_ids: activePlayer.completed_homework_ids }
                        : p
                )
            );
        }
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
    
    const handleCopyTeamId = async () => {
        try {
            const teamId = await ensureTeamContext();
            if (!teamId) {
                alert('Team ID niet beschikbaar. Log opnieuw in als coach.');
                return;
            }
            const textArea = document.createElement("textarea");
            textArea.value = teamId;
            textArea.style.position = "fixed";
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
        } catch (error) {
            console.error('Kon Team ID niet kopiëren:', error);
            alert(`Team ID ophalen mislukt.\n\n${error?.message || 'Onbekende fout'}`);
        }
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


    if (isLoadingData) {
         return (
             <div className="flex flex-col items-center justify-center min-h-screen text-center">
                 <Loader2 className="animate-spin h-12 w-12 text-[--neon-color] mb-4"/>
                 <h2 className="text-2xl font-bold">Laden van spelerdata...</h2>
                 <p className="text-gray-400">Een ogenblik geduld.</p>
             </div>
         );
    }

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
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <HomeworkCreatorModal
                isVisible={isHomeworkVisible}
                onClose={() => setIsHomeworkVisible(false)}
                onSave={handleSaveHomework}
                onDelete={handleDeleteHomework}
                customHomework={customHomework}
                players={players}
                assignedHomeworkIds={teamData.assigned_homework_ids || []}
            />
            <ReflectionManagerModal
                isVisible={isReflectionVisible}
                onClose={() => {
                    setIsReflectionVisible(false);
                    setQuestionFeedback('');
                }}
                questions={questionDrafts}
                onQuestionChange={handleQuestionDraftChange}
                onAddQuestion={handleAddQuestionField}
                onRemoveQuestion={handleRemoveQuestionField}
                onResetQuestions={handleResetQuestionDrafts}
                onSaveQuestions={handleSaveTeamQuestions}
                savingQuestions={savingQuestions}
                feedback={questionFeedback}
                players={players}
                questionLimit={MAX_WEEKLY_QUESTIONS}
                currentQuestions={coachVisibleQuestions}
            />
            <TestsModal isVisible={isTestsVisible} onClose={() => setIsTestsVisible(false)} player={activePlayer} period={activeTab} onUpdate={handleUpdateEvaluation} />
            <AddPlayerModal isVisible={isAddPlayerVisible} onClose={() => setIsAddPlayerVisible(false)} onAdd={handleAddPlayer} teamId={userData?.team_id || userData?.teamId} />
            <PlayerProfileModal isVisible={!!editingPlayer} onClose={() => setEditingPlayer(null)} player={editingPlayer} teamId={userData?.team_id || userData?.teamId} onSave={handleSaveProfile} />
            <CoachProfileModal isVisible={isCoachProfileVisible} onClose={() => setIsCoachProfileVisible(false)} teamData={teamData} onSave={handleSaveCoachProfile} />

            <ConfirmModal isVisible={confirmRemove.isVisible} onClose={() => setConfirmRemove({ isVisible: false, playerId: null })} onConfirm={executeRemovePlayer} title="Speler Verwijderen">
                Weet je zeker dat je deze speler wilt verwijderen?
            </ConfirmModal>

            <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                 <div className="flex items-center gap-3">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-wider text-center" style={{ textShadow: `0 0 8px ${NEON_COLOR}` }}>{teamData.team_name || 'PLAYER PERFORMANCE HUB'}</h1>
                    {userData.role === 'coach' && (
                        <button onClick={() => setIsCoachProfileVisible(true)} className="text-gray-400 hover:text-white transition-colors">
                            <Edit size={18}/>
                        </button>
                    )}
                 </div>
                <div className="flex flex-wrap justify-center items-center gap-2">
                    {userData.role === 'coach' && (
                        <>
                        <div className="flex items-center gap-2 text-sm p-2 bg-gray-800/50 rounded-lg border border-gray-700">
                           <span className="text-gray-400">Team ID:</span>
                           <strong className="text-white">{userData?.team_id || userData?.teamId}</strong>
                           <button onClick={handleCopyTeamId} className="p-1 hover:bg-gray-700 rounded-md">
                               {copied ? <CheckCircle2 size={16} className="text-green-400"/> : <Copy size={16} />}
                           </button>
                        </div>
                        <ToolButton onClick={() => setIsAddPlayerVisible(true)}><Plus size={16}/> Speler Toevoegen</ToolButton>
                        <ToolButton onClick={() => setIsHomeworkVisible(true)}><ClipboardList size={16}/> Huiswerk</ToolButton>
                        <ToolButton onClick={() => setIsReflectionVisible(true)}><HelpCircle size={16}/> Reflecties</ToolButton>
                        </>
                    )}
                    <ToolButton onClick={async () => {
                        if (userData.role === 'coach') {
                           try {
                               await supabase.auth.signOut();
                               // Force reload to clear all state
                               window.location.reload();
                           } catch (error) {
                               console.error("Error signing out:", error);
                               // Force reload anyway
                               window.location.reload();
                           }
                        } else {
                           onPlayerLogout();
                        }
                    }}><LogOut size={16} /> Uitloggen</ToolButton>
                </div>
            </header>

            {userData.role === 'coach' && (
                <motion.div className="mb-6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                    <Card className="bg-gray-900/70 border-gray-800/70">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                    <ShieldCheck size={18} className="text-[--neon-color]" /> Coach vragen
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    {coachVisibleQuestions.filter(q => (q || '').trim()).length > 0
                                        ? 'Bekijk en beheer de vragen voor deze week.'
                                        : 'Voeg vragen toe zodat spelers kunnen reflecteren.'}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <span className="px-2 py-1 bg-gray-800/80 rounded-lg border border-gray-700">{coachVisibleQuestions.filter(q => (q || '').trim()).length} vragen</span>
                                    <span className="px-2 py-1 bg-gray-800/80 rounded-lg border border-gray-700">{reflectionStats.playersAnswered}/{players.length} spelers reageerden</span>
                                </div>
                                <ToolButton onClick={() => setIsReflectionVisible(true)} className="whitespace-nowrap">
                                    <HelpCircle size={16} /> Beheer reflecties
                                </ToolButton>
                            </div>
                        </div>
                        {coachVisibleQuestions.filter(q => (q || '').trim()).length > 0 && (
                            <div className="mt-4 grid gap-2 md:grid-cols-3">
                                {coachVisibleQuestions.filter(q => (q || '').trim()).map((question, idx) => (
                                    <div key={`coach-question-preview-${idx}`} className="p-3 bg-gray-800/40 rounded-lg border border-gray-800/70">
                                        <p className="text-xs uppercase tracking-wide text-[--neon-color]">Vraag {idx + 1}</p>
                                        <p className="text-sm text-gray-200 mt-1 line-clamp-2">{question}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </motion.div>
            )}

            {userData.role === 'player' && (visibleQuestions.length === 0 || responseDrafts.slice(0, visibleQuestions.length).every(answer => (answer || '').trim())) && (
                <motion.div className="mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <Card className="bg-gray-900/70 border-gray-800/70 text-gray-400 text-sm">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-[--neon-color]" />
                            <span>Bedankt voor je antwoorden! Je coach ziet ze meteen.</span>
                        </div>
                    </Card>
                </motion.div>
            )}

            {userData.role === 'player' && (
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    {['overzicht', 'huiswerk'].map(tab => {
                        const isActive = playerSection === tab;
                        const isHomeworkTab = tab === 'huiswerk';
                        const hasPending = isHomeworkTab && playerPendingHomeworkCount > 0;
                        const baseClasses = 'px-4 py-2 rounded-lg text-sm font-semibold transition-all border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900';
                        const activeClasses = isActive
                            ? 'bg-[--neon-color] text-black border-[--neon-color]'
                            : 'bg-gray-900/60 text-gray-300 border-gray-700 hover:border-[--neon-color]/60';
                        const pulseClasses = hasPending && !isActive ? 'shadow-[0_0_15px_rgba(0,255,157,0.35)] border-[--neon-color]/80 text-white' : '';
                        const label = tab === 'overzicht' ? 'Overzicht' : 'Huiswerk';
                        return (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setPlayerSection(tab)}
                                className={`${baseClasses} ${activeClasses} ${pulseClasses}`.trim()}
                            >
                                {label}
                                {hasPending && <span className="ml-2 inline-flex items-center justify-center min-w-[1.5rem] h-[1.5rem] rounded-full bg-black/60 text-[--neon-color] text-xs">{playerPendingHomeworkCount}</span>}
                            </button>
                        );
                    })}
                </div>
            )}

            {isPlayerHomeworkView && (
                <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <PlayerHomeworkCard
                        player={activePlayer}
                        customHomework={customHomework}
                        assignedHomeworkIds={teamData.assigned_homework_ids || []}
                        onToggleStatus={handleToggleHomeworkStatus}
                        highlight={playerPendingHomeworkCount > 0}
                        pendingCount={playerPendingHomeworkCount}
                    />
                </motion.div>
            )}

            {userData.role === 'player' && visibleQuestions.length > 0 && (
                <motion.div className="mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <Card>
                        <details
                            className="group"
                            open={!responseDrafts.slice(0, visibleQuestions.length).every(answer => (answer || '').trim())}
                            onToggle={(e) => {
                                if (!e.target.open && !responseDrafts.slice(0, visibleQuestions.length).every(answer => (answer || '').trim())) {
                                    e.preventDefault();
                                }
                            }}
                        >
                            <summary className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer">
                                <div>
                                    <h3 className="text-xl font-bold flex items-center gap-2"><ShieldCheck size={20} className="text-[--neon-color]" /> Coach Vragen</h3>
                                    <p className="text-sm text-gray-400">
                                        {responseDrafts.slice(0, visibleQuestions.length).every(answer => (answer || '').trim())
                                            ? 'Je antwoorden zijn verzonden. Pas ze gerust aan.'
                                            : 'Beantwoord de vragen van je coach voor deze week.'}
                                    </p>
                                </div>
                                <span className="text-sm text-gray-400">
                                    {Math.min(visibleQuestions.length, responseDrafts.length)} vragen ·
                                    {responseDrafts.slice(0, visibleQuestions.length).filter(answer => (answer || '').trim()).length}/{visibleQuestions.length} ingevuld
                                </span>
                            </summary>
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
                                            rows={3}
                                            textareaClassName="min-h-[96px]"
                                        />
                                        <p className="text-xs text-gray-500">
                                            {responseDrafts[idx]?.trim() ? 'Je antwoord is opgeslagen.' : 'Nog geen antwoord ingevoerd.'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button type="button" onClick={handleSaveQuestionResponses} disabled={savingResponses} className="px-4 py-2 rounded-lg bg-[--neon-color] text-black font-semibold hover:opacity-90 transition-opacity flex items-center disabled:opacity-50">
                                    {savingResponses ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                                    Verstuur antwoorden
                                </button>
                            </div>
                        </details>
                        {responseFeedback && <p className="text-sm text-gray-400 mt-2">{responseFeedback}</p>}
                    </Card>
                </motion.div>
            )}

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
            
{isPlayerHomeworkView ? (
                <></>
            ) : activePlayer ? (
                 <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                                    {skillKeys.map(key => {
                                        const helpTexts = {
                                            snelheid: "Beoordeel de explosiviteit, acceleratie en topsnelheid van de speler tijdens sprint en bewegingen.",
                                            passing: "Evalueer de nauwkeurigheid, timing en variatie in korte en lange passes.",
                                            techniek: "Beoordeel balcontrole, traptechniek, dribbelen en andere technische vaardigheden.",
                                            schot: "Evalueer schietvermogen, kracht, nauwkeurigheid en afwerking van kansen.",
                                            verdedigen: "Beoordeel tackling, positiespel, duels en verdedigende besluitvorming.",
                                            inzicht: "Evalueer spelinzicht, positiekeuze, overzicht en tactisch begrip.",
                                            mentaliteit: "Beoordeel inzet, doorzettingsvermogen, teamgeest en mentale weerbaarheid."
                                        };
                                        return (
                                            <Slider
                                                key={key}
                                                label={key}
                                                value={activePlayer.evaluations[activeTab]?.skills[key] || 5}
                                                onChange={e => handleUpdateEvaluation(`skills.${key}`, parseInt(e.target.value))}
                                                disabled={userData.role !== 'coach'}
                                                help={helpTexts[key]}
                                            />
                                        );
                                    })}
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
    );
}


// --- MAIN APP COMPONENT ---
function PlayerPerformanceHub() {
  const [session, setSession] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authSubscription = null;
    let loadingTimeout = null;

    const initAuth = async (retryCount = 0) => {
      const maxRetries = 2;
      const retryDelay = 1000;

      try {
        // First check for player session (takes priority)
        const playerSession = localStorage.getItem('playerSession');
        if (playerSession) {
          try {
            const parsedSession = JSON.parse(playerSession);
            if (parsedSession.role === 'player' && parsedSession.uid) {
              if (mounted) {
                // Clear timeout since we found a valid session
                if (loadingTimeout) {
                  clearTimeout(loadingTimeout);
                  loadingTimeout = null;
                }
                setSession({ user: { id: parsedSession.uid }});
                setUserData(parsedSession);
                setLoading(false);
              }
              return; // Don't check Supabase auth if player is logged in
            } else {
              localStorage.removeItem('playerSession');
            }
          } catch (e) {
            localStorage.removeItem('playerSession');
          }
        }

        // Check Supabase auth session only if no player session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error('Error getting Supabase session:', sessionError);
          if (mounted) {
            setUserData(null);
            setSession(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user) {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            let profile = data;

            if (error && error.code !== 'PGRST116') {
              throw error;
            }

            if (!profile) {
              let teamId = null;

              try {
                const { data: teamRows } = await supabase
                  .from('teams')
                  .select('id')
                  .eq('coach_id', session.user.id);
                if (Array.isArray(teamRows) && teamRows.length > 0) {
                  teamId = teamRows[0].id;
                }
              } catch (teamLookupError) {
                console.warn('Could not retrieve coach team during profile fallback:', teamLookupError);
              }

              try {
                const { data: createdProfile } = await supabase
                  .from('profiles')
                  .insert({ id: session.user.id, role: 'coach', team_id: teamId })
                  .select()
                  .single();
                if (createdProfile) {
                  profile = createdProfile;
                }
              } catch (createProfileError) {
                console.warn('Could not create coach profile, falling back to local defaults:', createProfileError);
              }

              if (!profile) {
                profile = { id: session.user.id, role: 'coach', team_id: teamId };
              }
            }

            if (mounted) {
              if (loadingTimeout) {
                clearTimeout(loadingTimeout);
                loadingTimeout = null;
              }
              setUserData(profile);
              setSession(session);
              setLoading(false);
            }
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError);
            if (mounted) {
              const fallbackProfile = { id: session.user.id, role: 'coach', team_id: null };
              setUserData(fallbackProfile);
              setSession(session);
              setLoading(false);
            }
          }
        } else {
          if (mounted) {
            // Clear timeout since we determined user is not logged in
            if (loadingTimeout) {
              clearTimeout(loadingTimeout);
              loadingTimeout = null;
            }
            setUserData(null);
            setSession(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Init auth error:', error);
        if (mounted) {
          // Retry logic for network errors
          if (retryCount < maxRetries && (error.message?.includes('fetch') || error.message?.includes('network'))) {
            console.log(`Retrying authentication (${retryCount + 1}/${maxRetries})...`);
            setTimeout(() => {
              if (mounted) {
                initAuth(retryCount + 1);
              }
            }, retryDelay * (retryCount + 1));
            return;
          }

          // Clear timeout on final error
          if (loadingTimeout) {
            clearTimeout(loadingTimeout);
            loadingTimeout = null;
          }
          setUserData(null);
          setSession(null);
          setLoading(false);
        }
      } finally {
        if (mounted && retryCount >= maxRetries) {
          // Clear the timeout when authentication completes (success or failure)
          if (loadingTimeout) {
            clearTimeout(loadingTimeout);
            loadingTimeout = null;
          }
          setLoading(false);
        }
      }
    };

    // Set a timeout to prevent infinite loading state
    loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Authentication timeout reached, showing login screen');
        setLoading(false);
        setUserData(null);
        setSession(null);
      }
    }, 10000); // 10 second timeout

    initAuth();

    // Listen for Supabase auth changes (only for coach accounts)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Ignore auth changes if player is logged in
      const playerSession = localStorage.getItem('playerSession');
      if (playerSession) return;

      if (event === 'SIGNED_OUT') {
        setUserData(null);
        setSession(null);
        return;
      }

      if (session?.user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          let profile = data;

          if (error && error.code !== 'PGRST116') {
            throw error;
          }

          if (!profile) {
            let teamId = null;

            try {
              const { data: teamRows } = await supabase
                .from('teams')
                .select('id')
                .eq('coach_id', session.user.id);
              if (Array.isArray(teamRows) && teamRows.length > 0) {
                teamId = teamRows[0].id;
              }
            } catch (teamLookupError) {
              console.warn('Could not retrieve coach team on auth change:', teamLookupError);
            }

            try {
              const { data: createdProfile } = await supabase
                .from('profiles')
                .insert({ id: session.user.id, role: 'coach', team_id: teamId })
                .select()
                .single();
              if (createdProfile) {
                profile = createdProfile;
              }
            } catch (createProfileError) {
              console.warn('Could not create coach profile on auth change, falling back to defaults:', createProfileError);
            }

            if (!profile) {
              profile = { id: session.user.id, role: 'coach', team_id: teamId };
            }
          }

          if (mounted) {
            setUserData(profile);
            setSession(session);
          }
        } catch (profileError) {
          console.error('Error in auth state change profile fetch:', profileError);
          if (mounted) {
            setUserData({ id: session.user.id, role: 'coach', team_id: null });
            setSession(session);
          }
        }
      } else {
        if (mounted) {
          setUserData(null);
          setSession(null);
        }
      }
    });

    authSubscription = subscription;

    return () => {
      mounted = false;
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id || userData?.role !== 'coach' || userData?.team_id) {
      return;
    }

    let cancelled = false;

    const fetchCoachTeam = async () => {
      try {
        const { data, error } = await supabase
          .from('teams')
          .select('id, team_name, team_class')
          .eq('coach_id', session.user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error && error.code !== 'PGRST116') {
          console.warn('Kon teamgegevens niet ophalen voor coach:', error);
          return;
        }

        if (data?.id) {
          setUserData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              team_id: data.id,
              teamId: data.id,
              team_name: data.team_name ?? prev.team_name,
              team_class: data.team_class ?? prev.team_class
            };
          });
        }
      } catch (teamError) {
        if (!cancelled) {
          console.warn('Team lookup fout:', teamError);
        }
      }
    };

    fetchCoachTeam();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, userData?.role, userData?.team_id]);

  const handlePlayerLogin = (playerData) => {
      localStorage.setItem('playerSession', JSON.stringify(playerData));
      setSession({ user: { id: playerData.uid }});
      setUserData(playerData);
      setLoading(false);
  };

  const handlePlayerLogout = () => {
      localStorage.removeItem('playerSession');
      setSession(null);
      setUserData(null);
  };

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

export default function TopSpelerApp() {
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    const storedSession = localStorage.getItem('playerSession');
    if (storedSession && !showApp) {
      setShowApp(true);
    }
  }, [showApp]);

  useEffect(() => {
    document.title = showApp ? 'TopSpeler | Dashboard' : 'TopSpeler | Talentontwikkeling';
  }, [showApp]);

  if (showApp) {
    return <PlayerPerformanceHub />;
  }

  return <TopSpelerLanding onStartApp={() => setShowApp(true)} />;
}

