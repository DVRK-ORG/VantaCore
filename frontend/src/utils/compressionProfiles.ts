export type CompressionProfile =
  | 'memory-capsule'
  | 'agent-transcript'
  | 'rag-kb'
  | 'dev-logs'
  | 'research-notes'
  | 'legal-policy'

export interface CompressionProfileOption {
  id: CompressionProfile
  label: string
  shortLabel: string
  description: string
  helperText: string
}

export const COMPRESSION_PROFILES: CompressionProfileOption[] = [
  {
    id: 'memory-capsule',
    label: 'Memory Capsule',
    shortLabel: 'Memory Capsule',
    description: 'Default VantaCore compression engine without source hints.',
    helperText: 'Default behavior. No preprocessing. Compresses anything.',
  },
  {
    id: 'agent-transcript',
    label: 'Agent Transcript',
    shortLabel: 'Agent Transcript',
    description: 'Conservative cleanup for AI logs.',
    helperText: 'Best for Codex, Antigravity, Cursor, Claude, ChatGPT exports, terminal logs, build output, and repo handoff transcripts.',
  },
  {
    id: 'rag-kb',
    label: 'RAG / KB',
    shortLabel: 'RAG / KB',
    description: 'Prep for RAG pipelines.',
    helperText: 'Emphasizes factual claims, entities, definitions, and chunk-friendly structure.',
  },
  {
    id: 'dev-logs',
    label: 'Dev Logs',
    shortLabel: 'Dev Logs',
    description: 'Prep for developer context.',
    helperText: 'Emphasizes commands, errors, fixes, files changed, and do-not-repeat warnings.',
  },
  {
    id: 'research-notes',
    label: 'Research',
    shortLabel: 'Research',
    description: 'Prep for research context.',
    helperText: 'Emphasizes findings, claims, open questions, and source references.',
  },
  {
    id: 'legal-policy',
    label: 'Legal / Policy',
    shortLabel: 'Legal / Policy',
    description: 'Prep for policy documents.',
    helperText: 'Emphasizes definitions, obligations, and risk notes. Includes informational-only caveat.',
  },
]

export function prependProfileHeader(text: string, profile: CompressionProfile): string {
  if (profile === 'memory-capsule' || profile === 'agent-transcript') {
    return text // agent-transcript is handled in CompressButton via agentTranscript.ts
  }

  let header = ''

  switch (profile) {
    case 'rag-kb':
      header = `# VantaCore Profile Source

compression_profile: rag-kb
preprocessing: client-side profile hint
purpose: prepare source material for RAG / Knowledge Base compression
preserves: factual claims, entities, definitions, topic sections, chunk-friendly structure, source material

## SOURCE MATERIAL
`
      break
    case 'dev-logs':
      header = `# VantaCore Profile Source

compression_profile: dev-logs
preprocessing: client-side profile hint
purpose: prepare developer context and operational logs
preserves: commands, errors, fixes, files changed, commits, tests run, build/lint state, blockers, next action, do-not-repeat warnings

## SOURCE MATERIAL
`
      break
    case 'research-notes':
      header = `# VantaCore Profile Source

compression_profile: research-notes
preprocessing: client-side profile hint
purpose: prepare research and discovery notes
preserves: topics, findings, claims, open questions, source references, conclusions, next steps

## SOURCE MATERIAL
`
      break
    case 'legal-policy':
      header = `# VantaCore Profile Source

compression_profile: legal-policy
preprocessing: client-side profile hint
purpose: prepare policy and regulatory text
preserves: jurisdiction/context, definitions, obligations, requirements, exceptions, dates, authorities, risk notes
caveat: THIS CAPSULE IS INFORMATIONAL ONLY AND DOES NOT CONSTITUTE LEGAL ADVICE.

## SOURCE MATERIAL
`
      break
  }

  return header + text
}
