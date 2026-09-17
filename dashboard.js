(function () {
    var STORAGE_KEY = 'codecompare_history_v1';
    var MAX_HISTORY = 30;

    var sidebarLinks = document.querySelectorAll('.sidebar-link');
    var appViews = document.querySelectorAll('.app-view');
    var viewTitleEl = document.getElementById('view-title');
    var sidebarEl = document.getElementById('app-sidebar');
    var sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    var sidebarBackdrop = document.getElementById('sidebar-backdrop');
    var historyListEl = document.getElementById('history-list');
    var historyEmptyEl = document.getElementById('history-empty');
    var clearHistoryBtn = document.getElementById('clear-history-btn');
    var exportHistoryBtn = document.getElementById('export-history-btn');
    var importHistoryBtn = document.getElementById('import-history-btn');
    var importHistoryInput = document.getElementById('import-history-input');
    var resetDataBtn = document.getElementById('reset-data-btn');
    var statTotalEl = document.getElementById('stat-total');
    var statAddedEl = document.getElementById('stat-added');
    var statRemovedEl = document.getElementById('stat-removed');
    var statLanguageEl = document.getElementById('stat-language');
    var statSimilarityEl = document.getElementById('stat-similarity');
    var originalCodeEl = document.getElementById('original-code');
    var modifiedCodeEl = document.getElementById('modified-code');
    var compareBtn = document.getElementById('compare-btn');

    function loadHistory() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    function saveHistory(list) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch {}
    }

    function formatTime(ts) {
        try {
            return new Date(ts).toLocaleString();
        } catch {
            return '';
        }
    }

    function isFa() {
        return document.documentElement.lang === 'fa';
    }

    function renderStats(list) {
        var totalAdded = 0;
        var totalRemoved = 0;
        var similaritySum = 0;
        var similarityCount = 0;
        var langCount = {};
        list.forEach(function (entry) {
            totalAdded += entry.added || 0;
            totalRemoved += entry.removed || 0;
            if (typeof entry.similarity === 'number') {
                similaritySum += entry.similarity;
                similarityCount++;
            }
            if (entry.language) {
                langCount[entry.language] = (langCount[entry.language] || 0) + 1;
            }
        });
        var topLang = '\u2013';
        var topCount = 0;
        Object.keys(langCount).forEach(function (lang) {
            if (langCount[lang] > topCount) {
                topCount = langCount[lang];
                topLang = lang;
            }
        });
        if (statTotalEl) statTotalEl.textContent = String(list.length);
        if (statAddedEl) statAddedEl.textContent = String(totalAdded);
        if (statRemovedEl) statRemovedEl.textContent = String(totalRemoved);
        if (statLanguageEl) statLanguageEl.textContent = topLang;
        if (statSimilarityEl) {
            statSimilarityEl.textContent = similarityCount === 0
                ? '\u2013'
                : Math.round(similaritySum / similarityCount) + '%';
        }
    }

    function restoreEntry(entry) {
        if (originalCodeEl) {
            originalCodeEl.value = entry.originalSnippet || '';
            originalCodeEl.dispatchEvent(new Event('input'));
        }
        if (modifiedCodeEl) {
            modifiedCodeEl.value = entry.modifiedSnippet || '';
            modifiedCodeEl.dispatchEvent(new Event('input'));
        }
        switchView('compare');
        if (compareBtn) compareBtn.click();
    }

    function deleteEntry(id) {
        var list = loadHistory().filter(function (e) {
            return e.id !== id;
        });
        saveHistory(list);
        renderHistory();
    }

    function renderHistory() {
        var list = loadHistory();
        renderStats(list);
        if (!historyListEl) return;
        historyListEl.innerHTML = '';
        if (list.length === 0) {
            if (historyEmptyEl) historyEmptyEl.style.display = 'block';
            return;
        }
        if (historyEmptyEl) historyEmptyEl.style.display = 'none';
        list.slice().reverse().forEach(function (entry) {
            var item = document.createElement('div');
            item.className = 'history-item';

            var meta = document.createElement('div');
            meta.className = 'history-item-meta';

            var lang = document.createElement('span');
            lang.className = 'history-item-lang';
            lang.textContent = entry.language || 'text';

            var time = document.createElement('span');
            time.className = 'history-item-time';
            time.textContent = formatTime(entry.timestamp);

            var stats = document.createElement('span');
            stats.className = 'history-item-stats';
            stats.textContent = '+' + (entry.added || 0) + ' / -' + (entry.removed || 0);

            var similarity = document.createElement('span');
            similarity.className = 'history-item-similarity';
            similarity.textContent = typeof entry.similarity === 'number' ? entry.similarity + '%' : '\u2013';

            meta.appendChild(lang);
            meta.appendChild(time);
            meta.appendChild(stats);
            meta.appendChild(similarity);

            var actions = document.createElement('div');
            actions.className = 'history-item-actions';

            var restoreBtn = document.createElement('button');
            restoreBtn.type = 'button';
            restoreBtn.className = 'compare-button secondary-button';
            restoreBtn.textContent = isFa() ? 'بازیابی' : 'Restore';
            restoreBtn.addEventListener('click', function () {
                restoreEntry(entry);
            });

            var deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'compare-button secondary-button';
            deleteBtn.textContent = isFa() ? 'حذف' : 'Delete';
            deleteBtn.addEventListener('click', function () {
                deleteEntry(entry.id);
            });

            actions.appendChild(restoreBtn);
            actions.appendChild(deleteBtn);

            item.appendChild(meta);
            item.appendChild(actions);
            historyListEl.appendChild(item);
        });
    }

    function recordRun(entry) {
        var list = loadHistory();
        list.push({
            id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
            timestamp: Date.now(),
            language: entry.language,
            added: entry.added,
            removed: entry.removed,
            similarity: entry.similarity,
            originalSnippet: entry.originalSnippet,
            modifiedSnippet: entry.modifiedSnippet
        });
        if (list.length > MAX_HISTORY) {
            list = list.slice(list.length - MAX_HISTORY);
        }
        saveHistory(list);
        renderHistory();
    }

    function switchView(viewName) {
        sidebarLinks.forEach(function (link) {
            link.classList.toggle('is-active', link.dataset.view === viewName);
        });
        appViews.forEach(function (view) {
            view.classList.toggle('is-active', view.id === 'view-' + viewName);
        });
        var activeLink = document.querySelector('.sidebar-link[data-view="' + viewName + '"]');
        if (activeLink && viewTitleEl) {
            var labelSpan = activeLink.querySelector('span[data-i18n]');
            if (labelSpan) {
                viewTitleEl.textContent = labelSpan.textContent;
                viewTitleEl.dataset.i18n = labelSpan.dataset.i18n;
            }
        }
        closeSidebarOnMobile();
    }

    function openSidebar() {
        if (sidebarEl) sidebarEl.classList.add('is-open');
        if (sidebarBackdrop) sidebarBackdrop.classList.add('is-visible');
        if (sidebarToggleBtn) sidebarToggleBtn.setAttribute('aria-expanded', 'true');
    }

    function closeSidebarOnMobile() {
        if (sidebarEl) sidebarEl.classList.remove('is-open');
        if (sidebarBackdrop) sidebarBackdrop.classList.remove('is-visible');
        if (sidebarToggleBtn) sidebarToggleBtn.setAttribute('aria-expanded', 'false');
    }

    sidebarLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            switchView(link.dataset.view);
        });
    });

    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', function () {
            if (sidebarEl && sidebarEl.classList.contains('is-open')) {
                closeSidebarOnMobile();
            } else {
                openSidebar();
            }
        });
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', closeSidebarOnMobile);
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', function () {
            saveHistory([]);
            renderHistory();
        });
    }

    function flashLabel(button, text, duration) {
        if (!button) return;
        var original = button.textContent;
        button.textContent = text;
        setTimeout(function () {
            button.textContent = original;
        }, duration || 1600);
    }

    if (exportHistoryBtn) {
        exportHistoryBtn.addEventListener('click', function () {
            var list = loadHistory();
            var blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var link = document.createElement('a');
            link.href = url;
            link.download = 'codecompare-history.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }

    if (importHistoryBtn && importHistoryInput) {
        importHistoryBtn.addEventListener('click', function () {
            importHistoryInput.click();
        });
        importHistoryInput.addEventListener('change', function () {
            var file = importHistoryInput.files && importHistoryInput.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function () {
                try {
                    var imported = JSON.parse(String(reader.result));
                    if (!Array.isArray(imported)) throw new Error('not an array');
                    var existing = loadHistory();
                    var existingIds = {};
                    existing.forEach(function (e) { existingIds[e.id] = true; });
                    var merged = existing.concat(imported.filter(function (e) {
                        return e && typeof e === 'object' && !existingIds[e.id];
                    }));
                    if (merged.length > MAX_HISTORY) {
                        merged = merged.slice(merged.length - MAX_HISTORY);
                    }
                    saveHistory(merged);
                    renderHistory();
                    flashLabel(importHistoryBtn, isFa() ? '!بارگذاری شد' : 'Imported!');
                } catch {
                    flashLabel(importHistoryBtn, isFa() ? 'بارگذاری ناموفق بود' : 'Import failed');
                }
                importHistoryInput.value = '';
            };
            reader.readAsText(file);
        });
    }

    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', function () {
            var confirmMsg = isFa()
                ? 'این کار تمام تنظیمات ذخیره‌شده و تاریخچه مقایسه‌ها را پاک می‌کند. ادامه می‌دهید؟'
                : 'This will clear all saved settings and comparison history. Continue?';
            if (window.confirm(confirmMsg)) {
                localStorage.clear();
                location.reload();
            }
        });
    }

    var batchOriginalInput = document.getElementById('batch-original-input');
    var batchModifiedInput = document.getElementById('batch-modified-input');
    var batchOriginalList = document.getElementById('batch-original-list');
    var batchModifiedList = document.getElementById('batch-modified-list');
    var batchRunBtn = document.getElementById('batch-run-btn');
    var batchResultsEl = document.getElementById('batch-results');
    var batchOriginalFiles = [];
    var batchModifiedFiles = [];

    function renderFileList(container, files) {
        if (!container) return;
        container.innerHTML = '';
        files.forEach(function (f) {
            var row = document.createElement('div');
            row.className = 'batch-file-row';
            row.textContent = f.name;
            container.appendChild(row);
        });
    }

    if (batchOriginalInput) {
        batchOriginalInput.addEventListener('change', function () {
            batchOriginalFiles = Array.prototype.slice.call(batchOriginalInput.files);
            renderFileList(batchOriginalList, batchOriginalFiles);
        });
    }
    if (batchModifiedInput) {
        batchModifiedInput.addEventListener('change', function () {
            batchModifiedFiles = Array.prototype.slice.call(batchModifiedInput.files);
            renderFileList(batchModifiedList, batchModifiedFiles);
        });
    }

    function readFileAsText(file) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () {
                resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    function openInCompareView(originalText, modifiedText) {
        var originalCodeEl = document.getElementById('original-code');
        var modifiedCodeEl = document.getElementById('modified-code');
        var runBtn = document.getElementById('compare-btn');
        if (originalCodeEl) {
            originalCodeEl.value = originalText;
            originalCodeEl.dispatchEvent(new Event('input'));
        }
        if (modifiedCodeEl) {
            modifiedCodeEl.value = modifiedText;
            modifiedCodeEl.dispatchEvent(new Event('input'));
        }
        switchView('compare');
        if (runBtn) runBtn.click();
    }

    function renderBatchResults(results) {
        batchResultsEl.innerHTML = '';
        if (results.length === 0) return;
        var table = document.createElement('table');
        table.className = 'batch-table';
        var thead = document.createElement('thead');
        thead.innerHTML = '<tr><th>' + (isFa() ? 'فایل' : 'File') + '</th><th>+</th><th>-</th><th>' +
            (isFa() ? 'شباهت' : 'Similarity') + '</th><th></th></tr>';
        table.appendChild(thead);
        var tbody = document.createElement('tbody');
        results.forEach(function (r) {
            var tr = document.createElement('tr');
            tr.className = 'batch-row batch-row-' + r.status;

            var nameTd = document.createElement('td');
            nameTd.textContent = r.name;

            var addedTd = document.createElement('td');
            addedTd.textContent = r.status === 'added' ? (isFa() ? 'فایل جدید' : 'new file') : String(r.added);

            var removedTd = document.createElement('td');
            removedTd.textContent = r.status === 'removed' ? (isFa() ? 'فایل حذف‌شده' : 'deleted file') : String(r.removed);

            var simTd = document.createElement('td');
            simTd.textContent = (r.status === 'changed' || r.status === 'identical') ? r.similarity + '%' : '\u2013';

            var actionTd = document.createElement('td');
            if (r.status === 'changed' || r.status === 'identical') {
                var openBtn = document.createElement('button');
                openBtn.type = 'button';
                openBtn.className = 'compare-button secondary-button';
                openBtn.textContent = isFa() ? 'باز کردن' : 'Open';
                openBtn.addEventListener('click', function () {
                    openInCompareView(r.originalText, r.modifiedText);
                });
                actionTd.appendChild(openBtn);
            }

            tr.appendChild(nameTd);
            tr.appendChild(addedTd);
            tr.appendChild(removedTd);
            tr.appendChild(simTd);
            tr.appendChild(actionTd);
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        batchResultsEl.appendChild(table);
    }

    function runBatchCompare() {
        if (!window.CodeCompareDiff || !batchResultsEl) return;
        if (batchOriginalFiles.length === 0 && batchModifiedFiles.length === 0) return;

        var originalMap = {};
        batchOriginalFiles.forEach(function (f) {
            originalMap[f.name] = f;
        });
        var modifiedMap = {};
        batchModifiedFiles.forEach(function (f) {
            modifiedMap[f.name] = f;
        });

        var allNames = [];
        Object.keys(originalMap).forEach(function (n) {
            if (allNames.indexOf(n) === -1) allNames.push(n);
        });
        Object.keys(modifiedMap).forEach(function (n) {
            if (allNames.indexOf(n) === -1) allNames.push(n);
        });
        allNames.sort();

        batchResultsEl.innerHTML = '<p class="batch-loading">' + (isFa() ? 'در حال پردازش\u2026' : 'Processing\u2026') + '</p>';

        Promise.all(allNames.map(function (name) {
            var origFile = originalMap[name];
            var modFile = modifiedMap[name];
            var origPromise = origFile ? readFileAsText(origFile) : Promise.resolve(null);
            var modPromise = modFile ? readFileAsText(modFile) : Promise.resolve(null);
            return Promise.all([origPromise, modPromise]).then(function (values) {
                var originalText = values[0];
                var modifiedText = values[1];
                if (originalText === null) {
                    return { name: name, status: 'added', added: (modifiedText || '').split('\n').length, removed: 0, similarity: 0 };
                }
                if (modifiedText === null) {
                    return { name: name, status: 'removed', added: 0, removed: (originalText || '').split('\n').length, similarity: 0 };
                }
                var entries = window.CodeCompareDiff.computeLineDiff(originalText, modifiedText, {});
                var stats = window.CodeCompareDiff.computeStats(entries);
                var status = (stats.added === 0 && stats.removed === 0) ? 'identical' : 'changed';
                return {
                    name: name,
                    status: status,
                    added: stats.added,
                    removed: stats.removed,
                    similarity: stats.similarity,
                    originalText: originalText,
                    modifiedText: modifiedText
                };
            });
        })).then(function (results) {
            renderBatchResults(results);
        });
    }

    if (batchRunBtn) {
        batchRunBtn.addEventListener('click', runBatchCompare);
    }

    window.CodeCompareDashboard = {
        recordRun: recordRun
    };

    renderHistory();
})();
