document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const originalCodeEl = document.getElementById('original-code');
    const modifiedCodeEl = document.getElementById('modified-code');
    const compareBtn = document.getElementById('compare-btn');
    const comparisonContainer = document.getElementById('comparison-container');
    const inlineOutputEl = document.getElementById('inline-output');

    // Line Counts
    const originalLinesEl = document.getElementById('original-lines');
    const modifiedLinesEl = document.getElementById('modified-lines');
    
    // Controls
    const themeSelectWrapper = document.querySelector('.custom-select-wrapper');
    const themeSelectTrigger = document.querySelector('.custom-select-trigger');
    const themeOptions = document.querySelectorAll('.custom-option');
    const prismThemeLink = document.getElementById('prism-theme');
    const viewModeBtns = document.querySelectorAll('.mode-btn');
    
    // Toggles
    const lineNumbersToggle = document.getElementById('line-numbers-toggle');
    const copyBtnToggle = document.getElementById('copy-btn-toggle');
    
    // --- State ---
    const state = {
        viewMode: 'side-by-side', // 'side-by-side' or 'inline'
        lineNumbers: true,
        copyButton: true
    };

    // --- Initial Setup ---
    const dmp = new diff_match_patch();
    setupInitialCode();
    setupEventListeners();

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        compareBtn.addEventListener('click', runComparison);

        originalCodeEl.addEventListener('input', () => updateLineCount(originalCodeEl, originalLinesEl));
        modifiedCodeEl.addEventListener('input', () => updateLineCount(modifiedCodeEl, modifiedLinesEl));
        
        // Custom select dropdown
        themeSelectTrigger.addEventListener('click', () => {
            themeSelectWrapper.classList.toggle('open');
        });

        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const selectedValue = option.getAttribute('data-value');
                const selectedText = option.textContent;
                
                themeSelectTrigger.querySelector('span').textContent = selectedText;
                prismThemeLink.href = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/${selectedValue}.min.css`;
                
                themeOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                themeSelectWrapper.classList.remove('open');
            });
        });

        // View mode toggle
        viewModeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                state.viewMode = btn.getAttribute('data-mode');
                viewModeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                comparisonContainer.className = state.viewMode;
                runComparison(); // Re-run comparison on view change
            });
        });
        
        // Plugin Toggles
        lineNumbersToggle.addEventListener('change', (e) => {
            state.lineNumbers = e.target.checked;
            runComparison();
        });
        copyBtnToggle.addEventListener('change', (e) => {
            state.copyButton = e.target.checked;
            runComparison();
        });

        // Close dropdown when clicking outside
        window.addEventListener('click', (e) => {
            if (!themeSelectWrapper.contains(e.target)) {
                themeSelectWrapper.classList.remove('open');
            }
        });
    }

    // --- Core Functions ---
    function runComparison() {
        const originalText = originalCodeEl.value;
        const modifiedText = modifiedCodeEl.value;

        // Ensure textareas are visible if no input
        if (!originalText && !modifiedText) return;
        
        // Temporarily replace textareas with <pre> for highlighting
        replaceTextareaWithPre(originalCodeEl);
        replaceTextareaWithPre(modifiedCodeEl);

        if (state.viewMode === 'side-by-side') {
            renderSideBySide(originalText, modifiedText);
        } else {
            renderInline(originalText, modifiedText);
        }
        
        Prism.highlightAll();
        
        if (state.viewMode === 'side-by-side') {
            syncScrolls();
        }
    }

    function renderSideBySide(text1, text2) {
        const diffs = dmp.diff_main(text1, text2);
        dmp.diff_cleanupSemantic(diffs);

        const originalPre = document.getElementById('original-code-pre');
        const modifiedPre = document.getElementById('modified-code-pre');

        const { originalHtml, modifiedHtml } = generateSideBySideHtml(diffs);
        
        originalPre.innerHTML = `<code class="language-js">${originalHtml}</code>`;
        modifiedPre.innerHTML = `<code class="language-js">${modifiedHtml}</code>`;
        
        applyPlugins(originalPre, modifiedPre);
    }
    
    function renderInline(text1, text2) {
        const diffs = dmp.diff_main(text1, text2);
        dmp.diff_cleanupSemantic(diffs);
        
        const lines = dmp.diff_linesToChars_(text1, text2);
        const lineDiffs = dmp.diff_main(lines.chars1, lines.chars2, false);
        dmp.diff_charsToLines_(lineDiffs, lines.lineArray);
        
        let html = '';
        let added = 0;
        let removed = 0;

        for (const diff of lineDiffs) {
            const type = diff[0]; // 1 for insert, -1 for delete, 0 for equal
            const data = diff[1];
            const lines = data.split('\n').filter(Boolean);

            for (const line of lines) {
                const escapedLine = escapeHtml(line);
                if (type === 1) {
                    html += `<span class="token inserted-sign inserted">+ ${escapedLine}</span>\n`;
                    added++;
                } else if (type === -1) {
                    html += `<span class="token deleted-sign deleted">- ${escapedLine}</span>\n`;
                    removed++;
                } else {
                    html += `  ${escapedLine}\n`;
                }
            }
        }

        inlineOutputEl.querySelector('code').innerHTML = html;
        
        // Update stats
        const statsEl = document.getElementById('inline-stats');
        statsEl.innerHTML = `
            <span id="stats-added">+${added}</span>
            <span id="stats-removed">-${removed}</span>
        `;
        
        applyPlugins(inlineOutputEl);
    }

    function generateSideBySideHtml(diffs) {
        let originalHtml = '';
        let modifiedHtml = '';
    
        diffs.forEach(([op, data]) => {
            const escapedData = escapeHtml(data);
            switch (op) {
                case 1: // Insertion
                    modifiedHtml += `<span class="token inserted">${escapedData}</span>`;
                    break;
                case -1: // Deletion
                    originalHtml += `<span class="token deleted">${escapedData}</span>`;
                    break;
                case 0: // Equal
                    originalHtml += escapedData;
                    modifiedHtml += escapedData;
                    break;
            }
        });
        return { originalHtml, modifiedHtml };
    }
    
    function applyPlugins(...elements) {
        elements.forEach(el => {
            if (!el) return;
            // Line Numbers
            if (state.lineNumbers) {
                el.classList.add('line-numbers');
            } else {
                el.classList.remove('line-numbers');
            }
            // Copy Button - Prism adds a div wrapper if this is enabled
             if (state.copyButton) {
                if (!el.parentElement.classList.contains('code-toolbar')) {
                    const toolbar = document.createElement('div');
                    toolbar.className = 'code-toolbar';
                    el.parentElement.insertBefore(toolbar, el);
                    toolbar.appendChild(el);
                }
            } else {
                // This part is tricky as Prism's plugin is aggressive.
                // A full solution would require removing the toolbar, but for now we hide it.
                 const toolbar = el.closest('.code-toolbar');
                 if (toolbar) {
                     const button = toolbar.querySelector('.copy-to-clipboard-button');
                     if(button) button.style.display = 'none';
                 }
            }
        });
    }

    // --- Utility Functions ---
    function setupInitialCode() {
        originalCodeEl.value = `function fibonacci(n) {
    if (n <= 1) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}`;
        modifiedCodeEl.value = `function fibonacci(n, memo = {}) {
    if (n in memo) {
        return memo[n];
    }
    if (n <= 1) {
        return n;
    }
    memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
    return memo[n];
}`;
        updateLineCount(originalCodeEl, originalLinesEl);
        updateLineCount(modifiedCodeEl, modifiedLinesEl);
    }

    function updateLineCount(element, display) {
        const lines = element.value.split('\n').length;
        display.textContent = `Lines: ${lines}`;
    }

    function escapeHtml(text) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    
    function replaceTextareaWithPre(textarea) {
        const preExists = document.getElementById(textarea.id + '-pre');
        if (preExists) preExists.remove();

        const pre = document.createElement('pre');
        pre.id = textarea.id + '-pre';
        textarea.style.display = 'none';
        textarea.parentElement.appendChild(pre);
        return pre;
    }
    
    function syncScrolls() {
        const pre1 = document.getElementById('original-code-pre');
        const pre2 = document.getElementById('modified-code-pre');
        if (!pre1 || !pre2) return;
        
        let isSyncing = false;
        
        const sync = (source, target) => {
            if (isSyncing) return;
            isSyncing = true;
            target.scrollTop = source.scrollTop;
            target.scrollLeft = source.scrollLeft;
            setTimeout(() => { isSyncing = false; }, 50); // Prevent infinite loop
        };

        pre1.addEventListener('scroll', () => sync(pre1, pre2));
        pre2.addEventListener('scroll', () => sync(pre2, pre1));
    }
});
