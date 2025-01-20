/**
 * Capitalizes all the words of a string separated by '-'.
 *
 * @param string the string to capitalize
 * @returns {String} the formatted string
 */
function capitalizeFully(string) {
    return string.split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
        .join('-')
}

module.exports = capitalizeFully