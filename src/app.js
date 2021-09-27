const child_process = require("child_process");
const path = require('path');
const exec = require('ssh-exec');

function executeCMD(action){
	const command = action.params.COMMANDS;
	const shell = action.params.shell || "default";
	const execOptions = {
		cwd : action.params.workingDir || null
	}
	if (shell !== "default") execOptions.shell = shell;
	const exitOnClose = (action.params.exitOnClose === true || action.params.exitOnClose === 'true')
	
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
			if (exitOnClose){
				return resolver(code,signal);
			}
		})

		proc.on('exit',(code, signal)=>{
			if (!exitOnClose){
				return resolver(code,signal);
			}
		})

		proc.on('error',(err)=>{
			reject({err, stdout, stderr});
		})

	})
}

function executeMultipleCmd(action){
	let commands = _handleParams(action.params.COMMANDS);
	var commandArray = typeof commands == 'object' ? commands : commands.split('\n');
	return _executeMultipleCommands(commandArray);
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
		if (sessionNumber == NaN) throw "Could not find session"

		return sessionNumber;
	})
}

module.exports = {
	execute:executeCMD,
	executeCommands:executeMultipleCmd,
	remoteCommandExecute:remoteCommandExecute,
	executeMultiple:executeMultiple,
	executeInteractiveWindowsCommand: executeInteractiveWindowsCommand
}