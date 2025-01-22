#!/usr/bin/env node
const {NAME, DESCRIPTION, VERSION, REPOSITORIES_DIRECTORY_ENV_NAME} = require('./src/gyoza-git')

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
