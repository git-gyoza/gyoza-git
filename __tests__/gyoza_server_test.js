const { MockGyozaServer, MockResponse } = require('mock_gyoza_server')

describe('GyozaServer tests', () => {

    ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'SOMETHING_ELSE'].forEach(method => {
        test(`should respond with 405 to ${method} method`, () => {
            const server = new MockGyozaServer()
            const response = server.handleRequest(method)
            expect(response.statusCode).toBe(405)
        })
    })

})