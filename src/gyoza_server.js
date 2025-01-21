const http = require('http')

const { SERVER_NAME } = require("./gyoza-git")
const capitalizeFully = require('./string_utils')
const {decompress} = require("./compression/compress");

/**
 * Gets the client IP from the given request.
 *
 * @param request the request
 * @returns {String} the ip
 */
function getIp(request) {
    let ip = request.connection.remoteAddress
    ip = ip.split(':')
    return ip[ip.length - 1]
}

/**
 * A basic implementation wrapper for the HTTP server provided by the http module.
 */
class GyozaServer {
    #port

    /**
     * Starts a new {@link http} server.
     * All the requests will be redirected to {@link GyozaServer#_handleRequest}.
     *
     * @param port the port where the server will be run on
     */
    start(port = 21125) {
        this.#port = port
        http.createServer((request, response) =>
            this._handleRequest(request, response))
            .listen(this.#port)
    }

    /**
     * Delegates the handling of an HTTP request
     * to a new HTTPHandler.
     *
     * @param request the request object
     * @param response the response object
     * @returns {HTTPHandler} the handler
     * @private
     */
    _handleRequest(request, response) {
        return new HTTPHandler(request, response)
    }

}

/**
 * A Handler for HTTP requests sent from a client.
 */
class HTTPHandler {
    #request
    #response

    #method
    #path
    #headers

    #clientIp

    /**
     * Instantiates a new HTTPHandler.
     *
     * @param request the request object
     * @param response the response object
     */
    constructor(request, response) {
        this.#request = request
        this.#response = response

        this.#method = request.method
        this.#path = request.url
        this.#headers = request.headers

        this.#clientIp = getIp(request)
    }

    /**
     * Handles all the incoming requests accordingly by redirecting each
     * request to the most appropriate method using the sent HTTP method.
     * If an unrecognized method is used, a 405 'Method Not Allowed' message
     * will be returned.
     *
     * @private
     */
    handleRequest() {
        const request = this.#request
        const response = this.#response
        const method = this.#method
        const path = this.#path
        const headers = this.#headers

        this._log(`${this.#clientIp} -> ${method} ${path}`)
        this.request = decompress(this.request, headers['Content-Encoding'])

        switch (method) {
            case 'GET':
                return this._get(path, headers, request, response)
            case 'POST':
                return this._post(path, headers, request, response)
            case 'PUT':
                return this._put(path, headers, request, response)
            case 'PATCH':
                return this._patch(path, headers, request, response)
            case 'DELETE':
                return this._delete(path, headers, request, response)
            case 'HEAD':
                return this._head(path, headers, request, response)
            default:
                this._response(request, response, 405)
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
        this._response(request, response, 405)
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
        this._response(request, response, 405)
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
        this._response(request, response, 405)
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
        this._response(request, response, 405)
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
        this._response(request, response, 405)
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
        this._response(request, response, 405)
    }

    /**
     * Sends a response to the client.
     *
     * @param statusCode the HTTP status code to return
     * @param body the body of the response (null by default)
     * @param headers the headers to send
     * @private
     */
    _response(statusCode, body = null, headers = {}) {
        const tempHeaders = {}
        Object.keys(headers).forEach(key =>
            tempHeaders[capitalizeFully(key.toString())] = headers[key])
        headers = tempHeaders
        headers['Server'] = SERVER_NAME

        this.#response.writeHead(statusCode, headers)
        this._log(`${this.#clientIp} <- ${statusCode}`)
        if (body != null) {
            if (body instanceof String) this.#response.write(body)
            else this.#response.write(JSON.stringify(body))
        }
        this.#response.end()
    }

    /**
     * Properly logs the given message to standard output.
     *
     * @param message the message
     * @private
     */
    _log(message) {
        const formatNumber = (number) => {
            let string = number.toString()
            return (string.length === 1 ? '0' : '') + string;
        }

        const now = new Date()
        let dateFormat = `${formatNumber(now.getDay())}-${formatNumber(now.getMonth() + 1)}-${now.getFullYear()} `
        dateFormat += `${formatNumber(now.getHours())}:${formatNumber(now.getMinutes())}:${formatNumber(now.getSeconds())}`

        console.log(`[${dateFormat}] - ${message}`)
    }

}

module.exports = GyozaServer