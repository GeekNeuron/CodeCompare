const { computeLineDiff, formatDiffText, computeStats, buildSideBySideRows, computeWordDiff, foldRuns, applyIgnoreRules } = require('../diff-utils.js');

describe('computeLineDiff', () => {
    test('identical texts produce only unchanged lines', () => {
        const diff = computeLineDiff('a\nb\nc', 'a\nb\nc');
        expect(diff.every(d => d.type === 'unchanged')).toBe(true);
        expect(diff.map(d => d.line)).toEqual(['a', 'b', 'c']);
    });

    test('completely different single lines are one removal and one addition', () => {
        const diff = computeLineDiff('foo', 'bar');
        expect(diff).toEqual([
            { type: 'removed', line: 'foo' },
            { type: 'added', line: 'bar' }
        ]);
    });

    test('pure addition: original is a prefix of modified', () => {
        const diff = computeLineDiff('a\nb', 'a\nb\nc');
        expect(diff).toEqual([
            { type: 'unchanged', line: 'a' },
            { type: 'unchanged', line: 'b' },
            { type: 'added', line: 'c' }
        ]);
    });

    test('pure removal: modified is a prefix of original', () => {
        const diff = computeLineDiff('a\nb\nc', 'a\nb');
        expect(diff).toEqual([
            { type: 'unchanged', line: 'a' },
            { type: 'unchanged', line: 'b' },
            { type: 'removed', line: 'c' }
        ]);
    });

    test('change in the middle of a multi-line block', () => {
        const diff = computeLineDiff('one\ntwo\nthree', 'one\nTWO\nthree');
        expect(diff).toEqual([
            { type: 'unchanged', line: 'one' },
            { type: 'removed', line: 'two' },
            { type: 'added', line: 'TWO' },
            { type: 'unchanged', line: 'three' }
        ]);
    });

    test('one side empty: everything is an addition', () => {
        const diff = computeLineDiff('', 'a\nb');
        expect(diff).toEqual([
            { type: 'added', line: 'a' },
            { type: 'added', line: 'b' }
        ]);
    });

    test('both sides empty produce an empty diff', () => {
        expect(computeLineDiff('', '')).toEqual([]);
    });

    test('a single trailing newline does not create a phantom empty line', () => {
        const diff = computeLineDiff('a\nb\n', 'a\nb');
        expect(diff.every(d => d.type === 'unchanged')).toBe(true);
        expect(diff).toHaveLength(2);
    });

    test('an intentional blank line in the middle is preserved, not silently dropped', () => {
        const diff = computeLineDiff('a\n\nb', 'a\nb');
        expect(diff).toEqual([
            { type: 'unchanged', line: 'a' },
            { type: 'removed', line: '' },
            { type: 'unchanged', line: 'b' }
        ]);
    });
});

describe('computeLineDiff with ignoreCase', () => {
    test('lines differing only in case are treated as unchanged', () => {
        const diff = computeLineDiff('Hello\nWorld', 'hello\nworld', { ignoreCase: true });
        expect(diff.every(d => d.type === 'unchanged')).toBe(true);
    });

    test('without the option, the same case-only difference is reported as a change', () => {
        const diff = computeLineDiff('Hello\nWorld', 'hello\nworld');
        expect(diff.every(d => d.type === 'unchanged')).toBe(false);
    });

    test('a matched (case-insensitive) line keeps its original-side casing in the output', () => {
        expect(computeLineDiff('HELLO', 'hello', { ignoreCase: true })).toEqual([
            { type: 'unchanged', line: 'HELLO' }
        ]);
    });

    test('still detects genuine content changes alongside case-only ones', () => {
        const diff = computeLineDiff('Hello\nFoo', 'hello\nBar', { ignoreCase: true });
        expect(diff).toEqual([
            { type: 'unchanged', line: 'Hello' },
            { type: 'removed', line: 'Foo' },
            { type: 'added', line: 'Bar' }
        ]);
    });
});

