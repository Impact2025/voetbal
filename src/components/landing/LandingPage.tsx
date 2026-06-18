import Navbar from './Navbar'
import Hero from './Hero'
import Problems from './Problems'
import Features from './Features'
import Stats from './Stats'
import Story from './Story'
import Pricing from './Pricing'
import FAQ from './FAQ'
import Footer from './Footer'

export default function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Navbar onLogin={onLogin} />
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
