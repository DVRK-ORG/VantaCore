import { execFileSync } from 'node:child_process'
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Singularity } from '../src/engine/singularity.ts'
import { generateSyntheticMergedSession } from './validate-compression.ts'

interface Expectation {
  facts: string[]
  stopPointFacts: string[]
  topicTop3: string
  secrets: string[]
  absent?: string[]
  absentHeadings?: string[]
  stopFields?: Record<string, string[]>
  stopFieldAbsent?: Record<string, string[]>
  codeBlocks?: { minInput?: number; minKept?: number; minFolded?: number }
}

interface CapsuleEngine {
  process: (text: string) => { compressed: string; compressedChars: number; reductionPercent: number }
}

const fixtureDir = join(process.cwd(), 'fixtures/continuity')

const bulletKey = (line: string): string => line
  .toLowerCase()
  .replace(/\s+/g, ' ')
  .trim()

const duplicateBulletRate = (output: string): number => {
  const bullets = output.split('\n').filter((line) => line.startsWith('- '))
  if (!bullets.length) return 0
  const unique = new Set(bullets.map(bulletKey)).size
  return (bullets.length - unique) / bullets.length
}

const sessionMap = (output: string): string => {
  const section = output.split('## SESSION MAP')[1]?.split(/\n## /)[0] ?? ''
  return section
    .split('\n')
    .filter((line) => line.startsWith('- '))
    .slice(0, 3)
    .join('\n')
}

const stopText = (output: string): string => {
  if (!output.includes('## WHERE IT STOPPED')) return output
  return output.split('## WHERE IT STOPPED')[1]?.split(/\n## /)[0] ?? output
}

const STOP_LABELS = new Set([
  'last user message:',
  'last assistant reply:',
  'last commits/files:',
  'stated next step:',
])

const stopField = (stop: string, label: string): string => {
  const lines = stop.split('\n')
  const start = lines.findIndex((line) => line === label)
  if (start < 0) return ''
  const body: string[] = []
  for (let index = start + 1; index < lines.length; index += 1) {
    if (STOP_LABELS.has(lines[index] ?? '')) break
    body.push(lines[index] ?? '')
  }
  return body.join('\n')
}

const twoMegabyteSession = (): string => {
  const unit = [
    'User: the kiln-report should keep the clay shrinkage note in kiln-report/notes/shrinkage.md.',
    '',
    'Assistant: updated the shrinkage note. Next: weigh the next bisque load.',
    '',
  ].join('\n')
  let text = ''
  while (text.length < 2_000_000) text += unit
  return text
}

const main = async () => {
  const names = (await readdir(fixtureDir)).filter((name) => name.endsWith('.txt')).sort()
  const engine = new Singularity()
  let failed = 0

  for (const name of names) {
    const inputPath = join(fixtureDir, name)
    const input = await readFile(inputPath, 'utf8')
    const expectation = JSON.parse(await readFile(inputPath.replace(/\.txt$/, '.expect.json'), 'utf8')) as Expectation
    const started = performance.now()
    const first = engine.process(input)
    const elapsed = performance.now() - started
    const second = engine.process(input)
    const output = first.compressed
    const errors: string[] = []

    if (first.compressed !== second.compressed) errors.push('not deterministic')
    if (output.length > input.length) errors.push(`output ${output.length} larger than input ${input.length}`)

    const factHits = expectation.facts.filter((fact) => output.includes(fact)).length
    const factRate = expectation.facts.length ? factHits / expectation.facts.length : 1
    if (factRate < 0.9) errors.push(`key facts ${(factRate * 100).toFixed(0)}%`)

    const missedStop = expectation.stopPointFacts.filter((fact) => !stopText(output).includes(fact))
    if (missedStop.length) errors.push(`stop miss: ${missedStop.join(' | ')}`)

    const topic = expectation.topicTop3.toLowerCase()
    if (output.includes('## SESSION MAP')) {
      const top = sessionMap(output).toLowerCase()
      if (!top.includes(topic)) errors.push(`topic "${expectation.topicTop3}" not in top 3`)
    } else if (!output.toLowerCase().includes(topic)) {
      errors.push(`topic "${expectation.topicTop3}" missing`)
    }

    for (const secret of expectation.secrets) {
      if (secret && output.includes(secret)) errors.push('secret leaked')
    }

    for (const banned of expectation.absent ?? []) {
      if (banned && output.includes(banned)) errors.push(`present: ${banned.slice(0, 40)}`)
    }

    for (const heading of expectation.absentHeadings ?? []) {
      if (heading && output.includes(`\n${heading}`)) errors.push(`heading ${heading}`)
    }

    const stopped = stopText(output)
    for (const [label, facts] of Object.entries(expectation.stopFields ?? {})) {
      const field = stopField(stopped, label)
      for (const fact of facts) {
        if (!field.includes(fact)) errors.push(`field ${label} missing ${fact}`)
      }
    }
    for (const [label, facts] of Object.entries(expectation.stopFieldAbsent ?? {})) {
      const field = stopField(stopped, label)
      for (const fact of facts) {
        if (fact && field.includes(fact)) errors.push(`field ${label} has ${fact.slice(0, 40)}`)
      }
    }

    if (expectation.codeBlocks) {
      const counted = output.match(/code blocks: (\d+) in input, (\d+) kept inline, (\d+) stored in dictionary, (\d+) dropped/)
      if (!counted) {
        errors.push('code block counts missing')
      } else {
        const input = Number(counted[1])
        const kept = Number(counted[2])
        const folded = Number(counted[3])
        const dropped = Number(counted[4])
        if (input !== kept + folded + dropped) errors.push('code block counts do not add up')
        if ((expectation.codeBlocks.minInput ?? 0) > input) errors.push(`code input ${input}`)
        if ((expectation.codeBlocks.minKept ?? 0) > kept) errors.push(`code kept ${kept}`)
        if ((expectation.codeBlocks.minFolded ?? 0) > folded) errors.push(`code folded ${folded}`)
      }
    }

    const duplicates = duplicateBulletRate(output)
    if (duplicates > 0.05) errors.push(`duplicate bullets ${(duplicates * 100).toFixed(1)}%`)

    const status = errors.length ? `FAIL ${errors.join('; ')}` : 'ok'
    console.log(`${name}: in ${input.length} out ${output.length} reduction ${first.reductionPercent.toFixed(2)}% facts ${(factRate * 100).toFixed(0)}% dup ${(duplicates * 100).toFixed(1)}% ${elapsed.toFixed(0)}ms ${status}`)
    if (errors.length) failed += 1
  }

  const large = twoMegabyteSession()
  const started = performance.now()
  const first = engine.process(large)
  const elapsed = performance.now() - started
  const second = engine.process(large)
  console.log(`generated-2mb: in ${large.length} out ${first.compressedChars} reduction ${first.reductionPercent.toFixed(2)}% ${elapsed.toFixed(0)}ms`)
  if (elapsed > 2000) {
    console.log('FAIL generated-2mb slower than 2s')
    failed += 1
  }
  if (first.compressed.length > large.length) {
    console.log('FAIL generated-2mb output larger than input')
    failed += 1
  }
  if (first.compressed !== second.compressed) {
    console.log('FAIL generated-2mb not deterministic')
    failed += 1
  }

  const mainEngine = await loadMainEngine()
  try {
    const unique = largeUniqueSession()
    const mainUnique = mainEngine.process(unique)
    const headUnique = engine.process(unique)
    const uniqueStatus = headUnique.compressed.length <= mainUnique.compressed.length ? 'ok' : 'FAIL larger than main'
    console.log(`unique-large: in ${unique.length} main ${mainUnique.compressed.length} head ${headUnique.compressed.length} ${uniqueStatus}`)
    if (headUnique.compressed.length > mainUnique.compressed.length) failed += 1

    const sample = generateSyntheticMergedSession()
    const mainSample = mainEngine.process(sample)
    const headSample = engine.process(sample)
    const sampleStatus = headSample.compressed.length <= mainSample.compressed.length ? 'ok' : 'FAIL larger than main'
    console.log(`built-in-sample: in ${sample.length} main ${mainSample.compressed.length} head ${headSample.compressed.length} ${sampleStatus}`)
    if (headSample.compressed.length > mainSample.compressed.length) failed += 1
  } finally {
    await mainEngine.cleanup()
  }

  if (failed) process.exitCode = 1
}

const repoRoot = (): string => execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: process.cwd(),
  encoding: 'utf8',
}).trim()

