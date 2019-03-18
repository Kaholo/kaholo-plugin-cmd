const child_process = require("child_process")
const exec = require('ssh-exec');

function executeCMD(action){
	let execString = action.params.COMMANDS;
	return _executeSingleCommand(execString);
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
			key:action.params.KEY_PATH,
		  }, (err, stdout, stderr) => {
			  if(err){
				  return reject(err)
			  }
			  else return resolve(stdout)
		  })
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

function _executeSingleCommand(command){
	return new Promise((resolve,reject) => {
		child_process.exec(command, (error, stdout, stderr) => {
			if (error) {
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


module.exports = {
	execute:executeCMD,
	executeCommands:executeMultipleCmd,
	remoteCommandExecute:remoteCommandExecute,
	executeMultiple:executeMultiple
}

