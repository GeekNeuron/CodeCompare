document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const originalCodeEl = document.getElementById('original-code');
    const modifiedCodeEl = document.getElementById('modified-code');
    const compareBtn = document.getElementById('compare-btn');
    const diffOutputContainer = document.getElementById('diff-output-container');
    const diffOutputEl = document.getElementById('diff-output');
    const originalLinesEl = document.getElementById('original-lines');
    const modifiedLinesEl = document.getElementById('modified-lines');
    const themeSwitcher = document.getElementById('theme-switcher');
    const prismThemeLink = document.getElementById('prism-theme-link');
    const langSearchInput = document.getElementById('language-search');
    const langOptionsContainer = document.getElementById('language-options');
    const pluginToggles = document.querySelectorAll('.plugins-group input, .process-section input');

    // === Application State ===
    const state = {
        language: 'javascript',
        isDarkTheme: true,
        plugins: {
            // Display Plugins
            'line-numbers': true, 'toolbar': true, 'show-invisibles': false, 'autolinker': true,
            'wpd': false, 'match-braces': true, 'inline-color': false, 'previewers': true,
            'command-line': false, 'show-language': true,
            // Toolbar Plugins (depend on 'toolbar')
            'copy-to-clipboard': true, 'download-button': true,
            // Processing Plugins
            'normalize-whitespace': false
        }
    };

    // === Initialization ===
    function init() {
        setupEventListeners();
        populateLanguages();
        loadInitialCode();
        updateLineCounts();
        updatePluginCheckboxes();
    }

    // === Event Listeners Setup ===
    function setupEventListeners() {
        compareBtn.addEventListener('click', runComparison);
        originalCodeEl.addEventListener('input', updateLineCounts);
        modifiedCodeEl.addEventListener('input', updateLineCounts);
        themeSwitcher.addEventListener('click', toggleTheme);
        langSearchInput.addEventListener('input', filterLanguages);
        langSearchInput.addEventListener('focus', () => langOptionsContainer.classList.add('visible'));
        document.addEventListener('click', e => {
            if (!e.target.closest('.searchable-select-wrapper')) {
                langOptionsContainer.classList.remove('visible');
            }
        });

        pluginToggles.forEach(toggle => {
            toggle.addEventListener('change', () => {
                const plugin = toggle.dataset.plugin;
                state.plugins[plugin] = toggle.checked;
                runComparison();
            });
        });
    }

    // === Core Application Logic ===
    function runComparison() {
        if (originalCodeEl.value === '' && modifiedCodeEl.value === '') return;

        diffOutputContainer.style.display = 'block';
        document.getElementById('comparison-container').style.display = 'none';

        let originalText = originalCodeEl.value;
        let modifiedText = modifiedCodeEl.value;
        
        // Apply processing plugins before diffing
        if (state.plugins['normalize-whitespace']) {
            const normalizer = Prism.plugins.NormalizeWhitespace;
            originalText = normalizer.normalize(originalText, {});
            modifiedText = normalizer.normalize(modifiedText, {});
        }

        const diffText = createDiffText(originalText, modifiedText);
        
        diffOutputEl.textContent = diffText;
        diffOutputEl.className = `language-diff-${state.language}`;

        for (const plugin in state.plugins) {
            diffOutputEl.classList.toggle(plugin, state.plugins[plugin]);
        }
        
        Prism.highlightElement(diffOutputEl);
    }
    
    function createDiffText(text1, text2) {
        // (Implementation is the same as the previous correct version)
        const dmp = new diff_match_patch();
        const a = dmp.diff_linesToChars_(text1, text2);
        const diffs = dmp.diff_main(a.chars1, a.chars2, false);
        dmp.diff_charsToLines_(diffs, a.lineArray);

        return diffs.flatMap(([op, data]) => {
            const lines = data.split('\n').filter(Boolean);
            const prefix = op === 1 ? '+' : op === -1 ? '-' : ' ';
            return lines.map(line => `${prefix} ${line}`);
        }).join('\n');
    }

    // === UI & State Management ===
    function toggleTheme() {
        state.isDarkTheme = !state.isDarkTheme;
        const themeName = state.isDarkTheme ? 'prism-okaidia' : 'prism';
        prismThemeLink.href = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/${themeName}.min.css`;
    }

    function updatePluginCheckboxes() {
        pluginToggles.forEach(toggle => {
            const plugin = toggle.dataset.plugin;
            if (state.plugins[plugin] !== undefined) {
                toggle.checked = state.plugins[plugin];
            }
        });
    }
    
    // (Other helper functions like populateLanguages, filterLanguages, updateLineCounts, loadInitialCode are the same as the previous correct version)
    function populateLanguages() {
        const friendlyNames = { 'javascript': 'JavaScript', 'typescript': 'TypeScript', 'python': 'Python', 'csharp': 'C#', 'cpp': 'C++', 'markup': 'HTML/XML' };
        const languages = Object.keys(Prism.languages).filter(lang => typeof Prism.languages[lang] === 'object' && !Prism.languages[lang].alias).sort((a,b) => (friendlyNames[a]||a).localeCompare(friendlyNames[b]||b));
        langOptionsContainer.innerHTML = languages.map(lang => `<div data-lang="${lang}">${friendlyNames[lang] || lang}</div>`).join('');
        langOptionsContainer.querySelectorAll('div').forEach(el => {
            el.addEventListener('click', () => { state.language = el.dataset.lang; langSearchInput.value = el.textContent; langOptionsContainer.classList.remove('visible'); });
        });
        langSearchInput.value = friendlyNames[state.language];
    }
    function filterLanguages() { const q = langSearchInput.value.toLowerCase(); langOptionsContainer.querySelectorAll('div').forEach(o => o.style.display=o.textContent.toLowerCase().includes(q)?'':'none'); }
    function updateLineCounts() { originalLinesEl.textContent = `Lines: ${originalCodeEl.value.split('\n').length}`; modifiedLinesEl.textContent = `Lines: ${modifiedCodeEl.value.split('\n').length}`; }
    function loadInitialCode() { originalCodeEl.value = `body {\n  font-family: 'Arial';\n  color: #333;\n}`; modifiedCodeEl.value = `body {\n  font-family: 'Helvetica', sans-serif;\n  color: #444;\n  background-color: #f0f0f0;\n}`; }

    init();
});
