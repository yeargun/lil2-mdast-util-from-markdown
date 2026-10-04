# lil2-mdast-util-from-markdown

[mdast-util-from-markdown](https://github.com/syntax-tree/mdast-util-from-markdown) 2.0.3 rewritten in typed
[LilScript](https://lilscript.eddocu.com). It produces the same mdast trees, stored as a flat arena.

Second layer of the **lil2** family (design: `lilscript/docs/lil2/design.md`). It embeds
[lil2-micromark](https://github.com/yeargun/lil2-micromark) as source (`src/micromark/`, pinned by
`scripts/shared-sources.mjs`), so the compiler sees the parser and the tree builder as one program.

## The tree

A node is an `int`. `kind`, `flags`, links (`parent`, `firstChild`, `lastChild`, `nextSibling`,
`previousSibling`), six position ints and the field slots live in parallel arrays (`src/tree.lil`).
Upstream's nullable fields (`lang`, `meta`, `title`, `alt`, `start`, `checked`) are flag bits.

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
spec, every named entity, edge cases and the bench documents: 736 documents, all equal.

```sh
npm install
npm run build:dev && npm test
npm run build   # production build into dist/
```

## License

MIT; see NOTICE.md.
