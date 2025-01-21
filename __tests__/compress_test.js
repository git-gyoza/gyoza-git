const decompress = require('../src/compress')

class MockStream extends ReadableStream {

}

describe('tests for decompression', () => {

    function stream () {
        return new MockStream()
    }

    new Map([
        [undefined, stream()],
        [null, stream()],
        ['', stream()],
        ['gzip', stream('gzip')],
        ['gzip, deflate', stream('deflate', 'gzip')]
    ]).forEach((stream, encoding) => {
        test(`should correctly decode ${encoding}`, () => {
            decompress(stream, encoding).on('data', data => {
                expect(data).toEqual('Hello, World!')
            })
        })
    })

    new Map([
        ['invalid', stream()],
        ['gzip, invalid', stream('gzip')]
    ]).forEach((stream, encoding) => {
        test(`should throw error on invalid encoding ${encoding}`, () => {
            expect(() => decompress(stream, encoding)).toThrow()
        })
    })

});
