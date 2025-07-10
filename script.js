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
    const pluginToggles = document.querySelectorAll('.plugins-group .switch-toggle input');

    // === Application State ===
    const state = {
        language: 'javascript',
        isDarkTheme: true,
        plugins: {
            'line-numbers': true, 'toolbar': true, 'show-invisibles': false, 'autolinker': true,
            'match-braces': true, 'inline-color': false, 'command-line': false,
            'copy-to-clipboard': true, 'download-button': true, 'show-language': false
        }
    };

    // === Initialization ===
    function init() {
        setupEventListeners();
        populateLanguages();
        loadInitialCode();
        updateLineCounts();
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
                handlePluginDependencies(plugin, toggle.checked);
                runComparison();
            });
        });
    }

    // === Core Application Logic ===
    function runComparison() {
        if (originalCodeEl.value === '' && modifiedCodeEl.value === '') return;

        diffOutputContainer.style.display = 'block';
        document.getElementById('comparison-container').style.display = 'none';

        const diffText = createDiffText(originalCodeEl.value, modifiedCodeEl.value);
        
        diffOutputEl.textContent = diffText;
        diffOutputEl.className = `language-diff-${state.language}`;

        // Apply plugin classes dynamically
        for (const plugin in state.plugins) {
            diffOutputEl.classList.toggle(plugin, state.plugins[plugin]);
        }
        
        Prism.highlightElement(diffOutputEl);
    }

    function createDiffText(text1, text2) {
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

    function handlePluginDependencies(plugin, isEnabled) {
        if (plugin === 'toolbar') {
            ['copy-to-clipboard', 'download-button', 'show-language'].forEach(subPlugin => {
                const toggle = document.querySelector(`input[data-plugin="${subPlugin}"]`);
                toggle.checked = isEnabled;
                toggle.disabled = !isEnabled;
                state.plugins[subPlugin] = isEnabled;
                toggle.closest('.switch-toggle').style.opacity = isEnabled ? 1 : 0.5;
            });
        }
    }

    function populateLanguages() {
        const friendlyNames = { 'javascript': 'JavaScript', 'typescript': 'TypeScript', 'python': 'Python', 'csharp': 'C#', 'cpp': 'C++', 'markup': 'HTML/XML' };
        const languages = Object.keys(Prism.languages)
            .filter(lang => typeof Prism.languages[lang] === 'object' && !Prism.languages[lang].alias)
            .sort((a, b) => (friendlyNames[a] || a).localeCompare(friendlyNames[b] || b));
        
        langOptionsContainer.innerHTML = languages.map(lang => `<div data-lang="${lang}">${friendlyNames[lang] || lang}</div>`).join('');
        langOptionsContainer.querySelectorAll('div').forEach(el => {
            el.addEventListener('click', () => {
                state.language = el.dataset.lang;
                langSearchInput.value = el.textContent;
                langOptionsContainer.classList.remove('visible');
            });
        });
        langSearchInput.value = friendlyNames[state.language];
    }
    
    function filterLanguages() {
        const query = langSearchInput.value.toLowerCase();
        langOptionsContainer.querySelectorAll('div').forEach(opt => {
            opt.style.display = opt.textContent.toLowerCase().includes(query) ? 'block' : 'none';
        });
    }

    function updateLineCounts() {
        originalLinesEl.textContent = `Lines: ${originalCodeEl.value.split('\n').length}`;
        modifiedLinesEl.textContent = `Lines: ${modifiedCodeEl.value.split('\n').length}`;
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
    }

    init();
});
