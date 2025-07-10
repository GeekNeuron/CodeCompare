document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const originalCodeEl = document.getElementById('original-code');
    const modifiedCodeEl = document.getElementById('modified-code');
    const compareBtn = document.getElementById('compare-btn');
    const diffOutputEl = document.getElementById('diff-output');
    const statsOutputEl = document.getElementById('stats-output');
    
    // Settings
    const themeSelect = document.getElementById('theme-select');
    const themeLink = document.getElementById('prism-theme-link');
    const langSearch = document.getElementById('language-search');
    const langOptions = document.getElementById('language-options');
    const pluginToggles = document.querySelectorAll('.switch-toggle input[data-plugin]');

    // State
    const appState = {
        language: 'javascript',
        plugins: {
            'line-numbers': true,
            'show-invisibles': false,
            'autolinker': true,
            'match-braces': true,
        }
    };

    // --- INITIALIZATION ---
    function init() {
        setupEventListeners();
        populateLanguages();
        loadInitialCode();
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        compareBtn.addEventListener('click', runComparison);
        themeSelect.addEventListener('change', () => {
            themeLink.href = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/${themeSelect.value}.min.css`;
        });
        
        // Language Search Logic
        langSearch.addEventListener('input', filterLanguages);
        langSearch.addEventListener('focus', () => langOptions.classList.add('visible'));
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.searchable-select')) {
                langOptions.classList.remove('visible');
            }
        });

        // Plugin Toggles
        pluginToggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const plugin = e.target.dataset.plugin;
                appState.plugins[plugin] = e.target.checked;
                runComparison(); // Re-run to apply plugin changes
            });
        });
    }

    // --- CORE LOGIC ---
    function runComparison() {
        const originalText = originalCodeEl.value;
        const modifiedText = modifiedCodeEl.value;

        const langDefinition = Prism.languages[appState.language] || Prism.languages.markup;
        
        // Use diff-highlight format: a block of text with lines prefixed with +, -, or space
        const combinedText = createDiffText(originalText, modifiedText);
        
        // Apply classes for plugins
        Object.keys(appState.plugins).forEach(plugin => {
            diffOutputEl.classList.toggle(plugin, appState.plugins[plugin]);
        });
        
        const highlightedHtml = Prism.highlight(combinedText, Prism.languages.diff, `diff-${appState.language}`);
        diffOutputEl.innerHTML = highlightedHtml;
        
        updateStats(combinedText);
    }
    
    function createDiffText(text1, text2) {
        const dmp = new diff_match_patch();
        const a = dmp.diff_linesToChars_(text1, text2);
        const lineText1 = a.chars1;
        const lineText2 = a.chars2;
        const lineArray = a.lineArray;
        const diffs = dmp.diff_main(lineText1, lineText2, false);
        dmp.diff_charsToLines_(diffs, lineArray);
        
        let result = [];
        for (const [op, data] of diffs) {
            const lines = data.split('\n').filter(line => line !== '');
            lines.forEach(line => {
                if (op === 0) result.push(`  ${line}`);
                else if (op === -1) result.push(`- ${line}`);
                else if (op === 1) result.push(`+ ${line}`);
            });
        }
        return result.join('\n');
    }

    // --- UI & HELPERS ---
    function updateStats(diffText) {
        const added = (diffText.match(/^[+]/gm) || []).length;
        const removed = (diffText.match(/^[-]/gm) || []).length;
        statsOutputEl.innerHTML = `
            <span class="added"><i class="fas fa-plus-circle"></i> ${added} added</span>
            <span class="removed"><i class="fas fa-minus-circle"></i> ${removed} removed</span>
        `;
    }
    
    function populateLanguages() {
        const friendlyNames = {
            'javascript': 'JavaScript', 'typescript': 'TypeScript', 'python': 'Python', 'csharp': 'C#', 'cpp': 'C++',
            'markup': 'HTML/XML', 'css': 'CSS', 'scss': 'SCSS', 'sql': 'SQL', 'bash': 'Bash Shell'
        };

        const languages = Object.keys(Prism.languages)
            .filter(lang => typeof Prism.languages[lang] === 'object')
            .sort((a, b) => (friendlyNames[a] || a).localeCompare(friendlyNames[b] || b));
        
        langOptions.innerHTML = languages.map(lang =>
            `<div data-lang="${lang}">${friendlyNames[lang] || lang}</div>`
        ).join('');

        langOptions.querySelectorAll('div').forEach(el => {
            el.addEventListener('click', () => {
                const lang = el.dataset.lang;
                appState.language = lang;
                langSearch.value = el.textContent;
                langOptions.classList.remove('visible');
                runComparison();
            });
        });

        // Set initial value
        langSearch.value = friendlyNames[appState.language];
    }

    function filterLanguages() {
        const query = langSearch.value.toLowerCase();
        langOptions.querySelectorAll('div').forEach(option => {
            option.style.display = option.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
    }

    function loadInitialCode() {
        originalCodeEl.value = `// The default export of \`netlify-plugin-nextjs\`
module.exports = {
  onBuild() {
    // commands to run build
  },
  async onPostBuild() {
    console.log("Next.js build is complete!");
  }
};`;

        modifiedCodeEl.value = `// The default export of \`netlify-plugin-nextjs\`
module.exports = {
  onPreBuild() {
    // commands to run before the build
    console.log("Starting Next.js build...");
  },
  onBuild() {
    // commands to run build
  },
  async onPostBuild() {
    console.log("Next.js build is complete!");
    await restoreCache({ cacheDir: '.next/cache' });
  }
};`;
        runComparison();
    }

    // Start the app
    init();
});