describe('formatDiffText', () => {
    test('prefixes added/removed/unchanged lines with +, -, and a space respectively', () => {
        const diff = [
            { type: 'unchanged', line: 'a' },
            { type: 'removed', line: 'b' },
            { type: 'added', line: 'B' }
        ];
        expect(formatDiffText(diff)).toBe('  a\n- b\n+ B');
    });

    test('an empty diff formats to an empty string', () => {
        expect(formatDiffText([])).toBe('');
    });
});

describe('computeStats', () => {
    test('counts added and removed lines, ignoring unchanged ones', () => {
        const diff = [
            { type: 'unchanged', line: 'a' },
            { type: 'removed', line: 'b' },
            { type: 'removed', line: 'c' },
            { type: 'added', line: 'B' }
        ];
        expect(computeStats(diff)).toEqual({ added: 1, removed: 2 });
    });

    test('no changes means zero added and zero removed', () => {
        const diff = [{ type: 'unchanged', line: 'a' }];
        expect(computeStats(diff)).toEqual({ added: 0, removed: 0 });
    });
});

describe('buildSideBySideRows', () => {
    test('identical texts produce matching unchanged rows on both sides', () => {
        const diff = computeLineDiff('a\nb', 'a\nb');
        const rows = buildSideBySideRows(diff);
        expect(rows).toEqual([
            { left: { type: 'unchanged', line: 'a' }, right: { type: 'unchanged', line: 'a' } },
            { left: { type: 'unchanged', line: 'b' }, right: { type: 'unchanged', line: 'b' } }
        ]);
    });

    test('pure addition pads the left column with an empty placeholder', () => {
        const diff = computeLineDiff('a', 'a\nb');
        const rows = buildSideBySideRows(diff);
        expect(rows).toEqual([
            { left: { type: 'unchanged', line: 'a' }, right: { type: 'unchanged', line: 'a' } },
            { left: { type: 'empty', line: '' }, right: { type: 'added', line: 'b' } }
        ]);
    });

    test('pure removal pads the right column with an empty placeholder', () => {
        const diff = computeLineDiff('a\nb', 'a');
        const rows = buildSideBySideRows(diff);
        expect(rows).toEqual([
            { left: { type: 'unchanged', line: 'a' }, right: { type: 'unchanged', line: 'a' } },
            { left: { type: 'removed', line: 'b' }, right: { type: 'empty', line: '' } }
        ]);
    });

    test('a one-line replacement pairs the removed and added line on the same row', () => {
        const diff = computeLineDiff('one\ntwo\nthree', 'one\nTWO\nthree');
        const rows = buildSideBySideRows(diff);
        expect(rows).toEqual([
            { left: { type: 'unchanged', line: 'one' }, right: { type: 'unchanged', line: 'one' } },
            { left: { type: 'removed', line: 'two' }, right: { type: 'added', line: 'TWO' } },
            { left: { type: 'unchanged', line: 'three' }, right: { type: 'unchanged', line: 'three' } }
        ]);
    });

    test('an unequal-length hunk (2 removed, 1 added) pads the shorter side', () => {
        const rows = buildSideBySideRows([
            { type: 'removed', line: 'a1' },
            { type: 'removed', line: 'a2' },
            { type: 'added', line: 'b1' }
        ]);
        expect(rows).toEqual([
            { left: { type: 'removed', line: 'a1' }, right: { type: 'added', line: 'b1' } },
            { left: { type: 'removed', line: 'a2' }, right: { type: 'empty', line: '' } }
        ]);
    });

    test('an empty diff produces no rows', () => {
        expect(buildSideBySideRows([])).toEqual([]);
    });
});

