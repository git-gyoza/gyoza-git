const {parseGitPath} = require('../src/gyoza_git_server')

describe('parseGitPath tests', () => {
    [
        '/path/',
        '/path/HEAD',
        '/path/info/refs',
        '/path/info/refs?service=git-upload-pack',
        '/path/git-upload-pack',
        '/path/git-receive-pack',
        '/path/objects/',
        '/path/objects/info',
        '/path/objects/refs',
        '/path/objects/refs/objects/info/objects/refs'
    ].forEach((path) => {
        test(`it should correctly strip ${path}`, () => {
            expect(parseGitPath(path)).toEqual('/path')
        })
    })
})