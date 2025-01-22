const fs = require('fs')

pkg = JSON.parse(fs.readFileSync(`${__dirname}/${'../package.json'}`, 'utf8'))

module.exports = {
    NAME: pkg['name'],
    DESCRIPTION: pkg['description'],
    VERSION: pkg['version'],
    REPOSITORIES_DIRECTORY_ENV_NAME: 'REPOSITORIES_DIRECTORY',
    SERVER_NAME: `${pkg['name']}/${pkg['version']}`,
    DEFAULT_PORT: 2215
}
