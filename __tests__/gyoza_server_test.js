const {PassThrough} = require('stream')

const {HTTPHandler} = require("../src/gyoza_server")
const {SERVER_NAME} = require("../src/gyoza-git")

const {decompressData, compressData, readStreamContents} = require('./compression/compress_test')

describe('HTTPHandler tests', () => {

    [
        [undefined, 'identity', undefined],
        [null, 'identity', undefined],
        ['', 'identity', undefined],
        ['identity', 'identity', undefined],
    ].forEach(a => supportResponseStreamDecoding(a[0], a[1], a[2]))
    function supportResponseStreamDecoding(acceptedEncoding, encoding, encodingHeader) {
        test(`response stream should be encoded to ${encoding} (Content-Encoding: ${encodingHeader}, Accept-Encoding: ${acceptedEncoding})`, async () => {
            const handler = new MockHTTPHandler('GET', 'hello', {
                'Accept-Encoding': acceptedEncoding
            })
            handler.handleRequest()

            const decompressedResponse = handler.getResponse()
            let output = await readStreamContents(decompressedResponse)
            output = decompressData(output, encoding)

            expect(output.toString()).toBe('World!')
        })
    }

    [
        'identity', 'gzip',
        'deflate', 'br',
        'gzip, deflate, br, identity'
    ].forEach((encoding) => {
        test(`request stream in ${encoding} encoding should be decompressed`, async () => {
            const expected = 'Hello, World!'
            let buffer = Buffer.from(expected)
                for (let e of encoding.split(', ').reverse())
                    buffer = compressData(buffer, e)
            const handler = new MockHTTPHandler('GET', '', {
                'Content-Encoding': encoding,
                'Body': true
            }, buffer)
            handler.handleRequest()
            const decompressedRequest = handler.getRequest()
            let output = await readStreamContents(decompressedRequest)
            expect(output.toString()).toBe(expected)
        })
    });

    ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'SOMETHING_ELSE'].forEach(method => {
        test(`should respond with 405 to ${method} method`, () => {
            const handler = new MockHTTPHandler()
            handler.handleRequest(method)
            const response = handler.getResponse()
            expect(response.statusCode).toBe(405)
        })
    })

    test('headers should be formatted and have Server key', () => {
        const headers = {
            'cONTENT-lENGTH': 10,
            true: false,
            'string': 'hello world'
        }
        const handler = new MockHTTPHandler('HEADERS', '', headers)
        handler.handleRequest()
        const response = handler.getResponse()
        const actual = response.headers
        const expected = {
            'Content-Length': 10,
            'True': false,
            'String': 'hello world',
            'Server': SERVER_NAME,
        }
        expect(actual).toEqual(expected)
    })

})

/**
 * A mock for the actual {@link HTTPHandler}.
 */
class MockHTTPHandler extends HTTPHandler {

    /**
     * Instantiates a new Mock HTTP handler.
     *
     * @param method the request method ('GET' by default)
     * @param path the request path ('' by default)
     * @param headers the request headers (empty be default)
     * @param body the request body
     * @returns {MockResponse} the response containing all the data sent
     */
    constructor(method = 'GET', path = '', headers = {}, body = null) {
        super(new MockRequest(method, path, headers, body), new MockResponse())
    }

    getRequest() {
        return this._request
    }

    getResponse() {
        return this._response
    }

    handleRequest() {
        if (this._method === 'HEADERS')
            super._reply(200, null, this._headers)
        else super.handleRequest()
    }

    _get() {
        if (this._path === 'hello')
            super._reply(200, 'World!')
        else super._get()
    }

    _log(message) {
        // Prevents useless logging
    }

}

/**
 * A mock for the actual request object offered
 * by the {@link http} module.
 */
class MockRequest {

    constructor(method, url, headers, body) {
        this.method = method
        this.url = url
        this.headers = headers
        this.connection = {
            'remoteAddress': '127.0.0.1'
        }
        this.body = new PassThrough()
        if (body != null) this.body.end(body)
    }

    pipe(stream) {
        return this.body.pipe(stream)
    }

    read() {
        return this.body.read()
    }

}

/**
 * A mock for the actual response object offered
 * by the {@link http} module.
 */
class MockResponse {
    statusCode
    headers
    body = new PassThrough()
    ended = false

    writeHead(statusCode, headers) {
        this.statusCode = statusCode
        this.headers = headers
    }

    pipe(stream) {
        return this.body.pipe(stream)
    }

    write(body) {
        this.body = body
    }

    end() {
        this.ended = true
    }

}
