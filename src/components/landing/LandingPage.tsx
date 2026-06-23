import Navbar from './Navbar'
import Hero from './Hero'
import Problems from './Problems'
import Features from './Features'
import Stats from './Stats'
import Story from './Story'
import Pricing from './Pricing'
import FAQ from './FAQ'
import Footer from './Footer'

export default function LandingPage({ onLogin, onParentLogin }: { onLogin: () => void; onParentLogin?: () => void }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar onLogin={onLogin} onParentLogin={onParentLogin} />
      <main>
        <Hero />
        <Problems />
        <Features />
        <Stats />
        <Story />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