describe('computeWordDiff', () => {
    test('identical lines produce only unchanged tokens', () => {
        const diff = computeWordDiff('const x = 1;', 'const x = 1;');
        expect(diff.every(d => d.type === 'unchanged')).toBe(true);
    });

    test('a single changed word is isolated, surrounding tokens stay unchanged', () => {
        const diff = computeWordDiff('let count = 1;', 'let count = 2;');
        expect(diff).toEqual([
            { type: 'unchanged', value: 'let' },
            { type: 'unchanged', value: ' ' },
            { type: 'unchanged', value: 'count' },
            { type: 'unchanged', value: ' ' },
            { type: 'unchanged', value: '=' },
            { type: 'unchanged', value: ' ' },
            { type: 'removed', value: '1' },
            { type: 'added', value: '2' },
            { type: 'unchanged', value: ';' }
        ]);
    });

    test('tokens concatenate back to the exact original lines (round-trip)', () => {
        const lineA = 'function add(a, b) { return a + b; }';
        const lineB = 'function add(a, b) { return a - b; }';
        const diff = computeWordDiff(lineA, lineB);
        const rebuiltA = diff.filter(d => d.type !== 'added').map(d => d.value).join('');
        const rebuiltB = diff.filter(d => d.type !== 'removed').map(d => d.value).join('');
        expect(rebuiltA).toBe(lineA);
        expect(rebuiltB).toBe(lineB);
    });

    test('completely different lines mark every token as removed/added', () => {
        const diff = computeWordDiff('foo', 'bar');
        expect(diff).toEqual([
            { type: 'removed', value: 'foo' },
            { type: 'added', value: 'bar' }
        ]);
    });

    test('one empty line: every token on the other side is added', () => {
        const diff = computeWordDiff('', 'hello world');
        expect(diff.filter(d => d.type === 'removed')).toHaveLength(0);
        expect(diff.map(d => d.value).join('')).toBe('hello world');
    });
});

describe('foldRuns', () => {
    const isEven = n => n % 2 === 0;

    test('a run shorter than minRun is left fully expanded', () => {
        // all collapsible, length 6 < default minRun (8)
        const items = [2, 4, 6, 8, 10, 12];
        const result = foldRuns(items, isEven);
        expect(result).toEqual(items.map(item => ({ kind: 'item', item })));
    });

    test('a run of exactly minRun collapses to the minimum non-empty hidden set', () => {
        // length 8, context 3 -> hidden = items[3..5), i.e. 2 items
        const items = [0, 2, 4, 6, 8, 10, 12, 14];
        const result = foldRuns(items, isEven, { context: 3, minRun: 8 });
        expect(result).toEqual([
            { kind: 'item', item: 0 },
            { kind: 'item', item: 2 },
            { kind: 'item', item: 4 },
            { kind: 'collapsed', items: [6, 8] },
            { kind: 'item', item: 10 },
            { kind: 'item', item: 12 },
            { kind: 'item', item: 14 }
        ]);
    });

    test('a run just below minRun does not collapse', () => {
        const items = [0, 2, 4, 6, 8, 10, 12]; // length 7 < 8
        const result = foldRuns(items, isEven, { context: 3, minRun: 8 });
        expect(result.every(r => r.kind === 'item')).toBe(true);
    });

    test('non-collapsible items interrupt and separate runs', () => {
        // odd numbers are not collapsible; two separate long even-runs
        const items = [1, 2, 4, 6, 8, 10, 12, 14, 16, 3, 2, 4, 6, 8, 10, 12, 14, 16, 5];
        const result = foldRuns(items, isEven, { context: 2, minRun: 6 });
        const collapsedBlocks = result.filter(r => r.kind === 'collapsed');
        expect(collapsedBlocks).toHaveLength(2);
        // boundaries (the odd interrupters) must survive untouched
        expect(result[0]).toEqual({ kind: 'item', item: 1 });
        expect(result.find(r => r.kind === 'item' && r.item === 3)).toBeTruthy();
        expect(result[result.length - 1]).toEqual({ kind: 'item', item: 5 });
    });

    test('a collapsible run touching the start of the list needs no external context', () => {
        const items = [2, 4, 6, 8, 10, 12, 14, 16, 1]; // 8 evens then an odd
        const result = foldRuns(items, isEven, { context: 3, minRun: 8 });
        expect(result[0]).toEqual({ kind: 'item', item: 2 });
        expect(result.some(r => r.kind === 'collapsed')).toBe(true);
        expect(result[result.length - 1]).toEqual({ kind: 'item', item: 1 });
    });

    test('concatenating all item/collapsed contents reproduces the original list (nothing is lost)', () => {
        const items = Array.from({ length: 40 }, (_, i) => i);
        const result = foldRuns(items, () => true, { context: 3, minRun: 8 });
        const rebuilt = result.flatMap(r => r.kind === 'item' ? [r.item] : r.items);
        expect(rebuilt).toEqual(items);
    });

    test('an empty list produces an empty result', () => {
        expect(foldRuns([], isEven)).toEqual([]);
    });

    test('works with buildSideBySideRows output using an unchanged-on-both-sides predicate', () => {
        const lines = Array.from({ length: 12 }, (_, i) => `line${i}`).join('\n');
        const rows = buildSideBySideRows(computeLineDiff(lines, lines));
        const isUnchangedRow = row => row.left.type === 'unchanged' && row.right.type === 'unchanged';
        const result = foldRuns(rows, isUnchangedRow, { context: 2, minRun: 8 });
        expect(result.some(r => r.kind === 'collapsed')).toBe(true);
        const rebuiltCount = result.reduce((n, r) => n + (r.kind === 'item' ? 1 : r.items.length), 0);
        expect(rebuiltCount).toBe(12);
    });
});

