document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const originalCodeEl = document.getElementById('original-code');
    const modifiedCodeEl = document.getElementById('modified-code');
    const compareBtn = document.getElementById('compare-btn');
    const formatJsonBtn = document.getElementById('format-json-btn');
    const formatJsonStatusEl = document.getElementById('format-json-status');
    const diffOutputContainer = document.getElementById('diff-output-container');
    const diffOutputEl = document.getElementById('diff-output');
    const originalLinesEl = document.getElementById('original-lines');
    const modifiedLinesEl = document.getElementById('modified-lines');
    const themeSwitcher = document.getElementById('theme-switcher');
    const prismThemeLink = document.getElementById('prism-theme-link');
    const langSearchInput = document.getElementById('language-search');
    const langOptionsContainer = document.getElementById('language-options');
    const pluginToggles = document.querySelectorAll('.plugins-group input, .process-section input');
    const newComparisonBtn = document.getElementById('new-comparison-btn');
    const comparisonContainer = document.getElementById('comparison-container');
    const langToggleBtn = document.getElementById('lang-toggle-btn');
    const uploadOriginalBtn = document.getElementById('upload-original-btn');
    const uploadModifiedBtn = document.getElementById('upload-modified-btn');
    const uploadOriginalInput = document.getElementById('upload-original-input');
    const uploadModifiedInput = document.getElementById('upload-modified-input');
    const diffStatsEl = document.getElementById('diff-stats');
    const copyDiffBtn = document.getElementById('copy-diff-btn');
    const downloadDiffBtn = document.getElementById('download-diff-btn');
    const shareLinkBtn = document.getElementById('share-link-btn');
    const viewUnifiedBtn = document.getElementById('view-unified-btn');
    const viewSplitBtn = document.getElementById('view-split-btn');
    const diffSplitView = document.getElementById('diff-split-view');
    const splitLeftEl = document.getElementById('split-left');
    const splitRightEl = document.getElementById('split-right');
    const collapseUnchangedToggle = document.getElementById('collapse-unchanged-toggle');
    const wrapLinesToggle = document.getElementById('wrap-lines-toggle');
    const diffOutputLinesEl = document.getElementById('diff-output-lines');
    const ignorePatternsInput = document.getElementById('ignore-patterns-input');
    const ignoreRulesMode = document.getElementById('ignore-rules-mode');
    const ignoreRulesStatusEl = document.getElementById('ignore-rules-status');
    const STORAGE_KEY = 'codecompare-settings';
    const MAX_UPLOAD_SIZE = 2 * 1024 * 1024; // 2MB guard against pasting huge binaries by accident
    let lastDiffEntries = null;
    let isSyncingScroll = false;
    const FOLD_CONTEXT = 3;
    const FOLD_MIN_RUN = 8;
    let expandedUnifiedFolds = new Set();
    let expandedSplitFolds = new Set();
    let formatJsonStatusTimer = null;

    // === i18n ===
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
            ignoreCase: 'Ignore Case',
            customIgnoreRules: 'Custom Ignore Rules (regex, one per line):',
            ignorePatternsPlaceholder: 'e.g. \\d{4}-\\d{2}-\\d{2}',
            ignoreRemoveLines: 'Remove matching lines',
            ignoreStripMatches: 'Strip matches within lines',
            originalCode: 'Original Code',
            modifiedCode: 'Modified Code',
            uploadFile: 'Upload File',
            compareButton: 'Compare',
            shortcutHint: 'Tip: press Ctrl+Enter (⌘+Enter on Mac) to compare',
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
            copyDiff: 'Copy Diff',
            copyDiffDone: 'Copied!',
            downloadDiff: 'Download .diff',
            shareLink: 'Share Link',
            shareLinkCopied: 'Link copied!',
            shareLinkManualCopy: 'Copy this link to share your comparison:',
            copyDiffManualCopy: 'Copy this diff:',
            shareLinkTooLong: 'Note: this link is quite long and may not work everywhere (e.g. some chat apps truncate long links).',
            shareLoadFailed: 'Could not load the shared comparison from this link (it may be corrupted or use an unsupported format).',
            legendAdded: '+ added',
            legendRemoved: '\u2212 removed',
            legendUnchanged: 'unchanged',
            linesLabel: 'Lines',
            statsSummary: '{added} added \u00b7 {removed} removed',
            uploadTooLarge: 'File is too large to load (max 2MB).',
            uploadFailed: 'Could not read that file.'
        },
        fa: {
            pageTitle: 'مقایسه‌گر کد',
            viewOnGithub: 'مشاهده در گیت‌هاب',
            languageLabel: ':زبان',
            languageSearchPlaceholder: 'جستجوی زبان...',
            advancedSettings: 'تنظیمات پیشرفته',
            pluginsLabel: ':افزونه‌ها',
            pluginShowInvisibles: 'نمایش کاراکترهای نامرئی',
            pluginAutolinker: 'لینک خودکار',
            pluginMatchBraces: 'تطبیق پرانتزها',
            pluginInlineColor: 'نمایش رنگ درون‌خطی',
            pluginPreviewers: 'پیش‌نمایش CSS',
            pluginCommandLine: 'خط فرمان',
            processingLabel: ':پردازش',
            ignoreWhitespace: 'نادیده گرفتن فاصله‌ها',
            ignoreCase: 'نادیده گرفتن بزرگی/کوچکی حروف',
            customIgnoreRules: ':(regex قوانین نادیده‌گیری سفارشی (هر خط یک الگوی',
            ignorePatternsPlaceholder: '\\d{4}-\\d{2}-\\d{2} :مثال',
            ignoreRemoveLines: 'حذف خطوط منطبق',
            ignoreStripMatches: 'حذف بخش‌های منطبق داخل خط',
            originalCode: 'کد اصلی',
            modifiedCode: 'کد تغییریافته',
            uploadFile: 'بارگذاری فایل',
            compareButton: 'مقایسه',
            shortcutHint: 'Ctrl+Enter (⌘+Enter در مک) را برای مقایسه بزنید :راهنما',
            formatJson: 'فرمت JSON',
            formatJsonSuccess: '.به‌صورت JSON فرمت شد',
            formatJsonEmpty: '.چیزی برای فرمت‌کردن نیست — اول محتوایی وارد کنید',
            formatJsonNoValidJson: '.هیچ‌کدام از دو طرف JSON معتبر به نظر نمی‌رسند',
            newComparison: 'مقایسه جدید',
            unifiedView: 'یکپارچه',
            splitView: 'دوستونه',
            collapseUnchanged: 'جمع‌کردن خطوط بدون تغییر',
            wrapLines: 'شکستن خطوط بلند',
            foldShowLines: 'نمایش {count} خط بدون تغییر پنهان‌شده',
            copyDiff: 'کپی تفاوت‌ها',
            copyDiffDone: '!کپی شد',
            downloadDiff: 'دانلود .diff',
            shareLink: 'اشتراک‌گذاری لینک',
            shareLinkCopied: '!لینک کپی شد',
            shareLinkManualCopy: ':این لینک را برای اشتراک‌گذاری مقایسه کپی کنید',
            copyDiffManualCopy: ':این تفاوت‌ها را کپی کنید',
            shareLinkTooLong: '.توجه: این لینک نسبتاً طولانی است و ممکن است در همه‌جا کار نکند (مثلاً برخی اپ‌های پیام‌رسان لینک‌های طولانی را کوتاه می‌کنند)',
            shareLoadFailed: '.بارگذاری مقایسه از این لینک ممکن نشد (ممکن است خراب باشد یا فرمت پشتیبانی‌نشده داشته باشد)',
            legendAdded: 'افزوده‌شده +',
            legendRemoved: 'حذف‌شده \u2212',
            legendUnchanged: 'بدون تغییر',
            linesLabel: 'خطوط',
            statsSummary: 'حذف‌شده {removed} \u00b7 افزوده‌شده {added}',
            uploadTooLarge: '.(حداکثر ۲ مگابایت) حجم فایل برای بارگذاری زیاد است',
            uploadFailed: '.خواندن این فایل ممکن نشد'
        }
    };

    // === Application State ===
    const state = {
        language: 'javascript',
        uiLang: 'en',
        diffView: 'unified',
        collapseUnchanged: true,
        wrapLines: false,
        ignorePatterns: [],
        ignoreRulesMode: 'removeLines',
        isDarkTheme: window.matchMedia('(prefers-color-scheme: light)').matches ? false : true,
        plugins: {
            // Display Plugins (applied via Prism.highlight()'s hook pipeline, per-line,
            // in both Unified and Split views)
            'show-invisibles': false, 'autolinker': true,
            'match-braces': true, 'inline-color': false, 'previewers': true,
            'command-line': false,
            // Processing Plugins
            'normalize-whitespace': false,
            'ignore-case': false
        }
    };

    // === Initialization ===
    function init() {
        if (Prism.plugins && Prism.plugins.autoloader) {
            Prism.plugins.autoloader.languages_path = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/components/';
        }
        loadSettings();
        setupEventListeners();
        populateLanguages();
        loadInitialCode();
        updateLineCounts();
        updatePluginCheckboxes();
        applyTheme();
        applyUiLanguage();
        syncViewToggleButtons();
        collapseUnchangedToggle.checked = state.collapseUnchanged;
        wrapLinesToggle.checked = state.wrapLines;
        diffOutputContainer.classList.toggle('wrap-lines', state.wrapLines);
        ignorePatternsInput.value = state.ignorePatterns.join('\n');
        ignoreRulesMode.value = state.ignoreRulesMode;
        registerServiceWorker();
        loadSharedComparisonFromUrl();
    }

    // === Persistence ===
    function loadSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved && typeof saved === 'object') {
                if (typeof saved.isDarkTheme === 'boolean') state.isDarkTheme = saved.isDarkTheme;
                if (saved.plugins && typeof saved.plugins === 'object') {
                    Object.assign(state.plugins, saved.plugins);
                }
                if (typeof saved.language === 'string') state.language = saved.language;
                if (typeof saved.uiLang === 'string') state.uiLang = saved.uiLang;
                if (saved.diffView === 'unified' || saved.diffView === 'split') state.diffView = saved.diffView;
                if (typeof saved.collapseUnchanged === 'boolean') state.collapseUnchanged = saved.collapseUnchanged;
                if (typeof saved.wrapLines === 'boolean') state.wrapLines = saved.wrapLines;
                if (Array.isArray(saved.ignorePatterns)) state.ignorePatterns = saved.ignorePatterns;
                if (saved.ignoreRulesMode === 'removeLines' || saved.ignoreRulesMode === 'stripMatches') {
                    state.ignoreRulesMode = saved.ignoreRulesMode;
                }
            }
        } catch (err) {
            // Corrupt or unavailable storage (e.g. private browsing) -> ignore and use defaults
            console.warn('Could not load saved settings:', err);
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                isDarkTheme: state.isDarkTheme,
                plugins: state.plugins,
                language: state.language,
                uiLang: state.uiLang,
                diffView: state.diffView,
                collapseUnchanged: state.collapseUnchanged,
                wrapLines: state.wrapLines,
                ignorePatterns: state.ignorePatterns,
                ignoreRulesMode: state.ignoreRulesMode
            }));
        } catch (err) {
            console.warn('Could not save settings:', err);
        }
    }

    // === i18n helpers ===
    function t(key, vars) {
        const dict = translations[state.uiLang] || translations.en;
        let text = dict[key] !== undefined ? dict[key] : (translations.en[key] || key);
        if (vars) {
            Object.keys(vars).forEach(k => {
                text = text.replace(`{${k}}`, vars[k]);
            });
        }
        return text;
    }

    function applyUiLanguage() {
        document.documentElement.lang = state.uiLang;
        document.documentElement.dir = state.uiLang === 'fa' ? 'rtl' : 'ltr';
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

    function toggleUiLanguage() {
        state.uiLang = state.uiLang === 'en' ? 'fa' : 'en';
        applyUiLanguage();
        saveSettings();
    }

    // === Event Listeners Setup ===
    function setupEventListeners() {
        compareBtn.addEventListener('click', runComparison);
        formatJsonBtn.addEventListener('click', formatBothAsJson);
        originalCodeEl.addEventListener('input', updateLineCounts);
        modifiedCodeEl.addEventListener('input', updateLineCounts);

        const compareShortcut = e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                runComparison();
            }
        };
        originalCodeEl.addEventListener('keydown', compareShortcut);
        modifiedCodeEl.addEventListener('keydown', compareShortcut);

        themeSwitcher.addEventListener('click', toggleTheme);
        themeSwitcher.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleTheme();
            }
        });

        langToggleBtn.addEventListener('click', toggleUiLanguage);

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
                // Only re-run the diff if a comparison is already being shown;
                // otherwise toggling a plugin on the input screen shouldn't jump to the diff view.
                if (diffOutputContainer.style.display !== 'none') {
                    runComparison();
                }
            });
        });

        newComparisonBtn.addEventListener('click', showInputView);

        uploadOriginalBtn.addEventListener('click', () => uploadOriginalInput.click());
        uploadModifiedBtn.addEventListener('click', () => uploadModifiedInput.click());
        uploadOriginalInput.addEventListener('change', () => handleFileUpload(uploadOriginalInput, originalCodeEl));
        uploadModifiedInput.addEventListener('change', () => handleFileUpload(uploadModifiedInput, modifiedCodeEl));

        setupDragAndDrop(originalCodeEl);
        setupDragAndDrop(modifiedCodeEl);

        copyDiffBtn.addEventListener('click', copyDiffToClipboard);
        downloadDiffBtn.addEventListener('click', downloadDiffFile);
        shareLinkBtn.addEventListener('click', generateAndCopyShareLink);

        viewUnifiedBtn.addEventListener('click', () => setDiffView('unified'));
        viewSplitBtn.addEventListener('click', () => setDiffView('split'));
        setupSplitScrollSync();

        collapseUnchangedToggle.addEventListener('change', () => {
            state.collapseUnchanged = collapseUnchangedToggle.checked;
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
                runComparison();
            }
        };
        ignorePatternsInput.addEventListener('change', onIgnoreRulesChange);
        ignoreRulesMode.addEventListener('change', onIgnoreRulesChange);

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
    }

    // === File upload ===
    function handleFileUpload(inputEl, targetTextarea) {
        const file = inputEl.files && inputEl.files[0];
        inputEl.value = ''; // allow re-selecting the same file later
        if (!file) return;
        loadFileIntoTextarea(file, targetTextarea);
    }

    function setupDragAndDrop(textarea) {
        textarea.addEventListener('dragover', e => {
            e.preventDefault();
            textarea.classList.add('drag-over');
        });
        textarea.addEventListener('dragleave', () => textarea.classList.remove('drag-over'));
        textarea.addEventListener('drop', e => {
            e.preventDefault();
            textarea.classList.remove('drag-over');
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) loadFileIntoTextarea(file, textarea);
        });
    }

    function loadFileIntoTextarea(file, textarea) {
        if (file.size > MAX_UPLOAD_SIZE) {
            alert(t('uploadTooLarge'));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            textarea.value = reader.result;
            updateLineCounts();
        };
        reader.onerror = () => alert(t('uploadFailed'));
        reader.readAsText(file);
    }

    // === JSON formatting ===
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
            // Formatting JSON only makes sense paired with JSON syntax highlighting.
            state.language = 'json';
            populateLanguages();
            saveSettings();
        }

        showFormatJsonStatus(results, succeeded, failed);

        if (diffOutputContainer.style.display !== 'none') {
            runComparison();
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

    // === Core Application Logic ===
    function runComparison() {
        if (originalCodeEl.value === '' && modifiedCodeEl.value === '') return;

        diffOutputContainer.style.display = 'block';
        comparisonContainer.style.display = 'none';

        let originalText = originalCodeEl.value;
        let modifiedText = modifiedCodeEl.value;

        // Apply processing plugins before diffing (guard against the plugin script failing to load,
        // e.g. no network/CDN blocked, so one missing script doesn't break the whole comparison)
        if (state.plugins['normalize-whitespace']) {
            const normalizer = Prism.plugins && Prism.plugins.NormalizeWhitespace;
            if (normalizer) {
                originalText = normalizer.normalize(originalText, {});
                modifiedText = normalizer.normalize(modifiedText, {});
            } else {
                console.warn('NormalizeWhitespace plugin is not loaded; showing raw text instead.');
            }
        }

        const originalIgnored = CodeCompareDiff.applyIgnoreRules(originalText, state.ignorePatterns, state.ignoreRulesMode);
        const modifiedIgnored = CodeCompareDiff.applyIgnoreRules(modifiedText, state.ignorePatterns, state.ignoreRulesMode);
        originalText = originalIgnored.text;
        modifiedText = modifiedIgnored.text;
        showIgnoreRulesErrors([...originalIgnored.errors, ...modifiedIgnored.errors]);

        lastDiffEntries = CodeCompareDiff.computeLineDiff(originalText, modifiedText, {
            ignoreCase: !!state.plugins['ignore-case']
        });
        expandedUnifiedFolds = new Set();
        expandedSplitFolds = new Set();
        ensureLanguageLoaded(state.language, renderDiffOutput);
    }

    function showIgnoreRulesErrors(errors) {
        if (errors.length === 0) {
            ignoreRulesStatusEl.textContent = '';
            return;
        }
        // De-duplicate (the same bad pattern is checked against both sides).
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

        // This hidden buffer only exists so Copy Diff / Download .diff have
        // exact plain text to work with - it is never shown to the user.
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
        return `<div class="${className}" role="button" tabindex="0" data-fold-id="${foldId}"><span class="fold-icon" aria-hidden="true">\u22ef</span><span>${label}</span></div>`;
    }

    /**
     * Renders the Unified view as one real DOM element per line (mirroring the
     * Split view's approach), each individually syntax-highlighted via
     * Prism.highlight() and separated by a CSS border - not a computed
     * background pattern, so the divider between lines can never drift out of
     * sync with the text, regardless of line-wrapping or folding state.
     */
    function renderUnifiedLines(diffEntries) {
        const html = [];
        let lineNo = 0;

        function renderRow(entry) {
            lineNo++;
            const prefix = entry.type === 'added' ? '+' : entry.type === 'removed' ? '-' : '\u00a0';
            html.push(
                `<div class="unified-line type-${entry.type}">` +
                `<span class="unified-line-num">${lineNo}</span>` +
                `<span class="unified-line-prefix">${prefix}</span>` +
                `<code class="unified-line-code">${highlightLine(entry.line)}</code>` +
                `</div>`
            );
        }

        if (!state.collapseUnchanged) {
            diffEntries.forEach(renderRow);
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
            // Rows stay hidden, but the line count must still account for them,
            // or the next visible line number would look wrong.
            lineNo += segment.items.length;
            html.push(foldDividerHtml('fold-divider', foldIndex, segment.items.length));
        });

        diffOutputLinesEl.innerHTML = html.join('');
    }

    function renderSplitView(diffEntries) {
        const rows = CodeCompareDiff.buildSideBySideRows(diffEntries);
        let leftLineNo = 0;
        let rightLineNo = 0;
        const leftHtml = [];
        const rightHtml = [];

        function renderRow(row) {
            if (row.left.type !== 'empty') leftLineNo++;
            if (row.right.type !== 'empty') rightLineNo++;

            // A replaced line (removed on the left, added on the right, same row) gets
            // word-level highlighting so only the changed part of the line stands out,
            // instead of coloring the whole line.
            const isReplacement = row.left.type === 'removed' && row.right.type === 'added';
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
                `<div class="split-line type-${row.left.type}">` +
                `<span class="split-line-num">${row.left.type !== 'empty' ? leftLineNo : ''}</span>` +
                `<code class="split-line-code">${leftCode}</code>` +
                `</div>`
            );
            rightHtml.push(
                `<div class="split-line type-${row.right.type}">` +
                `<span class="split-line-num">${row.right.type !== 'empty' ? rightLineNo : ''}</span>` +
                `<code class="split-line-code">${rightCode}</code>` +
                `</div>`
            );
        }

        if (!state.collapseUnchanged) {
            rows.forEach(renderRow);
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
            // Rows stay hidden, but line numbers on either side of the fold must
            // still account for them - otherwise the next visible line number
            // would be wrong (it would look like those lines never existed).
            leftLineNo += segment.items.length;
            rightLineNo += segment.items.length;
            const divider = foldDividerHtml('split-fold-divider', foldIndex, segment.items.length);
            leftHtml.push(divider);
            rightHtml.push(divider);
        });

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

    // A link this long is unlikely to survive being pasted into some chat apps
    // or SMS, which silently truncate very long URLs; warn (non-blockingly) past this.
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
            } catch (err) {
                // Clipboard write can fail (permissions, insecure context, etc.) -
                // fall back to a manual-copy prompt so the link isn't just lost.
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
            ensureLanguageLoaded(state.language, runComparison);
        } catch (err) {
            console.error('Failed to load shared comparison:', err);
            alert(t('shareLoadFailed'));
        }
    }

    // === UI & State Management ===
    function toggleTheme() {
        state.isDarkTheme = !state.isDarkTheme;
        applyTheme();
        saveSettings();
    }

    function applyTheme() {
        const themeName = state.isDarkTheme ? 'prism-okaidia' : 'prism';
        prismThemeLink.href = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/themes/${themeName}.min.css`;
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

    // A curated list of languages actually verified to exist as real Prism 1.30.0
    // components. With the Autoloader plugin, languages beyond the default
    // core bundle (markup/css/clike/javascript) aren't loaded until picked, so
    // Prism.languages can't be introspected to build this list at startup.
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

    function populateLanguages() {
        const languages = Object.keys(SUPPORTED_LANGUAGES).sort((a, b) => SUPPORTED_LANGUAGES[a].localeCompare(SUPPORTED_LANGUAGES[b]));
        langOptionsContainer.innerHTML = languages.map(lang => `<div data-lang="${lang}">${SUPPORTED_LANGUAGES[lang]}</div>`).join('');
        langOptionsContainer.querySelectorAll('div').forEach(el => {
            el.addEventListener('click', () => {
                state.language = el.dataset.lang;
                langSearchInput.value = el.textContent;
                langOptionsContainer.classList.remove('visible');
                saveSettings();
                if (diffOutputContainer.style.display !== 'none') {
                    ensureLanguageLoaded(state.language, renderDiffOutput);
                }
            });
        });
        langSearchInput.value = SUPPORTED_LANGUAGES[state.language] || state.language;
    }

    /**
     * Makes sure a language's grammar is actually loaded before we highlight
     * with it directly via Prism.highlight() (used by the Split view), since
     * that path doesn't go through Prism's own highlightElement-based
     * autoloading hook. Falls back to just calling the callback if the
     * autoloader isn't available or the language is already loaded.
     */
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

    function loadInitialCode() {
        originalCodeEl.value = `body {\n  font-family: 'Arial';\n  color: #333;\n}`;
        modifiedCodeEl.value = `body {\n  font-family: 'Helvetica', sans-serif;\n  color: #444;\n  background-color: #f0f0f0;\n}`;
    }

    // === PWA ===
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js').catch(err => {
                console.warn('Service worker registration failed:', err);
            });
        }
    }

    init();
});
