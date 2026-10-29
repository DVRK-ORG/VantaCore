import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Singularity } from '../src/engine/singularity.ts'

interface Expectation {
  facts: string[]
  stopPointFacts: string[]
  topicTop3: string
  secrets: string[]
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

  if (failed) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
