const { ChildProcess } = require('node:child_process')
const { access, lstat } = require('node:fs/promises')

function joinCommand(command) {
  const output = command.split('\n').map((item) => item.trim()).join(' ; ')
  return output
}

/**
 * Checks if given path exists
 * @param {string} path
 * @returns {boolean}
 */
async function pathExists(path) {
  try {
    await access(path)
  } catch {
    return false
  }
  return true
}

/**
 * Checks if given path is a file
 * @param {string} path
 * @returns {boolean}
 */
async function isFile(path) {
  const stat = await lstat(path)
  return stat.isFile()
}

/**
 * @typedef {Object} Options
 * @property {boolean} verifyExitCode
 * @property {"exit" | "close"} finishSignal
 */
/**
 * Handles the output of the child process
 * @param {ChildProcess} childProcess
 * @param {Options} options
 * @returns {Promise<string>}
 */
function handleChildProcess(childProcess, options = {}) {
  const chunks = []
  return new Promise((res, rej) => {
    const resolver = (code) => {
      const output = chunks.join('')
      if (options.verifyExitCode && code !== 0) rej({ msg: ERROR_MESSAGES.SCRIPT_FINISHED_WITH_ERROR, exitCode: code, output })
      else res(output)
    }

    childProcess.stdout.on('data', (chunk) => chunks.push(chunk))
    childProcess.stderr.on('data', (chunk) => chunks.push(chunk))

    if (options.finishSignal) childProcess.on(options.finishSignal, resolver)
    else childProcess.on('exit', resolver)
    childProcess.on('error', rej)
  })
}

/**
 * Handles common child process errors
 * @param {Error} error
 */
function handleCommonErrors(error) {
  const message = (error.message || String(error)).toLowerCase()
  if (message.includes('eaccess')) throw ERROR_MESSAGES.SCRIPT_ACCESS_ERROR
  if (message.includes('unsupported key format')) throw ERROR_MESSAGES.INVALID_PRIVATE_KEY
  if (message.includes('configured authentication methods failed')) throw ERROR_MESSAGES.INCORRECT_PRIVATE_KEY
  if (message.includes('econnrefused')) throw { msg: ERROR_MESSAGES.CONNECTION_REFUSED, error }
  throw error
}

/**
 * Enqueues execution of promises
 * @param {(() => Promise)[]} promiseInitiators 
 */
async function promiseQueue(promiseInitiators){
  const results = []
  for (let initiator of promiseInitiators) {
    const result = await initiator.apply(initiator, [results, promiseInitiators.indexOf(initiator), results.length])
    results.push(result)
  }
  return results
}


/**
 * Common errors messages
 */
const ERROR_MESSAGES = {
  PATH_DOES_NOT_EXIST: 'Given path does not exist',
  SCRIPT_ACCESS_ERROR: 'Access to the script was denied. Make sure the file is executable.',
  PATH_IS_NOT_FILE: 'Given path is not a file.',
  SCRIPT_FINISHED_WITH_ERROR: 'Script finished with error.',
  COMMAND_NOT_SPECIFIED: 'Command not specified.',
  SESSION_NOT_FOUND: 'Could not find session.',
  INVALID_PRIVATE_KEY: 'SSH Private Key is in the unsupported format.',
  INCORRECT_PRIVATE_KEY: 'SSH Private Key is incorrect. Authentication failed.',
  CONNECTION_REFUSED: 'Connection refused. Could not connect via SSH.'
}

module.exports = {
  joinCommand,
  pathExists,
  isFile,
  handleChildProcess,
  handleCommonErrors,
  promiseQueue,
  ERROR_MESSAGES
}
