const skills = [
  { label: 'Techniek & Balbeheersing', val: 8 },
  { label: 'Snelheid & Wendbaarheid', val: 8 },
  { label: 'Spelinzicht & Positie', val: 9 },
  { label: 'Passing & Samenspel', val: 7 },
]

export default function HeroVisual() {
  return (
    <div className="w-full max-w-md mx-auto lg:mx-0">
      {/* Illustrated pitch panel */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
        <div
          className="relative h-44 sm:h-52"
          style={{
            background:
              'radial-gradient(120% 140% at 30% 20%, #0f3d2e 0%, #0a2e22 45%, #06231a 100%)',
          }}
        >
          {/* Pitch lines */}
          <svg viewBox="0 0 400 220" className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
            <rect x="8" y="8" width="384" height="204" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            <line x1="200" y1="8" x2="200" y2="212" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="200" cy="110" r="32" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            <rect x="8" y="60" width="46" height="100" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            <rect x="346" y="60" width="46" height="100" fill="none" stroke="#ffffff" strokeWidth="1.5" />
          </svg>

          {/* Top labels */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full pl-1.5 pr-3 py-1">
            <span className="w-5 h-5 rounded-full bg-neon/90 flex items-center justify-center text-[10px]">⚽</span>
            <span className="text-white text-[11px] font-semibold">Training &amp; Ontwikkeling · O11</span>
          </div>
          <div className="absolute top-3 right-3 bg-neon text-dark-900 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
            UFA-partner
          </div>

          {/* Bottom caption */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white/70 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
            Laatste evaluatie: vandaag
          </div>
        </div>
      </div>

      {/* Floating player-card widget: negative top-margin lets it overlap the
          bottom of the pitch panel without ever covering its top badges */}
      <div className="relative -mt-10 mx-4 sm:mx-8 bg-white rounded-2xl border border-slate-200 shadow-2xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-black text-sm text-slate-900">Thomas</p>
            <p className="text-slate-400 text-xs">Middenvelder · O11 · Evaluatie II</p>
          </div>
          <div className="flex items-center gap-1 bg-neon/10 border border-neon/30 rounded-lg px-2 py-1">
            <span className="text-neon-ink font-black text-sm">7.8</span>
            <span className="text-slate-400 text-[10px]">/10</span>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          {skills.map((s) => (
            <div key={s.label}>
              <div className="flex justify-between mb-0.5">
                <span className="text-slate-500 text-[10px]">{s.label}</span>
                <span className="text-neon-ink text-[10px] font-bold">{s.val}/10</span>
              </div>
              <div className="bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-neon to-neon-dark rounded-full h-1.5"
                  style={{ width: `${s.val * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
          <p className="text-[10px] font-semibold text-neon-ink uppercase tracking-wide mb-1">AI-inzicht &amp; oefensuggestie</p>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Focus deze week op je passing in kleine ruimtes. Oefen de wandpass 10 minuten per dag.
          </p>
        </div>
      </div>
    </div>
  )
}
