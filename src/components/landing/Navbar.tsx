import { useState, useEffect } from 'react'
import { Menu, X, LogIn } from 'lucide-react'

const navItems = [
  { label: 'Product', href: '#features' },
  { label: 'Het Verhaal', href: '#verhaal' },
  { label: 'Tarieven', href: '#tarieven' },
  { label: 'Veelgestelde vragen', href: '#faq' },
]

export default function Navbar({ onLogin }: { onLogin: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-dark-900/95 backdrop-blur-md border-b border-white/5' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-neon flex items-center justify-center text-dark-900 font-black text-sm">
              SK
            </div>
            <span className="font-black text-xl tracking-tight text-white group-hover:text-neon transition-colors">
              SKILLKAART
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-white/60 hover:text-white transition-colors font-medium"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-semibold text-sm border border-white/20 text-white/70 hover:border-neon/50 hover:text-neon transition-all"
            >
              <LogIn size={15} />
              Inloggen
            </button>
            <a
              href="#tarieven"
              className="neon-btn px-5 py-2.5 rounded-lg font-bold text-sm inline-flex items-center gap-1"
            >
              Gratis Demo ➔
            </a>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-white/70 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-dark-800/98 backdrop-blur-md border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="text-white/70 hover:text-white py-2 font-medium transition-colors"
              >
                {item.label}
              </a>
            ))}
            <button
              onClick={() => { setMenuOpen(false); onLogin(); }}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm border border-white/20 text-white/70 mt-1"
            >
              <LogIn size={15} />
              Inloggen
            </button>
            <a
              href="#tarieven"
              onClick={() => setMenuOpen(false)}
              className="neon-btn px-5 py-3 rounded-lg font-bold text-sm text-center mt-1"
            >
              Gratis Demo ➔
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
