module.exports = {
    ...require('./src/compression/compress'),
    ...require('./src/server/gyoza_server'),
    ...require('./src/server/gyoza_git_server'),
    ...require('./src/status_codes'),
    ...require('./src/string_utils'),
}
