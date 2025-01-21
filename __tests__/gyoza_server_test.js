const {PassThrough} = require('stream')

const GyozaServer = require("../src/gyoza_server")
const {SERVER_NAME} = require("../src/gyoza-git")

describe('GyozaServer tests', () => {

    test('request stream should be decompressed', () => {
        const server = new MockGyozaServer()
        const response = server.handleRequest('GET', '', {
            'Content-Encoding': 'gzip'
        })
        expect(response.body).toBe('Hello, World!')
    });

    ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'SOMETHING_ELSE'].forEach(method => {
        test(`should respond with 405 to ${method} method`, () => {
            const server = new MockGyozaServer()
            const response = server.handleRequest(method)
            expect(response.statusCode).toBe(405)
        })
    })

    test('headers should be formatted and have Server key', () => {
        const headers = {
            'cONTENT-lENGTH': 10,
            true: false,
            'string': 'hello world'
        }
        const server = new MockGyozaServer()
        const response = server.handleRequest('HEADERS', '', headers)
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
 * A mock for the actual {@link GyozaServer}.
 * Provides a {@link MockGyozaServer#handleRequest}
 * method for testing purposes.
 */
class MockGyozaServer extends GyozaServer {

    /**
     * Makes the protected method {@link GyozaServer#_handleRequest}
     * publicly available.
     *
     * @param method the request method ('GET' by default)
     * @param path the request path ('' by default)
     * @param headers the request headers (empty be default)
     * @param body the request body
     * @returns {MockResponse} the response containing all the data sent
     */
    handleRequest(method = 'GET', path = '', headers = {}, body = null) {
        const request = new MockRequest(method, path, headers, body)
        const response = new MockResponse()
        this._handleRequest(request, response)
        return response
    }

    _handleRequest(request, response) {
        if (request.method === 'HEADERS')
            super._response(request, response, 200, null, request.headers)
        else super._handleRequest(request, response)
    }

    _get(path, headers, request, response) {
        if (headers['Body'])
            super._response(request, response, 200, request.read().toString())
        else super._get(path, headers, request, response)
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

module.exports = {MockGyozaServer, MockResponse}