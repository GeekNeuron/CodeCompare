const { computeLineDiff, formatDiffText, computeStats, buildSideBySideRows, computeWordDiff, foldRuns, applyIgnoreRules, applyIgnoreBlankLines, detectMovedBlocks, buildUnifiedPatch, detectEncodingIssues, normalizeLineEndingsAndBom } = require('../diff-utils.js');

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
        expect(computeStats(diff)).toEqual({ added: 1, removed: 2, unchanged: 1, total: 4, similarity: 25 });
    });

    test('no changes means zero added and zero removed, 100% similarity', () => {
        const diff = [{ type: 'unchanged', line: 'a' }];
        expect(computeStats(diff)).toEqual({ added: 0, removed: 0, unchanged: 1, total: 1, similarity: 100 });
    });

    test('completely different content means 0% similarity', () => {
        const diff = [
            { type: 'removed', line: 'a' },
            { type: 'added', line: 'b' }
        ];
        expect(computeStats(diff)).toEqual({ added: 1, removed: 1, unchanged: 0, total: 2, similarity: 0 });
    });

    test('empty diff means 100% similarity by convention', () => {
        expect(computeStats([])).toEqual({ added: 0, removed: 0, unchanged: 0, total: 0, similarity: 100 });
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

    test('propagates a moved flag from the source entries into left/right rows', () => {
        const diff = [
            { type: 'removed', line: 'a', moved: true },
            { type: 'added', line: 'b' }
        ];
        const rows = buildSideBySideRows(diff);
        expect(rows[0].left.moved).toBe(true);
        expect(rows[0].right.moved).toBeUndefined();
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

    test('Persian words are tokenized as whole words, not per character', () => {
        const diff = computeWordDiff('سلام دنیای بزرگ', 'سلام دنیای کوچک');
        expect(diff).toEqual([
            { type: 'unchanged', value: 'سلام' },
            { type: 'unchanged', value: ' ' },
            { type: 'unchanged', value: 'دنیای' },
            { type: 'unchanged', value: ' ' },
            { type: 'removed', value: 'بزرگ' },
            { type: 'added', value: 'کوچک' }
        ]);
    });

    test('Arabic words are tokenized as whole words, not per character', () => {
        const diff = computeWordDiff('مرحبا بالعالم', 'مرحبا بالكون');
        expect(diff).toEqual([
            { type: 'unchanged', value: 'مرحبا' },
            { type: 'unchanged', value: ' ' },
            { type: 'removed', value: 'بالعالم' },
            { type: 'added', value: 'بالكون' }
        ]);
    });

    test('Persian punctuation and digits are handled correctly', () => {
        const diff = computeWordDiff('سلام، امروز ۱۴۰۵ است.', 'سلام، امروز ۱۴۰۶ است.');
        expect(diff).toEqual([
            { type: 'unchanged', value: 'سلام' },
            { type: 'unchanged', value: '،' },
            { type: 'unchanged', value: ' ' },
            { type: 'unchanged', value: 'امروز' },
            { type: 'unchanged', value: ' ' },
            { type: 'removed', value: '۱۴۰۵' },
            { type: 'added', value: '۱۴۰۶' },
            { type: 'unchanged', value: ' ' },
            { type: 'unchanged', value: 'است' },
            { type: 'unchanged', value: '.' }
        ]);
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

describe('applyIgnoreBlankLines', () => {
    test('reclassifies added/removed blank lines as unchanged', () => {
        const diff = [
            { type: 'unchanged', line: 'a' },
            { type: 'added', line: '' },
            { type: 'removed', line: '   ' },
            { type: 'added', line: 'b' }
        ];
        expect(applyIgnoreBlankLines(diff)).toEqual([
            { type: 'unchanged', line: 'a' },
            { type: 'unchanged', line: '' },
            { type: 'unchanged', line: '   ' },
            { type: 'added', line: 'b' }
        ]);
    });

    test('non-blank added/removed lines are left untouched', () => {
        const diff = [{ type: 'added', line: 'code' }, { type: 'removed', line: 'old' }];
        expect(applyIgnoreBlankLines(diff)).toEqual(diff);
    });

    test('does not mutate the input array', () => {
        const diff = [{ type: 'added', line: '' }];
        const result = applyIgnoreBlankLines(diff);
        expect(result).not.toBe(diff);
        expect(diff[0].type).toBe('added');
    });
});

describe('detectMovedBlocks', () => {
    test('flags a 2+ line block that was removed from one spot and added elsewhere', () => {
        const diff = [
            { type: 'unchanged', line: 'start' },
            { type: 'removed', line: 'function helper() {' },
            { type: 'removed', line: '    return 42;' },
            { type: 'removed', line: '}' },
            { type: 'unchanged', line: 'middle' },
            { type: 'added', line: 'function helper() {' },
            { type: 'added', line: '    return 42;' },
            { type: 'added', line: '}' },
            { type: 'unchanged', line: 'end' }
        ];
        const result = detectMovedBlocks(diff);
        expect(result.filter(e => e.moved)).toHaveLength(6);
        expect(result[0].moved).toBeUndefined();
        expect(result[1].moved).toBe(true);
        expect(result[4].moved).toBeUndefined();
    });

    test('does not flag short single-line coincidental matches', () => {
        const diff = [
            { type: 'removed', line: '}' },
            { type: 'unchanged', line: 'x' },
            { type: 'added', line: '}' }
        ];
        const result = detectMovedBlocks(diff);
        expect(result.some(e => e.moved)).toBe(false);
    });

    test('flags a long single line that was moved', () => {
        const longLine = 'const configurationValue = computeDefaultSettings();';
        const diff = [
            { type: 'removed', line: longLine },
            { type: 'unchanged', line: 'x' },
            { type: 'added', line: longLine }
        ];
        const result = detectMovedBlocks(diff);
        expect(result[0].moved).toBe(true);
        expect(result[2].moved).toBe(true);
    });

    test('leaves genuinely new/removed content unflagged', () => {
        const diff = [
            { type: 'removed', line: 'const oldThing = 1;' },
            { type: 'added', line: 'const newThing = 2;' }
        ];
        const result = detectMovedBlocks(diff);
        expect(result.some(e => e.moved)).toBe(false);
    });

    test('does not mutate the input array', () => {
        const diff = [{ type: 'removed', line: 'aaaaaaaaaaaaaaaaaaaaaaa' }, { type: 'added', line: 'aaaaaaaaaaaaaaaaaaaaaaa' }];
        const result = detectMovedBlocks(diff);
        expect(result).not.toBe(diff);
        expect(diff[0].moved).toBeUndefined();
    });
});

describe('buildUnifiedPatch', () => {
    test('produces a standard @@ hunk header for a single change with context', () => {
        const entries = computeLineDiff('a\nb\nc\nd\ne\n', 'a\nb\nX\nd\ne\n', {});
        const patch = buildUnifiedPatch(entries, { originalLabel: 'a/f', modifiedLabel: 'b/f' });
        expect(patch).toBe('--- a/f\n+++ b/f\n@@ -1,5 +1,5 @@\n a\n b\n-c\n+X\n d\n e\n');
    });

    test('an identical pair produces an empty patch', () => {
        const entries = computeLineDiff('same\ntext\n', 'same\ntext\n', {});
        expect(buildUnifiedPatch(entries)).toBe('');
    });

    test('an empty diff (no entries) produces an empty patch', () => {
        expect(buildUnifiedPatch([])).toBe('');
    });

    test('pure insertion at the start uses a 0-count old side (no context)', () => {
        const entries = computeLineDiff('b\nc\n', 'a\nb\nc\n', {});
        const patch = buildUnifiedPatch(entries, { context: 0 });
        expect(patch).toContain('@@ -0,0 +1 @@');
        expect(patch).toContain('+a');
    });

    test('pure deletion at the end uses a 0-count new side (no context)', () => {
        const entries = computeLineDiff('a\nb\nc\n', 'a\nb\n', {});
        const patch = buildUnifiedPatch(entries, { context: 0 });
        expect(patch).toContain('@@ -3 +2,0 @@');
        expect(patch).toContain('-c');
    });

    test('two far-apart changes produce two separate hunks', () => {
        const before = Array.from({ length: 20 }, (_, i) => 'line' + i).join('\n') + '\n';
        const after = before.replace('line1\n', 'CHANGED\n').replace('line17\n', 'CHANGED17\n');
        const entries = computeLineDiff(before, after, {});
        const patch = buildUnifiedPatch(entries);
        expect(patch.match(/^@@/gm)).toHaveLength(2);
    });

    test('defaults to a/original and b/modified labels when none are given', () => {
        const entries = computeLineDiff('a\n', 'b\n', {});
        const patch = buildUnifiedPatch(entries);
        expect(patch.startsWith('--- a/original\n+++ b/modified\n')).toBe(true);
    });
});

describe('detectEncodingIssues', () => {
    test('no issue when both sides use LF', () => {
        const result = detectEncodingIssues('a\nb\n', 'a\nc\n');
        expect(result.hasIssue).toBe(false);
    });

    test('flags a line-ending mismatch (CRLF vs LF)', () => {
        const result = detectEncodingIssues('a\r\nb\r\n', 'a\nb\n');
        expect(result.lineEndingMismatch).toBe(true);
        expect(result.hasIssue).toBe(true);
        expect(result.originalStyle).toBe('crlf');
        expect(result.modifiedStyle).toBe('lf');
    });

    test('flags a BOM mismatch even when line endings match', () => {
        const result = detectEncodingIssues('\uFEFFa\nb\n', 'a\nb\n');
        expect(result.bomMismatch).toBe(true);
        expect(result.hasIssue).toBe(true);
    });

    test('a single-line file (no line endings at all) does not trigger a false line-ending mismatch', () => {
        const result = detectEncodingIssues('onlyline', 'onlyline');
        expect(result.lineEndingMismatch).toBe(false);
    });

    test('mixed line endings are detected as their own style', () => {
        expect(detectEncodingIssues('a\r\nb\nc\r\n', 'a\r\nb\r\n').originalStyle).toBe('mixed');
    });
});

describe('normalizeLineEndingsAndBom', () => {
    test('converts CRLF to LF', () => {
        expect(normalizeLineEndingsAndBom('a\r\nb\r\n')).toBe('a\nb\n');
    });

    test('strips a leading BOM', () => {
        expect(normalizeLineEndingsAndBom('\uFEFFhello')).toBe('hello');
    });

    test('handles bare CR as a line ending too', () => {
        expect(normalizeLineEndingsAndBom('a\rb\r')).toBe('a\nb\n');
    });

    test('leaves already-normalized text unchanged', () => {
        expect(normalizeLineEndingsAndBom('a\nb\n')).toBe('a\nb\n');
    });

    test('after normalizing, a previously-flagged pair no longer has an issue', () => {
        const original = normalizeLineEndingsAndBom('\uFEFFa\r\nb\r\n');
        const modified = normalizeLineEndingsAndBom('a\nb\n');
        expect(detectEncodingIssues(original, modified).hasIssue).toBe(false);
    });
});
