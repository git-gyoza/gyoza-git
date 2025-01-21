const zlib = require('zlib');
const {PassThrough} = require('stream');

const {CompressionError, compress, decompress} = require('../../src/compression/compress')

function compressData(data, encoding) {
    switch (encoding) {
        case 'gzip':
            return zlib.gzipSync(data);
        case 'deflate':
            return zlib.deflateSync(data);
        case 'br':
            return zlib.brotliCompressSync(data);
        default:
            throw new CompressionError(encoding);
    }
}

function decompressData(data, encoding) {
    switch (encoding) {
        case 'gzip':
            return zlib.gunzipSync(data);
        case 'deflate':
            return zlib.inflateSync(data);
        case 'br':
            return zlib.brotliDecompressSync(data);
        case 'identity':
            return data
        default:
            throw new CompressionError(encoding);
    }
}

function createReadableStream(buffer) {
    return new PassThrough().end(buffer);
}

function readStreamContents(stream) {
    return new Promise((resolve, reject) => {
        let output = '';
        stream.on('data', (chunk) => output += chunk.toString());
        stream.on('end', () => resolve(output));
        stream.on('error', (err) => reject(err));
    });
}

describe('tests for compression', () => {
    ['invalid'].forEach((encoding) => {
        test(`should throw error on invalid encoding ${encoding}`, () => {
            expect(() => compress(new PassThrough(), encoding)).toThrow(CompressionError)
        })
    });
})

describe('tests for decompression', () => {

    [
        undefined, null, '',
        'gzip', 'deflate', 'gzip, deflate', 'gzip, deflate, br'
    ].forEach((encoding) => {
        test(`should correctly decompress ${encoding}`, async () => {
            const expected = 'Hello, World!'

            let data = Buffer.from(expected)
            if (encoding != null && encoding.length > 0)
                for (let e of encoding.split(', ').reverse())
                    data = compressData(data, e)

            const stream = createReadableStream(data)

            const decompressed = decompress(stream, encoding)
            const output = await readStreamContents(decompressed)
            expect(output).toBe(expected)
        })
    });

    ['invalid', 'gzip, invalid'].forEach((encoding) => {
        test(`should throw error on invalid encoding ${encoding}`, () => {
            expect(() => decompress(new PassThrough(), encoding)).toThrow(CompressionError)
        })
    });

});
