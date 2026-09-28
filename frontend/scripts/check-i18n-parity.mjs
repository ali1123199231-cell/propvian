import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Relative to this script, so it checks the checkout it lives in (worktrees included)
const HERE = dirname(fileURLToPath(import.meta.url))
const LOCALES_DIR = join(HERE, '..', 'src', 'locales')
const BACKEND_RES = join(HERE, '..', '..', 'backend', 'src', 'main', 'resources')
const SOURCE = 'en'

// Languages need different plural forms (English: one/other; Polish: one/few/many/other),
// so plural keys are compared by their base name.
const PLURAL = /_(zero|one|two|few|many|other)$/
const base = (key) => key.replace(PLURAL, '')
const unique = (keys) => [...new Set(keys.map(base))]

function flatten(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (Array.isArray(v)) out.push(`${path}[${v.length}]`)
    else if (v && typeof v === 'object') flatten(v, path, out)
    else out.push(path)
  }
  return out
}

let failures = 0

// ── Frontend JSON namespaces ────────────────────────────────────────────────
const langs = readdirSync(LOCALES_DIR)
const namespaces = readdirSync(join(LOCALES_DIR, SOURCE))

console.log(`Frontend: languages [${langs.join(', ')}], namespaces [${namespaces.map(n => n.replace('.json','')).join(', ')}]\n`)

for (const ns of namespaces) {
  const source = unique(flatten(JSON.parse(readFileSync(join(LOCALES_DIR, SOURCE, ns), 'utf8'))))
  for (const lang of langs) {
    if (lang === SOURCE) continue
    const target = unique(flatten(JSON.parse(readFileSync(join(LOCALES_DIR, lang, ns), 'utf8'))))
    const missing = source.filter(k => !target.includes(k))
    const extra = target.filter(k => !source.includes(k))
    if (missing.length || extra.length) {
      failures++
      console.log(`✗ ${lang}/${ns}`)
      missing.forEach(k => console.log(`    missing: ${k}`))
      extra.forEach(k => console.log(`    extra:   ${k}`))
    } else {
      console.log(`✓ ${lang}/${ns} — ${source.length} keys`)
    }
  }
}

// ── Backend message bundles ─────────────────────────────────────────────────
function propKeys(file) {
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => l.split('=')[0].trim())
    .filter(Boolean)
}

console.log('\nBackend message bundles:')
const baseKeys = propKeys(join(BACKEND_RES, 'messages.properties'))
for (const lang of langs.filter((l) => l !== SOURCE)) {
  const target = propKeys(join(BACKEND_RES, `messages_${lang}.properties`))
  const missing = baseKeys.filter(k => !target.includes(k))
  const extra = target.filter(k => !baseKeys.includes(k))
  if (missing.length || extra.length) {
    failures++
    console.log(`✗ messages_${lang}.properties`)
    missing.forEach(k => console.log(`    missing: ${k}`))
    extra.forEach(k => console.log(`    extra:   ${k}`))
  } else {
    console.log(`✓ messages_${lang}.properties — ${baseKeys.length} keys`)
  }
}

console.log(failures ? `\n${failures} file(s) out of parity` : '\nAll locale files in parity.')
process.exit(failures ? 1 : 0)
