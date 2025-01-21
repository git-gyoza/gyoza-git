const zlib = require('zlib')
const {PassThrough} = require('stream')

/**
 * Represents a general encoding.
 * Provides {@link Encoder#compressionStream} and
 * {@link Encoder#decompressionStream} for streams operations.
 */
class Encoder {

    /**
     * Instantiates a new Encoder.
     *
     * @param name the name of the encoding
     * @param compressionStream the compression stream
     * @param decompressionStream the decompression stream
     */
    constructor (name, compressionStream, decompressionStream) {
        this.name = name
        this.compressionStream = compressionStream
        this.decompressionStream = decompressionStream
    }

}

module.exports = {
    GZIP: new Encoder('gzip', zlib.createGzip, zlib.createGunzip),
    DEFLATE: new Encoder('deflate', zlib.createDeflate, zlib.createInflate),
    BROTLI: new Encoder('br', zlib.createBrotliCompress, zlib.createBrotliDecompress),
    IDENTITY: new Encoder('identity', () => new PassThrough(), () => new PassThrough())
}
