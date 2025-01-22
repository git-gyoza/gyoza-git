![test](../badges/badges/coverage-lines.svg)

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
