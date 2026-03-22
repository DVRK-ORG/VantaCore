import { Header } from './components/Header'
import { HeroSection } from './components/HeroSection'
import { DropZone } from './components/DropZone'
import { TextInput } from './components/TextInput'
import { CompressButton } from './components/CompressButton'
import { MetricsDashboard } from './components/MetricsDashboard'
import { OutputSection } from './components/OutputSection'
import { HowItWorks } from './components/HowItWorks'
import { WhoIsItFor } from './components/WhoIsItFor'
import { Footer } from './components/Footer'

function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#E8E8E8', position: 'relative' }}>
      <Header />
      <HeroSection />

      {/* Tool Section */}
      <section id="tool" style={{ padding: '96px 0', position: 'relative' }}>
        <div className="container-main">
          <div className="text-center mb-14">
            <h2 className="font-orbitron font-bold tracking-[3px] uppercase mb-3" style={{ fontSize: 'clamp(20px, 3vw, 32px)' }}>
              Feed The <span className="text-blood-ruby">Singularity</span>
            </h2>
            <p className="font-crimson text-muted-steel max-w-[600px] mx-auto leading-[1.6]" style={{ fontSize: 'clamp(15px, 1.6vw, 18px)' }}>
              Drop a file or paste your text below
            </p>
          </div>

          <DropZone />
          <TextInput />
          <CompressButton />
          <MetricsDashboard />
          <OutputSection />
        </div>
      </section>

      <HowItWorks />
      <WhoIsItFor />
      <Footer />
    </div>
  )
}

export default App
