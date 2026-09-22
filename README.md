# CodeCompare

CodeCompare is a web-based utility to compare two snippets of code or text and view a syntax-highlighted, line-by-line diff, wrapped in a small dashboard (Compare / History / Batch Compare / Settings). It's built with vanilla HTML, CSS, and JavaScript, and is fully self-contained: Prism.js (core, every language grammar, every plugin, and its themes) plus the Vazirmatn and Fira Code fonts are all bundled locally, so it works completely offline from the very first load, with no CDN dependency at all.

## Live Demo

**[https://GeekNeuron.github.io/CodeCompare/](https://GeekNeuron.github.io/CodeCompare/)**

## Features

### Comparing
* **Side-by-side input** — two independent text areas for the original and modified code, with file upload and drag-and-drop on either side.
* **Swap** — instantly swap the original and modified content.
* **Line-by-line diff** — additions, deletions, and unchanged lines, with line numbers, in either a Unified or a Side-by-Side (Split) view, with word-level highlighting on modified lines in Split view.
* **Move detection** — optionally highlight blocks of code that were moved rather than added/removed, distinguished with their own color and a badge.
* **Live Diff** — optionally auto-compare while typing, debounced, with no need to click Compare.
* **Auto-detect language** — a one-click, fully offline heuristic guess at the language from the pasted code.
* **Search within the diff** — highlight and step through every row containing a search term, in either view.
* **Copy a single line** — a hover-to-reveal copy button on every diff row.
* **Jump between changes** — `Alt+↓` / `Alt+↑` to jump to the next/previous change.
* **Large-diff safeguard** — diffs are rendered in chunks (1,500 rows at a time, with a "show more" control), so even a huge, mostly-different file loads in well under a second instead of freezing the tab.

### Configuring the comparison
* **Syntax highlighting** — pick a language from a searchable dropdown, or let auto-detect guess it.
* **Configurable Prism plugins** — under a collapsible "Advanced Settings" panel: Match Braces, Show Invisibles, Inline Color, CSS Previewers, Command Line, and Autolinker.
* **Ignore Whitespace / Ignore Blank Lines / Ignore Case** — three independent, real diff-level options (not just display formatting).
* **Format JSON** — pretty-print valid JSON on either side before comparing.
* **Custom ignore rules (regex)** — drop whole matching lines or strip just the matched text, with invalid patterns reported without blocking valid ones. Save/load named presets of these rules.
* **Collapse unchanged lines** — long unchanged runs fold into a "Show N hidden lines" divider; click to expand. Toggle off to always show everything.
* **Wrap long lines** — switch between horizontal scrolling and wrapping.

### Exporting a result
* **Copy / download the diff** — copy to clipboard or download as a `.diff` file.
* **Export HTML report** — a standalone, self-contained HTML file of the comparison (no external dependencies, opens anywhere offline).
* **Print / Save as PDF** — a print-optimized layout via the browser's own print dialog.
* **Shareable link, no server required** — a link that encodes the full comparison (gzip-compressed) in the URL itself; opening it restores everything. Nothing is ever uploaded anywhere.

### Dashboard
* **History** — every comparison you run is recorded locally (language, added/removed counts, a similarity score), with restore, delete, clear, and JSON export/import.
* **Batch Compare** — upload a set of "original" files and a set of "modified" files; they're matched by filename (or relative path when a whole folder is selected) and diffed all at once, with a results table (added/removed/similarity per file, files present on only one side flagged as fully added/removed) and a button to open any pair in the normal Compare view.
* **3-Way Merge** — merge a "Mine" and a "Theirs" version against a common "Base": non-overlapping changes merge automatically, identical changes on both sides merge without duplication, and overlapping/conflicting changes are marked with standard `<<<<<<<` / `=======` / `>>>>>>>` conflict markers in an editable result you can fix up, copy, or download.
* **Settings** — reset all locally stored data, and pick a syntax color theme (8 official Prism themes, or auto-match the app's light/dark mode).

### General
* **English / Persian interface**, with automatic RTL layout for Persian, and Unicode-aware word-level diffing (Persian/Arabic text diffs word-by-word, not character-by-character).
* **Light/Dark theme** — defaults to your system preference and is remembered.
* **Keyboard shortcuts** — see the in-app shortcuts dialog (the `⌘` button) for the full list.
* **Settings persistence** — everything above is saved in `localStorage`.
* **Installable / fully offline (PWA)** — installable as an app; every asset (including every Prism language and both fonts) is precached on first load, so it works with no network connection at all, even on a first, offline install.
* **Responsive layout** — usable on desktop, tablet, and mobile screen sizes, with a collapsible sidebar on small screens.

## How to Use

1. Open the [live demo](https://GeekNeuron.github.io/CodeCompare/) (or run it locally, see below).
2. Paste your first snippet into **Original Code** and the second into **Modified Code** — or upload/drag a file onto either panel.
3. Optionally pick a language (or click **Auto-detect**) and open **Advanced Settings** to adjust plugins and ignore rules.
4. Click **Compare** (or press `Ctrl+Enter`) to see the highlighted diff and the added/removed summary.
5. Use **Copy Diff**, **Download .diff**, **Export HTML Report**, **Print / Save as PDF**, or **Share Link** to export the result, or **← New Comparison** to go back and edit the inputs.
6. Use the sidebar to check **History**, run a **Batch Compare** across multiple files, or adjust **Settings**.

## Running Locally

```bash
git clone https://github.com/GeekNeuron/CodeCompare.git
cd CodeCompare
```

Since this is a static site, you can simply open `index.html` in a browser. For a closer match to how it behaves when served over HTTP (recommended, since PWA/service-worker features and some browser APIs require `http(s)://`), use a local server:

```bash
npm install
npm run serve
```

Then open the printed local URL in your browser.

## Development

This project uses ESLint and Prettier to keep the codebase consistent.

```bash
npm install
npm run lint          # check script.js, dashboard.js, diff-utils.js, share-utils.js, json-utils.js, and service-worker.js for issues
npm run format        # auto-format js/css/html/md
npm run format:check  # verify formatting without writing changes
npm test              # run the diff-engine unit tests
```

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs tests, lint, and format checks on every push and pull request. A separate workflow (`.github/workflows/deploy.yml`) automatically deploys `main` to GitHub Pages.

## File Structure

```
CodeCompare/
├── index.html          # Page structure and markup (app shell: sidebar, topbar, Compare/History/Batch/Settings views)
├── style.css           # Styling, dashboard layout, animations, and responsive/print rules
├── script.js           # Core app logic (state, diffing, i18n, Prism integration, exports)
├── dashboard.js         # Sidebar navigation, History, and Batch Compare
├── diff-utils.js        # Dependency-free line/word-diff engine (unit tested)
├── share-utils.js        # Shareable-link encoding/decoding (unit tested)
├── json-utils.js         # JSON detection/pretty-print helpers (unit tested)
├── __tests__/            # Jest unit tests for diff-utils.js, share-utils.js, json-utils.js
├── service-worker.js   # Precaches the entire app (including every Prism language/theme and both fonts) for full offline use
├── manifest.json        # PWA metadata (name, icons, theme color)
├── icons/               # App icons used by the PWA manifest
├── lib/prism.js         # Bundled Prism.js core
├── lib/prism/           # Bundled Prism plugins, every language grammar, and 8 themes (all local, no CDN)
├── fonts/               # Bundled Vazirmatn and Fira Code font files (all local, no CDN)
├── .github/workflows/  # CI and GitHub Pages deployment
└── README.md
```

## Technologies Used

* HTML5, CSS3, JavaScript (ES6+)
* [Prism.js](https://prismjs.com/) (core + every official language grammar, plugin, and theme, bundled locally) for syntax highlighting, applied per line in both views for reliable, driftless line dividers regardless of wrapping or folding
* A small in-house LCS-based line-diff and word-diff engine (`diff-utils.js`), with move/block detection, Unicode-aware tokenization, and blank-line-aware post-processing, unit tested with Jest
* A small in-house share-link engine (`share-utils.js`) using the browser's native Compression Streams API, unit tested with Jest
* A small in-house JSON formatting helper (`json-utils.js`), unit tested with Jest
* A Service Worker that precaches the full app (including every bundled Prism asset and font) for offline/PWA support from the first load

## Known Limitations / Roadmap

* The diff engine is a straightforward LCS algorithm (O(n·m)); for very large, very mismatched inputs it falls back to a coarse "everything changed" diff rather than freezing the tab, and beyond that the renderer itself caps how many rows it draws at once (with a "show more" control) rather than doing full scroll-based virtualization.
* The downloaded/copied `.diff` uses simple `--- Original` / `+++ Modified` headers without hunk (`@@`) markers, so it isn't a drop-in replacement for `git diff` output.
* Word-level highlighting is only available in the Split view. On a replaced line pair there, the changed words are highlighted but that specific line shows plain text rather than full syntax coloring (unchanged and purely added/removed lines still get full Prism syntax highlighting).
* Custom ignore-rule patterns are always case-sensitive regardless of the separate "Ignore Case" toggle; add an explicit case-insensitive character class in the pattern if needed (JavaScript regex syntax, no inline `(?i)` flag support).
* Move detection matches on exact line content (after trimming) — it won't catch a moved block that was also edited along the way.
* Share links encode the full comparison in the URL itself; very large comparisons produce very long links, which some chat apps or SMS may truncate. There's no length limit enforced, but a console warning is logged past ~6000 characters.
* The Line Numbers and Toolbar Prism plugins only apply to the plain (non-collapsed) Unified view and to the Split view's own line numbers - when Unified view collapses unchanged lines, it renders as several independently highlighted chunks, which don't support those two particular plugins (every other plugin still works per chunk).
* Batch Compare keeps everything in memory for the session — nothing is saved unless you open a pair and it gets recorded in History.
* 3-Way Merge aligns changes line-by-line against the Base rather than doing full hunk-based alignment like `git merge-file`; on a narrow edge case — one side leaves a line untouched right where the other side both changes that line *and* inserts new content immediately next to it — it can silently take the changed side instead of flagging a conflict there. Everyday single-line and non-adjacent changes (the vast majority of real merges) are handled correctly and match `git merge-file`'s output; always review the result before using it.
* No folder/three-way-merge comparison, no real-time multi-user collaboration, and no AI-generated diff summaries — these are intentionally out of scope to keep the tool 100% client-side and offline.

## Contributing

Issues and pull requests are welcome. Please run `npm run lint` and `npm run format:check` before submitting a PR.

## License

MIT License
