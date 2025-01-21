const {PassThrough} = require('stream')

const {GyozaServer, GyozaServerError, HTTPHandler} = require("../src/gyoza_server")
const {SERVER_NAME} = require("../src/gyoza-git")

const {decompressData, compressData, readStreamContents} = require('./compression/compress_test')

describe('GyozaServer tests', () => {

    test('should reset all variables after stopping', () => {
        const server = new MockServer()
        const port = 12345
        expect(server.getPort()).toBe(null)
        expect(server.getInternalServer()).toBe(null)
        server.start(port)
        expect(server.getPort()).toBe(port)
        expect(server.getInternalServer()).not.toBe(null)
        server.stop()
        expect(server.getPort()).toBe(null)
        expect(server.getInternalServer()).toBe(null)
    })

    test('should throw error when starting already started server', () => {
        const server = new GyozaServer()
        server.start()
        expect(() => server.start()).toThrow(GyozaServerError)
        server.stop()
    })

    test('should throw error when stopping already stopped server', () => {
        const server = new GyozaServer()
        server.start()
        server.stop()
        expect(() => server.stop()).toThrow(GyozaServerError)
    })

})

class MockServer extends GyozaServer {

    getPort() {
        return this._port
    }

    getInternalServer() {
        return this._internalServer
    }

}

describe('HTTPHandler tests', () => {

    [
        [undefined, 'identity', undefined],
        [null, 'identity', undefined],
        ['', 'identity', undefined],
        ['identity', 'identity', undefined],
        ['gzip', 'gzip', 'gzip'],
        ['deflate', 'deflate', 'deflate'],
        ['br', 'br', 'br'],
        ['gzip, deflate, br', 'gzip', 'gzip']
    ].forEach(a => supportResponseStreamDecoding(a[0], a[1], a[2]))
    function supportResponseStreamDecoding(acceptedEncoding, encoding, encodingHeader) {
        test(`response stream should be encoded to ${encoding} (Content-Encoding: ${encodingHeader}, Accept-Encoding: ${acceptedEncoding})`, async () => {
            const handler = new MockHTTPHandler('GET', 'hello', {
                'Accept-Encoding': acceptedEncoding
            })
            handler.handleRequest()

            const compressedResponse = handler.getResponseStream()
            let output = await readStreamContents(compressedResponse)
            output = decompressData(output, encoding)

            expect(handler.getResponse().headers['Content-Encoding']).toBe(encodingHeader)
            expect(output.toString()).toBe('World!')
        })
    }

    test('response stream of unrecognized accept encoding should return error', async () => {
        const handler = new MockHTTPHandler('GET', '', {
            'Accept-Encoding': 'not_existing'
        })
        handler.handleRequest()
        const response = handler.getResponse()
        const output = await readStreamContents(response)
        expect(response.statusCode).toEqual(400)
        expect(output.toString()).toEqual(JSON.stringify({
            'error': 'Unsupported encoding: not_existing'
        }))
    });

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
            const decompressedRequest = handler.getRequestStream()
            let output = await readStreamContents(decompressedRequest)
            expect(output.toString()).toBe(expected)
        })
    });

    test('request stream of unrecognized content encoding should return error', async () => {
        const handler = new MockHTTPHandler('GET', '', {
            'Content-Encoding': 'not_existing'
        })
        handler.handleRequest()
        const response = handler.getResponse()
        const output = await readStreamContents(response)
        expect(response.statusCode).toEqual(400)
        expect(output.toString()).toEqual(JSON.stringify({
            'error': 'Unsupported encoding: not_existing'
        }))
    });

    ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'SOMETHING_ELSE'].forEach(method => {
        test(`should respond with 405 to ${method} method`, () => {
            const response = new MockResponse()
            const handler = new HTTPHandler(new MockRequest(method, '', {}), response)
            handler.handleRequest()
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
        const response = handler.getResponseStream()
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

    getRequestStream() {
        return this._requestStream
    }

    getResponse() {
        return this._response
    }

    getResponseStream() {
        return this._responseStream
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

}

/**
 * A mock for the actual response object offered
 * by the {@link http} module.
 */
class MockResponse {
    statusCode
    headers
    body = new PassThrough()

    writeHead(statusCode, headers) {
        this.statusCode = statusCode
        this.headers = headers
    }

    on(event, callback) {
        return this.body.on(event, callback)
    }

    pipe(stream) {
        return this.body.pipe(stream)
    }

    write(body) {
        return this.body.write(Buffer.from(body))
    }

    end() {
        return this.body.end()
    }

}
