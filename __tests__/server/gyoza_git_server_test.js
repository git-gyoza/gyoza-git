const http = require('http')
const {PassThrough} = require('stream')

const StatusCode = require('../../src/status_codes')
const {GyozaServerError, GyozaServer} = require("../../src/server/gyoza_server")
const {parseGitPath, GitHTTPHandler, GyozaGitServer} = require('../../src/server/gyoza_git_server')
const {readStreamContents} = require("../compression/compress_test")

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

describe('GyozaGitServer integration tests', () => {

    test('it should return 200 on valid request', async () => {
        const server = new GyozaGitServer('.')
        server.start()

        const response = await makeGETRequest({
            hostname: 'localhost',
            port: 21125,
            path: '/info/refs?service=git-upload-pack',
            method: 'GET'
        })

        server.stop()

        expect(response.statusCode).toBe(StatusCode.OK)
    })

})

function makeGETRequest(options) {
    return new Promise((resolve, reject) => {
        http.get(options, (response) => {
            let data = '';
            response.on('data', (chunk) => data += chunk.toString());
            response.on('end', () =>
                resolve({ statusCode: response.statusCode, body: data }))
        }).on('error', (err) => reject(err));
    })
}

describe('GyozaGitServer tests', () => {

    test('start should call on super', () => {
        const server = new GyozaGitServer('.')
        const start = jest.spyOn(GyozaServer.prototype, 'start')
        const port = 18591

        server.start(port)
        server.stop()

        expect(start).toHaveBeenCalledWith(port)
    });

    [__dirname, '.', '../'].forEach((directory) => {
        test(`should not throw on repositories directory: ${directory}`, () => {
            expect(() => new GyozaGitServer(directory)).not.toThrow()
        })
    });

    ['invalid', 'app.js'].forEach((path) => {
        test(`should throw on invalid repositories directory: ${path}`, () => {
            expect(() => new GyozaGitServer(path)).toThrow(GyozaServerError)
        })
    })

})

describe('GitHTTPHandler tests', () => {

    test('backend valid service', async () => {
        const expectedType = 'text/plain'
        const expected = 'Hello, World!'
        const serviceStream = new MockResponseStream()
        const service = {
            action: 'info',
            cmd: 'echo',
            args: [expected],
            type: expectedType,
            createStream: () => serviceStream
        }

        const handler = new MockGitHTTPHandler()
        handler.backend(undefined, service)

        const response = await handler.getResponse()
        expect(response.statusCode).toEqual(StatusCode.OK)
        expect(response.headers['Content-Type']).toEqual(expectedType)

        const data = await readStreamContents(serviceStream)
        expect(data.toString()).toEqual(expected + ' .\n')
    })

    test('backend should return 404 on invalid repository', async () => {
        const handler = new MockGitHTTPHandler('/not/existing')
        handler.backend(undefined, null)

        const response = await handler.getResponse()
        expect(response.statusCode).toEqual(StatusCode.NOT_FOUND)
    });

    test('backend should return 400 on error', async () => {
        const expected = 'Something went wrong'
        const handler = new MockGitHTTPHandler()
        handler.backend(new Error(expected), null)
        const response = await handler.getResponse()
        expect(response.statusCode).toEqual(StatusCode.BAD_REQUEST)
        expect(response.body).toBe(JSON.stringify({'error': expected}))
    });

})

function mockRequest(url = '/') {
    return {
        'request': 'GET',
        'url': url,
        'headers': {},
        'connection': {
            'remoteAddress': '127.0.0.1'
        }
    }
}

class MockGitHTTPHandler extends GitHTTPHandler {

    constructor(url = '/') {
        super(mockRequest(url), new MockResponseStream(), '.');
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

    pipe(stream, options) {
        // do nothing for compatibility reasons
    }

}
