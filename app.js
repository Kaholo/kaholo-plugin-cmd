const childProcess = require("child_process");
const path = require('path');
const sshExec = require('ssh-exec');
const { joinCommand, pathExists, isFile, handleChildProcess, handleCommonErrors, ERROR_MESSAGES, promiseQueue } = require("./helpers")

function execute({ params }){

	// destructure the params with default values
	const { COMMANDS, workingDir, shell = "default", finishSignal = "exit" } = params

	const command = joinCommand(COMMANDS);
	const execOptions = {
		cwd: workingDir || null
	}
	if (shell !== "default") execOptions.shell = shell;
		
	const proc = childProcess.exec(command, execOptions)

	return handleChildProcess(proc, { verifyExitCode: true, finishSignal }).catch(handleCommonErrors)
}

function remoteCommandExecute({ params }){
	const { REMOTE_USER, REMOTE_ADDRESS, PORT, KEY_PATH, COMMANDS } = params

	return new Promise((resolve,reject) => {
		sshExec(COMMANDS, {
			user: REMOTE_USER,
			host: REMOTE_ADDRESS,
			port: PORT,
			key: KEY_PATH
		}, (err, stdout, stderr) => {
			if(err){
				return reject({err, stderr});
			}
			else return resolve(stdout);
		})
	})
}

async function executeInteractiveWindowsCommand({ params }){

	const { command, workingDirectory } = params

	if (!command) throw ERROR_MESSAGES.COMMAND_NOT_SPECIFIED

	const sessionId = await _getWindowsSessionId()
	const paexecPath = path.join(__dirname, "utils/paexec.exe")
	const args = [
		paexecPath,
		"-s",
		"-i",
		sessionId,
	]

	if (workingDirectory){
		args.push("-w", workingDirectory)
	}

	args.push("cmd /c", command);

	return _executeSingleCommand(args.join(' '))
}

function executeMultiple({ params }){
	const { numberOfTime, COMMANDS } = params
	// create an empty array of given size and fill it with the command to repeat
	const commands = new Array(+numberOfTime).fill(COMMANDS)
	return _executeMultipleCommands(commands);
}

function _executeSingleCommand(command, options){
	const proc = childProcess.exec(command, options || {})

	return handleChildProcess(proc).catch(handleCommonErrors)
}

function _executeMultipleCommands(commands){
	return promiseQueue(
		commands.map(command => () => _executeSingleCommand(command))
	)
}

async function _getWindowsSessionId(){
	const res = await _executeSingleCommand('tasklist /fi "imagename eq explorer.exe" /FO CSV')
	const lines = res.split("\n");
	const columns = lines[0].split(',');
	const sessionColumn = columns.findIndex(col => col == '"Session#"');

	if(sessionColumn == -1)	throw ERROR_MESSAGES.SESSION_NOT_FOUND;

	const sessionString = lines[1].split(",")[sessionColumn];
	const sessionNumber = parseInt(sessionString.slice(1,-1));
	if (sessionNumxber == NaN) throw ERROR_MESSAGES.SESSION_NOT_FOUND;

	return sessionNumber;
}

async function executeScript({ params }) {
  const { path } = params
  // check if script exists
  if (!await pathExists(path)) throw ERROR_MESSAGES.PATH_DOES_NOT_EXIST
  // check if path is a file
  if (!await isFile(path)) throw ERROR_MESSAGES.PATH_IS_NOT_FILE
  // create child process
  const proc = childProcess.execFile(path)
  // handle stderr & stdout output from child process
  return handleChildProcess(proc).catch(handleCommonErrors)
}

module.exports = {
	execute,
	remoteCommandExecute,
	executeMultiple,
	executeInteractiveWindowsCommand,
  executeScript
}