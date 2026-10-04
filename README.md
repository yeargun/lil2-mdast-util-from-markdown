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

Same surface: `fromMarkdown(value)`. Upstream is bundled with esbuild and minified by Terser, esbuild and Oxc
(best shown). lil2 is the shipped Brotli-objective build.

| | lil2 | upstream, best minifier | difference |
|---|---:|---:|---:|
| raw | 67,977 | 84,774 (Terser) | −19.8% |
| gzip (9) | 26,095 | 27,170 (Terser) | −4.0% |
| Brotli (11) | 21,912 | 23,436 (Terser) | −6.5% |

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
