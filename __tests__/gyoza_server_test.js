const {PassThrough} = require('stream')

const {HTTPHandler} = require("../src/gyoza_server")
const {SERVER_NAME} = require("../src/gyoza-git")

describe('HTTPHandler tests', () => {

    test('request stream should be decompressed', () => {
        const expected = 'Hello, World!'
        let buffer = Buffer.from(expected)
        const handler = new MockHTTPHandler('GET', '', {
            'Content-Encoding': 'identity',
            'Body': true
        }, buffer)
        handler.handleRequest()
        const response = handler.getResponse()
        expect(response.body).toBe(expected)
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

    getResponse() {
        return this._response
    }

    handleRequest() {
        if (this._request.method === 'HEADERS')
            super._reply(200, null, this._request.headers)
        else super.handleRequest()
    }

    _get() {
        if (this._headers['Body']) super._reply(200, this._request.read().toString())
        else super._get()
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
    body
    ended = false

    writeHead(statusCode, headers) {
        this.statusCode = statusCode
        this.headers = headers
    }

    write(body) {
        this.body = body
    }

    end() {
        this.ended = true
    }

}
