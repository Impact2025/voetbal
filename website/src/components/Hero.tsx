import PhoneMockup from './PhoneMockup'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden grid-bg">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon/3 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon/20 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 lg:pt-32 lg:pb-24 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-neon/10 border border-neon/30 rounded-full px-4 py-1.5">
              <div className="w-2 h-2 bg-neon rounded-full animate-pulse" />
              <span className="text-neon text-xs font-semibold uppercase tracking-wider">
                Nieuw · Seizoen 2026/2027
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
                Geef jouw jeugdspelers{' '}
                <span className="neon-text">de ultieme profervaring.</span>
                <br />
                <span className="text-white/90">Volledig automatisch.</span>
              </h1>
            </div>

            {/* Subheadline */}
            <p className="text-lg text-white/60 leading-relaxed max-w-xl">
              Het eerste Nederlandse platform dat AI-gedreven skill tracking, persoonlijke dashboards
              en de voetbalexpertise van Ultimate Football Academy combineert voor teams van{' '}
              <span className="text-white font-semibold">7 tot 12 jaar</span>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#tarieven"
                className="neon-btn px-8 py-4 rounded-xl font-bold text-base text-center inline-flex items-center justify-center gap-2"
              >
                Vraag een gratis demo aan ➔
              </a>
              <a
                href="#features"
                className="px-8 py-4 rounded-xl font-bold text-base text-center border border-white/20 text-white hover:border-neon/40 hover:text-neon transition-all inline-flex items-center justify-center gap-2"
              >
                Bekijk hoe het werkt ↓
              </a>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <span className="text-neon text-lg">✓</span>
                <span>Inclusief UFA-curriculum</span>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <span className="text-neon text-lg">✓</span>
                <span>AVG-compliant</span>
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <span className="text-neon text-lg">✓</span>
                <span>Vanaf €150/jaar</span>
              </div>
            </div>
          </div>

          {/* Right: Phone mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="animate-float">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-900 to-transparent pointer-events-none" />
    </section>
  )
}
