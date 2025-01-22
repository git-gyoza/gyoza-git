<p align="center">
  <img src="https://img.shields.io/npm/v/gyoza-git?color=00aa00" alt="">
  <img src="https://img.shields.io/github/actions/workflow/status/git-gyoza/gyoza-git/npm-publish.yml?label=tests" alt="">
  <img src="../badges/badges/coverage-lines.svg" alt="">
</p>

**gyoza-git** allows serving the [git http-backend](https://git-scm.com/docs/git-http-backend) module with a
**HTTP server** in **NodeJS**, essentially creating a **Git repository server**.

| Table of Contents |
|-------------------|
| [Usage](#usage)   |
| [API](#api)       |

# Usage

This is the page shown upon executing `gyoza-git --help`:

```
A Node server with support for the git http-backend CGI program.

Usage: gyoza-git [options]

    -p, --port PORT                 Starts the server with the specified port (2215 by default).
    -d, --directory DIRECTORY       Manually specifies the repositories directory.
    -h, --help                      Show this message

If the -d argument is not specified, a REPOSITORIES_DIRECTORY environment variable will be necessary.`)
```

If the `--port` parameter is not specified, the default value (**2215**) will be chosen.

However, the same cannot be said for `--directory`, which is mandatory **unless specified**:
basically, if it is not specified, the program will look for a **REPOSITORIES_DIRECTORY** environment variable.

This will point **gyoza-git** to the directory where all the available repositories are stored,
therefore it is **crucial** to set an appropriate value correctly.

# API

**gyoza-git** provides an **API** with a fully featured server managing class and the **gyoza-git server app** itself.

- [GyozaServer](../main/src/server/gyoza_server.js) is a basic implementation of a **HTTP server**.
  It uses the **http** module to create a server with the `start` method, and requires a **callback function**
  as parameter constructor that indicates the [HTTPHandler](../main/src/server/gyoza_server.js) that will be created
  and will manage the HTTP request.

  **GyozaServer** supports by default several **content compressions** provided by the **zlib** module: 
  `gzip`, `brotli` and `deflate`; therefore, it is not necessary to manually decode or encode the returned content,
  as this will be automatically done by the server in case a `Content-Encoding` or `Accept-Encoding` header is found.

  When the **HTTPHandler** receives a new request, it will be initialized with several **protected** properties:

  - `request`: the request object;
  - `requestStream`: the actual readable stream of the request body. Automatically decoded in case a `Content-Encoding`
    header has been sent;
  - `response`: the response object;
  - `responseStream`: the actual writable stream of the response body. Automatically encoded in case a `Accept-Encoding`
    header has been sent;
  - `method`: the request method sent by the client;
  - `path`: the path requested (with the query parameters);
  - `headers`: the headers sent by the client;
  - `remoteAddress`: the IP address of the requester.

  All of these are accessible within the **HTTPHandler** class and its **methods**, which are responsible for handling
  the response logic.

  The attach point from **GyozaServer** to **HTTPHandler** is the `handleRequest` method, that will forward requests
  appropriately based on the method (**GET** will be forwarded to `get`, **POST** will be forwarded to `post` and so on);
  all of these methods return **405 Method Not Allowed** by default, as well as the `handleRequest` function in case the
  requested method is not between the most common **HTTP** ones.

  To make use of all this, it is **necessary** to provide a **new implementation of the HTTPHandler class** to the 
  **GyozaServer**, so that the methods logic can be overridden. Here is an example:

  ```javascript
    const {GyozaServer, HTTPHandler} = require('gyoza-git')
    
    class HelloHTTPHandler extends HTTPHandler {
        
        _get() {
            // _reply(statusCode, body, headers, terminate)
            // Only the statusCode is mandatory.
            // If the body is not a String, it will be parsed as JSON.
            // If terminate is set to false, the responseStream will not be closed.
            _reply(200, 'Hello, World!', {
                'Content-Type': 'text/plain'
            })
        }
    
    }
    
    new GyozaServer((req, res) => new HelloHTTPHandler(req, res)).start()
    ```

- [GyozaGitServer](../main/src/server/gyoza_git_server.js), the implementation of [GyozaServer](../main/src/server/gyoza_server.js)
  used by the program to serve `git-http-backend`. Provides a [GitHTTPHandler](../main/src/server/gyoza_git_server.js)
  that overrides `get`, `post`, `put`, `patch` and `head` by forwarding the requests to **git**.
