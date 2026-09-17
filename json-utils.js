(function (root) {
    function tryFormatJson(text, indent) {
        const spaces = indent === undefined ? 2 : indent;
        try {
            const parsed = JSON.parse(text);
            return { ok: true, formatted: JSON.stringify(parsed, null, spaces) };
        } catch (err) {
            return { ok: false, error: err.message };
        }
    }

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
