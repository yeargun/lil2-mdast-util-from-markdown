// Same mdast as upstream mdast-util-from-markdown: every node, field, null and position.
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {fromMarkdown} from 'mdast-util-from-markdown'
import {corpus} from './corpus.mjs'
const {treeJson} = await import(new URL(process.env.LIL2_JSON ?? '../.dev/json/json.js', import.meta.url))

test('mdast equals upstream', () => {
  const failures = []
  for (const c of corpus()) {
    const expected = JSON.parse(JSON.stringify(fromMarkdown(c.markdown)))
    let actual
    try {
      actual = JSON.parse(treeJson(c.markdown))
      assert.deepStrictEqual(actual, expected)
    } catch (error) {
      failures.push({name: c.name, markdown: c.markdown.slice(0, 160), error: String(error.message).slice(0, 700)})
    }
  }
  if (failures.length) console.log(JSON.stringify({failures: failures.length, first: failures.slice(0, 4)}, null, 1))
  assert.equal(failures.length, 0)
})
