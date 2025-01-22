#!/usr/bin/env node
const {NAME, DESCRIPTION, VERSION, REPOSITORIES_DIRECTORY_ENV_NAME} = require('./src/gyoza-git')
const {GyozaGitServer} = require("./src/server/gyoza_git_server");

function usage() {
    console.log(`${NAME} ${VERSION}
${DESCRIPTION}.

Usage: ${NAME} [options]

    -p, --port PORT                 Starts the server with the specified port.
    -d, --directory DIRECTORY       Manually specifies the repositories directory.
    -h, --help                      Show this message

If the -d argument is not specified, a ${REPOSITORIES_DIRECTORY_ENV_NAME} environment variable will be necessary.`)
}

function parseArguments(parsed, args) {
    if (args.length === 0) return

    let argument = args[0]
    if (argument === '-h' || argument === '--help') {
        usage()
        process.exit(0)
    }

    if (args.length === 1) {
        console.log(`You did not specify enough arguments for arguments ${argument}`)
        usage()
        process.exit(1)
    }

    argument = argument.toLowerCase()
    if (argument === '-p') argument = '--port'
    else if (argument === '-d') argument = '--directory'
    else if (argument !== '--port' && argument !== '--directory') {
        console.log(`Invalid argument: ${argument}`)
        usage()
        process.exit(2)
    }

    argument = argument.substring(2, argument.length)
    if (parsed[argument] === undefined) parsed[argument] = args[1]
    parseArguments(parsed, args.slice(2))
}

function main(args) {
    const parsed = new Map()
    parseArguments(parsed, args)

    let port = null
    if (parsed['port'] !== undefined) {
        try {
            port = parsed['port']
            port = Number(port)
            if (port < 1 || port > 65535)
                throw 'Invalid port'
        } catch (error) {
            console.log(`Invalid port "${port}". Expected an integer between 1 and 65535`)
            process.exit(2)
        }
    }

    let repoDirectory
    if (parsed['directory'] !== undefined)
        repoDirectory = parsed['directory']
    else {
        const envVarName = REPOSITORIES_DIRECTORY_ENV_NAME
        repoDirectory = process.env[envVarName]
        if (repoDirectory === undefined) {
            console.log('No repositories directory specified.')
            console.log(`You can specify one by using --directory or by defining the environment variable: ${envVarName}`)
            process.exit(1)
        }
    }

    const server = new GyozaGitServer(repoDirectory)
    if (port == null) server.start()
    else server.start(port)
}

main(process.argv.slice(2))
