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

## Measured (2026-10-04)

The `browser` build against mdast-util-from-markdown@2.0.3 bundled for the browser with esbuild and minified by Terser, esbuild and Oxc
(the smallest shown). Each objective is its own LilScript build (effort level 12, `lazy_functions`).

| | lil2 | upstream, best minifier | difference |
|---|---:|---:|---:|
| raw | 48,453 | 56,955 (Terser) | −14.9% |
| gzip (9) | 15,613 | 15,491 (Terser) | +0.8% |
| Brotli (11) | 13,748 | 13,831 (Terser) | −0.6% |

Speed, upstream → lil2: `fromMarkdown(value)`, median per call in a fresh browser context per lane, after checking that both
give the same output (Playwright; Chromium 151, Firefox 153; AMD EPYC 7763 64-Core Processor). Cold rows are the first import and the
first call of a fresh page.

| | Chromium | Firefox |
|---|---:|---:|
| chat (1 KB) | 0.60 → 0.27 ms (0.45×) | 1.00 → 0.54 ms (0.54×) |
| readme (26 KB) | 14.9 → 6.23 ms (0.42×) | 31.0 → 13.0 ms (0.42×) |
| large (222 KB) | 156 → 65.1 ms (0.42×) | 379 → 124 ms (0.33×) |
| import, cold | 5.00 → 5.30 ms | 9.00 → 9.00 ms |
| first call, cold | 11.6 → 10.8 ms | 12.0 → 10.0 ms |

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
