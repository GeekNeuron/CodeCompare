/**
 * CodeCompareDiff - a small, dependency-free line-based diff utility.
 *
 * Exposed as `window.CodeCompareDiff` in the browser and as a CommonJS module
 * in Node (so the same code can be unit-tested with Jest without needing a DOM
 * or any external diff library).
 */
(function (root) {
    // Guard against pathological O(n*m) time/memory on very large inputs.
    // Above this many line1*line2 cells we fall back to a coarse "everything
    // changed" diff instead of freezing the tab.
    const MAX_CELLS = 4_000_000;

    /**
     * Split text into lines the way a human comparing files would expect:
     * a single trailing newline does not create a phantom empty last line,
     * but intentional blank lines elsewhere in the text are preserved.
     */
    function toLines(text) {
        if (text === '') return [];
        const normalized = text.endsWith('\n') ? text.slice(0, -1) : text;
        return normalized.split('\n');
    }

    /**
     * Generic LCS (longest common subsequence) diff over two arrays of
     * {key, value} items, comparing by `key` but returning the original
     * `value`. This lets callers diff by a normalized key (e.g. lowercased,
     * for case-insensitive comparison) while still displaying the original
     * text. This is the core algorithm shared by the line-level and
     * word-level diffs.
     *
     * @returns {Array<{type: 'added'|'removed'|'unchanged', value: *}>}
     */
    function diffArrays(a, b, maxCells) {
        const n = a.length;
        const m = b.length;

        if (n * m > maxCells) {
            return [
                ...a.map(item => ({ type: 'removed', value: item.value })),
                ...b.map(item => ({ type: 'added', value: item.value }))
            ];
        }

        // dp[i][j] = length of the LCS of a[i..] and b[j..]
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
                // Keep side A's original value on a "match" so the diff mirrors
                // what the user typed on the original side when only the
                // comparison key (e.g. case) differs.
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

    /**
     * Computes a line-by-line diff between two strings using an LCS
     * (longest common subsequence) dynamic-programming table.
     *
     * @param {string} text1
     * @param {string} text2
     * @param {{ignoreCase?: boolean}} [options]
     * @returns {Array<{type: 'added'|'removed'|'unchanged', line: string}>}
     */
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

    // Word-level diffs operate on much shorter arrays (tokens within a single
    // line), so a far smaller cell budget is already generous; this just
    // guards against pathological single lines (e.g. a multi-megabyte minified
    // line) blowing up the DP table.
    const MAX_WORD_CELLS = 200_000;

    /**
     * Splits a line into word-diff tokens: runs of word characters, runs of
     * whitespace, and individual punctuation/symbol characters. Concatenating
     * the tokens reproduces the original line exactly.
     */
    function tokenizeLine(line) {
        return line.match(/\w+|\s+|[^\s\w]/g) || [];
    }

    /**
     * Computes a word-level diff between two (usually short, single-line)
     * strings, for highlighting exactly what changed within a modified line
     * rather than marking the whole line as changed.
     *
     * @returns {Array<{type: 'added'|'removed'|'unchanged', value: string}>}
     */
    function computeWordDiff(lineA, lineB) {
        const tokensA = toKeyValue(tokenizeLine(lineA));
        const tokensB = toKeyValue(tokenizeLine(lineB));
        return diffArrays(tokensA, tokensB, MAX_WORD_CELLS);
    }

    /** Renders diff entries as `+`/`-`/` ` prefixed lines (simple diff format). */
    function formatDiffText(diffEntries) {
        return diffEntries.map(({ type, line }) => {
            const prefix = type === 'added' ? '+' : type === 'removed' ? '-' : ' ';
            return `${prefix} ${line}`;
        }).join('\n');
    }

    /** Counts added/removed lines from diff entries. */
    function computeStats(diffEntries) {
        let added = 0;
        let removed = 0;
        diffEntries.forEach(({ type }) => {
            if (type === 'added') added++;
            if (type === 'removed') removed++;
        });
        return { added, removed };
    }

    /**
     * Groups diff entries into aligned left/right rows for a side-by-side view.
     * Consecutive removed/added lines between two unchanged lines are paired up
     * index-by-index (like GitHub's split diff), padding the shorter side with
     * an 'empty' placeholder so both columns stay the same length and in sync.
     *
     * @returns {Array<{left: {type, line}, right: {type, line}}>}
     */
    function buildSideBySideRows(diffEntries) {
        const rows = [];
        let removedBuffer = [];
        let addedBuffer = [];

        function flushBuffer() {
            const max = Math.max(removedBuffer.length, addedBuffer.length);
            for (let k = 0; k < max; k++) {
                rows.push({
                    left: k < removedBuffer.length ? { type: 'removed', line: removedBuffer[k] } : { type: 'empty', line: '' },
                    right: k < addedBuffer.length ? { type: 'added', line: addedBuffer[k] } : { type: 'empty', line: '' }
                });
            }
            removedBuffer = [];
            addedBuffer = [];
        }

        diffEntries.forEach(entry => {
            if (entry.type === 'removed') {
                removedBuffer.push(entry.line);
            } else if (entry.type === 'added') {
                addedBuffer.push(entry.line);
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

    /**
     * Collapses long runs of "unchanged" items into a single placeholder,
     * keeping a few lines of context visible on each side - the same idea
     * as GitHub folding unchanged hunks in a diff. Works on any list (flat
     * line-diff entries, or side-by-side rows) via an injected predicate, so
     * both the Unified and Split renderers can reuse it.
     *
     * @param {Array} items
     * @param {(item: *) => boolean} isCollapsible
     * @param {{context?: number, minRun?: number}} [options]
     * @returns {Array<{kind: 'item', item: *} | {kind: 'collapsed', items: Array}>}
     */
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

    /**
     * Applies user-supplied regex ignore rules to a text before diffing, so
     * things like timestamps, TODO comments, or log-level prefixes don't
     * show up as noise in the diff. Invalid patterns are reported rather
     * than thrown, so one bad regex doesn't block the valid ones.
     *
     * @param {string} text
     * @param {string[]} patterns - regex source strings (no slashes/flags)
     * @param {'removeLines'|'stripMatches'} mode
     * @returns {{text: string, errors: Array<{pattern: string, error: string}>}}
     */
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
        computeWordDiff, foldRuns, applyIgnoreRules
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.CodeCompareDiff = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
