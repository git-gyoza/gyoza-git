const zlib = require('zlib')
const {PassThrough} = require('stream')

const {CompressionError, compress, decompress} = require('../../src/compression/compress')

describe('tests for compression', () => {

    new Map([
        [undefined, 'identity'],
        [null, 'identity'],
        ['', 'identity'],
        ['identity', 'identity'],
        ['invalid, identity', 'identity'],
        ['gzip', 'gzip'],
        ['none, gzip', 'gzip'],
        ['gzip, identity', 'gzip'],
        ['br, gzip, deflate', 'br'],
        ['deflate, invalid', 'deflate'],
    ]).forEach((expectedEncoding, encoding) => {
        test(`should compress ${encoding} to ${expectedEncoding}`, async () => {
            const expected = 'Hello, World!'

            let data = Buffer.from(expected)
            const stream = new PassThrough()
            stream.end(data)

            const compressed = compress(stream, encoding)
            expect(compressed.encoding).toBe(expectedEncoding)
            
            let output = await readStreamContents(compressed.stream, expectedEncoding)
            output = decompressData(output, compressed.encoding)

            expect(output.toString()).toBe(expected)
        })
    });

    ['invalid'].forEach((encoding) => {
        test(`should throw error on invalid encoding ${encoding}`, () => {
            expect(() => compress(new PassThrough(), encoding)).toThrow(CompressionError)
        })
    })

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

            const stream = new PassThrough().end(data)

            const decompressed = decompress(stream, encoding)
            const output = await readStreamContents(decompressed)
            expect(output.toString()).toBe(expected)
        })
    });

    ['invalid', 'gzip, invalid'].forEach((encoding) => {
        test(`should throw error on invalid encoding ${encoding}`, () => {
            expect(() => decompress(new PassThrough(), encoding)).toThrow(CompressionError)
        })
    })

})

function compressData(data, encoding) {
    switch (encoding) {
        case 'gzip':
            return zlib.gzipSync(data)
        case 'deflate':
            return zlib.deflateSync(data)
        case 'br':
            return zlib.brotliCompressSync(data)
        default:
            throw new CompressionError(encoding)
    }
}

function decompressData(data, encoding) {
    switch (encoding) {
        case 'gzip':
            return zlib.gunzipSync(data)
        case 'deflate':
            return zlib.inflateSync(data)
        case 'br':
            return zlib.brotliDecompressSync(data)
        case 'identity':
            return data
        default:
            throw new CompressionError(encoding)
    }
}

function readStreamContents(stream) {
    return new Promise((resolve, reject) => {
        let output = new Buffer(0)
        stream.on('data', (chunk) =>
            output = Buffer.concat([output, Buffer.from(chunk)])
        )
        stream.on('end', () => resolve(output))
        stream.on('error', (err) => reject(err))
    })
}
