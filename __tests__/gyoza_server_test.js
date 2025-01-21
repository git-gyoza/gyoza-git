const GyozaServer = require("../src/gyoza_server")
const {SERVER_NAME} = require("../src/gyoza-git")

describe('GyozaServer tests', () => {

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
     * @returns {MockResponse} the response containing all the data sent
     */
    handleRequest(method = 'GET', path = '', headers = {}) {
        const request = {
            'method': method,
            'url': path,
            'headers': headers,
            'connection': {
                'remoteAddress': '127.0.0.1'
            }
        }
        const response = new MockResponse()
        this._handleRequest(request, response)
        return response
    }

    _handleRequest(request, response) {
        if (request.method === 'HEADERS')
            super._response(request, response, 200, null, request.headers)
        else super._handleRequest(request, response)
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

module.exports = { MockGyozaServer, MockResponse }