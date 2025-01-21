const backend = require('git-http-backend')

const GyozaServer = require('gyoza_server')

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
        //TODO:
        super._get(path, headers, request, response);
    }

}
