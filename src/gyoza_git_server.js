const spawn = require('child_process').spawn
const backend = require('git-http-backend')

const {GyozaServer, HTTPHandler} = require('./gyoza_server')

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
        this.#repoDirectory = repoDirectory
    }

    _get() {
        const directory = this.#repoDirectory
        const gitBackend = backend(directory, this._backend)
        this._request.pipe(gitBackend).pipe(this._responseStream)
    }

    _backend(error, service) {
        if (error) {
            super._reply(400, {
                error: error,
                errorName: error.name,
            })
        }
    }

}

new GyozaGitServer('/home/smith/gitserver/falafel').start()
