const http = require('http');

class GyozaServer {
    #port;

    constructor(port = 21125) {
        this.#port = port;
    }

    start() {
        http.createServer((request, response) =>
            this._handle_request(request, response))
            .listen(this.#port);
    }

    _handle_request(request, response) {
        const method = request.method;
        const path = request.url;
        const headers = request.headers;

        switch (method) {
            case 'GET': return this._get(path, headers, request, response);
            case 'POST': return this._post(path, headers, request, response);
            case 'PUT': return this._put(path, headers, request, response);
            case 'PATCH': return this._patch(path, headers, request, response);
            case 'DELETE': return this._delete(path, headers, request, response);
            case 'HEAD': return this._head(path, request, response);
            default: this._response(response, 405);
        }
    }

    _get(path, headers, request, response) {
        this._response(response, 405)
    }

    _post(path, headers, request, response) {
        this._response(response, 405)
    }

    _put(path, headers, request, response) {
        this._response(response, 405)
    }

    _patch(path, headers, request, response) {
        this._response(response, 405)
    }

    _delete(path, headers, request, response) {
        this._response(response, 405)
    }

    _head(path, headers, request, response) {
        this._response(response, 405)
    }

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