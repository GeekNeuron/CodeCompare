const {
    bytesToBase64Url,
    base64UrlToBytes,
    encodeSharePayload,
    decodeSharePayload,
    hasCompressionSupport
} = require('../share-utils.js');

describe('bytesToBase64Url / base64UrlToBytes', () => {
    test('round-trips an empty byte array', () => {
        expect(base64UrlToBytes(bytesToBase64Url(new Uint8Array([])))).toEqual(new Uint8Array([]));
    });

    test.each([
        [1, [255]],
        [2, [1, 2]],
        [3, [1, 2, 3]],
        [4, [1, 2, 3, 4]],
        [5, [1, 2, 3, 4, 5]],
        [6, [0, 255, 128, 64, 32, 16]]
    ])('round-trips %i byte(s) correctly (covers every base64 remainder case)', (_len, arr) => {
        const bytes = new Uint8Array(arr);
        const encoded = bytesToBase64Url(bytes);
        expect(base64UrlToBytes(encoded)).toEqual(bytes);
    });

    test('the encoded string is URL-safe (no +, /, or = characters)', () => {
        const bytes = new Uint8Array([251, 255, 190, 62, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
        const encoded = bytesToBase64Url(bytes);
        expect(encoded).not.toMatch(/[+/=]/);
    });
});

describe('encodeSharePayload / decodeSharePayload', () => {
    test('round-trips a simple payload', async () => {
        const payload = { o: 'const a = 1;', m: 'const a = 2;', lang: 'javascript', view: 'split' };
        const encoded = await encodeSharePayload(payload);
        const decoded = await decodeSharePayload(encoded);
        expect(decoded).toEqual(payload);
    });

    test('round-trips unicode text (e.g. Persian) without corruption', async () => {
        const payload = { o: 'سلام دنیا', m: 'سلام دنیای جدید 👋', lang: 'markup', view: 'unified' };
        const encoded = await encodeSharePayload(payload);
        const decoded = await decodeSharePayload(encoded);
        expect(decoded).toEqual(payload);
    });

    test('round-trips empty strings', async () => {
        const payload = { o: '', m: '', lang: 'javascript', view: 'unified' };
        const encoded = await encodeSharePayload(payload);
        expect(await decodeSharePayload(encoded)).toEqual(payload);
    });

    test('round-trips a larger, repetitive snippet (the case compression helps most)', async () => {
        const line = 'function veryDescriptiveFunctionName(argumentOne, argumentTwo) { return argumentOne + argumentTwo; }\n';
        const payload = { o: line.repeat(200), m: line.repeat(199) + 'const changed = true;\n', lang: 'javascript', view: 'split' };
        const encoded = await encodeSharePayload(payload);
        const decoded = await decodeSharePayload(encoded);
        expect(decoded).toEqual(payload);
    });

    test('the encoded string is a valid, URL-fragment-safe token', async () => {
        const encoded = await encodeSharePayload({ o: 'a', m: 'b', lang: 'javascript', view: 'unified' });
        expect(encoded).toMatch(/^[01][A-Za-z0-9_-]*$/);
    });

    test('rejects malformed input instead of throwing an unrelated/cryptic error', async () => {
        await expect(decodeSharePayload('')).rejects.toThrow();
        await expect(decodeSharePayload('x')).rejects.toThrow();
        await expect(decodeSharePayload('9somegarbage')).rejects.toThrow(/Unrecognized/);
    });

    test('compression is used when the browser/runtime supports it (leading flag is "1")', async () => {
        if (!hasCompressionSupport()) return; // environment-dependent; skip where unsupported
        const encoded = await encodeSharePayload({ o: 'a'.repeat(1000), m: 'a'.repeat(1000), lang: 'javascript', view: 'unified' });
        expect(encoded[0]).toBe('1');
    });
});
