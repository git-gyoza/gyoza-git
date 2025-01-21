const zlib = require("node:zlib");

/**
 * An {@link Error} thrown upon an invalid decompression.
 */
class DecompressionError extends Error {
    constructor(encoding) {
        super(`Unsupported encoding: ${encoding}`);
    }
}

/**
 * Decompresses the given stream using the given encodings.
 * Currently supports: gzip, brotli and deflate.
 *
 * @param stream the stream to convert
 * @param encoding the string representing the encodings.
 *                 If they are separated by a comma, each one
 *                 will be used to decompress the final stream.
 * @returns {ReadableStream} the stream
 */
function decompress(stream, encoding) {
    if (encoding == null || encoding.trim().length === 0) return stream
    else {
        const split = encoding.replace(' ', '').split(',')
        switch (split[0]) {
            case 'gzip':
                stream = stream.pipe(zlib.createGunzip())
                break
            case 'deflate':
                stream = stream.pipe(zlib.createInflate())
                break
            case 'brotli':
                stream = stream.pipe(zlib.createBrotliDecompress())
                break
            default:
                throw new DecompressionError(split[0])
        }
        if (split.length === 1) return stream
        else return decompress(stream, split.slice(1).join(','))
    }
}

module.exports = { DecompressionError, decompress }
