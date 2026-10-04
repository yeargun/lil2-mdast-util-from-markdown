# lil2-mdast-util-from-markdown

[mdast-util-from-markdown](https://github.com/syntax-tree/mdast-util-from-markdown) 2.0.3 rewritten in typed
[LilScript](https://lilscript.eddocu.com). It produces the same mdast trees, stored as a flat arena.

Second layer of the **lil2** family (design: `lilscript/docs/lil2/design.md`). It embeds
[lil2-micromark](https://github.com/yeargun/lil2-micromark) as source (`src/micromark/`, pinned by
`scripts/shared-sources.mjs`), so the compiler sees the parser and the tree builder as one program.

## The tree

A node is an `int`. `kind` (a `K_*` constant), `flags`, links (`parent`, `firstChild`, `lastChild`, `nextSibling`,
`previousSibling`), start and end offsets and the field slots live in parallel arrays (`src/mdast/tree.lil`). Line
and column come from the parser's line table (`lineStarts`), and equal upstream's on every node. Upstream's
nullable fields (`lang`, `meta`, `title`, `alt`, `start`, `checked`) are flag bits. Every enumeration is an int:
node kinds, `referenceType`, table alignments (`ALIGN_*`, a run in `aux`), and identifiers, which the parser
interns, so a reference finds its definition by array index.

`fromMarkdown(value)` returns the tree as positional columns, the arena's own arrays:

```
[kind, flags, parent, firstChild, nextSibling, startOffset, endOffset, num, s1, s2, s3,
 identifier, label, lineStarts, identifiers, aux]
```

Extensions plug in typed: `parseTree(value, syntaxExtensions, installers)` (`src/mdast/parse.lil`) takes micromark
syntax extensions and the functions that install their mdast handlers; lil2-remark-gfm and lil2-remark-math use it.
Like lil2-micromark, it ships a `dist/` build and a `dist/browser/` build (named references decoded by the document).

## Install

```bash
npm install @itslil/lil2-mdast-util-from-markdown
```

TypeScript types are included. One ES module per entry; Node, Deno, Bun and workers get `dist/`, bundlers targeting
browsers get `dist/browser/` through the `browser` condition.

## Use

```ts
import {fromMarkdown, type MdastColumns} from '@itslil/lil2-mdast-util-from-markdown'
import {K_HEADING, K_LINK, K_TEXT, N_URL_SET} from '@itslil/lil2-mdast-util-from-markdown/constants'

const tree: MdastColumns = fromMarkdown('# Hello *world*\n\nSee [the docs](https://example.com).')
const [kind, flags, , firstChild, nextSibling, , , num, s1] = tree

// Children run from `firstChild` along `nextSibling`; -1 ends the list.
function* walk(node = 0): Generator<number> {
  yield node
  for (let child = firstChild[node]; child >= 0; child = nextSibling[child]) yield* walk(child)
}
function text(node: number): string {
  if (kind[node] === K_TEXT) return s1[node]
  let out = ''
  for (let child = firstChild[node]; child >= 0; child = nextSibling[child]) out += text(child)
  return out
}

for (const node of walk()) {
  if (kind[node] === K_HEADING) console.log(`h${num[node]}`, text(node)) // h1 Hello world
  if (kind[node] === K_LINK && flags[node] & N_URL_SET) console.log(s1[node]) // https://example.com
}
```

The tree is positional columns, indexed by node id, node 0 the root (types: `MdastColumns`). Ids are arena slots: walk
from the root, since a node a transform replaced keeps its slot but is no longer linked.

| # | column | per node |
|---|---|---|
| 0 | `kind` | a `K_*` constant |
| 1 | `flags` | `N_*` bits: which optional fields are set, `ordered`, `spread`, `checked` |
| 2–4 | `parent`, `firstChild`, `nextSibling` | node ids, -1 for none |
| 5–6 | `startOffset`, `endOffset` | offsets into the source; `lineStarts` gives line and column |
| 7 | `num` | heading depth, list start, reference type, or a table's alignment run in `aux` |
| 8–10 | `s1`, `s2`, `s3` | text: `value`; code: `value`, `lang`, `meta`; link and definition: `url`, `title`; image: `url`, `title`, `alt` |
| 11–12 | `identifier`, `label` | an id into `identifiers` (-1: none), and the label |
| 13 | `lineStarts` | the offset each line starts at |
| 14 | `identifiers` | normalized identifiers by id |
| 15 | `aux` | int runs: a table's alignments (a count, then one `ALIGN_*` per column) |

The constants (`K_*` kinds, `N_*` flags, `ALIGN_*`) come from `@itslil/lil2-mdast-util-from-markdown/constants`, a
separate entry with literal types, so the parser's bundle carries none of them.

### Which package

| you want | package |
|---|---|
| React elements | [`@itslil/lil2-react-markdown`](https://github.com/yeargun/lil2-react-markdown) (`/gfm`, `/full` for GFM, math, KaTeX) |
| an HTML string, CommonMark | [`@itslil/lil2-micromark`](https://github.com/yeargun/lil2-micromark) |
| an HTML string with GFM, math or KaTeX | `renderToStaticMarkup` of lil2-react-markdown's `/full` flavor (below) |
| mdast (syntax tree) | [`lil2-mdast-util-from-markdown`](https://github.com/yeargun/lil2-mdast-util-from-markdown); with GFM [`lil2-remark-gfm`](https://github.com/yeargun/lil2-remark-gfm), math [`lil2-remark-math`](https://github.com/yeargun/lil2-remark-math), breaks [`lil2-remark-breaks`](https://github.com/yeargun/lil2-remark-breaks) |
| hast (HTML tree) | [`lil2-mdast-util-to-hast`](https://github.com/yeargun/lil2-mdast-util-to-hast) and the same three, or [`lil2-rehype-katex`](https://github.com/yeargun/lil2-rehype-katex) with formulas rendered |

Every package is one self-contained ES module with no runtime dependencies (React and KaTeX aside), ships its
TypeScript types, and resolves to a Node build or a browser build through its `exports` conditions.
## Measured (2026-10-04)

The `browser` build against mdast-util-from-markdown@2.0.3 bundled for the browser with esbuild and minified by Terser, esbuild and Oxc
(the smallest shown). Each objective is its own LilScript build (effort level 12, `lazy_functions`).

| | lil2 | upstream, best minifier | difference |
|---|---:|---:|---:|
| raw | 48,453 | 56,955 (Terser) | −14.9% |
| gzip (9) | 15,613 | 15,491 (Terser) | +0.8% |
| Brotli (11) | 13,716 | 13,831 (Terser) | −0.8% |

Speed, upstream → lil2: `fromMarkdown(value)`, median per call in a fresh browser context per lane, after checking that both
give the same output (Playwright; Chromium 151, Firefox 153; AMD EPYC 7763 64-Core Processor). Cold rows are the first import and the
first call of a fresh page.

| | Chromium | Firefox |
|---|---:|---:|
| chat (1 KB) | 0.56 → 0.25 ms (0.44×) | 1.00 → 0.50 ms (0.50×) |
| readme (26 KB) | 14.4 → 6.00 ms (0.42×) | 30.0 → 12.0 ms (0.40×) |
| large (222 KB) | 148 → 59.4 ms (0.40×) | 357 → 115 ms (0.32×) |
| import, cold | 4.70 → 5.00 ms | 8.00 → 10.0 ms |
| first call, cold | 10.2 → 10.0 ms | 13.0 → 10.0 ms |

## Behaviour

`test/differential.test.mjs` compares every node, field, `null` and position with upstream on the CommonMark
spec, every named entity, edge cases and the bench documents: 736 documents, all equal. `test/browser.test.mjs`
does the same with the browser build in Chromium and Firefox.

```sh
npm install
npm run build:dev && npm test
npm run build   # production build into dist/
```

## License

MIT; see NOTICE.md.
