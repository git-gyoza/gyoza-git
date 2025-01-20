const GyozaServer = require('./../src/gyoza_server');

/**
 * A mock for the actual {@link GyozaServer}.
 * Provides a {@link MockGyozaServer#handle_request}
 * method for testing purposes.
 */
class MockGyozaServer extends GyozaServer {

    /**
     * Makes the protected method {@link GyozaServer#_handle_request}
     * publicly available.
     *
     * @param method the request method ('GET' by default)
     * @param path the request path ('' by default)
     * @param headers the request headers (empty be default)
     * @returns {MockResponse} the response containing all the data sent
     */
    handle_request(method = 'GET', path = '', headers = {}) {
        const request = {
            'method': method,
            'url': path,
            'headers': headers,
        }
        const response = new MockResponse()
        super._handle_request(request, response)
        return response
    }

}

/**
 * A mock for the actual response object offered
 * by the {@link http} module.
 */
class MockResponse {
    status_code;
    headers;
    body;
    ended = false;

    writeHead(status_code, headers) {
        this.status_code = status_code;
        this.headers = headers;
    }

    write(body) {
        this.body = body;
    }

    end() {
        this.ended = true;
    }

}
