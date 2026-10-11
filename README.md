# CodeCompare

CodeCompare is a fast, private diff tool that runs entirely in your browser. Paste or drop two versions of some code or text and get a syntax-highlighted, line-by-line comparison — then keep going with batch comparison across files, a 3-way merge with one-click conflict resolution, a local history, and shareable links.

It is plain HTML, CSS and JavaScript with **no build step and no backend**. Prism.js (core, every language grammar, plugins and themes) and the Fira Code font are bundled in the repository, so it works completely offline from the very first load, and nothing you paste is ever uploaded anywhere.

## Live Demo

**[https://GeekNeuron.github.io/CodeCompare/](https://GeekNeuron.github.io/CodeCompare/)**

## Contents

- [Features](#features)
- [How to use](#how-to-use)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Privacy and stored data](#privacy-and-stored-data)
- [Running locally](#running-locally)
- [Development](#development)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing) · [License](#license)

## Features

### Compare

- **Two inputs** — Original and Modified text areas with file upload (max 2 MB) and drag-and-drop on either side. **Swap** exchanges them; **Format JSON** pretty-prints valid JSON before comparing.
- **Unified and Split views** — added, removed and unchanged lines with line numbers. Replaced lines get **word-level highlights** in both views (switchable under Advanced Settings; on those lines the highlight replaces syntax colors).
- **Move detection** — optionally mark blocks that were moved instead of removed and re-added.
- **Live Diff** — optionally re-compare while you type.
- **Navigate changes** — floating previous/next buttons with a "2 / 5" counter (works with touch), `Alt+↓/↑` on the keyboard, and a minimap of where the changes are.
- **Search inside the diff** — highlights every matching row and steps through them in either view.
- **Fold unchanged lines** — long unchanged runs collapse into a "Show N hidden lines" divider.
- **Per-line copy** — hover (or tap) a row to copy that single line.
- **Language** — 70 languages from a searchable list, or one-click offline **Auto-detect**.
- **Large inputs** — rows render in chunks of 1,500 with a "show more" control, so huge diffs do not freeze the tab.

### Ignore options

Whitespace (indentation and runs of spaces), blank lines and case are ignored at the **diff level**, not just visually. **Custom ignore rules** accept regular expressions (one per line) to drop matching lines or strip matched text; invalid patterns are reported without blocking valid ones, and rule sets can be saved as named presets. Encoding differences (line endings, BOM) are detected and offered as a one-click normalization.

### Export and share

- Copy the diff, or download it as `.diff` / `.patch`.
- **Export HTML report** — a single self-contained file that opens anywhere.
- **Print / Save as PDF** — a print layout with light colors regardless of theme.
- **Share link** — the whole comparison is gzip-compressed into the URL itself. Opening it restores the comparison; nothing touches a server.

### Dashboard

- **History** — the last 30 comparisons with language, added/removed counts and similarity; restore, delete, clear, and JSON export/import. Summary cards show totals, the most used language and average similarity.
- **Batch Compare** — choose "original" and "modified" files or whole folders; files are paired by name (or relative path), diffed together, and listed with added/removed/similarity. Files that exist on one side only are flagged as new or deleted. A summary line and **CSV / JSON report export** are included, and any pair opens in the normal Compare view.
- **3-Way Merge** — merge _Mine_ and _Theirs_ against a common _Base_. Non-overlapping and identical changes merge automatically; overlapping changes get standard `<<<<<<<` / `=======` / `>>>>>>>` markers in an editable result. Every conflict also appears as a card with **Accept Mine / Accept Theirs / Accept Both**, plus **Accept all Mine / Theirs**.

### Appearance and settings

- **Light / Dark theme** (Settings → Appearance). The first visit follows your system preference.
- **Code color theme** — Auto (follows the app theme) or one of eight Prism themes. A theme restyles the whole code area (background, text, line numbers, dividers), and a live preview in Settings shows the result immediately.
- **Auto-save drafts** — Compare and Merge inputs survive a refresh or closed tab (switch off in Settings; opening a share link never loads a draft).
- **Reset local data** — clears settings, history and drafts.
- Consistent styled dropdowns, thin scrollbars that appear only while scrolling, and no tap-highlight or pressed-state shadows on touch screens.

### Offline and responsive

- **Installable PWA** — every asset is precached by the service worker, including all language grammars and the font.
- **Responsive** — desktop, tablet and phone layouts, with a slide-in sidebar on small screens.

## How to use

1. Open the live demo (or [run it locally](#running-locally)).
2. Paste text into **Original Code** and **Modified Code**, or drop files onto the panels.
3. Optionally pick a language (or click **Auto-detect**) and open **Advanced Settings** for plugins, ignore options and word-level highlights.
4. Press **Compare** (or `Ctrl+Enter` / `⌘+Enter`).
5. Move between changes with the floating arrows, search the diff, switch Unified/Split, then export or share. **New Comparison** returns to the inputs.
6. Use the sidebar for **History**, **Batch Compare**, **3-Way Merge** and **Settings**.

## Keyboard shortcuts

The **Shortcuts** button in Compare shows these for your platform (`Ctrl`/`Alt` on Windows and Linux, `⌘`/`⌥` on macOS and iOS).

| Keys                      | Action                                                               |
| ------------------------- | -------------------------------------------------------------------- |
| `Ctrl/⌘ + Enter`          | Run the comparison                                                   |
| `Alt/⌥ + ↓` / `↑`         | Next / previous change                                               |
| `Enter` / `Shift + Enter` | Next / previous search match (in the search box)                     |
| `Esc`                     | Close a dialog, panel or dropdown                                    |
| `↑ ↓ Home End Enter`      | Move through and choose from an open dropdown; type a letter to jump |

## Privacy and stored data

All processing happens in your browser. The app stores the following in `localStorage` on your device only:

| Key                                                   | Contents                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------- |
| `codecompare-settings`                                | Theme, language, view options, plugin switches, code color theme        |
| `codecompare_history_v1`                              | Up to 30 history entries, including short snippets of the compared text |
| `codecompare-draft-v1` / `codecompare-merge-draft-v1` | Auto-saved input drafts (the full text)                                 |
| `codecompare-ignore-presets`                          | Your saved ignore-rule presets                                          |

Drafts and history contain your text in plain form. On a shared computer, turn off **Auto-save drafts** and use **Reset Data** when you are done.

## Running locally

```bash
git clone https://github.com/GeekNeuron/CodeCompare.git
cd CodeCompare
```

Because it is a static site you can open `index.html` directly. To get the same behavior as the hosted version (service worker, PWA install, some browser APIs need `http(s)://`), serve it:

```bash
npm install
npm run serve      # http-server on http://localhost:8080 with caching disabled
```

## Development

```bash
npm install
npm run lint           # ESLint: script, dashboard, select-menu, diff/share/json utils, service worker
npm run format         # Prettier: write
npm run format:check   # Prettier: check only
npm test               # Jest: unit tests for the diff, merge, conflict and encoding engine
```

Jest covers the dependency-free engines (`diff-utils.js`, `share-utils.js`, `json-utils.js`). The interface itself has no automated tests in this repository, so after UI changes it is worth checking both themes at a phone width and a desktop width, plus the Settings dropdowns.

The GitHub repository also runs CI (tests, lint, format check) and deploys `main` to GitHub Pages through workflows in `.github/workflows/`.

**Releasing a change:** the service worker caches the whole app. When you change any cached file, bump `CACHE_NAME` in `service-worker.js` (for example `codecompare-cache-v18`) and add any new file to its precache list, otherwise returning visitors keep the old version.

## Project structure

```
CodeCompare/
├── index.html          # App shell: sidebar, top bar, Compare / History / Batch / Merge / Settings views, SVG icon sprite
├── style.css           # Design tokens (dark + light palettes, radii, elevation), layout, responsive and print rules
├── script.js           # Core app: state, comparison pipeline, diff rendering, themes, exports, drafts, shortcuts
├── dashboard.js        # Sidebar navigation, History and stats, Batch Compare, 3-Way Merge UI and conflict resolver
├── select-menu.js      # Styled dropdown replacing native <select> popups (keyboard + screen-reader friendly)
├── diff-utils.js       # Dependency-free engine: line/word diff, move detection, patches, 3-way merge, conflict parsing
├── share-utils.js      # Share-link encoding/decoding (Compression Streams API)
├── json-utils.js       # JSON detection and pretty-printing
├── service-worker.js   # Precaches the whole app for offline use
├── manifest.json       # PWA metadata
├── __tests__/          # Jest tests (diff-utils)
├── icons/              # PWA icons
├── lib/                # Bundled Prism.js: core, plugins, 8 themes, language grammars
├── fonts/              # Bundled Fira Code
├── eslint.config.js, package.json
└── README.md
```

## How it works

- **Pipeline.** `runComparison()` reads both inputs, applies ignore rules, runs the LCS line diff (`computeLineDiff`) with optional case/whitespace keys, optionally post-processes blank lines and detects moved blocks, then renders unified or split rows. Replaced lines are paired (k-th removed with k-th added) to produce word-level diffs.
- **Highlighting.** Prism is applied per line so folding, wrapping and line dividers never drift. Language grammars are loaded on demand from `lib/prism/components/` by the Prism autoloader.
- **Themes.** `style.css` defines all colors as CSS variables for the dark and light palettes. A chosen Prism theme additionally sets `--code-*` variables so the code area adopts that theme's own surface.
- **Dropdowns.** `select-menu.js` keeps the real `<select>` in the DOM (hidden), mirrors its value and options, and renders the menu in a portal on `<body>` so panels never clip it.
- **Persistence.** Settings, history and drafts live in `localStorage`; shared comparisons live in the URL hash.

## Known limitations

- The diff is a straightforward LCS (O(n·m)). Very large, very different inputs fall back to a coarse "everything changed" diff, and the renderer draws rows in chunks rather than fully virtualizing the list.
- `.diff` / `.patch` files use simple `--- Original` / `+++ Modified` headers; check the output if you plan to feed it to `git apply`.
- Word-level highlighting replaces syntax colors on the lines it applies to (the other lines keep full highlighting). Turn it off under Advanced Settings if you prefer colors.
- Custom ignore-rule patterns are case-sensitive and use JavaScript regex syntax (no inline `(?i)`); use character classes such as `[Aa]` when needed.
- Move detection compares exact trimmed line content, so a block that was moved _and_ edited is shown as removed + added.
- Share links contain the whole comparison; very large ones make very long URLs that some chat apps or SMS may truncate (a console warning appears past ~6,000 characters).
- The Line Numbers and Toolbar Prism plugins only apply to the plain (non-collapsed) Unified view and to Split line numbers.
- Batch Compare keeps files in memory for the session; nothing is saved unless you open a pair and it is recorded in History.
- 3-Way Merge aligns line by line against the Base instead of full hunk alignment like `git merge-file`. In one narrow case — one side leaves a line alone exactly where the other side both changes it _and_ inserts next to it — it can take the changed side instead of flagging a conflict. Always review a merge before using it.
- Out of scope on purpose, to stay 100% client-side and offline: accounts, real-time collaboration and AI-generated summaries.

## Troubleshooting

- **I do not see the latest version.** The service worker may still be serving the old cache. Reload twice, or in your browser's developer tools clear site data for the page.
- **A long language name looks abbreviated.** On narrow screens the "Most used language" card shows a short form (for example `TS` or `PS`) only when the full name does not fit; the full name is the tooltip.
- **Dropdowns look different from a native select.** That is intentional; the real select is still present for assistive technology.
- **Something is stuck after an update.** Settings → **Reset Data** clears saved settings, history and drafts.

## Contributing

Issues and pull requests are welcome. Please run `npm run lint`, `npm test` and `npm run format:check` before submitting a PR, and describe any UI change with screenshots in light and dark themes.

## License

MIT License