const loadMainEngine = async (): Promise<CapsuleEngine & { cleanup: () => Promise<void> }> => {
  const dir = await mkdtemp(join(tmpdir(), 'vanta-main-'))
  const root = repoRoot()
  const source = execFileSync('git', ['show', 'main:frontend/src/engine/singularity.ts'], { cwd: root, encoding: 'utf8' })
  const types = execFileSync('git', ['show', 'main:frontend/src/engine/types.ts'], { cwd: root, encoding: 'utf8' })
  await writeFile(join(dir, 'types.ts'), types)
  await writeFile(join(dir, 'singularity.ts'), source.replaceAll("from './types'", "from './types.ts'"))
  const loaded = await import(pathToFileURL(join(dir, 'singularity.ts')).href) as { Singularity: new () => CapsuleEngine }
  const engine = new loaded.Singularity()
  return {
    process: (text) => engine.process(text),
    cleanup: () => rm(dir, { recursive: true, force: true }),
  }
}

const largeUniqueSession = (): string => {
  const lexicon = [
    'amber', 'birch', 'cedar', 'dune', 'ember', 'flint', 'grove', 'haze', 'ivory', 'jade',
    'kelp', 'lumen', 'maple', 'north', 'opal', 'pebble', 'quartz', 'ridge', 'sage', 'thorn',
    'umber', 'violet', 'willow', 'xenon', 'yarrow', 'zephyr', 'brine', 'cobalt', 'drift', 'elm',
  ]
  const topics = ['mooring', 'invoice', 'kiln', 'palette', 'caption', 'orbit']
  const sentence = (n: number, topic: string): string => {
    const word = (offset: number) => lexicon[(n * 3 + offset * 5) % lexicon.length]
    return `Completed the ${topic} ${word(0)} ${word(1)} note and verified the ${word(2)} ${word(3)} count before the next ${word(4)} pass.`
  }
  const parts: string[] = []
  for (let n = 0; n < 160; n += 1) {
    const topic = topics[n % topics.length]
    parts.push(`Human: keep the ${topic} ${lexicon[n % lexicon.length]} record and do not retouch the layout.`)
    parts.push(`Assistant: updated ${topic}. Decision: keep the ${lexicon[(n + 2) % lexicon.length]} direction. Next: replay the ${topic} fixture before tagging.`)
    parts.push('```')
    parts.push(sentence(n, topic))
    parts.push(sentence(n + 11, topic))
    parts.push('```')
    parts.push(`C:\\Users\\X\\Desktop\\Projects\\HarborLedger\\static\\${topic}.html`)
  }
  return parts.join('\n\n')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
