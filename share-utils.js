/**
 * CodeCompareShare - encodes/decodes a comparison (original text, modified
 * text, language, view) into a URL-safe string so it can be shared as a link
 * with no server involved: the data lives entirely in the URL fragment.
 *
 * Uses the browser's native Compression Streams API (gzip) when available to
 * keep links reasonably short, with a graceful fallback to uncompressed
 * base64 on browsers that don't support it.
 *
 * Exposed as `window.CodeCompareShare` in the browser and as a CommonJS
 * module in Node (so it can be unit-tested with Jest).
 */
(function (root) {
    const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

    /** Encodes a byte array as URL-safe base64 (RFC 4648 §5), no padding. */
    function bytesToBase64Url(bytes) {
        let result = '';
        for (let i = 0; i < bytes.length; i += 3) {
            const b0 = bytes[i];
            const hasB1 = i + 1 < bytes.length;
            const hasB2 = i + 2 < bytes.length;
            const b1 = hasB1 ? bytes[i + 1] : 0;
            const b2 = hasB2 ? bytes[i + 2] : 0;
            const triplet = (b0 << 16) | (b1 << 8) | b2;
            result += B64_CHARS[(triplet >> 18) & 63];
            result += B64_CHARS[(triplet >> 12) & 63];
            result += hasB1 ? B64_CHARS[(triplet >> 6) & 63] : '';
            result += hasB2 ? B64_CHARS[triplet & 63] : '';
        }
        return result;
    }

    /** Decodes a URL-safe base64 string (produced by bytesToBase64Url) back to bytes. */
    function base64UrlToBytes(str) {
        const lookup = {};
        for (let i = 0; i < B64_CHARS.length; i++) lookup[B64_CHARS[i]] = i;

        const bytes = [];
        for (let i = 0; i < str.length; i += 4) {
            const c0 = lookup[str[i]];
            const c1 = lookup[str[i + 1]];
            const hasC2 = i + 2 < str.length;
            const hasC3 = i + 3 < str.length;
            const c2 = hasC2 ? lookup[str[i + 2]] : 0;
            const c3 = hasC3 ? lookup[str[i + 3]] : 0;

            if (c0 === undefined || c1 === undefined) {
                throw new Error('Invalid base64url input');
            }

            const triplet = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
            bytes.push((triplet >> 16) & 0xff);
            if (hasC2) bytes.push((triplet >> 8) & 0xff);
            if (hasC3) bytes.push(triplet & 0xff);
        }
        return new Uint8Array(bytes);
    }

    function hasCompressionSupport() {
        return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
    }

    async function gzipCompress(bytes) {
        const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
        return new Uint8Array(await new Response(stream).arrayBuffer());
    }

    async function gzipDecompress(bytes) {
        const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
        return new Uint8Array(await new Response(stream).arrayBuffer());
    }

    /**
     * Encodes a JSON-serializable payload into a URL-safe string. Gzips first
     * when supported (most current browsers) to keep the resulting link short;
     * a leading '1'/'0' flag records whether compression was used, so a link
     * generated on one browser can still be decoded on another.
     */
    async function encodeSharePayload(payload) {
        const json = JSON.stringify(payload);
        const bytes = new TextEncoder().encode(json);
        if (hasCompressionSupport()) {
            const compressed = await gzipCompress(bytes);
            return '1' + bytesToBase64Url(compressed);
        }
        return '0' + bytesToBase64Url(bytes);
    }

    /**
     * Reverses encodeSharePayload. Throws on malformed/corrupted input, or if
     * the link was compressed but this browser lacks decompression support.
     */
    async function decodeSharePayload(encoded) {
        if (typeof encoded !== 'string' || encoded.length < 2) {
            throw new Error('Empty or invalid share payload');
        }
        const flag = encoded[0];
        const bytes = base64UrlToBytes(encoded.slice(1));

        let finalBytes = bytes;
        if (flag === '1') {
            if (!hasCompressionSupport()) {
                throw new Error('This link uses compression not supported by your browser');
            }
            finalBytes = await gzipDecompress(bytes);
        } else if (flag !== '0') {
            throw new Error('Unrecognized share payload format');
        }

        const json = new TextDecoder().decode(finalBytes);
        return JSON.parse(json);
    }

    const api = { bytesToBase64Url, base64UrlToBytes, encodeSharePayload, decodeSharePayload, hasCompressionSupport };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.CodeCompareShare = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
