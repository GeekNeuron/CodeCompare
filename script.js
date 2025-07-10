document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const originalCodeEl = document.getElementById('original-code');
    const modifiedCodeEl = document.getElementById('modified-code');
    const originalOutputEl = document.getElementById('original-output');
    const modifiedOutputEl = document.getElementById('modified-output');
    const compareBtn = document.getElementById('compare-btn');
    const statsContainer = document.getElementById('comparison-stats');

    const originalLinesEl = document.getElementById('original-lines');
    const modifiedLinesEl = document.getElementById('modified-lines');

    // Settings Modal
    const settingsBtn = document.getElementById('settings-btn');
    const modal = document.getElementById('settings-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const themeSelect = document.getElementById('theme-select');
    const prismThemeLink = document.getElementById('prism-theme');
    
    // Language Select
    const langSearchInput = document.getElementById('language-select-search');
    const langOptionsContainer = document.querySelector('.language-options');
    
    // Plugin Toggles
    const pluginToggles = document.querySelectorAll('.switch-toggle input[data-plugin]');

    // App State
    const state = {
        language: 'javascript',
        plugins: {
            'line-numbers': true,
            'show-invisibles': false,
            'autolinker': true,
            'toolbar': true,
            'copy-to-clipboard': true,
            'download-button': false,
            'match-braces': true,
            'show-language': false
        }
    };
    
    // --- Initialization ---
    populateLanguages();
    setupEventListeners();
    updateLineCounts();
    
    // --- Event Listeners ---
    function setupEventListeners() {
        compareBtn.addEventListener('click', runComparison);
        [originalCodeEl, modifiedCodeEl].forEach(el => el.addEventListener('input', updateLineCounts));

        // Settings Modal
        settingsBtn.addEventListener('click', () => modal.classList.add('visible'));
        closeModalBtn.addEventListener('click', () => modal.classList.remove('visible'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('visible');
        });

        // Theme
        themeSelect.addEventListener('change', changeTheme);

        // Language Search
        langSearchInput.addEventListener('click', () => langOptionsContainer.classList.add('visible'));
        langSearchInput.addEventListener('input', filterLanguages);
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.searchable-select')) {
                langOptionsContainer.classList.remove('visible');
            }
        });
        
        // Plugin Toggles
        pluginToggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const plugin = e.target.dataset.plugin;
                state.plugins[plugin] = e.target.checked;
                // Handle dependencies
                if (plugin === 'toolbar' && !e.target.checked) {
                    document.querySelector('input[data-plugin="copy-to-clipboard"]').checked = false;
                    document.querySelector('input[data-plugin="download-button"]').checked = false;
                    state.plugins['copy-to-clipboard'] = false;
                    state.plugins['download-button'] = false;
                }
                runComparison(); // Re-render on plugin change
            });
        });
    }

    // --- Core Functions ---
    function runComparison() {
        const originalText = originalCodeEl.value;
        const modifiedText = modifiedCodeEl.value;
        
        originalOutputEl.innerHTML = '';
        modifiedOutputEl.innerHTML = '';

        if (!originalText && !modifiedText) {
            statsContainer.innerHTML = '';
            return;
        }
        
        const langDefinition = Prism.languages[state.language];
        if (!langDefinition) {
            console.warn(`Language '${state.language}' not found. Defaulting to markup.`);
            state.language = 'markup';
        }
        
        const diff = generateDiff(originalText, modifiedText, langDefinition);

        originalOutputEl.innerHTML = diff.original;
        modifiedOutputEl.innerHTML = diff.modified;

        applyPlugins(originalOutputEl, modifiedOutputEl);
        
        Prism.highlightAllUnder(document.getElementById('comparison-container'));

        updateStats(diff.stats);
    }
    
    function generateDiff(text1, text2, grammar) {
        const dmp = new diff_match_patch();
        const diffs = dmp.diff_main(text1, text2);
        dmp.diff_cleanupSemantic(diffs);
        
        let originalHtml = '';
        let modifiedHtml = '';
        let addedLines = 0;
        let removedLines = 0;

        for (const [op, data] of diffs) {
            const escapedData = escapeHtml(data);
            if (op === 0) { // EQUAL
                originalHtml += escapedData;
                modifiedHtml += escapedData;
            } else if (op === -1) { // DELETE
                originalHtml += `<span class="token deleted">${escapedData}</span>`;
                removedLines += (data.match(/\n/g) || []).length + (data.startsWith('\n') ? 0 : 1);
            } else if (op === 1) { // INSERT
                modifiedHtml += `<span class="token inserted">${escapedData}</span>`;
                addedLines += (data.match(/\n/g) || []).length + (data.startsWith('\n') ? 0 : 1);
            }
        }
        
        return {
            original: wrapInCode(originalHtml),
            modified: wrapInCode(modifiedHtml),
            stats: { added: addedLines, removed: removedLines }
        };
    }
    
    function wrapInCode(html) {
        return `<code class="language-${state.language}">${html}</code>`;
    }

    function applyPlugins(...elements) {
        elements.forEach(el => {
            Object.keys(state.plugins).forEach(plugin => {
                const isActive = state.plugins[plugin];
                el.classList.toggle(plugin, isActive);
            });
        });
    }

    // --- UI & State Management ---
    function updateLineCounts() {
        originalLinesEl.textContent = `Lines: ${originalCodeEl.value.split('\n').length}`;
        modifiedLinesEl.textContent = `Lines: ${modifiedCodeEl.value.split('\n').length}`;
    }

    function changeTheme() {
        const selectedTheme = themeSelect.value;
        prismThemeLink.href = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/${selectedTheme}.min.css`;
    }
    
    function populateLanguages() {
        const langs = Object.keys(Prism.languages)
            .filter(lang => typeof Prism.languages[lang] === 'object')
            .sort();

        langOptionsContainer.innerHTML = langs.map(lang => `<div data-value="${lang}">${getLangTitle(lang)}</div>`).join('');

        langOptionsContainer.querySelectorAll('div').forEach(option => {
            option.addEventListener('click', () => {
                const langValue = option.dataset.value;
                state.language = langValue;
                langSearchInput.value = option.textContent;
                langOptionsContainer.classList.remove('visible');
                runComparison();
            });
        });
        langSearchInput.value = getLangTitle(state.language);
    }
    
    function filterLanguages() {
        const query = langSearchInput.value.toLowerCase();
        langOptionsContainer.querySelectorAll('div').forEach(option => {
            const matches = option.textContent.toLowerCase().includes(query);
            option.style.display = matches ? 'block' : 'none';
        });
    }
    
    function getLangTitle(lang) {
        // Simple mapping for better titles
        const titles = { 'javascript': 'JavaScript', 'typescript': 'TypeScript', 'python': 'Python', 'csharp': 'C#', 'cpp': 'C++' };
        return titles[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
    }

    function updateStats(stats) {
        statsContainer.innerHTML = `
            <div class="stat-item added"><span class="label">Added</span><span class="count">${stats.added}</span></div>
            <div class="stat-item removed"><span class="label">Removed</span><span class="count">${stats.removed}</span></div>
        `;
    }

    function escapeHtml(text) {
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // Initial code for demonstration
    originalCodeEl.value = `function helloWorld() {\n  console.log("Hello, world!");\n}`;
    modifiedCodeEl.value = `async function helloWorld() {\n  // A greeting to the world\n  console.log("Hello, beautiful world!");\n}`;
    updateLineCounts();
    runComparison();

});
