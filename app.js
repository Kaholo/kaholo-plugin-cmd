const childProcess = require("child_process");
const path = require("path");
const {
  pathExists,
  isFile,
  handleChildProcess,
  ERROR_MESSAGES,
  promiseQueue,
  readKeyFile,
  createSSHConnection,
  executeOverSSH,
  handleCommandOutput,
} = require("./helpers");

async function execute({ params }) {
  const {
    COMMANDS: command,
    workingDir,
  } = params;
  const shell = params.shell ?? "default";
  const finishSignal = params.finishSignal ?? "exit";

  const execOptions = {
    cwd: workingDir || null,
  };
  if (shell !== "default") {
    execOptions.shell = shell;
  }

  const proc = childProcess.exec(command, execOptions);

  const chunks = await handleChildProcess(proc, {
    verifyExitCode: true,
    finishSignal,
  });

  return handleCommandOutput(chunks);
}

async function remoteCommandExecute({ params }) {
  const {
    REMOTE_ADDRESS: host,
    sshKey,
    COMMANDS: cmd,
    REMOTE_USER: username,
    KEY_PATH: keyPath,
    keyPassphrase: passphrase,
  } = params;
  const port = params.port ?? 22;

  if (!sshKey && !keyPath) {
    throw ERROR_MESSAGES.PRIVATE_KEY_REQUIRED;
  }

  const privateKey = sshKey ? Buffer.from(sshKey) : await readKeyFile(keyPath);

  const sshClient = await createSSHConnection({
    host,
    port,
    privateKey,
    username,
    passphrase,
  });

  const chunks = await executeOverSSH(sshClient, cmd);
  return handleCommandOutput(chunks);
}

async function executeSingleCommand(command, options = {}) {
  const proc = childProcess.exec(command, options);

  const chunks = await handleChildProcess(proc);
  return handleCommandOutput(chunks);
}

function executeMultipleCommands(commands) {
  return promiseQueue(
    commands.map((command) => (
      () => executeSingleCommand(command)
    )),
  );
}

async function getWindowsSessionId() {
  const res = await executeSingleCommand("tasklist /fi \"imagename eq explorer.exe\" /FO CSV");
  const lines = res.split("\n");
  const columns = lines[0].split(",");
  const sessionColumn = columns.findIndex((col) => col === "\"Session#\"");

  if (sessionColumn === -1) {
    throw ERROR_MESSAGES.SESSION_NOT_FOUND;
  }

  const sessionString = lines[1].split(",")[sessionColumn];
  const sessionNumber = parseInt(sessionString.slice(1, -1), 10);
  if (Number.isNaN(sessionNumber)) {
    throw ERROR_MESSAGES.SESSION_NOT_FOUND;
  }

  return sessionNumber;
}

async function executeInteractiveWindowsCommand({ params }) {
  const { command, workingDirectory } = params;

  if (!command) {
    throw ERROR_MESSAGES.COMMAND_NOT_SPECIFIED;
  }

  const sessionId = await getWindowsSessionId();
  const paexecPath = path.join(__dirname, "paexec.exe");
  const args = [
    paexecPath,
    "-s",
    "-i",
    sessionId,
  ];

  if (workingDirectory) {
    args.push("-w", workingDirectory);
  }

  args.push("cmd /c", command);

  return executeSingleCommand(args.join(" "));
}

function executeMultiple({ params }) {
  const { numberOfTime, COMMANDS } = params;
  // create an empty array of given size and fill it with the command to repeat
  const commands = new Array(+numberOfTime).fill(COMMANDS);
  return executeMultipleCommands(commands);
}

async function executeScript({ params }) {
  const { path: scriptPath } = params;
  const absoluteScriptPath = path.resolve(scriptPath);
  // check if script exists
  if (!await pathExists(absoluteScriptPath)) {
    throw ERROR_MESSAGES.PATH_DOES_NOT_EXIST;
  }
  // check if path is a file
  if (!await isFile(absoluteScriptPath)) {
    throw ERROR_MESSAGES.PATH_IS_NOT_FILE;
  }

  // change script's mode to allow for execution
  const changeModeCommandProcess = childProcess.exec("chmod +x $SCRIPT_PATH", {
    env: {
      SCRIPT_PATH: absoluteScriptPath,
    },
  });
  await handleChildProcess(changeModeCommandProcess);

  // create child process
  const proc = childProcess.execFile(absoluteScriptPath);

  // handle stderr & stdout output from child process
  const chunks = await handleChildProcess(proc);
  return handleCommandOutput(chunks);
}

module.exports = {
  execute,
  remoteCommandExecute,
  executeMultiple,
  executeInteractiveWindowsCommand,
  executeScript,
};
