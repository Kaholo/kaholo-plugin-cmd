const { ChildProcess } = require('node:child_process')
const { access, lstat } = require('node:fs/promises')

function joinCommand(command) {
  const output = command.split('\n').map((item) => item.trim()).join('  ')
  return output
}

/**
 * Checks if given path exists
 * @param {string} path
 * @returns {boolean}
 */
async function pathExists(path) {
  try { await access(path) } catch { return false }
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
  return new Promise((res, rej) => {
    const resolver = (code) => {
      if (options.verifyExitCode && code !== 0) rej(`${ERROR_MESSAGES.SCRIPT_FINISHED_WITH_ERROR} Code = ${code}.\n${chunks.join('')}`)
      else res(chunks.join(''))
    }
    const chunks = []
    childProcess.stdout.on('data', (chunk) => chunks.push(chunk))
    childProcess.stderr.on('data', (chunk) => chunks.push(chunk))
    if (options.finishSignal === 'close') childProcess.on('close', resolver)
    else childProcess.on('exit', resolver)
    childProcess.on('error', rej)
  })
}

/**
 * Handles common child process errors
 * @param {Error} error
 */
function handleCommonErrors(error) {
  const message = error.message || String(error)
  if (message.includes('EACCES')) throw ERROR_MESSAGES.SCRIPT_ACCESS_ERROR
  throw error
}

/**
 * Common errors messages
 */
const ERROR_MESSAGES = {
  PATH_DOES_NOT_EXIST: 'Given path does not exist',
  SCRIPT_ACCESS_ERROR: 'Access to the script was denied. Make sure the file is executable.',
  PATH_IS_NOT_FILE: 'Given path is not a file.',
  SCRIPT_FINISHED_WITH_ERROR: 'Script finished with error.'
}

module.exports = {
  joinCommand,
  pathExists,
  isFile,
  handleChildProcess,
  handleCommonErrors,
  ERROR_MESSAGES,
}
