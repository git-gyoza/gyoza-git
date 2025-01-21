const fs = require('fs')

pkg = JSON.parse(fs.readFileSync(`${__dirname}/${'../package.json'}`, 'utf8'))

module.exports = {
    VERSION: pkg['version'],
    SERVER_NAME: `${pkg['name']}/${pkg['version']}`,
    DEFAULT_PORT: 22125
}
