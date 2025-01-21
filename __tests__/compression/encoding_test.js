const Encoder = require('../../src/compression/encoding')

describe('Encoder tests', () => {

    new Map([
        ['gzip', Encoder.GZIP],
        ['deflate', Encoder.DEFLATE],
        ['br', Encoder.BROTLI],
        ['identity', Encoder.IDENTITY]
    ]).forEach((encoder, name) => {
        it(`should return ${encoder} when using valueOf(${name})`, () => {
            expect(Encoder.valueOf(name)).toEqual(encoder)
        })
    })

})
