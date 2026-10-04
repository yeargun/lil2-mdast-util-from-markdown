// The micromark layer is lil2-micromark's src/, copied byte for byte into src/micromark/ and pinned.
//   node scripts/shared-sources.mjs          check the pins
//   node scripts/shared-sources.mjs --sync   copy from ../lil2-micromark/src and rewrite the pins
import {createHash} from 'node:crypto'
import {mkdirSync, readFileSync, readdirSync, writeFileSync, statSync} from 'node:fs'
import {dirname, join, relative, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pinFile = join(root, 'scripts/shared-sources.json')
const hash = b => createHash('sha256').update(b).digest('hex')
const walk = d => readdirSync(d).flatMap(n => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]).filter(f => f.endsWith('.lil'))
if (process.argv.includes('--sync')) {
  const from = resolve(root, '../lil2-micromark/src')
  const pins = {}
  for (const file of walk(from)) {
    const rel = relative(from, file), bytes = readFileSync(file)
    mkdirSync(dirname(join(root, 'src/micromark', rel)), {recursive: true})
    writeFileSync(join(root, 'src/micromark', rel), bytes)
    pins[rel] = hash(bytes)
  }
  writeFileSync(pinFile, JSON.stringify(pins, null, 2) + '\n')
  console.log(`synced ${Object.keys(pins).length} lil2-micromark sources`)
} else {
  const pins = JSON.parse(readFileSync(pinFile, 'utf8'))
  for (const [rel, expected] of Object.entries(pins)) {
    const actual = hash(readFileSync(join(root, 'src/micromark', rel)))
    if (actual !== expected) throw new Error(`src/micromark/${rel}: expected ${expected}, got ${actual}`)
  }
  console.log(`checked ${Object.keys(pins).length} pinned lil2-micromark sources`)
}
