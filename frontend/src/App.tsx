import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { HeroSection } from './components/HeroSection'
import { DropZone } from './components/DropZone'
import { TextInput } from './components/TextInput'
import { ImportCapsuleButton } from './components/ImportCapsuleButton'
import { CompressButton } from './components/CompressButton'
import { MetricsDashboard } from './components/MetricsDashboard'
import { OutputSection } from './components/OutputSection'
import { BenchmarkProof } from './components/BenchmarkProof'
import { HowItWorks } from './components/HowItWorks'
import { WhoIsItFor } from './components/WhoIsItFor'
import { ProductPromise } from './components/ProductPromise'
import { Footer } from './components/Footer'
import { HistorySidebar } from './components/HistorySidebar'
import { MemoryLabArticle, MemoryLabIndex } from './pages/MemoryLab'
import { usePageMeta } from './utils/pageMeta'

function getCurrentPath() {
  const path = window.location.pathname

  if (path !== '/' && path.endsWith('/')) {
    return path.slice(0, -1)
  }

  return path || '/'
}

function HomePage({ onHistoryToggle }: { onHistoryToggle: () => void }) {
  return (
    <>
      <Header onHistoryToggle={onHistoryToggle} />
      <HeroSection />

      {/* Tool Section */}
      <section id="tool" style={{ padding: '96px 0', position: 'relative' }}>
        <div className="container-main">
          <div className="text-center mb-14">
            <h2 className="font-orbitron font-bold tracking-[3px] uppercase mb-3" style={{ fontSize: 'clamp(20px, 3vw, 32px)' }}>
              Feed The <span className="text-blood-ruby">Singularity</span>
            </h2>

          </div>

          <DropZone />
          <TextInput />
          <ImportCapsuleButton />
          <CompressButton />
          <MetricsDashboard />
          <OutputSection />
        </div>
      </section>

      <BenchmarkProof />
      <WhoIsItFor />
      <HowItWorks />
      <ProductPromise />
      <Footer />
    </>
  )
}

function App() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [currentPath, setCurrentPath] = useState(getCurrentPath)

  usePageMeta(currentPath)

  useEffect(() => {
    const handleNavigation = () => setCurrentPath(getCurrentPath())

    window.addEventListener('popstate', handleNavigation)

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      // Ignore external links, targets that open in new tab/window, and non-routing URLs
      const targetAttr = anchor.getAttribute('target')
      if (
        targetAttr === '_blank' ||
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')
      ) {
        return
      }

      // Check if it's an internal hash link on the current page
      if (href.startsWith('#')) {
        return
      }

      const url = new URL(href, window.location.origin)
      if (url.pathname === window.location.pathname) {
        if (url.hash) {
          e.preventDefault()
          window.history.pushState(null, '', href)
          const hashTarget = url.hash.slice(1)
          document.getElementById(hashTarget)?.scrollIntoView({ block: 'start' })
          return
        }
      }

      e.preventDefault()
      window.history.pushState(null, '', href)
      window.dispatchEvent(new PopStateEvent('popstate'))
    }

    document.addEventListener('click', handleLinkClick)

    return () => {
      window.removeEventListener('popstate', handleNavigation)
      document.removeEventListener('click', handleLinkClick)
    }
  }, [])

  useEffect(() => {
    const hashTarget = window.location.hash.slice(1)

    if (hashTarget) {
      window.requestAnimationFrame(() => {
        document.getElementById(hashTarget)?.scrollIntoView({ block: 'start' })
      })
    } else {
      window.requestAnimationFrame(() => {
        window.scrollTo(0, 0)
      })
    }
  }, [currentPath])

  const renderPage = () => {
    if (currentPath === '/memory-lab') {
      return (
        <>
          <Header onHistoryToggle={() => setIsHistoryOpen(prev => !prev)} activePath={currentPath} />
          <MemoryLabIndex />
          <Footer />
        </>
      )
    }

    if (currentPath === '/memory-lab/what-is-a-memory-capsule') {
      return (
        <>
          <Header onHistoryToggle={() => setIsHistoryOpen(prev => !prev)} activePath={currentPath} />
          <MemoryLabArticle />
          <Footer />
        </>
      )
    }

    return <HomePage onHistoryToggle={() => setIsHistoryOpen(prev => !prev)} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: '#E8E8E8', position: 'relative' }}>
      {renderPage()}

      {/* History Sidebar */}
      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  )
}

export default App
