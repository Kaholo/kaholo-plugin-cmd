function sanitizeCommand(command){
	let output = command.split('\n').map(item => item.trim()).join(' ; ')
	return output;
}

module.exports = {
    sanitizeCommand
}