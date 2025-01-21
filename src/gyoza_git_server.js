const fs = require('fs')
const backend = require('git-http-backend')
const spawn = require('child_process').spawn

const {GyozaServer, HTTPHandler, GyozaServerError} = require('./gyoza_server')

/**
 * Strips out from the given path the common requests
 * expecting from valid Git requests (like 'info', 'objects'
 * and more).
 *
 * @param path the path to parse
 * @returns {String} the stripped path. If invalid, undefined is returned
 */
function parseGitPath(path) {
    let regex = /\/(?:(?:HEAD|info\/refs|objects\/(.*)|git-(upload|receive)-pack)(?:\?.*)?)?$/
    return path.replace(regex, '')
}

/**
 * An implementation of {@link GyozaServer} that works with git-http-backend.
 */
class GyozaGitServer extends GyozaServer {
    #repoDirectory

    /**
     * Instantiates a new Gyoza git server using a {@link GitHTTPHandler} as handler.
     *
     * @param repoDirectory the directory where the repositories will be stored
     */
    constructor(repoDirectory) {
        super((request, response) => new GitHTTPHandler(request, response, repoDirectory))
        this.#repoDirectory = repoDirectory
    }

    start(port = 21125) {
        console.log(`Starting gyoza-git server on port ${port} with repositories directory: ${this.#repoDirectory}`)
        super.start(port)
    }

}

/**
 * An implementation of {@link HTTPHandler} that works with git-http-backend.
 */
class GitHTTPHandler extends HTTPHandler {
    #repoDirectory

    /**
     * Instantiates a new Gyoza git server.
     *
     * @param request the request object
     * @param response the response object
     * @param repoDirectory the directory where the repositories will be stored
     */
    constructor(request, response, repoDirectory) {
        super(request, response)
        if (fs.existsSync(repoDirectory) && fs.lstatSync(repoDirectory).isDirectory())
            this.#repoDirectory = repoDirectory
        else GyozaServerError.invalidDirectory(repoDirectory)
    }

    _get() {
        const gitBackend = backend(this._path, (error, service) => this._backend(error, service))
        this._requestStream.pipe(gitBackend).pipe(this._responseStream)
    }

    /**
     * Provides a callback function for the Git HTTP backend process.
     *
     * @param error if not undefined, it means that an error occurred and a 400 error will be returned
     * @param service the actual object service, responsible for parsing the request and piping it
     *                to the <code>git http-backend</code> command
     * @private
     */
    _backend(error, service) {
        if (error != null) super._error(400, error)
        else {
            const strippedPath = parseGitPath(this._path)
            super._log(`${this._remoteAddress} (${strippedPath}) => ${service.action}(${service.cmd})`)

            super._reply(200, null, {
                'Content-Type': service.type
            }, false)

            const args = [...service.args, `${this.#repoDirectory}${strippedPath}`]
            const process = spawn(service.cmd, args)
            const serviceStream = service.createStream()
            process.stdout.pipe(serviceStream).pipe(process.stdin)
        }
    }

}

module.exports = {GyozaGitServer, GitHTTPHandler, parseGitPath}
