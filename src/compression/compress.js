const Encoder = require('./encoding')

/**
 * An {@link Error} thrown upon an invalid decompression.
 */
class CompressionError extends Error {
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
        const encodings = encoding.replace(' ', '').split(',')

        const firstEncoding = encodings[0]
        const encoder = Object.values(Encoder).filter((e) => e.name === firstEncoding)[0]
        if (encoder === undefined) throw new CompressionError(firstEncoding)
        else stream = stream.pipe(encoder.decompressionStream())

        if (encodings.length === 1) return stream
        else return decompress(stream, encodings.slice(1).join(','))
    }
}

module.exports = { CompressionError, decompress }
