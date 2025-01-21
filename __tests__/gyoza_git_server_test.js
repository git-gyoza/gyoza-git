const {PassThrough} = require('stream')

const {GyozaServerError} = require("../src/gyoza_server")
const {parseGitPath, GitHTTPHandler} = require('../src/gyoza_git_server')

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

    getResponse() {
        return this._response
    }

    backend(error, service) {
        super._backend(error, service)
    }

}

class MockResponseStream extends PassThrough {

}
