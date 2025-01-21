const zlib = require('zlib');
const {PassThrough} = require('stream');

const {DecompressionError, decompress} = require('../src/compress')
const buffer = require("node:buffer");

function compressData(data, encoding) {
    switch (encoding) {
        case 'gzip':
            return zlib.gzipSync(data);
        case 'deflate':
            return zlib.deflateSync(data);
        case 'brotli':
            return zlib.brotliCompressSync(data);
        default:
            throw new DecompressionError(encoding);
    }
}

function createReadableStream(buffer) {
    const stream = new PassThrough();
    stream.end(buffer);
    return stream;
}

function readBuffer(stream) {
    return new Promise((resolve, reject) => {
        let buffer = '';
        stream.on('data', (chunk) => buffer += chunk.toString());
        stream.on('end', () => resolve(buffer));
        stream.on('error', (err) => reject(err));
    });
}

describe('tests for decompression', () => {

    [
        undefined, null, '',
        'gzip', 'deflate', 'gzip, deflate', 'gzip, deflate, brotli'
    ].forEach((encoding) => {
        test(`should correctly decompress ${encoding}`, async () => {
            const expected = 'Hello, World!'

            let data = Buffer.from(expected)
            if (encoding != null && encoding.length > 0)
                for (let e of encoding.split(', ').reverse())
                    data = compressData(data, e)

            const stream = createReadableStream(data)

            const decompressed = decompress(stream, encoding)
            const output = await readBuffer(decompressed)
            expect(output).toBe(expected)
        })
    })

    // new Map([
    //     ['invalid', stream()],
    //     ['gzip, invalid', stream('gzip')]
    // ]).forEach((stream, encoding) => {
    //     test(`should throw error on invalid encoding ${encoding}`, () => {
    //         expect(() => decompress(stream, encoding)).toThrow(DecompressionError)
    //     })
    // })

});
