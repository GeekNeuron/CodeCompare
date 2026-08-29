# CodeCompare

CodeCompare is a web-based utility to compare two snippets of code or text and view a syntax-highlighted, line-by-line diff. It's built with vanilla HTML, CSS, and JavaScript (plus [Prism.js](https://prismjs.com/) for highlighting and a small dependency-free line-diff engine built into the project), so it's lightweight, works offline, and is easy to deploy anywhere static files are served, including GitHub Pages.

## Live Demo

**[https://GeekNeuron.github.io/CodeCompare/](https://GeekNeuron.github.io/CodeCompare/)**

## Features

* **Side-by-side input** — two independent text areas for the original and modified code.
* **Line-by-line diff** — showing additions, deletions, and unchanged lines, in either a Unified or a Side-by-Side (Split) view, with word-level highlighting on modified lines in Split view.
* **File upload & drag-and-drop** — load either side from a local file instead of pasting.
* **Diff summary** — a quick "N added · M removed" count above the result.
* **Copy / download diff** — copy the diff to your clipboard or download it as a `.diff` file.
* **Shareable link, no server required** — generate a link that encodes the full comparison (gzip-compressed) directly in the URL; opening it restores both snippets, the language, and the view. Nothing is ever uploaded anywhere.
* **Syntax highlighting** — pick a language from a searchable dropdown; the diff output is highlighted accordingly via Prism.js.
* **Configurable Prism plugins** — tucked under a collapsible "Advanced Settings" panel so the default view stays simple: Line Numbers, Match Braces, Show Invisibles, Inline Color, CSS Previewers, Command Line, Autolinker, WPD Links, and the copy/download toolbar buttons.
* **Ignore Whitespace / Ignore Case** — optionally normalize whitespace and/or letter case before diffing (matched lines still display their original casing).
* **Format JSON** — pretty-print valid JSON on either side (independently) before comparing, so formatting differences (minified vs. indented) don't drown out real structural changes.
* **Custom ignore rules (regex)** — one or more patterns, either dropping whole matching lines (e.g. log timestamps, `DEBUG:` lines) or stripping just the matched text within each line, before diffing. Invalid patterns are reported without blocking the valid ones.
* **Collapse unchanged lines** — long runs of unchanged lines fold into a single "Show N hidden lines" divider (a few lines of context stay visible on each side), so large files aren't a wall of unchanged text. Click a divider to expand it. Available in both views; toggle it off to always show everything.
* **Wrap long lines** — switch between horizontal scrolling (default) and wrapping long lines onto multiple visual lines, in either view.
* **English / Persian interface** — toggle the UI language (with automatic RTL layout for Persian).
* **Light/Dark theme** — defaults to your system preference; click the header icon to switch, and your choice is remembered.
* **Keyboard shortcut** — press `Ctrl+Enter` (`⌘+Enter` on Mac) from either text area to compare.
* **Settings persistence** — theme, language, UI language, and plugin toggles are saved in `localStorage`.
* **Installable / offline-ready (PWA)** — can be installed as an app and keeps working without a network connection once loaded.
* **Responsive layout** — usable on desktop, tablet, and mobile screen sizes.

## How to Use

1. Open the [live demo](https://GeekNeuron.github.io/CodeCompare/) (or run it locally, see below).
2. Paste your first snippet into **Original Code** and the second into **Modified Code** — or click **Upload File** / drag a file onto either panel.
3. Optionally pick a language and open **Advanced Settings** to adjust plugins.
4. Click **Compare** (or press `Ctrl+Enter`) to see the highlighted diff and the added/removed summary.
5. Use **Copy Diff**, **Download .diff**, or **Share Link** to export the result, or **← New Comparison** to go back and edit the inputs.

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
npm run lint          # check script.js, diff-utils.js, and service-worker.js for issues
npm run format        # auto-format js/css/html/md
npm run format:check  # verify formatting without writing changes
npm test              # run the diff-engine unit tests
```

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs tests, lint, and format checks on every push and pull request. A separate workflow (`.github/workflows/deploy.yml`) automatically deploys `main` to GitHub Pages.

## File Structure

```
CodeCompare/
├── index.html          # Page structure and markup
├── style.css           # Styling and responsive layout
├── script.js           # App logic (state, diffing, i18n, Prism integration)
├── diff-utils.js        # Dependency-free line/word-diff engine (unit tested)
├── share-utils.js        # Shareable-link encoding/decoding (unit tested)
├── json-utils.js         # JSON detection/pretty-print helpers (unit tested)
├── __tests__/            # Jest unit tests for diff-utils.js, share-utils.js, json-utils.js
├── service-worker.js   # Offline caching for the PWA app shell
├── manifest.json        # PWA metadata (name, icons, theme color)
├── icons/               # App icons used by the PWA manifest
├── lib/prism.js         # Bundled Prism.js core + language grammars
├── .github/workflows/  # CI and GitHub Pages deployment
└── README.md
```

## Technologies Used

* HTML5, CSS3, JavaScript (ES6+)
* [Prism.js](https://prismjs.com/) for syntax highlighting and its official plugins
* A small in-house LCS-based line-diff and word-diff engine (`diff-utils.js`), unit tested with Jest
* A small in-house share-link engine (`share-utils.js`) using the browser's native Compression Streams API, unit tested with Jest
* A small in-house JSON formatting helper (`json-utils.js`), unit tested with Jest
* A minimal Service Worker for offline/PWA support

## Known Limitations / Roadmap

* The diff is line-based; it does not highlight word-level changes within a modified line.
* The downloaded/copied `.diff` uses simple `--- Original` / `+++ Modified` headers without hunk (`@@`) markers, so it isn't a drop-in replacement for `git diff` output.
* The diff engine is a straightforward LCS algorithm (O(n·m)); for very large inputs it falls back to a coarse "everything changed" diff rather than freezing the tab.
* Word-level highlighting is only available in the Split view. On a replaced line pair there, the changed words are highlighted but that specific line shows plain text rather than full syntax coloring (unchanged and purely added/removed lines still get full Prism syntax highlighting).
* Custom ignore-rule patterns are always case-sensitive regardless of the separate "Ignore Case" toggle; add an explicit case-insensitive character class in the pattern if needed (JavaScript regex syntax, no inline `(?i)` flag support).
* Share links encode the full comparison in the URL itself; very large comparisons produce very long links, which some chat apps or SMS may truncate. There's no length limit enforced, but a console warning is logged past ~6000 characters.
* The Line Numbers and Toolbar Prism plugins only apply to the plain (non-collapsed) Unified view and to the Split view's own line numbers - when Unified view collapses unchanged lines, it renders as several independently highlighted chunks, which don't support those two particular plugins (every other plugin still works per chunk).

## Contributing

Issues and pull requests are welcome. Please run `npm run lint` and `npm run format:check` before submitting a PR.

## License

MIT License
