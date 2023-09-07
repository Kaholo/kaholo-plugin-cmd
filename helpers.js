const { access, lstat, readFile } = require("fs/promises");
const { Client } = require("ssh2-1200-fix");

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
  PRIVATE_KEY_REQUIRED: "SSH Connection requires private key, pass the key from the vault or path to the file with key.",
};

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

async function readKeyFile(path) {
  if (!await pathExists(path)) {
    throw ERROR_MESSAGES.PATH_DOES_NOT_EXIST;
  }
  if (!await isFile(path)) {
    throw ERROR_MESSAGES.PATH_IS_NOT_FILE;
  }
  return readFile(path, { encoding: "utf-8" });
}

/**
 * @typedef {Object} Options
 * @property {boolean} verifyExitCode
 * @property {"exit" | "close"} finishSignal
 * @property {Function} onProgress
 */
/**
 * Handles the output of the child process
 * @param {import("child_process").ChildProcess} childProcess
 * @param {Options} options
 * @returns {Promise<string>}
 */
function handleChildProcess(childProcess, options = {}) {
  const chunks = [];

  childProcess.stdout.on("data", (chunk) => {
    chunks.push(chunk);
    process.stdout.write(chunk);
  });
  childProcess.stderr.on("data", (chunk) => {
    chunks.push(chunk);
    process.stderr.write(chunk);
  });

  return new Promise((res, rej) => {
    childProcess.on("error", rej);
    childProcess.on(options.finishSignal ?? "exit", (code) => {
      if (options.verifyExitCode && code !== 0) {
        rej(new Error(`${ERROR_MESSAGES.SCRIPT_FINISHED_WITH_ERROR}\nCode = ${code}`));
      } else {
        res(chunks);
      }
    });
  });
}

/**
 * Handles common child process errors
 * @param {Error} error
 */
function handleCommonErrors(error) {
  let message = "";
  if (/^EACCES/i.test(message)) {
    message = ERROR_MESSAGES.SCRIPT_ACCESS_ERROR;
  } else if (message.includes("unsupported key format")) {
    message = ERROR_MESSAGES.INVALID_PRIVATE_KEY;
  } else if (message.includes("configured authentication methods failed")) {
    message = ERROR_MESSAGES.INCORRECT_PRIVATE_KEY;
  } else if (/^ECONNREFUSED/i.test(message)) {
    message = ERROR_MESSAGES.CONNECTION_REFUSED;
  }
  message += `\nOriginal message\n${(error.message || String(error)).toLowerCase()}`;
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
      initiator,
      [results, promiseInitiators.indexOf(initiator), results.length],
    );
    results.push(result);
  }
  /* eslint-enable */
  return results;
}

/**
 * Creates SSH Client
 * @param {import("ssh2").ConnectConfig} connectConfig
 * @returns {Client}
 */
function createSSHConnection(connectConfig) {
  const sshClient = new Client();
  return new Promise((res, rej) => {
    sshClient.connect(connectConfig).on("ready", () => res(sshClient)).on("error", rej);
  });
}

/**
 * Executes commands over SSH Client
 * @param {Client} sshClient
 * @param {string} cmd
 * @param {{ endConnectionAfter: boolean }} options
 */
function executeOverSSH(
  sshClient,
  cmd,
  {
    endConnectionAfter = true,
  } = {},
) {
  return new Promise((res, rej) => {
    sshClient.exec(cmd, (error, channel) => {
      if (error) {
        return rej(error);
      }
      if (endConnectionAfter) {
        channel.on("close", () => sshClient.end());
      }

      // handleChildProcess can be used here because the SSH Stream has the same
      // methods and the same events as the child process
      return handleChildProcess(channel, { finishSignal: "close" }).then(res).catch(rej);
    });
  });
}

function handleCommandOutput(chunks) {
  const jsonChunks = chunks.map(tryParseJson).filter((v) => v !== undefined);

  if (jsonChunks.length === 0) {
    return "";
  }
  if (jsonChunks.length === 1) {
    return jsonChunks[0];
  }
  return jsonChunks;
}

function tryParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

module.exports = {
  pathExists,
  isFile,
  handleChildProcess,
  handleCommonErrors,
  handleCommandOutput,
  promiseQueue,
  readKeyFile,
  createSSHConnection,
  executeOverSSH,
  ERROR_MESSAGES,
};
