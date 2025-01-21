const spawn = require('child_process').spawn
const backend = require('git-http-backend')

const GyozaServer = require('./gyoza_server')

/**
 * An implementation of {@link GyozaServer} that works with git-http-backend.
 */
class GyozaGitServer extends GyozaServer {
    #repoDirectory

    /**
     * Instantiates a new Gyoza git server.
     *
     * @param repoDirectory the directory where the repositories will be stored
     */
    constructor(repoDirectory) {
        super();
        this.#repoDirectory = repoDirectory;
    }

    start(port = 21125) {
        console.log(`Starting gyoza-git server on port ${port} with repositories directory: ${this.#repoDirectory}`)
        super.start(port);
    }

    _get(path, headers, request, response) {
        const gitBackend = this._backend(path, request, response)
        request.pipe(gitBackend)
        gitBackend.pipe(response)
    }

    _backend(path, request, response) {
        const requestedDirectory = `${this.#repoDirectory}/${path}`
        return backend(path, (error, service) => {
            if (error)
                super._response(response, 400, {
                    'error': error,
                    'type': error.constructor.name
                })
            else {
                super._response(response, 200, null, {
                    'Content-Type': service.type
                }, false)

                const args = [...service.args, requestedDirectory]
                const process = spawn(service.cmd, args)
                const serviceStream = service.createStream()
                process.stdout.pipe(serviceStream)
                serviceStream.pipe(process.stdin)
            }
        })
    }

}

new GyozaGitServer('/home/smith/gitserver').start()
