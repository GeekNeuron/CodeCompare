/**
 * CodeCompareJson - small helpers for detecting and pretty-printing JSON, so
 * two snippets that differ only in formatting (spacing, key order aside,
 * minified vs. pretty) can be compared on structure rather than whitespace
 * noise.
 *
 * Exposed as `window.CodeCompareJson` in the browser and as a CommonJS
 * module in Node (so it can be unit-tested with Jest).
 */
(function (root) {
    /**
     * Attempts to parse and pretty-print a JSON string. Returns a
     * discriminated result object instead of throwing, so callers don't need
     * try/catch and can handle both outcomes uniformly.
     *
     * @param {string} text
     * @param {number} [indent=2]
     * @returns {{ok: true, formatted: string} | {ok: false, error: string}}
     */
    function tryFormatJson(text, indent) {
        const spaces = indent === undefined ? 2 : indent;
        try {
            const parsed = JSON.parse(text);
            return { ok: true, formatted: JSON.stringify(parsed, null, spaces) };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    }

    /**
     * Cheap heuristic for auto-detection/UI hints: does this text look like
     * (and actually parse as) a JSON object or array? Used to decide whether
     * to suggest formatting, not as validation on its own.
     */
    function looksLikeJson(text) {
        const trimmed = text.trim();
        if (!trimmed) return false;
        const first = trimmed[0];
        const last = trimmed[trimmed.length - 1];
        const bracketsMatch = (first === '{' && last === '}') || (first === '[' && last === ']');
        if (!bracketsMatch) return false;
        return tryFormatJson(trimmed).ok;
    }

    const api = { tryFormatJson, looksLikeJson };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.CodeCompareJson = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
