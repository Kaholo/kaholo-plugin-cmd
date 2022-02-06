const child_process = require("child_process");
const path = require('path');
const exec = require('ssh-exec');
const { joinCommand, pathExists, isFile, handleChildProcess, handleCommonErrors } = require("./helpers")

function executeCMD(action){
	const command = joinCommand(action.params.COMMANDS);
	const shell = action.params.shell || "default";
	const execOptions = {
		cwd : action.params.workingDir || null
	}
	if (shell !== "default") execOptions.shell = shell;
	const finishSignal = action.params.finishSignal || "exit";
	
	return new Promise((resolve,reject) => {
		let stdout='', stderr='';
		const resolver = (code, signal)=>{
			if(code === 0)
				return resolve(stdout);
			reject({code, signal, stdout, stderr});
		};
		
		const proc = child_process.exec(command, execOptions);
		proc.stdout.on('data',(chunk)=>{
			stdout+= chunk;
		})

		proc.stderr.on('data',(chunk)=>{
			stderr+= chunk;
		})
		
		proc.on('close',(code, signal)=>{
			if (finishSignal === 'close'){
				return resolver(code,signal);
			}
		})

		proc.on('exit',(code, signal)=>{
			if (finishSignal === 'exit'){
				return resolver(code,signal);
			}
		})

		proc.on('error',(err)=>{
			reject({err, stdout, stderr});
		})

	})
}

function remoteCommandExecute(action){
	return new Promise((resolve,reject) => {
		exec(action.params.COMMANDS, {
			user: action.params.REMOTE_USER,
			host: action.params.REMOTE_ADDRESS,
			port: action.params.port,
			key:action.params.KEY_PATH,
		  }, (err, stdout, stderr) => {
			  if(err){
				  return reject({err, stderr});
			  }
			  else return resolve(stdout);
		  })
	})
}

function executeInteractiveWindowsCommand(action){
	if(!action.params.command) 
		return Promise.reject("Command not specified");

	return _getWindowsSessionId().then(sessionId=>{
		const paexecPath = path.join(__dirname, "utils/paexec.exe")
		const args = [
			paexecPath,
			"-s",
			"-i",
			sessionId,
		]

		if(action.params.workingDirectory){
			args.push("-w", action.params.workingDirectory)
		}

		args.push("cmd /c", action.params.command);

		return _executeSingleCommand(args.join(' '))
	})
}

function executeMultiple(action){
	let commands = [];
	for(let i =0,length = parseInt(action.params.numberOfTime,10);i<length;i++){
		commands.push(action.params.COMMANDS)
	}
	return _executeMultipleCommands(commands);
}

function _handleParams(param){
	if (typeof param == 'string')
		return JSON.parse(JSON.stringify(param));
	else 
		return param;
}

function _executeSingleCommand(command, options){
	return new Promise((resolve,reject) => {
		child_process.exec(command, options || {} ,(error, stdout, stderr) => {
			if (error) {
				console.log(`${stdout}`)
			   return reject(`exec error: ${error}`);
			}
			if (stderr) {
				console.log(`stderr: ${stderr}`);
			}
			return resolve(stdout);
		});
	})
}

function _executeMultipleCommands(commands){
	return commands.reduce((promiseChain, next) => {
		return promiseChain.then((chainResult) =>{
			return _executeSingleCommand(next).then((result) => {
				return [...chainResult,result];
			})
		})
	}, Promise.resolve([]));
}

function _getWindowsSessionId(){
    return _executeSingleCommand('tasklist /fi "imagename eq explorer.exe" /FO CSV').then(res=>{
		const lines = res.split("\n");
		const columns = lines[0].split(',');
		const sessionColumn = columns.findIndex(col=>col=='"Session#"');

		if(sessionColumn == -1)	throw "Could not find session";

		const sessionString = lines[1].split(",")[sessionColumn];
		const sessionNumber = parseInt(sessionString.slice(1,-1));
		if (sessionNumxber == NaN) throw "Could not find session"

		return sessionNumber;
	})
}

async function executeScript({ params }) {
  const { path } = params
  // check if script exists
  if (!await pathExists(path)) throw ERROR_MESSAGES.PATH_DOES_NOT_EXIST
  // check if path is a file
  if (!await isFile(path)) throw ERROR_MESSAGES.PATH_IS_NOT_FILE
  // create child process
  const proc = child_process.execFile(path)
  // handle stderr & stdout output from child process
  return await handleChildProcess(proc).catch(handleCommonErrors)
}

module.exports = {
	execute:executeCMD,
	remoteCommandExecute:remoteCommandExecute,
	executeMultiple:executeMultiple,
	executeInteractiveWindowsCommand: executeInteractiveWindowsCommand,
  executeScript
}