const fs = require('fs');
const path = require('path');

pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

module.exports = {
    VERSION: pkg['version'],
    SERVER_NAME: `${pkg['name']}/${pkg['version']}`,
}
