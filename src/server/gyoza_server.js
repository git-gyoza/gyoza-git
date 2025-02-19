const http = require('http')

const {SERVER_NAME, DEFAULT_PORT} = require('../gyoza-git')
const StatusCode = require('../status_codes')
const capitalizeFully = require('../string_utils')
const {decompress, compress} = require('../compression/compress');

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
 * Represents a type of error thrown by {@link GyozaServer}.
 */
class GyozaServerError extends Error {

    constructor(message) {
        super(message)
    }

    static alreadyStarted(port) {
        throw new GyozaServerError(`Server already started on port: ${port}`)
    }

    static notStarted() {
        throw new GyozaServerError(`Server has not been started yet`)
    }

    static invalidDirectory(repoDirectory) {
        throw new GyozaServerError(`Could not find or invalid directory: ${repoDirectory}`)
    }

}

/**
 * A basic implementation wrapper for the HTTP server provided by the http module.
 */
class GyozaServer {

    /**
     * Instantiates a new Gyoza server.
     *
     * @param newHTTPHandler a callback responsible for creating a custom HTTPHandler.
     */
    constructor(newHTTPHandler) {
        this._newHTTPHandler = newHTTPHandler
        this._port = null
        this._internalServer = null
    }

    /**
     * Starts a new {@link http} server.
     * All the requests will be redirected to the {@link HTTPHandler} callback
     * specified in the constructor.
     *
     * If the server has not been started, a {@link GyozaServerError}
     * is thrown.
     *
     * @param port the port where the server will be run on
     */
    start(port = DEFAULT_PORT) {
        if (this._internalServer != null) GyozaServerError.alreadyStarted(port)
        else {
            this._port = port
            this._internalServer = http.createServer((request, response) =>
                this._newHTTPHandler(request, response).handleRequest())
            this._internalServer.listen(this._port)
        }
    }

    /**
     * Stops the previously started {@link http} server.
     *
     * If the server has not been started, a {@link GyozaServerError}
     * is thrown.
     */
    stop() {
        if (this._internalServer != null) {
            this._internalServer.close()
            this._port = null
            this._internalServer = null
        } else GyozaServerError.notStarted()
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
        this._requestStream = request
        this._response = response
        this._responseStream = this._response

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
        try {
            this._log(`${this._remoteAddress} -> ${this._method} ${this._path}`)
            this._requestStream = decompress(this._requestStream, this._headers['Content-Encoding'])

            switch (this._method) {
                case 'GET':
                    this._get()
                    break
                case 'POST':
                    this._post()
                    break
                case 'PUT':
                    this._put()
                    break
                case 'PATCH':
                    this._patch()
                    break
                case 'DELETE':
                    this._delete()
                    break
                case 'HEAD':
                    this._head()
                    break
                default:
                    this._reply(StatusCode.METHOD_NOT_ALLOWED)
            }
        } catch (error) {
            this._error(StatusCode.BAD_REQUEST, error)
        }
    }

    /**
     * Handles all the GET HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @private
     */
    _get() {
        this._reply(StatusCode.METHOD_NOT_ALLOWED)
    }

    /**
     * Handles all the POST HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @private
     */
    _post() {
        this._reply(StatusCode.METHOD_NOT_ALLOWED)
    }

    /**
     * Handles all the PUT HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @private
     */
    _put() {
        this._reply(StatusCode.METHOD_NOT_ALLOWED)
    }

    /**
     * Handles all the PATCH HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @private
     */
    _patch() {
        this._reply(StatusCode.METHOD_NOT_ALLOWED)
    }

    /**
     * Handles all the DELETE HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @private
     */
    _delete() {
        this._reply(StatusCode.METHOD_NOT_ALLOWED)
    }

    /**
     * Handles all the HEAD HTTP requests.
     * By default, returns 405 'Method Not Allowed'.
     *
     * @private
     */
    _head() {
        this._reply(StatusCode.METHOD_NOT_ALLOWED)
    }

    /**
     * Sends a response to the client.
     *
     * @param statusCode the HTTP status code to return
     * @param body the body of the response (null by default)
     * @param headers the headers to send
     * @param terminate if true, will end the response stream
     * @private
     */
    _reply(statusCode, body = null, headers = {}, terminate = true) {
        const tempHeaders = {}
        Object.keys(headers).forEach(key =>
            tempHeaders[capitalizeFully(key.toString())] = headers[key])
        headers = tempHeaders

        try {
            const compressionData = compress(this._responseStream, this._headers['Accept-Encoding'])
            if (compressionData.encoding !== 'identity')
                headers['Content-Encoding'] = compressionData.encoding
            this._responseStream = compressionData.stream
        } catch (error) {
            this._error(StatusCode.BAD_REQUEST, error)
            return
        }

        this.#write(statusCode, headers, body)
        if (terminate) this._responseStream.end()
    }

    /**
     * An alias for {@link #_reply} that signals an error coming from
     * either the client or the server.
     *
     * @param statusCode the status code
     * @param error the error. If it is an instance of {@link Error}, then
     *              the error message will be passed to the body
     * @private
     */
    _error(statusCode, error = 'Unknown error') {
        if (error instanceof Error) error = error.message
        this._log(`Error with request ${this._remoteAddress}(${this._method} ${this._path}): ${error}`)
        this.#write(statusCode, {}, {'error': error})
        this._responseStream.end()
    }

    /**
     * Writes to the response stream the given data.
     *
     * @param statusCode the status code
     * @param headers an object representing the headers
     * @param body if is not null, if the body is a string then it will be returned as is.
     *             Otherwise, it will be wrapped in JSON
     * @private
     */
    #write(statusCode, headers, body) {
        headers['Server'] = SERVER_NAME
        if (body != null) {
            if (typeof body !== 'string') {
                headers['Content-Type'] = 'application/json'
                body = JSON.stringify(body)
            } else headers['Content-Type'] = 'text/plain'
        }
        this._response.writeHead(statusCode, headers)
        this._log(`${this._remoteAddress} <- ${statusCode}`)
        if (body != null) this._responseStream.write(body)
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

module.exports = {GyozaServer, GyozaServerError, HTTPHandler}