describe('applyIgnoreRules', () => {
    test('no patterns leaves the text untouched', () => {
        const result = applyIgnoreRules('a\nb\nc', [], 'removeLines');
        expect(result).toEqual({ text: 'a\nb\nc', errors: [] });
    });

    test('blank/whitespace-only pattern entries are ignored', () => {
        const result = applyIgnoreRules('a\nb', ['', '   '], 'removeLines');
        expect(result).toEqual({ text: 'a\nb', errors: [] });
    });

    test('removeLines: drops every line matching any given pattern', () => {
        const text = '2024-01-01 INFO started\nDEBUG noisy line\n2024-01-02 INFO finished';
        const result = applyIgnoreRules(text, ['^DEBUG'], 'removeLines');
        expect(result.text).toBe('2024-01-01 INFO started\n2024-01-02 INFO finished');
        expect(result.errors).toEqual([]);
    });

    test('removeLines: multiple patterns combine (a line matching any of them is dropped)', () => {
        const text = 'keep\nTODO: fix this\nkeep2\nDEBUG: noisy';
        const result = applyIgnoreRules(text, ['^TODO:', '^DEBUG:'], 'removeLines');
        expect(result.text).toBe('keep\nkeep2');
    });

    test('stripMatches: removes only the matched substring, keeping the rest of the line', () => {
        const text = 'Request at 2024-01-01T10:00:00Z succeeded';
        const result = applyIgnoreRules(text, ['\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z'], 'stripMatches');
        expect(result.text).toBe('Request at  succeeded');
    });

    test('stripMatches: applies every pattern across the whole text, not just the first match', () => {
        const text = 'id=1 id=2 id=3';
        const result = applyIgnoreRules(text, ['id=\\d+'], 'stripMatches');
        expect(result.text).toBe('  ');
    });

    test('an invalid regex is reported as an error and does not throw', () => {
        const result = applyIgnoreRules('a\nb', ['[unclosed'], 'removeLines');
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].pattern).toBe('[unclosed');
        expect(typeof result.errors[0].error).toBe('string');
    });

    test('valid patterns still apply even when another pattern in the list is invalid', () => {
        const text = 'DEBUG: noisy\nkeep this';
        const result = applyIgnoreRules(text, ['^DEBUG:', '[unclosed'], 'removeLines');
        expect(result.text).toBe('keep this');
        expect(result.errors).toHaveLength(1);
    });

    test('all-invalid patterns leave the text unchanged but report every error', () => {
        const result = applyIgnoreRules('a\nb', ['[bad1', '(bad2'], 'removeLines');
        expect(result.text).toBe('a\nb');
        expect(result.errors).toHaveLength(2);
    });
});
