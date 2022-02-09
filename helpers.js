const { access, lstat } = require("fs/promises");

/**
 * Common errors messages
 */
const ERROR_MESSAGES = {
  PATH_DOES_NOT_EXIST: "Given path does not exist",
  SCRIPT_ACCESS_ERROR: "Access to the script was denied. Make sure the file is executable.",
  PATH_IS_NOT_FILE: "Given path is not a file.",
  SCRIPT_FINISHED_WITH_ERROR: "Script finished with error.",
  COMMAND_NOT_SPECIFIED: "Command not specified.",
  SESSION_NOT_FOUND: "Could not find session.",
  INVALID_PRIVATE_KEY: "SSH Private Key is in the unsupported format.",
  INCORRECT_PRIVATE_KEY: "SSH Private Key is incorrect. Authentication failed.",
  CONNECTION_REFUSED: "Connection refused. Could not connect via SSH.",
};

function joinCommand(command) {
  const output = command.split("\n").map((item) => item.trim()).join(" ; ");
  return output;
}

/**
 * Checks if given path exists
 * @param {string} path
 * @returns {boolean}
 */
async function pathExists(path) {
  try {
    await access(path);
  } catch {
    return false;
  }
  return true;
}

/**
 * Checks if given path is a file
 * @param {string} path
 * @returns {boolean}
 */
async function isFile(path) {
  const stat = await lstat(path);
  return stat.isFile();
}

/**
 * @typedef {Object} Options
 * @property {boolean} verifyExitCode
 * @property {"exit" | "close"} finishSignal
 */
/**
 * Handles the output of the child process
 * @param {import("child_process").ChildProcess} childProcess
 * @param {Options} options
 * @returns {Promise<string>}
 */
function handleChildProcess(childProcess, options = {}) {
  const chunks = [];
  return new Promise((res, rej) => {
    const resolver = (code) => {
      const output = chunks.join("");
      if (options.verifyExitCode && code !== 0) {
        rej(new Error(`${ERROR_MESSAGES.SCRIPT_FINISHED_WITH_ERROR}\nCode = ${code}\nOutput=${output}`));
      } else res(output);
    };

    childProcess.stdout.on("data", (chunk) => chunks.push(chunk));
    childProcess.stderr.on("data", (chunk) => chunks.push(chunk));

    if (options.finishSignal) childProcess.on(options.finishSignal, resolver);
    else childProcess.on("exit", resolver);
    childProcess.on("error", rej);
  });
}

/**
 * Handles common child process errors
 * @param {Error} error
 */
function handleCommonErrors(error) {
  let message = (error.message || String(error)).toLowerCase();
  if (message.includes("eaccess")) message = ERROR_MESSAGES.SCRIPT_ACCESS_ERROR;
  else if (message.includes("unsupported key format")) message = ERROR_MESSAGES.INVALID_PRIVATE_KEY;
  else if (message.includes("configured authentication methods failed")) message = ERROR_MESSAGES.INCORRECT_PRIVATE_KEY;
  else if (message.includes("econnrefused")) message = ERROR_MESSAGES.CONNECTION_REFUSED;
  throw new Error(message);
}

/**
 * Enqueues execution of promises
 * @param {(() => Promise)[]} promiseInitiators
 */
async function promiseQueue(promiseInitiators) {
  const results = [];
  // TODO: Change the way of enqueueing the promises
  /* eslint-disable */
  for (const initiator of promiseInitiators) {
    const result = await initiator.apply(
      initiator, [results, promiseInitiators.indexOf(initiator), results.length]
    );
    results.push(result);
  }
  /* eslint-enable */
  return results;
}

module.exports = {
  joinCommand,
  pathExists,
  isFile,
  handleChildProcess,
  handleCommonErrors,
  promiseQueue,
  ERROR_MESSAGES,
};
