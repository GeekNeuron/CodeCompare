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
    const pluginToggles = document.querySelectorAll('.plugins-group input, .process-section input');
    const newComparisonBtn = document.getElementById('new-comparison-btn');    const comparisonContainer = document.getElementById('comparison-container');
    const langToggleBtn = document.getElementById('lang-toggle-btn');
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
            shortcutsHelp: 'Keyboard shortcuts',
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
            settingsAppearanceHint: 'Toggle theme and interface language from the top bar.',
            settingsSyntaxThemeTitle: 'Code color theme',
            settingsSyntaxThemeHint: 'Choose the syntax highlighting theme used for code.',
            themeAuto: 'Auto (match app theme)',
            settingsResetTitle: 'Reset local data',
            settingsResetHint: 'Clears saved preferences and comparison history stored in this browser.',
            settingsResetButton: 'Reset Data',
            settingsAboutTitle: 'About',
            settingsAboutHint: 'CodeCompare is an open-source, client-side diff tool.',
            resetConfirm: 'This will clear all saved settings and comparison history. Continue?'
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
            ignoreBlankLines: 'نادیده گرفتن خطوط خالی',
            ignorePresetPlaceholder: '— پریست‌های ذخیره‌شده —',
            ignorePresetSave: 'ذخیرهٔ پریست',
            ignorePresetDelete: 'حذف پریست',
            swapButton: 'جابه‌جایی',
            shortcutsHelp: 'میان‌برهای کیبورد',
            detectLanguage: 'تشخیص خودکار',
            ignoreCase: 'نادیده گرفتن بزرگی/کوچکی حروف',
            liveDiff: 'دیف زنده (مقایسهٔ خودکار حین تایپ)',
            detectMoved: 'برجسته‌سازی کد جابه‌جاشده',
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
            loadMoreRows: 'نمایش {count} ردیف بیشتر ({remaining} ردیف برای حفظ کارایی پنهان شده)',
            copyDiff: 'کپی تفاوت‌ها',
            copyDiffDone: '!کپی شد',
            downloadDiff: 'دانلود .diff',
            downloadPatch: 'دانلود .patch',
            exportHtmlReport: 'خروجی گزارش HTML',
            printPdf: 'چاپ / ذخیره به‌صورت PDF',
            shareLink: 'اشتراک‌گذاری لینک',
            shareLinkCopied: '!لینک کپی شد',
            shareLinkManualCopy: ':این لینک را برای اشتراک‌گذاری مقایسه کپی کنید',
            copyLineManual: ':این خط را کپی کنید',
            searchInDiff: '...جست‌وجو در نتیجه',
            searchNoMatches: 'موردی یافت نشد',
            searchMatchCount: '{current}/{total}',
            copyDiffManualCopy: ':این تفاوت‌ها را کپی کنید',
            shareLinkTooLong: '.توجه: این لینک نسبتاً طولانی است و ممکن است در همه‌جا کار نکند (مثلاً برخی اپ‌های پیام‌رسان لینک‌های طولانی را کوتاه می‌کنند)',
            normalizeAndRecompare: 'یکسان‌سازی و مقایسهٔ مجدد',
            shareLoadFailed: '.بارگذاری مقایسه از این لینک ممکن نشد (ممکن است خراب باشد یا فرمت پشتیبانی‌نشده داشته باشد)',
            legendAdded: 'افزوده‌شده +',
            legendRemoved: 'حذف‌شده \u2212',
            legendUnchanged: 'بدون تغییر',
            linesLabel: 'خطوط',
            statsSummary: 'حذف‌شده {removed} \u00b7 افزوده‌شده {added}',
            uploadTooLarge: '.(حداکثر ۲ مگابایت) حجم فایل برای بارگذاری زیاد است',
            uploadFailed: '.خواندن این فایل ممکن نشد',
            navCompare: 'مقایسه',
            navHistory: 'تاریخچه',
            navSettings: 'تنظیمات',
            navBatch: 'مقایسهٔ دسته‌ای',
            batchTitle: 'مقایسهٔ دسته‌ای فایل‌ها',
            batchOriginalFiles: 'فایل‌های اصلی',
            batchModifiedFiles: 'فایل‌های تغییریافته',
            batchSelectFiles: '...انتخاب فایل‌ها',
            batchSelectFolder: '...انتخاب پوشه',
            batchRun: 'اجرای مقایسهٔ دسته‌ای',
            batchHint: '.فایل‌ها بر اساس نام (یا مسیر نسبی هنگام انتخاب پوشه) تطبیق داده می‌شوند. فایلی که فقط در یک طرف باشد، کامل اضافه‌شده یا حذف‌شده نمایش داده می‌شود',
            statTotalRuns: 'مقایسه‌های انجام‌شده',
            statLinesAdded: 'خطوط افزوده‌شده',
            statLinesRemoved: 'خطوط حذف‌شده',
            statTopLanguage: 'پراستفاده‌ترین زبان',
            statAvgSimilarity: 'میانگین شباهت',
            exportHistory: 'خروجی گرفتن',
            importHistory: 'بارگذاری',
            importSuccess: '!بارگذاری شد',
            importFailed: 'بارگذاری ناموفق بود',
            historyTitle: 'تاریخچه مقایسه‌ها',
            clearHistory: 'پاک‌کردن تاریخچه',
            historyEmpty: '.هنوز مقایسه‌ای انجام نشده. از تب مقایسه شروع کنید',
            historyRestore: 'بازیابی',
            historyDelete: 'حذف',
            settingsTitle: 'تنظیمات',
            settingsAppearance: 'ظاهر برنامه',
            settingsAppearanceHint: '.تم و زبان رابط کاربری را از نوار بالا تغییر دهید',
            settingsSyntaxThemeTitle: 'تم رنگی کد',
            settingsSyntaxThemeHint: '.تم هایلایت‌کردن سینتکس کد را انتخاب کنید',
            themeAuto: '(مطابق با تم برنامه) خودکار',
            settingsResetTitle: 'بازنشانی داده‌های محلی',
            settingsResetHint: '.تنظیمات ذخیره‌شده و تاریخچه مقایسه‌ها را در این مرورگر پاک می‌کند',
            settingsResetButton: 'بازنشانی داده‌ها',
            settingsAboutTitle: 'درباره',
            settingsAboutHint: '.CodeCompare یک ابزار مقایسه کد اوپن‌سورس و کاملاً سمت کاربر است',
            resetConfirm: '.این کار تمام تنظیمات ذخیره‌شده و تاریخچه مقایسه‌ها را پاک می‌کند. ادامه می‌دهید؟'
        }
    };

    const state = {
        language: 'javascript',
        uiLang: 'en',
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
            'ignore-case': false
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
                if (typeof saved.uiLang === 'string') state.uiLang = saved.uiLang;
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
                uiLang: state.uiLang,
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

    function setupEventListeners() {
        compareBtn.addEventListener('click', runComparison);
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
                    runComparison();
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
                    runComparison();
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
            } else if (e.key === 'Escape' && shortcutsModal && !shortcutsModal.hidden) {
                hideShortcutsHelp();
            }
        });

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
                if (diffOutputContainer.style.display !== 'none') {
                    runComparison();
                }
            });
        });

        newComparisonBtn.addEventListener('click', showInputView);

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
                    copyBtn.textContent = ok ? '\u2713' : '\u2717';
                    setTimeout(() => { copyBtn.textContent = '\u2327'; }, 900);
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
            runComparison();
        }
    }

    function showShortcutsHelp() {
        const isFa = state.uiLang === 'fa';
        const rows = [
            ['Ctrl/⌘ + Enter', isFa ? 'اجرای مقایسه' : 'Run comparison'],
            ['Alt/⌥ + \u2193', isFa ? 'رفتن به تغییر بعدی' : 'Jump to next change'],
            ['Alt/⌥ + \u2191', isFa ? 'رفتن به تغییر قبلی' : 'Jump to previous change'],
            ['Enter', isFa ? '(در کادر جست‌وجو) رفتن به مورد بعدی' : 'Next search match (in search box)'],
            ['Shift + Enter', isFa ? '(در کادر جست‌وجو) رفتن به مورد قبلی' : 'Previous search match (in search box)'],
            ['Esc', isFa ? 'بستن این پنجره' : 'Close this dialog']
        ];
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
        shortcutsModal.hidden = false;
    }

    function hideShortcutsHelp() {
        shortcutsModal.hidden = true;
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

    function jumpToChange(direction) {
        if (diffOutputContainer.style.display === 'none') return;
        const starts = getChangeGroupStarts();
        if (starts.length === 0) return;

        const attr = state.diffView === 'split' ? 'data-row-index' : 'data-entry-index';
        const container = state.diffView === 'split' ? diffSplitView : diffOutputLinesEl;
        const findEl = index => container.querySelector(`[${attr}="${index}"]`);

        let targetIndex;
        if (direction > 0) {
            targetIndex = starts.find(i => {
                const el = findEl(i);
                return el && el.getBoundingClientRect().top > 60;
            });
            if (targetIndex === undefined) targetIndex = starts[starts.length - 1];
        } else {
            const reversed = [...starts].reverse();
            targetIndex = reversed.find(i => {
                const el = findEl(i);
                return el && el.getBoundingClientRect().top < -10;
            });
            if (targetIndex === undefined) targetIndex = starts[0];
        }

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
        const isFa = state.uiLang === 'fa';
        const parts = [];
        if (lineEndingMismatch) {
            parts.push(isFa
                ? `پایان خط متفاوت (${originalStyle.toUpperCase()} در برابر ${modifiedStyle.toUpperCase()})`
                : `different line endings (${originalStyle.toUpperCase()} vs ${modifiedStyle.toUpperCase()})`);
        }
        if (bomMismatch) {
            parts.push(isFa ? 'یکی از فایل‌ها BOM دارد و دیگری ندارد' : 'one file has a BOM, the other does not');
        }
        const message = '\u26a0 ' +
            (isFa ? 'این می‌تواند باعث نمایش تغییرات نادرست شود: ' : 'This can cause misleading changes: ') +
            parts.join(isFa ? ' و ' : ' and ');
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
        runComparison();
    }

    function runComparison() {
        if (originalCodeEl.value === '' && modifiedCodeEl.value === '') return;

        unifiedRenderLimit = RENDER_CHUNK_SIZE;
        splitRenderLimit = RENDER_CHUNK_SIZE;

        diffOutputContainer.style.display = 'block';
        comparisonContainer.style.display = 'none';

        let originalText = originalCodeEl.value;
        let modifiedText = modifiedCodeEl.value;

        showEncodingWarningIfNeeded();

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
        if (state.plugins['ignore-blank-lines']) {
            lastDiffEntries = CodeCompareDiff.applyIgnoreBlankLines(lastDiffEntries);
        }
        if (state.detectMoved) {
            lastDiffEntries = CodeCompareDiff.detectMovedBlocks(lastDiffEntries);
        }
        expandedUnifiedFolds = new Set();
        expandedSplitFolds = new Set();
        const historyStats = CodeCompareDiff.computeStats(lastDiffEntries);
        if (window.CodeCompareDashboard) {
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
        const isFa = state.uiLang === 'fa';
        const name = window.prompt(isFa ? 'نامی برای این پریست وارد کنید:' : 'Name this preset:');
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
    }

    function renderMinimap() {
        if (!diffMinimapEl || !lastDiffEntries) return;
        if (state.diffView === 'split') {
            diffMinimapEl.style.display = 'none';
            return;
        }
        diffMinimapEl.style.display = '';
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
        return `<div class="${className}" role="button" tabindex="0" data-fold-id="${foldId}"><span class="fold-icon" aria-hidden="true">\u22ef</span><span>${label}</span></div>`;
    }

    function loadMoreNoticeHtml(view, remaining) {
        const label = t('loadMoreRows', { count: Math.min(remaining, RENDER_CHUNK_SIZE), remaining });
        return `<div class="load-more-notice"><button type="button" class="compare-button secondary-button" data-load-more="${view}">${escapeHtml(label)}</button></div>`;
    }

    function renderUnifiedLines(diffEntries) {
        const html = [];
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
            const movedBadge = entry.moved ? '<span class="moved-badge" title="Moved code">\u21c4</span>' : '';
            html.push(
                `<div class="unified-line type-${entry.type}${movedClass}" data-entry-index="${entryIndex}">` +
                `<span class="unified-line-num">${lineNo}</span>` +
                `<span class="unified-line-prefix">${prefix}</span>` +
                `${movedBadge}` +
                `<code class="unified-line-code">${highlightLine(entry.line)}</code>` +
                `<button type="button" class="copy-line-btn" tabindex="-1" aria-label="Copy line">\u2327</button>` +
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
                `<div class="split-line type-${row.left.type}${row.left.moved ? ' moved' : ''}" data-row-index="${currentRowIndex}">` +
                `<span class="split-line-num">${row.left.type !== 'empty' ? leftLineNo : ''}</span>` +
                `${row.left.moved ? '<span class="moved-badge" title="Moved code">\u21c4</span>' : ''}` +
                `<code class="split-line-code">${leftCode}</code>` +
                `${row.left.type !== 'empty' ? '<button type="button" class="copy-line-btn" tabindex="-1" aria-label="Copy line">\u2327</button>' : ''}` +
                `</div>`
            );
            rightHtml.push(
                `<div class="split-line type-${row.right.type}${row.right.moved ? ' moved' : ''}" data-row-index="${currentRowIndex}">` +
                `<span class="split-line-num">${row.right.type !== 'empty' ? rightLineNo : ''}</span>` +
                `${row.right.moved ? '<span class="moved-badge" title="Moved code">\u21c4</span>' : ''}` +
                `<code class="split-line-code">${rightCode}</code>` +
                `${row.right.type !== 'empty' ? '<button type="button" class="copy-line-btn" tabindex="-1" aria-label="Copy line">\u2327</button>' : ''}` +
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
    body { background:#282c34; color:#abb2bf; font-family:'Fira Code',Consolas,monospace; margin:0; padding:24px; }
    h1 { font-size:16px; font-weight:600; margin:0 0 4px; color:#fff; }
    .meta { color:#7f848e; font-size:12px; margin-bottom:18px; }
    .stats { display:flex; gap:16px; margin-bottom:16px; font-size:13px; }
    .stats span { background:#2c313a; border:1px solid #3e4451; border-radius:6px; padding:4px 10px; }
    .diff { border:1px solid #3e4451; border-radius:8px; overflow:hidden; }
    .row { display:flex; gap:10px; padding:2px 12px; white-space:pre-wrap; word-break:break-word; font-size:13px; line-height:1.6; }
    .row-added { background:rgba(152,195,121,0.15); }
    .row-removed { background:rgba(224,108,117,0.15); }
    .prefix { width:14px; flex-shrink:0; opacity:0.7; }
    .row-added .prefix { color:#98c379; }
    .row-removed .prefix { color:#e06c75; }
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
            ensureLanguageLoaded(state.language, runComparison);
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

    function loadInitialCode() {
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
