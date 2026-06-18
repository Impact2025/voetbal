import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Problems from './components/Problems'
import Features from './components/Features'
import Stats from './components/Stats'
import Story from './components/Story'
import Pricing from './components/Pricing'
import FAQ from './components/FAQ'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Navbar />
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
