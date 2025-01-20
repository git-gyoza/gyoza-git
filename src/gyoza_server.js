const http = require('http');

/**
 * A basic implementation wrapper for the HTTP server provided by the http module.
 */
class GyozaServer {
    #port;

    /**
     * Starts a new {@link http} server.
     * All the requests will be redirected to {@link GyozaServer#_handle_request}.
     *
     * @param port the port where the server will be run on
     */
    start(port = 21125) {
        this.#port = port;
        http.createServer((request, response) =>
            this._handle_request(request, response))
            .listen(this.#port);
    }

    /**
     * Handles all the incoming requests accordingly by redirecting each
     * request to the most appropriate method using the sent HTTP method.
     * If an unrecognized method is used, a 405 'Method Not Allowed' message
     * will be returned.
     *
     * @param request the request object
     * @param response the response object
     * @private
     */
    _handle_request(request, response) {
        const method = request.method;
        const path = request.url;
        const headers = request.headers;

        switch (method) {
            case 'GET':
                return this._get(path, headers, request, response);
            case 'POST':
                return this._post(path, headers, request, response);
            case 'PUT':
                return this._put(path, headers, request, response);
            case 'PATCH':
                return this._patch(path, headers, request, response);
            case 'DELETE':
                return this._delete(path, headers, request, response);
            case 'HEAD':
                return this._head(path, request, response);
            default:
                this._response(response, 405);
        }
    }

    /**
     * Handles all the GET HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @param path the path requested
     * @param headers the headers in the request
     * @param request the request object
     * @param response the response object
     * @private
     */
    _get(path, headers, request, response) {
        this._response(response, 405)
    }

    /**
     * Handles all the POST HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @param path the path requested
     * @param headers the headers in the request
     * @param request the request object
     * @param response the response object
     * @private
     */
    _post(path, headers, request, response) {
        this._response(response, 405)
    }

    /**
     * Handles all the PUT HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @param path the path requested
     * @param headers the headers in the request
     * @param request the request object
     * @param response the response object
     * @private
     */
    _put(path, headers, request, response) {
        this._response(response, 405)
    }

    /**
     * Handles all the PATCH HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @param path the path requested
     * @param headers the headers in the request
     * @param request the request object
     * @param response the response object
     * @private
     */
    _patch(path, headers, request, response) {
        this._response(response, 405)
    }

    /**
     * Handles all the DELETE HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @param path the path requested
     * @param headers the headers in the request
     * @param request the request object
     * @param response the response object
     * @private
     */
    _delete(path, headers, request, response) {
        this._response(response, 405)
    }

    /**
     * Handles all the HEAD HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @param path the path requested
     * @param headers the headers in the request
     * @param request the request object
     * @param response the response object
     * @private
     */
    _head(path, headers, request, response) {
        this._response(response, 405)
    }

    /**
     * Sends a response to the client.
     *
     * @param response the response object
     * @param status_code the HTTP status code to return
     * @param body the body of the response (null by default)
     * @param headers the headers to send
     * @private
     */
    _response(response, status_code, body = null, headers = {}) {
        response.writeHead(status_code, headers);
        if (body != null) {
            if (body instanceof String) response.write(body)
            else response.write(JSON.stringify(body));
        }
        response.end()
    }

}

module.exports = GyozaServer;