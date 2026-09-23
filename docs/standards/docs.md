# Docs Standard

All docs are read and edited in Neovim. Optimize for a terminal.


## Format

- Plain Markdown. No HTML tags, no inline styles.
- Hard wrap at 80 columns (`gq` friendly). Code blocks and tables may
  exceed only when unavoidable.
- ATX headings (`#`). Two blank lines before `##` sections, one before
  `###`. Easy to jump with `]]` and to fold.
- One idea per paragraph. Short paragraphs.
- Lists over prose for rules and steps.
- Tables only when narrow (≤ 80 columns) and genuinely tabular.
- Diagrams: Mermaid in fenced blocks, or ASCII box drawing for
  wireframes. Both readable as text.
- IDs that other files reference are stable and greppable:
  `AC-1`, `EC-2`, `UC-1`, `T03`, `D-1`.


## Language

- English.
- Active voice, present tense.
- Concrete over abstract: numbers, examples, names.
- No filler. If a sentence can be deleted without losing meaning,
  delete it.


## Suggested Neovim setup

```lua
vim.api.nvim_create_autocmd("FileType", {
  pattern = { "markdown", "cucumber" },
  callback = function()
    vim.opt_local.textwidth = 80
    vim.opt_local.colorcolumn = "81"
    vim.opt_local.wrap = true
    vim.opt_local.linebreak = true
  end,
})
```

Useful: `render-markdown.nvim` for inline rendering, `markdown` and
`gherkin` treesitter parsers, `:grep AC-3` to trace a criterion
across feature.md, tasks.md and tests.feature.
