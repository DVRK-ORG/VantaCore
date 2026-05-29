import { readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import { Singularity } from '../src/engine/singularity.ts'

interface CliOptions {
  inputPath: string | null
  writeOutput: boolean
  outputPath: string | null
}

const parseArgs = (argv: string[]): CliOptions => {
  let inputPath: string | null = null
  let writeOutput = false
  let outputPath: string | null = null

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--write') {
      writeOutput = true
    } else if (arg === '--out') {
      outputPath = argv[i + 1] ?? null
      i += 1
    } else if (!arg.startsWith('--')) {
      inputPath = arg
    }
  }

  return { inputPath, writeOutput, outputPath }
}

const formatNumber = (value: number): string => value.toLocaleString('en-US')

const defaultOutputPath = (inputPath: string | null): string => {
  if (!inputPath) return join(process.cwd(), 'vantacore-validation-output.md')
  const extension = extname(inputPath)
  const name = basename(inputPath, extension)
  return join(dirname(inputPath), `${name}.vantacore.md`)
}

const repeatedPrompt = `User wants the IPE landing page polish to stay scoped. Agent should not redesign the layout, should keep the same product direction, and should not repeat already-fixed work. Current task: preserve Chrome Web Store readiness, privacy policy wording, Cloudflare deployment trail, and VantaCore compression test findings.`

const repeatedCode = `\`\`\`powershell
git status --short
rg -n "Chrome Web Store|privacyLocalOnly|landing page|Cloudflare|VantaCore" .
npm run build
\`\`\``

const sampleBlocks = [
  `early-session: user wants IPE landing page polish. Decision: keep same layout and color system. Completed: hero copy tightened, extension language clarified, promo image reviewed. Verified: local preview checked. Pending: Chrome Web Store listing final review.
${repeatedPrompt}
git status --short && git diff --stat
rg -n "Github|Chrome Store|show less|privacyLocalOnly" .
${repeatedCode}`,
  `mid-session: Chrome Web Store / Privacy / Review. Completed: privacy policy reviewed for local-only behavior. Verified: Chrome Web Store text still matches extension behavior. Open loop: final submission status remains pending. Do not change: privacy language and product scope.
${repeatedPrompt}
git status --short && git diff --stat
rg -n "Chrome Web Store|privacy policy|submission" frontend src .`,
  `late-session: Cloudflare / SEO / Sitemap / Deployment. Completed: Cloudflare deployment trail captured, sitemap and robots signals checked, public URL noted. Verified: deployment passed and live URL loaded. Next: continue from final-known-state if Search Console needs another check.
curl -I https://example.com
wrangler pages deployment list`,
  `final-known-state: VantaCore Compression Test. Before: 1,607,470 characters. After: 233,359 characters. Reduction: 85.48%. Good memory packet, but too dense/noisy. Next likely step: add Memory Capsule header, dictionary folding, clusters, timeline markers, and validation mode.
node scripts/validate-compression.ts merged-session.md --write`,
  `final-known-state: C.H.P Monetization / Product Strategy. User wants a practical product direction without reopening completed website work. Decision: keep strategy notes separate from the Chrome Web Store execution trail. Pending: pricing and monetization details remain open.`,
]

const generateSyntheticMergedSession = (): string => {
  let merged = ''
  let index = 0
  while (merged.length < 1_607_470) {
    merged += `\n\n--- exported session ${index + 1} ---\n${sampleBlocks[index % sampleBlocks.length]}\n`
    index += 1
  }
  return merged
}

const main = async () => {
  const options = parseArgs(process.argv.slice(2))
  const input = options.inputPath
    ? await readFile(options.inputPath, 'utf8')
    : generateSyntheticMergedSession()

  const engine = new Singularity()
  const result = engine.process(input)
  const sourceLabel = options.inputPath ?? 'built-in synthetic merged-session fixture'

  console.log('VantaCore compression validation')
  console.log(`input: ${sourceLabel}`)
  console.log(`input characters: ${formatNumber(result.originalChars)}`)
  console.log(`output characters: ${formatNumber(result.compressedChars)}`)
  console.log(`input estimated tokens: ${formatNumber(result.estimatedTokensBefore)} (${result.tokenEstimationMethod})`)
  console.log(`output estimated tokens: ${formatNumber(result.estimatedTokensAfter)} (${result.tokenEstimationMethod})`)
  console.log(`reduction: ${result.reductionPercent.toFixed(2)}%`)
  console.log(`repeated blocks folded: ${formatNumber(result.repeatedBlocksFolded)}`)
  console.log(`dictionary references created: ${formatNumber(result.dictionaryReferencesCreated)}`)
  console.log(`clusters detected: ${formatNumber(result.clustersDetected)}`)
  console.log(`code blocks protected: ${result.codeBlocksProtected > 0 ? 'yes' : 'none detected'} (${formatNumber(result.codeBlocksProtected)} fenced; output balanced: ${result.codeBlocksIntegrityOk ? 'yes' : 'no'})`)

  if (options.writeOutput || options.outputPath) {
    const outputPath = options.outputPath ?? defaultOutputPath(options.inputPath)
    await writeFile(outputPath, result.compressed, 'utf8')
    console.log(`output written: ${outputPath}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
