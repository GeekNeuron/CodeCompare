const { tryFormatJson, looksLikeJson } = require('../json-utils.js');

describe('tryFormatJson', () => {
    test('pretty-prints a minified object with 2-space indentation by default', () => {
        const result = tryFormatJson('{"a":1,"b":[1,2,3]}');
        expect(result.ok).toBe(true);
        expect(result.formatted).toBe('{\n  "a": 1,\n  "b": [\n    1,\n    2,\n    3\n  ]\n}');
    });

    test('formats a top-level array', () => {
        const result = tryFormatJson('[1,2,3]');
        expect(result.ok).toBe(true);
        expect(result.formatted).toBe('[\n  1,\n  2,\n  3\n]');
    });

    test('respects a custom indent size', () => {
        const result = tryFormatJson('{"a":1}', 4);
        expect(result.ok).toBe(true);
        expect(result.formatted).toBe('{\n    "a": 1\n}');
    });

    test('re-formatting already-pretty JSON is idempotent', () => {
        const first = tryFormatJson('{"a":1,"b":2}');
        const second = tryFormatJson(first.formatted);
        expect(second.ok).toBe(true);
        expect(second.formatted).toBe(first.formatted);
    });

    test('returns ok:false with a message for invalid JSON', () => {
        const result = tryFormatJson('{"a": 1,}');
        expect(result.ok).toBe(false);
        expect(typeof result.error).toBe('string');
        expect(result.error.length).toBeGreaterThan(0);
    });

    test('returns ok:false for plain non-JSON text', () => {
        const result = tryFormatJson('function add(a, b) { return a + b; }');
        expect(result.ok).toBe(false);
    });

    test('returns ok:false for an empty string', () => {
        expect(tryFormatJson('').ok).toBe(false);
    });

    test('handles nested structures and preserves values through a round trip', () => {
        const original = { name: 'CodeCompare', nested: { list: [1, 'two', null, false] } };
        const result = tryFormatJson(JSON.stringify(original));
        expect(result.ok).toBe(true);
        expect(JSON.parse(result.formatted)).toEqual(original);
    });
});

describe('looksLikeJson', () => {
    test('true for a valid minified object', () => {
        expect(looksLikeJson('{"a":1}')).toBe(true);
    });

    test('true for a valid array', () => {
        expect(looksLikeJson('[1,2,3]')).toBe(true);
    });

    test('false for plain code even if it contains braces', () => {
        expect(looksLikeJson('function f() { return 1; }')).toBe(false);
    });

    test('false for an empty or whitespace-only string', () => {
        expect(looksLikeJson('')).toBe(false);
        expect(looksLikeJson('   \n  ')).toBe(false);
    });

    test('false for text that starts/ends with brackets but is not valid JSON', () => {
        expect(looksLikeJson('{not: valid, json}')).toBe(false);
    });

    test('true even with surrounding whitespace/newlines', () => {
        expect(looksLikeJson('  \n{"a": 1}\n  ')).toBe(true);
    });
});
