// The browser build (the `browser` condition) in real browsers, where named references are decoded by
// the document: same mdast as upstream, compared as rows.
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {fromMarkdown as upstream} from 'mdast-util-from-markdown'
import {browsers, inBrowser} from './browser.mjs'
import {corpus} from './corpus.mjs'
import {fromColumns, fromObjects} from './rows.mjs'
const artifact = new URL(process.env.LIL2_BROWSER_ARTIFACT ?? '../dist/browser/from-markdown.js', import.meta.url)
const cases = corpus()

for (const name of browsers) {
  test(`browser build in ${name}: mdast equals upstream`, async () => {
    const columns = await inBrowser(name, artifact, (lib, markdowns) => markdowns.map(m => lib.fromMarkdown(m)), cases.map(c => c.markdown))
    const failures = []
    cases.forEach((c, i) => {
      try {
        assert.deepStrictEqual(fromColumns(columns[i]), fromObjects(upstream(c.markdown)))
      } catch (error) {
        failures.push({name: c.name, error: String(error.message).slice(0, 500)})
      }
    })
    if (failures.length) console.log(JSON.stringify({failures: failures.length, first: failures.slice(0, 3)}, null, 1))
    assert.equal(failures.length, 0)
  })
}
