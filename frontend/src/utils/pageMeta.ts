import { useEffect } from 'react'

type PageMeta = {
  title: string
  description: string
  canonicalPath: string
  structuredData?: Record<string, unknown>
}

const SITE_URL = 'https://vantacore.net'

const metadataByPath: Record<string, PageMeta> = {
  '/': {
    title: 'VantaCore - Portable Memory Capsules for LLMs',
    description:
      'Compress massive AI sessions into portable memory capsules. 100% client-side free demo with 96.2% benchmark reduction.',
    canonicalPath: '/',
  },
  '/memory-lab': {
    title: 'Memory Lab Notes | VantaCore',
    description:
      'Technical field notes from VantaCore on LLM continuity, Memory Capsules, RAG prep, agent handoff, and token cost control.',
    canonicalPath: '/memory-lab',
  },
  '/memory-lab/what-is-a-memory-capsule': {
    title: 'What Is a Memory Capsule for LLMs? | Memory Lab Notes | VantaCore',
    description:
      'A technical Memory Lab note explaining how VantaCore turns long LLM sessions into portable memory capsules for continuity and handoff.',
    canonicalPath: '/memory-lab/what-is-a-memory-capsule',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'What Is a Memory Capsule for LLMs?',
      description:
        'A technical Memory Lab note explaining how VantaCore turns long LLM sessions into portable memory capsules for continuity and handoff.',
      author: {
        '@type': 'Organization',
        name: 'DVRK-ORG',
      },
      publisher: {
        '@type': 'Organization',
        name: 'VantaCore',
        url: SITE_URL,
      },
      mainEntityOfPage: `${SITE_URL}/memory-lab/what-is-a-memory-capsule`,
      datePublished: '2026-06-01',
      dateModified: '2026-06-01',
      articleSection: 'Memory Lab Notes',
      keywords: [
        'LLM continuity',
        'memory capsule',
        'AI session compression',
        'RAG preprocessing',
        'agent handoff',
      ],
    },
  },
}

function normalizePath(pathname: string) {
  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }

  return pathname || '/'
}

function setNamedMeta(selector: string, attribute: 'content' | 'href', value: string) {
  const element = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector)

  if (element) {
    element.setAttribute(attribute, value)
  }
}

export function getPageMeta(pathname: string) {
  const path = normalizePath(pathname)
  return metadataByPath[path] ?? metadataByPath['/']
}

export function usePageMeta(pathname: string) {
  useEffect(() => {
    const meta = getPageMeta(pathname)
    const canonicalUrl = `${SITE_URL}${meta.canonicalPath}`
    const structuredDataId = 'memory-lab-structured-data'

    document.title = meta.title
    setNamedMeta('meta[name="description"]', 'content', meta.description)
    setNamedMeta('link[rel="canonical"]', 'href', canonicalUrl)
    setNamedMeta('meta[property="og:url"]', 'content', canonicalUrl)
    setNamedMeta('meta[property="og:title"]', 'content', meta.title)
    setNamedMeta('meta[property="og:description"]', 'content', meta.description)
    setNamedMeta('meta[name="twitter:title"]', 'content', meta.title)
    setNamedMeta('meta[name="twitter:description"]', 'content', meta.description)

    document.getElementById(structuredDataId)?.remove()

    if (meta.structuredData) {
      const script = document.createElement('script')
      script.id = structuredDataId
      script.type = 'application/ld+json'
      script.text = JSON.stringify(meta.structuredData)
      document.head.appendChild(script)
    }

    return () => {
      document.getElementById(structuredDataId)?.remove()
    }
  }, [pathname])
}
