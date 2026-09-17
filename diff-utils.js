(function (root) {
    const MAX_CELLS = 4_000_000;

    function toLines(text) {
        if (text === '') return [];
        const normalized = text.endsWith('\n') ? text.slice(0, -1) : text;
        return normalized.split('\n');
    }

    function diffArrays(a, b, maxCells) {
        const n = a.length;
        const m = b.length;

        if (n * m > maxCells) {
            return [
                ...a.map(item => ({ type: 'removed', value: item.value })),
                ...b.map(item => ({ type: 'added', value: item.value }))
            ];
        }

        const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
        for (let i = n - 1; i >= 0; i--) {
            for (let j = m - 1; j >= 0; j--) {
                dp[i][j] = a[i].key === b[j].key
                    ? dp[i + 1][j + 1] + 1
                    : Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }

        const result = [];
        let i = 0;
        let j = 0;
        while (i < n && j < m) {
            if (a[i].key === b[j].key) {
                result.push({ type: 'unchanged', value: a[i].value });
                i++; j++;
            } else if (dp[i + 1][j] >= dp[i][j + 1]) {
                result.push({ type: 'removed', value: a[i].value });
                i++;
            } else {
                result.push({ type: 'added', value: b[j].value });
                j++;
            }
        }
        while (i < n) { result.push({ type: 'removed', value: a[i].value }); i++; }
        while (j < m) { result.push({ type: 'added', value: b[j].value }); j++; }

        return result;
    }

    function toKeyValue(items, keyFn) {
        return items.map(value => ({ key: keyFn ? keyFn(value) : value, value }));
    }

    function computeLineDiff(text1, text2, options) {
        const ignoreCase = !!(options && options.ignoreCase);
        const keyFn = ignoreCase ? line => line.toLowerCase() : null;
        const linesA = toKeyValue(toLines(text1), keyFn);
        const linesB = toKeyValue(toLines(text2), keyFn);

        if (linesA.length * linesB.length > MAX_CELLS) {
            console.warn('CodeCompareDiff: input too large for a precise diff, falling back to a coarse diff.');
        }

        return diffArrays(linesA, linesB, MAX_CELLS).map(({ type, value }) => ({ type, line: value }));
    }

    const MAX_WORD_CELLS = 200_000;

    function tokenizeLine(line) {
        return line.match(/[\p{L}\p{N}_]+|\s+|[^\s\p{L}\p{N}_]/gu) || [];
    }

    function computeWordDiff(lineA, lineB) {
        const tokensA = toKeyValue(tokenizeLine(lineA));
        const tokensB = toKeyValue(tokenizeLine(lineB));
        return diffArrays(tokensA, tokensB, MAX_WORD_CELLS);
    }

    function formatDiffText(diffEntries) {
        return diffEntries.map(({ type, line }) => {
            const prefix = type === 'added' ? '+' : type === 'removed' ? '-' : ' ';
            return `${prefix} ${line}`;
        }).join('\n');
    }

    function computeStats(diffEntries) {
        let added = 0;
        let removed = 0;
        let unchanged = 0;
        diffEntries.forEach(({ type }) => {
            if (type === 'added') added++;
            else if (type === 'removed') removed++;
            else unchanged++;
        });
        const total = added + removed + unchanged;
        const similarity = total === 0 ? 100 : Math.round((unchanged / total) * 100);
        return { added, removed, unchanged, total, similarity };
    }

    function applyIgnoreBlankLines(diffEntries) {
        return diffEntries.map(entry => {
            if ((entry.type === 'added' || entry.type === 'removed') && entry.line.trim() === '') {
                return { type: 'unchanged', line: entry.line };
            }
            return entry;
        });
    }

    function detectMovedBlocks(diffEntries, minSingleLineLength) {
        const threshold = typeof minSingleLineLength === 'number' ? minSingleLineLength : 20;
        const blocks = [];
        let i = 0;
        while (i < diffEntries.length) {
            const type = diffEntries[i].type;
            if (type === 'added' || type === 'removed') {
                let j = i;
                while (j < diffEntries.length && diffEntries[j].type === type) j++;
                blocks.push({ type, start: i, end: j, lines: diffEntries.slice(i, j).map(e => e.line) });
                i = j;
            } else {
                i++;
            }
        }

        const signature = lines => lines.map(l => l.trim()).join('\n');
        const addedBySig = new Map();
        blocks.filter(b => b.type === 'added').forEach(b => {
            const sig = signature(b.lines);
            if (!addedBySig.has(sig)) addedBySig.set(sig, []);
            addedBySig.get(sig).push(b);
        });

        const result = diffEntries.map(e => ({ ...e }));
        blocks.filter(b => b.type === 'removed').forEach(rb => {
            const sig = signature(rb.lines);
            if (sig.trim() === '') return;
            const eligible = rb.lines.length >= 2 || sig.length >= threshold;
            if (!eligible) return;
            const matches = addedBySig.get(sig);
            if (matches && matches.length > 0) {
                const ab = matches.shift();
                for (let k = rb.start; k < rb.end; k++) result[k].moved = true;
                for (let k = ab.start; k < ab.end; k++) result[k].moved = true;
            }
        });
        return result;
    }

    function buildSideBySideRows(diffEntries) {
        const rows = [];
        let removedBuffer = [];
        let addedBuffer = [];

        function flushBuffer() {
            const max = Math.max(removedBuffer.length, addedBuffer.length);
            for (let k = 0; k < max; k++) {
                rows.push({
                    left: k < removedBuffer.length ? { type: 'removed', line: removedBuffer[k].line, moved: removedBuffer[k].moved } : { type: 'empty', line: '' },
                    right: k < addedBuffer.length ? { type: 'added', line: addedBuffer[k].line, moved: addedBuffer[k].moved } : { type: 'empty', line: '' }
                });
            }
            removedBuffer = [];
            addedBuffer = [];
        }

        diffEntries.forEach(entry => {
            if (entry.type === 'removed') {
                removedBuffer.push(entry);
            } else if (entry.type === 'added') {
                addedBuffer.push(entry);
            } else {
                flushBuffer();
                rows.push({
                    left: { type: 'unchanged', line: entry.line },
                    right: { type: 'unchanged', line: entry.line }
                });
            }
        });
        flushBuffer();

        return rows;
    }

    function foldRuns(items, isCollapsible, options) {
        const context = (options && options.context) || 3;
        const minRun = (options && options.minRun) || 8;
        const result = [];
        let i = 0;

        while (i < items.length) {
            if (!isCollapsible(items[i])) {
                result.push({ kind: 'item', item: items[i] });
                i++;
                continue;
            }

            let j = i;
            while (j < items.length && isCollapsible(items[j])) j++;
            const runLength = j - i;
            const hiddenLength = runLength - 2 * context;

            if (runLength < minRun || hiddenLength <= 0) {
                for (let k = i; k < j; k++) result.push({ kind: 'item', item: items[k] });
            } else {
                for (let k = i; k < i + context; k++) result.push({ kind: 'item', item: items[k] });
                result.push({ kind: 'collapsed', items: items.slice(i + context, j - context) });
                for (let k = j - context; k < j; k++) result.push({ kind: 'item', item: items[k] });
            }
            i = j;
        }

        return result;
    }

    function applyIgnoreRules(text, patterns, mode) {
        const regexes = [];
        const errors = [];

        (patterns || []).forEach(patternSource => {
            const trimmed = (patternSource || '').trim();
            if (!trimmed) return;
            try {
                regexes.push(new RegExp(trimmed, 'g'));
            } catch (err) {
                errors.push({ pattern: trimmed, error: err.message });
            }
        });

        if (regexes.length === 0) return { text, errors };

        if (mode === 'removeLines') {
            const lines = toLines(text);
            const kept = lines.filter(line => !regexes.some(re => {
                re.lastIndex = 0;
                return re.test(line);
            }));
            return { text: kept.join('\n'), errors };
        }

        let result = text;
        regexes.forEach(re => {
            re.lastIndex = 0;
            result = result.replace(re, '');
        });
        return { text: result, errors };
    }

    const api = {
        computeLineDiff, formatDiffText, computeStats, buildSideBySideRows,
        computeWordDiff, foldRuns, applyIgnoreRules, applyIgnoreBlankLines, detectMovedBlocks
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.CodeCompareDiff = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
