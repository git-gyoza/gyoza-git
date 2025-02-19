const fs = require('fs')
const backend = require('git-http-backend')
const spawn = require('child_process').spawn

const {DEFAULT_PORT} = require('../../src/gyoza-git')
const StatusCode = require('../status_codes')
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
        if (fs.existsSync(repoDirectory) && fs.lstatSync(repoDirectory).isDirectory())
            this.#repoDirectory = repoDirectory
        else GyozaServerError.invalidDirectory(repoDirectory)
    }

    start(port = DEFAULT_PORT) {
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
        this.#repoDirectory = repoDirectory
    }

    _get = this._run_backend
    _post = this._run_backend
    _put = this._run_backend
    _patch = this._run_backend
    _head = this._run_backend

    _run_backend() {
        const gitBackend = backend(this._path, (error, service) => this._backend(error, service))
        this._requestStream.pipe(gitBackend)
        gitBackend.pipe(this._responseStream)
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
        if (error != null) super._error(StatusCode.BAD_REQUEST, error)
        else {
            const strippedPath = parseGitPath(this._path)
            const actualDirectory = `${this.#repoDirectory}${strippedPath}`
            if (!fs.existsSync(actualDirectory) || !fs.lstatSync(actualDirectory).isDirectory())
                super._error(StatusCode.NOT_FOUND, `Could not find repository ${strippedPath}`)
            else {
                super._log(`${this._remoteAddress} (${strippedPath}) => ${service.action}(${service.cmd})`)

                super._reply(StatusCode.OK, null, {
                    'Content-Type': service.type
                }, false)

                const args = [...service.args, actualDirectory]
                const process = spawn(service.cmd, args)
                const serviceStream = service.createStream()
                serviceStream.pipe(process.stdin)
                process.stdout.pipe(serviceStream)
            }
        }
    }

}

module.exports = {GyozaGitServer, GitHTTPHandler, parseGitPath}
