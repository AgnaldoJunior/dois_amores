import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * Garante a regra "nenhum componente com cor, fonte ou tamanho hardcoded".
 * Só src/theme pode conter valores literais; o resto usa tokens.
 */
const ROOT = process.cwd()
const SCANNED = ['src', 'templates']
const ALLOWED = [/^src[\\/]theme[\\/]/, /\.test\.tsx?$/, /^src[\\/]types[\\/]database\.ts$/]

const FORBIDDEN: { name: string; pattern: RegExp }[] = [
  { name: 'cor hexadecimal', pattern: /#[0-9a-fA-F]{3,8}\b/ },
  { name: 'cor rgb/hsl', pattern: /\b(?:rgba?|hsla?)\(/ },
  { name: 'valor arbitrário em px/rem/pt', pattern: /\[[^\]]*\d+(?:\.\d+)?(?:px|rem|pt)\b[^\]]*\]/ },
  { name: 'font-family literal', pattern: /font-family\s*:(?!\s*var\()|fontFamily\s*:\s*['"]/ },
  { name: 'fonte arbitrária do Tailwind', pattern: /font-\[/ },
  { name: 'cor da paleta padrão do Tailwind', pattern: /\b(?:bg|text|border|fill|stroke)-(?:red|blue|gray|slate|zinc|neutral|green|pink|rose|white|black)(?:-\d{2,3})?\b/ },
]

function listFiles(dir: string): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return []
  }
  return entries.flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return listFiles(full)
    return /\.(tsx?|css)$/.test(entry) ? [full] : []
  })
}

describe('regra de design tokens', () => {
  const files = SCANNED.flatMap((d) => listFiles(join(ROOT, d)))
    .map((f) => relative(ROOT, f))
    .filter((f) => !ALLOWED.some((re) => re.test(f)))

  it('encontra arquivos para verificar', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files)('%s não tem estilos hardcoded', (file) => {
    const lines = readFileSync(join(ROOT, file), 'utf8').split('\n')
    const problems = lines.flatMap((line, i) =>
      FORBIDDEN.filter(({ pattern }) => pattern.test(line)).map(
        ({ name }) => `${file}:${i + 1} ${name}: ${line.trim()}`,
      ),
    )
    expect(problems).toEqual([])
  })
})
