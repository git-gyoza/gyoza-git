const zlib = require('zlib')
const {PassThrough} = require('stream')

/**
 * Represents a general encoding.
 * Provides {@link Encoding#compressionStream} and
 * {@link Encoding#decompressionStream} for streams operations.
 */
class Encoding {

    /**
     * Instantiates a new Encoding.
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
    GZIP: new Encoding('gzip', zlib.createGzip, zlib.createGunzip),
    DEFLATE: new Encoding('deflate', zlib.createDeflate, zlib.createInflate),
    BROTLI: new Encoding('br', zlib.createBrotliCompress, zlib.createBrotliDecompress),
    IDENTITY: new Encoding('identity', () => new PassThrough(), () => new PassThrough())
}
