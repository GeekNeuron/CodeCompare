document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const originalCodeEl = document.getElementById('original-code');
    const modifiedCodeEl = document.getElementById('modified-code');
    const compareBtn = document.getElementById('compare-btn');
    const diffOutputContainer = document.getElementById('diff-output-container');
    const diffOutputEl = document.getElementById('diff-output');
    
    // Line Counts
    const originalLinesEl = document.getElementById('original-lines');
    const modifiedLinesEl = document.getElementById('modified-lines');

    // Controls
    const themeSelectWrapper = document.getElementById('theme-select-wrapper');
    const themeSelectTrigger = themeSelectWrapper.querySelector('.custom-select-trigger');
    const themeOptions = themeSelectWrapper.querySelectorAll('.custom-option');
    const prismThemeLink = document.getElementById('prism-theme-link');

    const langSearchInput = document.getElementById('language-search');
    const langOptionsContainer = document.getElementById('language-options');
    
    // Plugin Toggles
    const pluginToggles = document.querySelectorAll('.plugins-group .switch-toggle input');

    // --- State ---
    const state = {
        language: 'javascript',
        plugins: {
            'line-numbers': true,
            'toolbar': true,
            'show-invisibles': false,
            'autolinker': true
        }
    };

    // --- Initialization ---
    function init() {
        setupEventListeners();
        populateLanguages();
        loadInitialCode();
        updateLineCounts();
    }

    function setupEventListeners() {
        compareBtn.addEventListener('click', runComparison);
        originalCodeEl.addEventListener('input', updateLineCounts);
        modifiedCodeEl.addEventListener('input', updateLineCounts);

        // Custom theme select
        themeSelectTrigger.addEventListener('click', () => themeSelectWrapper.classList.toggle('open'));
        themeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const selectedValue = e.target.dataset.value;
                themeSelectTrigger.querySelector('span').textContent = e.target.textContent;
                prismThemeLink.href = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/${selectedValue}.min.css`;
                themeSelectWrapper.classList.remove('open');
            });
        });

        // Searchable language select
        langSearchInput.addEventListener('input', filterLanguages);
        langSearchInput.addEventListener('focus', () => langOptionsContainer.classList.add('visible'));
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.searchable-select-wrapper')) {
                langOptionsContainer.classList.remove('visible');
            }
        });

        // Plugin Toggles
        pluginToggles.forEach(toggle => {
            toggle.addEventListener('change', () => {
                const plugin = toggle.dataset.plugin;
                state.plugins[plugin] = toggle.checked;
                runComparison(); // Re-render when plugins change
            });
        });
    }

    function runComparison() {
        diffOutputContainer.style.display = 'block'; // Show the output container
        document.getElementById('comparison-container').style.display = 'none'; // Hide input textareas

        const originalText = originalCodeEl.value;
        const modifiedText = modifiedCodeEl.value;

        // Use diff-highlight format: a block of text with lines prefixed with +, -, or space
        const diffText = createDiffText(originalText, modifiedText);
        
        diffOutputEl.textContent = diffText;
        diffOutputEl.className = `language-diff-${state.language}`;

        // Apply plugin classes to the <pre> element
        Object.keys(state.plugins).forEach(plugin => {
            diffOutputEl.classList.toggle(plugin, state.plugins[plugin]);
        });
        
        Prism.highlightElement(diffOutputEl);
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
    
    function populateLanguages() {
        const friendlyNames = { 'javascript': 'JavaScript', 'typescript': 'TypeScript', 'python': 'Python', 'csharp': 'C#', 'cpp': 'C++', 'markup': 'HTML/XML', 'css': 'CSS', 'scss': 'SCSS', 'sql': 'SQL', 'bash': 'Bash Shell' };

        const languages = Object.keys(Prism.languages)
            .filter(lang => typeof Prism.languages[lang] === 'object' && !Prism.languages[lang].alias)
            .sort((a, b) => (friendlyNames[a] || a).localeCompare(friendlyNames[b] || b));
        
        langOptionsContainer.innerHTML = languages.map(lang =>
            `<div data-lang="${lang}">${friendlyNames[lang] || lang}</div>`
        ).join('');

        langOptionsContainer.querySelectorAll('div').forEach(el => {
            el.addEventListener('click', () => {
                const lang = el.dataset.lang;
                state.language = lang;
                langSearchInput.value = el.textContent;
                langOptionsContainer.classList.remove('visible');
            });
        });
        langSearchInput.value = friendlyNames[state.language];
    }
    
    function filterLanguages() {
        const query = langSearchInput.value.toLowerCase();
        langOptionsContainer.querySelectorAll('div').forEach(option => {
            option.style.display = option.textContent.toLowerCase().includes(query) ? 'block' : 'none';
        });
    }

    function updateLineCounts() {
        originalLinesEl.textContent = `Lines: ${originalCodeEl.value.split('\n').length}`;
        modifiedLinesEl.textContent = `Lines: ${modifiedCodeEl.value.split('\n').length}`;
    }

    function loadInitialCode() {
        originalCodeEl.value = `// Original Welcome Function
function welcome(name) {
  return "Hello, " + name;
}`;
        modifiedCodeEl.value = `// Updated Welcome Function with ES6
const welcome = (name) => {
  // A more personal greeting
  return \`Greetings, \${name}!\`;
};`;
    }

    init();
});
