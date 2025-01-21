const {PassThrough} = require('stream')

const {GyozaServerError} = require("../src/gyoza_server")
const {parseGitPath, GitHTTPHandler} = require('../src/gyoza_git_server')
const {readStreamContents} = require("./compression/compress_test");

function mockRequest() {
    return {
        'request': 'GET',
        'url': '/',
        'headers': {},
        'connection': {
            'remoteAddress': '127.0.0.1'
        }
    }
}

describe('parseGitPath tests', () => {
    [
        '/path/',
        '/path/HEAD',
        '/path/info/refs',
        '/path/info/refs?service=git-upload-pack',
        '/path/git-upload-pack',
        '/path/git-receive-pack',
        '/path/objects/',
        '/path/objects/info',
        '/path/objects/refs',
        '/path/objects/refs/objects/info/objects/refs'
    ].forEach((path) => {
        test(`it should correctly strip ${path}`, () => {
            expect(parseGitPath(path)).toEqual('/path')
        })
    })
})

describe('GitHTTPHandler tests', () => {

    test('backend valid service', async () => {
        const expectedType = 'text/plain'
        const expected = 'Hello, World!'
        const handler = new MockGitHTTPHandler()
        handler.backend(undefined, {

        })
        const response = await handler.getResponse()
        expect(response.statusCode).toEqual(200)
        expect(response.headers['Content-Type']).toEqual(expectedType)
        expect(response.body).toBe(expected + '\n')
    })

    test('backend should return 400 on error', async () => {
        const expected = 'Something went wrong'
        const handler = new MockGitHTTPHandler()
        handler.backend(new Error(expected), null)
        const response = await handler.getResponse()
        expect(response.statusCode).toEqual(400)
        expect(response.body).toBe(JSON.stringify({'error': expected}))
    });

    [__dirname, '.', '../'].forEach((directory) => {
        test(`should not throw on repositories directory: ${directory}`, () => {
            expect(() =>
                new GitHTTPHandler(mockRequest(), null, directory))
                .not.toThrow()
        })
    });

    ['invalid', 'app.js'].forEach((path) => {
        test(`should throw on invalid repositories directory: ${path}`, () => {
            expect(() =>
                new GitHTTPHandler(mockRequest(), null, path))
                .toThrow(GyozaServerError)
        })
    })

})

class MockGitHTTPHandler extends GitHTTPHandler {

    constructor() {
        super(mockRequest(), new MockResponseStream(), '.');
    }

    async getResponse() {
        this._responseStream.end()
        return {
            statusCode: this._response.statusCode,
            headers: this._response.headers,
            body: (await readStreamContents(this._responseStream)).toString()
        }
    }

    backend(error, service) {
        super._backend(error, service)
    }

    _log(message) {
        // Prevents useless logging
    }

}

class MockResponseStream extends PassThrough {
    statusCode = null
    headers = null

    writeHead(statusCode, headers) {
        this.statusCode = statusCode
        this.headers = headers
    }

}
