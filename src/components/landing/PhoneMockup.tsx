// Radar chart SVG for the 7 skills
const skills = [
  { label: 'Snelheid', value: 0.82 },
  { label: 'Passing', value: 0.74 },
  { label: 'Techniek', value: 0.88 },
  { label: 'Schot', value: 0.65 },
  { label: 'Verdedigen', value: 0.70 },
  { label: 'Inzicht', value: 0.78 },
  { label: 'Mentaliteit', value: 0.90 },
]

function RadarChart() {
  const size = 200
  const cx = size / 2
  const cy = size / 2
  const radius = 72
  const n = skills.length

  const angleStep = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2

  const getPoint = (index: number, r: number) => {
    const angle = startAngle + index * angleStep
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  }

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1]

  // Skill polygon
  const dataPoints = skills.map((s, i) => getPoint(i, s.value * radius))
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      {/* Grid rings */}
      {rings.map((r) => {
        const pts = skills.map((_, i) => getPoint(i, r * radius))
        return (
          <polygon
            key={r}
            points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#00FF9D"
            strokeWidth="0.5"
            strokeOpacity="0.2"
          />
        )
      })}

      {/* Axis lines */}
      {skills.map((_, i) => {
        const outer = getPoint(i, radius)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={outer.x}
            y2={outer.y}
            stroke="#00FF9D"
            strokeWidth="0.5"
            strokeOpacity="0.2"
          />
        )
      })}

      {/* Data polygon */}
      <polygon
        points={polygon}
        fill="#00FF9D"
        fillOpacity="0.15"
        stroke="#00FF9D"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#00FF9D" />
      ))}

      {/* Labels */}
      {skills.map((s, i) => {
        const labelPt = getPoint(i, radius + 16)
        return (
          <text
            key={i}
            x={labelPt.x}
            y={labelPt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="7.5"
            fill="#ffffff"
            fillOpacity="0.8"
            fontWeight="500"
          >
            {s.label}
          </text>
        )
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r="2" fill="#00FF9D" fillOpacity="0.5" />
    </svg>
  )
}

export default function PhoneMockup() {
  return (
    <div className="relative flex justify-center items-center">
      {/* Glow effect behind phone */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-96 bg-neon/10 blur-3xl rounded-full" />
      </div>

      {/* Phone frame */}
      <div
        className="relative phone-mockup rounded-[2.5rem] w-[260px] overflow-hidden"
        style={{ aspectRatio: '9/19.5' }}
      >
        {/* Status bar */}
        <div className="bg-dark-800 px-5 pt-3 pb-1 flex justify-between items-center">
          <span className="text-white/50 text-[9px]">9:41</span>
          <div className="w-20 h-4 bg-dark-600 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-1" />
          <div className="flex gap-1 items-center">
            <div className="w-3 h-2 border border-white/40 rounded-[2px] relative">
              <div className="absolute inset-[1px] right-[1px] bg-white/40 rounded-[1px] w-[70%]" />
            </div>
          </div>
        </div>

        {/* App header */}
        <div className="bg-dark-800 px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <div>
            <p className="text-white/40 text-[9px] uppercase tracking-widest">Speler Dashboard</p>
            <p className="text-white font-bold text-sm">Thomas · O11</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-neon/20 border border-neon/40 flex items-center justify-center">
            <span className="text-neon text-xs font-bold">T</span>
          </div>
        </div>

        {/* Period tabs */}
        <div className="bg-dark-700 px-3 py-2 flex gap-1">
          {['Check-in 1', 'Check-in 2', 'Check-in 3'].map((p, i) => (
            <div
              key={p}
              className={`flex-1 text-center text-[8px] py-1 rounded font-semibold ${
                i === 1
                  ? 'bg-neon text-dark-900'
                  : 'bg-dark-600 text-white/40'
              }`}
            >
              {p}
            </div>
          ))}
        </div>

        {/* Radar chart */}
        <div className="bg-dark-800 px-2 py-1">
          <p className="text-white/40 text-[8px] text-center uppercase tracking-widest mb-1">Skillprofiel</p>
          <div className="w-full" style={{ aspectRatio: '1/1' }}>
            <RadarChart />
          </div>
        </div>

        {/* Overall score */}
        <div className="bg-dark-700 mx-3 my-2 rounded-xl px-3 py-2 flex items-center justify-between border border-neon/20">
          <div>
            <p className="text-white/40 text-[8px]">Totaalscore</p>
            <p className="text-neon font-black text-lg leading-none">7.8</p>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-[8px]">Vorige</p>
            <p className="text-white/60 text-sm font-bold">7.2</p>
          </div>
          <div className="bg-neon/10 border border-neon/30 rounded-lg px-2 py-1">
            <span className="text-neon text-[10px] font-bold">+0.6 ↑</span>
          </div>
        </div>

        {/* Skills mini bars */}
        <div className="px-3 pb-3 space-y-1.5">
          {skills.slice(0, 4).map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="text-white/50 text-[8px] w-14">{s.label}</span>
              <div className="flex-1 bg-dark-600 rounded-full h-1.5">
                <div
                  className="bg-neon rounded-full h-1.5"
                  style={{ width: `${s.value * 100}%` }}
                />
              </div>
              <span className="text-neon text-[8px] font-bold w-5 text-right">
                {Math.round(s.value * 10)}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom nav hint */}
        <div className="bg-dark-900 border-t border-white/5 flex justify-around py-2 px-4">
          {['⚡', '📊', '📚', '💬'].map((icon, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-0.5 ${i === 1 ? 'opacity-100' : 'opacity-30'}`}
            >
              <span className="text-sm">{icon}</span>
              {i === 1 && <div className="w-1 h-1 bg-neon rounded-full" />}
            </div>
          ))}
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -right-4 top-20 bg-dark-700 border border-neon/30 rounded-xl px-3 py-2 shadow-xl">
        <p className="text-white/50 text-[9px]">AI Feedback</p>
        <p className="text-neon font-bold text-xs">Gegenereerd ✓</p>
      </div>

      {/* Floating badge 2 */}
      <div className="absolute -left-4 bottom-28 bg-dark-700 border border-neon/30 rounded-xl px-3 py-2 shadow-xl">
        <p className="text-white/50 text-[9px]">Groei dit seizoen</p>
        <p className="text-neon font-bold text-xs">+18% ↑</p>
      </div>
    </div>
  )
}
