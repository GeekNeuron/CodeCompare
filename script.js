document.addEventListener('DOMContentLoaded', () => {
    const originalCodeEl = document.getElementById('original-code');
    const modifiedCodeEl = document.getElementById('modified-code');
    const compareBtn = document.getElementById('compare-btn');
    const swapBtn = document.getElementById('swap-btn');
    const shortcutsHelpBtn = document.getElementById('shortcuts-help-btn');
    const shortcutsModal = document.getElementById('shortcuts-modal');
    const shortcutsModalBody = document.getElementById('shortcuts-modal-body');
    const shortcutsModalClose = document.getElementById('shortcuts-modal-close');
    const encodingWarningEl = document.getElementById('encoding-warning');
    const encodingWarningTextEl = document.getElementById('encoding-warning-text');
    const encodingNormalizeBtn = document.getElementById('encoding-normalize-btn');
    const encodingWarningDismissBtn = document.getElementById('encoding-warning-dismiss');
    const diffSearchInput = document.getElementById('diff-search-input');
    const diffSearchCountEl = document.getElementById('diff-search-count');
    const diffSearchPrevBtn = document.getElementById('diff-search-prev-btn');
    const diffSearchNextBtn = document.getElementById('diff-search-next-btn');
    const diffMinimapEl = document.getElementById('diff-minimap');
    const detectLanguageBtn = document.getElementById('detect-language-btn');
    const formatJsonBtn = document.getElementById('format-json-btn');
    const formatJsonStatusEl = document.getElementById('format-json-status');
    const diffOutputContainer = document.getElementById('diff-output-container');
    const diffOutputEl = document.getElementById('diff-output');
    const originalLinesEl = document.getElementById('original-lines');
    const modifiedLinesEl = document.getElementById('modified-lines');
    const themeSwitcher = document.getElementById('theme-switcher');
    const prismThemeLink = document.getElementById('prism-theme-link');
    const syntaxThemeSelect = document.getElementById('syntax-theme-select');
    const langSearchInput = document.getElementById('language-search');
    const langOptionsContainer = document.getElementById('language-options');
    const pluginToggles = document.querySelectorAll('input[data-plugin]');
    const newComparisonBtn = document.getElementById('new-comparison-btn');
    const comparisonContainer = document.getElementById('comparison-container');
    const advancedSettingsEl = document.querySelector('.advanced-settings');
    const shortcutHintEl = document.getElementById('shortcut-hint');
    const changeNavEl = document.getElementById('change-nav');
    const changeNavCountEl = document.getElementById('change-nav-count');
    const changePrevBtn = document.getElementById('change-prev-btn');
    const changeNextBtn = document.getElementById('change-next-btn');
    const shortcutsPlatformEl = document.getElementById('shortcuts-platform');
    const uploadOriginalBtn = document.getElementById('upload-original-btn');
    const uploadModifiedBtn = document.getElementById('upload-modified-btn');
    const uploadOriginalInput = document.getElementById('upload-original-input');
    const uploadModifiedInput = document.getElementById('upload-modified-input');
    const diffStatsEl = document.getElementById('diff-stats');
    const copyDiffBtn = document.getElementById('copy-diff-btn');
    const downloadDiffBtn = document.getElementById('download-diff-btn');
    const downloadPatchBtn = document.getElementById('download-patch-btn');
    const exportHtmlBtn = document.getElementById('export-html-btn');
    const printPdfBtn = document.getElementById('print-pdf-btn');
    const shareLinkBtn = document.getElementById('share-link-btn');
    const viewUnifiedBtn = document.getElementById('view-unified-btn');
    const viewSplitBtn = document.getElementById('view-split-btn');
    const diffSplitView = document.getElementById('diff-split-view');
    const splitLeftEl = document.getElementById('split-left');
    const splitRightEl = document.getElementById('split-right');
    const collapseUnchangedToggle = document.getElementById('collapse-unchanged-toggle');
    const wrapLinesToggle = document.getElementById('wrap-lines-toggle');
    const liveDiffToggle = document.getElementById('live-diff-toggle');
    const detectMovedToggle = document.getElementById('detect-moved-toggle');
    const diffOutputLinesEl = document.getElementById('diff-output-lines');
    const ignorePatternsInput = document.getElementById('ignore-patterns-input');
    const ignoreRulesMode = document.getElementById('ignore-rules-mode');
    const ignorePresetSelect = document.getElementById('ignore-preset-select');
    const ignorePresetSaveBtn = document.getElementById('ignore-preset-save-btn');
    const ignorePresetDeleteBtn = document.getElementById('ignore-preset-delete-btn');
    const ignoreRulesStatusEl = document.getElementById('ignore-rules-status');
    const STORAGE_KEY = 'codecompare-settings';
    const MAX_UPLOAD_SIZE = 2 * 1024 * 1024;
    let lastDiffEntries = null;
    let isSyncingScroll = false;
    const FOLD_CONTEXT = 3;
    const FOLD_MIN_RUN = 8;
    const RENDER_CHUNK_SIZE = 1500;
    let unifiedRenderLimit = RENDER_CHUNK_SIZE;
    let splitRenderLimit = RENDER_CHUNK_SIZE;
    let expandedUnifiedFolds = new Set();
    let expandedSplitFolds = new Set();
    let formatJsonStatusTimer = null;

    const icon = (name, cls) =>
        `<svg class="ico${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;

    function detectPlatform() {
        const uaData = navigator.userAgentData;
        const ua = navigator.userAgent || '';
        const raw = (uaData && uaData.platform) || navigator.platform || '';
        if (/android/i.test(ua)) return { id: 'android', label: 'Android' };
        if (/iphone|ipad|ipod/i.test(ua)) return { id: 'ios', label: 'iOS' };
        if (/mac/i.test(raw) || /mac os/i.test(ua)) return { id: 'mac', label: 'macOS' };
        if (/win/i.test(raw) || /windows/i.test(ua)) return { id: 'windows', label: 'Windows' };
        if (/cros/i.test(ua)) return { id: 'linux', label: 'ChromeOS' };
        if (/linux|x11/i.test(raw) || /linux|x11/i.test(ua)) return { id: 'linux', label: 'Linux' };
        return { id: 'other', label: 'your system' };
    }

    const PLATFORM = detectPlatform();
    const IS_MAC = PLATFORM.id === 'mac' || PLATFORM.id === 'ios';
    const MOD_KEY = IS_MAC ? '\u2318' : 'Ctrl';
    const ALT_KEY = IS_MAC ? '\u2325' : 'Alt';

    const translations = {
        en: {
            pageTitle: 'CodeCompare Pro',
            viewOnGithub: 'View on GitHub',
            languageLabel: 'Language:',
            languageSearchPlaceholder: 'Search language...',
            advancedSettings: 'Advanced Settings',
            pluginsLabel: 'Plugins:',
            pluginShowInvisibles: 'Show Invisibles',
            pluginAutolinker: 'Autolinker',
            pluginMatchBraces: 'Match Braces',
            pluginInlineColor: 'Inline Color',
            pluginPreviewers: 'CSS Previewers',
            pluginCommandLine: 'Command Line',
            processingLabel: 'Processing:',
            ignoreWhitespace: 'Ignore Whitespace',
            ignoreBlankLines: 'Ignore Blank Lines',
            ignorePresetPlaceholder: '— Saved presets —',
            ignorePresetSave: 'Save preset',
            ignorePresetDelete: 'Delete preset',
            swapButton: 'Swap',
            shortcutsHelp: 'Shortcuts',
            detectLanguage: 'Auto-detect',
            ignoreCase: 'Ignore Case',
            liveDiff: 'Live Diff (auto-compare while typing)',
            detectMoved: 'Highlight Moved Code',
            customIgnoreRules: 'Custom Ignore Rules (regex, one per line):',
            ignorePatternsPlaceholder: 'e.g. \\d{4}-\\d{2}-\\d{2}',
            ignoreRemoveLines: 'Remove matching lines',
            ignoreStripMatches: 'Strip matches within lines',
            originalCode: 'Original Code',
            modifiedCode: 'Modified Code',
            uploadFile: 'Upload File',
            compareButton: 'Compare',
            formatJson: 'Format JSON',
            formatJsonSuccess: 'Formatted as JSON.',
            formatJsonEmpty: 'Nothing to format yet — paste some content first.',
            formatJsonNoValidJson: "Neither side looks like valid JSON.",
            newComparison: 'New Comparison',
            unifiedView: 'Unified',
            splitView: 'Split',
            collapseUnchanged: 'Collapse unchanged lines',
            wrapLines: 'Wrap long lines',
            foldShowLines: 'Show {count} hidden unchanged lines',
            loadMoreRows: 'Show {count} more rows ({remaining} hidden for performance)',
            copyDiff: 'Copy Diff',
            copyDiffDone: 'Copied!',
            downloadDiff: 'Download .diff',
            downloadPatch: 'Download .patch',
            exportHtmlReport: 'Export HTML Report',
            printPdf: 'Print / Save as PDF',
            shareLink: 'Share Link',
            shareLinkCopied: 'Link copied!',
            shareLinkManualCopy: 'Copy this link to share your comparison:',
            copyLineManual: 'Copy this line:',
            searchInDiff: 'Search in diff...',
            searchNoMatches: 'No matches',
            searchMatchCount: '{current}/{total}',
            copyDiffManualCopy: 'Copy this diff:',
            shareLinkTooLong: 'Note: this link is quite long and may not work everywhere (e.g. some chat apps truncate long links).',
            normalizeAndRecompare: 'Normalize and re-compare',
            shareLoadFailed: 'Could not load the shared comparison from this link (it may be corrupted or use an unsupported format).',
            legendAdded: '+ added',
            legendRemoved: '\u2212 removed',
            legendUnchanged: 'unchanged',
            linesLabel: 'Lines',
            statsSummary: '{added} added \u00b7 {removed} removed',
            uploadTooLarge: 'File is too large to load (max 2MB).',
            uploadFailed: 'Could not read that file.',
            navCompare: 'Compare',
            navHistory: 'History',
            navSettings: 'Settings',
            navBatch: 'Batch Compare',
            navMerge: '3-Way Merge',
            mergeTitle: 'Three-Way Merge',
            mergeRun: 'Merge',
            mergeHint: 'Compare Mine and Theirs against a common Base. Non-overlapping changes merge automatically; overlapping changes are marked as conflicts for you to resolve.',
            mergeBaseLabel: 'Base',
            mergeMineLabel: 'Mine',
            mergeTheirsLabel: 'Theirs',
            mergeResultTitle: 'Merge Result',
            mergeCopy: 'Copy Result',
            mergeDownload: 'Download Result',
            batchTitle: 'Batch Compare Files',
            batchOriginalFiles: 'Original files',
            batchModifiedFiles: 'Modified files',
            batchSelectFiles: 'Select Files...',
            batchSelectFolder: 'Select Folder...',
            batchRun: 'Run Batch Compare',
            batchHint: 'Files are matched by name (or by relative path when a folder is selected). Files present on only one side are listed as fully added or removed.',
            statTotalRuns: 'Comparisons run',
            statLinesAdded: 'Lines added',
            statLinesRemoved: 'Lines removed',
            statTopLanguage: 'Most used language',
            statAvgSimilarity: 'Average similarity',
            exportHistory: 'Export',
            importHistory: 'Import',
            importSuccess: 'Imported!',
            importFailed: 'Import failed',
            historyTitle: 'Comparison History',
            clearHistory: 'Clear History',
            historyEmpty: 'No comparisons yet. Run one from the Compare tab.',
            historyRestore: 'Restore',
            historyDelete: 'Delete',
            settingsTitle: 'Settings',
            settingsAppearance: 'Appearance',
            settingsAppearanceHint: 'Switch between light and dark theme from the top bar.',
            settingsSyntaxThemeTitle: 'Code color theme',
            settingsSyntaxThemeHint: 'Choose the syntax highlighting theme used for code.',
            themeAuto: 'Auto (match app theme)',
            settingsResetTitle: 'Reset local data',
            settingsResetHint: 'Clears saved preferences and comparison history stored in this browser.',
            settingsResetButton: 'Reset Data',
            settingsAboutTitle: 'About',
            settingsAboutHint: 'CodeCompare is an open-source, client-side diff tool.',
            resetConfirm: 'This will clear all saved settings and comparison history. Continue?'
        }
    };

    const state = {
        language: 'javascript',
        diffView: 'unified',
        collapseUnchanged: true,
        wrapLines: false,
        liveDiff: false,
        detectMoved: false,
        ignorePatterns: [],
        ignoreRulesMode: 'removeLines',
        isDarkTheme: (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? false : true,
        syntaxTheme: 'auto',
        plugins: {
            'show-invisibles': false, 'autolinker': true,
            'match-braces': true, 'inline-color': false, 'previewers': true,
            'command-line': false,
            'normalize-whitespace': false,
            'ignore-blank-lines': false,
            'ignore-case': false,
            'word-diff': true,
            'autosave-draft': true
        }
    };

    function init() {
        if (Prism.plugins && Prism.plugins.autoloader) {
            Prism.plugins.autoloader.languages_path = 'lib/prism/components/';
        }
        loadSettings();
        setupEventListeners();
        populateLanguages();
        loadInitialCode();
        updateLineCounts();
        updatePluginCheckboxes();
        applyTheme();
        if (syntaxThemeSelect) syntaxThemeSelect.value = state.syntaxTheme;
        applyUiLanguage();
        applyShortcutLabels();
        syncViewToggleButtons();
        collapseUnchangedToggle.checked = state.collapseUnchanged;
        wrapLinesToggle.checked = state.wrapLines;
        if (liveDiffToggle) liveDiffToggle.checked = state.liveDiff;
        if (detectMovedToggle) detectMovedToggle.checked = state.detectMoved;
        diffOutputContainer.classList.toggle('wrap-lines', state.wrapLines);
        ignorePatternsInput.value = state.ignorePatterns.join('\n');
        ignoreRulesMode.value = state.ignoreRulesMode;
        renderIgnorePresetOptions();
        registerServiceWorker();
        loadSharedComparisonFromUrl();
    }

    function applyShortcutLabels() {
        if (shortcutHintEl) shortcutHintEl.textContent = `Tip: press ${MOD_KEY}+Enter to compare`;
        if (compareBtn) compareBtn.title = `Shortcut: ${MOD_KEY}+Enter`;
    }

    function loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved && typeof saved === 'object') {
                if (typeof saved.isDarkTheme === 'boolean') state.isDarkTheme = saved.isDarkTheme;
                if (typeof saved.syntaxTheme === 'string' && PRISM_THEMES.hasOwnProperty(saved.syntaxTheme)) {
                    state.syntaxTheme = saved.syntaxTheme;
                }
                if (saved.plugins && typeof saved.plugins === 'object') {
                    Object.assign(state.plugins, saved.plugins);
                }
                if (typeof saved.language === 'string') state.language = saved.language;
                if (saved.diffView === 'unified' || saved.diffView === 'split') state.diffView = saved.diffView;
                if (typeof saved.collapseUnchanged === 'boolean') state.collapseUnchanged = saved.collapseUnchanged;
                if (typeof saved.wrapLines === 'boolean') state.wrapLines = saved.wrapLines;
                if (typeof saved.liveDiff === 'boolean') state.liveDiff = saved.liveDiff;
                if (typeof saved.detectMoved === 'boolean') state.detectMoved = saved.detectMoved;
                if (Array.isArray(saved.ignorePatterns)) state.ignorePatterns = saved.ignorePatterns;
                if (saved.ignoreRulesMode === 'removeLines' || saved.ignoreRulesMode === 'stripMatches') {
                    state.ignoreRulesMode = saved.ignoreRulesMode;
                }
            }
        } catch (err) {
            console.warn('Could not load saved settings:', err);
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                isDarkTheme: state.isDarkTheme,
                syntaxTheme: state.syntaxTheme,
                plugins: state.plugins,
                language: state.language,
                diffView: state.diffView,
                collapseUnchanged: state.collapseUnchanged,
                wrapLines: state.wrapLines,
                liveDiff: state.liveDiff,
                detectMoved: state.detectMoved,
                ignorePatterns: state.ignorePatterns,
                ignoreRulesMode: state.ignoreRulesMode
            }));
        } catch (err) {
            console.warn('Could not save settings:', err);
        }
    }

    function t(key, vars) {
        let text = translations.en[key] !== undefined ? translations.en[key] : key;
        if (vars) {
            Object.keys(vars).forEach(k => {
                text = text.replace(`{${k}}`, vars[k]);
            });
        }
        return text;
    }

    function applyUiLanguage() {
        document.title = t('pageTitle');

        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = t(el.dataset.i18n);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = t(el.dataset.i18nPlaceholder);
        });

        updateLineCounts();
        if (diffOutputContainer.style.display !== 'none' && lastDiffEntries) {
            const { added, removed } = CodeCompareDiff.computeStats(lastDiffEntries);
            diffStatsEl.textContent = t('statsSummary', { added, removed });
        }
    }

    function setupEventListeners() {
        compareBtn.addEventListener('click', () => runComparison());
        if (swapBtn) swapBtn.addEventListener('click', swapCode);
        if (shortcutsHelpBtn) shortcutsHelpBtn.addEventListener('click', showShortcutsHelp);
        if (detectLanguageBtn) {
            detectLanguageBtn.addEventListener('click', () => {
                const sample = originalCodeEl.value || modifiedCodeEl.value;
                const guessed = guessLanguage(sample);
                if (guessed && SUPPORTED_LANGUAGES[guessed]) {
                    selectLanguage(guessed);
                }
            });
        }
        formatJsonBtn.addEventListener('click', formatBothAsJson);
        originalCodeEl.addEventListener('input', scheduleDraftSave);
        modifiedCodeEl.addEventListener('input', scheduleDraftSave);
        originalCodeEl.addEventListener('input', updateLineCounts);
        modifiedCodeEl.addEventListener('input', updateLineCounts);
        originalCodeEl.addEventListener('input', () => { uploadedLineEndingStyle.original = null; uploadedBom.original = null; });
        modifiedCodeEl.addEventListener('input', () => { uploadedLineEndingStyle.modified = null; uploadedBom.modified = null; });

        let liveDiffTimer = null;
        const scheduleLiveDiff = () => {
            if (!state.liveDiff) return;
            clearTimeout(liveDiffTimer);
            liveDiffTimer = setTimeout(() => {
                if (originalCodeEl.value !== '' || modifiedCodeEl.value !== '') {
                    runComparison({ live: true });
                }
            }, 500);
        };
        originalCodeEl.addEventListener('input', scheduleLiveDiff);
        modifiedCodeEl.addEventListener('input', scheduleLiveDiff);
        if (liveDiffToggle) {
            liveDiffToggle.addEventListener('change', () => {
                state.liveDiff = liveDiffToggle.checked;
                saveSettings();
                if (state.liveDiff) scheduleLiveDiff();
            });
        }
        if (detectMovedToggle) {
            detectMovedToggle.addEventListener('change', () => {
                state.detectMoved = detectMovedToggle.checked;
                saveSettings();
                if (diffOutputContainer.style.display !== 'none') {
                    runComparison({ record: false });
                }
            });
        }

        const compareShortcut = e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                runComparison();
            }
        };
        originalCodeEl.addEventListener('keydown', compareShortcut);
        modifiedCodeEl.addEventListener('keydown', compareShortcut);

        document.addEventListener('keydown', e => {
            if (e.altKey && e.key === 'ArrowDown') {
                e.preventDefault();
                jumpToChange(1);
            } else if (e.altKey && e.key === 'ArrowUp') {
                e.preventDefault();
                jumpToChange(-1);
            } else if (e.key === 'Escape') {
                if (shortcutsModal && !shortcutsModal.hidden) {
                    hideShortcutsHelp();
                } else if (advancedSettingsEl && advancedSettingsEl.open) {
                    advancedSettingsEl.open = false;
                }
            }
        });

        document.addEventListener('click', e => {
            if (advancedSettingsEl && advancedSettingsEl.open && !advancedSettingsEl.contains(e.target)) {
                advancedSettingsEl.open = false;
            }
        });

        window.addEventListener('resize', () => {
            if (diffOutputContainer.style.display !== 'none') sizeMinimap();
        });

        const scrollTimers = new WeakMap();
        document.addEventListener('scroll', e => {
            const el = e.target === document ? document.documentElement : e.target;
            if (!el || !el.classList) return;
            el.classList.add('is-scrolling');
            clearTimeout(scrollTimers.get(el));
            scrollTimers.set(el, setTimeout(() => el.classList.remove('is-scrolling'), 900));
        }, true);

        if (shortcutsModalClose) shortcutsModalClose.addEventListener('click', hideShortcutsHelp);
        if (encodingNormalizeBtn) encodingNormalizeBtn.addEventListener('click', normalizeInputsAndRecompare);
        if (encodingWarningDismissBtn) {
            encodingWarningDismissBtn.addEventListener('click', () => {
                encodingWarningEl.hidden = true;
            });
        }
        if (diffSearchInput) {
            diffSearchInput.addEventListener('input', applyDiffSearch);
            diffSearchInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    goToSearchMatch(e.shiftKey ? -1 : 1);
                }
            });
        }
        if (diffSearchPrevBtn) diffSearchPrevBtn.addEventListener('click', () => goToSearchMatch(-1));
        if (diffSearchNextBtn) diffSearchNextBtn.addEventListener('click', () => goToSearchMatch(1));
        if (diffMinimapEl) {
            diffMinimapEl.addEventListener('click', e => handleMinimapClick(e.clientY));
            diffMinimapEl.addEventListener('keydown', e => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                const rect = diffMinimapEl.getBoundingClientRect();
                handleMinimapClick(rect.top + rect.height / 2);
            });
        }
        if (shortcutsModal) {
            shortcutsModal.addEventListener('click', e => {
                if (e.target === shortcutsModal) hideShortcutsHelp();
            });
        }

        themeSwitcher.addEventListener('click', toggleTheme);
        if (syntaxThemeSelect) {
            syntaxThemeSelect.addEventListener('change', () => {
                state.syntaxTheme = syntaxThemeSelect.value;
                applyTheme();
                saveSettings();
            });
        }

        langSearchInput.addEventListener('input', filterLanguages);
        langSearchInput.addEventListener('focus', () => {
            langOptionsContainer.classList.add('visible');
            langSearchInput.setAttribute('aria-expanded', 'true');
        });
        document.addEventListener('click', e => {
            if (!e.target.closest('.searchable-select-wrapper')) {
                langOptionsContainer.classList.remove('visible');
                langSearchInput.setAttribute('aria-expanded', 'false');
            }
        });

        pluginToggles.forEach(toggle => {
            toggle.addEventListener('change', () => {
                const plugin = toggle.dataset.plugin;
                state.plugins[plugin] = toggle.checked;
                saveSettings();
                if (plugin === 'autosave-draft') {
                    if (toggle.checked) {
                        saveDraft();
                        if (window.CodeCompareDashboard && window.CodeCompareDashboard.saveMergeDraft) window.CodeCompareDashboard.saveMergeDraft();
                    } else {
                        try { localStorage.removeItem(DRAFT_KEY); localStorage.removeItem('codecompare-merge-draft-v1'); } catch (err) { console.warn('Could not clear drafts:', err); }
                    }
                }
                if (diffOutputContainer.style.display !== 'none') {
                    runComparison({ record: false });
                }
            });
        });

        newComparisonBtn.addEventListener('click', showInputView);
        if (changePrevBtn) changePrevBtn.addEventListener('click', () => jumpToChange(-1));
        if (changeNextBtn) changeNextBtn.addEventListener('click', () => jumpToChange(1));

        uploadOriginalBtn.addEventListener('click', () => uploadOriginalInput.click());
        uploadModifiedBtn.addEventListener('click', () => uploadModifiedInput.click());
        uploadOriginalInput.addEventListener('change', () => handleFileUpload(uploadOriginalInput, originalCodeEl, 'original'));
        uploadModifiedInput.addEventListener('change', () => handleFileUpload(uploadModifiedInput, modifiedCodeEl, 'modified'));

        setupDragAndDrop(originalCodeEl, 'original');
        setupDragAndDrop(modifiedCodeEl, 'modified');

        copyDiffBtn.addEventListener('click', copyDiffToClipboard);
        downloadDiffBtn.addEventListener('click', downloadDiffFile);
        if (downloadPatchBtn) downloadPatchBtn.addEventListener('click', downloadPatchFile);
        if (exportHtmlBtn) exportHtmlBtn.addEventListener('click', exportHtmlReport);
        if (printPdfBtn) printPdfBtn.addEventListener('click', () => window.print());
        shareLinkBtn.addEventListener('click', generateAndCopyShareLink);

        viewUnifiedBtn.addEventListener('click', () => setDiffView('unified'));
        viewSplitBtn.addEventListener('click', () => setDiffView('split'));
        setupSplitScrollSync();

        collapseUnchangedToggle.addEventListener('change', () => {
            state.collapseUnchanged = collapseUnchangedToggle.checked;
            expandedUnifiedFolds = new Set();
            expandedSplitFolds = new Set();
            saveSettings();
            renderDiffOutput();
        });

        wrapLinesToggle.addEventListener('change', () => {
            state.wrapLines = wrapLinesToggle.checked;
            diffOutputContainer.classList.toggle('wrap-lines', state.wrapLines);
            saveSettings();
        });

        const onIgnoreRulesChange = () => {
            state.ignorePatterns = ignorePatternsInput.value.split('\n');
            state.ignoreRulesMode = ignoreRulesMode.value;
            saveSettings();
            if (diffOutputContainer.style.display !== 'none') {
                runComparison({ record: false });
            }
        };
        ignorePatternsInput.addEventListener('change', onIgnoreRulesChange);
        ignoreRulesMode.addEventListener('change', onIgnoreRulesChange);

        if (ignorePresetSelect) {
            ignorePresetSelect.addEventListener('change', applySelectedPreset);
        }
        if (ignorePresetSaveBtn) {
            ignorePresetSaveBtn.addEventListener('click', saveCurrentAsPreset);
        }
        if (ignorePresetDeleteBtn) {
            ignorePresetDeleteBtn.addEventListener('click', deleteSelectedPreset);
        }

        diffOutputContainer.addEventListener('click', e => {
            const loadMoreBtn = e.target.closest('[data-load-more]');
            if (loadMoreBtn) {
                if (loadMoreBtn.dataset.loadMore === 'unified') {
                    unifiedRenderLimit += RENDER_CHUNK_SIZE;
                } else {
                    splitRenderLimit += RENDER_CHUNK_SIZE;
                }
                renderDiffOutput();
                return;
            }

            const copyBtn = e.target.closest('.copy-line-btn');
            if (copyBtn) {
                const lineEl = copyBtn.closest('.unified-line, .split-line');
                const codeEl = lineEl && lineEl.querySelector('.unified-line-code, .split-line-code');
                if (!codeEl) return;
                const text = codeEl.textContent;
                const flash = ok => {
                    copyBtn.innerHTML = icon(ok ? 'check' : 'x');
                    setTimeout(() => { copyBtn.innerHTML = icon('copy'); }, 900);
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(() => flash(true)).catch(() => flash(false));
                } else {
                    window.prompt(t('copyLineManual'), text);
                }
            }
        });

        diffOutputLinesEl.addEventListener('click', e => {
            const divider = e.target.closest('.fold-divider');
            if (!divider) return;
            expandedUnifiedFolds.add(Number(divider.dataset.foldId));
            renderDiffOutput();
        });
        diffOutputLinesEl.addEventListener('keydown', e => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const divider = e.target.closest('.fold-divider');
            if (!divider) return;
            e.preventDefault();
            expandedUnifiedFolds.add(Number(divider.dataset.foldId));
            renderDiffOutput();
        });

        diffSplitView.addEventListener('click', e => {
            const divider = e.target.closest('.split-fold-divider');
            if (!divider) return;
            expandedSplitFolds.add(Number(divider.dataset.foldId));
            renderDiffOutput();
        });
        diffSplitView.addEventListener('keydown', e => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const divider = e.target.closest('.split-fold-divider');
            if (!divider) return;
            e.preventDefault();
            expandedSplitFolds.add(Number(divider.dataset.foldId));
            renderDiffOutput();
        });
    }

    function showInputView() {
        diffOutputContainer.style.display = 'none';
        comparisonContainer.style.display = '';
        document.getElementById('view-compare').classList.remove('diff-open');
    }

    const uploadedLineEndingStyle = { original: null, modified: null };
    const uploadedBom = { original: null, modified: null };

    function detectBomFromFile(file) {
        if (!file.slice || typeof file.slice(0, 3).arrayBuffer !== 'function') {
            return Promise.resolve(false);
        }
        return file.slice(0, 3).arrayBuffer().then(buf => {
            const bytes = new Uint8Array(buf);
            return bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
        }).catch(() => false);
    }

    function handleFileUpload(inputEl, targetTextarea, side) {
        const file = inputEl.files && inputEl.files[0];
        inputEl.value = '';
        if (!file) return;
        loadFileIntoTextarea(file, targetTextarea, side);
    }

    function setupDragAndDrop(textarea, side) {
        textarea.addEventListener('dragover', e => {
            e.preventDefault();
            textarea.classList.add('drag-over');
        });
        textarea.addEventListener('dragleave', () => textarea.classList.remove('drag-over'));
        textarea.addEventListener('drop', e => {
            e.preventDefault();
            textarea.classList.remove('drag-over');
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) loadFileIntoTextarea(file, textarea, side);
        });
    }

    function loadFileIntoTextarea(file, textarea, side) {
        if (file.size > MAX_UPLOAD_SIZE) {
            alert(t('uploadTooLarge'));
            return;
        }
        detectBomFromFile(file).then(hasBom => {
            if (side === 'original' || side === 'modified') {
                uploadedBom[side] = hasBom;
            }
            const reader = new FileReader();
            reader.onload = () => {
                const raw = reader.result;
                if (side === 'original' || side === 'modified') {
                    uploadedLineEndingStyle[side] = CodeCompareDiff.detectLineEndingStyle(raw);
                }
                textarea.value = raw;
                updateLineCounts();
            };
            reader.onerror = () => alert(t('uploadFailed'));
            reader.readAsText(file);
        });
    }

    function formatBothAsJson() {
        const sides = [
            { el: originalCodeEl, label: t('originalCode') },
            { el: modifiedCodeEl, label: t('modifiedCode') }
        ].filter(side => side.el.value.trim() !== '');

        const results = sides.map(side => {
            const result = CodeCompareJson.tryFormatJson(side.el.value);
            if (result.ok) side.el.value = result.formatted;
            return { label: side.label, ...result };
        });

        updateLineCounts();

        const succeeded = results.filter(r => r.ok);
        const failed = results.filter(r => !r.ok);

        if (succeeded.length > 0) {
            state.language = 'json';
            populateLanguages();
            saveSettings();
        }

        showFormatJsonStatus(results, succeeded, failed);

        if (diffOutputContainer.style.display !== 'none') {
            runComparison({ record: false });
        }
    }

    function showFormatJsonStatus(results, succeeded, failed) {
        let message;
        let isError;

        if (results.length === 0) {
            message = t('formatJsonEmpty');
            isError = true;
        } else if (succeeded.length === 0) {
            message = t('formatJsonNoValidJson');
            isError = true;
        } else if (failed.length > 0) {
            message = failed.map(f => `${f.label}: ${f.error}`).join(' \u2014 ');
            isError = true;
        } else {
            message = t('formatJsonSuccess');
            isError = false;
        }

        formatJsonStatusEl.textContent = message;
        formatJsonStatusEl.classList.toggle('format-json-error', isError);
        clearTimeout(formatJsonStatusTimer);
        formatJsonStatusTimer = setTimeout(() => { formatJsonStatusEl.textContent = ''; }, 6000);
    }

    function swapCode() {
        const temp = originalCodeEl.value;
        originalCodeEl.value = modifiedCodeEl.value;
        modifiedCodeEl.value = temp;
        const tempStyle = uploadedLineEndingStyle.original;
        uploadedLineEndingStyle.original = uploadedLineEndingStyle.modified;
        uploadedLineEndingStyle.modified = tempStyle;
        const tempBom = uploadedBom.original;
        uploadedBom.original = uploadedBom.modified;
        uploadedBom.modified = tempBom;
        updateLineCounts();
        if (diffOutputContainer.style.display !== 'none') {
            runComparison({ record: false });
        }
    }

    let shortcutsReturnFocusEl = null;

    function showShortcutsHelp() {
        const rows = [
            [`${MOD_KEY} + Enter`, 'Run comparison'],
            [`${ALT_KEY} + \u2193`, 'Jump to next change'],
            [`${ALT_KEY} + \u2191`, 'Jump to previous change'],
            ['Enter', 'Next search match (in search box)'],
            ['Shift + Enter', 'Previous search match (in search box)'],
            ['Esc', 'Close this dialog']
        ];
        if (shortcutsPlatformEl) {
            shortcutsPlatformEl.textContent = IS_MAC
                ? `Shown for ${PLATFORM.label}: \u2318 is Command, \u2325 is Option.`
                : `Shown for ${PLATFORM.label}: use the Ctrl and Alt keys.`;
        }
        shortcutsModalBody.innerHTML = '';
        rows.forEach(([key, desc]) => {
            const row = document.createElement('div');
            row.className = 'shortcut-row';
            const kbd = document.createElement('kbd');
            kbd.textContent = key;
            const span = document.createElement('span');
            span.textContent = desc;
            row.appendChild(kbd);
            row.appendChild(span);
            shortcutsModalBody.appendChild(row);
        });
        shortcutsReturnFocusEl = document.activeElement;
        shortcutsModal.hidden = false;
        if (shortcutsModalClose) shortcutsModalClose.focus();
    }

    function hideShortcutsHelp() {
        shortcutsModal.hidden = true;
        if (shortcutsReturnFocusEl && shortcutsReturnFocusEl.focus) shortcutsReturnFocusEl.focus();
        shortcutsReturnFocusEl = null;
    }

    function getChangeGroupStarts() {
        if (!lastDiffEntries) return [];
        if (state.diffView === 'split') {
            const rows = CodeCompareDiff.buildSideBySideRows(lastDiffEntries);
            const starts = [];
            let inGroup = false;
            rows.forEach((row, index) => {
                const isChange = row.left.type !== 'unchanged' || row.right.type !== 'unchanged';
                if (isChange) {
                    if (!inGroup) starts.push(index);
                    inGroup = true;
                } else {
                    inGroup = false;
                }
            });
            return starts;
        }
        const starts = [];
        let inGroup = false;
        lastDiffEntries.forEach((entry, index) => {
            if (entry.type !== 'unchanged') {
                if (!inGroup) starts.push(index);
                inGroup = true;
            } else {
                inGroup = false;
            }
        });
        return starts;
    }

    let diffSearchMatches = [];
    let diffSearchCurrent = -1;

    function applyDiffSearch() {
        if (!diffSearchInput) return;
        const query = diffSearchInput.value.trim().toLowerCase();
        const container = state.diffView === 'split' ? diffSplitView : diffOutputLinesEl;
        const rows = container.querySelectorAll('.unified-line, .split-line');
        rows.forEach(row => row.classList.remove('search-match', 'search-match-current'));

        if (!query) {
            diffSearchMatches = [];
            diffSearchCurrent = -1;
            if (diffSearchCountEl) diffSearchCountEl.textContent = '';
            return;
        }

        diffSearchMatches = Array.from(rows).filter(row => {
            const codeEl = row.querySelector('.unified-line-code, .split-line-code');
            return codeEl && codeEl.textContent.toLowerCase().includes(query);
        });
        diffSearchMatches.forEach(row => row.classList.add('search-match'));

        if (diffSearchMatches.length === 0) {
            diffSearchCurrent = -1;
            if (diffSearchCountEl) diffSearchCountEl.textContent = t('searchNoMatches');
            return;
        }

        diffSearchCurrent = 0;
        highlightCurrentSearchMatch();
    }

    function highlightCurrentSearchMatch() {
        diffSearchMatches.forEach(row => row.classList.remove('search-match-current'));
        if (diffSearchCurrent < 0 || diffSearchMatches.length === 0) return;
        const row = diffSearchMatches[diffSearchCurrent];
        row.classList.add('search-match-current');
        if (row.scrollIntoView) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (diffSearchCountEl) {
            diffSearchCountEl.textContent = t('searchMatchCount', { current: diffSearchCurrent + 1, total: diffSearchMatches.length });
        }
    }

    function goToSearchMatch(direction) {
        if (diffSearchMatches.length === 0) return;
        diffSearchCurrent = (diffSearchCurrent + direction + diffSearchMatches.length) % diffSearchMatches.length;
        highlightCurrentSearchMatch();
    }

    function updateChangeNav(position, total) {
        if (!changeNavEl) return;
        changeNavEl.hidden = total === 0;
        if (changeNavCountEl) {
            changeNavCountEl.textContent = position >= 0
                ? `${position + 1} / ${total}`
                : `${total} ${total === 1 ? 'change' : 'changes'}`;
        }
    }

    // On desktop the diff panel scrolls itself; on small screens the whole page area scrolls instead.
    function getDiffScroller() {
        const overflowY = window.getComputedStyle(diffOutputContainer).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') return diffOutputContainer;
        return diffOutputContainer.closest('.app-content') || diffOutputContainer;
    }

    let lastJumpPosition = -1;
    let lastJumpTime = 0;

    function jumpToChange(direction) {
        if (diffOutputContainer.style.display === 'none') return;
        const starts = getChangeGroupStarts();
        if (starts.length === 0) return;

        const attr = state.diffView === 'split' ? 'data-row-index' : 'data-entry-index';
        const container = state.diffView === 'split' ? diffSplitView : diffOutputLinesEl;
        const findEl = index => container.querySelector(`[${attr}="${index}"]`);

        const scroller = getDiffScroller();
        const containerRect = scroller.getBoundingClientRect();
        const viewTop = containerRect.top;
        const viewBottom = containerRect.top + (scroller.clientHeight || 0);
        const now = Date.now();

        // Is the change we jumped to last still on screen (or is a smooth scroll to it still running)?
        let activeInView = false;
        if (lastJumpPosition >= 0 && lastJumpPosition < starts.length) {
            const activeEl = findEl(starts[lastJumpPosition]);
            if (activeEl) {
                const r = activeEl.getBoundingClientRect();
                activeInView = r.top >= viewTop && r.bottom <= viewBottom;
            }
        }

        let targetIndex;
        if (lastJumpPosition >= 0 && lastJumpPosition < starts.length && (activeInView || now - lastJumpTime < 1200)) {
            const step = lastJumpPosition + direction;
            targetIndex = starts[(step + starts.length) % starts.length];
        } else if (direction > 0) {
            targetIndex = starts.find(i => {
                const el = findEl(i);
                return el && el.getBoundingClientRect().top > viewTop + 40;
            });
            if (targetIndex === undefined) targetIndex = starts[0];
        } else {
            const reversed = [...starts].reverse();
            targetIndex = reversed.find(i => {
                const el = findEl(i);
                return el && el.getBoundingClientRect().bottom < viewTop + 10;
            });
            if (targetIndex === undefined) targetIndex = starts[starts.length - 1];
        }
        lastJumpPosition = starts.indexOf(targetIndex);
        lastJumpTime = now;

        updateChangeNav(starts.indexOf(targetIndex), starts.length);
        const targetEl = findEl(targetIndex);
        if (targetEl && targetEl.scrollIntoView) {
            targetEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
            targetEl.classList.add('jump-highlight');
            setTimeout(() => targetEl.classList.remove('jump-highlight'), 900);
        }
    }

    function showEncodingWarningIfNeeded() {
        if (!encodingWarningEl) return;
        const originalStyle = uploadedLineEndingStyle.original;
        const modifiedStyle = uploadedLineEndingStyle.modified;
        const lineEndingMismatch = !!originalStyle && !!modifiedStyle && originalStyle !== modifiedStyle;
        const bomMismatch = uploadedBom.original !== null && uploadedBom.modified !== null &&
            uploadedBom.original !== uploadedBom.modified;

        if (!lineEndingMismatch && !bomMismatch) {
            encodingWarningEl.hidden = true;
            return;
        }
        const parts = [];
        if (lineEndingMismatch) {
            parts.push(`different line endings (${originalStyle.toUpperCase()} vs ${modifiedStyle.toUpperCase()})`);
        }
        if (bomMismatch) {
            parts.push('one file has a BOM, the other does not');
        }
        const message = 'This can cause misleading changes: ' + parts.join(' and ');
        encodingWarningTextEl.textContent = message;
        encodingWarningEl.hidden = false;
    }

    function normalizeInputsAndRecompare() {
        originalCodeEl.value = CodeCompareDiff.normalizeLineEndingsAndBom(originalCodeEl.value);
        modifiedCodeEl.value = CodeCompareDiff.normalizeLineEndingsAndBom(modifiedCodeEl.value);
        uploadedLineEndingStyle.original = null;
        uploadedLineEndingStyle.modified = null;
        uploadedBom.original = null;
        uploadedBom.modified = null;
        updateLineCounts();
        runComparison({ record: false });
    }

    function runComparison(options) {
        const live = !!(options && options.live === true);
        const record = !live && !(options && options.record === false);
        if (originalCodeEl.value === '' && modifiedCodeEl.value === '') return;

        unifiedRenderLimit = RENDER_CHUNK_SIZE;
        splitRenderLimit = RENDER_CHUNK_SIZE;

        diffOutputContainer.style.display = 'block';
        if (!live) comparisonContainer.style.display = 'none';
        document.getElementById('view-compare').classList.toggle('diff-open', !live);

        let originalText = originalCodeEl.value;
        let modifiedText = modifiedCodeEl.value;

        showEncodingWarningIfNeeded();

        const originalIgnored = CodeCompareDiff.applyIgnoreRules(originalText, state.ignorePatterns, state.ignoreRulesMode);
        const modifiedIgnored = CodeCompareDiff.applyIgnoreRules(modifiedText, state.ignorePatterns, state.ignoreRulesMode);
        originalText = originalIgnored.text;
        modifiedText = modifiedIgnored.text;
        showIgnoreRulesErrors([...originalIgnored.errors, ...modifiedIgnored.errors]);

        lastJumpPosition = -1;
        lastDiffEntries = CodeCompareDiff.computeLineDiff(originalText, modifiedText, {
            ignoreCase: !!state.plugins['ignore-case'],
            ignoreWhitespace: !!state.plugins['normalize-whitespace']
        });
        if (state.plugins['ignore-blank-lines']) {
            lastDiffEntries = CodeCompareDiff.applyIgnoreBlankLines(lastDiffEntries);
        }
        if (state.detectMoved) {
            lastDiffEntries = CodeCompareDiff.detectMovedBlocks(lastDiffEntries);
        }
        expandedUnifiedFolds = new Set();
        expandedSplitFolds = new Set();
        const historyStats = CodeCompareDiff.computeStats(lastDiffEntries);
        if (record && window.CodeCompareDashboard) {
            window.CodeCompareDashboard.recordRun({
                language: state.language,
                added: historyStats.added,
                removed: historyStats.removed,
                similarity: historyStats.similarity,
                originalSnippet: originalCodeEl.value.slice(0, 4000),
                modifiedSnippet: modifiedCodeEl.value.slice(0, 4000)
            });
        }
        ensureLanguageLoaded(state.language, renderDiffOutput);
    }

    const IGNORE_PRESETS_KEY = 'codecompare-ignore-presets';

    function loadIgnorePresets() {
        try {
            const raw = JSON.parse(localStorage.getItem(IGNORE_PRESETS_KEY));
            return Array.isArray(raw) ? raw : [];
        } catch {
            return [];
        }
    }

    function saveIgnorePresets(list) {
        try {
            localStorage.setItem(IGNORE_PRESETS_KEY, JSON.stringify(list));
        } catch {
        }
    }

    function renderIgnorePresetOptions(selectedName) {
        if (!ignorePresetSelect) return;
        const presets = loadIgnorePresets();
        const placeholder = ignorePresetSelect.options[0];
        ignorePresetSelect.innerHTML = '';
        ignorePresetSelect.appendChild(placeholder);
        presets.forEach(preset => {
            const opt = document.createElement('option');
            opt.value = preset.name;
            opt.textContent = preset.name;
            ignorePresetSelect.appendChild(opt);
        });
        ignorePresetSelect.value = selectedName && presets.some(p => p.name === selectedName) ? selectedName : '';
    }

    function saveCurrentAsPreset() {
        const name = window.prompt('Name this preset:');
        if (!name || !name.trim()) return;
        const trimmedName = name.trim();
        const presets = loadIgnorePresets().filter(p => p.name !== trimmedName);
        presets.push({ name: trimmedName, patterns: ignorePatternsInput.value, mode: ignoreRulesMode.value });
        saveIgnorePresets(presets);
        renderIgnorePresetOptions(trimmedName);
    }

    function deleteSelectedPreset() {
        if (!ignorePresetSelect || !ignorePresetSelect.value) return;
        const presets = loadIgnorePresets().filter(p => p.name !== ignorePresetSelect.value);
        saveIgnorePresets(presets);
        renderIgnorePresetOptions();
    }

    function applySelectedPreset() {
        const presets = loadIgnorePresets();
        const preset = presets.find(p => p.name === ignorePresetSelect.value);
        if (!preset) return;
        ignorePatternsInput.value = preset.patterns;
        ignoreRulesMode.value = preset.mode;
        state.ignorePatterns = preset.patterns.split('\n');
        state.ignoreRulesMode = preset.mode;
        saveSettings();
    }

    function showIgnoreRulesErrors(errors) {
        if (errors.length === 0) {
            ignoreRulesStatusEl.textContent = '';
            return;
        }
        const seen = new Set();
        const unique = errors.filter(e => {
            if (seen.has(e.pattern)) return false;
            seen.add(e.pattern);
            return true;
        });
        ignoreRulesStatusEl.textContent = unique.map(e => `/${e.pattern}/: ${e.error}`).join(' \u2014 ');
    }

    function renderDiffOutput() {
        if (!lastDiffEntries) return;

        diffOutputEl.textContent = CodeCompareDiff.formatDiffText(lastDiffEntries);

        const { added, removed } = CodeCompareDiff.computeStats(lastDiffEntries);
        diffStatsEl.textContent = t('statsSummary', { added, removed });

        if (state.diffView === 'split') {
            diffOutputLinesEl.style.display = 'none';
            diffSplitView.style.display = 'grid';
            renderSplitView(lastDiffEntries);
        } else {
            diffSplitView.style.display = 'none';
            diffOutputLinesEl.style.display = '';
            renderUnifiedLines(lastDiffEntries);
        }
        applyDiffSearch();
        renderMinimap();
        updateChangeNav(-1, getChangeGroupStarts().length);
    }

    function renderMinimap() {
        if (!diffMinimapEl || !lastDiffEntries) return;
        if (state.diffView === 'split') {
            diffMinimapEl.style.display = 'none';
            return;
        }
        diffMinimapEl.style.display = '';
        sizeMinimap();
        const total = lastDiffEntries.length;
        if (total === 0) {
            diffMinimapEl.innerHTML = '';
            return;
        }
        const marks = [];
        lastDiffEntries.forEach((entry, index) => {
            if (entry.type === 'unchanged') return;
            const topPct = (index / total) * 100;
            const cls = entry.moved ? 'moved' : entry.type;
            marks.push(`<div class="minimap-mark ${cls}" style="top:${topPct}%" data-index="${index}"></div>`);
        });
        diffMinimapEl.innerHTML = marks.join('');
    }

    function scrollToEntryIndex(index) {
        if (state.diffView === 'split' || !lastDiffEntries) return;
        if (index >= unifiedRenderLimit) {
            unifiedRenderLimit = index + RENDER_CHUNK_SIZE;
            renderDiffOutput();
        }
        const el = diffOutputLinesEl.querySelector(`[data-entry-index="${index}"]`);
        if (el && el.scrollIntoView) {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
            el.classList.add('jump-highlight');
            setTimeout(() => el.classList.remove('jump-highlight'), 900);
        }
    }

    function sizeMinimap() {
        if (!diffMinimapEl || diffMinimapEl.style.display === 'none') return;
        const wrapper = diffMinimapEl.parentElement;
        if (!wrapper) return;
        const offset = wrapper.getBoundingClientRect().top - diffOutputContainer.getBoundingClientRect().top + diffOutputContainer.scrollTop;
        const height = diffOutputContainer.clientHeight - offset - 8;
        diffMinimapEl.style.height = Math.max(140, Math.floor(height)) + 'px';
    }

    function handleMinimapClick(clientY) {
        if (!diffMinimapEl || !lastDiffEntries || lastDiffEntries.length === 0) return;
        const rect = diffMinimapEl.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
        const index = Math.min(lastDiffEntries.length - 1, Math.floor(ratio * lastDiffEntries.length));
        scrollToEntryIndex(index);
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function highlightLine(line) {
        const grammar = Prism.languages[state.language] || Prism.languages.markup;
        try {
            return Prism.highlight(line, grammar, state.language);
        } catch (err) {
            console.warn('Prism.highlight failed for a line, falling back to escaped plain text:', err);
            return escapeHtml(line);
        }
    }

    function renderWordDiffHtml(entries, side) {
        return entries
            .filter(entry => side === 'left' ? entry.type !== 'added' : entry.type !== 'removed')
            .map(entry => {
                const escaped = escapeHtml(entry.value);
                if (entry.type === 'unchanged') return escaped;
                const cls = entry.type === 'added' ? 'word-diff-added' : 'word-diff-removed';
                return `<mark class="${cls}">${escaped}</mark>`;
            }).join('');
    }

    function foldDividerHtml(className, foldId, count) {
        const label = escapeHtml(t('foldShowLines', { count }));
        return `<div class="${className}" role="button" tabindex="0" data-fold-id="${foldId}"><span class="fold-icon" aria-hidden="true">${icon('ellipsis')}</span><span>${label}</span></div>`;
    }

    function loadMoreNoticeHtml(view, remaining) {
        const label = t('loadMoreRows', { count: Math.min(remaining, RENDER_CHUNK_SIZE), remaining });
        return `<div class="load-more-notice"><button type="button" class="compare-button secondary-button" data-load-more="${view}">${escapeHtml(label)}</button></div>`;
    }

    function renderUnifiedLines(diffEntries) {
        const html = [];
        const partners = state.plugins['word-diff'] ? CodeCompareDiff.pairReplacements(diffEntries) : null;
        const wordDiffCache = new Map();

        function unifiedCodeHtml(entry, entryIndex) {
            const partnerIndex = partners && !entry.moved ? partners.get(entryIndex) : undefined;
            if (partnerIndex === undefined || diffEntries[partnerIndex].moved) return highlightLine(entry.line);
            const removedIndex = entry.type === 'removed' ? entryIndex : partnerIndex;
            const addedIndex = entry.type === 'removed' ? partnerIndex : entryIndex;
            let wordDiff = wordDiffCache.get(removedIndex);
            if (!wordDiff) {
                wordDiff = CodeCompareDiff.computeWordDiff(diffEntries[removedIndex].line, diffEntries[addedIndex].line);
                wordDiffCache.set(removedIndex, wordDiff);
            }
            return renderWordDiffHtml(wordDiff, entry.type === 'removed' ? 'left' : 'right');
        }

        let lineNo = 0;
        let attempted = 0;
        let truncated = false;

        function renderRow(entry) {
            lineNo++;
            attempted++;
            if (attempted > unifiedRenderLimit) {
                truncated = true;
                return;
            }
            const entryIndex = lineNo - 1;
            const prefix = entry.type === 'added' ? '+' : entry.type === 'removed' ? '-' : '\u00a0';
            const movedClass = entry.moved ? ' moved' : '';
            const movedBadge = entry.moved ? `<span class="moved-badge" title="Moved code">${icon('compare')}</span>` : '';
            html.push(
                `<div class="unified-line type-${entry.type}${movedClass}" data-entry-index="${entryIndex}">` +
                `<span class="unified-line-num">${lineNo}</span>` +
                `<span class="unified-line-prefix">${prefix}</span>` +
                `${movedBadge}` +
                `<code class="unified-line-code">${unifiedCodeHtml(entry, entryIndex)}</code>` +
                `<button type="button" class="copy-line-btn" tabindex="-1" aria-label="Copy line">${icon('copy')}</button>` +
                `</div>`
            );
        }

        if (!state.collapseUnchanged) {
            diffEntries.forEach(renderRow);
            if (truncated) html.push(loadMoreNoticeHtml('unified', attempted - unifiedRenderLimit));
            diffOutputLinesEl.innerHTML = html.join('');
            return;
        }

        const folded = CodeCompareDiff.foldRuns(diffEntries, entry => entry.type === 'unchanged', {
            context: FOLD_CONTEXT,
            minRun: FOLD_MIN_RUN
        });
        let foldIndex = -1;

        folded.forEach(segment => {
            if (segment.kind === 'item') {
                renderRow(segment.item);
                return;
            }
            foldIndex++;
            if (expandedUnifiedFolds.has(foldIndex)) {
                segment.items.forEach(renderRow);
                return;
            }
            lineNo += segment.items.length;
            html.push(foldDividerHtml('fold-divider', foldIndex, segment.items.length));
        });

        if (truncated) html.push(loadMoreNoticeHtml('unified', attempted - unifiedRenderLimit));
        diffOutputLinesEl.innerHTML = html.join('');
    }

    function renderSplitView(diffEntries) {
        const rows = CodeCompareDiff.buildSideBySideRows(diffEntries);
        let leftLineNo = 0;
        let rightLineNo = 0;
        const leftHtml = [];
        const rightHtml = [];
        let rowIndex = -1;
        let attempted = 0;
        let truncated = false;

        function renderRow(row) {
            attempted++;
            if (attempted > splitRenderLimit) {
                truncated = true;
                return;
            }
            rowIndex++;
            const currentRowIndex = rowIndex;
            if (row.left.type !== 'empty') leftLineNo++;
            if (row.right.type !== 'empty') rightLineNo++;

            const isReplacement = state.plugins['word-diff'] && row.left.type === 'removed' && row.right.type === 'added';
            let leftCode;
            let rightCode;
            if (isReplacement) {
                const wordDiff = CodeCompareDiff.computeWordDiff(row.left.line, row.right.line);
                leftCode = renderWordDiffHtml(wordDiff, 'left');
                rightCode = renderWordDiffHtml(wordDiff, 'right');
            } else {
                leftCode = row.left.type !== 'empty' ? highlightLine(row.left.line) : '';
                rightCode = row.right.type !== 'empty' ? highlightLine(row.right.line) : '';
            }

            leftHtml.push(
                `<div class="split-line type-${row.left.type}${row.left.moved ? ' moved' : ''}" data-row-index="${currentRowIndex}">` +
                `<span class="split-line-num">${row.left.type !== 'empty' ? leftLineNo : ''}</span>` +
                `${row.left.moved ? `<span class="moved-badge" title="Moved code">${icon('compare')}</span>` : ''}` +
                `<code class="split-line-code">${leftCode}</code>` +
                `${row.left.type !== 'empty' ? `<button type="button" class="copy-line-btn" tabindex="-1" aria-label="Copy line">${icon('copy')}</button>` : ''}` +
                `</div>`
            );
            rightHtml.push(
                `<div class="split-line type-${row.right.type}${row.right.moved ? ' moved' : ''}" data-row-index="${currentRowIndex}">` +
                `<span class="split-line-num">${row.right.type !== 'empty' ? rightLineNo : ''}</span>` +
                `${row.right.moved ? `<span class="moved-badge" title="Moved code">${icon('compare')}</span>` : ''}` +
                `<code class="split-line-code">${rightCode}</code>` +
                `${row.right.type !== 'empty' ? `<button type="button" class="copy-line-btn" tabindex="-1" aria-label="Copy line">${icon('copy')}</button>` : ''}` +
                `</div>`
            );
        }

        if (!state.collapseUnchanged) {
            rows.forEach(renderRow);
            if (truncated) {
                const notice = loadMoreNoticeHtml('split', attempted - splitRenderLimit);
                leftHtml.push(notice);
                rightHtml.push(notice);
            }
            splitLeftEl.innerHTML = leftHtml.join('');
            splitRightEl.innerHTML = rightHtml.join('');
            return;
        }

        const isUnchangedRow = row => row.left.type === 'unchanged' && row.right.type === 'unchanged';
        const folded = CodeCompareDiff.foldRuns(rows, isUnchangedRow, { context: FOLD_CONTEXT, minRun: FOLD_MIN_RUN });
        let foldIndex = -1;

        folded.forEach(segment => {
            if (segment.kind === 'item') {
                renderRow(segment.item);
                return;
            }
            foldIndex++;
            if (expandedSplitFolds.has(foldIndex)) {
                segment.items.forEach(renderRow);
                return;
            }
            leftLineNo += segment.items.length;
            rightLineNo += segment.items.length;
            const divider = foldDividerHtml('split-fold-divider', foldIndex, segment.items.length);
            leftHtml.push(divider);
            rightHtml.push(divider);
        });

        if (truncated) {
            const notice = loadMoreNoticeHtml('split', attempted - splitRenderLimit);
            leftHtml.push(notice);
            rightHtml.push(notice);
        }
        splitLeftEl.innerHTML = leftHtml.join('');
        splitRightEl.innerHTML = rightHtml.join('');
    }

    function syncViewToggleButtons() {
        viewUnifiedBtn.classList.toggle('active', state.diffView === 'unified');
        viewSplitBtn.classList.toggle('active', state.diffView === 'split');
        viewUnifiedBtn.setAttribute('aria-pressed', String(state.diffView === 'unified'));
        viewSplitBtn.setAttribute('aria-pressed', String(state.diffView === 'split'));
    }

    function setDiffView(view) {
        state.diffView = view;
        syncViewToggleButtons();
        saveSettings();
        renderDiffOutput();
    }

    function setupSplitScrollSync() {
        function syncScroll(source, target) {
            source.addEventListener('scroll', () => {
                if (isSyncingScroll) return;
                isSyncingScroll = true;
                target.scrollTop = source.scrollTop;
                requestAnimationFrame(() => { isSyncingScroll = false; });
            });
        }
        syncScroll(splitLeftEl, splitRightEl);
        syncScroll(splitRightEl, splitLeftEl);
    }

    function getUnifiedStyleDiff() {
        const header = '--- Original\n+++ Modified\n';
        return header + diffOutputEl.textContent;
    }

    function copyDiffToClipboard() {
        const text = getUnifiedStyleDiff();

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                const original = copyDiffBtn.textContent;
                copyDiffBtn.textContent = t('copyDiffDone');
                setTimeout(() => { copyDiffBtn.textContent = original; }, 1500);
            }).catch(err => {
                console.error('Copy failed:', err);
                window.prompt(t('copyDiffManualCopy'), text);
            });
        } else {
            window.prompt(t('copyDiffManualCopy'), text);
        }
    }

    function exportHtmlReport() {
        if (!lastDiffEntries) return;
        const stats = CodeCompareDiff.computeStats(lastDiffEntries);
        const rowsHtml = lastDiffEntries.map(entry => {
            const prefix = entry.type === 'added' ? '+' : entry.type === 'removed' ? '-' : ' ';
            return `<div class="row row-${entry.type}"><span class="prefix">${prefix}</span><code>${escapeHtml(entry.line)}</code></div>`;
        }).join('');
        const timestamp = new Date().toLocaleString();
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CodeCompare Report</title>
<style>
    body { background:#1f2128; color:#d8d8e4; font-family:'Fira Code',Consolas,monospace; margin:0; padding:24px; }
    h1 { font-size:16px; font-weight:600; margin:0 0 4px; color:#fff; }
    .meta { color:#9393a7; font-size:12px; margin-bottom:18px; }
    .stats { display:flex; gap:16px; margin-bottom:16px; font-size:13px; }
    .stats span { background:#252631; border:1px solid #383943; border-radius:4px; padding:4px 10px; }
    .diff { border:1px solid #383943; border-radius:6px; overflow:hidden; }
    .row { display:flex; gap:10px; padding:2px 12px; white-space:pre-wrap; word-break:break-word; font-size:13px; line-height:1.6; }
    .row-added { background:rgba(0,181,173,0.16); }
    .row-removed { background:rgba(255,78,64,0.16); }
    .prefix { width:14px; flex-shrink:0; opacity:0.7; }
    .row-added .prefix { color:#00b5ad; }
    .row-removed .prefix { color:#ff6a5e; }
</style>
</head>
<body>
    <h1>CodeCompare \u2014 Comparison Report</h1>
    <div class="meta">${escapeHtml(timestamp)} \u2014 language: ${escapeHtml(state.language)}</div>
    <div class="stats">
        <span>+${stats.added}</span>
        <span>-${stats.removed}</span>
        <span>${stats.similarity}% similar</span>
    </div>
    <div class="diff">${rowsHtml}</div>
</body>
</html>`;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'codecompare-report.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadDiffFile() {
        const text = getUnifiedStyleDiff();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'comparison.diff';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function downloadPatchFile() {
        if (!lastDiffEntries) return;
        const patch = CodeCompareDiff.buildUnifiedPatch(lastDiffEntries, {
            originalLabel: 'a/original',
            modifiedLabel: 'b/modified'
        });
        const blob = new Blob([patch], { type: 'text/x-patch' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'comparison.patch';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    const SHARE_LINK_WARN_LENGTH = 6000;

    async function generateAndCopyShareLink() {
        const payload = {
            o: originalCodeEl.value,
            m: modifiedCodeEl.value,
            lang: state.language,
            view: state.diffView
        };

        let url;
        try {
            const encoded = await CodeCompareShare.encodeSharePayload(payload);
            url = `${location.origin}${location.pathname}#share=${encoded}`;
        } catch (err) {
            console.error('Could not build a share link:', err);
            return;
        }

        const originalLabel = shareLinkBtn.textContent;
        const restoreLabel = () => setTimeout(() => { shareLinkBtn.textContent = originalLabel; }, 1800);

        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(url);
                shareLinkBtn.textContent = t('shareLinkCopied');
                restoreLabel();
            } catch {
                window.prompt(t('shareLinkManualCopy'), url);
            }
        } else {
            window.prompt(t('shareLinkManualCopy'), url);
        }

        if (url.length > SHARE_LINK_WARN_LENGTH) {
            console.warn(t('shareLinkTooLong'));
        }
    }

    async function loadSharedComparisonFromUrl() {
        const hash = location.hash;
        if (!hash.startsWith('#share=')) return;

        try {
            const encoded = hash.slice('#share='.length);
            const payload = await CodeCompareShare.decodeSharePayload(encoded);

            if (typeof payload.o === 'string') originalCodeEl.value = payload.o;
            if (typeof payload.m === 'string') modifiedCodeEl.value = payload.m;
            if (typeof payload.lang === 'string' && SUPPORTED_LANGUAGES[payload.lang]) {
                state.language = payload.lang;
            }
            if (payload.view === 'unified' || payload.view === 'split') {
                state.diffView = payload.view;
            }

            populateLanguages();
            syncViewToggleButtons();
            updateLineCounts();
            ensureLanguageLoaded(state.language, () => runComparison());
        } catch (err) {
            console.error('Failed to load shared comparison:', err);
            alert(t('shareLoadFailed'));
        }
    }

    function toggleTheme() {
        state.isDarkTheme = !state.isDarkTheme;
        applyTheme();
        saveSettings();
    }

    const PRISM_THEMES = {
        auto: null,
        prism: 'prism',
        okaidia: 'prism-okaidia',
        dark: 'prism-dark',
        tomorrow: 'prism-tomorrow',
        twilight: 'prism-twilight',
        solarizedlight: 'prism-solarizedlight',
        coy: 'prism-coy',
        funky: 'prism-funky'
    };

    function applyTheme() {
        const chosen = PRISM_THEMES[state.syntaxTheme];
        const themeName = chosen || (state.isDarkTheme ? 'prism-okaidia' : 'prism');
        prismThemeLink.href = `lib/prism/themes/${themeName}.min.css`;
        document.body.classList.toggle('light-theme', !state.isDarkTheme);
    }

    function updatePluginCheckboxes() {
        pluginToggles.forEach(toggle => {
            const plugin = toggle.dataset.plugin;
            if (state.plugins[plugin] !== undefined) {
                toggle.checked = state.plugins[plugin];
            }
        });
    }

    const SUPPORTED_LANGUAGES = {
        markup: 'HTML/XML', css: 'CSS', javascript: 'JavaScript', typescript: 'TypeScript',
        jsx: 'JSX', tsx: 'TSX', json: 'JSON', json5: 'JSON5', yaml: 'YAML', toml: 'TOML',
        python: 'Python', java: 'Java', csharp: 'C#', cpp: 'C++', c: 'C', go: 'Go',
        rust: 'Rust', php: 'PHP', ruby: 'Ruby', swift: 'Swift', kotlin: 'Kotlin',
        scala: 'Scala', dart: 'Dart', perl: 'Perl', lua: 'Lua', r: 'R', matlab: 'MATLAB',
        sql: 'SQL', graphql: 'GraphQL', bash: 'Bash/Shell', powershell: 'PowerShell',
        docker: 'Dockerfile', nginx: 'Nginx', ini: 'INI', diff: 'Diff', markdown: 'Markdown',
        scss: 'SCSS', sass: 'Sass', less: 'Less', stylus: 'Stylus', haskell: 'Haskell',
        elixir: 'Elixir', erlang: 'Erlang', clojure: 'Clojure', groovy: 'Groovy',
        objectivec: 'Objective-C', vbnet: 'VB.NET', 'visual-basic': 'Visual Basic',
        fsharp: 'F#', pascal: 'Pascal', fortran: 'Fortran', cobol: 'COBOL', ada: 'Ada',
        d: 'D', nim: 'Nim', crystal: 'Crystal', julia: 'Julia', solidity: 'Solidity',
        protobuf: 'Protocol Buffers', regex: 'RegExp', latex: 'LaTeX', wasm: 'WebAssembly',
        makefile: 'Makefile', cmake: 'CMake', properties: 'Properties', git: 'Git',
        log: 'Log file', http: 'HTTP', apacheconf: 'Apache Config', plsql: 'PL/SQL'
    };

    function selectLanguage(lang) {
        state.language = lang;
        langSearchInput.value = SUPPORTED_LANGUAGES[lang] || lang;
        langOptionsContainer.classList.remove('visible');
        saveSettings();
        if (diffOutputContainer.style.display !== 'none') {
            ensureLanguageLoaded(state.language, renderDiffOutput);
        }
    }

    function guessLanguage(text) {
        const sample = text.slice(0, 4000).trim();
        if (!sample) return null;
        const rules = [
            [s => /^<\?php/.test(s), 'php'],
            [s => /^#!.*\b(bash|sh|zsh)\b/m.test(s), 'bash'],
            [s => /^\s*<!DOCTYPE html>|<html[\s>]|<\/(div|span|body|html)>/i.test(s), 'markup'],
            [s => /^[\s\S]*\{[\s\S]*\}\s*$/.test(s) && /"[^"]+"\s*:/.test(s), 'json'],
            [s => /^\s*(import|from)\s+[\w.]+\s+import\b|^\s*def\s+\w+\s*\(.*\):|^\s*print\(/m.test(s), 'python'],
            [s => /^\s*(public|private|protected)\s+(static\s+)?(class|void|int|String)\b/m.test(s), 'java'],
            [s => /^\s*fn\s+\w+\s*\(.*\)\s*(->\s*\w+)?\s*\{|^\s*let\s+mut\b/m.test(s), 'rust'],
            [s => /^\s*func\s+\w+\s*\(.*\)\s*\{|^\s*package\s+main\b/m.test(s), 'go'],
            [s => /^\s*#include\s*<\w+(\.h)?>/m.test(s), 'cpp'],
            [s => /^\s*using\s+System;|^\s*namespace\s+\w+/m.test(s), 'csharp'],
            [s => /^\s*SELECT\s+.+\s+FROM\s+/im.test(s), 'sql'],
            [s => /:\s*(string|number|boolean)\b|^\s*interface\s+\w+/m.test(s), 'typescript'],
            [s => /^\s*(const|let|var)\s+\w+\s*=|=>|function\s*\(/m.test(s), 'javascript'],
            [s => /^\s*[.#]?[\w-]+\s*\{[\s\S]*:[\s\S]*\}/m.test(s), 'css'],
            [s => /^---\n[\s\S]*?\n---/m.test(s), 'yaml'],
            [s => /^\s*\$\w+\s*=|^\s*def\s+\w+.*\n[\s\S]*\bend\b/m.test(s), 'ruby']
        ];
        for (const [test, lang] of rules) {
            if (test(sample)) return lang;
        }
        return null;
    }

    function populateLanguages() {
        const languages = Object.keys(SUPPORTED_LANGUAGES).sort((a, b) => SUPPORTED_LANGUAGES[a].localeCompare(SUPPORTED_LANGUAGES[b]));
        langOptionsContainer.innerHTML = languages.map(lang => `<div data-lang="${lang}">${SUPPORTED_LANGUAGES[lang]}</div>`).join('');
        langOptionsContainer.querySelectorAll('div').forEach(el => {
            el.addEventListener('click', () => selectLanguage(el.dataset.lang));
        });
        langSearchInput.value = SUPPORTED_LANGUAGES[state.language] || state.language;
    }

    function ensureLanguageLoaded(lang, callback) {
        if (Prism.languages[lang]) {
            callback();
            return;
        }
        if (Prism.plugins && Prism.plugins.autoloader) {
            Prism.plugins.autoloader.loadLanguages(lang, callback, callback);
        } else {
            callback();
        }
    }

    function filterLanguages() {
        const query = langSearchInput.value.toLowerCase();
        langOptionsContainer.querySelectorAll('div').forEach(option => {
            option.style.display = option.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
    }

    function updateLineCounts() {
        originalLinesEl.textContent = `${t('linesLabel')}: ${originalCodeEl.value.split('\n').length}`;
        modifiedLinesEl.textContent = `${t('linesLabel')}: ${modifiedCodeEl.value.split('\n').length}`;
    }

    const DRAFT_KEY = 'codecompare-draft-v1';
    const MAX_DRAFT_CHARS = 1500000;
    let draftTimer = null;

    function saveDraft() {
        if (!state.plugins['autosave-draft']) return;
        try {
            const original = originalCodeEl.value;
            const modified = modifiedCodeEl.value;
            if (original.length + modified.length > MAX_DRAFT_CHARS) return;
            localStorage.setItem(DRAFT_KEY, JSON.stringify({ original, modified }));
        } catch (err) {
            console.warn('Could not save draft:', err);
        }
    }

    function scheduleDraftSave() {
        if (!state.plugins['autosave-draft']) return;
        clearTimeout(draftTimer);
        draftTimer = setTimeout(saveDraft, 500);
    }

    function restoreDraft() {
        if (!state.plugins['autosave-draft']) return false;
        if (location.hash.startsWith('#share=')) return false;
        try {
            const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
            if (draft && typeof draft.original === 'string' && typeof draft.modified === 'string') {
                originalCodeEl.value = draft.original;
                modifiedCodeEl.value = draft.modified;
                return true;
            }
        } catch (err) {
            console.warn('Could not restore draft:', err);
        }
        return false;
    }

    function loadInitialCode() {
        if (restoreDraft()) return;
        originalCodeEl.value = `body {\n  font-family: 'Arial';\n  color: #333;\n}`;
        modifiedCodeEl.value = `body {\n  font-family: 'Helvetica', sans-serif;\n  color: #444;\n  background-color: #f0f0f0;\n}`;
    }

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js').catch(err => {
                console.warn('Service worker registration failed:', err);
            });
        }
    }

    init();
});
