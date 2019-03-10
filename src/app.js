var exec = require('child_process').exec;
var q = require('q');


String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function executeCMD(action){
	var deferred = q.defer();
	var execString = action.method.actionString;
	isArray = Array.isArray(action.params[execString]);

	for (var i =0; i< action.method.params.length;i++){
		var param = action.method.params[i].name;
		if (action.params.hasOwnProperty(param)) {
			execString = execString.replace(param, action.params[param]);
		}
		else{
			execString = execString.replace(param, '');
		}
	}
	execString = execString.replaceAll('\n', ' && ');

	if(isArray){
		execString = execString.replaceAll(',', ' && ');
	}

	exec(execString,
		 function(error, stdout, stderr){
			if(error){
				return deferred.reject(stderr);
			}
			return deferred.resolve(stdout);
		 }
	);
	return deferred.promise;
}

function executeMultiple(action) {
	var deffered = q.defer();
	var command = action.params.command;
	var paramsList = JSON.parse(action.params.paramsList.value);
	async.map(paramsList, function(params, callback) {
		var execString = command + " ";
		for (var i = 0; i < params.length; i++) {
			execString += params[i] + " ";
		}
		exec(execString,
			 function(error, stdout, stderr){
				if(error){
					return callback(null, stderr);
				}
				return callback(null, stdout);
			 }
		);
	}, function(err, results){
		if(err){
			return deffered.resolve(err);
		}
		var res = "Results:\n";
		for (var i = 0; i < results.length; i++) {
			var cres = results[i];
			res += i + ":";
			if(cres.error){
				res += cres.error;
			}
			else{
				res += cres.res;
			}
		}

		return deffered.resolve({"res": res});
	});
	return deffered.promise;
}

module.exports = {
    execute: executeCMD,
	executeFile: executeCMD,
	remoteCommandExecute: executeCMD,
	executeMultiple: executeMultiple,
	executeMultipleCommands : executeCMD
};