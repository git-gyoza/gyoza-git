const http = require('http')

const { SERVER_NAME } = require("./gyoza-git")
const capitalizeFully = require('./string_utils')
const {decompress, compress} = require("./compression/compress");

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
    #newHTTPHandler

    /**
     * Instantiates a new Gyoza server.
     *
     * @param newHTTPHandler a callback responsible for creating a custom HTTPHandler.
     */
    constructor(newHTTPHandler = (request, response) => new HTTPHandler(request, response)) {
        this.#newHTTPHandler = newHTTPHandler
    }

    /**
     * Starts a new {@link http} server.
     * All the requests will be redirected to {@link GyozaServer#_handleRequest}.
     *
     * @param port the port where the server will be run on
     */
    start(port = 21125) {
        this.#port = port
        http.createServer((request, response) =>
            this.#newHTTPHandler(request, response))
            .listen(this.#port)
    }

}

/**
 * A Handler for HTTP requests sent from a client.
 */
class HTTPHandler {

    /**
     * Instantiates a new HTTPHandler.
     *
     * @param request the request object
     * @param response the response object
     */
    constructor(request, response) {
        this._request = request
        this._response = response

        this._method = request.method
        this._path = request.url
        this._headers = request.headers

        this._remoteAddress = getIp(request)
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
        this._log(`${this._remoteAddress} -> ${this._method} ${this._path}`)
        this._request = decompress(this._request, this._headers['Content-Encoding'])

        switch (this._method) {
            case 'GET':
                return this._get()
            case 'POST':
                return this._post()
            case 'PUT':
                return this._put()
            case 'PATCH':
                return this._patch()
            case 'DELETE':
                return this._delete()
            case 'HEAD':
                return this._head()
            default:
                this._reply(405)
        }
    }

    /**
     * Handles all the GET HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @private
     */
    _get() {
        this._reply(405)
    }

    /**
     * Handles all the POST HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @private
     */
    _post() {
        this._reply(405)
    }

    /**
     * Handles all the PUT HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @private
     */
    _put() {
        this._reply(405)
    }

    /**
     * Handles all the PATCH HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @private
     */
    _patch() {
        this._reply(405)
    }

    /**
     * Handles all the DELETE HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @private
     */
    _delete() {
        this._reply(405)
    }

    /**
     * Handles all the HEAD HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @private
     */
    _head() {
        this._reply(405)
    }

    /**
     * Sends a response to the client.
     *
     * @param statusCode the HTTP status code to return
     * @param body the body of the response (null by default)
     * @param headers the headers to send
     * @private
     */
    _reply(statusCode, body = null, headers = {}) {
        const tempHeaders = {}
        Object.keys(headers).forEach(key =>
            tempHeaders[capitalizeFully(key.toString())] = headers[key])
        headers = tempHeaders
        headers['Server'] = SERVER_NAME

        const compressionData = compress(this._response, this._headers['Accept-Encoding'])
        if (compressionData.encoding !== 'identity')
            headers['Content-Encoding'] = compressionData.encoding
        this._response = compressionData.stream

        this._response.writeHead(statusCode, headers)
        this._log(`${this._remoteAddress} <- ${statusCode}`)
        if (body != null) {
            if (typeof body === 'string') this._response.write(body)
            else this._response.write(JSON.stringify(body))
        }
        this._response.end()
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

module.exports = {GyozaServer, HTTPHandler}
