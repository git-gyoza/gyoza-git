const {PassThrough} = require('stream')

const {GyozaServerError} = require("../src/gyoza_server")
const {parseGitPath, GitHTTPHandler} = require('../src/gyoza_git_server')
const {readStreamContents} = require("./compression/compress_test");

function mockRequest() {
    return {
        'request': null,
        'url': null,
        'headers': null,
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

    test('backend should return 400 on error', async () => {
        const expected = 'Something went wrong'
        const handler = new MockGitHTTPHandler()
        handler.backend(new Error(expected), null)
        const response = await handler.getResponse()
        expect(response.statusCode).toEqual(400)
        expect(response.body).toBe(JSON.stringify({'error': expected}))
    })

    test('should not throw on valid repositories directory', () => {
        expect(() =>
            new GitHTTPHandler(mockRequest(), null, '.'))
            .not.toThrow()
    })

    test('should throw on invalid repositories directory', () => {
        expect(() =>
            new GitHTTPHandler(mockRequest(), null, 'invalid'))
            .toThrow(GyozaServerError)
    })

})

class MockGitHTTPHandler extends GitHTTPHandler {

    constructor() {
        super(mockRequest(), new MockResponseStream(), '.');
    }

    async getResponse() {
        return {
            statusCode: this._response.statusCode,
            headers: this._response.headers,
            body: await readStreamContents(this._responseStream)
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
