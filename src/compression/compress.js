const Encoder = require('./encoding')

/**
 * An {@link Error} thrown upon an invalid decompression.
 */
class CompressionError extends Error {
    constructor(encoding) {
        super(`Unsupported encoding: ${encoding}`)
    }
}

/**
 * Finds the most appropriate compression method from the given encodings
 * and compresses the stream.
 *
 * @param stream the stream to compress
 * @param acceptedEncoding a string of accepted encodings separated by ', '
 * @returns {{encoding, stream}|*} the chosen encoding and the compressed stream
 */
function compress(stream, acceptedEncoding) {
    if (acceptedEncoding == null || acceptedEncoding.trim().length === 0) return stream
    else {
        const acceptedEncodings = acceptedEncoding.replace(' ', '').split(',')

        let encoder = undefined
        for (let i = 0; i < acceptedEncodings.length && encoder === undefined; i++)
            encoder = Encoder.valueOf(acceptedEncodings[i])

        if (encoder === undefined) throw new CompressionError(acceptedEncoding)
        else stream = stream.pipe(encoder.compressionStream())

        return {
            encoding: encoder.name,
            stream: stream
        }
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
        const encoder = Encoder.valueOf(firstEncoding)
        if (encoder === undefined) throw new CompressionError(firstEncoding)
        else stream = stream.pipe(encoder.decompressionStream())

        if (encodings.length === 1) return stream
        else return decompress(stream, encodings.slice(1).join(','))
    }
}

module.exports = { CompressionError, compress, decompress }
